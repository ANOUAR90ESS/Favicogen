import type { SupabaseClient } from '@supabase/supabase-js';
import type { LogoConfig } from '../types';
import { getSupabase } from './supabaseClient';
import { getSavedProjects, saveProjectToList, type SavedProjectItem } from './storage';
import {
  configFits,
  detachImage,
  planSync,
  type RemoteProject,
  type SyncPlan,
} from './syncPlan';

/**
 * Carrying projects between devices.
 *
 * The rule this file is built around: **the device is the original**. Every
 * project lives in IndexedDB and keeps working with no account and no network;
 * the server is a copy that lets a second device catch up. So nothing here
 * deletes local work, nothing blocks the studio, and a sync that fails leaves
 * the device exactly as it was.
 *
 * That is also why there is no delete propagation yet. "This project is gone
 * from device A" and "device B has one device A never saw" are the same shape
 * on the wire, and telling them apart needs tombstones. Guessing instead would
 * mean deleting work someone still has open, which is the one mistake this
 * feature must not make. Deleting a project locally therefore leaves the
 * server's copy alone, and the next sync brings it back — visible and
 * annoying, rather than silent and final. `docs/accounts.md` says so.
 */

export type SyncStatus =
  | 'synced'
  | 'nothing-to-do'
  /** Some projects moved, some could not. `skipped` says which and why. */
  | 'partial'
  /** No account service, or nobody signed in. Not an error. */
  | 'unavailable'
  | 'offline'
  | 'failed';

export interface SkippedProject {
  name: string;
  reason: 'too-large' | 'server-limit' | 'rejected';
}

export interface SyncResult {
  status: SyncStatus;
  uploaded: number;
  downloaded: number;
  skipped: SkippedProject[];
  /** The provider's own words, for the cases nothing here recognises. */
  detail?: string;
}

const TABLE = 'projects';
const BUCKET = 'project-images';

/** A data URL, as the bytes and type that Storage wants. */
function dataUrlToBlob(dataUrl: string): { blob: Blob; contentType: string } | null {
  const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUrl);
  if (!match) return null;

  const [, contentType, isBase64, payload] = match;

  try {
    if (isBase64) {
      const binary = atob(payload);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      return { blob: new Blob([bytes], { type: contentType }), contentType };
    }
    return { blob: new Blob([decodeURIComponent(payload)], { type: contentType }), contentType };
  } catch {
    return null;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('could not read the downloaded image'));
    reader.readAsDataURL(blob);
  });
}

/** A network that is not there, told apart from a server that said no. */
function looksOffline(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /failed to fetch|networkerror|load failed|network request failed/i.test(message);
}

async function uploadImage(
  supabase: SupabaseClient,
  path: string,
  dataUrl: string
): Promise<boolean> {
  const decoded = dataUrlToBlob(dataUrl);
  if (!decoded) return false;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, decoded.blob, { contentType: decoded.contentType, upsert: true });

  return !error;
}

async function downloadImage(supabase: SupabaseClient, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) return null;

  try {
    return await blobToDataUrl(data);
  } catch {
    return null;
  }
}

/**
 * Runs one pass.
 *
 * Sequential rather than parallel on purpose. Fifty projects arriving at once
 * is a burst a free-tier project answers with rate limiting, and the failure
 * then looks like a sync bug rather than like too many requests.
 */
export async function syncProjects(): Promise<SyncResult> {
  const empty: SyncResult = { status: 'unavailable', uploaded: 0, downloaded: 0, skipped: [] };

  const supabase = await getSupabase();
  if (!supabase) return empty;

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return empty;

  let local: SavedProjectItem[];
  let remote: RemoteProject[];

  try {
    local = await getSavedProjects();

    const { data, error } = await supabase
      .from(TABLE)
      .select('client_id, name, config, thumbnail_svg, image_path, updated_at');

    if (error) throw new Error(error.message);
    remote = (data ?? []) as RemoteProject[];
  } catch (err) {
    return {
      ...empty,
      status: looksOffline(err) ? 'offline' : 'failed',
      detail: err instanceof Error ? err.message : undefined,
    };
  }

  const plan: SyncPlan = planSync(local, remote);

  const skipped: SkippedProject[] = [];
  let uploaded = 0;
  let downloaded = 0;
  let hitNetwork = false;

  // ---- up ----------------------------------------------------------------
  for (const item of [...plan.create, ...plan.update]) {
    const { config, dataUrl } = detachImage(item.config);

    if (!configFits(config)) {
      // Refused here rather than by a constraint, so the message can name the
      // project instead of a check constraint nobody has heard of.
      skipped.push({ name: item.name || item.id, reason: 'too-large' });
      continue;
    }

    const imagePath = `${user.id}/${item.id}`;
    let storedPath: string | null = null;

    if (dataUrl) {
      // The row is written whether or not the bitmap makes it. A design that
      // arrives without its photograph is recoverable; a design that never
      // arrives is not.
      storedPath = (await uploadImage(supabase, imagePath, dataUrl)) ? imagePath : null;
      if (!storedPath) skipped.push({ name: item.name || item.id, reason: 'too-large' });
    }

    const { error } = await supabase.from(TABLE).upsert(
      {
        user_id: user.id,
        client_id: item.id,
        name: item.name || item.id,
        config,
        thumbnail_svg: item.thumbnailSvg ?? null,
        image_path: storedPath,
        updated_at: new Date(item.updatedAt).toISOString(),
      },
      { onConflict: 'user_id,client_id' }
    );

    if (error) {
      if (looksOffline(error)) {
        hitNetwork = true;
        break;
      }
      skipped.push({
        name: item.name || item.id,
        reason: /limit reached/i.test(error.message) ? 'server-limit' : 'rejected',
      });
      continue;
    }

    uploaded += 1;
  }

  // ---- down --------------------------------------------------------------
  if (!hitNetwork) {
    for (const row of plan.download) {
      const config = { ...row.config } as unknown as LogoConfig;

      if (row.image_path) {
        const dataUrl = await downloadImage(supabase, row.image_path);
        // A missing bitmap is not a reason to drop the design. The rest of it
        // is still the work someone did.
        if (dataUrl) config.uploadedImageSrc = dataUrl;
      }

      // `id` and `updatedAt` are what the next pass compares on, so they are
      // restored from the row rather than left to the local save to invent.
      config.id = row.client_id;
      config.name = row.name;

      // The edit time comes from the row, not from now. Restamping it would
      // make this copy look newer than the one it was just pulled from, and
      // the next pass would push it straight back over the original.
      const editedAt = Date.parse(row.updated_at);
      const stored = await saveProjectToList(
        config,
        row.thumbnail_svg ?? undefined,
        Number.isFinite(editedAt) ? editedAt : Date.now()
      );
      if (!stored.ok) {
        skipped.push({ name: row.name, reason: 'rejected' });
        continue;
      }

      downloaded += 1;
    }
  }

  if (hitNetwork) {
    return { status: 'offline', uploaded, downloaded, skipped };
  }

  if (skipped.length > 0) {
    return { status: 'partial', uploaded, downloaded, skipped };
  }

  return {
    status: uploaded + downloaded === 0 ? 'nothing-to-do' : 'synced',
    uploaded,
    downloaded,
    skipped,
  };
}
