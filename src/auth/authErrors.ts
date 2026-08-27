import type { TFunction } from 'i18next';

/**
 * Provider errors, said in the visitor's language.
 *
 * Supabase answers in English with wording aimed at developers. Showing it raw
 * puts an untranslated sentence in the middle of an Arabic page, and some of it
 * describes internals nobody typing a password needs.
 *
 * Known cases are translated. Anything unrecognised gets a translated sentence
 * *and* the original underneath in small print — hiding it entirely would leave
 * someone stuck with no idea why, and pretending an unknown failure is a known
 * one is the kind of guess this codebase keeps deciding not to make.
 */
export interface AuthErrorText {
  message: string;
  detail?: string;
}

const KNOWN: Array<{ match: RegExp; key: string }> = [
  { match: /invalid login credentials/i, key: 'auth.errors.badCredentials' },
  { match: /email not confirmed/i, key: 'auth.errors.notConfirmed' },
  { match: /user already registered|already registered/i, key: 'auth.errors.alreadyRegistered' },
  { match: /password should be at least/i, key: 'auth.errors.weakPassword' },
  { match: /unable to validate email|invalid email/i, key: 'auth.errors.badEmail' },
  { match: /email rate limit|over_email_send_rate_limit|too many requests/i, key: 'auth.errors.rateLimited' },
  { match: /token has expired|invalid or has expired|otp_expired/i, key: 'auth.errors.linkExpired' },
  { match: /failed to fetch|network|load failed/i, key: 'auth.errors.offline' },
];

export function authErrorText(error: unknown, t: TFunction): AuthErrorText {
  const raw =
    error instanceof Error ? error.message : typeof error === 'string' ? error : '';

  for (const { match, key } of KNOWN) {
    if (match.test(raw)) return { message: t(key) };
  }

  return { message: t('auth.errors.generic'), detail: raw || undefined };
}
