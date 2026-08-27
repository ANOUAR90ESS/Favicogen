import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MailCheck } from 'lucide-react';
import { AuthField, AuthMessage, AuthShell, AuthSubmit } from './AuthShell';
import { AuthUnavailable } from './AuthUnavailable';
import { authErrorText, type AuthErrorText } from './authErrors';
import { getSupabase } from '../utils/supabaseClient';
import { authRedirectUrl, isAuthConfigured } from '../utils/supabaseConfig';
import type { Route } from '../utils/router';

/**
 * Asking for a recovery link.
 *
 * The confirmation says an email has been sent *if that address has an
 * account* — deliberately, and it is not vagueness for its own sake. A page
 * that answers differently for a registered address than for an unregistered
 * one lets anyone check whether a given person has an account here, one address
 * at a time. The provider already declines to distinguish them; this wording is
 * what stops the screen from undoing that.
 */
export const ResetPasswordPage: React.FC<{ onNavigate: (to: Route) => void }> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthErrorText | null>(null);
  const [sent, setSent] = useState(false);

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

    const { error: failure } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectUrl('/update-password'),
    });

    // Rate limiting and a malformed address are worth saying out loud; both are
    // about the request itself, not about who does or does not have an account.
    if (failure) {
      setError(authErrorText(failure, t));
      setBusy(false);
      return;
    }

    setSent(true);
    setBusy(false);
  };

  if (sent) {
    return (
      <AuthShell
        title={t('auth.reset.sentTitle')}
        subtitle={t('auth.reset.sentSubtitle')}
        onNavigate={onNavigate}
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3">
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <p className="text-sm text-emerald-800">{t('auth.reset.sentBody')}</p>
          </div>
          <button
            onClick={() => onNavigate('/signin')}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            {t('auth.reset.backToSignIn')}
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t('auth.reset.title')}
      subtitle={t('auth.reset.subtitle')}
      onNavigate={onNavigate}
      footer={
        <button
          onClick={() => onNavigate('/signin')}
          className="font-bold text-indigo-600 hover:text-indigo-700"
        >
          {t('auth.reset.backToSignIn')}
        </button>
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

        <AuthSubmit
          busy={busy}
          label={t('auth.reset.submit')}
          busyLabel={t('auth.reset.submitting')}
        />
      </form>
    </AuthShell>
  );
};
