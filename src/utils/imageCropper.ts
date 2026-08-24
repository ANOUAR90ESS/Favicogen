import { loadImageElement } from './imageResizer';

/**
 * Ceiling on how many pixels the trim detector will examine. Roughly a
 * 900×900 image — plenty to locate an empty margin, and small enough that the
 * scan stays imperceptible even on a phone.
 */
const MAX_SCAN_PIXELS = 800_000;

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TrimOptions {
  mode?: 'white' | 'transparent' | 'corner-color' | 'auto';
  tolerance?: number; // 0 to 100 (percentage)
  padding?: number; // extra padding in pixels around detected subject
}

export interface TrimResult {
  x: number;
  y: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  foundSubject: boolean;
  trimSavedPixels: number;
}

/**
 * Scans image pixels to find the bounding box of non-background content (trims white / transparent / corner borders)
 */
export function detectTrimBounds(
  canvasOrImg: HTMLCanvasElement | HTMLImageElement,
  options: TrimOptions = {}
): TrimResult {
  const mode = options.mode || 'auto';
  const tolerancePct = Math.max(0, Math.min(100, options.tolerance ?? 15));
  const tolerance = (tolerancePct / 100) * 255;
  const padding = Math.max(0, options.padding ?? 0);

  const sourceWidth =
    canvasOrImg instanceof HTMLCanvasElement
      ? canvasOrImg.width
      : canvasOrImg.naturalWidth || canvasOrImg.width;
  const sourceHeight =
    canvasOrImg instanceof HTMLCanvasElement
      ? canvasOrImg.height
      : canvasOrImg.naturalHeight || canvasOrImg.height;

  if (sourceWidth === 0 || sourceHeight === 0) {
    return {
      x: 0,
      y: 0,
      width: sourceWidth,
      height: sourceHeight,
      originalWidth: sourceWidth,
      originalHeight: sourceHeight,
      foundSubject: false,
      trimSavedPixels: 0,
    };
  }

  // A full-resolution scan is O(W×H) on the main thread: a 4000×3000 photo is
  // 12 million iterations and freezes the UI for seconds, and this runs
  // automatically on every import. Scanning a bounded copy costs at most
  // MAX_SCAN_PIXELS regardless of the source, and the bounds it finds are
  // scaled back up and rounded outward so the crop never eats into the subject.
  const scanScale = Math.min(
    1,
    Math.sqrt(MAX_SCAN_PIXELS / (sourceWidth * sourceHeight))
  );
  const width = Math.max(1, Math.round(sourceWidth * scanScale));
  const height = Math.max(1, Math.round(sourceHeight * scanScale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    return {
      x: 0,
      y: 0,
      width: sourceWidth,
      height: sourceHeight,
      originalWidth: sourceWidth,
      originalHeight: sourceHeight,
      foundSubject: false,
      trimSavedPixels: 0,
    };
  }

  ctx.drawImage(canvasOrImg, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Sample corner color for auto or corner-color modes
  let sampleBgR = 255;
  let sampleBgG = 255;
  let sampleBgB = 255;
  let sampleBgA = 255;

  if (mode === 'corner-color' || mode === 'auto') {
    // Average the 4 corner pixels
    const cornerIndices = [
      0, // top-left
      (width - 1) * 4, // top-right
      ((height - 1) * width) * 4, // bottom-left
      ((height - 1) * width + (width - 1)) * 4, // bottom-right
    ];

    let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
    for (const idx of cornerIndices) {
      rSum += data[idx];
      gSum += data[idx + 1];
      bSum += data[idx + 2];
      aSum += data[idx + 3];
    }
    sampleBgR = Math.round(rSum / 4);
    sampleBgG = Math.round(gSum / 4);
    sampleBgB = Math.round(bSum / 4);
    sampleBgA = Math.round(aSum / 4);
  }

  const isBackgroundPixel = (r: number, g: number, b: number, a: number): boolean => {
    // 1. If alpha is 0 or very low, it is transparent background
    if (a <= 15) return true;

    if (mode === 'transparent') {
      return a <= tolerance;
    }

    if (mode === 'white') {
      // Near white check: all channels close to 255
      const isWhite = r >= 255 - tolerance && g >= 255 - tolerance && b >= 255 - tolerance;
      return isWhite || a <= 15;
    }

    if (mode === 'corner-color') {
      const dist = Math.hypot(r - sampleBgR, g - sampleBgG, b - sampleBgB, a - sampleBgA);
      return dist <= tolerance * 1.5;
    }

    // mode === 'auto': Detect white, near-white, light gray margin, or solid corner color
    if (r >= 255 - tolerance && g >= 255 - tolerance && b >= 255 - tolerance) {
      return true;
    }
    const distFromCorner = Math.hypot(r - sampleBgR, g - sampleBgG, b - sampleBgB, a - sampleBgA);
    if (distFromCorner <= tolerance * 1.5) {
      return true;
    }
    return false;
  };

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      if (!isBackgroundPixel(r, g, b, a)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // If no non-background pixels were found
  if (maxX < minX || maxY < minY) {
    return {
      x: 0,
      y: 0,
      width: sourceWidth,
      height: sourceHeight,
      originalWidth: sourceWidth,
      originalHeight: sourceHeight,
      foundSubject: false,
      trimSavedPixels: 0,
    };
  }

  // Back to source coordinates. One scan pixel covers 1/scanScale source
  // pixels, so the bounds are rounded outward by that much before padding is
  // applied — trimming slightly less is harmless, clipping the subject is not.
  const inverse = 1 / scanScale;
  const slack = Math.ceil(inverse);

  const sourceMinX = Math.floor(minX * inverse) - slack;
  const sourceMinY = Math.floor(minY * inverse) - slack;
  const sourceMaxX = Math.ceil((maxX + 1) * inverse) - 1 + slack;
  const sourceMaxY = Math.ceil((maxY + 1) * inverse) - 1 + slack;

  const clampedMinX = Math.max(0, sourceMinX - padding);
  const clampedMinY = Math.max(0, sourceMinY - padding);
  const clampedMaxX = Math.min(sourceWidth - 1, sourceMaxX + padding);
  const clampedMaxY = Math.min(sourceHeight - 1, sourceMaxY + padding);

  const finalWidth = clampedMaxX - clampedMinX + 1;
  const finalHeight = clampedMaxY - clampedMinY + 1;
  const totalPixels = sourceWidth * sourceHeight;
  const croppedPixels = finalWidth * finalHeight;

  return {
    x: clampedMinX,
    y: clampedMinY,
    width: finalWidth,
    height: finalHeight,
    originalWidth: sourceWidth,
    originalHeight: sourceHeight,
    foundSubject: true,
    trimSavedPixels: Math.max(0, totalPixels - croppedPixels),
  };
}

export type CropMaskShape = 'rect' | 'rounded' | 'squircle' | 'circle';

export interface CropOptions {
  shape?: CropMaskShape;
  cornerRadius?: number; // in pixels or percentage calculated against target size
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  backgroundColor?: string; // fallback for non-transparent formats like jpeg
}

/**
 * Crops a specific rectangle from an image and optionally applies corner radius / circular / squircle mask
 */
export async function cropImageToBlob(
  imgOrSrc: HTMLImageElement | string,
  cropRect: CropRect,
  formatOrOptions: 'png' | 'jpeg' | 'webp' | CropOptions = 'png',
  qualityParam = 0.95
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  const img = typeof imgOrSrc === 'string' ? await loadImageElement(imgOrSrc) : imgOrSrc;

  const targetWidth = Math.max(1, Math.round(cropRect.width));
  const targetHeight = Math.max(1, Math.round(cropRect.height));

  const options: CropOptions =
    typeof formatOrOptions === 'string'
      ? { format: formatOrOptions, quality: qualityParam, shape: 'rect', cornerRadius: 0 }
      : { shape: 'rect', cornerRadius: 0, format: 'png', quality: 0.95, ...formatOrOptions };

  const format = options.format || 'png';
  const quality = options.quality ?? 0.95;
  const shape = options.shape || 'rect';
  const cornerRadius = options.cornerRadius ?? 0;

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Handle mask clipping if rounded, circle, or squircle
  if (shape !== 'rect' || cornerRadius > 0) {
    ctx.save();
    ctx.beginPath();

    if (shape === 'circle') {
      const radiusX = targetWidth / 2;
      const radiusY = targetHeight / 2;
      ctx.ellipse(radiusX, radiusY, radiusX, radiusY, 0, 0, Math.PI * 2);
    } else if (shape === 'squircle') {
      // Superellipse / Squircle approximation
      const r = Math.min(targetWidth, targetHeight) * 0.22;
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(0, 0, targetWidth, targetHeight, r);
      } else {
        const radius = Math.min(r, targetWidth / 2, targetHeight / 2);
        ctx.moveTo(radius, 0);
        ctx.lineTo(targetWidth - radius, 0);
        ctx.quadraticCurveTo(targetWidth, 0, targetWidth, radius);
        ctx.lineTo(targetWidth, targetHeight - radius);
        ctx.quadraticCurveTo(targetWidth, targetHeight, targetWidth - radius, targetHeight);
        ctx.lineTo(radius, targetHeight);
        ctx.quadraticCurveTo(0, targetHeight, 0, targetHeight - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
      }
    } else if (shape === 'rounded' || cornerRadius > 0) {
      const radius = Math.min(cornerRadius, targetWidth / 2, targetHeight / 2);
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(0, 0, targetWidth, targetHeight, radius);
      } else {
        ctx.moveTo(radius, 0);
        ctx.lineTo(targetWidth - radius, 0);
        ctx.arcTo(targetWidth, 0, targetWidth, radius, radius);
        ctx.lineTo(targetWidth, targetHeight - radius);
        ctx.arcTo(targetWidth, targetHeight, targetWidth - radius, targetHeight, radius);
        ctx.lineTo(radius, targetHeight);
        ctx.arcTo(0, targetHeight, 0, targetHeight - radius, radius);
        ctx.lineTo(0, radius);
        ctx.arcTo(0, 0, radius, 0, radius);
        ctx.closePath();
      }
    }
    ctx.clip();
  }

  // Draw the cropped slice
  ctx.drawImage(
    img,
    cropRect.x,
    cropRect.y,
    cropRect.width,
    cropRect.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  if (shape !== 'rect' || cornerRadius > 0) {
    ctx.restore();
  }

  const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
  const dataUrl = canvas.toDataURL(mimeType, quality);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to create blob from crop canvas'));
      },
      mimeType,
      quality
    );
  });

  return {
    blob,
    dataUrl,
    width: targetWidth,
    height: targetHeight,
  };
}

/**
 * One-click helper that detects white/transparent boundaries and returns cropped image
 */
export async function autoTrimImage(
  imgOrSrc: HTMLImageElement | string,
  options: TrimOptions = {}
): Promise<{
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  trimResult: TrimResult;
}> {
  const img = typeof imgOrSrc === 'string' ? await loadImageElement(imgOrSrc) : imgOrSrc;
  const trimResult = detectTrimBounds(img, options);

  if (!trimResult.foundSubject) {
    // Return original image as blob/dataUrl
    const crop = await cropImageToBlob(img, {
      x: 0,
      y: 0,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
    });
    return { ...crop, trimResult };
  }

  const crop = await cropImageToBlob(img, {
    x: trimResult.x,
    y: trimResult.y,
    width: trimResult.width,
    height: trimResult.height,
  });

  return { ...crop, trimResult };
}
