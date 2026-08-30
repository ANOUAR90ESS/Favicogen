import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloudOff, RefreshCw } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { isAuthConfigured } from '../utils/supabaseConfig';
import { syncProjects, type SyncResult } from '../utils/projectSync';
import type { Route } from '../utils/router';

/**
 * Joins names the way the current language joins a list.
 *
 * Not a hard-coded separator: Arabic and English do not punctuate a list the
 * same way, and a comma chosen in one of them reads as a mistake in the other.
 * `Intl.ListFormat` is missing on some older engines, so a plain join stands
 * in rather than the whole message failing.
 */
function listNames(names: string[], language: string): string {
  try {
    return new Intl.ListFormat(language, { style: 'long', type: 'conjunction' }).format(names);
  } catch {
    return names.join(' ');
  }
}

/**
 * Sync, and an honest account of what it did.
 *
 * The report is the point. A sync that says "done" over three projects it
 * could not upload is the same class of lie as an export that succeeds without
 * its typeface: everything looks finished, and the loss is found later on
 * another device. So `partial` is a distinct outcome with the projects named,
 * and `offline` is not dressed up as a failure — the studio works offline, and
 * only this one feature is waiting.
 *
 * Nothing is drawn at all when this build has no account service. A control
 * that can never work is not information.
 */
export const SyncButton: React.FC<{
  onSynced?: () => void;
  onNavigate?: (to: Route) => void;
}> = ({ onSynced, onNavigate }) => {
  const { t, i18n } = useTranslation();
  const { status: authStatus } = useAuth();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  if (!isAuthConfigured) return null;

  if (authStatus !== 'signed-in') {
    return (
      <button
        onClick={() => onNavigate?.('/signin')}
        disabled={!onNavigate}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 disabled:cursor-default disabled:opacity-60"
        title={t('sync.signInToSync')}
      >
        <CloudOff className="h-3.5 w-3.5" />
        <span>{t('sync.signInToSync')}</span>
      </button>
    );
  }

  const run = async () => {
    setBusy(true);
    setResult(null);
    const outcome = await syncProjects();
    setResult(outcome);
    setBusy(false);
    if (outcome.uploaded + outcome.downloaded > 0) onSynced?.();
  };

  const message = (): { text: string; tone: 'good' | 'warn' | 'bad' } | null => {
    if (!result) return null;

    switch (result.status) {
      case 'synced':
        return {
          text: t('sync.done', { up: result.uploaded, down: result.downloaded }),
          tone: 'good',
        };
      case 'nothing-to-do':
        return { text: t('sync.upToDate'), tone: 'good' };
      case 'partial':
        return {
          // Named, not counted. "2 projects were skipped" is not something
          // anyone can act on; knowing which two is.
          text: t('sync.partial', {
            up: result.uploaded,
            down: result.downloaded,
            names: listNames(result.skipped.map((s) => s.name), i18n.language),
          }),
          tone: 'warn',
        };
      case 'offline':
        return { text: t('sync.offline'), tone: 'warn' };
      case 'unavailable':
        return { text: t('sync.signInToSync'), tone: 'warn' };
      case 'failed':
      default:
        return { text: result.detail ?? t('sync.failed'), tone: 'bad' };
    }
  };

  const note = message();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        id="btn-sync-projects"
        onClick={() => void run()}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} />
        <span>{busy ? t('sync.working') : t('sync.action')}</span>
      </button>

      {note && (
        <p
          role="status"
          className={`max-w-[260px] text-end text-[11px] font-semibold ${
            note.tone === 'good'
              ? 'text-emerald-700'
              : note.tone === 'warn'
                ? 'text-amber-700'
                : 'text-rose-700'
          }`}
        >
          {note.text}
        </p>
      )}
    </div>
  );
};
