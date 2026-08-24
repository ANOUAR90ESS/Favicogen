import { useTranslation } from 'react-i18next';
import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Wand2,
  RefreshCw,
  Download,
  Check,
  Layers,
  Youtube,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Palette,
  X,
  PackageCheck,
  Smartphone,
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
    nameKey: 'aiGeneratorModal.styleMinimalName',
    descKey: 'aiGeneratorModal.styleMinimalDesc',
    icon: '✨',
    badgeKey: 'aiGeneratorModal.styleMinimalBadge',
  },
  {
    id: 'modern-3d',
    nameKey: 'aiGeneratorModal.style3dName',
    descKey: 'aiGeneratorModal.style3dDesc',
    icon: '🔮',
    badgeKey: 'aiGeneratorModal.style3dBadge',
  },
  {
    id: 'luxury-gold',
    nameKey: 'aiGeneratorModal.styleGoldName',
    descKey: 'aiGeneratorModal.styleGoldDesc',
    icon: '👑',
    badgeKey: 'aiGeneratorModal.styleGoldBadge',
  },
  {
    id: 'cyberpunk',
    nameKey: 'aiGeneratorModal.styleCyberName',
    descKey: 'aiGeneratorModal.styleCyberDesc',
    icon: '⚡',
    badgeKey: 'aiGeneratorModal.styleCyberBadge',
  },
  {
    id: 'arabesque',
    nameKey: 'aiGeneratorModal.styleArabesqueName',
    descKey: 'aiGeneratorModal.styleArabesqueDesc',
    icon: '🌙',
    badgeKey: 'aiGeneratorModal.styleArabesqueBadge',
  },
  {
    id: 'flat-vector',
    nameKey: 'aiGeneratorModal.styleFlatName',
    descKey: 'aiGeneratorModal.styleFlatDesc',
    icon: '🎯',
    badgeKey: 'aiGeneratorModal.styleFlatBadge',
  },
  {
    id: 'mascot',
    nameKey: 'aiGeneratorModal.styleMascotName',
    descKey: 'aiGeneratorModal.styleMascotDesc',
    icon: '🎮',
    badgeKey: 'aiGeneratorModal.styleMascotBadge',
  },
  {
    id: 'youtube-banner',
    nameKey: 'aiGeneratorModal.styleBannerName',
    descKey: 'aiGeneratorModal.styleBannerDesc',
    icon: '📺',
    badgeKey: 'aiGeneratorModal.styleBannerBadge',
  },
];

const PROMPT_SUGGESTION_KEYS = [
  'aiGeneratorModal.promptFalcon',
  'aiGeneratorModal.promptCoffee',
  'aiGeneratorModal.promptAi',
  'aiGeneratorModal.promptArabicLetter',
  'aiGeneratorModal.promptCyberShield',
  'aiGeneratorModal.promptCamera',
  'aiGeneratorModal.promptStartup',
];

export const AILogoGeneratorModal: React.FC<AILogoGeneratorModalProps> = ({
  isOpen,
  onClose,
  language = 'ar',
  onApplyLogo,
  onOpenYouTubeKit,
  onOpenFaviconExport,
  onOpenFeatureGraphic,
}) => {
  const { t } = useTranslation();
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
        setErrorMsg(t('aiGeneratorModal.referenceImageIsToo'));
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
      setErrorMsg(t('aiGeneratorModal.pleaseTypeInitialPrompt'));
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
        showToast(t('aiGeneratorModal.promptEnhancedSmartBranding'));
      } else {
        setErrorMsg(data.error || (t('aiGeneratorModal.failedEnhancePrompt')));
      }
    } catch {
      setErrorMsg(t('aiGeneratorModal.errorCommunicatingAiService'));
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
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMsg(t('aiGeneratorModal.pleaseEnterLogoPrompt'));
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

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

        showToast(t('aiGeneratorModal.logoCreatedAppliedStudio'));

        // Smooth scroll to result area
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 150);
      } else {
        setErrorMsg(data.error || (t('aiGeneratorModal.failedGenerateImagePlease')));
      }
    } catch (err: any) {
      setErrorMsg(err.message || (t('aiGeneratorModal.anErrorOccurredWhile')));
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
      label={t('aiGeneratorModal.aiLogoGenerator')}
      className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full"
      overlayClassName="z-50"
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
                  {t('aiGeneratorModal.aiLogoYoutubeKit')}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-300 border border-pink-500/30">
                  Gemini AI 3.1
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {t('aiGeneratorModal.generatedDesignsAreInstantly')}
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
                {t('aiGeneratorModal.outputTypeAspectRatio')}
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
                    <div className="font-bold text-xs">{t('aiGeneratorModal.logoAppIconFavicon')}</div>
                    <div className="text-[11px] opacity-75">1024 × 1024 px ({t('aiGeneratorModal.square')})</div>
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
                      <span>{t('aiGeneratorModal.youtubeChannelBanner')}</span>
                    </div>
                    <div className="text-[11px] opacity-75">2560 × 1440 px ({t('aiGeneratorModal.landscape')})</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Prompt Input Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>{t('aiGeneratorModal.logoDescriptionPrompt')}</span>
                  <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancing || !prompt.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 border border-purple-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Wand2 className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
                  {isEnhancing ? (t('aiGeneratorModal.enhancing')) : (t('aiGeneratorModal.smartPromptAi'))}
                </button>
              </div>

              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    t('aiGeneratorModal.eGModernGolden')
                  }
                  rows={3}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none leading-relaxed"
                />
              </div>

              {/* Suggestions chips */}
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">
                  {t('aiGeneratorModal.quickPromptIdeasClick')}
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto pr-1">
                  {PROMPT_SUGGESTION_KEYS.map((sugKey, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(t(sugKey))}
                      className="text-[11px] px-2.5 py-1 bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-lg border border-slate-700/50 transition truncate max-w-full text-right cursor-pointer"
                    >
                      {t(sugKey)}
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
                  {t('aiGeneratorModal.optionalReferenceImage')}
                </span>
                <span className="text-[10px] font-normal text-slate-400">
                  {t('aiGeneratorModal.aiGuidesStyleColor')}
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
                        {referenceFileName || (t('aiGeneratorModal.referenceImage'))}
                      </p>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> {t('aiGeneratorModal.readyAiGeneration')}
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
                    title={t('aiGeneratorModal.removeReference')}
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
                    <span className="font-semibold text-indigo-400">{t('aiGeneratorModal.uploadReferencePhoto')}</span> {t('aiGeneratorModal.pngJpgSvg')}
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
                {t('aiGeneratorModal.artisticDesignStyle')}
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
                      <div className="text-xs font-bold text-white truncate">{t(st.nameKey)}</div>
                      <div className="text-[10px] text-slate-400 truncate">{t(st.badgeKey)}</div>
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
                  <span>{t('aiGeneratorModal.generatingGeminiAi')}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t('aiGeneratorModal.generateOpenStudio')}</span>
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
                {t('aiGeneratorModal.generatedOutputPreview')}
              </span>
              {generatedImage && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {t('aiGeneratorModal.appliedStudio')}
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
                      {t('aiGeneratorModal.generatingHighResAssets')}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {t('aiGeneratorModal.logoWillBeApplied')}
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
                      {t('aiGeneratorModal.readyMainEditor')}
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
                    {t('aiGeneratorModal.typePromptClickGenerate')}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {t('aiGeneratorModal.logoWillOpenDirectly')}
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
                  <span>{t('aiGeneratorModal.openEditStudioCanvas')}</span>
                </button>

                {/* 2. Secondary Export Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Export Full Favicon Package */}
                  <button
                    type="button"
                    onClick={handleExportFullPackage}
                    className="py-2 px-3 rounded-xl font-bold text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title={t('aiGeneratorModal.exportFullFaviconMulti')}
                  >
                    <PackageCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="truncate">{t('aiGeneratorModal.exportFullPackage')}</span>
                  </button>

                  {/* YouTube Branding Kit */}
                  <button
                    type="button"
                    onClick={handleOpenYouTubeStudio}
                    className="py-2 px-3 rounded-xl font-bold text-xs bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title={t('aiGeneratorModal.openYoutubeBrandingStudio')}
                  >
                    <Youtube className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="truncate">{t('aiGeneratorModal.youtubeKit')}</span>
                  </button>

                  {/* Google Play Feature Graphic */}
                  <button
                    type="button"
                    onClick={handleOpenFeatureGraphicStudio}
                    className="py-2 px-3 rounded-xl font-bold text-xs bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title={t('aiGeneratorModal.googlePlayFeatureGraphic')}
                  >
                    <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate">{t('aiGeneratorModal.playStoreGraphic')}</span>
                  </button>

                  {/* Direct PNG Download */}
                  <button
                    type="button"
                    onClick={handleDownloadDirect}
                    className="py-2 px-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title={t('aiGeneratorModal.directPngDownload')}
                  >
                    <Download className="w-4 h-4 text-slate-300 shrink-0" />
                    <span className="truncate">{t('aiGeneratorModal.downloadPng')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Smart Branding Palette Card if available */}
            {enhancedSuggestions && (
              <div className="p-2.5 bg-slate-900 border border-purple-500/20 rounded-xl space-y-1 text-xs">
                <div className="text-[11px] font-bold text-purple-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {t('aiGeneratorModal.smartBrandingSuggestionsApplied')}
                </div>
                {enhancedSuggestions.suggestedTitle && (
                  <div className="text-slate-300 text-[11px]">
                    <span className="text-slate-400 font-semibold">{t('aiGeneratorModal.title2')}</span> {enhancedSuggestions.suggestedTitle}
                  </div>
                )}
                {enhancedSuggestions.suggestedColors && (
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-slate-400 text-[10px]">{t('aiGeneratorModal.colors')}</span>
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
              {t('aiGeneratorModal.syncedStudioEngineAssets')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {generatedImage && (
              <button
                type="button"
                onClick={handleOpenDirectInStudio}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
              >
                {t('aiGeneratorModal.goStudio')}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition cursor-pointer"
            >
              {t('aiGeneratorModal.close')}
            </button>
          </div>
        </div>
      </Modal>
  );
};
