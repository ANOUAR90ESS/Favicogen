import type { LogoConfig } from '../types';
import type { SavedProjectItem } from './storage';

/**
 * What syncing should do, decided without touching a network.
 *
 * Everything here is a pure function over two lists, because the decisions are
 * the part that can silently lose someone's work and the network is the part
 * that cannot be tested. Keeping them apart means the rule "the newer edit
 * wins" is checked by a unit test rather than by trying it and looking.
 */

/** One project as it exists on the server. */
export interface RemoteProject {
  client_id: string;
  name: string;
  config: Record<string, unknown>;
  thumbnail_svg: string | null;
  image_path: string | null;
  /** The *device's* clock at the time of the edit, as an ISO string. */
  updated_at: string;
}

export interface SyncPlan {
  /** Local projects the server has never seen. */
  create: SavedProjectItem[];
  /** Local projects the server has an older copy of. */
  update: SavedProjectItem[];
  /** Server projects this device is missing, or has an older copy of. */
  download: RemoteProject[];
  /** Both sides identical, or close enough that neither is worth a write. */
  unchanged: number;
}

/**
 * Edits closer together than this are treated as the same moment.
 *
 * Two devices never agree on the millisecond, and a project that ping-pongs
 * between them — each upload making the other side look stale — burns quota
 * and rewrites rows for a difference nobody made. A second is far below the
 * gap between two real edits and far above the disagreement between two clocks
 * that both think they are right.
 */
const SAME_EDIT_MS = 1000;

/**
 * Which side is newer, by the clock of the device that made the edit.
 *
 * Deliberately not the server's clock. The question a conflict asks is which
 * *edit* came last, and an upload that happens days after the edit it carries —
 * a laptop opened on a plane and closed, then opened at home — would answer it
 * backwards.
 */
export function planSync(local: SavedProjectItem[], remote: RemoteProject[]): SyncPlan {
  const remoteById = new Map(remote.map((row) => [row.client_id, row]));
  const localIds = new Set(local.map((item) => item.id));

  const plan: SyncPlan = { create: [], update: [], download: [], unchanged: 0 };

  for (const item of local) {
    const match = remoteById.get(item.id);

    if (!match) {
      plan.create.push(item);
      continue;
    }

    const remoteTime = Date.parse(match.updated_at);

    // An unparseable timestamp is not a reason to overwrite someone's work in
    // either direction, and it is not a silent condition either: the local copy
    // is left alone and the row is pushed, which repairs the bad value.
    if (!Number.isFinite(remoteTime)) {
      plan.update.push(item);
      continue;
    }

    const drift = item.updatedAt - remoteTime;

    if (Math.abs(drift) <= SAME_EDIT_MS) plan.unchanged += 1;
    else if (drift > 0) plan.update.push(item);
    else plan.download.push(match);
  }

  for (const row of remote) {
    if (!localIds.has(row.client_id)) plan.download.push(row);
  }

  return plan;
}

/**
 * The bitmap, lifted out of a design before the design is sent.
 *
 * An uploaded photograph reaches the studio as a data URL and may be 25 MB of
 * it. That belongs in Storage as a file, not in a jsonb column — a row that
 * size is a denial-of-service wearing a project's clothes, and the database
 * refuses it anyway.
 *
 * Returns the config with the image removed and the data URL beside it, so the
 * caller can upload one and insert the other. A design with no bitmap, which is
 * most of them, comes back unchanged with `dataUrl` null.
 */
export function detachImage(config: LogoConfig): {
  config: Record<string, unknown>;
  dataUrl: string | null;
} {
  const source = config.uploadedImageSrc;

  if (typeof source !== 'string' || !source.startsWith('data:')) {
    return { config: { ...config }, dataUrl: null };
  }

  const rest = { ...config } as Record<string, unknown>;
  delete rest.uploadedImageSrc;
  return { config: rest, dataUrl: source };
}

/**
 * Whether a design will fit in a row.
 *
 * The database enforces this too — it has to, since the key that reaches it is
 * published — but a request refused by Postgres costs a round trip and arrives
 * as a constraint name. Checking first means the project can be named in a
 * message someone can act on.
 *
 * The ceiling is the database's own, with room for the JSON encoding the
 * driver adds around the value.
 */
export const MAX_SYNCED_CONFIG_BYTES = 480 * 1024;

export function configFits(config: Record<string, unknown>): boolean {
  try {
    return new TextEncoder().encode(JSON.stringify(config)).byteLength <= MAX_SYNCED_CONFIG_BYTES;
  } catch {
    // A design that cannot even be serialised is not one we can send.
    return false;
  }
}
