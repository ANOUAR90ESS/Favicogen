import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Layers,
  Smartphone,
  WifiOff,
} from 'lucide-react';
import { PACKAGE_CATEGORIES, countAssets, countSelected } from '../utils/packagePlan';
import type { Route } from '../utils/router';

/**
 * The public page, for someone who has not used this yet.
 *
 * Every figure on it is read from the same tables the generators loop over, not
 * written into the copy — so the page cannot promise a number the archive does
 * not hold. That exact drift has already shipped here once, as a screen
 * offering eighty-two files above a ZIP containing eighty-one.
 *
 * What is *not* here is as deliberate: no user counts, no ratings, no logos of
 * companies that have not agreed to appear, no testimonials. There is nothing
 * to count yet, and a number invented to look established is a lie that the
 * first honest visitor can check.
 *
 * The claims that remain are the ones the code can back: the file count, that
 * the work happens in the browser, that it keeps working with the network off,
 * and that the whole interface exists in Arabic.
 */
export const MarketingLanding: React.FC<{ onNavigate: (to: Route) => void }> = ({ onNavigate }) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const total = countSelected(PACKAGE_CATEGORIES);

  const pillars = [
    { icon: Layers, key: 'assets' as const },
    { icon: WifiOff, key: 'offline' as const },
    { icon: Smartphone, key: 'platforms' as const },
    { icon: Globe, key: 'bilingual' as const },
  ];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-white">
      {/* Hero */}
      <section className="border-b border-slate-200/80 bg-slate-50/60 px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600">
            {t('marketing.eyebrow')}
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900 sm:text-5xl">
            {t('marketing.headline')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            {t('marketing.subhead', { count: total })}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              id="btn-marketing-start"
              onClick={() => onNavigate('/studio')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-indigo-700 sm:w-auto"
            >
              {t('marketing.primaryCta')}
              <Arrow className="h-4 w-4" />
            </button>
            <button
              onClick={() => onNavigate('/signup')}
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto"
            >
              {t('marketing.secondaryCta')}
            </button>
          </div>

          <p className="mt-4 text-xs text-slate-500">{t('marketing.noAccountNeeded')}</p>
        </div>
      </section>

      {/* What it is, in four claims the code can back */}
      <section className="px-4 py-12 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
          {pillars.map(({ icon: Icon, key }) => (
            <div
              key={key}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"
            >
              <Icon className="h-5 w-5 text-indigo-600" />
              <h2 className="mt-3 text-base font-bold text-slate-900">
                {t(`marketing.pillars.${key}.title`, { count: total })}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                {t(`marketing.pillars.${key}.body`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* What is in the package — straight from the tables, not from the copy */}
      <section className="border-t border-slate-200/80 bg-slate-50/60 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-xl font-bold text-slate-900 sm:text-2xl">
            {t('marketing.included.title', { count: total })}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-600">
            {t('marketing.included.subtitle')}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PACKAGE_CATEGORIES.map((category) => (
              <div
                key={category}
                className="rounded-xl border border-slate-200/80 bg-white px-4 py-3.5"
              >
                <div className="text-sm font-bold text-slate-800">
                  {t(`brandPackage.category_${category}`)}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {t('brandPackage.assetCount', { count: countAssets(category) })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="px-4 py-14 sm:py-18">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-slate-900">{t('marketing.closing.title')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {t('marketing.closing.body')}
          </p>
          <button
            onClick={() => onNavigate('/studio')}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-indigo-700"
          >
            {t('marketing.primaryCta')}
            <Arrow className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
