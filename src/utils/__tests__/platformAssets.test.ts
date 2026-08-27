import { describe, expect, it } from 'vitest';
import {
  ANDROID_ADAPTIVE_DP,
  ANDROID_ADAPTIVE_XML,
  ANDROID_DENSITIES,
  ANDROID_LAUNCHER_DP,
  ANDROID_SAFE_FRACTION,
  IOS_APP_ICON_PX,
  IOS_CONTENTS_JSON,
  PLATFORM_ASSETS,
  androidAdaptivePx,
  androidLauncherPx,
  assetsFor,
  insetSvg,
} from '../platformAssets';

/**
 * Wrong numbers here do not throw — they produce a package that a build tool
 * rejects, or worse, one it accepts and renders badly on a device nobody
 * tested. So the numbers themselves are the test.
 */

describe('Android densities', () => {
  it('are the five the platform defines, in ascending order', () => {
    expect(ANDROID_DENSITIES.map((d) => d.folder)).toEqual([
      'mipmap-mdpi',
      'mipmap-hdpi',
      'mipmap-xhdpi',
      'mipmap-xxhdpi',
      'mipmap-xxxhdpi',
    ]);
    expect(ANDROID_DENSITIES.map((d) => d.scale)).toEqual([1, 1.5, 2, 3, 4]);
  });

  it('give the documented launcher pixel sizes', () => {
    expect(ANDROID_DENSITIES.map(androidLauncherPx)).toEqual([48, 72, 96, 144, 192]);
  });

  it('give the documented adaptive layer sizes', () => {
    expect(ANDROID_DENSITIES.map(androidAdaptivePx)).toEqual([108, 162, 216, 324, 432]);
  });

  it('bases both on the platform dp figures rather than magic numbers', () => {
    expect(ANDROID_LAUNCHER_DP).toBe(48);
    expect(ANDROID_ADAPTIVE_DP).toBe(108);
    // the centre 72dp of 108dp is all a launcher guarantees to keep
    expect(ANDROID_SAFE_FRACTION).toBeCloseTo(72 / 108, 6);
  });
});

describe('the adaptive icon XML', () => {
  it('names both layers as mipmap resources', () => {
    expect(ANDROID_ADAPTIVE_XML).toContain('<adaptive-icon');
    expect(ANDROID_ADAPTIVE_XML).toContain('@mipmap/ic_launcher_background');
    expect(ANDROID_ADAPTIVE_XML).toContain('@mipmap/ic_launcher_foreground');
    expect(ANDROID_ADAPTIVE_XML).toContain('xmlns:android="http://schemas.android.com/apk/res/android"');
  });
});

describe('the iOS asset catalogue', () => {
  it('declares the single universal size Xcode derives the rest from', () => {
    const parsed = JSON.parse(IOS_CONTENTS_JSON);
    expect(parsed.images).toHaveLength(1);
    expect(parsed.images[0]).toMatchObject({
      filename: `icon-${IOS_APP_ICON_PX}.png`,
      idiom: 'universal',
      platform: 'ios',
      size: '1024x1024',
    });
    expect(parsed.info).toEqual({ author: 'xcode', version: 1 });
  });

  it('is valid JSON ending in a newline, as Xcode writes it', () => {
    expect(IOS_CONTENTS_JSON.endsWith('\n')).toBe(true);
    expect(() => JSON.parse(IOS_CONTENTS_JSON)).not.toThrow();
  });
});

describe('the catalogue', () => {
  it('gives every asset a unique id and a unique path', () => {
    const ids = PLATFORM_ASSETS.map((a) => a.id);
    const paths = PLATFORM_ASSETS.map((a) => a.path);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('files every asset under a folder named for its platform', () => {
    for (const spec of PLATFORM_ASSETS) {
      if (spec.category === 'android') expect(spec.path.startsWith('android/')).toBe(true);
      if (spec.category === 'ios') expect(spec.path.startsWith('ios/')).toBe(true);
    }
  });

  it('gives every bitmap a real size and every manifest none', () => {
    for (const spec of PLATFORM_ASSETS) {
      if (spec.format === 'png') {
        expect(spec.width).toBeGreaterThan(0);
        expect(spec.height).toBeGreaterThan(0);
      } else {
        expect(spec.width).toBe(0);
      }
    }
  });

  it('filters by category', () => {
    expect(assetsFor('ios').map((a) => a.id)).toEqual(['ios-app-icon', 'ios-contents']);
    // five densities × four bitmaps, plus the two anydpi manifests
    expect(assetsFor('android')).toHaveLength(5 * 4 + 2);
  });

  it('explains what each asset is for', () => {
    for (const spec of PLATFORM_ASSETS) {
      expect(spec.purpose.length).toBeGreaterThan(10);
    }
  });
});

describe('insetSvg', () => {
  const svg = '<svg viewBox="0 0 512 512"><circle cx="256" cy="256" r="256" /></svg>';

  it('centres the artwork at the given fraction', () => {
    const out = insetSvg(svg, 0.5);
    // half size, so a quarter of the canvas on each side
    expect(out).toContain('translate(128.00, 128.00) scale(0.5000)');
    expect(out).toContain('<circle cx="256" cy="256" r="256" />');
  });

  it('keeps the root element and closes properly', () => {
    const out = insetSvg(svg, ANDROID_SAFE_FRACTION);
    expect(out.startsWith('<svg viewBox="0 0 512 512">')).toBe(true);
    expect(out.endsWith('</svg>')).toBe(true);
  });

  it('reads the canvas from the viewBox rather than assuming 512', () => {
    const wide = '<svg viewBox="0 0 1000 1000"><rect width="10" height="10" /></svg>';
    expect(insetSvg(wide, 0.5)).toContain('translate(250.00, 250.00)');
  });

  it('leaves anything that is not an SVG document alone', () => {
    expect(insetSvg('not markup', 0.5)).toBe('not markup');
  });
});
