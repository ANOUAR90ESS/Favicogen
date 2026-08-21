import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  Image as ImageIcon,
  Sparkles,
  Smartphone,
  Layers,
  Star,
  Check,
  Eye,
  Info,
  ShieldCheck,
  Palette,
  Sliders,
  Maximize2,
  Copy,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LogoConfig, FeatureGraphicOptions, SupportedLanguage } from '../types';
import {
  generateFeatureGraphicSvg,
  rasterizeSvg,
  downloadBlob,
} from '../utils/canvasRenderer';

interface FeatureGraphicModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LogoConfig;
  language: SupportedLanguage;
}

export const FeatureGraphicModal: React.FC<FeatureGraphicModalProps> = ({
  isOpen,
  onClose,
  config,
  language,
}) => {
  const isAr = language === 'ar';

  // Feature Graphic Customizer Options State
  const [options, setOptions] = useState<FeatureGraphicOptions>({
    layout: 'center-hero',
    title: config.text || config.name || 'My App',
    subtitle: config.tagline || (isAr ? 'التطبيق الرائد للإنتاجية والتصميم' : 'Next-Generation Mobile Experience'),
    badgeText: isAr ? '★ 4.9 • أكثر من 100K مستخدم' : '★ 4.9 • 100K+ Downloads',
    bgTheme: 'brand',
    showPhoneMockup: true,
    showPlayBadge: true,
    showRatingStars: true,
    showGlowEffect: true,
  });

  const [showSafeZones, setShowSafeZones] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<'png' | 'jpeg' | null>(null);
  const [copiedSvg, setCopiedSvg] = useState<boolean>(false);

  // Synchronize initial title if config changes
  React.useEffect(() => {
    if (config.text || config.name) {
      setOptions((prev) => ({
        ...prev,
        title: config.text || config.name || prev.title,
        subtitle: config.tagline || prev.subtitle,
      }));
    }
  }, [config.text, config.name, config.tagline]);

  // Generate 1024x500 SVG vector string
  const svgCode = useMemo(() => {
    return generateFeatureGraphicSvg(config, options);
  }, [config, options]);

  if (!isOpen) return null;

  // Direct Download Handler (PNG or JPEG)
  const handleDownload = async (format: 'png' | 'jpeg') => {
    try {
      setIsDownloading(format);
      const cleanTitle = (options.title || 'feature-graphic').replace(/\s+/g, '_');
      const fileName = `google_play_feature_graphic_${cleanTitle}_1024x500.${format === 'jpeg' ? 'jpg' : 'png'}`;

      const blob = await rasterizeSvg(svgCode, 1024, 500, format, 0.96);
      downloadBlob(blob, fileName);
      // Trigger celebration confetti
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (err) {
      console.error('Failed to export feature graphic:', err);
    } finally {
      setIsDownloading(null);
    }
  };

  const handleCopySvg = async () => {
    try {
      await navigator.clipboard.writeText(svgCode);
      setCopiedSvg(true);
      setTimeout(() => setCopiedSvg(null as any), 2000);
    } catch (err) {
      console.error('Copy SVG failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-6xl max-h-[94vh] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-2xs">
              <ImageIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  {isAr ? 'الرسم المميز لمتجر Google Play (1024 × 500)' : 'Google Play Feature Graphic (1024 × 500)'}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="h-3 w-3" />
                  1,024 × 500 px • &lt;15 MB
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">
                {isAr
                  ? 'يجب أن يكون الرسم المميز بتنسيق PNG أو JPEG وبحجم لا يزيد عن 15MB وبدقة 1024 × 500 بكسل لإبراز تطبيقك على المتجر.'
                  : 'Must be PNG or JPEG, under 15 MB, and 1,024 x 500 px. Used by Google Play when featuring your app.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Content Area: Preview on Top/Left, Customizer on Bottom/Right */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* LEFT / TOP: Live 1024x500 Canvas Preview */}
          <div className="flex-1 flex flex-col bg-slate-900/95 p-4 sm:p-6 items-center justify-center relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200">
            {/* Safe Zone Banner Info */}
            <div className="w-full max-w-2xl flex items-center justify-between gap-2 mb-3 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400 font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                1024 × 500 px (2.048 : 1)
              </div>
              <button
                onClick={() => setShowSafeZones((p) => !p)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  showSafeZones
                    ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title={isAr ? 'إظهار المنطقة الآمنة لمتجر جوجل بلاي' : 'Toggle Google Play Mobile Safe Zones'}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>{isAr ? 'المنطقة الآمنة للمتجر' : 'Safe Zones'}</span>
              </button>
            </div>

            {/* 1024x500 Aspect Ratio Stage Container */}
            <div className="w-full max-w-2xl aspect-[1024/500] rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 relative bg-slate-950 flex items-center justify-center">
              <div
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: svgCode }}
              />

              {/* Safe Zones Overlay Guidelines (Google Play App Store Overlay Simulator) */}
              {showSafeZones && (
                <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-amber-400/60 flex flex-col justify-between p-4 bg-amber-500/5 animate-in fade-in duration-150">
                  <div className="flex justify-between items-start">
                    <span className="bg-amber-500/90 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded shadow">
                      {isAr ? 'أعلى الشاشة (منطقة الرؤية الكاملة)' : 'Top Safe Area'}
                    </span>
                    <span className="bg-amber-500/90 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded shadow">
                      {isAr ? 'منطقة الشعار والعنوان' : 'Title & Logo Safe Area'}
                    </span>
                  </div>

                  <div className="flex items-end justify-between">
                    {/* Simulated Icon & Install Button Overlay Area */}
                    <div className="p-2.5 rounded-lg bg-black/75 backdrop-blur-xs border border-white/20 text-left max-w-[200px]">
                      <div className="w-8 h-8 rounded-lg bg-slate-700/80 mb-1 border border-white/20" />
                      <div className="h-2 w-16 bg-slate-400 rounded mb-1" />
                      <div className="h-1.5 w-12 bg-slate-500 rounded" />
                      <span className="text-[8px] text-amber-300 font-bold block mt-1">
                        {isAr ? 'منطقة غطاء الأيقونة في المتجر' : 'Store Icon & Title Overlay'}
                      </span>
                    </div>

                    <span className="bg-amber-500/90 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded shadow">
                      {isAr ? 'أسفل الشاشة (المنطقة الآمنة)' : 'Bottom Safe Zone'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Download Buttons underneath stage */}
            <div className="w-full max-w-2xl flex flex-wrap items-center justify-between gap-2 mt-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySvg}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors"
                >
                  {copiedSvg ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">{isAr ? 'تم النسخ' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-slate-400" />
                      <span>{isAr ? 'نسخ SVG' : 'Copy SVG'}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* PNG 1024x500 Download Button */}
                <button
                  id="btn-download-fg-png"
                  onClick={() => handleDownload('png')}
                  disabled={isDownloading !== null}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  <span>
                    {isDownloading === 'png'
                      ? isAr ? 'جارِ التحميل...' : 'Downloading...'
                      : isAr ? 'تحميل PNG (1024×500)' : 'Download PNG (1024×500)'}
                  </span>
                </button>

                {/* JPEG 1024x500 Download Button */}
                <button
                  id="btn-download-fg-jpg"
                  onClick={() => handleDownload('jpeg')}
                  disabled={isDownloading !== null}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-indigo-950/40 transition-all disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  <span>
                    {isDownloading === 'jpeg'
                      ? isAr ? 'جارِ التحميل...' : 'Downloading...'
                      : isAr ? 'تحميل JPEG (1024×500)' : 'Download JPEG (1024×500)'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT / BOTTOM: Interactive Customizer Controls */}
          <div className="w-full lg:w-[420px] bg-slate-50/70 p-4 sm:p-6 overflow-y-auto custom-scrollbar flex flex-col gap-5 shrink-0">
            {/* 1. Layout Style Preset */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2.5">
                <Layers className="h-4 w-4 text-indigo-600" />
                {isAr ? 'نمط وتخطيط الرسم المميز' : 'Feature Graphic Layout'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'center-hero', nameAr: 'البطولة في المنتصف', nameEn: 'Center Hero' },
                  { id: 'split-phone', nameAr: 'عرض الهاتف الذكي', nameEn: 'Split Phone 3D' },
                  { id: 'arabesque', nameAr: 'الزخرفة الهندسية', nameEn: 'Arabesque Pattern' },
                  { id: 'mesh-gradient', nameAr: 'البطاقة الزجاجية', nameEn: 'Glass Showcase' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setOptions((p) => ({ ...p, layout: item.id as any }))}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                      options.layout === item.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100 shadow-2xs'
                    }`}
                  >
                    {isAr ? item.nameAr : item.nameEn}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Color Theme */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2.5">
                <Palette className="h-4 w-4 text-indigo-600" />
                {isAr ? 'تدرج الخلفية والألوان' : 'Background Theme'}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'brand', nameAr: 'الشعار', nameEn: 'Brand', color: 'from-indigo-600 to-cyan-500' },
                  { id: 'sunset', nameAr: 'غروب', nameEn: 'Sunset', color: 'from-rose-500 to-amber-500' },
                  { id: 'cyber', nameAr: 'سايبر', nameEn: 'Cyber', color: 'from-slate-900 to-indigo-950' },
                  { id: 'emerald', nameAr: 'زمردي', nameEn: 'Emerald', color: 'from-emerald-900 to-teal-600' },
                  { id: 'gold', nameAr: 'ملكي', nameEn: 'Gold', color: 'from-amber-950 to-amber-600' },
                  { id: 'dark', nameAr: 'داكن', nameEn: 'Dark', color: 'from-slate-950 to-slate-800' },
                  { id: 'light', nameAr: 'فاتح', nameEn: 'Light', color: 'from-slate-100 to-slate-200' },
                ].map((th) => (
                  <button
                    key={th.id}
                    onClick={() => setOptions((p) => ({ ...p, bgTheme: th.id as any }))}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[11px] font-bold transition-all ${
                      options.bgTheme === th.id
                        ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-full h-4 rounded-md bg-gradient-to-r ${th.color}`} />
                    <span className="text-slate-700">{isAr ? th.nameAr : th.nameEn}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Text & Slogan Settings */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-indigo-600" />
                {isAr ? 'النصوص والعناوين' : 'Titles & Copy'}
              </label>

              {/* Title Input */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                  {isAr ? 'اسم التطبيق / العنوان الرئيسي' : 'App Title'}
                </span>
                <input
                  type="text"
                  value={options.title}
                  onChange={(e) => setOptions((p) => ({ ...p, title: e.target.value }))}
                  placeholder="App Title..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs"
                />
              </div>

              {/* Subtitle Input */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                  {isAr ? 'الوصف الفرعي / الشعار الترويجي' : 'Subtitle / Tagline'}
                </span>
                <input
                  type="text"
                  value={options.subtitle}
                  onChange={(e) => setOptions((p) => ({ ...p, subtitle: e.target.value }))}
                  placeholder="App Tagline / Description..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs"
                />
              </div>

              {/* Badge Text */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                  {isAr ? 'شارة التميز أو التقييم' : 'Badge / Award Text'}
                </span>
                <input
                  type="text"
                  value={options.badgeText}
                  onChange={(e) => setOptions((p) => ({ ...p, badgeText: e.target.value }))}
                  placeholder="★ 4.9 • 100K+ Downloads"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs"
                />
              </div>
            </div>

            {/* 4. Overlay & Toggle Elements */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                {isAr ? 'العناصر الإضافية' : 'Graphic Elements'}
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOptions((p) => ({ ...p, showPlayBadge: !p.showPlayBadge }))}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs font-semibold transition-all ${
                    options.showPlayBadge
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                      : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  <span>Google Play</span>
                  <div className={`w-2 h-2 rounded-full ${options.showPlayBadge ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setOptions((p) => ({ ...p, showRatingStars: !p.showRatingStars }))}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs font-semibold transition-all ${
                    options.showRatingStars
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                      : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  <span>{isAr ? 'نجوم التقييم' : 'Rating Stars'}</span>
                  <div className={`w-2 h-2 rounded-full ${options.showRatingStars ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setOptions((p) => ({ ...p, showGlowEffect: !p.showGlowEffect }))}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs font-semibold transition-all ${
                    options.showGlowEffect
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                      : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  <span>{isAr ? 'الهالة الضوئية' : 'Glow Effect'}</span>
                  <div className={`w-2 h-2 rounded-full ${options.showGlowEffect ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowSafeZones((p) => !p)}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs font-semibold transition-all ${
                    showSafeZones
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  <span>{isAr ? 'إرشادات المتجر' : 'Safe Guides'}</span>
                  <div className={`w-2 h-2 rounded-full ${showSafeZones ? 'bg-amber-500' : 'bg-slate-300'}`} />
                </button>
              </div>
            </div>

            {/* Official Requirements Card */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs text-emerald-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Info className="h-4 w-4 text-emerald-600" />
                <span>{isAr ? 'شروط Google Play الرسمية للرسم المميز:' : 'Official Google Play Requirements:'}</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-emerald-800/90 space-y-0.5">
                <li>{isAr ? 'الدقة: 1024 بكسل عرض × 500 بكسل ارتفاع بالضبط.' : 'Resolution: 1,024 px by 500 px exactly.'}</li>
                <li>{isAr ? 'الصيغة: PNG أو JPEG بجودة فائقة.' : 'Format: PNG or JPEG high quality.'}</li>
                <li>{isAr ? 'الحجم الأقصى: أقل من 15 ميجابايت (الملف الناتج ~150KB).' : 'Max File Size: Under 15 MB (Result is ~150 KB).'}</li>
                <li>{isAr ? 'الاستخدام: يظهر في أعلى صفحة التطبيق والمجموعات المختارة.' : 'Usage: Featured promo graphic on Google Play Store.'}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
