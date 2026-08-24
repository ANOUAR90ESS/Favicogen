import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Eye,
  Laptop,
  Smartphone,
  Search as SearchIcon,
  Layers,
  Lock,
  Star,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { LogoConfig, SupportedLanguage } from '../types';
import { generateSvgString, generateFeatureGraphicSvg } from '../utils/canvasRenderer';
import { Modal } from './Modal';

interface LiveMockupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LogoConfig;
  language?: SupportedLanguage;
}

export const LiveMockupsModal: React.FC<LiveMockupsModalProps> = ({
  isOpen,
  onClose,
  config,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [activeMockup, setActiveMockup] = useState<'browser' | 'mobile' | 'playstore' | 'google' | 'modes'>('browser');

  const svgString = useMemo(() => generateSvgString(config, 512), [config]);
  const featureGraphicSvg = useMemo(
    () =>
      generateFeatureGraphicSvg(config, {
        layout: 'center-hero',
        title: config.text || config.name || 'My App',
        subtitle: config.tagline || (isAr ? 'التطبيق الرائد للإنتاجية والتصميم' : 'Next-Gen Mobile Solutions'),
        badgeText: isAr ? '★ 4.9 • 100K+ مستخدم' : '★ 4.9 • 100K+ Downloads',
        bgTheme: 'brand',
        showPhoneMockup: true,
        showPlayBadge: true,
        showRatingStars: true,
        showGlowEffect: true,
      }),
    [config, isAr]
  );
  const brandName = config.text || config.name || 'Brand';
  const tagline = config.tagline || 'Next Generation Solutions';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      label={t('mockupsModal.title')}
      className="flex flex-col w-full max-w-5xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
      overlayClassName="z-50 p-3 sm:p-6 bg-slate-900/60"
    >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 font-bold shadow-2xs">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {t('mockupsModal.title')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('mockupsModal.subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mockup Tabs Selector */}
        <div className="flex items-center gap-2 p-3 border-b border-slate-200 bg-slate-50/40 overflow-x-auto">
          {[
            { id: 'browser', name: t('mockupsModal.items.browserTab'), icon: Laptop },
            { id: 'mobile', name: t('mockupsModal.items.mobileApp'), icon: Smartphone },
            { id: 'playstore', name: t('mockupsModal.items.appStore'), icon: Star },
            { id: 'google', name: t('mockupsModal.items.websiteHero'), icon: SearchIcon },
            { id: 'modes', name: t('mockupsModal.items.sticker'), icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMockup(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeMockup === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-2xs'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Mockup Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center custom-scrollbar bg-slate-100/70">
          {/* 1. BROWSER TAB MOCKUP */}
          {activeMockup === 'browser' && (
            <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
              {/* Chrome-like Tab Bar */}
              <div className="flex items-center gap-2 px-3 pt-3 pb-0 bg-slate-100 border-b border-slate-200">
                <div className="flex items-center gap-1.5 px-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>

                {/* Active Tab */}
                <div className="flex items-center gap-2.5 rounded-t-xl bg-white border-t border-x border-slate-200 px-4 py-2 min-w-[220px] shadow-xs">
                  {/* Real Favicon 16px */}
                  <div
                    className="w-4 h-4 rounded-xs overflow-hidden shrink-0"
                    dangerouslySetInnerHTML={{ __html: svgString }}
                  />
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[140px]">
                    {brandName} - {tagline}
                  </span>
                  <X className="h-3 w-3 text-slate-400 ml-auto hover:text-slate-600 cursor-pointer" />
                </div>

                <button className="p-1 text-slate-400 hover:text-slate-600 rounded">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* URL Address Bar */}
              <div className="flex items-center gap-3 p-3 bg-white border-b border-slate-200">
                <div className="flex items-center gap-2 text-slate-400">
                  <RefreshCw className="h-3.5 w-3.5 hover:text-slate-600 cursor-pointer" />
                </div>

                <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600">
                  <Lock className="h-3 w-3 text-emerald-600" />
                  <span className="text-emerald-600 font-mono">https://</span>
                  <span className="font-mono text-slate-800 font-semibold">
                    www.{brandName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'mybrand'}.com
                  </span>
                </div>

                <Star className="h-4 w-4 text-slate-400 hover:text-amber-500 cursor-pointer" />
              </div>

              {/* Web Page Body Mockup */}
              <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/50">
                <div
                  className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-md"
                  dangerouslySetInnerHTML={{ __html: svgString }}
                />
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{brandName}</h1>
                <p className="text-sm text-slate-500 max-w-md font-medium">{tagline}</p>
                <div className="flex items-center gap-3 pt-2">
                  <button className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 cursor-pointer">
                    {isAr ? 'ابدأ الآن مجاناً' : 'Get Started'}
                  </button>
                  <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer">
                    {isAr ? 'معرفة المزيد' : 'Learn More'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. MOBILE HOME SCREEN MOCKUP */}
          {activeMockup === 'mobile' && (
            <div className="w-[300px] sm:w-[330px] rounded-[36px] border-4 border-slate-300 bg-slate-950 p-4 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-150">
              {/* Phone Speaker & Camera Notch */}
              <div className="w-28 h-4 bg-slate-900 rounded-full mx-auto mb-6 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-800 mr-2" />
                <div className="w-10 h-1 bg-slate-800 rounded-full" />
              </div>

              {/* iOS / Android App Icons Grid */}
              <div className="grid grid-cols-4 gap-4 py-4">
                {/* Your App */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="relative group">
                    <div
                      className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border border-white/20"
                      dangerouslySetInnerHTML={{ __html: svgString }}
                    />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-slate-950">
                      1
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-white text-center truncate max-w-[60px]">
                    {brandName}
                  </span>
                </div>

                {/* Dummy apps */}
                {[
                  { name: 'Safari', color: 'from-blue-500 to-indigo-600' },
                  { name: 'Messages', color: 'from-emerald-500 to-teal-600' },
                  { name: 'Photos', color: 'from-rose-500 to-amber-500' },
                  { name: 'Camera', color: 'from-slate-600 to-slate-800' },
                  { name: 'Mail', color: 'from-sky-500 to-indigo-600' },
                  { name: 'Maps', color: 'from-emerald-400 to-teal-600' },
                  { name: 'Music', color: 'from-rose-600 to-pink-500' },
                ].map((app) => (
                  <div key={app.name} className="flex flex-col items-center gap-1.5 opacity-60">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${app.color} shadow-md`} />
                    <span className="text-[10px] text-slate-300 truncate max-w-[60px]">{app.name}</span>
                  </div>
                ))}
              </div>

              {/* Bottom Phone Dock */}
              <div className="mt-8 rounded-3xl bg-slate-900/80 backdrop-blur-md p-3 grid grid-cols-4 gap-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 mx-auto" />
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 mx-auto" />
                <div className="w-12 h-12 rounded-2xl bg-amber-500 mx-auto" />
                <div className="w-12 h-12 rounded-2xl bg-rose-500 mx-auto" />
              </div>
            </div>
          )}

          {/* 3. GOOGLE PLAY STORE LISTING */}
          {activeMockup === 'playstore' && (
            <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="w-full aspect-[1024/500] max-h-[260px] overflow-hidden bg-slate-900 relative shadow-inner">
                <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: featureGraphicSvg }} />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20">
                  Google Play Feature Graphic (1024x500)
                </div>
              </div>

              <div className="p-5 bg-white border-t border-slate-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl shadow-lg border border-slate-200 overflow-hidden bg-white p-1 shrink-0 -mt-10 ring-4 ring-white">
                      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: svgString }} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{brandName}</h3>
                      <p className="text-xs text-emerald-600 font-semibold">{brandName} Inc. • Productivity</p>
                      <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500 font-medium">
                        <span>4.9 ★ (12K reviews)</span>
                        <span>•</span>
                        <span>100K+ Downloads</span>
                      </div>
                    </div>
                  </div>
                  <button className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer">
                    Install
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. GOOGLE SEARCH RESULTS */}
          {activeMockup === 'google' && (
            <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 border border-slate-200 overflow-hidden p-0.5">
                  <div className="w-4 h-4" dangerouslySetInnerHTML={{ __html: svgString }} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-900">{brandName}</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    https://www.{brandName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'brand'}.com
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-indigo-700 hover:underline cursor-pointer">
                  {brandName}: {tagline} - Official Website
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Discover the next-generation visual design suite for {brandName}. High-resolution logos, favicons, vector assets, and seamless cloud syncing.
                </p>
              </div>
            </div>
          )}

          {/* 5. CONTRAST & THEMES */}
          {activeMockup === 'modes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl animate-in zoom-in-95 duration-150">
              {/* Light Background Preview */}
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-slate-200 bg-white shadow-md space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Light Canvas</span>
                <div className="w-24 h-24" dangerouslySetInnerHTML={{ __html: svgString }} />
                <span className="text-sm font-bold text-slate-900">{brandName}</span>
              </div>

              {/* Dark Background Preview */}
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-slate-800 bg-slate-950 shadow-md space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Dark Canvas</span>
                <div className="w-24 h-24" dangerouslySetInnerHTML={{ __html: svgString }} />
                <span className="text-sm font-bold text-white">{brandName}</span>
              </div>
            </div>
          )}
        </div>
      </Modal>
  );
};
