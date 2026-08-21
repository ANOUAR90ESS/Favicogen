import JSZip from 'jszip';
import { UniversalResizeOptions, ResizePreset } from '../types';
import { createIcoFile, getShapePathD } from './canvasRenderer';

/**
 * Loads an image from a URL or base64 DataURI safely
 */
export async function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image element'));
    img.src = src;
  });
}

/**
 * Calculates physical unit conversions to pixels based on DPI
 */
export function convertUnitsToPixels(
  value: number,
  unit: 'px' | 'cm' | 'mm' | 'in',
  dpi = 300
): number {
  if (unit === 'px') return Math.round(value);
  if (unit === 'in') return Math.round(value * dpi);
  if (unit === 'cm') return Math.round((value / 2.54) * dpi);
  if (unit === 'mm') return Math.round((value / 25.4) * dpi);
  return Math.round(value);
}

/**
 * Resizes any image to exact Width x Height with custom styling, fitting, and filters
 */
export async function renderResizedImageToBlob(
  imgOrSrc: HTMLImageElement | string,
  options: UniversalResizeOptions
): Promise<{ blob: Blob; width: number; height: number; sizeBytes: number; dataUrl: string }> {
  const img = typeof imgOrSrc === 'string' ? await loadImageElement(imgOrSrc) : imgOrSrc;

  // Compute target width and height in pixels
  const targetWidth = Math.max(1, convertUnitsToPixels(options.width, options.unit, options.dpi));
  const targetHeight = Math.max(1, convertUnitsToPixels(options.height, options.unit, options.dpi));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Canvas 2D context is not supported in this environment');
  }

  // Smooth rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Draw Background
  if (options.backgroundStyle === 'solid') {
    ctx.fillStyle = options.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (options.backgroundStyle === 'gradient') {
    const grad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
    grad.addColorStop(0, options.backgroundColor || '#4f46e5');
    grad.addColorStop(1, options.backgroundColor2 || '#06b6d4');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (options.backgroundStyle === 'blur-fill') {
    // Draw enlarged, blurred version of the source image as background
    ctx.save();
    ctx.filter = 'blur(30px) brightness(0.8)';
    const maxDim = Math.max(targetWidth, targetHeight);
    ctx.drawImage(img, -maxDim * 0.2, -maxDim * 0.2, targetWidth + maxDim * 0.4, targetHeight + maxDim * 0.4);
    ctx.restore();
  } else {
    // Transparent - clear
    ctx.clearRect(0, 0, targetWidth, targetHeight);
  }

  // 2. Setup Clipping Mask if requested (circle, squircle, rounded corners)
  ctx.save();
  if (options.cropShape === 'circle') {
    ctx.beginPath();
    ctx.arc(targetWidth / 2, targetHeight / 2, Math.min(targetWidth, targetHeight) / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  } else if (options.cropShape === 'rounded') {
    const r = Math.min(options.borderRadius, Math.min(targetWidth, targetHeight) / 2);
    ctx.beginPath();
    ctx.roundRect(0, 0, targetWidth, targetHeight, r);
    ctx.closePath();
    ctx.clip();
  } else if (options.cropShape === 'squircle') {
    // Approximate squircle clipping path
    const r = Math.min(targetWidth, targetHeight) * 0.22;
    ctx.beginPath();
    ctx.roundRect(0, 0, targetWidth, targetHeight, r);
    ctx.closePath();
    ctx.clip();
  }

  // 3. Apply Filter string (brightness, contrast, saturation, grayscale, blur)
  const filterParts: string[] = [];
  if (options.brightness !== 100) filterParts.push(`brightness(${options.brightness}%)`);
  if (options.contrast !== 100) filterParts.push(`contrast(${options.contrast}%)`);
  if (options.saturation !== 100) filterParts.push(`saturate(${options.saturation}%)`);
  if (options.grayscale > 0) filterParts.push(`grayscale(${options.grayscale}%)`);
  if (options.blur > 0) filterParts.push(`blur(${options.blur}px)`);

  if (filterParts.length > 0) {
    ctx.filter = filterParts.join(' ');
  }

  // 4. Calculate Source & Destination Rectangles based on fitMode
  const srcW = img.naturalWidth || img.width || targetWidth;
  const srcH = img.naturalHeight || img.height || targetHeight;

  let dx = 0;
  let dy = 0;
  let dw = targetWidth;
  let dh = targetHeight;

  if (options.fitMode === 'contain' || options.fitMode === 'pad') {
    const scale = Math.min(targetWidth / srcW, targetHeight / srcH);
    dw = srcW * scale;
    dh = srcH * scale;
    dx = (targetWidth - dw) / 2;
    dy = (targetHeight - dh) / 2;
  } else if (options.fitMode === 'cover') {
    const scale = Math.max(targetWidth / srcW, targetHeight / srcH);
    dw = srcW * scale;
    dh = srcH * scale;
    dx = (targetWidth - dw) / 2;
    dy = (targetHeight - dh) / 2;
  } else {
    // Stretch - fill full canvas
    dx = 0;
    dy = 0;
    dw = targetWidth;
    dh = targetHeight;
  }

  // 5. Apply Transformations (Rotation & Flip)
  ctx.save();
  ctx.translate(targetWidth / 2, targetHeight / 2);

  if (options.rotation) {
    ctx.rotate((options.rotation * Math.PI) / 180);
  }
  if (options.flipHorizontal || options.flipVertical) {
    ctx.scale(options.flipHorizontal ? -1 : 1, options.flipVertical ? -1 : 1);
  }

  // Shift back to center
  ctx.translate(-targetWidth / 2, -targetHeight / 2);

  // Draw image
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore(); // restore transform

  ctx.restore(); // restore clip & filters

  // 6. Convert to Output Format (PNG, JPEG, WEBP, ICO)
  if (options.format === 'ico') {
    // Generate true binary ICO
    const icoPngBlobs: { size: number; blob: Blob }[] = [];
    const icoSizes = [16, 32, 48, 64, 128, 256].filter((s) => s <= Math.max(targetWidth, targetHeight));
    if (icoSizes.length === 0) icoSizes.push(16, 32, 48);

    for (const sz of icoSizes) {
      const icoCanvas = document.createElement('canvas');
      icoCanvas.width = sz;
      icoCanvas.height = sz;
      const icoCtx = icoCanvas.getContext('2d');
      if (icoCtx) {
        icoCtx.drawImage(canvas, 0, 0, sz, sz);
        const b = await new Promise<Blob>((res) => icoCanvas.toBlob((blob) => res(blob!), 'image/png'));
        icoPngBlobs.push({ size: sz, blob: b });
      }
    }

    const icoBlob = await createIcoFile(icoPngBlobs);
    const dataUrl = canvas.toDataURL('image/png');
    return {
      blob: icoBlob,
      width: targetWidth,
      height: targetHeight,
      sizeBytes: icoBlob.size,
      dataUrl,
    };
  }

  let mimeType = 'image/png';
  if (options.format === 'jpeg') mimeType = 'image/jpeg';
  else if (options.format === 'webp') mimeType = 'image/webp';

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to generate image blob'));
      },
      mimeType,
      options.quality
    );
  });

  const dataUrl = canvas.toDataURL(mimeType, options.quality);

  return {
    blob,
    width: targetWidth,
    height: targetHeight,
    sizeBytes: blob.size,
    dataUrl,
  };
}

/**
 * Creates a complete ZIP package containing multiple resized sizes & formats
 */
export async function generateMultiSizeZip(
  imgOrSrc: HTMLImageElement | string,
  presetsToExport: ResizePreset[],
  baseOptions: Partial<UniversalResizeOptions> = {},
  projectName = 'resized_assets'
): Promise<Blob> {
  const zip = new JSZip();
  const loadedImg = typeof imgOrSrc === 'string' ? await loadImageElement(imgOrSrc) : imgOrSrc;

  // Folder structures inside ZIP
  const rootFolder = zip.folder(projectName) || zip;
  const gpFolder = rootFolder.folder('google_play_android');
  const iosFolder = rootFolder.folder('apple_app_store_ios');
  const webFolder = rootFolder.folder('web_favicons_pwa');
  const socialFolder = rootFolder.folder('social_media');
  const printFolder = rootFolder.folder('print_and_screens');

  for (const preset of presetsToExport) {
    const renderOpts: UniversalResizeOptions = {
      width: preset.width,
      height: preset.height,
      unit: 'px',
      dpi: 300,
      maintainAspectRatio: true,
      fitMode: baseOptions.fitMode || 'contain',
      backgroundStyle:
        preset.defaultFormat === 'jpeg' && (baseOptions.backgroundStyle === 'transparent' || !baseOptions.backgroundStyle)
          ? 'solid'
          : baseOptions.backgroundStyle || 'transparent',
      backgroundColor: baseOptions.backgroundColor || '#ffffff',
      backgroundColor2: baseOptions.backgroundColor2 || '#06b6d4',
      cropShape: baseOptions.cropShape || 'none',
      borderRadius: baseOptions.borderRadius || 0,
      format: preset.defaultFormat || 'png',
      quality: baseOptions.quality || 0.95,
      flipHorizontal: baseOptions.flipHorizontal || false,
      flipVertical: baseOptions.flipVertical || false,
      rotation: baseOptions.rotation || 0,
      brightness: baseOptions.brightness || 100,
      contrast: baseOptions.contrast || 100,
      saturation: baseOptions.saturation || 100,
      grayscale: baseOptions.grayscale || 0,
      blur: baseOptions.blur || 0,
    };

    const { blob } = await renderResizedImageToBlob(loadedImg, renderOpts);
    const ext = preset.defaultFormat === 'jpeg' ? 'jpg' : preset.defaultFormat;
    const fileName = `${preset.id}_${preset.width}x${preset.height}.${ext}`;

    // Place into corresponding category folder
    if (preset.category === 'google-play') {
      gpFolder?.file(fileName, blob);
    } else if (preset.category === 'app-store') {
      iosFolder?.file(fileName, blob);
    } else if (preset.category === 'web-favicon') {
      webFolder?.file(fileName, blob);
    } else if (preset.category === 'social-media') {
      socialFolder?.file(fileName, blob);
    } else if (preset.category === 'print-paper') {
      printFolder?.file(fileName, blob);
    } else {
      rootFolder.file(fileName, blob);
    }
  }

  // Also include a helpful Readme file in Arabic & English
  const readmeContent = `# ${projectName} - Resized Image Pack / حزمة المقاسات المصدرة

Generated with Logo & Favicon Studio.
تم التصدير بنجاح بجميع المقاسات والأبعاد القياسية:

- Google Play & Android: App Icon (512x512), Feature Graphic (1024x500), TV Banner, Screenshots
- Apple App Store & iOS: App Store Icon (1024x1024), iPhone @3x @2x, iPad Pro, macOS
- Web & Favicons: Favicon 16/32/48, Apple Touch Icon, Android Chrome 192/512, OpenGraph 1200x630
- Social Media: Instagram, YouTube, TikTok, X (Twitter), Facebook, LinkedIn, WhatsApp
- Print: High-Res 300 DPI Formats

Total exported files: ${presetsToExport.length}
Date: ${new Date().toISOString()}
`;
  rootFolder.file('README.txt', readmeContent);

  return await zip.generateAsync({ type: 'blob' });
}
