import { describe, expect, it } from 'vitest';
import { en } from '../../i18n/locales/en';
import { ar } from '../../i18n/locales/ar';
import { DEFAULT_LOGO_CONFIG } from '../templates';

/**
 * The opening design carries sample brand copy that follows the interface
 * language. The whole feature rests on one rule: it may only ever replace
 * text that is still the sample. If that guard breaks, switching language
 * silently destroys the user's work, so it is worth a test of its own.
 *
 * This mirrors the `isUntouchedSample` check in App.tsx.
 */
const SAMPLES = {
  text: [en.common.sampleBrandName, ar.common.sampleBrandName],
  tagline: [en.common.sampleTagline, ar.common.sampleTagline],
};

function isUntouchedSample(value: string, samples: string[]): boolean {
  if (!value.trim()) return true;
  return samples.includes(value);
}

describe('sample brand copy', () => {
  it('is defined in both locales and differs between them', () => {
    expect(en.common.sampleBrandName).toBeTruthy();
    expect(ar.common.sampleBrandName).toBeTruthy();
    expect(en.common.sampleBrandName).not.toBe(ar.common.sampleBrandName);
    expect(en.common.sampleTagline).not.toBe(ar.common.sampleTagline);
  });

  it('is not baked into the default config, which stays language-neutral', () => {
    expect(DEFAULT_LOGO_CONFIG.text).toBe('');
    expect(DEFAULT_LOGO_CONFIG.tagline).toBe('');
  });

  it('recognises the sample in either language as replaceable', () => {
    for (const sample of SAMPLES.text) {
      expect(isUntouchedSample(sample, SAMPLES.text)).toBe(true);
    }
    for (const sample of SAMPLES.tagline) {
      expect(isUntouchedSample(sample, SAMPLES.tagline)).toBe(true);
    }
  });

  it('treats empty text as replaceable', () => {
    expect(isUntouchedSample('', SAMPLES.text)).toBe(true);
    expect(isUntouchedSample('   ', SAMPLES.text)).toBe(true);
  });

  it('never treats the user’s own text as replaceable', () => {
    const userText = [
      'Acme Corp',
      'شركة أكمي',
      'Nebula Labs',              // starts with the English sample
      'سديم للتقنية',              // starts with the Arabic sample
      en.common.sampleBrandName + ' ',  // sample plus a trailing space
    ];
    for (const value of userText) {
      expect(isUntouchedSample(value, SAMPLES.text)).toBe(false);
    }
  });
});
