import { LogoConfig } from '../types';
import { autoTrimImage, TrimOptions, TrimResult } from './imageCropper';

/**
 * Config patch that makes an uploaded raster image the logo itself:
 * edge-to-edge, with no leftover composition from the previous design.
 *
 * Without this, an upload keeps the default icon geometry (iconSize 180 of a
 * 512 canvas) plus whatever ring/text/badge the previous template left on, so
 * the picture lands small and boxed in by margins on all four sides.
 */
export function buildFullBleedImagePatch(imageSrc: string): Partial<LogoConfig> {
  return {
    iconType: 'image',
    uploadedImageSrc: imageSrc,

    // Fill the whole 512 coordinate space instead of the 180px icon slot.
    iconSize: 512,
    iconOffsetX: 0,
    iconOffsetY: 0,
    uploadedImageScale: 100,
    uploadedImageOffsetX: 0,
    uploadedImageOffsetY: 0,
    uploadedImageRotation: 0,
    uploadedImageOpacity: 1,
    uploadedImageCropShape: 'none',

    // The picture is the whole logo: drop the decorations layered over it.
    layout: 'icon-only',
    showText: false,
    showTagline: false,
    showRing: false,
    showBadgeRibbon: false,
    bgType: 'transparent',
    borderWidth: 0,
    iconShadow: false,
    iconOutline: false,
  };
}

export interface SmartImportResult {
  patch: Partial<LogoConfig>;
  trim: TrimResult | null;
  /** Percentage of the original area removed as empty margin. */
  trimmedPercent: number;
  /** The image actually applied (trimmed when trimming found a subject). */
  imageSrc: string;
}

/**
 * The whole import step in one call: strip the empty border, then set the
 * image up as a full-bleed logo ready for size generation and packaging.
 *
 * Trimming is best-effort — if it finds nothing to remove (or fails outright)
 * the original image is still applied, so an import never dead-ends.
 */
export async function smartImportImage(
  dataUrl: string,
  options: { autoTrim?: boolean; trim?: TrimOptions } = {}
): Promise<SmartImportResult> {
  const shouldTrim = options.autoTrim !== false;

  if (!shouldTrim) {
    return {
      patch: buildFullBleedImagePatch(dataUrl),
      trim: null,
      trimmedPercent: 0,
      imageSrc: dataUrl,
    };
  }

  try {
    const result = await autoTrimImage(dataUrl, {
      mode: 'auto',
      tolerance: 18,
      padding: 0,
      ...options.trim,
    });

    const { trimResult } = result;
    const originalArea = trimResult.originalWidth * trimResult.originalHeight;
    const trimmedPercent =
      originalArea > 0 ? Math.round((trimResult.trimSavedPixels / originalArea) * 100) : 0;

    const applied =
      trimResult.foundSubject && trimResult.trimSavedPixels > 0 ? result.dataUrl : dataUrl;

    return {
      patch: buildFullBleedImagePatch(applied),
      trim: trimResult,
      trimmedPercent,
      imageSrc: applied,
    };
  } catch (err) {
    console.warn('Auto-trim failed, importing the image untrimmed:', err);
    return {
      patch: buildFullBleedImagePatch(dataUrl),
      trim: null,
      trimmedPercent: 0,
      imageSrc: dataUrl,
    };
  }
}

/** Reads a picked File into a data URL. */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') resolve(result);
      else reject(new Error('Could not read the selected file'));
    };
    reader.onerror = () => reject(new Error('Could not read the selected file'));
    reader.readAsDataURL(file);
  });
}
