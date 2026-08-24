/**
 * One gate for every image the user brings into the app.
 *
 * Eight of the nine upload inputs previously accepted a file of any size and
 * any type the OS picker allowed, read it straight to a base64 data URL, and
 * put it in the project. A phone photo lands around 8MB, which becomes ~11MB
 * of base64 — enough to blow past a storage quota on its own and enough to
 * make every later export noticeably slower.
 *
 * This module refuses what it should refuse and shrinks what is merely large,
 * so the rest of the app can assume a sane image.
 */

/** Refused outright above this size — beyond it the file is not a logo. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/** Downscaled to fit this box. 2048 is well past what a 512px canvas needs. */
export const MAX_IMAGE_DIMENSION = 2048;

/** Formats the canvas can decode and re-encode safely. */
export const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
] as const;

export const ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_TYPES.join(',');

export type IntakeRejection = 'too-large' | 'wrong-type' | 'unreadable';

export interface IntakeSuccess {
  ok: true;
  dataUrl: string;
  width: number;
  height: number;
  /** True when the source was downscaled to fit MAX_IMAGE_DIMENSION. */
  downscaled: boolean;
}

export interface IntakeFailure {
  ok: false;
  reason: IntakeRejection;
}

export type IntakeResult = IntakeSuccess | IntakeFailure;

/**
 * Narrowing helper. The project does not yet run with `strictNullChecks`,
 * which weakens narrowing on a boolean discriminant, so callers use this
 * rather than a bare `!result.ok`.
 */
export function isIntakeFailure(result: IntakeResult): result is IntakeFailure {
  return !result.ok;
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Unexpected reader result'));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode the image'));
    img.src = src;
  });
}

/**
 * Re-encodes an image to fit within MAX_IMAGE_DIMENSION, preserving aspect
 * ratio. PNG is used as the output so transparency survives.
 */
async function downscale(
  img: HTMLImageElement,
  maxDimension: number
): Promise<{ dataUrl: string; width: number; height: number }> {
  const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  return { dataUrl: canvas.toDataURL('image/png'), width, height };
}

/**
 * Validates a picked file and returns a data URL the app can store.
 *
 * SVG uploads are passed through untouched — they are vector, so there is
 * nothing to downscale, and their markup is sanitized separately by the
 * caller that renders it.
 */
export async function intakeImageFile(
  file: File,
  options: { maxDimension?: number } = {}
): Promise<IntakeResult> {
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, reason: 'too-large' };
  }

  if (file.type && !(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, reason: 'wrong-type' };
  }

  try {
    const dataUrl = await readAsDataUrl(file);

    if (file.type === 'image/svg+xml') {
      return { ok: true, dataUrl, width: 0, height: 0, downscaled: false };
    }

    const img = await loadImage(dataUrl);
    const limit = options.maxDimension ?? MAX_IMAGE_DIMENSION;

    if (Math.max(img.naturalWidth, img.naturalHeight) <= limit) {
      return {
        ok: true,
        dataUrl,
        width: img.naturalWidth,
        height: img.naturalHeight,
        downscaled: false,
      };
    }

    const scaled = await downscale(img, limit);
    return { ok: true, ...scaled, downscaled: true };
  } catch (err) {
    console.error('Image intake failed:', err);
    return { ok: false, reason: 'unreadable' };
  }
}

/** Human-readable size for error copy, e.g. "25 MB". */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}
