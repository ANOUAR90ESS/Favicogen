import { useTranslation } from 'react-i18next';
import React, { useMemo, useState } from 'react';
import {
  Check,
  Download,
  Globe,
  Loader2,
  Package,
  Palette,
  Play,
  Share2,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { LogoConfig } from '../types';
import {
  PACKAGE_CATEGORIES,
  PACKAGE_PRESETS,
  PackageCategory,
  PackageStep,
  StepState,
  countAssets,
  countSelected,
  matchPreset,
  stepsFor,
  toggleCategory,
} from '../utils/packagePlan';
import { generateBrandPackageZip } from '../utils/canvasRenderer';
import { downloadBlob } from '../utils/download';
import { Modal } from './Modal';

interface BrandPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LogoConfig;
}

const CATEGORY_ICON: Record<PackageCategory, React.ComponentType<{ className?: string }>> = {
  website: Globe,
  android: Smartphone,
  ios: Smartphone,
  'google-play': Play,
  social: Share2,
  brand: Palette,
};

type Phase = 'choose' | 'generating' | 'done';

/**
 * Upload once, choose what you need, get it.
 *
 * The studio is where a logo is designed; this is where it is turned into
 * files. Keeping them apart matters — someone who arrives with a finished
 * logo should not have to understand tabs, shape masks and watermark settings
 * to get a favicon out.
 */
export const BrandPackageModal: React.FC<BrandPackageModalProps> = ({
  isOpen,
  onClose,
  config,
}) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<PackageCategory[]>([...PACKAGE_CATEGORIES]);
  const [phase, setPhase] = useState<Phase>('choose');
  const [steps, setSteps] = useState<Record<string, StepState>>({});
  const [error, setError] = useState<string | null>(null);
  const [fileCount, setFileCount] = useState(0);

  const activePreset = useMemo(() => matchPreset(selected), [selected]);
  const total = useMemo(() => countSelected(selected), [selected]);
  const plan = useMemo(() => stepsFor(selected), [selected]);

  const brandName = config.text || config.name || 'my-brand';

  const handleGenerate = async () => {
    setPhase('generating');
    setError(null);
    setSteps(Object.fromEntries(plan.map((step) => [step, 'pending' as StepState])));

    try {
      const blob = await generateBrandPackageZip(config, {
        categories: selected,
        onStep: (step: PackageStep, state) =>
          setSteps((prev) => ({ ...prev, [step]: state === 'running' ? 'running' : 'done' })),
      });
      setFileCount(total);
      downloadBlob(blob, `${brandName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'my-brand'}-brand-assets.zip`);
      setPhase('done');
    } catch (err) {
      console.error('Package generation failed:', err);
      setError(t('brandPackage.generationFailed'));
      setPhase('choose');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      label={t('brandPackage.title')}
      className="relative flex w-full max-w-3xl max-h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      overlayClassName="z-50"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 sm:h-10 sm:w-10">
            <Package className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-xl">
              {t('brandPackage.title')}
            </h2>
            <p className="hidden text-xs text-slate-500 sm:block">{t('brandPackage.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
        {phase === 'choose' && (
          <>
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('brandPackage.startFrom')}
              </span>
              <div className="flex flex-wrap gap-2">
                {PACKAGE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelected([...preset.categories])}
                    className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                      activePreset === preset.id
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {t(`brandPackage.preset_${preset.id}`)}
                  </button>
                ))}
                {activePreset === null && (
                  <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500">
                    {t('brandPackage.preset_custom')}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('brandPackage.whatDoYouNeed')}
              </span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {PACKAGE_CATEGORIES.map((category) => {
                  const Icon = CATEGORY_ICON[category];
                  const on = selected.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setSelected((prev) => toggleCategory(prev, category))}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-start transition-colors ${
                        on
                          ? 'border-indigo-300 bg-indigo-50/60'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {on && <Check className="h-3.5 w-3.5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5 text-slate-500" />
                          <span className="text-sm font-bold text-slate-900">
                            {t(`brandPackage.category_${category}`)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                          {t(`brandPackage.categoryHint_${category}`)}
                        </p>
                        <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                          {t('brandPackage.assetCount', { count: countAssets(category) })}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">
                {error}
              </p>
            )}
          </>
        )}

        {phase !== 'choose' && (
          <ol className="space-y-2">
            {plan.map((step) => {
              const state = steps[step] ?? 'pending';
              return (
                <li
                  key={step}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                    state === 'done'
                      ? 'border-emerald-200 bg-emerald-50/60'
                      : state === 'running'
                      ? 'border-indigo-200 bg-indigo-50/60'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                    {state === 'done' ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : state === 'running' ? (
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                    )}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      state === 'pending' ? 'text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {step === 'zip'
                      ? t('brandPackage.step_zip')
                      : t(`brandPackage.category_${step}`)}
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        {phase === 'done' && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-sm font-bold text-emerald-900">
              {t('brandPackage.doneTitle', { count: fileCount })}
            </p>
            <p className="mt-1 text-xs text-emerald-800">{t('brandPackage.doneHint')}</p>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-6">
        <span className="min-w-0 text-xs text-slate-600">
          {phase === 'choose' && t('brandPackage.totalSummary', { count: total })}
          {phase === 'generating' && t('brandPackage.working')}
          {phase === 'done' && t('brandPackage.savedTo')}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            {t('common.close')}
          </button>
          {phase !== 'generating' && (
            <button
              id="btn-generate-brand-package"
              type="button"
              onClick={handleGenerate}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-indigo-700"
            >
              {phase === 'done' ? (
                <Download className="h-3.5 w-3.5" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {phase === 'done' ? t('brandPackage.again') : t('brandPackage.generate')}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
