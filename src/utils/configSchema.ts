/**
 * Validates untrusted `LogoConfig` data before it reaches the renderer.
 *
 * Project files are meant to be shared, so an imported `.json` is attacker
 * input. Previously the import accepted anything that passed
 * `typeof parsed === 'object'` and handed it straight to the canvas, which
 * meant a crafted `customSvgString` executed in the app's origin.
 *
 * Every field is coerced to its declared type and clamped to its documented
 * range. Unknown keys are dropped. The result is always a complete, renderable
 * config — never a partially-trusted object.
 */

import {
  BackgroundType,
  ImageFilters,
  LayoutStyle,
  LogoConfig,
  PatternType,
  ShapeMask,
  TextCurve,
  WatermarkConfig,
  WatermarkPosition,
  WatermarkType,
} from '../types';
import { DEFAULT_LOGO_CONFIG } from './templates';
import { sanitizeSvgMarkup } from './svgSanitizer';

const SHAPE_MASKS: ShapeMask[] = [
  'square', 'squircle', 'circle', 'shield', 'hexagon', 'octagon', 'diamond', 'badge', 'pill',
];
const BACKGROUND_TYPES: BackgroundType[] = ['transparent', 'solid', 'linear', 'radial', 'mesh'];
const PATTERNS: PatternType[] = ['none', 'dots', 'grid', 'stripes', 'waves', 'circuit'];
const TEXT_CURVES: TextCurve[] = ['straight', 'arch-up', 'arch-down', 'circle', 'wave'];
const LAYOUTS: LayoutStyle[] = [
  'icon-top', 'icon-left', 'icon-only', 'text-only', 'badge-center', 'monogram',
];
const ICON_TYPES = ['library', 'custom-svg', 'emoji', 'image', 'none'] as const;
const CROP_SHAPES = ['none', 'circle', 'squircle', 'square', 'hexagon'] as const;
const BORDER_STYLES = ['solid', 'dashed', 'double'] as const;
const TEXT_TRANSFORMS = ['none', 'uppercase', 'lowercase', 'capitalize'] as const;
const WATERMARK_POSITIONS: WatermarkPosition[] = [
  'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center', 'tile',
];
const WATERMARK_TYPES: WatermarkType[] = ['text', 'logo', 'custom-image'];

/** Longest brand name / tagline we will render. Keeps SVG payloads bounded. */
const MAX_TEXT_LENGTH = 200;
/** Uploaded images are data URLs; anything larger is refused outright. */
const MAX_IMAGE_DATA_URL_LENGTH = 12 * 1024 * 1024;

function num(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function str(value: unknown, fallback: string, maxLength = MAX_TEXT_LENGTH): string {
  if (typeof value !== 'string') return fallback;
  return value.slice(0, maxLength);
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

/**
 * Colors reach the SVG as raw attribute values, so only literal CSS colors are
 * accepted — never a `url(...)` that could point somewhere else.
 */
const COLOR_PATTERN =
  /^(#[0-9a-fA-F]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\)|[a-zA-Z]{3,20})$/;

function color(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return COLOR_PATTERN.test(trimmed) ? trimmed : fallback;
}

/**
 * Only raster data URLs are allowed as image sources. An `http(s)` URL would
 * taint the export canvas, and an SVG data URL is a script vector.
 */
function imageDataUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  if (value.length > MAX_IMAGE_DATA_URL_LENGTH) return undefined;
  if (!/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=\s]+$/.test(value)) {
    return undefined;
  }
  return value;
}

function imageFilters(value: unknown): ImageFilters {
  const source = (value ?? {}) as Partial<ImageFilters>;
  const base = DEFAULT_LOGO_CONFIG.uploadedImageFilters;
  return {
    brightness: num(source.brightness, base.brightness, 0, 200),
    contrast: num(source.contrast, base.contrast, 0, 200),
    saturation: num(source.saturation, base.saturation, 0, 200),
    hueRotate: num(source.hueRotate, base.hueRotate, 0, 360),
    grayscale: num(source.grayscale, base.grayscale, 0, 100),
    invert: num(source.invert, base.invert, 0, 100),
    sepia: num(source.sepia, base.sepia, 0, 100),
    blur: num(source.blur, base.blur, 0, 20),
  };
}

function watermark(value: unknown): WatermarkConfig | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const source = value as Partial<WatermarkConfig>;

  return {
    enabled: bool(source.enabled, false),
    type: oneOf(source.type, WATERMARK_TYPES, 'text'),
    text: str(source.text, ''),
    customImageSrc: imageDataUrl(source.customImageSrc),
    opacity: num(source.opacity, 0.25, 0, 1),
    position: oneOf(source.position, WATERMARK_POSITIONS, 'bottom-right'),
    size: num(source.size, 64, 1, 1024),
    rotation: num(source.rotation, 0, -180, 180),
    color: color(source.color, '#ffffff'),
    fontFamily: str(source.fontFamily, 'Cairo', 64),
    fontSize: num(source.fontSize, 18, 1, 400),
  };
}

/**
 * Coerces arbitrary parsed JSON into a safe, complete `LogoConfig`.
 * Never throws: unusable input yields the defaults.
 */
export function parseLogoConfig(input: unknown): LogoConfig {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ...DEFAULT_LOGO_CONFIG, id: `proj_${Date.now()}` };
  }

  const raw = input as Record<string, unknown>;
  const base = DEFAULT_LOGO_CONFIG;

  return {
    id: str(raw.id, `proj_${Date.now()}`, 64).replace(/[^a-zA-Z0-9_-]/g, '') || `proj_${Date.now()}`,
    name: str(raw.name, base.name),
    updatedAt: num(raw.updatedAt, Date.now(), 0, Number.MAX_SAFE_INTEGER),

    canvasSize: num(raw.canvasSize, base.canvasSize, 16, 4096),
    padding: num(raw.padding, base.padding, 0, 100),

    bgType: oneOf(raw.bgType, BACKGROUND_TYPES, base.bgType),
    bgColor1: color(raw.bgColor1, base.bgColor1),
    bgColor2: color(raw.bgColor2, base.bgColor2),
    bgGradientAngle: num(raw.bgGradientAngle, base.bgGradientAngle, 0, 360),
    pattern: oneOf(raw.pattern, PATTERNS, base.pattern),
    patternOpacity: num(raw.patternOpacity, base.patternOpacity, 0, 1),
    shapeMask: oneOf(raw.shapeMask, SHAPE_MASKS, base.shapeMask),
    borderRadius: num(raw.borderRadius, base.borderRadius, 0, 256),

    borderWidth: num(raw.borderWidth, base.borderWidth, 0, 100),
    borderColor: color(raw.borderColor, base.borderColor),
    borderStyle: oneOf(raw.borderStyle, BORDER_STYLES, base.borderStyle),
    shadowBlur: num(raw.shadowBlur, base.shadowBlur, 0, 200),
    shadowColor: color(raw.shadowColor, base.shadowColor),
    shadowOffsetY: num(raw.shadowOffsetY, base.shadowOffsetY, -200, 200),
    innerGlow: bool(raw.innerGlow, base.innerGlow),
    innerGlowColor: color(raw.innerGlowColor, base.innerGlowColor),

    iconType: oneOf(raw.iconType, ICON_TYPES, base.iconType),
    iconKey: str(raw.iconKey, base.iconKey, 64),
    // The one field that reaches the DOM as markup.
    customSvgString: typeof raw.customSvgString === 'string'
      ? sanitizeSvgMarkup(raw.customSvgString)
      : undefined,
    emojiChar: typeof raw.emojiChar === 'string' ? raw.emojiChar.slice(0, 8) : undefined,
    iconSize: num(raw.iconSize, base.iconSize, 1, 4096),
    iconColor: color(raw.iconColor, base.iconColor),
    iconColor2: raw.iconColor2 === undefined ? base.iconColor2 : color(raw.iconColor2, '#818cf8'),
    iconGradient: bool(raw.iconGradient, base.iconGradient),
    iconGradientAngle: num(raw.iconGradientAngle, base.iconGradientAngle, 0, 360),
    iconOffsetX: num(raw.iconOffsetX, base.iconOffsetX, -2048, 2048),
    iconOffsetY: num(raw.iconOffsetY, base.iconOffsetY, -2048, 2048),
    iconRotation: num(raw.iconRotation, base.iconRotation, -360, 360),
    iconFlipH: bool(raw.iconFlipH, base.iconFlipH),
    iconFlipV: bool(raw.iconFlipV, base.iconFlipV),
    iconOpacity: num(raw.iconOpacity, base.iconOpacity, 0, 1),
    iconShadow: bool(raw.iconShadow, base.iconShadow),
    iconShadowColor: color(raw.iconShadowColor, base.iconShadowColor),
    iconShadowBlur: num(raw.iconShadowBlur, base.iconShadowBlur, 0, 200),
    iconShadowOffsetX: num(raw.iconShadowOffsetX, base.iconShadowOffsetX, -200, 200),
    iconShadowOffsetY: num(raw.iconShadowOffsetY, base.iconShadowOffsetY, -200, 200),
    iconOutline: bool(raw.iconOutline, base.iconOutline),
    iconOutlineWidth: num(raw.iconOutlineWidth, base.iconOutlineWidth, 0, 100),
    iconOutlineColor: color(raw.iconOutlineColor, base.iconOutlineColor),

    uploadedImageSrc: imageDataUrl(raw.uploadedImageSrc),
    uploadedImageScale: num(raw.uploadedImageScale, base.uploadedImageScale, 1, 1000),
    uploadedImageOffsetX: num(raw.uploadedImageOffsetX, base.uploadedImageOffsetX, -4096, 4096),
    uploadedImageOffsetY: num(raw.uploadedImageOffsetY, base.uploadedImageOffsetY, -4096, 4096),
    uploadedImageRotation: num(raw.uploadedImageRotation, base.uploadedImageRotation, -360, 360),
    uploadedImageOpacity: num(raw.uploadedImageOpacity, base.uploadedImageOpacity, 0, 1),
    uploadedImageCropShape: oneOf(raw.uploadedImageCropShape, CROP_SHAPES, base.uploadedImageCropShape),
    uploadedImageFilters: imageFilters(raw.uploadedImageFilters),

    showText: bool(raw.showText, base.showText),
    text: str(raw.text, base.text),
    fontFamily: str(raw.fontFamily, base.fontFamily, 64),
    fontSize: num(raw.fontSize, base.fontSize, 1, 512),
    fontWeight: num(raw.fontWeight, Number(base.fontWeight) || 700, 100, 900),
    textColor: color(raw.textColor, base.textColor),
    textColor2: raw.textColor2 === undefined ? base.textColor2 : color(raw.textColor2, '#94a3b8'),
    textGradient: bool(raw.textGradient, base.textGradient),
    textGradientAngle: num(raw.textGradientAngle, base.textGradientAngle, 0, 360),
    letterSpacing: num(raw.letterSpacing, base.letterSpacing, -20, 100),
    textLineHeight: num(raw.textLineHeight, base.textLineHeight, 0.5, 4),
    textTransform: oneOf(raw.textTransform, TEXT_TRANSFORMS, base.textTransform),
    textOffsetX: num(raw.textOffsetX, base.textOffsetX, -2048, 2048),
    textOffsetY: num(raw.textOffsetY, base.textOffsetY, -2048, 2048),
    textRotation: num(raw.textRotation, base.textRotation, -360, 360),
    textCurve: oneOf(raw.textCurve, TEXT_CURVES, base.textCurve),
    textCurveRadius: num(raw.textCurveRadius, base.textCurveRadius, 10, 2048),
    textShadow: bool(raw.textShadow, base.textShadow),
    textShadowColor: color(raw.textShadowColor, base.textShadowColor),
    textShadowBlur: num(raw.textShadowBlur, base.textShadowBlur, 0, 200),
    textShadowOffsetX: num(raw.textShadowOffsetX, base.textShadowOffsetX, -200, 200),
    textShadowOffsetY: num(raw.textShadowOffsetY, base.textShadowOffsetY, -200, 200),
    textStroke: bool(raw.textStroke, base.textStroke),
    textStrokeWidth: num(raw.textStrokeWidth, base.textStrokeWidth, 0, 100),
    textStrokeColor: color(raw.textStrokeColor, base.textStrokeColor),
    textUppercase: bool(raw.textUppercase, base.textUppercase),

    showTagline: bool(raw.showTagline, base.showTagline),
    tagline: str(raw.tagline, base.tagline),
    taglineFontFamily: str(raw.taglineFontFamily, base.taglineFontFamily, 64),
    taglineFontSize: num(raw.taglineFontSize, base.taglineFontSize, 1, 512),
    taglineFontWeight: num(raw.taglineFontWeight, Number(base.taglineFontWeight) || 500, 100, 900),
    taglineColor: color(raw.taglineColor, base.taglineColor),
    taglineLetterSpacing: num(raw.taglineLetterSpacing, base.taglineLetterSpacing, -20, 100),
    taglineOffsetY: num(raw.taglineOffsetY, base.taglineOffsetY, -2048, 2048),
    taglineUppercase: bool(raw.taglineUppercase, base.taglineUppercase),

    showRing: bool(raw.showRing, base.showRing),
    ringRadius: num(raw.ringRadius, base.ringRadius, 0, 2048),
    ringWidth: num(raw.ringWidth, base.ringWidth, 0, 200),
    ringColor: color(raw.ringColor, base.ringColor),
    ringDash: bool(raw.ringDash, base.ringDash),

    showBadgeRibbon: bool(raw.showBadgeRibbon, base.showBadgeRibbon),
    badgeRibbonText: typeof raw.badgeRibbonText === 'string'
      ? raw.badgeRibbonText.slice(0, 64)
      : base.badgeRibbonText,
    badgeRibbonColor: raw.badgeRibbonColor === undefined
      ? base.badgeRibbonColor
      : color(raw.badgeRibbonColor, '#ef4444'),

    layout: oneOf(raw.layout, LAYOUTS, base.layout),
    watermark: watermark(raw.watermark),
  };
}

/**
 * Validates a stored `SavedProjectItem`. Storage is same-origin, but it is
 * still populated from imported files, so it gets the same treatment.
 */
export function parseSavedProjectItem(input: unknown): {
  id: string;
  name: string;
  updatedAt: number;
  config: LogoConfig;
  thumbnailSvg?: string;
} | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;

  const config = parseLogoConfig(raw.config);
  return {
    id: str(raw.id, config.id, 64),
    name: str(raw.name, config.name),
    updatedAt: num(raw.updatedAt, Date.now(), 0, Number.MAX_SAFE_INTEGER),
    config,
    thumbnailSvg:
      typeof raw.thumbnailSvg === 'string' ? raw.thumbnailSvg.slice(0, 512 * 1024) : undefined,
  };
}
