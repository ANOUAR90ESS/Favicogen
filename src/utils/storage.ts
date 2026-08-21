import { LogoConfig } from '../types';
import { DEFAULT_LOGO_CONFIG } from './templates';

const STORAGE_KEY_CURRENT = 'logo_studio_current_project';
const STORAGE_KEY_PROJECTS = 'logo_studio_saved_projects';

export interface SavedProjectItem {
  id: string;
  name: string;
  updatedAt: number;
  config: LogoConfig;
  thumbnailSvg?: string;
}

export function loadCurrentProject(): LogoConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_LOGO_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load current project from localStorage:', e);
  }
  return { ...DEFAULT_LOGO_CONFIG, id: 'proj_' + Date.now() };
}

export function saveCurrentProject(config: LogoConfig) {
  try {
    const updated = { ...config, updatedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to auto-save project:', e);
  }
}

export function getSavedProjects(): SavedProjectItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load saved projects:', e);
  }
  return [];
}

export function saveProjectToList(config: LogoConfig, thumbnailSvg?: string): SavedProjectItem[] {
  try {
    const list = getSavedProjects();
    const existingIndex = list.findIndex((item) => item.id === config.id);
    const item: SavedProjectItem = {
      id: config.id || 'proj_' + Date.now(),
      name: config.text || config.name || 'مشروع بدون عنوان',
      updatedAt: Date.now(),
      config: { ...config },
      thumbnailSvg,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = item;
    } else {
      list.unshift(item);
    }

    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(list));
    return list;
  } catch (e) {
    console.error('Failed to save project to list:', e);
    return getSavedProjects();
  }
}

export function deleteSavedProject(id: string): SavedProjectItem[] {
  try {
    const list = getSavedProjects().filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(list));
    return list;
  } catch (e) {
    console.error('Failed to delete saved project:', e);
    return getSavedProjects();
  }
}

export function exportProjectAsJson(config: LogoConfig) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `${(config.text || config.name || 'logo-design').replace(/\s+/g, '_')}_project.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
