import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layers } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { isAuthConfigured } from '../utils/supabaseConfig';
import type { Route } from '../utils/router';

/**
 * The bar above the marketing and account pages.
 *
 * Not the studio's Navbar: that one exists to drive a project — undo, exports,
 * the package — and none of it means anything on a page with no project open.
 * Reusing it would mean handing it a name it does not have and callbacks that
 * do nothing, which is how a component ends up with a mode for every caller.
 *
 * When this build has no account service the sign-in link is absent rather
 * than disabled. A control that cannot ever work is not information, it is a
 * dead end with a tooltip.
 */
export const PublicHeader: React.FC<{ onNavigate: (to: Route) => void }> = ({ onNavigate }) => {
  const { t, i18n } = useTranslation();
  const { status, user, signOut } = useAuth();
  const isAr = i18n.language === 'ar';

  const setLanguage = (lang: 'en' | 'ar') => {
    void i18n.changeLanguage(lang);
    localStorage.setItem('logo_studio_lang', lang);
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 sm:px-6">
      <button
        onClick={() => onNavigate('/')}
        className="flex items-center gap-2 text-sm font-bold text-slate-900"
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-600">
          <Layers className="h-4 w-4 text-white" />
        </span>
        <span className="hidden sm:inline">{t('nav.appTitle')}</span>
      </button>

      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg bg-slate-100 p-0.5">
          <button
            id="btn-lang-en"
            type="button"
            onClick={() => setLanguage('en')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition-all ${
              isAr ? 'text-slate-500 hover:text-slate-900' : 'bg-white text-indigo-700 shadow-2xs'
            }`}
          >
            EN
          </button>
          <button
            id="btn-lang-ar"
            type="button"
            onClick={() => setLanguage('ar')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition-all ${
              isAr ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {
              // A language's own name stays in that language.
              // eslint-disable-next-line no-restricted-syntax
              'العربية'
            }
          </button>
        </div>

        {isAuthConfigured && status === 'signed-in' && (
          <>
            <span
              className="hidden max-w-[160px] truncate text-xs font-semibold text-slate-600 sm:inline"
              dir="ltr"
              title={user?.email ?? ''}
            >
              {user?.email}
            </span>
            <button
              onClick={() => void signOut()}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              {t('auth.nav.signOut')}
            </button>
          </>
        )}

        {isAuthConfigured && status === 'signed-out' && (
          <button
            id="btn-header-signin"
            onClick={() => onNavigate('/signin')}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            {t('auth.nav.signIn')}
          </button>
        )}

        <button
          onClick={() => onNavigate('/studio')}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
        >
          {t('marketing.primaryCta')}
        </button>
      </div>
    </header>
  );
};
