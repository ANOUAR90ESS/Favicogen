/**
 * The single way this app hands a file to the user.
 *
 * Every download used to build its own anchor element, and each copy revoked
 * its object URL differently — one of them synchronously, which cancels the
 * transfer outright in Firefox and Safari. Keeping one implementation means
 * that class of bug has one place to live.
 */

import { embedFontsInSvg } from './fontEmbedder';
import { isNativePlatform } from './nativePlatform';

/**
 * Firefox and Safari need the object URL to outlive the click that started
 * the download. Chrome does not care, so a generous delay costs nothing.
 */
const REVOKE_DELAY_MS = 60_000;

/**
 * What became of a file the app tried to hand over on a device.
 *
 * `saved` is not a lesser `shared`: the bytes are on disk either way, and the
 * difference is only whether the user got to choose a destination. `failed`
 * has to be its own outcome rather than a false `saved`, or the app announces
 * a file that is not there.
 */
export type NativeSaveOutcome = 'shared' | 'saved' | 'failed';

/**
 * Notified after a native save, so the UI can say what happened.
 *
 * A browser download announces itself; a share sheet that the user dismisses
 * leaves no trace at all, and without this the app would look like it did
 * nothing. Set once, at startup, by whoever owns the toast.
 */
type NativeSaveNotice = (filename: string, outcome: NativeSaveOutcome) => void;

/**
 * How long to wait for the native bridge before telling the user it failed.
 *
 * A plugin missing from a build, or a bridge that never answers, leaves the
 * promise pending forever — and a pending promise shows the user nothing at
 * all, which is the exact silence this whole path exists to remove.
 */
const NATIVE_SAVE_TIMEOUT_MS = 20_000;

let onNativeSave: NativeSaveNotice | null = null;

export function setNativeSaveNotice(notice: NativeSaveNotice | null): void {
  onNativeSave = notice;
}

/**
 * Hands a generated file to the user, by whichever route the platform has.
 *
 * Deliberately still returns void: forty-one call sites treat a download as
 * something that happens rather than something to await, and a promise none of
 * them handles is a rejection nobody catches. The native path reports through
 * the notice above instead.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  if (isNativePlatform()) {
    // Imported here rather than at module scope: this file is on the path of
    // every export in the app, and a browser visitor should not pull in the
    // filesystem bridge to click Download.
    const save = import('./nativeFiles').then(({ saveBlobNatively }) =>
      saveBlobNatively(blob, filename)
    );

    const timeout = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error('The device did not answer the save request.')),
        NATIVE_SAVE_TIMEOUT_MS
      );
    });

    void Promise.race([save, timeout])
      .then(({ shared }) => onNativeSave?.(filename, shared ? 'shared' : 'saved'))
      .catch((error) => {
        console.error('Saving the file on this device failed:', filename, error);
        onNativeSave?.(filename, 'failed');
      });
    return;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // Revoking synchronously here aborts the download before it starts on
  // Firefox and Safari.
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}

/** Downloads a string as a text file (JSON, Markdown, HTML snippets). */
export function downloadText(text: string, filename: string, mimeType = 'text/plain'): void {
  downloadBlob(new Blob([text], { type: `${mimeType};charset=utf-8` }), filename);
}

/**
 * Downloads generated SVG markup with its web fonts inlined, so the file
 * renders with the brand's typeface anywhere it is opened — not only in a
 * browser that happens to have the same Google Fonts stylesheet loaded.
 */
export async function downloadSvg(svgMarkup: string, filename: string): Promise<void> {
  const portable = await embedFontsInSvg(svgMarkup);
  downloadBlob(new Blob([portable], { type: 'image/svg+xml;charset=utf-8' }), filename);
}
