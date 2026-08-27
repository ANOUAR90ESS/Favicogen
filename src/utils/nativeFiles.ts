import { blobToBase64, safeFileName } from './nativePlatform';

/**
 * Handing a file to someone on a phone.
 *
 * A WebView ignores `<a download>`. It does not throw, it does not warn — the
 * click simply does nothing, so every export in the app would look like it
 * worked and produce no file. On native the sequence is: write the bytes into
 * the app's cache directory, then open the system share sheet on that file,
 * which is where "Save to Files", "Downloads" and every other destination
 * lives on both platforms.
 *
 * Cache, not Documents: the user is choosing where the file goes, so the copy
 * we write is a staging post the OS is free to reclaim. Writing to Documents
 * instead would leave a second copy the user never asked for and cannot see.
 */

/** The subset of each plugin this module uses, so the shapes are checked. */
interface FilesystemPlugin {
  writeFile(options: {
    path: string;
    data: string;
    directory: string;
    recursive?: boolean;
  }): Promise<{ uri: string }>;
  getUri(options: { path: string; directory: string }): Promise<{ uri: string }>;
}

interface SharePlugin {
  share(options: {
    title?: string;
    text?: string;
    files?: string[];
    dialogTitle?: string;
  }): Promise<unknown>;
  canShare?(): Promise<{ value: boolean }>;
}

/** Where the staged file is written. Capacitor's `Directory.Cache`. */
const CACHE_DIRECTORY = 'CACHE';

/**
 * Files are staged under a folder of our own so a cache sweep, or a user
 * clearing app storage, takes the whole set and nothing else.
 */
const STAGING_FOLDER = 'exports';

let filesystemPromise: Promise<FilesystemPlugin> | null = null;
let sharePromise: Promise<SharePlugin> | null = null;

/**
 * Loaded on first use and cached. A browser visitor never reaches this, so
 * the plugin code never enters their bundle's critical path.
 */
async function filesystem(): Promise<FilesystemPlugin> {
  filesystemPromise ??= import('@capacitor/filesystem').then(
    (m) => m.Filesystem as unknown as FilesystemPlugin
  );
  return filesystemPromise;
}

async function sharePlugin(): Promise<SharePlugin> {
  sharePromise ??= import('@capacitor/share').then((m) => m.Share as unknown as SharePlugin);
  return sharePromise;
}

export interface NativeSaveResult {
  /** Where the staged copy landed, for a message that names it. */
  uri: string;
  /** False when the file was written but the share sheet could not open. */
  shared: boolean;
}

/**
 * Writes a blob to the staging folder and offers it to the user.
 *
 * Throws if the write fails — a caller that swallowed this would leave the
 * same silent no-op the WebView already gives us. A share sheet that will not
 * open is different: the bytes exist, so the file is reported as saved and
 * `shared` says what happened.
 */
export async function saveBlobNatively(blob: Blob, filename: string): Promise<NativeSaveResult> {
  const name = safeFileName(filename);
  const path = `${STAGING_FOLDER}/${name}`;
  const data = await blobToBase64(blob);

  const fs = await filesystem();
  const written = await fs.writeFile({
    path,
    data,
    directory: CACHE_DIRECTORY,
    recursive: true,
  });

  // `writeFile` returns the uri on both platforms, but a plugin version that
  // does not is a silent failure at the share step, so ask for it explicitly.
  const uri = written.uri || (await fs.getUri({ path, directory: CACHE_DIRECTORY })).uri;

  try {
    const share = await sharePlugin();
    await share.share({ title: name, files: [uri], dialogTitle: name });
    return { uri, shared: true };
  } catch (error) {
    // A cancelled share sheet rejects exactly like a broken one. Either way
    // the file is on disk and the caller should say so rather than claim the
    // export failed.
    console.info('Share sheet did not complete for', name, error);
    return { uri, shared: false };
  }
}
