import type { LogoConfig } from '../types';

/**
 * The one-colour and transparent versions of a mark that any brand hand-off
 * is expected to contain: a black one for light print, a white one for dark
 * backgrounds, a single-colour one for stamps and embroidery.
 *
 * These are produced by rebuilding the design with different colours, not by
 * filtering the finished picture. That distinction matters: a logo is usually
 * a shape with something knocked out of it — a glyph inside a badge — and a
 * filter over the whole mark flattens it into a solid blob. Rebuilding keeps
 * the knockout, because the plate is dropped and only the mark is recoloured.
 *
 * An uploaded photograph has no such structure to rebuild from. There the
 * honest answer is a silhouette, and `variantFidelity` says so, so the UI can
 * tell the user rather than handing them a black rectangle and calling it a
 * logo.
 */

export type BrandVariantId = 'original' | 'transparent' | 'black' | 'white' | 'monochrome';

export const BRAND_VARIANT_IDS: BrandVariantId[] = [
  'original',
  'transparent',
  'black',
  'white',
  'monochrome',
];

/** What a recoloured variant can actually preserve, given the source. */
export type VariantFidelity =
  /** Rebuilt from the design: shapes and knockouts survive. */
  | 'vector'
  /** Flattened from a raster: only the outline survives. */
  | 'silhouette';

/** Uploaded pictures cannot be recoloured — only keyed to their own alpha. */
export function variantFidelity(config: LogoConfig): VariantFidelity {
  return config.iconType === 'image' && config.uploadedImageSrc ? 'silhouette' : 'vector';
}

const INK = '#000000';
const PAPER = '#ffffff';

/** `#rrggbb` to three 0–1 channels. Falls back to mid grey on anything else. */
function parseHex(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0.28, 0.33, 0.41];
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * The colour every part of the mark is forced to, per variant. `null` means
 * the variant keeps the design's own colours.
 */
function variantInk(id: BrandVariantId, monochromeColor: string): string | null {
  switch (id) {
    case 'black':
      return INK;
    case 'white':
      return PAPER;
    case 'monochrome':
      return monochromeColor;
    default:
      return null;
  }
}

/**
 * The config that renders one variant. Everything decorative that carries its
 * own colour — gradients, glows, rings, watermarks, borders — is switched off
 * rather than recoloured: a one-colour logo with a drop shadow is not one
 * colour.
 */
export function buildBrandVariantConfig(
  config: LogoConfig,
  id: BrandVariantId,
  monochromeColor = '#475569'
): LogoConfig {
  if (id === 'original') return config;

  const base: LogoConfig = {
    ...config,
    // Every variant but the original is delivered on transparency: that is
    // what makes it droppable onto any background, which is the point of it.
    bgType: 'transparent',
    pattern: 'none',
    borderWidth: 0,
    showRing: false,
    innerGlow: false,
  };

  if (id === 'transparent') return base;

  const ink = variantInk(id, monochromeColor) as string;

  return {
    ...base,
    iconColor: ink,
    iconGradient: false,
    iconShadow: false,
    iconOutline: false,
    textColor: ink,
    textGradient: false,
    textShadow: false,
    textStroke: false,
    taglineColor: ink,
    showBadgeRibbon: false,
    watermark: config.watermark ? { ...config.watermark, enabled: false } : config.watermark,
  };
}

/**
 * The filter a raster variant needs, since its colours live in the pixels
 * rather than in the config. Black and white key the picture to its own
 * alpha; monochrome tints it by luminance, which keeps the interior shading a
 * flat silhouette would throw away.
 *
 * Returns null when the variant needs no filter.
 */
export function rasterVariantFilter(id: BrandVariantId, monochromeColor = '#475569'): string | null {
  if (id === 'original' || id === 'transparent') return null;

  if (id === 'monochrome') {
    // Tint by luminance rather than flatten: interior shading survives as
    // lighter and darker tones of the one colour, which is what a monochrome
    // logo is. A flat fill would throw that away.
    const [r, g, b] = parseHex(monochromeColor);
    const row = (c: number) =>
      `${(0.2126 * c).toFixed(4)} ${(0.7152 * c).toFixed(4)} ${(0.0722 * c).toFixed(4)} 0 0`;
    return `<feColorMatrix type="matrix" values="${row(r)} ${row(g)} ${row(b)} 0 0 0 1 0" />`;
  }

  const [r, g, b] = id === 'black' ? [0, 0, 0] : [1, 1, 1];
  // Alpha is passed through untouched, so the shape is exactly the picture's.
  return (
    `<feColorMatrix type="matrix" values="` +
    `0 0 0 0 ${r} ` +
    `0 0 0 0 ${g} ` +
    `0 0 0 0 ${b} ` +
    `0 0 0 1 0" />`
  );
}

/** Applies a raster variant filter to a finished SVG document. */
export function applyRasterVariantFilter(svg: string, filterBody: string | null): string {
  if (!filterBody) return svg;

  const id = `brandVariant_${Math.random().toString(36).slice(2, 9)}`;
  const def = `<filter id="${id}" color-interpolation-filters="sRGB">${filterBody}</filter>`;

  // Wrap the whole document body, so the filter catches the raster and any
  // vector drawn beside it alike.
  const openTagEnd = svg.indexOf('>');
  if (openTagEnd === -1) return svg;
  const closeTag = svg.lastIndexOf('</svg>');
  if (closeTag === -1) return svg;

  const open = svg.slice(0, openTagEnd + 1);
  const body = svg.slice(openTagEnd + 1, closeTag);

  return `${open}<defs>${def}</defs><g filter="url(#${id})">${body}</g></svg>`;
}

/** The filename stem for a variant, e.g. `acme-logo-black`. */
export function brandVariantFilename(brandName: string, id: BrandVariantId): string {
  const slug =
    brandName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'my-brand';
  return id === 'original' ? `${slug}-logo` : `${slug}-logo-${id}`;
}
