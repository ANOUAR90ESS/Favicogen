import { loadImageElement } from './imageResizer';

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

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;

  if (canvasOrImg instanceof HTMLCanvasElement) {
    canvas = canvasOrImg;
    ctx = canvas.getContext('2d', { willReadFrequently: true });
  } else {
    canvas = document.createElement('canvas');
    canvas.width = canvasOrImg.naturalWidth || canvasOrImg.width;
    canvas.height = canvasOrImg.naturalHeight || canvasOrImg.height;
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(canvasOrImg, 0, 0);
    }
  }

  const width = canvas.width;
  const height = canvas.height;

  if (!ctx || width === 0 || height === 0) {
    return {
      x: 0,
      y: 0,
      width,
      height,
      originalWidth: width,
      originalHeight: height,
      foundSubject: false,
      trimSavedPixels: 0,
    };
  }

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
      width,
      height,
      originalWidth: width,
      originalHeight: height,
      foundSubject: false,
      trimSavedPixels: 0,
    };
  }

  // Apply padding
  const clampedMinX = Math.max(0, minX - padding);
  const clampedMinY = Math.max(0, minY - padding);
  const clampedMaxX = Math.min(width - 1, maxX + padding);
  const clampedMaxY = Math.min(height - 1, maxY + padding);

  const finalWidth = clampedMaxX - clampedMinX + 1;
  const finalHeight = clampedMaxY - clampedMinY + 1;
  const totalPixels = width * height;
  const croppedPixels = finalWidth * finalHeight;

  return {
    x: clampedMinX,
    y: clampedMinY,
    width: finalWidth,
    height: finalHeight,
    originalWidth: width,
    originalHeight: height,
    foundSubject: true,
    trimSavedPixels: Math.max(0, totalPixels - croppedPixels),
  };
}

/**
 * Crops a specific rectangle from an image and returns high-resolution blob and dataUrl
 */
export async function cropImageToBlob(
  imgOrSrc: HTMLImageElement | string,
  cropRect: CropRect,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality = 0.95
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  const img = typeof imgOrSrc === 'string' ? await loadImageElement(imgOrSrc) : imgOrSrc;

  const targetWidth = Math.max(1, Math.round(cropRect.width));
  const targetHeight = Math.max(1, Math.round(cropRect.height));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

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
