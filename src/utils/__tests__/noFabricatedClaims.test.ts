import { describe, expect, it } from 'vitest';
import { generateFeatureGraphicSvg, generateSocialBannerSvg } from '../canvasRenderer';
import { DEFAULT_LOGO_CONFIG } from '../templates';
import type { FeatureGraphicOptions, LogoConfig, SocialBannerOptions } from '../../types';

/**
 * Every generator here writes onto an asset the user will publish: a Play
 * Store listing graphic, a YouTube banner, a LinkedIn cover. Anything this
 * tool puts there that the user did not type is a claim made in their name.
 *
 * The app shipped doing exactly that — a "★ 4.9 • 100K+ Downloads" badge, a
 * five-star rating bar, a "VERIFIED CHANNEL • 2026" pill and a fabricated
 * upload schedule, all on by default. This test is the reason it cannot come
 * back: a defaults-only render must contain none of it.
 */

const config = (overrides: Partial<LogoConfig> = {}): LogoConfig => ({
  ...DEFAULT_LOGO_CONFIG,
  ...overrides,
});

/** Claims a logo tool can never legitimately know. */
const FABRICATED = [
  /★/,
  /\bratings?\b/i,
  /\bdownloads?\b/i,
  /\bverified\b/i,
  /\bofficial channel\b/i,
  /\bsubscribers?\b/i,
  /\bfollowers?\b/i,
  /\breviews?\b/i,
  /\bget it on\b/i,
  /\bgoogle play\b/i,
  /\bnew videos\b/i,
  /\b\d+(\.\d+)?\s*(k|m)\+/i,
];

function expectNoClaims(markup: string) {
  for (const pattern of FABRICATED) {
    expect(markup, `generated asset must not assert ${pattern}`).not.toMatch(pattern);
  }
}

const featureOptions = (o: Partial<FeatureGraphicOptions> = {}): FeatureGraphicOptions => ({
  layout: 'center-hero',
  title: '',
  subtitle: '',
  badgeText: '',
  bgTheme: 'brand',
  showPhoneMockup: true,
  showGlowEffect: true,
  ...o,
});

const bannerOptions = (o: Partial<SocialBannerOptions> = {}): SocialBannerOptions => ({
  layout: 'center-hero',
  bgTheme: 'dark',
  ...o,
});

describe('generated assets assert nothing the user did not type', () => {
  it.each(['center-hero', 'split-phone', 'mesh-gradient', 'minimal-luxury', 'arabesque', 'store-spotlight'] as const)(
    'feature graphic — %s layout',
    (layout) => {
      expectNoClaims(generateFeatureGraphicSvg(config(), featureOptions({ layout })));
    }
  );

  it.each(['center-hero', 'youtube-channel', 'split-hero', 'minimal-clean'] as const)(
    'social banner — %s layout',
    (layout) => {
      expectNoClaims(generateSocialBannerSvg(config(), bannerOptions({ layout }), 2560, 1440));
    }
  );

  it('draws no badge pill when the user left the badge empty', () => {
    const withBadge = generateSocialBannerSvg(
      config(),
      bannerOptions({ showBadge: true, badgeText: 'Founded 2019' }),
      2560,
      1440
    );
    const withoutBadge = generateSocialBannerSvg(
      config(),
      bannerOptions({ showBadge: true, badgeText: '   ' }),
      2560,
      1440
    );

    expect(withBadge).toContain('Founded 2019');
    expect(withoutBadge.length).toBeLessThan(withBadge.length);
  });

  it('still prints what the user did type', () => {
    const markup = generateFeatureGraphicSvg(
      config(),
      featureOptions({ title: 'Fyntica', subtitle: 'Invoicing made simple', badgeText: 'Beta' })
    );

    expect(markup).toContain('Fyntica');
    expect(markup).toContain('Invoicing made simple');
    expect(markup).toContain('Beta');
  });

  it('joins a handle and a schedule only when both are given', () => {
    const both = generateSocialBannerSvg(
      config(),
      bannerOptions({ layout: 'youtube-channel', channelHandle: '@fyntica', uploadSchedule: 'Weekly' }),
      2560,
      1440
    );
    const handleOnly = generateSocialBannerSvg(
      config(),
      bannerOptions({ layout: 'youtube-channel', channelHandle: '@fyntica' }),
      2560,
      1440
    );

    expect(both).toContain('@fyntica • Weekly');
    expect(handleOnly).toContain('@fyntica');
    expect(handleOnly).not.toContain('•');
  });
});
