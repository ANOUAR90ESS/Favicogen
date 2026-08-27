import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Route } from '../utils/router';

/**
 * The frame every account page sits in.
 *
 * One shell rather than four near-identical layouts, so the heading order, the
 * error placement and the way back are the same on each — the pages differ only
 * in the fields they ask for.
 *
 * The back arrow flips with the writing direction. An arrow pointing left in a
 * right-to-left layout points *forward*, which is the kind of small wrongness
 * that makes an interface feel translated rather than built.
 */
export const AuthShell: React.FC<{
  title: string;
  subtitle: string;
  onNavigate: (to: Route) => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ title, subtitle, onNavigate, children, footer }) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-slate-100/70 px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <button
          onClick={() => onNavigate('/')}
          className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <BackIcon className="h-3.5 w-3.5" />
          {t('auth.backHome')}
        </button>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>

          <div className="mt-6">{children}</div>
        </div>

        {footer && <div className="mt-5 text-center text-sm text-slate-600">{footer}</div>}
      </div>
    </div>
  );
};

/** A labelled input. Every field on these pages is one, so it is one component. */
export const AuthField: React.FC<{
  id: string;
  label: string;
  type: 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  hint?: string;
  required?: boolean;
}> = ({ id, label, type, value, onChange, autoComplete, hint, required = true }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      required={required}
      autoComplete={autoComplete}
      onChange={(e) => onChange(e.target.value)}
      // Latin either way: an email address and a password are not translated,
      // and rendering them right-to-left makes them unreadable as typed.
      dir="ltr"
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-2xs outline-none focus:ring-2 focus:ring-indigo-500"
    />
    {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
  </div>
);

/**
 * What went wrong, or what just worked.
 *
 * `role="alert"` so a screen reader announces it: someone who cannot see the
 * form turn red otherwise gets no signal that their sign-in failed at all.
 */
export const AuthMessage: React.FC<{ tone: 'error' | 'success'; children: React.ReactNode }> = ({
  tone,
  children,
}) => (
  <div
    role="alert"
    className={`rounded-lg border px-3 py-2.5 text-sm ${
      tone === 'error'
        ? 'border-rose-200 bg-rose-50 text-rose-800'
        : 'border-emerald-200 bg-emerald-50 text-emerald-800'
    }`}
  >
    {children}
  </div>
);

/** The one primary action on each page, with its own busy state. */
export const AuthSubmit: React.FC<{ busy: boolean; label: string; busyLabel: string }> = ({
  busy,
  label,
  busyLabel,
}) => (
  <button
    type="submit"
    disabled={busy}
    className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
  >
    {busy ? busyLabel : label}
  </button>
);
