import { describe, expect, it } from 'vitest';
import { authErrorText } from '../authErrors';

/**
 * Provider errors, mapped to something a person can act on.
 *
 * The rule being protected is in the fallback: an unrecognised failure must not
 * be dressed up as a recognised one. Guessing "wrong password" at someone whose
 * connection dropped sends them to reset a password that was never the problem.
 */

// The real `t` resolves keys against the locales; here the key itself is the
// answer, which makes the mapping visible in the assertion.
const t = ((key: string) => key) as unknown as Parameters<typeof authErrorText>[1];

describe('authErrorText', () => {
  it('translates the failures a person can do something about', () => {
    expect(authErrorText(new Error('Invalid login credentials'), t).message).toBe(
      'auth.errors.badCredentials'
    );
    expect(authErrorText(new Error('Email not confirmed'), t).message).toBe(
      'auth.errors.notConfirmed'
    );
    expect(authErrorText(new Error('User already registered'), t).message).toBe(
      'auth.errors.alreadyRegistered'
    );
    expect(authErrorText(new Error('Password should be at least 6 characters'), t).message).toBe(
      'auth.errors.weakPassword'
    );
    expect(authErrorText(new Error('Email rate limit exceeded'), t).message).toBe(
      'auth.errors.rateLimited'
    );
    expect(authErrorText(new Error('Failed to fetch'), t).message).toBe('auth.errors.offline');
  });

  it('reads a plain string, which is how a rejected link arrives', () => {
    // The callback route pulls `error_description` out of the URL; it is text,
    // not an Error, and it is the only account failure that reaches us that way.
    expect(authErrorText('Email link is invalid or has expired', t).message).toBe(
      'auth.errors.linkExpired'
    );
  });

  it('never guesses at an unfamiliar failure, and keeps the original', () => {
    const unknown = authErrorText(new Error('database connection pool exhausted'), t);

    expect(unknown.message).toBe('auth.errors.generic');
    // Hiding it entirely would leave someone stuck with nothing to report.
    expect(unknown.detail).toBe('database connection pool exhausted');
  });

  it('has nothing to add when there is no message at all', () => {
    expect(authErrorText(undefined, t)).toEqual({ message: 'auth.errors.generic' });
    expect(authErrorText(new Error(''), t).detail).toBeUndefined();
  });
});
