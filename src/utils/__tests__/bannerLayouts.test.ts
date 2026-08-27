import { describe, expect, it } from 'vitest';
import {
  COMPACT_BANNER_LAYOUT,
  SOCIAL_BANNER_LAYOUT_IDS,
  generateSocialBannerSvg,
} from '../canvasRenderer';
import { safeBandsFor } from '../platformAssets';
import { DEFAULT_LOGO_CONFIG } from '../templates';
import type { LogoConfig, SocialBannerOptions } from '../../types';

/**
 * A layout name is a promise that picking it changes the picture.
 *
 * "Luxury identity" used to share a branch with "Centred hero", so the two
 * buttons produced the same banner — identical once the per-render id suffixes
 * were normalised away. Nothing failed, because nothing was comparing them.
 * These tests compare them.
 */

const config = (o: Partial<LogoConfig> = {}): LogoConfig => ({ ...DEFAULT_LOGO_CONFIG, ...o });

/**
 * Every render namespaces its ids with a fresh counter, so two renders of one
 * config never match byte for byte. Strip the suffixes and what is left is the
 * drawing itself.
 */
const shape = (svg: string): string =>
  svg.replace(/_default_project_\d+/g, '_P').replace(/_logo_[0-9a-z]+/g, '_L');

const render = (
  layout: SocialBannerOptions['layout'],
  over: Partial<SocialBannerOptions> = {}
): string =>
  shape(
    generateSocialBannerSvg(
      config(),
      {
        layout,
        bgTheme: 'dark',
        title: 'Nebula',
        subtitle: 'Design that carries',
        showGlowEffect: true,
        ...over,
      },
      1500,
      500
    )
  );

describe('the layouts the Social Kit offers', () => {
  it('are all distinct pictures, not one picture under several names', () => {
    const byShape = new Map<string, string[]>();
    for (const id of SOCIAL_BANNER_LAYOUT_IDS) {
      const key = render(id);
      byShape.set(key, [...(byShape.get(key) ?? []), id]);
    }
    const duplicates = [...byShape.values()].filter((group) => group.length > 1);
    expect(duplicates).toEqual([]);
    expect(byShape.size).toBe(SOCIAL_BANNER_LAYOUT_IDS.length);
  });

  it('stay distinct at a square-ish size, where a layout could collapse', () => {
    const shapes = SOCIAL_BANNER_LAYOUT_IDS.map((id) =>
      shape(
        generateSocialBannerSvg(config(), { layout: id, bgTheme: 'dark', title: 'Nebula' }, 1080, 1080)
      )
    );
    expect(new Set(shapes).size).toBe(SOCIAL_BANNER_LAYOUT_IDS.length);
  });

  it('each produce a complete document', () => {
    for (const id of SOCIAL_BANNER_LAYOUT_IDS) {
      const svg = render(id);
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    }
  });

  it('set the brand name wherever the composition carries type', () => {
    // "Minimal" is the mark on its own by design — it is the one that says
    // nothing, and that is the composition, not an omission.
    for (const id of SOCIAL_BANNER_LAYOUT_IDS.filter((l) => l !== 'minimal-clean')) {
      expect(render(id)).toContain('Nebula');
    }
    expect(render('minimal-clean')).not.toContain('Nebula');
  });
});

describe('the luxury composition', () => {
  it('draws the hairline frame that separates it from the hero layout', () => {
    const luxury = render('brand-luxury');
    const hero = render('center-hero');
    expect(luxury).toContain('Hairline double frame');
    expect(hero).not.toContain('Hairline double frame');
  });

  it('sets the wordmark in a serif face with tracking', () => {
    const svg = render('brand-luxury');
    expect(svg).toMatch(/font-family="Georgia[^"]*serif"/);
    expect(svg).toMatch(/letter-spacing="[0-9.]+"/);
  });

  it('drops the rule and the subtitle when there is no subtitle', () => {
    // Matched on the rule's own marker: the logo artwork contains <line>
    // elements of its own, so the bare tag proves nothing either way.
    expect(render('brand-luxury')).toContain('Hairline rule');
    expect(render('brand-luxury', { subtitle: '' })).not.toContain('Hairline rule');
  });

  it('keeps the whole lockup inside the frame at a short banner height', () => {
    // The stack is centred by measurement; a 1500×300 strip is where a
    // fixed offset would have pushed the subtitle out of the frame.
    const svg = generateSocialBannerSvg(
      config(),
      { layout: 'brand-luxury', bgTheme: 'dark', title: 'Nebula', subtitle: 'Design that carries' },
      1500,
      300
    );
    const ys = [...svg.matchAll(/<text[^>]*\sy="([\d.]+)"/g)].map((m) => Number(m[1]));
    expect(ys.length).toBeGreaterThan(0);
    for (const y of ys) {
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(300);
    }
  });
});

describe('composing inside the documented safe area', () => {
  /** The largest mark the layout draws, in canvas pixels. */
  const markHeight = (layout: SocialBannerOptions['layout'], w: number, h: number): number => {
    const svg = generateSocialBannerSvg(
      config(),
      { layout, bgTheme: 'dark', title: 'Nebula', subtitle: 'Smart technology solutions' },
      w,
      h
    );
    const scales = [...svg.matchAll(/<g transform="scale\(([\d.]+)\)"/g)].map((m) => Number(m[1]));
    return Math.max(...scales) * 512;
  };

  it('fits every composition inside the band a phone keeps', () => {
    // This is the fix. Each layout used to size its mark against the 1440-high
    // canvas and centre on it, while a phone keeps only the middle 423 — so the
    // mark was cut top and bottom and, in the centred hero, the wordmark and
    // tagline fell outside the crop entirely.
    const band = safeBandsFor(2560, 1440).at(-1)!;
    expect(band.height).toBe(423);
    for (const id of SOCIAL_BANNER_LAYOUT_IDS) {
      expect(markHeight(id, 2560, 1440)).toBeLessThanOrEqual(band.height);
    }
  });

  it('keeps the centred hero’s type inside the band too', () => {
    // Its baselines are absolute, which is what made it the worst case: they
    // sat at y 1007 and 1057 against a band ending at 931.5.
    const band = safeBandsFor(2560, 1440).at(-1)!;
    const top = (1440 - band.height) / 2;
    const svg = generateSocialBannerSvg(
      config(),
      { layout: 'center-hero', bgTheme: 'dark', title: 'Nebula', subtitle: 'Smart technology solutions' },
      2560,
      1440
    );
    const ys = [...svg.matchAll(/<text x="1280" y="([\d.]+)"/g)].map((m) => Number(m[1]));
    expect(ys.length).toBeGreaterThan(0);
    for (const y of ys) {
      expect(y).toBeGreaterThanOrEqual(top);
      expect(y).toBeLessThanOrEqual(top + band.height);
    }
  });

  it('draws the luxury frame on the band, not on the canvas edge', () => {
    const band = safeBandsFor(2560, 1440).at(-1)!;
    const svg = generateSocialBannerSvg(
      config(),
      { layout: 'brand-luxury', bgTheme: 'dark', title: 'Nebula', subtitle: 'Tagline' },
      2560,
      1440
    );
    const frame = /Hairline double frame -->\s*<rect x="([\d.]+)" y="([\d.]+)"/.exec(svg);
    expect(frame).not.toBeNull();
    expect(Number(frame![1])).toBeGreaterThanOrEqual((2560 - band.width) / 2);
    expect(Number(frame![2])).toBeGreaterThanOrEqual((1440 - band.height) / 2);
  });

  it('leaves a size with no documented band composing across the whole canvas', () => {
    // The stage is the canvas wherever nothing is published, so none of this
    // touches the sizes it has no numbers for.
    expect(safeBandsFor(1500, 500)).toEqual([]);
    expect(markHeight('center-hero', 1500, 500)).toBeCloseTo(500 * 0.42, 5);
    expect(markHeight('minimal-clean', 1500, 500)).toBeCloseTo(500 * 0.42, 5);
  });
});

describe('the compact composition', () => {
  it('is one of the compositions the picker offers', () => {
    expect(SOCIAL_BANNER_LAYOUT_IDS).toContain(COMPACT_BANNER_LAYOUT);
  });

  it('is a different picture from every other one', () => {
    const others = SOCIAL_BANNER_LAYOUT_IDS.filter((id) => id !== COMPACT_BANNER_LAYOUT);
    const compact = render(COMPACT_BANNER_LAYOUT);
    for (const id of others) expect(render(id)).not.toBe(compact);
  });
});

describe('the compact lockup’s placement', () => {
  /**
   * The lockup's own x on the canvas. Matched on the container comment because
   * the translates nested inside it are relative to the block, not the canvas —
   * mixing the two makes the numbers look wrong when the layout is right.
   */
  const containerX = (svg: string): number => {
    const m = /Central Safe-Area Container -->\s*<g transform="translate\((-?[\d.]+),/.exec(svg);
    expect(m).not.toBeNull();
    return Number(m![1]);
  };

  it('never starts off the left edge, at any banner width', () => {
    // It used to begin at a flat `cx - 500`, which is off-canvas for anything
    // under about 1000 wide — including the 640-wide picker thumbnail, where
    // the mark simply was not in the picture.
    for (const [w, h] of [
      [640, 240],
      [800, 300],
      [1500, 500],
      [2560, 1440],
    ]) {
      const svg = generateSocialBannerSvg(
        config(),
        { layout: COMPACT_BANNER_LAYOUT, bgTheme: 'dark', title: 'Nebula', subtitle: 'Tagline' },
        w,
        h
      );
      expect(containerX(svg)).toBeGreaterThanOrEqual(0);
    }
  });

  it('keeps a long brand name inside the phone band', () => {
    const band = safeBandsFor(2560, 1440).at(-1)!;
    const svg = generateSocialBannerSvg(
      config(),
      {
        layout: COMPACT_BANNER_LAYOUT,
        bgTheme: 'dark',
        title: 'Northwind Technology Group',
        subtitle: 'Smart technology solutions',
      },
      2560,
      1440
    );
    expect(containerX(svg)).toBeGreaterThanOrEqual((2560 - band.width) / 2);
  });
});
