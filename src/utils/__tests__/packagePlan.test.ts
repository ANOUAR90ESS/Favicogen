import { describe, expect, it } from 'vitest';
import {
  PACKAGE_CATEGORIES,
  PACKAGE_PRESETS,
  countAssets,
  countSelected,
  matchPreset,
  stepsFor,
  toggleCategory,
} from '../packagePlan';
import { FAVICON_SPECS, JPEG_EXPORT_SIZES, SOCIAL_MEDIA_PRESETS } from '../canvasRenderer';
import { assetsFor } from '../platformAssets';
import { BRAND_VARIANT_IDS } from '../brandVariants';

/**
 * The counts shown beside each choice are a promise about what lands in the
 * ZIP. They are derived from the same tables the generators read, and these
 * tests are what stops that derivation from quietly going stale.
 */

describe('countAssets', () => {
  it('counts the website set from the favicon table, not a written-down number', () => {
    // PNG and WebP at every size; JPEG only at the three sizes it is useful
    // at; plus svg, ico, manifest, browserconfig, the snippet and the guide
    expect(countAssets('website')).toBe(
      FAVICON_SPECS.length * 2 + JPEG_EXPORT_SIZES.length + 6
    );
  });

  it('counts the platform sets from the platform table', () => {
    expect(countAssets('android')).toBe(assetsFor('android').length);
    expect(countAssets('ios')).toBe(assetsFor('ios').length);
  });

  it('counts social from the preset list plus its two masters and its guide', () => {
    expect(countAssets('social')).toBe(SOCIAL_MEDIA_PRESETS.length + 3);
  });

  it('counts brand as an SVG and a PNG per variant', () => {
    expect(countAssets('brand')).toBe(BRAND_VARIANT_IDS.length * 2);
  });

  it('gives every category a positive count', () => {
    for (const category of PACKAGE_CATEGORIES) {
      expect(countAssets(category)).toBeGreaterThan(0);
    }
  });
});

describe('countSelected', () => {
  it('is zero for nothing, and the sum plus the package README otherwise', () => {
    expect(countSelected([])).toBe(0);
    expect(countSelected(PACKAGE_CATEGORIES)).toBe(
      PACKAGE_CATEGORIES.reduce((n, c) => n + countAssets(c), 0) + 1
    );
    expect(countSelected(['brand'])).toBe(countAssets('brand') + 1);
  });
});

describe('presets', () => {
  it('only name categories that exist', () => {
    for (const preset of PACKAGE_PRESETS) {
      for (const category of preset.categories) {
        expect(PACKAGE_CATEGORIES).toContain(category);
      }
    }
  });

  it('has one that covers everything', () => {
    const everything = PACKAGE_PRESETS.find((p) => p.id === 'everything');
    expect(everything?.categories).toEqual(PACKAGE_CATEGORIES);
  });

  it('recognises its own selections back, in any order', () => {
    expect(matchPreset(['website'])).toBe('website-starter');
    expect(matchPreset(['ios', 'google-play', 'android'])).toBe('app-developer');
    expect(matchPreset([...PACKAGE_CATEGORIES].reverse())).toBe('everything');
  });

  it('calls an edited selection custom rather than the nearest preset', () => {
    expect(matchPreset(['website', 'brand'])).toBeNull();
    expect(matchPreset([])).toBeNull();
  });
});

describe('toggleCategory', () => {
  it('adds in the canonical order, not the click order', () => {
    expect(toggleCategory(['brand'], 'website')).toEqual(['website', 'brand']);
    expect(toggleCategory(['website'], 'ios')).toEqual(['website', 'ios']);
  });

  it('removes a selected one', () => {
    expect(toggleCategory(['website', 'brand'], 'website')).toEqual(['brand']);
  });

  it('refuses to empty the selection — there would be nothing to generate', () => {
    expect(toggleCategory(['website'], 'website')).toEqual(['website']);
  });
});

describe('stepsFor', () => {
  it('lists the chosen categories in canonical order, then the zip', () => {
    expect(stepsFor(['brand', 'website'])).toEqual(['website', 'brand', 'zip']);
  });

  it('always ends with the zip step', () => {
    expect(stepsFor(PACKAGE_CATEGORIES).at(-1)).toBe('zip');
    expect(stepsFor([])).toEqual(['zip']);
  });
});
