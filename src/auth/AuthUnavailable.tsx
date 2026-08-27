import React from 'react';
import { useTranslation } from 'react-i18next';
import { CloudOff } from 'lucide-react';
import { AuthShell } from './AuthShell';
import type { Route } from '../utils/router';

/**
 * What an account page shows when this deployment has no account layer.
 *
 * Most builds of this repo will not have a Supabase project behind them, and
 * the alternative to saying so is a form that accepts a password and quietly
 * does nothing with it. That is worse than useless: it is a place where people
 * type a real secret because the page told them it meant something.
 *
 * So the page says plainly that accounts are not enabled here, and points at
 * the studio, which needs none of this to work.
 */
export const AuthUnavailable: React.FC<{ onNavigate: (to: Route) => void }> = ({ onNavigate }) => {
  const { t } = useTranslation();

  return (
    <AuthShell
      title={t('auth.unavailable.title')}
      subtitle={t('auth.unavailable.subtitle')}
      onNavigate={onNavigate}
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
          <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <p className="text-sm text-slate-600">{t('auth.unavailable.body')}</p>
        </div>

        <button
          onClick={() => onNavigate('/studio')}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs transition-colors hover:bg-indigo-700"
        >
          {t('auth.unavailable.toStudio')}
        </button>
      </div>
    </AuthShell>
  );
};
