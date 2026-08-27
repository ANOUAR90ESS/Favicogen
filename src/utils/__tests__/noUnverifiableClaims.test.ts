import { describe, expect, it } from 'vitest';
import { en } from '../../i18n/locales/en';
import { ar } from '../../i18n/locales/ar';

/**
 * The interface may not certify what it cannot check.
 *
 * Three strings shipped beside a green tick claiming the output "meets
 * official 2026 specifications" and was "100% compliant" — a standard nobody
 * publishes, asserted by an app with no way to verify it. That is the same
 * fabrication as a made-up rating, just worded like reassurance.
 *
 * What the app can say is what it does: it draws at the sizes the platforms
 * publish, from vector, without upscaling. These tests keep the copy on that
 * side of the line, in both locales.
 */

const flatten = (node: unknown, path: string[] = []): [string, string][] => {
  if (typeof node === 'string') return [[path.join('.'), node]];
  if (!node || typeof node !== 'object') return [];
  return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
    flatten(value, [...path, key])
  );
};

const strings = [
  ...flatten(en).map(([k, v]) => ['en:' + k, v] as const),
  ...flatten(ar).map(([k, v]) => ['ar:' + k, v] as const),
];

// A scan over nothing passes every rule it is given, so prove there is copy here.
if (strings.length < 500) {
  throw new Error(`only ${strings.length} strings reached the claim scan`);
}

/** Each pattern is a claim about the world that the app cannot substantiate. */
const forbidden: { label: string; pattern: RegExp }[] = [
  { label: 'a standard published for a given year', pattern: /(official|رسمي\w*|معايير)[^.]{0,40}20\d\d/i },
  { label: 'a percentage of compliance', pattern: /100\s*%\s*(compliant|متوافق)|(compliant|متوافق)\s*100\s*%/i },
  { label: 'a guarantee', pattern: /\bguarantee(d|s)?\b|\bمضمون\b/i },
  { label: 'approval by a platform', pattern: /\b(approved|certified)\s+by\b|\bمعتمد\s+من\b/i },
  { label: 'a fabricated audience number', pattern: /\b\d+[KMB]\+?\s*(downloads|users|subscribers)\b/i },
  { label: 'a fabricated rating', pattern: /★\s*\d|\b\d\.\d\s*(rating|stars)\b/i },
];

describe('the interface copy', () => {
  for (const { label, pattern } of forbidden) {
    it(`never asserts ${label}`, () => {
      const offenders = strings
        .filter(([, value]) => pattern.test(value))
        .map(([key, value]) => `${key} → ${value}`);
      expect(offenders).toEqual([]);
    });
  }

  it('still says the true thing in its place', () => {
    // The replacement has to carry real information, or the fix is just a
    // deletion dressed up as a correction.
    expect(en.socialKitModal.allAssetsRenderedPixel).toMatch(/published/i);
    expect(en.faviconModal.compliantNote).toMatch(/published/i);
    expect(en.youtubeKitModal.compliantNote).toMatch(/published/i);
    for (const key of ['allAssetsRenderedPixel'] as const) {
      expect(ar.socialKitModal[key].length).toBeGreaterThan(20);
    }
  });
});
