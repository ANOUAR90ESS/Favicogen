import React, { useState, useMemo } from 'react';
import {
  X,
  Eye,
  Laptop,
  Smartphone,
  Search as SearchIcon,
  Layers,
  Lock,
  Globe,
  Star,
  Share2,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { LogoConfig, SupportedLanguage } from '../types';
import { generateSvgString, generateFeatureGraphicSvg } from '../utils/canvasRenderer';

interface LiveMockupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LogoConfig;
  language: SupportedLanguage;
}

export const LiveMockupsModal: React.FC<LiveMockupsModalProps> = ({
  isOpen,
  onClose,
  config,
  language,
}) => {
  const isAr = language === 'ar';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-5xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 font-bold shadow-2xs">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isAr ? 'المعاينة الواقعية (Live Mockups)' : 'Realistic Live Mockups'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'شاهد كيف يظهر شعارك وأيقونتك في بيئات الاستخدام الحقيقية (المتصفح, الهاتف, بحث جوجل)'
                  : 'Preview your favicon and logo in real-world contexts (Browser, Smartphone, Google Search)'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mockup Tabs Selector */}
        <div className="flex items-center gap-2 p-3 border-b border-slate-200 bg-slate-50/40 overflow-x-auto">
          {[
            { id: 'browser', nameAr: 'تبويب المتصفح', nameEn: 'Browser Tab', icon: Laptop },
            { id: 'mobile', nameAr: 'شاشة الهاتف', nameEn: 'Mobile Screen', icon: Smartphone },
            { id: 'playstore', nameAr: 'متجر Google Play (الرسم المميز)', nameEn: 'Play Store (Feature Graphic)', icon: Star },
            { id: 'google', nameAr: 'نتائج بحث جوجل', nameEn: 'Google Search', icon: SearchIcon },
            { id: 'modes', nameAr: 'التباين والوضع المظلم/الفاتح', nameEn: 'Contrast & Themes', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMockup(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeMockup === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-2xs'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{isAr ? tab.nameAr : tab.nameEn}</span>
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
                  <button className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700">
                    {isAr ? 'ابدأ الآن مجاناً' : 'Get Started'}
                  </button>
                  <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50">
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

                {/* Dummy apps for realistic grid */}
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

          {/* 3. GOOGLE PLAY STORE LISTING WITH 1024x500 FEATURE GRAPHIC */}
          {activeMockup === 'playstore' && (
            <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
              {/* Play Store Top 1024x500 Feature Graphic Banner */}
              <div className="w-full aspect-[1024/500] max-h-[260px] overflow-hidden bg-slate-900 relative shadow-inner">
                <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: featureGraphicSvg }} />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20">
                  {isAr ? 'الرسم المميز (Feature Graphic 1024x500)' : 'Google Play Feature Graphic (1024x500)'}
                </div>
              </div>

              {/* App Details Header */}
              <div className="p-5 bg-white border-t border-slate-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* App Icon 512px */}
                    <div className="w-16 h-16 rounded-2xl shadow-lg border border-slate-200 overflow-hidden bg-white p-1 shrink-0 -mt-10 ring-4 ring-white">
                      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: svgString }} />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900">{brandName}</h3>
                      <p className="text-xs font-semibold text-emerald-700">{tagline}</p>
                      <p className="text-[11px] text-slate-400">In-app purchases • Contains ads</p>
                    </div>
                  </div>

                  <button className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors">
                    {isAr ? 'تثبيت (Install)' : 'Install'}
                  </button>
                </div>

                {/* Rating & Stats Strip */}
                <div className="flex items-center justify-around mt-5 pt-4 border-t border-slate-100 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-xs font-bold text-slate-900">
                      <span>4.9</span>
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </div>
                    <span className="text-[10px] text-slate-400">120K reviews</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200" />
                  <div>
                    <span className="text-xs font-bold text-slate-900">5M+</span>
                    <span className="text-[10px] text-slate-400 block">Downloads</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200" />
                  <div>
                    <span className="text-xs font-bold text-slate-900">Everyone</span>
                    <span className="text-[10px] text-slate-400 block">Rated for 3+</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. GOOGLE SEARCH RESULT MOCKUP */}
          {activeMockup === 'google' && (
            <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-6 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <SearchIcon className="h-4 w-4 text-indigo-600" />
                <span>{isAr ? 'معاينة نتيجة بحث جوجل الرسمية' : 'Google Search Snippet Preview'}</span>
              </div>

              {/* Google Result Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                {/* Site Favicon & Breadcrumb */}
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center p-0.5 overflow-hidden shadow-2xs"
                    dangerouslySetInnerHTML={{ __html: svgString }}
                  />
                  <div className="flex flex-col text-xs leading-none">
                    <span className="font-bold text-slate-800">{brandName}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      https://www.{brandName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'brand'}.com
                    </span>
                  </div>
                </div>

                {/* Title in Google Blue */}
                <h3 className="text-base sm:text-lg font-semibold text-indigo-600 hover:underline cursor-pointer">
                  {brandName} - {tagline}
                </h3>

                {/* Description snippet */}
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isAr
                    ? `الموقع الرسمي لـ ${brandName}. استكشف أحدث المنتجات والخدمات المميزة مع معايير الجودة والابتكار الرائدة عالمياً.`
                    : `Official website for ${brandName}. Discover top-rated features, modern solutions, and high-performance tools designed for excellence.`}
                </p>
              </div>
            </div>
          )}

          {/* 4. CONTRAST & THEMES */}
          {activeMockup === 'modes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl animate-in zoom-in-95 duration-150">
              {/* Light Pure White */}
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <span className="text-xs font-bold text-slate-700">{isAr ? 'الوضع الفاتح الصافي' : 'Pure White Canvas'}</span>
                <div className="w-28 h-28 drop-shadow-md" dangerouslySetInnerHTML={{ __html: svgString }} />
              </div>

              {/* Dark Slate Theme */}
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
                <span className="text-xs font-bold text-slate-300">{isAr ? 'الوضع المظلم الداكن' : 'Dark Slate Canvas'}</span>
                <div className="w-28 h-28 drop-shadow-xl" dangerouslySetInnerHTML={{ __html: svgString }} />
              </div>

              {/* Indigo Gradient */}
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-gradient-to-tr from-indigo-900 to-slate-900 border border-indigo-800 shadow-md space-y-3">
                <span className="text-xs font-bold text-indigo-200">{isAr ? 'خلفية تدرج نيلي' : 'Indigo Gradient'}</span>
                <div className="w-28 h-28 drop-shadow-xl" dangerouslySetInnerHTML={{ __html: svgString }} />
              </div>

              {/* Slate Soft */}
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-100 border border-slate-200 shadow-2xs space-y-3">
                <span className="text-xs font-bold text-slate-700">{isAr ? 'خلفية رمادية ناعمة' : 'Soft Slate'}</span>
                <div className="w-28 h-28 drop-shadow-md" dangerouslySetInnerHTML={{ __html: svgString }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
