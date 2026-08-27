import { useTranslation } from 'react-i18next';
import React, { useRef, useState } from 'react';
import { ArrowRight, Check, Loader2, Upload } from 'lucide-react';
import { LogoConfig } from '../types';
import { ACCEPT_ATTRIBUTE, intakeImageFile, isIntakeFailure } from '../utils/imageIntake';
import { smartImportImage } from '../utils/smartImport';
import { PACKAGE_CATEGORIES, countAssets, countSelected } from '../utils/packagePlan';

interface LandingScreenProps {
  /**
   * Applies the imported logo and hands over to the studio. The file name
   * comes with it: it is the only thing the visitor has told us to call this,
   * and the exported files are named after it.
   */
  onLogoReady: (patch: Partial<LogoConfig>, filename: string) => void;
  /** Continue to the studio without uploading — design from scratch. */
  onSkip: () => void;
}

/**
 * The first thing a new visitor sees.
 *
 * The app opened straight into the studio: five tabs, a shape mask, watermark
 * settings. That is the right home for someone designing a logo and the wrong
 * one for the larger group who arrive with a finished logo and want files.
 * This screen leads with the upload and gets out of the way.
 *
 * Every number on it is computed from the same tables the generators read.
 * A landing page is exactly where a rounded-up "100+ assets!" would be
 * tempting, and exactly where being caught out costs the most trust.
 */
export const LandingScreen: React.FC<LandingScreenProps> = ({ onLogoReady, onSkip }) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showIncluded, setShowIncluded] = useState(false);

  const total = countSelected(PACKAGE_CATEGORIES);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const intake = await intakeImageFile(file);
      if (isIntakeFailure(intake)) {
        setError(
          intake.reason === 'too-large'
            ? t('landing.tooLarge')
            : intake.reason === 'wrong-type'
            ? t('landing.wrongType')
            : t('landing.unreadable')
        );
        return;
      }
      const result = await smartImportImage(intake.dataUrl);
      onLogoReady(result.patch, file.name.replace(/\.[^.]+$/, ''));
    } catch (err) {
      console.error('Import from the landing screen failed:', err);
      setError(t('landing.unreadable'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center overflow-y-auto bg-slate-50 p-4 sm:p-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
            {t('landing.headline')}
          </h1>
          <p className="mx-auto max-w-lg text-sm text-slate-600 sm:text-base">
            {t('landing.subhead')}
          </p>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => !busy && inputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors sm:p-12 ${
            dragging
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/40'
          }`}
        >
          <input
            ref={inputRef}
            id="landing-logo-input"
            type="file"
            accept={ACCEPT_ATTRIBUTE}
            className="hidden"
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
            {busy ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Upload className="h-6 w-6" />
            )}
          </div>
          <p className="mt-3 text-sm font-bold text-slate-900">
            {busy ? t('landing.working') : t('landing.dropHere')}
          </p>
          <p className="mt-1 text-xs text-slate-500">{t('landing.accepts')}</p>
        </div>

        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-center text-xs font-medium text-rose-800">
            {error}
          </p>
        )}

        <div className="flex flex-col items-center gap-3">
          <button
            id="btn-see-whats-included"
            type="button"
            onClick={() => setShowIncluded((v) => !v)}
            className="cursor-pointer text-xs font-bold text-indigo-700 underline-offset-2 hover:underline"
          >
            {t('landing.seeIncluded', { count: total })}
          </button>

          {showIncluded && (
            <ul className="grid w-full grid-cols-1 gap-1.5 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2">
              {PACKAGE_CATEGORIES.map((category) => (
                <li key={category} className="flex items-center gap-2 text-xs text-slate-700">
                  <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span className="font-semibold">{t(`brandPackage.category_${category}`)}</span>
                  <span className="text-slate-400">
                    {t('brandPackage.assetCount', { count: countAssets(category) })}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <button
            id="btn-skip-to-studio"
            type="button"
            onClick={onSkip}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            {t('landing.skip')}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-400">{t('landing.privacy')}</p>
      </div>
    </div>
  );
};
