import { describe, expect, it } from 'vitest';
import { __internals } from '../fontEmbedder';

const { extractWeights, nearestWeight, parseFontFaceBlocks } = __internals;

/**
 * The typefaces now ship with the app instead of being fetched from Google at
 * the moment of export. Two things had to change for that, and both are the
 * kind that fail quietly: where the stylesheet is read from, and how much of
 * it ends up inside every exported file.
 */

describe('parsing the bundled stylesheet', () => {
  const sheet = `
    /* Cairo — arabic 700 */
    @font-face {
      font-family: 'Cairo';
      font-style: normal;
      font-weight: 700;
      src: url(./cairo-700-arabic.woff2) format('woff2');
      unicode-range: U+0600-06FF;
    }
    /* Outfit — latin 400 */
    @font-face {
      font-family: 'Outfit';
      font-weight: 400;
      src: url(./outfit-400-latin.woff2) format('woff2');
      unicode-range: U+0000-00FF;
    }
  `;

  it('resolves relative urls against the stylesheet, not the page', () => {
    // The sheet lives under /fonts/; a page at /studio would otherwise ask for
    // /studio/cairo-700-arabic.woff2 and get an HTML 404 body as font bytes.
    const byFamily = parseFontFaceBlocks(sheet, 'https://example.test/fonts/fonts.css');
    expect(byFamily.get('Cairo')?.[0].url).toBe(
      'https://example.test/fonts/cairo-700-arabic.woff2'
    );
  });

  it('groups by family and keeps each face’s weight', () => {
    const byFamily = parseFontFaceBlocks(sheet, 'https://example.test/fonts/fonts.css');
    expect([...byFamily.keys()].sort()).toEqual(['Cairo', 'Outfit']);
    expect(byFamily.get('Cairo')?.[0].weight).toBe(700);
    expect(byFamily.get('Cairo')?.[0].unicodeRanges).toEqual([[0x0600, 0x06ff]]);
  });

  it('ignores a family the app does not offer', () => {
    const byFamily = parseFontFaceBlocks(
      `@font-face { font-family: 'Comic Sans MS'; font-weight: 400; src: url(./x.woff2); }`,
      'https://example.test/fonts/fonts.css'
    );
    expect(byFamily.size).toBe(0);
  });
});

describe('extractWeights', () => {
  it('finds the weights the artwork paints', () => {
    const svg = '<svg><text font-weight="800">A</text><text font-weight="500">B</text></svg>';
    expect(extractWeights(svg).sort()).toEqual([500, 800]);
  });

  it('adds the inherited default when a run carries no weight', () => {
    const svg = '<svg><text font-weight="800">A</text><text>B</text></svg>';
    expect(extractWeights(svg).sort()).toEqual([400, 800]);
  });

  it('falls back to the regular face rather than embedding none', () => {
    expect(extractWeights('<svg><rect /></svg>')).toEqual([400]);
  });
});

describe('nearestWeight', () => {
  it('takes the exact weight when the family ships it', () => {
    expect(nearestWeight([300, 400, 700, 900], 700)).toBe(700);
  });

  it('takes the closest when it does not, the way a browser would', () => {
    // Dropping the run instead would silently lose its typeface, which is the
    // failure this module exists to prevent.
    expect(nearestWeight([400, 700], 500)).toBe(400);
    expect(nearestWeight([400, 700], 600)).toBe(700);
    expect(nearestWeight([400], 900)).toBe(400);
  });
});
