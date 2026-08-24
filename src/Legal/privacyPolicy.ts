/**
 * The privacy policy, loaded from the same Markdown files the app serves at
 * /legal/.
 *
 * These used to be hand-copied template literals, and the copies had already
 * drifted: the served English file had silently lost its "Changes to This
 * Policy" section, which Google Play requires. Importing the served files as
 * raw text means there is one source per language and the in-app modal cannot
 * disagree with the published document.
 */

import privacyEn from '../../public/legal/PRIVACY_POLICY.md?raw';
import privacyAr from '../../public/legal/PRIVACY_POLICY.ar.md?raw';

export const PRIVACY_POLICY_MD: string = privacyEn;
export const PRIVACY_POLICY_AR: string = privacyAr;

/** Public URL of each document, for the "view the published version" link. */
export const PRIVACY_POLICY_URL = {
  en: '/legal/PRIVACY_POLICY.md',
  ar: '/legal/PRIVACY_POLICY.ar.md',
} as const;
