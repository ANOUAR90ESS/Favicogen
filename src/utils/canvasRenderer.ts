import JSZip from 'jszip';
import { LogoConfig, FaviconSpec, ShapeMask } from '../types';
import { ICON_LIBRARY } from './iconLibrary';

export const FAVICON_SPECS: FaviconSpec[] = [
  {
    size: 16,
    fileName: 'favicon-16x16.png',
    format: 'png',
    label: '16x16 px',
    description: 'أيقونة التبويب القياسية للمتصفحات (Standard Browser Tab)',
    isFaviconStandard: true,
  },
  {
    size: 32,
    fileName: 'favicon-32x32.png',
    format: 'png',
    label: '32x32 px',
    description: 'أيقونة التبويب للشاشات عالية الدقة ريتينا (Retina Display Tab)',
    isFaviconStandard: true,
  },
  {
    size: 48,
    fileName: 'favicon-48x48.png',
    format: 'png',
    label: '48x48 px',
    description: 'شريط المهام وسطح المكتب (Desktop & Taskbar)',
    isFaviconStandard: true,
  },
  {
    size: 64,
    fileName: 'favicon-64x64.png',
    format: 'png',
    label: '64x64 px',
    description: 'أيقونة المواقع والتطبيقات المفضلة (High-res Browser Favorite)',
    isFaviconStandard: true,
  },
  {
    size: 128,
    fileName: 'favicon-128x128.png',
    format: 'png',
    label: '128x128 px',
    description: 'متجر جوجل كروم وتطبيقات الويب (Chrome Web Store)',
  },
  {
    size: 180,
    fileName: 'apple-touch-icon.png',
    format: 'png',
    label: '180x180 px',
    description: 'شاشة الآيفون والآيباد الرئيسية (Apple iOS Touch Icon)',
    isAppleTouch: true,
  },
  {
    size: 192,
    fileName: 'android-chrome-192x192.png',
    format: 'png',
    label: '192x192 px',
    description: 'تطبيقات الأندرويد وPWA (Android Chrome Standard)',
    isAndroidChrome: true,
    isPWA: true,
  },
  {
    size: 256,
    fileName: 'android-chrome-256x256.png',
    format: 'png',
    label: '256x256 px',
    description: 'أيقونات ويندوز والتطبيقات المتوسطة (Windows Tile & Medium App)',
    isAndroidChrome: true,
  },
  {
    size: 512,
    fileName: 'android-chrome-512x512.png',
    format: 'png',
    label: '512x512 px',
    description: 'شاشة البداية للتطبيقات وPWA بدقة فائقة (PWA Splash & High-Res)',
    isAndroidChrome: true,
    isPWA: true,
  },
];

/**
 * Generates SVG Clip Path definition based on selected shape mask
 */
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
export function generateSvgString(config: LogoConfig, targetSize = 512): string {
  const s = 512; // Base coordinate space
  const iconItem = ICON_LIBRARY.find((i) => i.key === config.iconKey);
  const shapePath = getShapePathD(config.shapeMask, s, config.borderRadius);

  // Background Gradient / Pattern definitions
  const uid = config.id ? config.id.replace(/[^a-zA-Z0-9_-]/g, '') : 'main';
  const bgGradId = `bgGrad_${uid}`;
  const iconGradId = `iconGrad_${uid}`;
  const textGradId = `textGrad_${uid}`;
  const clipId = `maskClip_${uid}`;
  const imageClipId = `imageClip_${uid}`;
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
      <pattern id="pattern_dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="12" cy="12" r="2" fill="currentColor" fill-opacity="${config.patternOpacity || 0.15}" />
      </pattern>
    `;
  } else if (config.pattern === 'grid') {
    patternDef = `
      <pattern id="pattern_grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
        <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" stroke-width="1.2" stroke-opacity="${config.patternOpacity || 0.15}" />
      </pattern>
    `;
  } else if (config.pattern === 'stripes') {
    patternDef = `
      <pattern id="pattern_stripes" width="20" height="20" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="20" stroke="currentColor" stroke-width="3" stroke-opacity="${config.patternOpacity || 0.15}" />
      </pattern>
    `;
  } else if (config.pattern === 'waves') {
    patternDef = `
      <pattern id="pattern_waves" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
        <path d="M 0 10 Q 10 0, 20 10 T 40 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-opacity="${config.patternOpacity || 0.15}" />
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

  const brightnessScale = (imgF.brightness || 100) / 100;
  const contrastScale = (imgF.contrast || 100) / 100;
  const saturationScale = (imgF.saturation || 100) / 100;
  const hueDeg = imgF.hueRotate || 0;
  const blurVal = imgF.blur || 0;

  const imageFilterDef = `
    <filter id="${imageFilterId}">
      ${blurVal > 0 ? `<feGaussianBlur stdDeviation="${blurVal}" />` : ''}
      <feColorMatrix type="matrix" values="
        ${contrastScale * brightnessScale} 0 0 0 0
        0 ${contrastScale * brightnessScale} 0 0 0
        0 0 ${contrastScale * brightnessScale} 0 0
        0 0 0 1 0" />
      <feColorMatrix type="saturate" values="${saturationScale}" />
      ${hueDeg !== 0 ? `<feColorMatrix type="hueRotate" values="${hueDeg}" />` : ''}
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
        ${config.pattern !== 'none' ? `<rect width="${s}" height="${s}" fill="url(#pattern_${config.pattern})" color="#ffffff" />` : ''}
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
            href="${config.uploadedImageSrc}"
            x="${imgOffsetX}"
            y="${imgOffsetY}"
            width="${imgW}"
            height="${imgH}"
            preserveAspectRatio="xMidYMid slice"
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
          ${config.emojiChar}
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
        <text font-family="${config.fontFamily || 'Cairo'}, system-ui, sans-serif" font-size="${config.fontSize || 42}" font-weight="${config.fontWeight || 700}" fill="${textFill}" ${strokeAttr} ${shadowFilter} ${letterSpacing}>
          <textPath href="#${curvePathId}" startOffset="50%" text-anchor="middle">
            ${rawText}
          </textPath>
        </text>
      `;
    } else {
      const rot = config.textRotation ? `transform="rotate(${config.textRotation} ${textX} ${textY})"` : '';
      textElement = `
        <text x="${textX}" y="${textY}" text-anchor="${isIconLeft ? 'start' : 'middle'}" dominant-baseline="middle" font-family="${config.fontFamily || 'Cairo'}, system-ui, sans-serif" font-size="${config.fontSize || 42}" font-weight="${config.fontWeight || 700}" fill="${textFill}" ${strokeAttr} ${shadowFilter} ${letterSpacing} ${rot}>
          ${rawText}
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
      <text x="${taglineX}" y="${taglineY}" text-anchor="${isIconLeft ? 'start' : 'middle'}" dominant-baseline="middle" font-family="${config.taglineFontFamily || 'Tajawal'}, system-ui, sans-serif" font-size="${config.taglineFontSize || 18}" font-weight="${config.taglineFontWeight || 500}" fill="${config.taglineColor || '#94a3b8'}" ${tSpacing}>
        ${rawTagline}
      </text>
    `;
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${targetSize}" height="${targetSize}">
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
</svg>
`.trim();
}

/**
 * Renders an SVG string onto an HTML5 canvas at a specified size and returns a Blob
 */
export async function renderSvgToBlob(
  svgString: string,
  targetSize: number,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality = 0.95
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return reject(new Error('Canvas 2D context not available'));
    }

    // Enable high quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      ctx.clearRect(0, 0, targetSize, targetSize);
      ctx.drawImage(img, 0, 0, targetSize, targetSize);
      URL.revokeObjectURL(url);

      const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create canvas blob'));
        },
        mimeType,
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
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
<meta name="apple-mobile-web-app-title" content="${brandName}" />
<meta name="application-name" content="${brandName}" />
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

/**
 * Generates a full ready-to-use Favicon ZIP package
 */
export async function generateFaviconZip(config: LogoConfig): Promise<Blob> {
  const zip = new JSZip();
  const brandName = config.text || config.name || 'Brand';
  const themeColor = config.bgColor1 || '#0f172a';

  const svgString = generateSvgString(config, 512);

  // 1. Add SVG vector
  zip.file('favicon.svg', svgString);

  // 2. Add manifest.json & HTML snippet
  zip.file('site.webmanifest', generateWebmanifestJson(brandName, themeColor));
  zip.file('html-head-snippet.html', generateHtmlHeadSnippet(brandName, themeColor));
  zip.file(
    'README.txt',
    `=============================================================
 FAVICON & LOGO PACKAGE - حزمة الأيقونات والشعار المتكاملة
 Brand / اسم المشروع: ${brandName}
 Generated at: ${new Date().toLocaleString()}
=============================================================

1. Copy all image files and site.webmanifest into your public root folder.
2. Insert the code from 'html-head-snippet.html' inside the <head> of your index.html.

ملفات الحزمة المتوفرة:
- favicon.svg : الأيقونة المتجهة بدقة غير محدودة لجميع المتصفحات الحديثة.
- favicon.ico : الأيقونة القياسية متعددة المقاسات (16x16, 32x32, 48x48).
- favicon-16x16.png : مقاس التبويب القياسي.
- favicon-32x32.png : مقاس شاشات الريتينا.
- favicon-48x48.png : شريط المهام وسطح المكتب.
- apple-touch-icon.png (180x180) : شاشة هواتف آبل iOS Safari.
- android-chrome-192x192.png : أيقونة أندرويد و PWA.
- android-chrome-256x256.png : أيقونات ويندوز والأندرويد بدقة 256px.
- android-chrome-512x512.png : شاشة البداية Splash Screen لتطبيقات الويب.
- site.webmanifest : ملف التعريف لتطبيقات الويب التقدمية PWA.
`
  );

  // 3. Render all standard size PNGs
  const icoItems: { size: number; blob: Blob }[] = [];

  for (const spec of FAVICON_SPECS) {
    const pngBlob = await renderSvgToBlob(svgString, spec.size, 'png');
    zip.file(spec.fileName, pngBlob);

    if (spec.size === 16 || spec.size === 32 || spec.size === 48) {
      icoItems.push({ size: spec.size, blob: pngBlob });
    }
  }

  // 4. Generate multi-size favicon.ico
  try {
    const icoBlob = await createIcoFile(icoItems);
    zip.file('favicon.ico', icoBlob);
  } catch (err) {
    console.warn('Could not generate multi-size ICO binary, using 32px png as fallback', err);
    const fallback32 = await renderSvgToBlob(svgString, 32, 'png');
    zip.file('favicon.ico', fallback32);
  }

  return await zip.generateAsync({ type: 'blob' });
}

import { FeatureGraphicOptions } from '../types';

/**
 * Generates exact 1024x500 Google Play Store Feature Graphic SVG
 */
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
  const badgeText = options.badgeText || '★ 4.9 • 100K+ Downloads';

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
      <g transform="translate(512, 290)">
        <rect x="-130" y="0" width="260" height="32" rx="16" fill="${cardBg}" stroke="${cardBorder}" stroke-width="1.5" />
        <text x="0" y="21" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="${textColor}" letter-spacing="0.5">
          ${badgeText}
        </text>
      </g>

      <!-- Title & Subtitle -->
      <text x="512" y="375" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="900" fill="${textColor}" letter-spacing="-0.5" filter="url(#fg_subtle_shadow)">
        ${title}
      </text>

      <text x="512" y="420" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="500" fill="${subtextColor}" max-width="700">
        ${subtitle}
      </text>

      <!-- Play Store Official Pill (Optional) -->
      ${options.showPlayBadge ? `
        <g transform="translate(512, 458)">
          <rect x="-80" y="-14" width="160" height="28" rx="8" fill="#000000" opacity="0.8" />
          <path d="M -60 -5 L -52 0 L -60 5 Z" fill="#00e676" />
          <text x="-44" y="4" font-family="system-ui, sans-serif" font-size="10" font-weight="800" fill="#ffffff" letter-spacing="1">
            GOOGLE PLAY
          </text>
        </g>
      ` : ''}
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
          ${badgeText}
        </text>

        <!-- Big Bold Title -->
        <text x="0" y="85" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="900" fill="${textColor}" letter-spacing="-1">
          ${title}
        </text>

        <!-- Subtitle -->
        <text x="0" y="130" font-family="system-ui, sans-serif" font-size="20" font-weight="500" fill="${subtextColor}">
          ${subtitle}
        </text>

        <!-- Rating Stars Bar -->
        ${options.showRatingStars ? `
          <g transform="translate(0, 175)">
            <text x="0" y="18" font-size="20" fill="#facc15">★★★★★</text>
            <text x="120" y="18" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="${textColor}">
              4.9 Rating
            </text>
          </g>
        ` : ''}

        <!-- Google Play Store Badge -->
        ${options.showPlayBadge ? `
          <g transform="translate(0, 240)">
            <rect width="180" height="48" rx="10" fill="#000000" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
            <path d="M 20 16 L 36 24 L 20 32 Z" fill="#00e676" />
            <text x="48" y="22" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="#94a3b8" letter-spacing="0.5">
              GET IT ON
            </text>
            <text x="48" y="37" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#ffffff" letter-spacing="0.5">
              Google Play
            </text>
          </g>
        ` : ''}
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
          ${badgeText}
        </text>
      </g>

      <!-- Arabic & English Title -->
      <text x="512" y="375" text-anchor="middle" font-family="'Cairo', 'Tajawal', system-ui, sans-serif" font-size="46" font-weight="900" fill="${textColor}">
        ${title}
      </text>

      <text x="512" y="420" text-anchor="middle" font-family="'Cairo', 'Tajawal', system-ui, sans-serif" font-size="18" font-weight="600" fill="${subtextColor}">
        ${subtitle}
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
            ${badgeText}
          </text>
        </g>

        <!-- Title -->
        <text x="350" y="280" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="40" font-weight="900" fill="${textColor}">
          ${title}
        </text>

        <!-- Subtitle -->
        <text x="350" y="320" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="500" fill="${subtextColor}">
          ${subtitle}
        </text>

        <!-- Rating Stars -->
        ${options.showRatingStars ? `
          <text x="350" y="360" text-anchor="middle" font-size="18" fill="#facc15">
            ★★★★★
          </text>
        ` : ''}
      </g>
    `;
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
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
`.trim();
}

/**
 * Renders the Feature Graphic SVG onto a 1024x500 Canvas and returns PNG or JPEG Blob
 */
export async function renderFeatureGraphicToBlob(
  svgString: string,
  format: 'png' | 'jpeg' = 'png',
  quality = 0.95
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return reject(new Error('Canvas 2D context not available'));
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      ctx.clearRect(0, 0, 1024, 500);
      ctx.drawImage(img, 0, 0, 1024, 500);
      URL.revokeObjectURL(url);

      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create canvas blob'));
        },
        mimeType,
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}

import { SocialMediaPreset, SocialBannerOptions } from '../types';

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
  const subtitle = options.subtitle || config.tagline || 'Official Social Media Channel';
  const badgeText = options.badgeText || 'OFFICIAL CHANNEL • 2026';

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
      ${options.showBadge ? `
        <g transform="translate(${cx}, ${Math.max(60, logoY + logoTargetSize + 30)})">
          <rect x="-140" y="-16" width="280" height="32" rx="16" fill="${cardBg}" stroke="${cardBorder}" stroke-width="1.5" />
          <text x="0" y="5" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.max(12, Math.min(16, w * 0.015))}" font-weight="700" fill="${textColor}" letter-spacing="1">
            ${badgeText}
          </text>
        </g>
      ` : ''}

      <!-- Title & Subtitle -->
      <text x="${cx}" y="${Math.min(h - 80, logoY + logoTargetSize + (options.showBadge ? 95 : 65))}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.max(24, Math.min(68, w * 0.042))}" font-weight="900" fill="${textColor}" letter-spacing="-0.5" filter="url(#sb_subtle_shadow)">
        ${title}
      </text>

      <text x="${cx}" y="${Math.min(h - 40, logoY + logoTargetSize + (options.showBadge ? 145 : 115))}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.max(14, Math.min(26, w * 0.018))}" font-weight="500" fill="${subtextColor}">
        ${subtitle}
      </text>
    `;
  }
  // 2. Split Hero (Left logo, Right text)
  else if (options.layout === 'split-hero') {
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
        ${options.showBadge ? `
          <rect x="0" y="-85" width="220" height="28" rx="14" fill="${cardBg}" stroke="${cardBorder}" stroke-width="1.5" />
          <text x="110" y="-66" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${Math.max(11, Math.min(14, w * 0.012))}" font-weight="700" fill="${textColor}">
            ${badgeText}
          </text>
        ` : ''}

        <text x="0" y="-15" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.max(26, Math.min(64, w * 0.04))}" font-weight="900" fill="${textColor}" letter-spacing="-1">
          ${title}
        </text>

        <text x="0" y="32" font-family="system-ui, sans-serif" font-size="${Math.max(14, Math.min(24, w * 0.016))}" font-weight="500" fill="${subtextColor}">
          ${subtitle}
        </text>

        <!-- Social Action Buttons Callout -->
        <g transform="translate(0, 65)">
          <rect width="160" height="38" rx="19" fill="${accentGlow}" />
          <text x="80" y="24" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#ffffff">
            SUBSCRIBE
          </text>
        </g>
      </g>
    `;
  }
  // 3. Minimal Clean / Center Monogram
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
      // YouTube Safe Area (1546 x 423)
      const szW = 1546;
      const szH = 423;
      const szX = (w - szW) / 2;
      const szY = (h - szH) / 2;
      safeZoneOverlay = `
        <rect x="${szX}" y="${szY}" width="${szW}" height="${szH}" fill="none" stroke="#e11d48" stroke-width="4" stroke-dasharray="16 8" />
        <rect x="${szX}" y="${szY - 36}" width="340" height="32" rx="6" fill="#e11d48" />
        <text x="${szX + 16}" y="${szY - 14}" font-family="monospace" font-size="14" font-weight="700" fill="#ffffff">
          YouTube Mobile Safe Zone (1546 × 423)
        </text>
      `;
    } else {
      safeZoneOverlay = `
        <rect x="${w * 0.08}" y="${h * 0.1}" width="${w * 0.84}" height="${h * 0.8}" fill="none" stroke="#e11d48" stroke-width="3" stroke-dasharray="12 6" opacity="0.8" />
      `;
    }
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
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
`.trim();
}

/**
 * Renders any dimension SVG to Canvas Blob (PNG/JPEG/WEBP)
 */
export async function renderSocialCanvasToBlob(
  svgString: string,
  width: number,
  height: number,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality = 0.95
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return reject(new Error('Canvas 2D context not available'));
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      const mimeType =
        format === 'jpeg'
          ? 'image/jpeg'
          : format === 'webp'
          ? 'image/webp'
          : 'image/png';

      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create canvas blob'));
        },
        mimeType,
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}

/**
 * Generates full Social Media Kit ZIP package with organized folders
 */
export async function generateSocialMediaKitZip(
  config: LogoConfig,
  bannerOptions: SocialBannerOptions
): Promise<Blob> {
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
    avatarFolder.file('vector_master_1x1.svg', baseSvg);
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
    const pngBlob = await renderSocialCanvasToBlob(bannerSvg, preset.width, preset.height, 'png');
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
    bannerFolder.file('banner_master_16x9.svg', bannerMasterSvg);
  }

  return await zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}


