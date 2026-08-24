import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Wand2,
  RefreshCw,
  Download,
  Check,
  ArrowRight,
  Layers,
  Youtube,
  Trash2,
  Sliders,
  AlertCircle,
  Copy,
  CheckCircle2,
  Palette,
  ExternalLink,
  ChevronRight,
  X,
  PackageCheck,
  Smartphone,
  Eye,
  SlidersHorizontal,
  Zap,
} from 'lucide-react';
import { LogoConfig, SupportedLanguage } from '../types';
import { Modal } from './Modal';

interface AILogoGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LogoConfig;
  language?: SupportedLanguage;
  onApplyLogo: (newConfig: Partial<LogoConfig>, imageDataUrl?: string) => void;
  onOpenYouTubeKit?: () => void;
  onOpenFaviconExport?: () => void;
  onOpenFeatureGraphic?: () => void;
  onOpenUniversalResizer?: () => void;
  onOpenMockups?: () => void;
}

const AI_STYLE_PRESETS = [
  {
    id: 'minimal',
    nameAr: 'شعار مينيمالي أنيق',
    nameEn: 'Minimalist Vector',
    desc: 'خطوط واضحة وأشكال هندسية راقية',
    icon: '✨',
    badge: 'الأكثر شعبية',
  },
  {
    id: 'modern-3d',
    nameAr: 'ثلاثي الأبعاد حديث 3D',
    nameEn: 'Modern 3D Glossy',
    desc: 'إضاءة سينمائية وتدرجات لونية غنية',
    icon: '🔮',
    badge: 'تطبيقات وأيقونات',
  },
  {
    id: 'luxury-gold',
    nameAr: 'فخامة ملكية & ذهبي',
    nameEn: 'Luxury Gold Emblem',
    desc: 'تطريز ذهبي وزخارف فاخرة على خلفية داكنة',
    icon: '👑',
    badge: 'براندات فاخرة',
  },
  {
    id: 'cyberpunk',
    nameAr: 'سايبر بانك & نيون',
    nameEn: 'Cyberpunk Neon',
    desc: 'ألوان نيون مشعة وطابع مستقبلي للألعاب',
    icon: '⚡',
    badge: 'ستريمرز ويوتيوب',
  },
  {
    id: 'arabesque',
    nameAr: 'زخرفة عربية وإسلامية',
    nameEn: 'Arabesque Modern',
    desc: 'خط عربي حديث وزخارف أندلسية راقية',
    icon: '🌙',
    badge: 'هوية عربية',
  },
  {
    id: 'flat-vector',
    nameAr: 'فيكتور مسطح Flat Design',
    nameEn: 'Flat Clean Vector',
    desc: 'ألوان مشرقة وهوية بصرية سويسرية نقية',
    icon: '🎯',
    badge: 'شركات وتقنية',
  },
  {
    id: 'mascot',
    nameAr: 'ماسكوت وشخصيات ألعاب',
    nameEn: 'Gaming Mascot',
    desc: 'شخصيات كرتونية ديناميكية لقنوات الألعاب',
    icon: '🎮',
    badge: 'قنوات جيمنج',
  },
  {
    id: 'youtube-banner',
    nameAr: 'خلفية قناة يوتيوب بانورامية',
    nameEn: 'YouTube Channel Header',
    desc: 'تصميم عريض 16:9 مخصص كخلفية لغلاف القناة',
    icon: '📺',
    badge: 'بانر 16:9',
  },
];

const PROMPT_SUGGESTIONS = [
  'شعار صقر ذهبي متناسق هندسياً لقناة ألعاب ويوتيوب فاخرة',
  'أيقونة قطرة قهوة مع ورقة شجر بأسلوب فيكتور مينيمالي أنيق',
  'رمز ذكاء اصطناعي عصري برأس إلكتروني ودوائر نيون زرقاء',
  'شعار حرف عربي مزخرف بتقنية ثلاثية الأبعاد وذهب لامع',
  'درع محارب سايبر بانك مستقبلي مع خوذة نيون لقناة جيمنج',
  'أيقونة كاميرا مع موجات صوتية سينمائية لصناع محتوى يوتيوب',
  'شعار شركة ناشئة هندسي على شكل مكعب متداخل متدرج الألوان',
];

export const AILogoGeneratorModal: React.FC<AILogoGeneratorModalProps> = ({
  isOpen,
  onClose,
  config,
  language = 'ar',
  onApplyLogo,
  onOpenYouTubeKit,
  onOpenFaviconExport,
  onOpenFeatureGraphic,
  onOpenUniversalResizer,
  onOpenMockups,
}) => {
  const isAr = language === 'ar';
  const [prompt, setPrompt] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('minimal');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9'>('1:1');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceFileName, setReferenceFileName] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);
  const [autoOpenInStudio, setAutoOpenInStudio] = useState<boolean>(true);
  const [enhancedSuggestions, setEnhancedSuggestions] = useState<{
    suggestedColors?: string[];
    suggestedTitle?: string;
    suggestedTagline?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg(isAr ? 'حجم الصورة المرجعية كبير جداً (الحد الأقصى 10 ميجابايت)' : 'Reference image is too large (max 10MB)');
        return;
      }
      setReferenceFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setReferenceImage(reader.result as string);
        setErrorMsg(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      setErrorMsg(isAr ? 'الرجاء كتابة وصف أولي أولاً لتحسينه بالذكاء الاصطناعي' : 'Please type an initial prompt first');
      return;
    }
    setIsEnhancing(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          language: isAr ? 'ar' : 'en',
          type: aspectRatio === '16:9' ? 'banner' : 'logo',
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        if (isAr && data.data.enhancedPromptAr) {
          setPrompt(data.data.enhancedPromptAr);
        } else if (data.data.enhancedPromptEn) {
          setPrompt(data.data.enhancedPromptEn);
        }
        setEnhancedSuggestions(data.data);
        showToast(isAr ? '✨ تم تحسين الوصف واقتراح الهوية بنجاح!' : '✨ Prompt enhanced with smart branding!');
      } else {
        setErrorMsg(data.error || (isAr ? 'تعذر تحسين الوصف' : 'Failed to enhance prompt'));
      }
    } catch (err: any) {
      setErrorMsg(isAr ? 'خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي' : 'Error communicating with AI service');
    } finally {
      setIsEnhancing(false);
    }
  };

  const applyGeneratedLogoToStudio = (imageUrl: string, suggestions?: any) => {
    const updates: Partial<LogoConfig> = {
      uploadedImageSrc: imageUrl,
      iconType: 'image',
      uploadedImageScale: 100,
      uploadedImageOffsetX: 0,
      uploadedImageOffsetY: 0,
    };

    const sugg = suggestions || enhancedSuggestions;
    if (sugg?.suggestedColors && sugg.suggestedColors.length >= 2) {
      updates.bgColor1 = sugg.suggestedColors[0];
      updates.bgColor2 = sugg.suggestedColors[1];
    }
    if (sugg?.suggestedTitle) {
      updates.text = sugg.suggestedTitle;
    }

    onApplyLogo(updates, imageUrl);
    setAppliedSuccess(true);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال وصف الشعار أو الفكرة المطلوبة' : 'Please enter a logo prompt or idea');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setAppliedSuccess(false);

    try {
      const res = await fetch('/api/ai/generate-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          referenceImage: referenceImage || undefined,
          style: selectedStyle,
          aspectRatio,
          target: aspectRatio === '16:9' ? 'banner' : 'logo',
        }),
      });

      const data = await res.json();

      if (data.success && data.imageUrl) {
        setGeneratedImage(data.imageUrl);

        // Auto-apply immediately to studio state
        applyGeneratedLogoToStudio(data.imageUrl, data.enhancedSuggestions);

        showToast(isAr ? '🎉 تم إنشاء الشعار وتطبيقه في الاستوديو بنجاح!' : '🎉 Logo created & applied to studio successfully!');

        // Smooth scroll to result area
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 150);
      } else {
        setErrorMsg(data.error || (isAr ? 'فشل إنشاء الصورة، يرجى المحاولة بوصف آخر' : 'Failed to generate image, please try another prompt'));
      }
    } catch (err: any) {
      setErrorMsg(err.message || (isAr ? 'حدث خطأ أثناء معالجة الطلب' : 'An error occurred while generating'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Immediate Open in Studio Canvas & Editor
  const handleOpenDirectInStudio = () => {
    if (generatedImage) {
      applyGeneratedLogoToStudio(generatedImage);
    }
    onClose();
  };

  // Open in Complete Favicon Export Suite
  const handleExportFullPackage = () => {
    if (generatedImage) {
      applyGeneratedLogoToStudio(generatedImage);
    }
    if (onOpenFaviconExport) {
      onOpenFaviconExport();
    } else {
      onClose();
    }
  };

  // Open in YouTube Studio Kit
  const handleOpenYouTubeStudio = () => {
    if (generatedImage) {
      applyGeneratedLogoToStudio(generatedImage);
    }
    if (onOpenYouTubeKit) {
      onOpenYouTubeKit();
    } else {
      onClose();
    }
  };

  // Open Google Play Feature Graphic
  const handleOpenFeatureGraphicStudio = () => {
    if (generatedImage) {
      applyGeneratedLogoToStudio(generatedImage);
    }
    if (onOpenFeatureGraphic) {
      onOpenFeatureGraphic();
    } else {
      onClose();
    }
  };

  // Direct PNG Download
  const handleDownloadDirect = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `ai_${aspectRatio === '16:9' ? 'banner' : 'logo'}_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      label={isAr ? 'مولّد الشعارات بالذكاء الاصطناعي' : 'AI Logo Generator'}
      className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      overlayClassName="z-50 p-3 sm:p-6"
    >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  {isAr ? 'توليد الشعارات وبانرات يوتيوب بالذكاء الاصطناعي' : 'AI Logo & YouTube Kit Creator'}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-300 border border-pink-500/30">
                  Gemini AI 3.1
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'يتم تطبيق الشعار المنشأ فوراً في استوديو التصميم لتصدير حزمة الأيقونات والملفات الكاملة'
                  : 'Generated designs are instantly applied to the Studio canvas ready for full package exports'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {successToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-xs sm:text-sm font-semibold animate-bounce border border-emerald-400/40">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 custom-scrollbar">
          {/* Left / Input Column (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Aspect Ratio Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                {isAr ? 'نوع المخرج ونسبة الأبعاد:' : 'Output Type & Aspect Ratio:'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAspectRatio('1:1');
                    if (selectedStyle === 'youtube-banner') setSelectedStyle('minimal');
                  }}
                  className={`flex items-center justify-start gap-3 p-3 rounded-xl border text-sm font-medium transition cursor-pointer ${
                    aspectRatio === '1:1'
                      ? 'border-indigo-500 bg-indigo-500/15 text-white shadow-xs'
                      : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg border border-current flex items-center justify-center text-[10px] font-bold shrink-0">
                    1:1
                  </div>
                  <div className={isAr ? 'text-right' : 'text-left'}>
                    <div className="font-bold text-xs">{isAr ? 'شعار / أيقونة / Favicon' : 'Logo / App Icon / Favicon'}</div>
                    <div className="text-[11px] opacity-75">1024 × 1024 px ({isAr ? 'مربع متناسق' : 'Square'})</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAspectRatio('16:9');
                    setSelectedStyle('youtube-banner');
                  }}
                  className={`flex items-center justify-start gap-3 p-3 rounded-xl border text-sm font-medium transition cursor-pointer ${
                    aspectRatio === '16:9'
                      ? 'border-pink-500 bg-pink-500/15 text-white shadow-xs'
                      : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="w-8 h-5 rounded-md border border-current flex items-center justify-center text-[9px] font-bold shrink-0">
                    16:9
                  </div>
                  <div className={isAr ? 'text-right' : 'text-left'}>
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <Youtube className="w-3.5 h-3.5 text-red-500 inline shrink-0" />
                      <span>{isAr ? 'بانر وغلاف يوتيوب' : 'YouTube Channel Banner'}</span>
                    </div>
                    <div className="text-[11px] opacity-75">2560 × 1440 px ({isAr ? 'بانوراما عريض' : 'Landscape'})</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Prompt Input Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>{isAr ? 'وصف الشعار أو الفكرة (Prompt):' : 'Logo Description / Prompt:'}</span>
                  <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancing || !prompt.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 border border-purple-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Wand2 className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
                  {isEnhancing ? (isAr ? 'جاري التحسين...' : 'Enhancing...') : (isAr ? 'تحسين الوصف بالذكاء الاصطناعي' : 'Smart Prompt AI')}
                </button>
              </div>

              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    isAr
                      ? 'مثال: شعار صقر ذهبي متدرج لقناة ألعاب وتقنية، بخلفية داكنة فخمة وأشكال هندسية نظيفة...'
                      : 'E.g., Modern golden falcon vector logo for a gaming and tech brand with sleek geometric lines...'
                  }
                  rows={3}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none leading-relaxed"
                />
              </div>

              {/* Suggestions chips */}
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">
                  {isAr ? 'أفكار سريعة للإلهام (انقر للاختيار):' : 'Quick Prompt Ideas (Click to use):'}
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto pr-1">
                  {PROMPT_SUGGESTIONS.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(sug)}
                      className="text-[11px] px-2.5 py-1 bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-lg border border-slate-700/50 transition truncate max-w-full text-right cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reference Image (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                  {isAr ? 'صورة مرجعية اختيارية (Reference Image):' : 'Optional Reference Image:'}
                </span>
                <span className="text-[10px] font-normal text-slate-400">
                  {isAr ? '(سيعتمد الذكاء الاصطناعي على ألوانها وتكوينها)' : '(AI guides style & color composition)'}
                </span>
              </label>

              {referenceImage ? (
                <div className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-indigo-500/40 rounded-xl">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <img
                      src={referenceImage}
                      alt="Reference"
                      className="w-10 h-10 object-contain rounded-lg bg-slate-900 border border-slate-700"
                    />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-white truncate max-w-xs">
                        {referenceFileName || (isAr ? 'الصورة المرجعية' : 'Reference Image')}
                      </p>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> {isAr ? 'تم التحميل وجاهزة للتوليد' : 'Ready for AI generation'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReferenceImage(null);
                      setReferenceFileName('');
                    }}
                    className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                    title={isAr ? 'حذف الصورة المرجعية' : 'Remove reference'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700/80 hover:border-indigo-500/60 rounded-xl p-3 text-center cursor-pointer bg-slate-950/30 hover:bg-indigo-500/5 transition flex items-center justify-center gap-2.5"
                >
                  <Upload className="w-4 h-4 text-slate-400" />
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold text-indigo-400">{isAr ? 'انقر لرفع صورة مرجعية' : 'Upload reference photo'}</span> {isAr ? 'أو اسحبها هنا (PNG, JPG, SVG)' : '(PNG, JPG, SVG)'}
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Style Presets Grid */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                {isAr ? 'النمط الفني والتصميمي (Artistic Style):' : 'Artistic Design Style:'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-1">
                {AI_STYLE_PRESETS.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStyle(st.id)}
                    className={`p-2 rounded-xl border text-right transition flex flex-col justify-between cursor-pointer ${
                      selectedStyle === st.id
                        ? 'border-indigo-500 bg-indigo-500/15 text-white shadow-xs'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base">{st.icon}</span>
                      {selectedStyle === st.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white truncate">{isAr ? st.nameAr : st.nameEn}</div>
                      <div className="text-[10px] text-slate-400 truncate">{st.badge}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Display */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMsg}</div>
              </div>
            )}

            {/* Main Generate Button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-3 px-5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 active:scale-[0.99] shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جاري الرسم والتوليد بالذكاء الاصطناعي (Gemini)...' : 'Generating with Gemini AI...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isAr ? 'توليد الشعار وفتحه مباشرة في الاستوديو' : 'Generate & Open in Studio'}</span>
                </>
              )}
            </button>
          </div>

          {/* Right / Result Preview Column (5 cols) */}
          <div
            ref={resultRef}
            className="lg:col-span-5 flex flex-col gap-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 sm:p-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-pink-400" />
                {isAr ? 'معاينة المخرج والنتيجة:' : 'Generated Output Preview:'}
              </span>
              {generatedImage && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {isAr ? 'مطبق في الاستوديو' : 'Applied to Studio'}
                </span>
              )}
            </div>

            {/* Canvas Preview Area */}
            <div className="flex-1 min-h-[240px] flex items-center justify-center bg-slate-900/80 rounded-xl border border-slate-800 relative overflow-hidden p-2.5">
              {isGenerating ? (
                <div className="text-center space-y-3 p-5">
                  <div className="relative w-14 h-14 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                    <Sparkles className="w-6 h-6 text-purple-400 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-bold text-white">
                      {isAr ? 'جاري التوليد ودمج الهوية...' : 'Generating high-res assets...'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {isAr ? 'سيتم تطبيق الشعار فوراً في مساحة العمل وتجهيز حزم التصدير' : 'Logo will be applied directly to studio workspace'}
                    </p>
                  </div>
                </div>
              ) : generatedImage ? (
                <div className="w-full h-full flex flex-col items-center justify-center relative group">
                  <img
                    src={generatedImage}
                    alt="AI Generated Logo"
                    className={`max-h-[240px] w-auto object-contain rounded-xl shadow-xl border border-slate-700/80 transition-all duration-300 ${
                      aspectRatio === '16:9' ? 'aspect-video' : 'aspect-square'
                    }`}
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-900/85 backdrop-blur-xs border border-slate-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-between opacity-95">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isAr ? 'جاهز في المحرر الرئيسي' : 'Ready in Main Editor'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {aspectRatio === '16:9' ? '2560x1440' : '1024x1024'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2 p-5 text-slate-500">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-medium text-slate-300">
                    {isAr ? 'اكتب وصف الشعار ثم انقر "توليد الشعار"' : 'Type prompt & click Generate'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isAr ? 'سيظهر الشعار هنا ويتم فتحه مباشرة في الاستوديو للتصدير' : 'Logo will open directly in Studio for full export'}
                  </p>
                </div>
              )}
            </div>

            {/* Direct Studio Export & Package Action Suite */}
            {generatedImage && (
              <div className="space-y-2 animate-in fade-in">
                {/* 1. PRIMARY PROMINENT CTA: Open & Edit in Studio Canvas */}
                <button
                  type="button"
                  onClick={handleOpenDirectInStudio}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>{isAr ? '🚀 فتح وتعديل في الاستوديو الرئيسي (Studio Canvas)' : '🚀 Open & Edit in Studio Canvas'}</span>
                </button>

                {/* 2. Secondary Export Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Export Full Favicon Package */}
                  <button
                    type="button"
                    onClick={handleExportFullPackage}
                    className="py-2 px-3 rounded-xl font-bold text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title={isAr ? 'تصدير حزمة Favicon & ZIP كاملة' : 'Export Full Favicon & Multi-size ZIP'}
                  >
                    <PackageCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="truncate">{isAr ? '📦 تصدير الحزمة الكاملة' : '📦 Export Full Package'}</span>
                  </button>

                  {/* YouTube Branding Kit */}
                  <button
                    type="button"
                    onClick={handleOpenYouTubeStudio}
                    className="py-2 px-3 rounded-xl font-bold text-xs bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title={isAr ? 'فتح استوديو يوتيوب (غلاف وأيقونة وعلامة مائية)' : 'Open YouTube Branding Studio'}
                  >
                    <Youtube className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="truncate">{isAr ? '📺 استوديو يوتيوب' : '📺 YouTube Kit'}</span>
                  </button>

                  {/* Google Play Feature Graphic */}
                  <button
                    type="button"
                    onClick={handleOpenFeatureGraphicStudio}
                    className="py-2 px-3 rounded-xl font-bold text-xs bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title={isAr ? 'توليد الصورة المميزة لمتجر جوجل بلاي 1024x500' : 'Google Play Feature Graphic 1024x500'}
                  >
                    <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate">{isAr ? '📱 صورة Google Play' : '📱 Play Store Graphic'}</span>
                  </button>

                  {/* Direct PNG Download */}
                  <button
                    type="button"
                    onClick={handleDownloadDirect}
                    className="py-2 px-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title={isAr ? 'تنزيل ملف الصورة الفوري PNG' : 'Direct PNG Download'}
                  >
                    <Download className="w-4 h-4 text-slate-300 shrink-0" />
                    <span className="truncate">{isAr ? '📥 تنزيل صورة PNG' : '📥 Download PNG'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Smart Branding Palette Card if available */}
            {enhancedSuggestions && (
              <div className="p-2.5 bg-slate-900 border border-purple-500/20 rounded-xl space-y-1 text-xs">
                <div className="text-[11px] font-bold text-purple-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {isAr ? 'اقتراحات الهوية الذكية المطبقة:' : 'Smart Branding Suggestions Applied:'}
                </div>
                {enhancedSuggestions.suggestedTitle && (
                  <div className="text-slate-300 text-[11px]">
                    <span className="text-slate-400 font-semibold">{isAr ? 'اسم العلامة:' : 'Title:'}</span> {enhancedSuggestions.suggestedTitle}
                  </div>
                )}
                {enhancedSuggestions.suggestedColors && (
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-slate-400 text-[10px]">{isAr ? 'الألوان:' : 'Colors:'}</span>
                    <div className="flex gap-1">
                      {enhancedSuggestions.suggestedColors.map((c, i) => (
                        <div
                          key={i}
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] sm:text-xs">
              {isAr
                ? 'متصل بمحرّك الاستوديو: يتم حفظ وتطبيق التصميم في الذاكرة لتصدير جميع المقاسات'
                : 'Synced with Studio engine: Assets are auto-applied for all format & size exports'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {generatedImage && (
              <button
                type="button"
                onClick={handleOpenDirectInStudio}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
              >
                {isAr ? 'الذهاب للاستوديو' : 'Go to Studio'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition cursor-pointer"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </Modal>
  );
};
