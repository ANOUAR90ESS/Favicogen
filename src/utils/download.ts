/**
 * The single way this app hands a file to the user.
 *
 * Every download used to build its own anchor element, and each copy revoked
 * its object URL differently — one of them synchronously, which cancels the
 * transfer outright in Firefox and Safari. Keeping one implementation means
 * that class of bug has one place to live.
 */

import { embedFontsInSvg } from './fontEmbedder';

/**
 * Firefox and Safari need the object URL to outlive the click that started
 * the download. Chrome does not care, so a generous delay costs nothing.
 */
const REVOKE_DELAY_MS = 60_000;

export function downloadBlob(blob: Blob, filename: string): void {
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
