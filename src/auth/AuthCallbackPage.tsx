import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthShell } from './AuthShell';
import { authErrorText, type AuthErrorText } from './authErrors';
import { getSupabase } from '../utils/supabaseClient';
import { isAuthConfigured } from '../utils/supabaseConfig';
import type { Route } from '../utils/router';

/**
 * Where an emailed confirmation link lands.
 *
 * A pass-through, not a destination: the client reads the token out of the URL,
 * turns it into a session, and this sends them on to the studio. It exists as a
 * route because the provider needs one address to return to, and because that
 * address arrives carrying single-use tokens — which is why the move onward
 * *replaces* the history entry rather than pushing one. Pushing would leave a
 * back button that returns to a spent link and an error nobody caused.
 *
 * A link that has expired or been used already says so, rather than dropping
 * someone into the app with no idea whether their address was confirmed.
 */
export const AuthCallbackPage: React.FC<{ onNavigate: (to: Route, options?: { replace?: boolean }) => void }> = ({
  onNavigate,
}) => {
  const { t } = useTranslation();

  /*
   * Supabase reports a rejected link in the URL rather than by throwing, and
   * the URL is the only place that reason exists. It is there at first render,
   * so it is read once here rather than in an effect — and kept raw, with the
   * wording derived below, so switching language re-translates the message
   * instead of leaving the sentence someone first landed on.
   */
  const [rejection] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    return params.get('error_description') ?? params.get('error');
  });

  const error: AuthErrorText | null = rejection ? authErrorText(rejection, t) : null;

  useEffect(() => {
    if (!isAuthConfigured) {
      onNavigate('/studio', { replace: true });
      return;
    }
    // A rejected link has nothing to wait for; the page below says so.
    if (rejection) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const go = () => {
      if (!cancelled) onNavigate('/studio', { replace: true });
    };

    void getSupabase().then((supabase) => {
      if (cancelled || !supabase) return;

      const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) go();
      });
      unsubscribe = () => subscription.subscription.unsubscribe();

      void supabase.auth.getSession().then(({ data }) => {
        if (data.session) go();
      });
    });

    // Confirmed but not signed in is still a success worth moving on from: the
    // studio is where they were going, and it needs no session to work.
    const moveOn = setTimeout(go, 6000);

    return () => {
      cancelled = true;
      clearTimeout(moveOn);
      unsubscribe?.();
    };
  }, [onNavigate, rejection]);

  if (error) {
    return (
      <AuthShell
        title={t('auth.callback.failedTitle')}
        subtitle={error.message}
        onNavigate={onNavigate}
      >
        <div className="space-y-3">
          <button
            onClick={() => onNavigate('/signin')}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-indigo-700"
          >
            {t('auth.callback.toSignIn')}
          </button>
          <button
            onClick={() => onNavigate('/studio')}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            {t('auth.callback.toStudio')}
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t('auth.callback.title')}
      subtitle={t('auth.callback.subtitle')}
      onNavigate={onNavigate}
    >
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-indigo-500" />
      </div>
    </AuthShell>
  );
};
