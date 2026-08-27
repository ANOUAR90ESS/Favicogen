import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthField, AuthMessage, AuthShell, AuthSubmit } from './AuthShell';
import { AuthUnavailable } from './AuthUnavailable';
import { authErrorText, type AuthErrorText } from './authErrors';
import { getSupabase } from '../utils/supabaseClient';
import { isAuthConfigured } from '../utils/supabaseConfig';
import type { Route } from '../utils/router';

const MIN_PASSWORD_LENGTH = 8;

/**
 * Setting a new password, at the end of a recovery link.
 *
 * Arriving here means the link put a recovery session in place — that session
 * is the entire proof of identity, so there is no old password to ask for and
 * asking would only be theatre. What the page must do is wait for that session
 * before showing the form: the client reads the token out of the URL
 * asynchronously, and a form rendered before it lands submits into nothing and
 * fails for a reason the visitor cannot act on.
 *
 * An expired or already-used link produces no session at all, and that gets
 * said plainly with a way to request another rather than a form that cannot
 * work.
 */
export const UpdatePasswordPage: React.FC<{ onNavigate: (to: Route) => void }> = ({
  onNavigate,
}) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthErrorText | null>(null);
  const [linkState, setLinkState] = useState<'checking' | 'ready' | 'expired'>('checking');

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    // Nothing after a fair wait means the link was expired, already spent, or
    // never carried a token at all. Started before the client is fetched, so a
    // client that never arrives still resolves the page instead of leaving it
    // on a progress bar with nothing behind it.
    const giveUp = setTimeout(() => {
      if (!cancelled) setLinkState((current) => (current === 'checking' ? 'expired' : current));
    }, 6000);

    void getSupabase().then((supabase) => {
      if (cancelled || !supabase) return;

      // The token arrives in the URL and is exchanged asynchronously, so a
      // session that is absent right now may still be seconds away. The
      // listener catches that; the immediate read covers one already in place.
      const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!cancelled && session) setLinkState('ready');
      });
      unsubscribe = () => subscription.subscription.unsubscribe();

      void supabase.auth.getSession().then(({ data }) => {
        if (!cancelled && data.session) setLinkState('ready');
      });
    });

    return () => {
      cancelled = true;
      clearTimeout(giveUp);
      unsubscribe?.();
    };
  }, []);

  if (!isAuthConfigured) return <AuthUnavailable onNavigate={onNavigate} />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError({ message: t('auth.errors.weakPassword') });
      return;
    }
    if (password !== confirmation) {
      setError({ message: t('auth.errors.mismatch') });
      return;
    }

    setBusy(true);
    setError(null);

    const supabase = await getSupabase();
    if (!supabase) {
      // Configured, but the client could not be fetched — offline, or a
      // blocked chunk. Saying nothing would look like a form that ignores you.
      setError({ message: t('auth.errors.offline') });
      setBusy(false);
      return;
    }

    const { error: failure } = await supabase.auth.updateUser({ password });

    if (failure) {
      setError(authErrorText(failure, t));
      setBusy(false);
      return;
    }

    onNavigate('/studio');
  };

  if (linkState === 'checking') {
    return (
      <AuthShell
        title={t('auth.update.title')}
        subtitle={t('auth.update.checking')}
        onNavigate={onNavigate}
      >
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-indigo-500" />
        </div>
      </AuthShell>
    );
  }

  if (linkState === 'expired') {
    return (
      <AuthShell
        title={t('auth.update.expiredTitle')}
        subtitle={t('auth.update.expiredSubtitle')}
        onNavigate={onNavigate}
      >
        <button
          onClick={() => onNavigate('/reset-password')}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-indigo-700"
        >
          {t('auth.update.requestAnother')}
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t('auth.update.title')}
      subtitle={t('auth.update.subtitle')}
      onNavigate={onNavigate}
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <AuthMessage tone="error">
            {error.message}
            {error.detail && (
              <span className="mt-1 block text-[11px] opacity-70" dir="ltr">
                {error.detail}
              </span>
            )}
          </AuthMessage>
        )}

        <AuthField
          id="auth-password"
          label={t('auth.update.newPassword')}
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          hint={t('auth.fields.passwordHint', { count: MIN_PASSWORD_LENGTH })}
        />
        <AuthField
          id="auth-password-confirm"
          label={t('auth.update.confirmPassword')}
          type="password"
          value={confirmation}
          onChange={setConfirmation}
          autoComplete="new-password"
        />

        <AuthSubmit
          busy={busy}
          label={t('auth.update.submit')}
          busyLabel={t('auth.update.submitting')}
        />
      </form>
    </AuthShell>
  );
};
