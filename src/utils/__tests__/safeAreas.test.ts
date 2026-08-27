import { describe, expect, it } from 'vitest';
import { hasDocumentedSafeArea, safeBandsFor } from '../platformAssets';
import { generateSocialBannerSvg, SOCIAL_MEDIA_PRESETS } from '../canvasRenderer';
import { DEFAULT_LOGO_CONFIG } from '../templates';
import type { LogoConfig, SocialBannerOptions } from '../../types';

/**
 * A safe-area guide is a promise that what sits inside it survives the crop
 * on a real device. The generator used to draw a dashed box at 8% / 10% inset
 * on every size it did not recognise — a guess presented as a specification,
 * which a user could trust and still lose their logo to a crop.
 *
 * These tests hold the line: a guide appears only where the numbers came from
 * the platform.
 */

const config = (o: Partial<LogoConfig> = {}): LogoConfig => ({ ...DEFAULT_LOGO_CONFIG, ...o });
const banner = (o: Partial<SocialBannerOptions> = {}): SocialBannerOptions => ({
  layout: 'center-hero',
  bgTheme: 'dark',
  ...o,
});

describe('safeBandsFor', () => {
  it('gives YouTube its three published bands, tightest last', () => {
    const bands = safeBandsFor(2560, 1440);
    expect(bands.map((b) => b.width)).toEqual([2560, 1855, 1546]);
    expect(bands.every((b) => b.height === 423)).toBe(true);
    // the mobile crop is the one that actually constrains the design
    expect(bands.at(-1)?.emphasis).toBe('primary');
    expect(bands.filter((b) => b.emphasis === 'primary')).toHaveLength(1);
  });

  it('gives nothing for a size no platform documents', () => {
    expect(safeBandsFor(1500, 500)).toEqual([]);
    expect(safeBandsFor(1200, 675)).toEqual([]);
    expect(safeBandsFor(1584, 396)).toEqual([]);
    expect(safeBandsFor(999, 999)).toEqual([]);
  });

  it('labels each band with its own measurements', () => {
    for (const band of safeBandsFor(2560, 1440)) {
      expect(band.label).toContain(String(band.width));
      expect(band.label).toContain(String(band.height));
    }
  });

  it('never reports a safe area it has no bands for', () => {
    for (const preset of SOCIAL_MEDIA_PRESETS) {
      expect(hasDocumentedSafeArea(preset.width, preset.height)).toBe(
        safeBandsFor(preset.width, preset.height).length > 0
      );
    }
  });
});

describe('the banner generator', () => {
  it('draws the guide where it is documented', () => {
    const svg = generateSocialBannerSvg(config(), banner({ showSafeZone: true }), 2560, 1440);
    expect(svg).toContain('Mobile 1546 × 423');
    expect(svg).toContain('Desktop 2560 × 423');
  });

  it('draws nothing extra where it is not', () => {
    // Asking for the guide on an undocumented size must add no guide markup —
    // not a fainter one, not a guessed one. (Byte equality with the guide off
    // would be the strongest claim, but every render namespaces its ids with a
    // fresh counter, so two renders are never identical anyway.)
    for (const [w, h] of [
      [1500, 500],
      [1200, 675],
      [1584, 396],
    ]) {
      const svg = generateSocialBannerSvg(config(), banner({ showSafeZone: true }), w, h);
      expect(svg).not.toMatch(/stroke-dasharray="14 6"/);
      expect(svg).not.toMatch(/stroke-dasharray="10 5"/);
      expect(svg).not.toMatch(/Mobile \d+ × \d+/);
    }
  });

  it('leaves the artwork alone when the guide is off', () => {
    const on = generateSocialBannerSvg(config(), banner({ showSafeZone: true }), 2560, 1440);
    const off = generateSocialBannerSvg(config(), banner({ showSafeZone: false }), 2560, 1440);
    expect(on.length).toBeGreaterThan(off.length);
    expect(off).not.toContain('1546');
  });
});
