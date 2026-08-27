import { describe, expect, it } from 'vitest';
import {
  BRAND_VARIANT_IDS,
  applyRasterVariantFilter,
  brandVariantFilename,
  buildBrandVariantConfig,
  rasterVariantFilter,
  variantFidelity,
} from '../brandVariants';
import { generateBrandVariantSvg } from '../canvasRenderer';
import { DEFAULT_LOGO_CONFIG } from '../templates';
import type { LogoConfig } from '../../types';

const config = (overrides: Partial<LogoConfig> = {}): LogoConfig => ({
  ...DEFAULT_LOGO_CONFIG,
  ...overrides,
});

describe('buildBrandVariantConfig', () => {
  it('leaves the original completely alone', () => {
    const source = config({ bgType: 'linear', iconGradient: true });
    expect(buildBrandVariantConfig(source, 'original')).toBe(source);
  });

  it('drops the background for every other variant', () => {
    for (const id of BRAND_VARIANT_IDS.filter((v) => v !== 'original')) {
      expect(buildBrandVariantConfig(config({ bgType: 'linear' }), id).bgType).toBe('transparent');
    }
  });

  it('keeps the design colours on the transparent variant', () => {
    const source = config({ iconColor: '#38bdf8', iconGradient: true });
    const out = buildBrandVariantConfig(source, 'transparent');
    expect(out.iconColor).toBe('#38bdf8');
    expect(out.iconGradient).toBe(true);
  });

  it('forces one ink and switches off anything that carries its own colour', () => {
    const source = config({
      iconColor: '#38bdf8',
      iconGradient: true,
      iconShadow: true,
      iconOutline: true,
      textGradient: true,
      textShadow: true,
      showRing: true,
      borderWidth: 6,
    });

    const black = buildBrandVariantConfig(source, 'black');

    expect(black.iconColor).toBe('#000000');
    expect(black.textColor).toBe('#000000');
    expect(black.taglineColor).toBe('#000000');
    // a one-colour logo with a gradient or a drop shadow is not one colour
    expect(black.iconGradient).toBe(false);
    expect(black.iconShadow).toBe(false);
    expect(black.iconOutline).toBe(false);
    expect(black.textGradient).toBe(false);
    expect(black.textShadow).toBe(false);
    expect(black.showRing).toBe(false);
    expect(black.borderWidth).toBe(0);
  });

  it('uses white for the dark-background variant and the given colour for monochrome', () => {
    expect(buildBrandVariantConfig(config(), 'white').iconColor).toBe('#ffffff');
    expect(buildBrandVariantConfig(config(), 'monochrome', '#8b5cf6').iconColor).toBe('#8b5cf6');
  });

  it('turns a watermark off without destroying its settings', () => {
    const source = config({
      watermark: { enabled: true, text: 'draft', position: 'center' } as LogoConfig['watermark'],
    });
    const out = buildBrandVariantConfig(source, 'black');
    expect(out.watermark?.enabled).toBe(false);
    expect(out.watermark?.text).toBe('draft');
  });
});

describe('variantFidelity', () => {
  it('is vector for a design the app draws', () => {
    expect(variantFidelity(config({ iconType: 'library' }))).toBe('vector');
  });

  it('is silhouette for an uploaded picture, which cannot be recoloured', () => {
    expect(
      variantFidelity(config({ iconType: 'image', uploadedImageSrc: 'data:image/png;base64,AA' }))
    ).toBe('silhouette');
  });
});

describe('rasterVariantFilter', () => {
  it('needs no filter for the original or the transparent variant', () => {
    expect(rasterVariantFilter('original')).toBeNull();
    expect(rasterVariantFilter('transparent')).toBeNull();
  });

  it('keys black and white to the picture’s own alpha', () => {
    // the alpha row must pass through untouched, or the shape changes
    expect(rasterVariantFilter('black')).toContain('0 0 0 1 0');
    expect(rasterVariantFilter('white')).toContain('0 0 0 0 1');
  });

  it('tints monochrome by luminance rather than flattening it', () => {
    const filter = rasterVariantFilter('monochrome', '#ff0000') ?? '';
    // the red row carries the luminance weights, the others are zero
    expect(filter).toContain('0.2126 0.7152 0.0722');
    expect(filter).toContain('0.0000 0.0000 0.0000');
  });
});

describe('applyRasterVariantFilter', () => {
  const svg = '<svg viewBox="0 0 512 512"><rect width="512" height="512" /></svg>';

  it('returns the document untouched when there is no filter', () => {
    expect(applyRasterVariantFilter(svg, null)).toBe(svg);
  });

  it('wraps the body and keeps the root tag', () => {
    const out = applyRasterVariantFilter(svg, '<feColorMatrix type="saturate" values="0" />');
    expect(out.startsWith('<svg viewBox="0 0 512 512">')).toBe(true);
    expect(out.endsWith('</svg>')).toBe(true);
    expect(out).toContain('<rect width="512" height="512" />');
    expect(out).toMatch(/<g filter="url\(#brandVariant_[a-z0-9]+\)">/);
  });
});

describe('brandVariantFilename', () => {
  it('slugs the brand name', () => {
    expect(brandVariantFilename('Acme Corp', 'black')).toBe('acme-corp-logo-black');
    expect(brandVariantFilename('Acme Corp', 'original')).toBe('acme-corp-logo');
  });

  it('falls back rather than producing a nameless file', () => {
    expect(brandVariantFilename('   ', 'white')).toBe('my-brand-logo-white');
    expect(brandVariantFilename('؟؟؟', 'white')).toBe('my-brand-logo-white');
  });
});

describe('generateBrandVariantSvg', () => {
  it('renders every variant as a valid document', () => {
    for (const id of BRAND_VARIANT_IDS) {
      const svg = generateBrandVariantSvg(config({ text: 'Acme', showText: true }), id);
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
    }
  });

  it('filters a raster source but not a vector one', () => {
    const raster = config({ iconType: 'image', uploadedImageSrc: 'data:image/png;base64,AA' });
    expect(generateBrandVariantSvg(raster, 'black')).toContain('brandVariant_');
    expect(generateBrandVariantSvg(config({ iconType: 'library' }), 'black')).not.toContain(
      'brandVariant_'
    );
  });
});
