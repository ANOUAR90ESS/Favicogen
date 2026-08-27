import { describe, expect, it } from 'vitest';
import { cropSvgToBand, safeBandsFor } from '../platformAssets';
import { generateSocialBannerSvg } from '../canvasRenderer';
import { DEFAULT_LOGO_CONFIG } from '../templates';
import type { SafeBand } from '../platformAssets';

/**
 * Showing where the crop falls still leaves the user to picture the result.
 * This applies the crop instead — and it must apply the platform's own band,
 * to the file that will actually be exported, or it is worth less than the
 * guide it replaces.
 */

const band = (o: Partial<SafeBand> = {}): SafeBand => ({
  width: 1546,
  height: 423,
  emphasis: 'primary',
  label: 'Mobile 1546 × 423',
  device: 'mobile',
  ...o,
});

const banner = (w = 2560, h = 1440) =>
  generateSocialBannerSvg(DEFAULT_LOGO_CONFIG, { layout: 'center-hero', bgTheme: 'dark' }, w, h);

const openTag = (svg: string) => svg.slice(0, svg.indexOf('>') + 1);

describe('cropSvgToBand', () => {
  it('centres the band, the way the platforms crop', () => {
    const cropped = cropSvgToBand(banner(), band(), 2560, 1440);
    // (2560 - 1546) / 2 = 507, (1440 - 423) / 2 = 508.5
    expect(openTag(cropped)).toContain('viewBox="507 508.5 1546 423"');
  });

  it('resizes the frame to the band so the aspect ratio is the device’s', () => {
    const tag = openTag(cropSvgToBand(banner(), band(), 2560, 1440));
    expect(tag).toContain('width="1546"');
    expect(tag).toContain('height="423"');
  });

  it('keeps the artwork itself untouched — this is the exported file, cropped', () => {
    const full = banner();
    const cropped = cropSvgToBand(full, band(), 2560, 1440);
    const body = (svg: string) => svg.slice(svg.indexOf('>') + 1);
    expect(body(cropped)).toBe(body(full));
  });

  it('crops each published band to its own frame', () => {
    const full = banner();
    const tags = safeBandsFor(2560, 1440).map((b) => openTag(cropSvgToBand(full, b, 2560, 1440)));
    expect(tags).toHaveLength(3);
    expect(new Set(tags).size).toBe(3);
    expect(tags[0]).toContain('width="2560"');
    expect(tags[2]).toContain('width="1546"');
  });

  it('leaves a band larger than its canvas alone — there is nothing out there to show', () => {
    const full = banner(1500, 500);
    expect(cropSvgToBand(full, band({ width: 2560 }), 1500, 500)).toBe(full);
    expect(cropSvgToBand(full, band({ height: 900 }), 1500, 500)).toBe(full);
  });

  it('returns anything it cannot parse unchanged rather than corrupting it', () => {
    expect(cropSvgToBand('', band(), 2560, 1440)).toBe('');
    expect(cropSvgToBand('<div>not an svg</div>', band(), 2560, 1440)).toBe('<div>not an svg</div>');
    // an <svg> with no viewBox has no coordinate system to crop against
    const noViewBox = '<svg width="10" height="10"><rect /></svg>';
    expect(cropSvgToBand(noViewBox, band({ width: 5, height: 5 }), 10, 10)).toBe(noViewBox);
  });
});

describe('the bands themselves', () => {
  it('name the device each one belongs to', () => {
    expect(safeBandsFor(2560, 1440).map((b) => b.device)).toEqual([
      'desktop',
      'tablet',
      'mobile',
    ]);
  });

  it('give the tightest crop to the smallest screen', () => {
    const bands = safeBandsFor(2560, 1440);
    const mobile = bands.find((b) => b.device === 'mobile');
    expect(mobile?.width).toBe(Math.min(...bands.map((b) => b.width)));
    expect(mobile?.emphasis).toBe('primary');
  });
});
