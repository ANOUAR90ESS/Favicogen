import { LogoConfig } from '../types';
import { DEFAULT_LOGO_CONFIG } from './templates';
import { downloadText } from './download';
import { parseLogoConfig, parseSavedProjectItem } from './configSchema';
import { idbDelete, idbGet, idbSet, isIdbAvailable } from './idb';

const STORAGE_KEY_CURRENT = 'logo_studio_current_project';
const STORAGE_KEY_PROJECTS = 'logo_studio_saved_projects';
/** Set once the one-time move off localStorage has run. */
const MIGRATION_FLAG = 'logo_studio_migrated_to_idb';

/**
 * Saved projects are capped so the vault cannot grow without bound. Each entry
 * can carry a multi-megabyte image, and an unbounded list eventually exhausts
 * even IndexedDB's quota.
 */
export const MAX_SAVED_PROJECTS = 50;

export interface SavedProjectItem {
  id: string;
  name: string;
  updatedAt: number;
  config: LogoConfig;
  thumbnailSvg?: string;
}

/**
 * Why a write failed, so the caller can say something useful instead of
 * reporting success over a silent loss.
 */
export type StorageFailure = 'quota' | 'unavailable' | 'unknown';

export interface StorageResult {
  ok: boolean;
  failure?: StorageFailure;
}

function classifyError(error: unknown): StorageFailure {
  if (error instanceof DOMException) {
    if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      return 'quota';
    }
    if (error.name === 'InvalidStateError' || error.name === 'SecurityError') {
      return 'unavailable';
    }
  }
  return 'unknown';
}

function blankConfig(): LogoConfig {
  return { ...DEFAULT_LOGO_CONFIG, id: `proj_${Date.now()}` };
}

// ---------------------------------------------------------------------------
// One-time migration off localStorage
// ---------------------------------------------------------------------------

/**
 * Moves anything the previous localStorage-backed build left behind, then
 * clears it to free the origin's 5MB budget. Runs at most once.
 */
async function migrateFromLocalStorage(): Promise<void> {
  try {
    if (localStorage.getItem(MIGRATION_FLAG)) return;

    const rawCurrent = localStorage.getItem(STORAGE_KEY_CURRENT);
    if (rawCurrent) {
      await idbSet(STORAGE_KEY_CURRENT, parseLogoConfig(JSON.parse(rawCurrent)));
    }

    const rawProjects = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (rawProjects) {
      const parsed = JSON.parse(rawProjects);
      if (Array.isArray(parsed)) {
        const items = parsed
          .map(parseSavedProjectItem)
          .filter((item): item is SavedProjectItem => item !== null);
        await idbSet(STORAGE_KEY_PROJECTS, items);
      }
    }

    localStorage.removeItem(STORAGE_KEY_CURRENT);
    localStorage.removeItem(STORAGE_KEY_PROJECTS);
    localStorage.setItem(MIGRATION_FLAG, '1');
  } catch (err) {
    // A failed migration must not block the app; the user just starts fresh.
    console.warn('Could not migrate saved work out of localStorage:', err);
  }
}

// ---------------------------------------------------------------------------
// Current project
// ---------------------------------------------------------------------------

export async function loadCurrentProject(): Promise<LogoConfig> {
  if (!isIdbAvailable()) return blankConfig();

  try {
    await migrateFromLocalStorage();
    const stored = await idbGet<unknown>(STORAGE_KEY_CURRENT);
    if (stored) return parseLogoConfig(stored);
  } catch (err) {
    console.error('Failed to load the current project:', err);
  }

  return blankConfig();
}

export async function saveCurrentProject(config: LogoConfig): Promise<StorageResult> {
  if (!isIdbAvailable()) return { ok: false, failure: 'unavailable' };

  try {
    await idbSet(STORAGE_KEY_CURRENT, { ...config, updatedAt: Date.now() });
    return { ok: true };
  } catch (err) {
    console.error('Failed to auto-save the current project:', err);
    return { ok: false, failure: classifyError(err) };
  }
}

// ---------------------------------------------------------------------------
// Saved projects vault
// ---------------------------------------------------------------------------

export async function getSavedProjects(): Promise<SavedProjectItem[]> {
  if (!isIdbAvailable()) return [];

  try {
    await migrateFromLocalStorage();
    const stored = await idbGet<unknown>(STORAGE_KEY_PROJECTS);
    if (!Array.isArray(stored)) return [];

    return stored
      .map(parseSavedProjectItem)
      .filter((item): item is SavedProjectItem => item !== null);
  } catch (err) {
    console.error('Failed to load saved projects:', err);
    return [];
  }
}

export async function saveProjectToList(
  config: LogoConfig,
  thumbnailSvg?: string
): Promise<StorageResult & { projects: SavedProjectItem[] }> {
  const list = await getSavedProjects();

  const item: SavedProjectItem = {
    id: config.id || `proj_${Date.now()}`,
    name: config.text || config.name || '',
    updatedAt: Date.now(),
    config: { ...config },
    thumbnailSvg,
  };

  const existingIndex = list.findIndex((entry) => entry.id === item.id);
  if (existingIndex >= 0) {
    list[existingIndex] = item;
  } else {
    list.unshift(item);
  }

  // Newest first, so trimming drops the least recently touched.
  const trimmed = list.slice(0, MAX_SAVED_PROJECTS);

  try {
    await idbSet(STORAGE_KEY_PROJECTS, trimmed);
    return { ok: true, projects: trimmed };
  } catch (err) {
    console.error('Failed to save the project:', err);
    return { ok: false, failure: classifyError(err), projects: list };
  }
}

export async function deleteSavedProject(id: string): Promise<SavedProjectItem[]> {
  const remaining = (await getSavedProjects()).filter((item) => item.id !== id);

  try {
    await idbSet(STORAGE_KEY_PROJECTS, remaining);
  } catch (err) {
    console.error('Failed to delete the saved project:', err);
  }

  return remaining;
}

/** Clears everything this app stores. Used by the storage-full recovery path. */
export async function clearAllProjects(): Promise<void> {
  await idbDelete(STORAGE_KEY_CURRENT);
  await idbDelete(STORAGE_KEY_PROJECTS);
}

export function exportProjectAsJson(config: LogoConfig) {
  const filename = `${(config.text || config.name || 'logo-design').replace(/\s+/g, '_')}_project.json`;
  downloadText(JSON.stringify(config, null, 2), filename, 'application/json');
}
