import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthField, AuthMessage, AuthShell, AuthSubmit } from './AuthShell';
import { AuthUnavailable } from './AuthUnavailable';
import { authErrorText, type AuthErrorText } from './authErrors';
import { getSupabase } from '../utils/supabaseClient';
import { isAuthConfigured } from '../utils/supabaseConfig';
import type { Route } from '../utils/router';

/**
 * Signing in.
 *
 * Nothing here gates the studio: someone who never signs in loses no feature,
 * which is why the page can afford to be this plain. Success goes back to the
 * workspace rather than to an account screen, because the workspace is what
 * anyone came here for.
 */
export const SignInPage: React.FC<{ onNavigate: (to: Route) => void }> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthErrorText | null>(null);

  if (!isAuthConfigured) return <AuthUnavailable onNavigate={onNavigate} />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
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

    const { error: failure } = await supabase.auth.signInWithPassword({ email, password });

    if (failure) {
      setError(authErrorText(failure, t));
      setBusy(false);
      return;
    }

    // The session lands through the provider's listener; this only moves them
    // on. Left here, a signed-in visitor would be staring at a sign-in form.
    onNavigate('/studio');
  };

  return (
    <AuthShell
      title={t('auth.signIn.title')}
      subtitle={t('auth.signIn.subtitle')}
      onNavigate={onNavigate}
      footer={
        <>
          {t('auth.signIn.noAccount')}{' '}
          <button
            onClick={() => onNavigate('/signup')}
            className="font-bold text-indigo-600 hover:text-indigo-700"
          >
            {t('auth.signIn.createOne')}
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
          autoComplete="current-password"
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onNavigate('/reset-password')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            {t('auth.signIn.forgot')}
          </button>
        </div>

        <AuthSubmit
          busy={busy}
          label={t('auth.signIn.submit')}
          busyLabel={t('auth.signIn.submitting')}
        />
      </form>
    </AuthShell>
  );
};
