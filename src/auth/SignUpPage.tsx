import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MailCheck } from 'lucide-react';
import { AuthField, AuthMessage, AuthShell, AuthSubmit } from './AuthShell';
import { AuthUnavailable } from './AuthUnavailable';
import { authErrorText, type AuthErrorText } from './authErrors';
import { getSupabase } from '../utils/supabaseClient';
import { authRedirectUrl, isAuthConfigured } from '../utils/supabaseConfig';
import type { Route } from '../utils/router';

/** Below this, a password is not worth calling one. Supabase enforces it too. */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Creating an account.
 *
 * Two outcomes, and they must not look alike. If the project requires email
 * confirmation, nobody is signed in yet and the only correct thing to show is
 * "go and check your email" — telling them they are in, when a click on a link
 * still stands between them and an account, is a small lie that costs a support
 * message. If confirmation is off, the session exists immediately and they go
 * straight to the studio.
 *
 * The length rule is checked here as well as by the provider, so the message
 * arrives while they are typing rather than after a round trip that fails.
 */
export const SignUpPage: React.FC<{ onNavigate: (to: Route) => void }> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthErrorText | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  if (!isAuthConfigured) return <AuthUnavailable onNavigate={onNavigate} />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError({ message: t('auth.errors.weakPassword') });
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

    const { data, error: failure } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: authRedirectUrl() },
    });

    if (failure) {
      setError(authErrorText(failure, t));
      setBusy(false);
      return;
    }

    // A session here means confirmation is switched off in the project and the
    // account is already usable. No session means an email is on its way, and
    // saying otherwise would be telling them they are in when they are not.
    if (data.session) {
      onNavigate('/studio');
      return;
    }

    setCheckEmail(true);
    setBusy(false);
  };

  if (checkEmail) {
    return (
      <AuthShell
        title={t('auth.signUp.checkTitle')}
        subtitle={t('auth.signUp.checkSubtitle', { email })}
        onNavigate={onNavigate}
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3">
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <p className="text-sm text-emerald-800">{t('auth.signUp.checkBody')}</p>
          </div>
          <button
            onClick={() => onNavigate('/studio')}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            {t('auth.signUp.meanwhile')}
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t('auth.signUp.title')}
      subtitle={t('auth.signUp.subtitle')}
      onNavigate={onNavigate}
      footer={
        <>
          {t('auth.signUp.haveAccount')}{' '}
          <button
            onClick={() => onNavigate('/signin')}
            className="font-bold text-indigo-600 hover:text-indigo-700"
          >
            {t('auth.signUp.signInInstead')}
          </button>
        </>
      }
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
          id="auth-email"
          label={t('auth.fields.email')}
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <AuthField
          id="auth-password"
          label={t('auth.fields.password')}
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          hint={t('auth.fields.passwordHint', { count: MIN_PASSWORD_LENGTH })}
        />

        <AuthSubmit
          busy={busy}
          label={t('auth.signUp.submit')}
          busyLabel={t('auth.signUp.submitting')}
        />

        <p className="text-[11px] leading-relaxed text-slate-500">{t('auth.signUp.localNote')}</p>
      </form>
    </AuthShell>
  );
};
