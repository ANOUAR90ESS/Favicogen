import {
  LogoConfig,
  FaviconSpec,
  ShapeMask,
  FeatureGraphicOptions,
  SocialMediaPreset,
  SocialBannerOptions,
} from '../types';
import { ICON_LIBRARY } from './iconLibrary';
import { embedFontsInSvg } from './fontEmbedder';

export const FAVICON_SPECS: FaviconSpec[] = [
  {
    size: 16,
    fileName: 'favicon-16x16.png',
    format: 'png',
    label: '16x16 px',
    descriptionAr: 'أيقونة التبويب القياسية للمتصفحات',
    descriptionEn: 'Standard browser tab icon',
    isFaviconStandard: true,
  },
  {
    size: 32,
    fileName: 'favicon-32x32.png',
    format: 'png',
    label: '32x32 px',
    descriptionAr: 'أيقونة التبويب للشاشات عالية الدقة ريتينا',
    descriptionEn: 'Browser tab on Retina displays',
    isFaviconStandard: true,
  },
  {
    size: 48,
    fileName: 'favicon-48x48.png',
    format: 'png',
    label: '48x48 px',
    descriptionAr: 'شريط المهام وسطح المكتب',
    descriptionEn: 'Desktop and taskbar',
    isFaviconStandard: true,
  },
  {
    size: 64,
    fileName: 'favicon-64x64.png',
    format: 'png',
    label: '64x64 px',
    descriptionAr: 'أيقونة المواقع والتطبيقات المفضلة',
    descriptionEn: 'High-resolution browser favourite',
    isFaviconStandard: true,
  },
  {
    size: 128,
    fileName: 'favicon-128x128.png',
    format: 'png',
    label: '128x128 px',
    descriptionAr: 'متجر جوجل كروم وتطبيقات الويب',
    descriptionEn: 'Chrome Web Store and web apps',
  },
  {
    size: 180,
    fileName: 'apple-touch-icon.png',
    format: 'png',
    label: '180x180 px',
    descriptionAr: 'شاشة الآيفون والآيباد الرئيسية',
    descriptionEn: 'Apple iOS home screen touch icon',
    isAppleTouch: true,
  },
  {
    size: 192,
    fileName: 'android-chrome-192x192.png',
    format: 'png',
    label: '192x192 px',
    descriptionAr: 'تطبيقات الأندرويد وPWA',
    descriptionEn: 'Android Chrome and PWA',
    isAndroidChrome: true,
    isPWA: true,
  },
  {
    size: 256,
    fileName: 'android-chrome-256x256.png',
    format: 'png',
    label: '256x256 px',
    descriptionAr: 'أيقونات ويندوز والتطبيقات المتوسطة',
    descriptionEn: 'Windows tile and medium app icon',
    isAndroidChrome: true,
  },
  {
    size: 512,
    fileName: 'android-chrome-512x512.png',
    format: 'png',
    label: '512x512 px',
    descriptionAr: 'شاشة البداية للتطبيقات وPWA بدقة فائقة',
    descriptionEn: 'PWA splash screen, highest resolution',
    isAndroidChrome: true,
    isPWA: true,
  },
];

/**
 * Generates SVG Clip Path definition based on selected shape mask
 */
/**
 * Escapes text that is interpolated into generated SVG markup.
 * SVG is parsed as strict XML, so an unescaped "&" or "<" in a brand name
 * makes the whole document unparseable and every raster export fails.
 */
export function escapeXml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function getShapePathD(shape: ShapeMask, size: number, radius = 48): string {
  const s = size;
  const half = s / 2;
  
  switch (shape) {
    case 'circle':
      return `M ${half},${half} m -${half},0 a ${half},${half} 0 1,0 ${s},0 a ${half},${half} 0 1,0 -${s},0`;
    case 'squircle': {
      // Perfect iOS-style squircle (Continuous curve superellipse)
      // Scaled proportionally for any size 's'
      const c1 = s * 0.222; 
      const c2 = s * 0.15;
      const c3 = s * 0.06;
      return `
        M ${half}, 0
        C ${s - c1}, 0  ${s - c2}, 0  ${s - c3}, ${c3}
        C ${s}, ${c2}   ${s}, ${c1}   ${s}, ${half}
        C ${s}, ${s - c1} ${s}, ${s - c2} ${s - c3}, ${s - c3}
        C ${s - c2}, ${s} ${s - c1}, ${s} ${half}, ${s}
        C ${c1}, ${s}   ${c2}, ${s}   ${c3}, ${s - c3}
        C 0, ${s - c2}  0, ${s - c1}  0, ${half}
        C 0, ${c1}      0, ${c2}      ${c3}, ${c3}
        C ${c2}, 0      ${c1}, 0      ${half}, 0
        Z
      `;
    }
    case 'shield':
      return `M ${half},${s * 0.05} L ${s * 0.9},${s * 0.18} V ${s * 0.52} C ${s * 0.9},${s * 0.78} ${half},${s * 0.95} ${half},${s * 0.95} C ${half},${s * 0.95} ${s * 0.1},${s * 0.78} ${s * 0.1},${s * 0.52} V ${s * 0.18} Z`;
    case 'hexagon':
      return `M ${half},${s * 0.04} L ${s * 0.92},${s * 0.28} L ${s * 0.92},${s * 0.72} L ${half},${s * 0.96} L ${s * 0.08},${s * 0.72} L ${s * 0.08},${s * 0.28} Z`;
    case 'octagon': {
      const cut = s * 0.28;
      return `M ${cut},0 L ${s - cut},0 L ${s},${cut} L ${s},${s - cut} L ${s - cut},${s} L ${cut},${s} L 0,${s - cut} L 0,${cut} Z`;
    }
    case 'diamond':
      return `M ${half},0 L ${s},${half} L ${half},${s} L 0,${half} Z`;
    case 'badge': {
      let d = '';
      const points = 12;
      const rOuter = half * 0.98;
      const rInner = half * 0.82;
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? rOuter : rInner;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const x = half + r * Math.cos(angle);
        const y = half + r * Math.sin(angle);
        d += (i === 0 ? 'M ' : 'L ') + `${x.toFixed(2)},${y.toFixed(2)} `;
      }
      return d + 'Z';
    }
    case 'pill': {
      const pr = half * 0.6;
      return `M 0,${pr} A ${pr},${pr} 0 0,1 ${s},${pr} L ${s},${s - pr} A ${pr},${pr} 0 0,1 0,${s - pr} Z`;
    }
    case 'square':
    default:
      return radius > 0 
        ? `M 0,${radius} A ${radius},${radius} 0 0,1 ${radius},0 L ${s - radius},0 A ${radius},${radius} 0 0,1 ${s},${radius} L ${s},${s - radius} A ${radius},${radius} 0 0,1 ${s - radius},${s} L ${radius},${s} A ${radius},${radius} 0 0,1 0,${s - radius} Z`
        : `M 0,0 H ${s} V ${s} H 0 Z`;
  }
}

/**
 * Generates an SVG string representation from the LogoConfig
 */
/**
 * Every `id` inside a generated SVG is namespaced with one of these.
 *
 * The uid used to be derived from `config.id`, which meant two SVGs rendered
 * from the same config — a preset grid, the social kit's several banner
 * sizes, the mockups modal showing one logo eight times — emitted identical
 * gradient, clip-path and filter ids into one document. The browser resolves
 * `url(#id)` against the first match in the document, so every copy after the
 * first silently borrowed the first one's definitions.
 *
 * A per-call counter guarantees uniqueness no matter how many renders share a
 * config or a page.
 */
let renderCounter = 0;

function nextRenderId(configId?: string): string {
  const base = configId ? configId.replace(/[^a-zA-Z0-9_-]/g, '') : 'logo';
  renderCounter += 1;
  return `${base}_${renderCounter.toString(36)}`;
}

export function generateSvgString(config: LogoConfig, targetSize = 512): string {
  const s = 512; // Base coordinate space
  const iconItem = ICON_LIBRARY.find((i) => i.key === config.iconKey);
  const shapePath = getShapePathD(config.shapeMask, s, config.borderRadius);

  // Background Gradient / Pattern definitions
  const uid = nextRenderId(config.id);
  const bgGradId = `bgGrad_${uid}`;
  const iconGradId = `iconGrad_${uid}`;
  const textGradId = `textGrad_${uid}`;
  const clipId = `maskClip_${uid}`;
  const imageFilterId = `imageFilter_${uid}`;
  const curvePathId = `textCurve_${uid}`;
  const iconFilterId = `iconFilter_${uid}`;

  // Angle math for linear gradient
  const angleRad = ((config.bgGradientAngle || 135) * Math.PI) / 180;
  const x1 = Math.round(50 - Math.cos(angleRad) * 50);
  const y1 = Math.round(50 - Math.sin(angleRad) * 50);
  const x2 = Math.round(50 + Math.cos(angleRad) * 50);
  const y2 = Math.round(50 + Math.sin(angleRad) * 50);

  // Icon positioning
  const isIconOnly = config.layout === 'icon-only' || !config.showText;
  const isTextOnly = config.layout === 'text-only' || config.iconType === 'none';
  const isIconLeft = config.layout === 'icon-left';
  const isIconTop = config.layout === 'icon-top' || config.layout === 'badge-center';

  let iconX = s / 2 + (config.iconOffsetX || 0);
  let iconY = s / 2 + (config.iconOffsetY || 0);

  let textX = s / 2 + (config.textOffsetX || 0);
  let textY = s / 2 + (config.textOffsetY || 0);

  let taglineX = s / 2 + (config.textOffsetX || 0);
  let taglineY = s / 2 + (config.taglineOffsetY || 60);

  if (!isIconOnly && !isTextOnly) {
    if (isIconTop) {
      iconY = s * 0.38 + (config.iconOffsetY || 0);
      textY = s * 0.72 + (config.textOffsetY || 0);
      taglineY = s * 0.85 + (config.taglineOffsetY || 0);
    } else if (isIconLeft) {
      iconX = s * 0.28 + (config.iconOffsetX || 0);
      iconY = s * 0.5 + (config.iconOffsetY || 0);
      textX = s * 0.62 + (config.textOffsetX || 0);
      textY = s * (config.showTagline ? 0.48 : 0.52) + (config.textOffsetY || 0);
      taglineX = s * 0.62 + (config.textOffsetX || 0);
      taglineY = s * 0.66 + (config.taglineOffsetY || 0);
    }
  }

  // Text curve path definition if enabled
  let curveDefs = '';
  if (config.textCurve === 'arch-up') {
    const r = config.textCurveRadius || 180;
    const startY = textY + 30;
    curveDefs = `<path id="${curvePathId}" d="M ${s * 0.1},${startY} A ${r},${r} 0 0,1 ${s * 0.9},${startY}" fill="none" />`;
  } else if (config.textCurve === 'arch-down') {
    const r = config.textCurveRadius || 180;
    const startY = textY - 30;
    curveDefs = `<path id="${curvePathId}" d="M ${s * 0.1},${startY} A ${r},${r} 0 0,0 ${s * 0.9},${startY}" fill="none" />`;
  } else if (config.textCurve === 'circle') {
    const r = config.textCurveRadius || 160;
    curveDefs = `<path id="${curvePathId}" d="M ${s / 2 - r},${s / 2} A ${r},${r} 0 1,1 ${s / 2 + r},${s / 2} A ${r},${r} 0 1,1 ${s / 2 - r},${s / 2}" fill="none" />`;
  } else if (config.textCurve === 'wave') {
    const startY = textY;
    curveDefs = `<path id="${curvePathId}" d="M ${s * 0.1},${startY} Q ${s * 0.3},${startY - 35} ${s * 0.5},${startY} T ${s * 0.9},${startY}" fill="none" />`;
  }

  // Generate Pattern Defs
  let patternDef = '';
  if (config.pattern === 'dots') {
    patternDef = `
      <pattern id="pattern_dots_${uid}" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="12" cy="12" r="2" fill="currentColor" fill-opacity="${config.patternOpacity || 0.15}" />
      </pattern>
    `;
  } else if (config.pattern === 'grid') {
    patternDef = `
      <pattern id="pattern_grid_${uid}" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
        <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" stroke-width="1.2" stroke-opacity="${config.patternOpacity || 0.15}" />
      </pattern>
    `;
  } else if (config.pattern === 'stripes') {
    patternDef = `
      <pattern id="pattern_stripes_${uid}" width="20" height="20" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="20" stroke="currentColor" stroke-width="3" stroke-opacity="${config.patternOpacity || 0.15}" />
      </pattern>
    `;
  } else if (config.pattern === 'waves') {
    patternDef = `
      <pattern id="pattern_waves_${uid}" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
        <path d="M 0 10 Q 10 0, 20 10 T 40 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-opacity="${config.patternOpacity || 0.15}" />
      </pattern>
    `;
  } else if (config.pattern === 'circuit') {
    const op = config.patternOpacity || 0.15;
    patternDef = `
      <pattern id="pattern_circuit_${uid}" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
        <path d="M 6 6 H 24 V 24 H 42 M 6 42 V 30 H 24 M 30 42 V 30 H 42" fill="none" stroke="currentColor" stroke-width="1.4" stroke-opacity="${op}" />
        <circle cx="24" cy="24" r="2.4" fill="currentColor" fill-opacity="${op}" />
        <circle cx="6" cy="6" r="2" fill="currentColor" fill-opacity="${op}" />
        <circle cx="42" cy="30" r="2" fill="currentColor" fill-opacity="${op}" />
      </pattern>
    `;
  }

  // Image Filter Definition (for uploaded image editing: brightness, contrast, hue, saturation, etc.)
  const imgF = config.uploadedImageFilters || {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hueRotate: 0,
    grayscale: 0,
    invert: 0,
    sepia: 0,
    blur: 0,
  };

  const brightnessScale = (imgF.brightness ?? 100) / 100;
  const contrastScale = (imgF.contrast ?? 100) / 100;
  const saturationScale = (imgF.saturation ?? 100) / 100;
  const hueDeg = imgF.hueRotate || 0;
  const blurVal = imgF.blur || 0;
  const grayscaleAmt = Math.min(1, Math.max(0, (imgF.grayscale || 0) / 100));
  const sepiaAmt = Math.min(1, Math.max(0, (imgF.sepia || 0) / 100));
  const invertAmt = Math.min(1, Math.max(0, (imgF.invert || 0) / 100));

  // Contrast is `slope * x + intercept` around mid-grey; a bare diagonal scale
  // is brightness, not contrast, so the intercept has to be carried explicitly.
  const slope = contrastScale * brightnessScale;
  const intercept = 0.5 - contrastScale * 0.5;
  const linearRgb = `<feComponentTransfer>
        <feFuncR type="linear" slope="${slope}" intercept="${intercept}" />
        <feFuncG type="linear" slope="${slope}" intercept="${intercept}" />
        <feFuncB type="linear" slope="${slope}" intercept="${intercept}" />
      </feComponentTransfer>`;

  // Sepia matrix interpolated between identity (0) and full sepia (1).
  const sepiaMatrix = (a: number) =>
    [
      0.393 + 0.607 * (1 - a), 0.769 - 0.769 * (1 - a), 0.189 - 0.189 * (1 - a), 0, 0,
      0.349 - 0.349 * (1 - a), 0.686 + 0.314 * (1 - a), 0.168 - 0.168 * (1 - a), 0, 0,
      0.272 - 0.272 * (1 - a), 0.534 - 0.534 * (1 - a), 0.131 + 0.869 * (1 - a), 0, 0,
      0, 0, 0, 1, 0,
    ]
      .map((v) => Math.round(v * 10000) / 10000)
      .join(' ');

  const imageFilterDef = `
    <filter id="${imageFilterId}" color-interpolation-filters="sRGB">
      ${blurVal > 0 ? `<feGaussianBlur stdDeviation="${blurVal}" />` : ''}
      ${linearRgb}
      <feColorMatrix type="saturate" values="${saturationScale}" />
      ${hueDeg !== 0 ? `<feColorMatrix type="hueRotate" values="${hueDeg}" />` : ''}
      ${grayscaleAmt > 0 ? `<feColorMatrix type="saturate" values="${1 - grayscaleAmt}" />` : ''}
      ${sepiaAmt > 0 ? `<feColorMatrix type="matrix" values="${sepiaMatrix(sepiaAmt)}" />` : ''}
      ${
        invertAmt > 0
          ? `<feComponentTransfer>
        <feFuncR type="table" tableValues="${invertAmt} ${1 - invertAmt}" />
        <feFuncG type="table" tableValues="${invertAmt} ${1 - invertAmt}" />
        <feFuncB type="table" tableValues="${invertAmt} ${1 - invertAmt}" />
      </feComponentTransfer>`
          : ''
      }
    </filter>
  `;

  // Icon Shadow & Outline Filter
  let iconFilterDef = '';
  if (config.iconShadow) {
    const sColor = config.iconShadowColor || 'rgba(0,0,0,0.5)';
    const sBlur = config.iconShadowBlur || 8;
    const sOffY = config.iconShadowOffsetY || 4;
    const sOffX = config.iconShadowOffsetX || 0;
    iconFilterDef = `
      <filter id="${iconFilterId}">
        <feDropShadow dx="${sOffX}" dy="${sOffY}" stdDeviation="${sBlur}" flood-color="${sColor}" />
      </filter>
    `;
  }

  // Background Element
  let bgElement = '';
  if (config.bgType !== 'transparent') {
    let fill = config.bgColor1;
    if (config.bgType === 'linear' || config.bgType === 'mesh') {
      fill = `url(#${bgGradId})`;
    } else if (config.bgType === 'radial') {
      fill = `url(#bgRadial_${uid})`;
    }

    bgElement = `
      <g clip-path="url(#${clipId})">
        <path d="${shapePath}" fill="${fill}" />
        ${config.pattern !== 'none' ? `<rect width="${s}" height="${s}" fill="url(#pattern_${config.pattern}_${uid})" color="#ffffff" />` : ''}
        ${config.innerGlow ? `<path d="${shapePath}" fill="none" stroke="${config.innerGlowColor || '#ffffff'}" stroke-width="8" stroke-opacity="0.25" filter="blur(6px)" />` : ''}
      </g>
    `;
  }

  // Border Element
  let borderElement = '';
  if (config.borderWidth > 0 && config.bgType !== 'transparent') {
    const dash = config.borderStyle === 'dashed' ? 'stroke-dasharray="12 8"' : '';
    borderElement = `
      <path d="${shapePath}" fill="none" stroke="${config.borderColor || '#ffffff'}" stroke-width="${config.borderWidth}" ${dash} stroke-linejoin="round" />
    `;
  }

  // Decorative Ring
  let ringElement = '';
  if (config.showRing) {
    const rRadius = config.ringRadius || 210;
    const rWidth = config.ringWidth || 3;
    const rDash = config.ringDash ? 'stroke-dasharray="8 6"' : '';
    ringElement = `
      <circle cx="${s / 2}" cy="${s / 2}" r="${rRadius}" fill="none" stroke="${config.ringColor || '#ffffff'}" stroke-width="${rWidth}" ${rDash} stroke-opacity="0.6" />
    `;
  }

  // Icon / Graphic Element / Uploaded Image Element
  let iconElement = '';
  if (!isTextOnly) {
    const size = config.iconSize || 160;
    const halfSize = size / 2;
    const fill = config.iconGradient ? `url(#${iconGradId})` : config.iconColor || '#38bdf8';
    const flipTransform = `${config.iconFlipH ? 'scale(-1, 1)' : ''} ${config.iconFlipV ? 'scale(1, -1)' : ''}`;
    const rotateTransform = config.iconRotation ? `rotate(${config.iconRotation} ${iconX} ${iconY})` : '';
    const filterAttr = config.iconShadow ? `filter="url(#${iconFilterId})"` : '';

    const outlineStyle = config.iconOutline
      ? `stroke="${config.iconOutlineColor || '#ffffff'}" stroke-width="${config.iconOutlineWidth || 3}"`
      : '';

    // Handle Uploaded Image Mode
    if (config.iconType === 'image' && config.uploadedImageSrc) {
      const imgScale = (config.uploadedImageScale || 100) / 100;
      const imgW = size * imgScale;
      const imgH = size * imgScale;
      // Image Offset inside the group
      const imgOffsetX = (size - imgW) / 2 + (config.uploadedImageOffsetX || 0);
      const imgOffsetY = (size - imgH) / 2 + (config.uploadedImageOffsetY || 0);
      const imgRot = config.uploadedImageRotation || 0;
      const imgOpacity = config.uploadedImageOpacity ?? 1;

      let imageClipPath = '';
      if (config.uploadedImageCropShape === 'circle') {
        imageClipPath = `clip-path="url(#imgCircleClip_${uid})"`;
      } else if (config.uploadedImageCropShape === 'squircle') {
        imageClipPath = `clip-path="url(#imgSquircleClip_${uid})"`;
      } else if (config.uploadedImageCropShape === 'hexagon') {
        imageClipPath = `clip-path="url(#imgHexClip_${uid})"`;
      } else if (config.uploadedImageCropShape === 'square') {
        imageClipPath = `clip-path="url(#imgSquareClip_${uid})"`;
      }

      iconElement = `
        <g transform="translate(${iconX - halfSize}, ${iconY - halfSize}) rotate(${imgRot} ${halfSize} ${halfSize})" opacity="${imgOpacity}" ${imageClipPath}>
          <image
            href="${escapeXml(config.uploadedImageSrc)}"
            x="${imgOffsetX}"
            y="${imgOffsetY}"
            width="${imgW}"
            height="${imgH}"
            preserveAspectRatio="xMidYMid meet"
            filter="url(#${imageFilterId})"
          />
        </g>
      `;
    } else if (config.iconType === 'custom-svg' && config.customSvgString) {
      iconElement = `
        <g transform="translate(${iconX - halfSize}, ${iconY - halfSize}) ${rotateTransform} ${flipTransform}" opacity="${config.iconOpacity || 1}" color="${fill}" ${filterAttr}>
          <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" ${outlineStyle}>
            ${config.customSvgString}
          </svg>
        </g>
      `;
    } else if (config.iconType === 'emoji' && config.emojiChar) {
      iconElement = `
        <text x="${iconX}" y="${iconY + size * 0.35}" text-anchor="middle" font-size="${size}" transform="${rotateTransform}" ${filterAttr}>
          ${escapeXml(config.emojiChar)}
        </text>
      `;
    } else if (iconItem) {
      const viewBox = iconItem.viewBox || '0 0 24 24';
      iconElement = `
        <g transform="translate(${iconX - halfSize}, ${iconY - halfSize}) ${rotateTransform}" opacity="${config.iconOpacity || 1}" color="${fill}" ${filterAttr}>
          <svg width="${size}" height="${size}" viewBox="${viewBox}" fill="${fill}" ${outlineStyle}>
            ${iconItem.path}
          </svg>
        </g>
      `;
    }
  }

  // Brand Name Text Element
  let textElement = '';
  if (config.showText && config.text) {
    const textFill = config.textGradient ? `url(#${textGradId})` : config.textColor || '#ffffff';
    let rawText = config.text || '';
    if (config.textTransform === 'uppercase' || config.textUppercase) {
      rawText = rawText.toUpperCase();
    } else if (config.textTransform === 'lowercase') {
      rawText = rawText.toLowerCase();
    } else if (config.textTransform === 'capitalize') {
      rawText = rawText.replace(/\b\w/g, (c) => c ? c.toUpperCase() : '');
    }

    const strokeAttr = config.textStroke
      ? `stroke="${config.textStrokeColor || '#000000'}" stroke-width="${config.textStrokeWidth || 2}" paint-order="stroke fill"`
      : '';
    
    const shadowFilter = config.textShadow
      ? `filter="drop-shadow(${config.textShadowOffsetX || 0}px ${config.textShadowOffsetY || 4}px ${config.textShadowBlur || 6}px ${config.textShadowColor || 'rgba(0,0,0,0.5)'})"`
      : '';
    
    const letterSpacing = config.letterSpacing ? `letter-spacing="${config.letterSpacing}px"` : '';

    if (config.textCurve !== 'straight' && curveDefs) {
      textElement = `
        <text font-family="${escapeXml(config.fontFamily || 'Cairo')}, system-ui, sans-serif" font-size="${config.fontSize || 42}" font-weight="${config.fontWeight || 700}" fill="${textFill}" ${strokeAttr} ${shadowFilter} ${letterSpacing}>
          <textPath href="#${curvePathId}" startOffset="50%" text-anchor="middle">
            ${escapeXml(rawText)}
          </textPath>
        </text>
      `;
    } else {
      const rot = config.textRotation ? `transform="rotate(${config.textRotation} ${textX} ${textY})"` : '';
      textElement = `
        <text x="${textX}" y="${textY}" text-anchor="${isIconLeft ? 'start' : 'middle'}" dominant-baseline="middle" font-family="${escapeXml(config.fontFamily || 'Cairo')}, system-ui, sans-serif" font-size="${config.fontSize || 42}" font-weight="${config.fontWeight || 700}" fill="${textFill}" ${strokeAttr} ${shadowFilter} ${letterSpacing} ${rot}>
          ${escapeXml(rawText)}
        </text>
      `;
    }
  }

  // Tagline Element
  let taglineElement = '';
  if (config.showTagline && config.tagline) {
    const rawTagline = config.taglineUppercase ? (config.tagline || '').toUpperCase() : (config.tagline || '');
    const tSpacing = config.taglineLetterSpacing ? `letter-spacing="${config.taglineLetterSpacing}px"` : 'letter-spacing="2px"';
    taglineElement = `
      <text x="${taglineX}" y="${taglineY}" text-anchor="${isIconLeft ? 'start' : 'middle'}" dominant-baseline="middle" font-family="${escapeXml(config.taglineFontFamily || 'Tajawal')}, system-ui, sans-serif" font-size="${config.taglineFontSize || 18}" font-weight="${config.taglineFontWeight || 500}" fill="${config.taglineColor || '#94a3b8'}" ${tSpacing}>
        ${escapeXml(rawTagline)}
      </text>
    `;
  }

  // Watermark Overlay Element
  let watermarkElement = '';
  if (config.watermark && config.watermark.enabled) {
    const wm = config.watermark;
    const center = s / 2;
    const wmOpacity = Math.max(0.05, Math.min(1, wm.opacity ?? 0.25));
    const wmRotation = wm.rotation ?? 0;
    const wmColor = wm.color || '#ffffff';
    const wmFontSize = wm.fontSize || 20;
    const wmFont = wm.fontFamily || 'Cairo';
    const wmText = wm.text || 'CONFIDENTIAL';

    if (wm.position === 'tile') {
      // Repeating diagonal tiled text
      const tileStep = 110;
      const tileRows: string[] = [];
      for (let y = -s; y < s * 2; y += tileStep) {
        for (let x = -s; x < s * 2; x += tileStep * 1.6) {
          tileRows.push(
            `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="${escapeXml(wmFont)}, system-ui, sans-serif" font-size="${wmFontSize}" font-weight="700" fill="${wmColor}">${escapeXml(wmText)}</text>`
          );
        }
      }
      watermarkElement = `
        <g opacity="${wmOpacity}" transform="rotate(${wmRotation || -30} ${center} ${center})" pointer-events="none">
          ${tileRows.join('\n')}
        </g>
      `;
    } else {
      let wmX = center;
      let wmY = center;
      let textAnchor = 'middle';
      const margin = 32;

      switch (wm.position) {
        case 'top-left':
          wmX = margin;
          wmY = margin + wmFontSize * 0.8;
          textAnchor = 'start';
          break;
        case 'top-right':
          wmX = s - margin;
          wmY = margin + wmFontSize * 0.8;
          textAnchor = 'end';
          break;
        case 'bottom-left':
          wmX = margin;
          wmY = s - margin;
          textAnchor = 'start';
          break;
        case 'bottom-right':
          wmX = s - margin;
          wmY = s - margin;
          textAnchor = 'end';
          break;
        case 'center':
        default:
          wmX = center;
          wmY = center;
          textAnchor = 'middle';
          break;
      }

      if (wm.type === 'logo') {
        const wmSize = wm.size || 70;
        const halfSize = wmSize / 2;
        const wmIconPath = iconItem ? iconItem.path : '<circle cx="12" cy="12" r="8"/>';
        const wmViewBox = iconItem?.viewBox || '0 0 24 24';
        watermarkElement = `
          <g opacity="${wmOpacity}" transform="translate(${wmX - halfSize}, ${wmY - halfSize}) rotate(${wmRotation} ${halfSize} ${halfSize})" pointer-events="none">
            <svg width="${wmSize}" height="${wmSize}" viewBox="${wmViewBox}" fill="none" stroke="${wmColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              ${wmIconPath}
            </svg>
          </g>
        `;
      } else if (wm.type === 'custom-image' && wm.customImageSrc) {
        const wmSize = wm.size || 80;
        const halfSize = wmSize / 2;
        watermarkElement = `
          <g opacity="${wmOpacity}" transform="translate(${wmX - halfSize}, ${wmY - halfSize}) rotate(${wmRotation} ${halfSize} ${halfSize})" pointer-events="none">
            <image href="${escapeXml(wm.customImageSrc)}" width="${wmSize}" height="${wmSize}" preserveAspectRatio="xMidYMid meet" />
          </g>
        `;
      } else {
        const rot = wmRotation ? `transform="rotate(${wmRotation} ${wmX} ${wmY})"` : '';
        watermarkElement = `
          <g opacity="${wmOpacity}" ${rot} pointer-events="none">
            <text x="${wmX}" y="${wmY}" text-anchor="${textAnchor}" dominant-baseline="middle" font-family="${escapeXml(wmFont)}, system-ui, sans-serif" font-size="${wmFontSize}" font-weight="800" fill="${wmColor}" letter-spacing="1px">
              ${escapeXml(wmText)}
            </text>
          </g>
        `;
      }
    }
  }

  return `
<svg class="artboard-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${targetSize}" height="${targetSize}">
  <defs>
    <!-- Background Gradients -->
    <linearGradient id="${bgGradId}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
      <stop offset="0%" stop-color="${config.bgColor1 || '#0f172a'}" />
      <stop offset="100%" stop-color="${config.bgColor2 || '#1e1b4b'}" />
    </linearGradient>

    <radialGradient id="bgRadial_${uid}" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
      <stop offset="0%" stop-color="${config.bgColor1 || '#38bdf8'}" />
      <stop offset="100%" stop-color="${config.bgColor2 || '#0369a1'}" />
    </radialGradient>

    <!-- Icon Gradient -->
    <linearGradient id="${iconGradId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${config.iconColor || '#38bdf8'}" />
      <stop offset="100%" stop-color="${config.iconColor2 || '#818cf8'}" />
    </linearGradient>

    <!-- Text Gradient -->
    <linearGradient id="${textGradId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${config.textColor || '#ffffff'}" />
      <stop offset="100%" stop-color="${config.textColor2 || '#94a3b8'}" />
    </linearGradient>

    <!-- Clip Path Mask -->
    <clipPath id="${clipId}">
      <path d="${shapePath}" />
    </clipPath>

    <!-- Uploaded Image Crop Shapes -->
    <clipPath id="imgCircleClip_${uid}">
      <circle cx="${(config.iconSize || 160) / 2}" cy="${(config.iconSize || 160) / 2}" r="${(config.iconSize || 160) / 2}" />
    </clipPath>

    <clipPath id="imgSquircleClip_${uid}">
      <path d="${getShapePathD('squircle', config.iconSize || 160, (config.iconSize || 160) * 0.225)}" />
    </clipPath>

    <clipPath id="imgHexClip_${uid}">
      <path d="${getShapePathD('hexagon', config.iconSize || 160)}" />
    </clipPath>

    <clipPath id="imgSquareClip_${uid}">
      <rect x="0" y="0" width="${config.iconSize || 160}" height="${config.iconSize || 160}" rx="0" ry="0" />
    </clipPath>

    ${imageFilterDef}
    ${iconFilterDef}
    ${patternDef}
    ${curveDefs}
  </defs>

  ${bgElement}
  ${borderElement}
  ${ringElement}
  ${iconElement}
  ${textElement}
  ${taglineElement}
  ${watermarkElement}
</svg>
`.trim();
}

/**
 * Rasterizes an SVG string onto a canvas of any dimensions and returns a Blob.
 * Single implementation behind every raster export in the app (favicons,
 * feature graphics, social banners, one-off downloads).
 */
export async function rasterizeSvg(
  svgString: string,
  width: number,
  height: number,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality = 0.95
): Promise<Blob> {
  // An SVG loaded through <img> renders in an isolated document that cannot
  // reach the page's web fonts, so the bytes have to travel with the markup.
  // Without this the export silently falls back to a system face.
  const withFonts = await embedFontsInSvg(svgString);

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return reject(new Error('Canvas 2D context not available'));
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const blob = new Blob([withFonts], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // JPEG has no alpha channel: without an opaque ground, transparent
      // areas rasterize to black instead of white.
      if (format === 'jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const mimeType =
        format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';

      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create canvas blob'));
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to rasterize SVG (the generated markup is not valid XML)'));
    };

    img.src = url;
  });
}

/**
 * Convenience wrapper for the square icon case (favicons, avatars, app icons).
 */
export async function renderSvgToBlob(
  svgString: string,
  targetSize: number,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality = 0.95
): Promise<Blob> {
  return rasterizeSvg(svgString, targetSize, targetSize, format, quality);
}

/**
 * Generates binary standard ICO file containing multiple PNG images
 */
export async function createIcoFile(pngItems: { size: number; blob: Blob }[]): Promise<Blob> {
  const buffers: ArrayBuffer[] = [];
  for (const item of pngItems) {
    const buf = await item.blob.arrayBuffer();
    buffers.push(buf);
  }

  const count = pngItems.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + dirEntrySize * count;

  const totalLength = offset + buffers.reduce((sum, b) => sum + b.byteLength, 0);
  const icoBuffer = new Uint8Array(totalLength);
  const view = new DataView(icoBuffer.buffer);

  // Header
  view.setUint16(0, 0, true); // Reserved
  view.setUint16(2, 1, true); // ICO Type = 1
  view.setUint16(4, count, true); // Number of images

  // Directory entries
  for (let i = 0; i < count; i++) {
    const item = pngItems[i];
    const data = buffers[i];
    const entryOffset = headerSize + i * dirEntrySize;

    const w = item.size >= 256 ? 0 : item.size;
    const h = item.size >= 256 ? 0 : item.size;

    view.setUint8(entryOffset, w); // Width
    view.setUint8(entryOffset + 1, h); // Height
    view.setUint8(entryOffset + 2, 0); // Palette count
    view.setUint8(entryOffset + 3, 0); // Reserved
    view.setUint16(entryOffset + 4, 1, true); // Color planes
    view.setUint16(entryOffset + 6, 32, true); // Bits per pixel
    view.setUint32(entryOffset + 8, data.byteLength, true); // Size of image data
    view.setUint32(entryOffset + 12, offset, true); // Offset of image data

    icoBuffer.set(new Uint8Array(data), offset);
    offset += data.byteLength;
  }

  return new Blob([icoBuffer], { type: 'image/x-icon' });
}

/**
 * Generates HTML link tags snippet for quick embedding in website <head>
 */
export function generateHtmlHeadSnippet(brandName = 'My App', themeColor = '#0f172a'): string {
  return `<!-- Favicon & Touch Icons Package -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
<link rel="shortcut icon" href="/favicon.ico" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
<meta name="apple-mobile-web-app-title" content="${escapeXml(brandName)}" />
<meta name="application-name" content="${escapeXml(brandName)}" />
<meta name="theme-color" content="${themeColor}" />`;
}

/**
 * Generates site.webmanifest JSON content
 */
export function generateWebmanifestJson(brandName = 'My App', themeColor = '#0f172a'): string {
  return JSON.stringify(
    {
      name: brandName,
      short_name: brandName,
      icons: [
        {
          src: '/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
      theme_color: themeColor,
      background_color: themeColor,
      display: 'standalone',
    },
    null,
    2
  );
}

export interface FaviconZipOptions {
  includeWebp?: boolean;
  includeJpeg?: boolean;
  includePlayStoreFeature?: boolean;
  organizedFolders?: boolean;
  onProgress?: (percent: number, statusText: string) => void;
}

/**
 * Generates a full ready-to-use Favicon ZIP package with all sizes and formats
 */
export async function generateFaviconZip(
  config: LogoConfig,
  options: FaviconZipOptions = {}
): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const brandName = config.text || config.name || 'Brand';
  const themeColor = config.bgColor1 || '#0f172a';
  const {
    includeWebp = true,
    includeJpeg = true,
    includePlayStoreFeature = true,
    organizedFolders = false,
    onProgress,
  } = options;

  onProgress?.(5, 'Preparing SVG master asset...');
  const svgString = generateSvgString(config, 512);

  // 1. Root & Documentation
  // The .svg the user ships must carry its fonts too, not just the rasters.
  zip.file('favicon.svg', await embedFontsInSvg(svgString));
  zip.file('site.webmanifest', generateWebmanifestJson(brandName, themeColor));
  zip.file('html-head-snippet.html', generateHtmlHeadSnippet(brandName, themeColor));
  zip.file(
    'browserconfig.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/mstile-150x150.png"/>
      <TileColor>${themeColor}</TileColor>
    </tile>
  </msapplication>
</browserconfig>`
  );

  zip.file(
    'README_FAVICON_GUIDE.txt',
    `=============================================================
  ${brandName} - Complete Favicon & Web App Icon Package
  Generated by Logo & Favicon Studio PRO
  Created at: ${new Date().toLocaleString()}
=============================================================

📁 HOW TO USE THIS PACKAGE:
1. Place all icon files, 'site.webmanifest', and 'browserconfig.xml' into the root /public directory of your web project.
2. Copy the HTML code inside 'html-head-snippet.html' and paste it into the <head> section of your HTML files.

📦 INCLUDED ASSETS:
- favicon.svg : Infinite-resolution vector icon for modern web browsers.
- favicon.ico : Multi-resolution Windows / Browser fallback (16x16, 32x32, 48x48).
- favicon-16x16.png : Standard browser tab icon.
- favicon-32x32.png : High-DPI / Retina browser tab icon.
- favicon-48x48.png : Windows desktop / taskbar icon.
- favicon-64x64.png : Windows / Linux shortcut icon.
- favicon-128x128.png : Chrome Web Store / App icon.
- apple-touch-icon.png (180x180) : Apple iOS Safari Home Screen icon.
- android-chrome-192x192.png : Android Chrome / PWA home screen icon.
- android-chrome-256x256.png : Windows tile / PWA icon.
- android-chrome-512x512.png : PWA Splash screen & high-res app icon.
- site.webmanifest : Progressive Web App (PWA) manifest.
- browserconfig.xml : Microsoft IE / Edge Windows tile configuration.
${includePlayStoreFeature ? '- google-play-feature-graphic-1024x500.png / .jpg : Google Play Store promo header.' : ''}

100% W3C, Google Lighthouse, Apple Safari & PWA compliant.
`
  );

  // Folders if requested
  const pngFolder = organizedFolders ? zip.folder('png') : zip;
  const webpFolder = organizedFolders ? zip.folder('webp') : zip;
  const jpegFolder = organizedFolders ? zip.folder('jpeg') : zip;

  const totalSteps = FAVICON_SPECS.length + (includeWebp ? FAVICON_SPECS.length : 0) + (includeJpeg ? 3 : 0) + 3;
  let currentStep = 0;

  // 2. Render all standard size PNGs
  const icoItems: { size: number; blob: Blob }[] = [];

  for (const spec of FAVICON_SPECS) {
    currentStep++;
    onProgress?.(
      Math.round((currentStep / totalSteps) * 85),
      `Rendering PNG: ${spec.label} (${spec.size}×${spec.size})...`
    );
    const pngBlob = await renderSvgToBlob(svgString, spec.size, 'png');
    (pngFolder || zip).file(spec.fileName, pngBlob);

    if (spec.size === 16 || spec.size === 32 || spec.size === 48) {
      icoItems.push({ size: spec.size, blob: pngBlob });
    }
  }

  // 3. Multi-size favicon.ico
  onProgress?.(88, 'Building multi-resolution favicon.ico binary...');
  try {
    const icoBlob = await createIcoFile(icoItems);
    zip.file('favicon.ico', icoBlob);
  } catch (err) {
    console.warn('Could not generate multi-size ICO binary, using 32px png fallback', err);
    const fallback32 = await renderSvgToBlob(svgString, 32, 'png');
    zip.file('favicon.ico', fallback32);
  }

  // 4. WebP formats if enabled
  if (includeWebp) {
    for (const spec of FAVICON_SPECS) {
      currentStep++;
      onProgress?.(
        Math.round((currentStep / totalSteps) * 92),
        `Encoding WebP: ${spec.size}×${spec.size}...`
      );
      const webpBlob = await renderSvgToBlob(svgString, spec.size, 'webp');
      const webpName = spec.fileName.replace(/\.png$/i, '.webp');
      (webpFolder || zip).file(webpName, webpBlob);
    }
  }

  // 5. JPEGs if enabled (popular sizes: 180, 192, 512)
  if (includeJpeg) {
    for (const sz of [180, 192, 512]) {
      const jpgBlob = await renderSvgToBlob(svgString, sz, 'jpeg');
      (jpegFolder || zip).file(`icon-${sz}x${sz}.jpg`, jpgBlob);
    }
  }

  // 6. Play Store Feature Graphic if enabled
  if (includePlayStoreFeature) {
    onProgress?.(95, 'Generating Google Play Store 1024×500 feature graphic...');
    const playSvg = generateFeatureGraphicSvg(config, {
      layout: 'center-hero',
      title: config.text || config.name || 'App',
      subtitle: config.tagline || '',
      badgeText: '',
      bgTheme: 'brand',
      showPhoneMockup: true,
      showGlowEffect: true,
    });
    const playPng = await rasterizeSvg(playSvg, 1024, 500, 'png');
    const playJpg = await rasterizeSvg(playSvg, 1024, 500, 'jpeg');
    if (organizedFolders) {
      const storeFolder = zip.folder('store_assets');
      storeFolder?.file('google-play-feature-graphic-1024x500.png', playPng);
      storeFolder?.file('google-play-feature-graphic-1024x500.jpg', playJpg);
    } else {
      zip.file('google-play-feature-graphic-1024x500.png', playPng);
      zip.file('google-play-feature-graphic-1024x500.jpg', playJpg);
    }
  }

  onProgress?.(98, 'Packaging final ZIP archive with JSZip...');
  const finalZip = await zip.generateAsync({ type: 'blob' });
  onProgress?.(100, 'Done!');
  return finalZip;
}


/**
 * Generates exact 1024x500 Google Play Store Feature Graphic SVG
 */
/**
 * Rewrites every `id` in a generated SVG, and every reference to one, so the
 * document can sit next to other copies of itself without their definitions
 * colliding.
 *
 * The feature-graphic and social-banner generators emit fixed ids (`fg_*`,
 * `sb_*`), and the social kit renders one banner per preset from the same
 * config — so before this, every banner after the first resolved
 * `url(#sb_bgGrad)` against the first banner's gradient.
 */
function namespaceSvgIds(svg: string, uid: string): string {
  return svg
    .replace(/\bid="([A-Za-z_][\w-]*)"/g, `id="$1_${uid}"`)
    .replace(/url\(#([A-Za-z_][\w-]*)\)/g, `url(#$1_${uid})`)
    .replace(/\bhref="#([A-Za-z_][\w-]*)"/g, `href="#$1_${uid}"`);
}

export function generateFeatureGraphicSvg(
  config: LogoConfig,
  options: FeatureGraphicOptions
): string {
  const w = 1024;
  const h = 500;
  const logoSvg = generateSvgString(config, 512);

  // Background Theme Gradients
  let bgGradDef = '';
  let textColor = '#ffffff';
  let subtextColor = '#cbd5e1';
  let cardBg = 'rgba(255, 255, 255, 0.12)';
  let cardBorder = 'rgba(255, 255, 255, 0.2)';
  let accentGlow = '#6366f1';

  switch (options.bgTheme) {
    case 'brand': {
      const c1 = options.customBgColor1 || config.bgColor1 || '#4f46e5';
      const c2 = options.customBgColor2 || config.bgColor2 || '#06b6d4';
      bgGradDef = `<linearGradient id="fg_bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="100%" stop-color="${c2}" />
      </linearGradient>`;
      accentGlow = c1;
      break;
    }
    case 'sunset': {
      bgGradDef = `<linearGradient id="fg_bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f43f5e" />
        <stop offset="50%" stop-color="#8b5cf6" />
        <stop offset="100%" stop-color="#3b82f6" />
      </linearGradient>`;
      accentGlow = '#f43f5e';
      break;
    }
    case 'cyber': {
      bgGradDef = `<linearGradient id="fg_bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#090d16" />
        <stop offset="60%" stop-color="#1e1b4b" />
        <stop offset="100%" stop-color="#312e81" />
      </linearGradient>`;
      accentGlow = '#06b6d4';
      break;
    }
    case 'emerald': {
      bgGradDef = `<linearGradient id="fg_bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#022c22" />
        <stop offset="50%" stop-color="#065f46" />
        <stop offset="100%" stop-color="#059669" />
      </linearGradient>`;
      accentGlow = '#10b981';
      break;
    }
    case 'gold': {
      bgGradDef = `<linearGradient id="fg_bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1c1917" />
        <stop offset="50%" stop-color="#451a03" />
        <stop offset="100%" stop-color="#b45309" />
      </linearGradient>`;
      accentGlow = '#f59e0b';
      break;
    }
    case 'dark': {
      bgGradDef = `<linearGradient id="fg_bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0a0e17" />
        <stop offset="100%" stop-color="#1e293b" />
      </linearGradient>`;
      accentGlow = '#38bdf8';
      break;
    }
    case 'light': {
      bgGradDef = `<linearGradient id="fg_bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc" />
        <stop offset="100%" stop-color="#e2e8f0" />
      </linearGradient>`;
      textColor = '#0f172a';
      subtextColor = '#475569';
      cardBg = 'rgba(255, 255, 255, 0.85)';
      cardBorder = 'rgba(0, 0, 0, 0.08)';
      accentGlow = '#6366f1';
      break;
    }
  }

  const title = options.title || config.text || config.name || 'My App';
  const subtitle = options.subtitle || config.tagline || 'Experience the next generation application';
  // Never invented. A rating or a download count this tool cannot know is a
  // claim on a store listing, so the only honest default is nothing at all.
  // For the same reason there is no rating bar and no "GET IT ON Google Play"
  // badge anywhere below: the first is a fabricated number, the second is
  // Google's trademark and belongs only to apps that are actually listed.
  const badgeText = (options.badgeText || '').trim();

  // Extract inner SVG content (strip outer <svg> tags) to embed directly
  const innerSvgContent = logoSvg.replace(/^<svg[^>]*>|<\/svg>$/gi, '');

  let layoutContent = '';

  // 1. Center Hero Layout
  if (options.layout === 'center-hero' || options.layout === 'store-spotlight') {
    layoutContent = `
      <!-- Ambient Glow Orb -->
      ${options.showGlowEffect ? `
        <circle cx="512" cy="230" r="220" fill="${accentGlow}" opacity="0.35" filter="url(#fg_blur)" />
      ` : ''}

      <!-- Center Logo Box with 3D Drop Shadow -->
      <g transform="translate(412, 60)" filter="url(#fg_shadow)">
        <rect width="200" height="200" rx="44" fill="none" />
        <g transform="scale(0.390625)">
          ${innerSvgContent}
        </g>
      </g>

      <!-- Badge Pill -->
      ${badgeText ? `
        <g transform="translate(512, 290)">
          <rect x="-130" y="0" width="260" height="32" rx="16" fill="${cardBg}" stroke="${cardBorder}" stroke-width="1.5" />
          <text x="0" y="21" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="${textColor}" letter-spacing="0.5">
            ${escapeXml(badgeText)}
          </text>
        </g>
      ` : ''}

      <!-- Title & Subtitle -->
      <text x="512" y="375" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="900" fill="${textColor}" letter-spacing="-0.5" filter="url(#fg_subtle_shadow)">
        ${escapeXml(title)}
      </text>

      <text x="512" y="420" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="500" fill="${subtextColor}" max-width="700">
        ${escapeXml(subtitle)}
      </text>


    `;
  } 
  // 2. Split Showcase Layout (Phone on Side + Hero Typography)
  else if (options.layout === 'split-phone') {
    layoutContent = `
      <!-- Left Side Text & Callouts -->
      <g transform="translate(80, 110)">
        <!-- Pill Badge -->
        <rect x="0" y="0" width="220" height="30" rx="15" fill="${cardBg}" stroke="${cardBorder}" stroke-width="1.5" />
        <text x="110" y="20" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="${textColor}">
          ${escapeXml(badgeText)}
        </text>

        <!-- Big Bold Title -->
        <text x="0" y="85" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="900" fill="${textColor}" letter-spacing="-1">
          ${escapeXml(title)}
        </text>

        <!-- Subtitle -->
        <text x="0" y="130" font-family="system-ui, sans-serif" font-size="20" font-weight="500" fill="${subtextColor}">
          ${escapeXml(subtitle)}
        </text>


      </g>

      <!-- Right Side 3D Smartphone Device Mockup Frame -->
      <g transform="translate(680, 45)" filter="url(#fg_shadow)">
        <!-- Phone Outer Body -->
        <rect width="250" height="420" rx="36" fill="#0f172a" stroke="#334155" stroke-width="4" />
        <!-- Screen Area -->
        <rect x="8" y="8" width="234" height="404" rx="28" fill="${options.bgTheme === 'light' ? '#ffffff' : '#020617'}" />
        <!-- Camera Island -->
        <rect x="95" y="16" width="60" height="12" rx="6" fill="#000000" />
        
        <!-- App Logo centered inside phone screen -->
        <g transform="translate(45, 90)">
          <g transform="scale(0.3125)">
            ${innerSvgContent}
          </g>
        </g>
        
        <!-- Mini UI lines inside screen -->
        <rect x="35" y="270" width="180" height="16" rx="8" fill="${cardBorder}" />
        <rect x="55" y="296" width="140" height="10" rx="5" fill="${cardBorder}" opacity="0.6" />
        <rect x="35" y="340" width="180" height="36" rx="18" fill="${accentGlow}" />
        <text x="125" y="363" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#ffffff">
          INSTALL NOW
        </text>
      </g>
    `;
  }
  // 3. Arabesque / Islamic Geometric Pattern Layout
  else if (options.layout === 'arabesque') {
    layoutContent = `
      <!-- Arabesque Repeating Pattern Overlay -->
      <g opacity="0.15">
        <pattern id="fg_arabesque" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 80 40 L 40 80 L 0 40 Z" fill="none" stroke="currentColor" stroke-width="2" />
          <circle cx="40" cy="40" r="18" fill="none" stroke="currentColor" stroke-width="1.5" />
          <path d="M 0 0 L 80 80 M 80 0 L 0 80" stroke="currentColor" stroke-width="1" />
        </pattern>
        <rect width="1024" height="500" fill="url(#fg_arabesque)" />
      </g>

      <!-- Center Glow -->
      <circle cx="512" cy="210" r="180" fill="${accentGlow}" opacity="0.3" filter="url(#fg_blur)" />

      <!-- Center Shield / Icon -->
      <g transform="translate(412, 50)" filter="url(#fg_shadow)">
        <g transform="scale(0.390625)">
          ${innerSvgContent}
        </g>
      </g>

      <!-- Islamic Ribbon Accent -->
      <g transform="translate(512, 285)">
        <path d="M -140 0 L 140 0 L 125 28 L -125 28 Z" fill="${cardBg}" stroke="${cardBorder}" stroke-width="1.5" />
        <text x="0" y="20" text-anchor="middle" font-family="'Cairo', 'Tajawal', system-ui, sans-serif" font-size="13" font-weight="700" fill="${textColor}">
          ${escapeXml(badgeText)}
        </text>
      </g>

      <!-- Arabic & English Title -->
      <text x="512" y="375" text-anchor="middle" font-family="'Cairo', 'Tajawal', system-ui, sans-serif" font-size="46" font-weight="900" fill="${textColor}">
        ${escapeXml(title)}
      </text>

      <text x="512" y="420" text-anchor="middle" font-family="'Cairo', 'Tajawal', system-ui, sans-serif" font-size="18" font-weight="600" fill="${subtextColor}">
        ${escapeXml(subtitle)}
      </text>
    `;
  }
  // 4. Mesh Gradient / Minimal Luxury
  else {
    layoutContent = `
      <!-- Abstract Floating Glow Spheres -->
      <circle cx="200" cy="150" r="180" fill="${accentGlow}" opacity="0.25" filter="url(#fg_blur)" />
      <circle cx="850" cy="380" r="220" fill="${accentGlow}" opacity="0.2" filter="url(#fg_blur)" />

      <!-- Centered Glass Card -->
      <g transform="translate(162, 50)" filter="url(#fg_shadow)">
        <rect width="700" height="400" rx="32" fill="${cardBg}" stroke="${cardBorder}" stroke-width="2" />
        
        <!-- Logo inside Glass Card -->
        <g transform="translate(270, 30)">
          <g transform="scale(0.3125)">
            ${innerSvgContent}
          </g>
        </g>

        <!-- Pill -->
        <g transform="translate(350, 210)">
          <rect x="-100" y="0" width="200" height="26" rx="13" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" />
          <text x="0" y="18" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="${textColor}">
            ${escapeXml(badgeText)}
          </text>
        </g>

        <!-- Title -->
        <text x="350" y="280" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="40" font-weight="900" fill="${textColor}">
          ${escapeXml(title)}
        </text>

        <!-- Subtitle -->
        <text x="350" y="320" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="500" fill="${subtextColor}">
          ${escapeXml(subtitle)}
        </text>

      </g>
    `;
  }

  return namespaceSvgIds(`
<svg class="artboard-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    ${bgGradDef}
    <filter id="fg_shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.45" />
    </filter>
    <filter id="fg_subtle_shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.35" />
    </filter>
    <filter id="fg_blur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="60" />
    </filter>
  </defs>

  <!-- Background Base Canvas 1024x500 -->
  <rect width="${w}" height="${h}" fill="url(#fg_bgGrad)" />

  <!-- Layout Elements -->
  ${layoutContent}
</svg>
`.trim(), nextRenderId());
}

export const SOCIAL_MEDIA_PRESETS: SocialMediaPreset[] = [
  // 1:1 Profile Avatars
  {
    id: 'instagram-avatar',
    platform: 'instagram',
    ratio: '1:1',
    type: 'profile',
    nameAr: 'صورة ملف إنستغرام الشخصي',
    nameEn: 'Instagram Profile Picture',
    width: 1080,
    height: 1080,
    cropStyle: 'circle',
    descriptionAr: 'دقة عالية فائقة الوضوح 1080×1080 مع معاينة القص الدائري',
    descriptionEn: 'Ultra HD 1080×1080 px with circular avatar crop preview',
  },
  {
    id: 'twitter-avatar',
    platform: 'twitter',
    ratio: '1:1',
    type: 'profile',
    nameAr: 'أيقونة حساب منصة X (تويتر)',
    nameEn: 'X / Twitter Profile Avatar',
    width: 400,
    height: 400,
    cropStyle: 'circle',
    descriptionAr: 'المقاس الرسمي الموصى به 400×400 بكسل',
    descriptionEn: 'Official recommended size 400×400 px',
  },
  {
    id: 'youtube-avatar',
    platform: 'youtube',
    ratio: '1:1',
    type: 'profile',
    nameAr: 'شعار / أيقونة قناة يوتيوب',
    nameEn: 'YouTube Channel Icon',
    width: 800,
    height: 800,
    cropStyle: 'circle',
    descriptionAr: 'المقاس القياسي لقنوات يوتيوب 800×800 بكسل',
    descriptionEn: 'Standard YouTube channel avatar 800×800 px',
  },
  {
    id: 'linkedin-avatar',
    platform: 'linkedin',
    ratio: '1:1',
    type: 'profile',
    nameAr: 'صورة لينكد إن للشركات والأفراد',
    nameEn: 'LinkedIn Profile / Company Logo',
    width: 400,
    height: 400,
    cropStyle: 'rounded',
    descriptionAr: 'مقاس شعار الشركات والصفحات الرسمية 400×400',
    descriptionEn: 'Standard company logo & profile 400×400 px',
  },
  {
    id: 'facebook-avatar',
    platform: 'facebook',
    ratio: '1:1',
    type: 'profile',
    nameAr: 'صورة الملف الشخصي لفيسبوك',
    nameEn: 'Facebook Profile Picture',
    width: 500,
    height: 500,
    cropStyle: 'circle',
    descriptionAr: 'المقاس الموصى به لصفحات فيسبوك 500×500 بكسل',
    descriptionEn: 'Recommended size for Facebook pages 500×500 px',
  },
  {
    id: 'discord-avatar',
    platform: 'discord',
    ratio: '1:1',
    type: 'profile',
    nameAr: 'أيقونة سيرفر وحساب Discord',
    nameEn: 'Discord Server & User Avatar',
    width: 512,
    height: 512,
    cropStyle: 'circle',
    descriptionAr: 'دقة نقية لسيرفرات الديسكورد 512×512 بكسل',
    descriptionEn: 'Crisp resolution for Discord servers 512×512 px',
  },
  {
    id: 'tiktok-avatar',
    platform: 'tiktok',
    ratio: '1:1',
    type: 'profile',
    nameAr: 'صورة حساب تيك توك',
    nameEn: 'TikTok Profile Avatar',
    width: 500,
    height: 500,
    cropStyle: 'circle',
    descriptionAr: 'مقاس الصورة الشخصية لتيك توك 500×500',
    descriptionEn: 'TikTok recommended profile size 500×500 px',
  },
  {
    id: 'instagram-post',
    platform: 'instagram',
    ratio: '1:1',
    type: 'post',
    nameAr: 'منشور إنستغرام المربع (1:1 Post)',
    nameEn: 'Instagram Square Post (1:1)',
    width: 1080,
    height: 1080,
    cropStyle: 'square',
    descriptionAr: 'منشور مربع للعلامة التجارية 1080×1080',
    descriptionEn: 'Square feed post with brand logo 1080×1080 px',
  },

  // 16:9 and Cover Banners
  {
    id: 'youtube-banner-16-9',
    platform: 'youtube',
    ratio: '16:9',
    type: 'banner',
    nameAr: 'غلاف / بانر قناة يوتيوب (16:9)',
    nameEn: 'YouTube Channel Header (16:9)',
    width: 2560,
    height: 1440,
    cropStyle: 'rounded',
    descriptionAr: 'دقة 2560×1440 مع المنطقة الآمنة للهاتف 1546×423',
    descriptionEn: '2560×1440 px with 1546×423 px safe center area',
    safeZoneGuide: 'Safe Zone: 1546×423 px',
  },
  {
    id: 'youtube-thumbnail-16-9',
    platform: 'youtube',
    ratio: '16:9',
    type: 'banner',
    nameAr: 'صورة مصغرة / بانر Full HD (16:9)',
    nameEn: 'Full HD Thumbnail & Banner (16:9)',
    width: 1920,
    height: 1080,
    cropStyle: 'rounded',
    descriptionAr: 'الدقة الذهبية لشاشات 1080p بمقاس 1920×1080',
    descriptionEn: 'Golden 1080p ratio 1920×1080 px',
  },
  {
    id: 'twitter-header',
    platform: 'twitter',
    ratio: '3:1',
    type: 'banner',
    nameAr: 'غلاف حساب منصة X / تويتر',
    nameEn: 'X / Twitter Header Cover',
    width: 1500,
    height: 500,
    cropStyle: 'rounded',
    descriptionAr: 'المقاس القياسي لغلاف تويتر 1500×500 (نسبة 3:1)',
    descriptionEn: 'Official standard header size 1500×500 px (3:1 ratio)',
  },
  {
    id: 'linkedin-banner',
    platform: 'linkedin',
    ratio: '4:1',
    type: 'banner',
    nameAr: 'غلاف صفحة شركة LinkedIn',
    nameEn: 'LinkedIn Company Cover Banner',
    width: 1584,
    height: 396,
    cropStyle: 'rounded',
    descriptionAr: 'المقاس الرسمي لصفحات الأعمال في لينكد إن 1584×396',
    descriptionEn: 'Official LinkedIn company banner 1584×396 px (4:1 ratio)',
  },
  {
    id: 'facebook-cover-16-9',
    platform: 'facebook',
    ratio: '16:9',
    type: 'banner',
    nameAr: 'غلاف صفحة فيسبوك الحديث (16:9)',
    nameEn: 'Facebook Page Cover (16:9)',
    width: 1200,
    height: 675,
    cropStyle: 'rounded',
    descriptionAr: 'مقاس غلاف فيسبوك المتجاوب 1200×675 بكسل',
    descriptionEn: 'Responsive Facebook cover 1200×675 px (16:9 ratio)',
  },
  {
    id: 'twitch-banner-16-9',
    platform: 'general',
    ratio: '16:9',
    type: 'banner',
    nameAr: 'بانر Twitch / Discord (16:9)',
    nameEn: 'Twitch / Discord Banner (16:9)',
    width: 1920,
    height: 1080,
    cropStyle: 'rounded',
    descriptionAr: 'بانر عريض للبث المباشر والمجتمعات 1920×1080',
    descriptionEn: 'Wide stream & community banner 1920×1080 px',
  },
];

/**
 * Generates an ultra-crisp responsive Social Media Banner SVG (16:9, 3:1, 4:1, or 1:1)
 */
export function generateSocialBannerSvg(
  config: LogoConfig,
  options: SocialBannerOptions,
  width: number,
  height: number
): string {
  const w = width;
  const h = height;
  const logoSvg = generateSvgString(config, 512);

  // Background Theme Gradients
  let bgGradDef = '';
  let textColor = '#ffffff';
  let subtextColor = '#cbd5e1';
  let cardBg = 'rgba(255, 255, 255, 0.1)';
  let cardBorder = 'rgba(255, 255, 255, 0.2)';
  let accentGlow = config.bgColor1 || '#6366f1';

  switch (options.bgTheme) {
    case 'brand': {
      const c1 = options.customBgColor1 || config.bgColor1 || '#4f46e5';
      const c2 = options.customBgColor2 || config.bgColor2 || '#06b6d4';
      bgGradDef = `<linearGradient id="sb_bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="100%" stop-color="${c2}" />
      </linearGradient>`;
      accentGlow = c1;
      break;
    }
    case 'sunset': {
      bgGradDef = `<linearGradient id="sb_bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f43f5e" />
        <stop offset="50%" stop-color="#fb923c" />
        <stop offset="100%" stop-color="#f59e0b" />
      </linearGradient>`;
      accentGlow = '#f59e0b';
      break;
    }
    case 'emerald': {
      bgGradDef = `<linearGradient id="sb_bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#064e3b" />
        <stop offset="50%" stop-color="#059669" />
        <stop offset="100%" stop-color="#10b981" />
      </linearGradient>`;
      accentGlow = '#10b981';
      break;
    }
    case 'cyberpunk': {
      bgGradDef = `<linearGradient id="sb_bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#180828" />
        <stop offset="50%" stop-color="#4c1d95" />
        <stop offset="100%" stop-color="#ec4899" />
      </linearGradient>`;
      accentGlow = '#ec4899';
      break;
    }
    case 'youtube-red': {
      bgGradDef = `<linearGradient id="sb_bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1a0003" />
        <stop offset="40%" stop-color="#450a0a" />
        <stop offset="100%" stop-color="#991b1b" />
      </linearGradient>`;
      accentGlow = '#ef4444';
      break;
    }
    case 'royal-gold': {
      bgGradDef = `<linearGradient id="sb_bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f0c05" />
        <stop offset="50%" stop-color="#2a2007" />
        <stop offset="100%" stop-color="#45340a" />
      </linearGradient>`;
      accentGlow = '#eab308';
      break;
    }
    case 'dark': {
      bgGradDef = `<linearGradient id="sb_bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#030712" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>`;
      accentGlow = '#38bdf8';
      break;
    }
    case 'light': {
      bgGradDef = `<linearGradient id="sb_bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#f1f5f9" />
      </linearGradient>`;
      textColor = '#0f172a';
      subtextColor = '#475569';
      cardBg = 'rgba(255, 255, 255, 0.9)';
      cardBorder = 'rgba(0, 0, 0, 0.08)';
      accentGlow = '#6366f1';
      break;
    }
    case 'transparent': {
      bgGradDef = '';
      break;
    }
  }

  const title = options.title || config.text || config.name || 'Brand Name';
  const subtitle = options.subtitle || config.tagline || '';
  // Empty unless the user typed it. A badge, a handle or an upload schedule
  // invented here would be printed onto an asset as if it were true.
  const badgeText = (options.badgeText || '').trim();
  const channelHandle = (options.channelHandle || '').trim();
  const uploadSchedule = (options.uploadSchedule || '').trim();

  // Extract inner SVG content (strip outer <svg> tags)
  const innerSvgContent = logoSvg.replace(/^<svg[^>]*>|<\/svg>$/gi, '');

  // Calculate dynamic responsive scale
  const minDimension = Math.min(w, h);
  const logoTargetSize = minDimension * 0.42;
  const logoScale = logoTargetSize / 512;
  const logoHalfSize = logoTargetSize / 2;

  let layoutContent = '';

  // 1. Center Hero Layout
  if (options.layout === 'center-hero' || options.layout === 'brand-luxury') {
    const cx = w / 2;
    const cy = h / 2;
    const logoY = h > 800 ? cy - logoHalfSize - 80 : cy - logoHalfSize - 40;

    layoutContent = `
      <!-- Ambient Glow Orbs -->
      ${options.showGlowEffect ? `
        <circle cx="${cx}" cy="${cy - 30}" r="${minDimension * 0.4}" fill="${accentGlow}" opacity="0.3" filter="url(#sb_blur)" />
      ` : ''}

      <!-- Center Logo Container -->
      <g transform="translate(${cx - logoHalfSize}, ${Math.max(40, logoY)})" filter="url(#sb_shadow)">
        <g transform="scale(${logoScale})">
          ${innerSvgContent}
        </g>
      </g>

      <!-- Badge Pill -->
      ${options.showBadge && badgeText ? `
        <g transform="translate(${cx}, ${Math.max(60, logoY + logoTargetSize + 30)})">
          <rect x="-140" y="-16" width="280" height="32" rx="16" fill="${cardBg}" stroke="${cardBorder}" stroke-width="1.5" />
          <text x="0" y="5" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.max(12, Math.min(16, w * 0.015))}" font-weight="700" fill="${textColor}" letter-spacing="1">
            ${escapeXml(badgeText)}
          </text>
        </g>
      ` : ''}

      <!-- Title & Subtitle -->
      <text x="${cx}" y="${Math.min(h - 80, logoY + logoTargetSize + (options.showBadge && badgeText ? 95 : 65))}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.max(24, Math.min(68, w * 0.042))}" font-weight="900" fill="${textColor}" letter-spacing="-0.5" filter="url(#sb_subtle_shadow)">
        ${escapeXml(title)}
      </text>

      <text x="${cx}" y="${Math.min(h - 40, logoY + logoTargetSize + (options.showBadge && badgeText ? 145 : 115))}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.max(14, Math.min(26, w * 0.018))}" font-weight="500" fill="${subtextColor}">
        ${escapeXml(subtitle)}
      </text>
    `;
  }
  // 2. YouTube Channel Specific Layout (Strictly inside safe area)
  else if (options.layout === 'youtube-channel') {
    const cx = w / 2;
    const cy = h / 2;
    const avatarSize = Math.min(180, h * 0.28);
    const avatarScale = avatarSize / 512;
    const avatarHalf = avatarSize / 2;

    layoutContent = `
      ${options.showGlowEffect ? `
        <circle cx="${cx - 280}" cy="${cy}" r="${minDimension * 0.35}" fill="${accentGlow}" opacity="0.35" filter="url(#sb_blur)" />
        <circle cx="${cx + 280}" cy="${cy}" r="${minDimension * 0.3}" fill="${accentGlow}" opacity="0.2" filter="url(#sb_blur)" />
      ` : ''}

      <!-- Central Safe-Area Container -->
      <g transform="translate(${cx - 500}, ${cy - avatarHalf})">
        <!-- Channel Avatar with Circular Stroke -->
        <g transform="translate(0, 0)" filter="url(#sb_shadow)">
          <circle cx="${avatarHalf}" cy="${avatarHalf}" r="${avatarHalf + 4}" fill="${accentGlow}" opacity="0.4" />
          <g transform="scale(${avatarScale})">
            ${innerSvgContent}
          </g>
        </g>

        <!-- Channel Info Block -->
        <g transform="translate(${avatarSize + 40}, ${avatarHalf - 30})">
          <!-- Title -->
          <g transform="translate(0, 0)">
            <text x="0" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.max(28, Math.min(54, w * 0.03))}" font-weight="900" fill="${textColor}" letter-spacing="-0.5">
              ${escapeXml(title)}
            </text>
          </g>

          <!-- Handle & Upload Schedule -->
          <text x="0" y="32" font-family="system-ui, sans-serif" font-size="${Math.max(13, Math.min(20, w * 0.012))}" font-weight="600" fill="${subtextColor}">
            ${escapeXml([channelHandle, uploadSchedule].filter(Boolean).join(' • '))}
          </text>

          <!-- Tagline -->
          <text x="0" y="62" font-family="system-ui, sans-serif" font-size="${Math.max(12, Math.min(17, w * 0.01))}" font-weight="400" fill="${subtextColor}" opacity="0.85">
            ${escapeXml(subtitle)}
          </text>
        </g>

      </g>
    `;
  }
  // 3. Split Hero (Left logo, Right text)
  else if (options.layout === 'split-hero' || options.layout === 'streamer-gamer') {
    const isWide = w / h >= 2;
    const logoX = isWide ? w * 0.12 : w * 0.08;
    const cy = h / 2;
    const textX = isWide ? w * 0.42 : w * 0.45;

    layoutContent = `
      ${options.showGlowEffect ? `
        <circle cx="${logoX + logoHalfSize}" cy="${cy}" r="${minDimension * 0.45}" fill="${accentGlow}" opacity="0.3" filter="url(#sb_blur)" />
      ` : ''}

      <!-- Left Logo -->
      <g transform="translate(${logoX}, ${cy - logoHalfSize})" filter="url(#sb_shadow)">
        <g transform="scale(${logoScale})">
          ${innerSvgContent}
        </g>
      </g>

      <!-- Right Typography Group -->
      <g transform="translate(${textX}, ${cy})">
        ${options.showBadge && badgeText ? `
          <rect x="0" y="-85" width="220" height="28" rx="14" fill="${cardBg}" stroke="${cardBorder}" stroke-width="1.5" />
          <text x="110" y="-66" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${Math.max(11, Math.min(14, w * 0.012))}" font-weight="700" fill="${textColor}">
            ${escapeXml(badgeText)}
          </text>
        ` : ''}

        <text x="0" y="-15" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.max(26, Math.min(64, w * 0.04))}" font-weight="900" fill="${textColor}" letter-spacing="-1">
          ${escapeXml(title)}
        </text>

        <text x="0" y="32" font-family="system-ui, sans-serif" font-size="${Math.max(14, Math.min(24, w * 0.016))}" font-weight="500" fill="${subtextColor}">
          ${escapeXml(subtitle)}
        </text>

      </g>
    `;
  }
  // 4. Minimal Clean / Center Monogram
  else {
    const cx = w / 2;
    const cy = h / 2;
    layoutContent = `
      <circle cx="${cx}" cy="${cy}" r="${minDimension * 0.35}" fill="${accentGlow}" opacity="0.2" filter="url(#sb_blur)" />
      
      <g transform="translate(${cx - logoHalfSize}, ${cy - logoHalfSize})" filter="url(#sb_shadow)">
        <g transform="scale(${logoScale})">
          ${innerSvgContent}
        </g>
      </g>
    `;
  }

  // Safe Zone Guide Overlay
  let safeZoneOverlay = '';
  if (options.showSafeZone) {
    if (w === 2560 && h === 1440) {
      // YouTube Full TV (2560x1440), Desktop (2560x423), Tablet (1855x423), Mobile (1546x423)
      const szMobileW = 1546;
      const szDesktopH = 423;
      const szY = (h - szDesktopH) / 2;
      const szMobileX = (w - szMobileW) / 2;
      const szTabletW = 1855;
      const szTabletX = (w - szTabletW) / 2;

      safeZoneOverlay = `
        <!-- Desktop safe strip -->
        <rect x="0" y="${szY}" width="${w}" height="${szDesktopH}" fill="none" stroke="#60a5fa" stroke-width="2" stroke-dasharray="10 5" opacity="0.7" />
        <text x="30" y="${szY + 30}" font-family="sans-serif" font-size="16" font-weight="700" fill="#60a5fa">
          Desktop View Area (2560 × 423)
        </text>

        <!-- Tablet safe box -->
        <rect x="${szTabletX}" y="${szY}" width="${szTabletW}" height="${szDesktopH}" fill="none" stroke="#a78bfa" stroke-width="2" stroke-dasharray="8 4" opacity="0.8" />
        <text x="${szTabletX + 20}" y="${szY + 30}" font-family="sans-serif" font-size="16" font-weight="700" fill="#a78bfa">
          Tablet Safe (1855 × 423)
        </text>

        <!-- Guaranteed Mobile Safe Area (1546 x 423) -->
        <rect x="${szMobileX}" y="${szY}" width="${szMobileW}" height="${szDesktopH}" fill="rgba(225, 29, 72, 0.08)" stroke="#e11d48" stroke-width="4" stroke-dasharray="14 6" />
        <rect x="${szMobileX}" y="${szY - 38}" width="380" height="34" rx="8" fill="#e11d48" />
        <text x="${szMobileX + 16}" y="${szY - 15}" font-family="monospace" font-size="15" font-weight="900" fill="#ffffff">
          ▪ Mobile Safe Zone (1546 × 423)
        </text>
      `;
    } else {
      safeZoneOverlay = `
        <rect x="${w * 0.08}" y="${h * 0.1}" width="${w * 0.84}" height="${h * 0.8}" fill="none" stroke="#e11d48" stroke-width="3" stroke-dasharray="12 6" opacity="0.8" />
      `;
    }
  }

  return namespaceSvgIds(`
<svg class="artboard-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    ${bgGradDef}
    <filter id="sb_shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.4" />
    </filter>
    <filter id="sb_subtle_shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="#000000" flood-opacity="0.3" />
    </filter>
    <filter id="sb_blur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="70" />
    </filter>
  </defs>

  <!-- Background Base Canvas -->
  ${options.bgTheme === 'transparent' ? '' : `<rect width="${w}" height="${h}" fill="url(#sb_bgGrad)" />`}

  <!-- Layout Elements -->
  ${layoutContent}

  <!-- Safe Zone Visualizer -->
  ${safeZoneOverlay}
</svg>
`.trim(), nextRenderId());
}

/**
 * Dedicated YouTube Creator Kit Exporter
 */
export async function generateYouTubeKitZip(
  config: LogoConfig,
  bannerOptions: SocialBannerOptions
): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

  const brandName = config.text || config.name || 'YouTube_Channel';

  // Documentation file
  zip.file(
    'README_YOUTUBE_CREATOR_GUIDE.txt',
    `=============================================================
  ${brandName} - YouTube Channel Branding & Asset Pack
  Generated by Logo & Favicon Studio PRO
=============================================================

📐 YOUTUBE OFFICIAL DIMENSION SPECS (2026 Standards):

1. YouTube Channel Banner (Cover Art):
   - Optimal File: 01_youtube_channel_banner_2560x1440.png
   - Canvas Resolution: 2560 x 1440 pixels (16:9 Aspect Ratio)
   - Mobile Safe Area: 1546 x 423 pixels (Guaranteed visible across all smartphones)
   - Tablet Safe Band: 1855 x 423 pixels
   - Desktop Safe Band: 2560 x 423 pixels
   - TV Display: Full 2560 x 1440 canvas

2. YouTube Profile Avatar (Channel Icon):
   - File: 03_youtube_profile_avatar_800x800.png
   - Resolution: 800 x 800 pixels (1:1 Ratio, auto-cropped to circle on YouTube)

3. YouTube Video Branding Watermark:
   - File: 04_youtube_video_watermark_150x150.png
   - Resolution: 150 x 150 pixels (Displays in bottom-right of your videos)

4. YouTube Video HD Thumbnail:
   - File: 05_youtube_video_thumbnail_1280x720.png
   - Resolution: 1280 x 720 pixels (Standard 16:9 HD Thumbnail)

5. Scalable Vector Master:
   - File: 06_youtube_banner_master.svg
   - Lossless infinite resolution vector source

Upload directly via YouTube Studio -> Customization -> Branding.
`
  );

  // 1. YouTube Banner (2560 x 1440)
  const bannerSvgClean = generateSocialBannerSvg(
    config,
    { ...bannerOptions, showSafeZone: false },
    2560,
    1440
  );
  const bannerBlob = await rasterizeSvg(bannerSvgClean, 2560, 1440, 'png');
  zip.file('01_youtube_channel_banner_2560x1440.png', bannerBlob);

  // 2. YouTube Banner with Safe Zones guide
  const bannerSvgGuide = generateSocialBannerSvg(
    config,
    { ...bannerOptions, showSafeZone: true },
    2560,
    1440
  );
  const bannerGuideBlob = await rasterizeSvg(bannerSvgGuide, 2560, 1440, 'png');
  zip.file('02_youtube_banner_with_safezones_2560x1440.png', bannerGuideBlob);

  // 3. YouTube Avatar (800 x 800)
  const avatarSvg = generateSvgString(config, 800);
  const avatarBlob = await renderSvgToBlob(avatarSvg, 800, 'png');
  zip.file('03_youtube_profile_avatar_800x800.png', avatarBlob);

  // 4. Video Watermark (150 x 150)
  const watermarkBlob = await renderSvgToBlob(avatarSvg, 150, 'png');
  zip.file('04_youtube_video_watermark_150x150.png', watermarkBlob);

  // 5. Video Thumbnail (1280 x 720)
  const thumbSvg = generateSocialBannerSvg(
    config,
    { ...bannerOptions, showSafeZone: false },
    1280,
    720
  );
  const thumbBlob = await rasterizeSvg(thumbSvg, 1280, 720, 'png');
  zip.file('05_youtube_video_thumbnail_1280x720.png', thumbBlob);

  // 6. Vector Master SVG
  zip.file('06_youtube_banner_master.svg', await embedFontsInSvg(bannerSvgClean));

  return await zip.generateAsync({ type: 'blob' });
}


/**
 * Generates full Social Media Kit ZIP package with organized folders
 */
export async function generateSocialMediaKitZip(
  config: LogoConfig,
  bannerOptions: SocialBannerOptions
): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

  const avatarFolder = zip.folder('01_Profile_Pictures_1x1');
  const bannerFolder = zip.folder('02_Banners_and_Covers_16x9');

  // Readme guide
  zip.file(
    'README_SOCIAL_KIT.txt',
    `=========================================
  ${config.text || config.name || 'Brand'} - Complete Social Media Design Kit
  Generated by Logo & Favicon Studio PRO
=========================================

Included in this package:

[Folder: 01_Profile_Pictures_1x1]
- instagram_profile_1080x1080.png : Instagram Profile Avatar & Square Post
- twitter_x_profile_400x400.png    : X (Twitter) Profile Picture
- youtube_channel_icon_800x800.png : YouTube Channel Avatar
- linkedin_company_400x400.png     : LinkedIn Company Page Logo
- facebook_profile_500x500.png     : Facebook Profile Photo
- discord_server_512x512.png       : Discord Avatar & Server Icon
- tiktok_avatar_500x500.png        : TikTok Profile Photo
- vector_master_1x1.svg            : High-Res Scalable Vector Master

[Folder: 02_Banners_and_Covers_16x9]
- youtube_channel_header_2560x1440.png : YouTube Channel Banner (16:9 with safe zone)
- fullhd_banner_1920x1080.png          : Universal 16:9 Landscape Banner / Thumbnail
- twitter_x_header_1500x500.png        : X (Twitter) 3:1 Header Cover
- linkedin_company_banner_1584x396.png : LinkedIn 4:1 Company Banner
- facebook_cover_1200x675.png          : Facebook Page 16:9 Cover
- twitch_discord_banner_1920x1080.png  : Twitch / Discord Stream Banner
- banner_master_16x9.svg               : Scalable Vector 16:9 Banner Master
`
  );

  const baseSvg = generateSvgString(config, 512);

  // 1. Process 1:1 Profile Pictures
  const profilePresets = SOCIAL_MEDIA_PRESETS.filter((p) => p.ratio === '1:1');
  for (const preset of profilePresets) {
    const pngBlob = await renderSvgToBlob(baseSvg, preset.width, 'png');
    if (avatarFolder) {
      avatarFolder.file(`${preset.id}_${preset.width}x${preset.height}.png`, pngBlob);
    }
  }
  if (avatarFolder) {
    avatarFolder.file('vector_master_1x1.svg', await embedFontsInSvg(baseSvg));
  }

  // 2. Process Banners and Covers (16:9, 3:1, 4:1)
  const bannerPresets = SOCIAL_MEDIA_PRESETS.filter((p) => p.type === 'banner');
  for (const preset of bannerPresets) {
    const bannerSvg = generateSocialBannerSvg(
      config,
      { ...bannerOptions, showSafeZone: false },
      preset.width,
      preset.height
    );
    const pngBlob = await rasterizeSvg(bannerSvg, preset.width, preset.height, 'png');
    if (bannerFolder) {
      bannerFolder.file(`${preset.id}_${preset.width}x${preset.height}.png`, pngBlob);
    }
  }

  // Add 16:9 vector master
  const bannerMasterSvg = generateSocialBannerSvg(
    config,
    { ...bannerOptions, showSafeZone: false },
    1920,
    1080
  );
  if (bannerFolder) {
    bannerFolder.file('banner_master_16x9.svg', await embedFontsInSvg(bannerMasterSvg));
  }

  return await zip.generateAsync({ type: 'blob' });
}

// Downloads live in ./download — re-exported here so existing imports keep working.
export { downloadBlob, downloadText, downloadSvg } from './download';


