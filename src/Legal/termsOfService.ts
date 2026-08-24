/**
 * The terms of service, loaded from the same Markdown files the app serves at
 * /legal/. See privacyPolicy.ts for why these are imported rather than copied.
 */

import termsEn from '../../public/legal/TERMS_OF_SERVICE.md?raw';
import termsAr from '../../public/legal/TERMS_OF_SERVICE.ar.md?raw';

export const TERMS_OF_SERVICE_MD: string = termsEn;
export const TERMS_OF_SERVICE_AR: string = termsAr;

export const TERMS_OF_SERVICE_URL = {
  en: '/legal/TERMS_OF_SERVICE.md',
  ar: '/legal/TERMS_OF_SERVICE.ar.md',
} as const;
