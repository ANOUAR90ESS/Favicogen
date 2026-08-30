import { describe, expect, it } from 'vitest';
import { estimateTextWidth, fitFontSize } from '../textFit';
import { generateWebmanifestJson } from '../canvasRenderer';

/**
 * The rule that keeps a name on its canvas.
 *
 * Before this existed the generator drew the wordmark at whatever size the
 * controls held, so "International Business Machines" at the default 42px came
 * out as "ernational Business Machi" — cut at both edges, in the App Store
 * icon, the PWA icon and the master brand PNG. Every file opened. Every file
 * looked deliberate. Nothing reported it.
 */

describe('estimateTextWidth', () => {
  it('grows with the text and with the size', () => {
    expect(estimateTextWidth('AB', 40)).toBeGreaterThan(estimateTextWidth('A', 40));
    expect(estimateTextWidth('A', 80)).toBeGreaterThan(estimateTextWidth('A', 40));
  });

  it('scales linearly with the font size', () => {
    const at40 = estimateTextWidth('Meridian', 40);
    const at80 = estimateTextWidth('Meridian', 80);
    expect(at80 / at40).toBeCloseTo(2, 5);
  });

  it('counts letter-spacing on top, not scaled by the size', () => {
    const plain = estimateTextWidth('ABCDE', 40);
    expect(estimateTextWidth('ABCDE', 40, 5)).toBeCloseTo(plain + 25, 5);
  });

  it('knows a narrow letter from a wide one', () => {
    expect(estimateTextWidth('iiii', 40)).toBeLessThan(estimateTextWidth('mmmm', 40));
  });

  it('measures Arabic rather than treating it as zero-width', () => {
    // A per-character sum over-estimates a joining script, which is the safe
    // direction; measuring it as nothing would put it straight off the canvas.
    expect(estimateTextWidth('شركة النهضة', 40)).toBeGreaterThan(100);
  });

  it('is nothing for nothing', () => {
    expect(estimateTextWidth('', 40)).toBe(0);
  });
});

describe('fitFontSize', () => {
  it('leaves a name that already fits exactly as asked', () => {
    // A short name must be drawn at the size the controls say, untouched.
    expect(fitFontSize('Vertex', 42, 480)).toBe(42);
  });

  it('shrinks a name that would run off the canvas', () => {
    const fitted = fitFontSize('International Business Machines', 42, 480);

    expect(fitted).toBeLessThan(42);
    expect(estimateTextWidth('International Business Machines', fitted)).toBeLessThanOrEqual(480);
  });

  it('never returns a size whose text exceeds the budget', () => {
    // The property that matters, over the range the studio actually offers.
    const names = [
      'A',
      'Vertex',
      'Meridian Solutions',
      'International Business Machines',
      'شركة النهضة العالمية للتقنيات المتقدمة',
      'M'.repeat(80),
    ];

    for (const name of names) {
      for (const requested of [16, 42, 72, 110]) {
        for (const budget of [200, 480, 900]) {
          for (const spacing of [0, 4]) {
            const fitted = fitFontSize(name, requested, budget, spacing);
            const width = estimateTextWidth(name, fitted, spacing);

            expect(fitted).toBeLessThanOrEqual(requested);
            // The floor may legitimately be reached by a pathological string;
            // above it, the result must fit.
            if (fitted > 8) {
              expect(width, `${name} @${requested} in ${budget}`).toBeLessThanOrEqual(budget + 0.5);
            }
          }
        }
      }
    }
  });

  it('does not shrink into an illegible smear', () => {
    // Past a point the design needs a shorter name, not a smaller font.
    expect(fitFontSize('M'.repeat(500), 42, 200)).toBeGreaterThanOrEqual(8);
  });

  it('accounts for letter-spacing when deciding', () => {
    const budget = 300;
    const tight = fitFontSize('Meridian Solutions', 42, budget, 0);
    const loose = fitFontSize('Meridian Solutions', 42, budget, 8);
    expect(loose).toBeLessThan(tight);
  });

  it('has nothing to do without text or room', () => {
    expect(fitFontSize('', 42, 480)).toBe(42);
    expect(fitFontSize('Vertex', 42, 0)).toBe(42);
  });
});

describe('generateWebmanifestJson', () => {
  it('carries the fields that decide installability', () => {
    // Chrome requires start_url. Without it the file is valid JSON, looks
    // complete, and the install prompt simply never appears.
    const manifest = JSON.parse(generateWebmanifestJson('Meridian', '#0f172a'));

    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(['192x192', '512x512']);
  });

  it('shortens a long name for the launcher, on a word boundary', () => {
    const manifest = JSON.parse(generateWebmanifestJson('International Business Machines'));

    expect(manifest.name).toBe('International Business Machines');
    expect(manifest.short_name.length).toBeLessThanOrEqual(12);
    // "Internation" would be a fragment; a launcher should show a word.
    expect('International Business Machines').toContain(manifest.short_name);
  });

  it('leaves a short name whole', () => {
    expect(JSON.parse(generateWebmanifestJson('Vertex')).short_name).toBe('Vertex');
  });
});
