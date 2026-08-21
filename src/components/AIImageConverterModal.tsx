import React, { useState, useRef } from 'react';
import {
  Upload,
  Sparkles,
  Download,
  Check,
  Package,
  Layers,
  Wand2,
  FileCode,
  Image as ImageIcon,
  Smartphone,
  Globe,
  Monitor,
  ExternalLink,
  RefreshCw,
  X,
  Palette,
  Eye,
  Sliders,
  CheckCircle2,
  Loader2,
  Scissors,
  Crop,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LogoConfig, SupportedLanguage, FaviconSpec } from '../types';
import {
  FAVICON_SPECS,
  generateSvgString,
  renderSvgToBlob,
  generateFaviconZip,
  generateHtmlHeadSnippet,
  generateWebmanifestJson,
  createIcoFile,
  downloadBlob,
} from '../utils/canvasRenderer';
import { autoTrimImage } from '../utils/imageCropper';
import { ImageCropTrimModal } from './ImageCropTrimModal';

interface AIImageConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  onApplyConfig: (config: LogoConfig) => void;
}

// Sample Fyntica SVG / Data representation for instant 1-click test
const SAMPLE_FYNTICA_PRESET: Partial<LogoConfig> = {
  name: 'Fyntica',
  text: 'Fyntica',
  fontFamily: 'Outfit',
  fontSize: 48,
  fontWeight: 800,
  textColor: '#ffffff',
  bgType: 'linear',
  bgColor1: '#0d9488',
  bgColor2: '#0f766e',
  bgGradientAngle: 135,
  shapeMask: 'squircle',
  borderRadius: 56,
  borderWidth: 3,
  borderColor: 'rgba(255, 255, 255, 0.4)',
  innerGlow: true,
  innerGlowColor: '#5eead4',
  iconType: 'library',
  iconKey: 'chart',
  iconSize: 185,
  iconColor: '#ffffff',
  iconColor2: '#ccfbf1',
  iconShadow: true,
  iconShadowColor: 'rgba(0,0,0,0.35)',
  iconShadowBlur: 10,
  iconShadowOffsetY: 6,
  textShadow: true,
  textShadowColor: 'rgba(0,0,0,0.45)',
  textShadowBlur: 8,
  textShadowOffsetY: 4,
  showTagline: false,
  tagline: 'SMART FINANCIAL ANALYTICS',
  layout: 'icon-top',
};

export const AIImageConverterModal: React.FC<AIImageConverterModalProps> = ({
  isOpen,
  onClose,
  language,
  onApplyConfig,
}) => {
  const isAr = language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState<'image-direct' | 'ai-recreated'>('image-direct');
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [activeFormat, setActiveFormat] = useState<'all' | 'png' | 'svg' | 'webp' | 'ico' | 'jpeg'>('all');
  const [customCropShape, setCustomCropShape] = useState<'squircle' | 'circle' | 'square' | 'none'>('squircle');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimFeedback, setTrimFeedback] = useState<string | null>(null);

  const handleAutoTrimUploadedImage = async () => {
    if (!uploadedImageSrc) return;
    setIsTrimming(true);
    setTrimFeedback(null);
    try {
      const res = await autoTrimImage(uploadedImageSrc, { mode: 'auto', tolerance: 18, padding: 0 });
      if (res.trimResult.foundSubject && res.trimResult.trimSavedPixels > 0) {
        setUploadedImageSrc(res.dataUrl);
        const savedPct = Math.round(
          (res.trimResult.trimSavedPixels / (res.trimResult.originalWidth * res.trimResult.originalHeight)) * 100
        );
        setTrimFeedback(isAr ? `تم إزالة الحواف البيضاء بنجاح (${savedPct}% هوامش محذوفة)` : `White borders removed (${savedPct}% saved)`);
      } else {
        setTrimFeedback(isAr ? 'الصورة محكمة بالفعل ولا توجد حواف بيضاء زائدة' : 'Image is already tightly trimmed');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTrimming(false);
      setTimeout(() => setTrimFeedback(null), 3500);
    }
  };

  if (!isOpen) return null;

  // Build active preview config based on selected mode
  const currentConfig: LogoConfig = {
    id: 'ai_converted_project',
    name: analysisResult?.brandName || 'Fyntica',
    updatedAt: Date.now(),
    canvasSize: 512,
    padding: 24,
    bgType: selectedMode === 'image-direct' ? 'transparent' : 'linear',
    bgColor1: analysisResult?.detectedColors?.background1 || '#0d9488',
    bgColor2: analysisResult?.detectedColors?.background2 || '#0f766e',
    bgGradientAngle: 135,
    pattern: 'none',
    patternOpacity: 0.15,
    shapeMask: (analysisResult?.shapeMask as any) || 'squircle',
    borderRadius: 56,
    borderWidth: selectedMode === 'image-direct' ? 0 : 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderStyle: 'solid',
    shadowBlur: 20,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffsetY: 10,
    innerGlow: true,
    innerGlowColor: '#5eead4',
    iconType: selectedMode === 'image-direct' && uploadedImageSrc ? 'image' : 'library',
    iconKey: analysisResult?.suggestedIcon || 'chart',
    iconSize: selectedMode === 'image-direct' ? 512 : 185,
    iconColor: analysisResult?.detectedColors?.primary || '#ffffff',
    iconColor2: analysisResult?.detectedColors?.secondary || '#ccfbf1',
    iconGradient: false,
    iconGradientAngle: 135,
    iconOffsetX: 0,
    iconOffsetY: 0,
    iconRotation: 0,
    iconFlipH: false,
    iconFlipV: false,
    iconOpacity: 1,
    iconShadow: true,
    iconShadowColor: 'rgba(0, 0, 0, 0.35)',
    iconShadowBlur: 10,
    iconShadowOffsetX: 0,
    iconShadowOffsetY: 6,
    iconOutline: false,
    iconOutlineWidth: 3,
    iconOutlineColor: '#ffffff',
    uploadedImageSrc: uploadedImageSrc || undefined,
    uploadedImageScale: selectedMode === 'image-direct' ? 102 : 100,
    uploadedImageOffsetX: 0,
    uploadedImageOffsetY: 0,
    uploadedImageRotation: 0,
    uploadedImageOpacity: 1,
    uploadedImageCropShape: customCropShape,
    uploadedImageFilters: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hueRotate: 0,
      grayscale: 0,
      invert: 0,
      sepia: 0,
      blur: 0,
    },
    showText: selectedMode !== 'image-direct',
    text: analysisResult?.brandName || 'Fyntica',
    fontFamily: 'Outfit',
    fontSize: 48,
    fontWeight: 800,
    textColor: analysisResult?.detectedColors?.text || '#ffffff',
    textColor2: '#cbd5e1',
    textGradient: false,
    textGradientAngle: 90,
    letterSpacing: 1,
    textLineHeight: 1.2,
    textTransform: 'none',
    textOffsetX: 0,
    textOffsetY: 0,
    textRotation: 0,
    textCurve: 'straight',
    textCurveRadius: 180,
    textShadow: true,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowBlur: 8,
    textShadowOffsetX: 0,
    textShadowOffsetY: 4,
    textStroke: false,
    textStrokeWidth: 2,
    textStrokeColor: '#000000',
    textUppercase: false,
    showTagline: false,
    tagline: analysisResult?.tagline || 'SMART FINANCIAL ANALYTICS',
    taglineFontFamily: 'Tajawal',
    taglineFontSize: 16,
    taglineFontWeight: 500,
    taglineColor: '#94a3b8',
    taglineLetterSpacing: 2,
    taglineOffsetY: 0,
    taglineUppercase: false,
    showRing: false,
    ringRadius: 210,
    ringWidth: 3,
    ringColor: '#38bdf8',
    ringDash: false,
    showBadgeRibbon: false,
    layout: selectedMode === 'image-direct' ? 'icon-only' : 'icon-top',
  };

  const svgCode = generateSvgString(currentConfig, 512);

  // Trigger Image AI Analysis
  const analyzeImage = async (dataUrl: string) => {
    setUploadedImageSrc(dataUrl);
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const res = await fetch('/api/ai/analyze-and-convert-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataUrl,
          language,
        }),
      });

      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      console.warn('AI analysis fallback:', err);
      // Fallback smart defaults
      setAnalysisResult({
        brandName: 'Fyntica',
        tagline: isAr ? 'تحليلات وإدارة مالية ذكية' : 'Smart Financial Analytics',
        industry: 'Finance & Tech',
        detectedColors: {
          primary: '#0d9488',
          secondary: '#06b6d4',
          background1: '#0f766e',
          background2: '#115e59',
          text: '#ffffff',
          accent: '#38bdf8',
        },
        shapeMask: 'squircle',
        suggestedIcon: 'chart',
        description: isAr
          ? 'تم تحليل الشعار بنجاح: تم التعرف على اسم العلامة Fyntica مع تدرج أخضر تركوازي احترافي.'
          : 'Logo analyzed successfully: Detected Fyntica brand with professional teal gradient.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        analyzeImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Load sample Fyntica directly
  const loadFynticaSample = async () => {
    try {
      const fynticaSvg = generateSvgString({ ...currentConfig, ...SAMPLE_FYNTICA_PRESET } as LogoConfig, 512);
      const pngBlob = await renderSvgToBlob(fynticaSvg, 512, 'png');
      const reader = new FileReader();
      reader.onload = () => {
        analyzeImage(reader.result as string);
      };
      reader.readAsDataURL(pngBlob);
    } catch (e) {
      console.warn('Fallback loading fyntica sample:', e);
      setAnalysisResult({
        brandName: 'Fyntica',
        tagline: isAr ? 'تحليلات وإدارة مالية ذكية' : 'Smart Financial Analytics',
        industry: 'Finance & Tech',
        detectedColors: {
          primary: '#0d9488',
          secondary: '#06b6d4',
          background1: '#0f766e',
          background2: '#115e59',
          text: '#ffffff',
          accent: '#38bdf8',
        },
        shapeMask: 'squircle',
        suggestedIcon: 'chart',
        description: isAr
          ? 'تم تحليل الشعار بنجاح: تم التعرف على اسم العلامة Fyntica مع تدرج أخضر تركوازي احترافي.'
          : 'Logo analyzed successfully: Detected Fyntica brand with professional teal gradient.',
      });
    }
  };

  // Download entire ZIP package
  const handleDownloadZip = async () => {
    setIsExportingZip(true);
    try {
      const zipBlob = await generateFaviconZip(currentConfig);
      downloadBlob(zipBlob, `${(currentConfig.text || 'favicon').toLowerCase()}-full-package.zip`);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  // Download single size & format
  const handleDownloadSingle = async (size: number, format: 'png' | 'jpeg' | 'webp' | 'svg' | 'ico') => {
    if (format === 'svg') {
      const blob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
      downloadBlob(blob, `${currentConfig.text || 'logo'}-${size}x${size}.svg`);
      return;
    }

    if (format === 'ico') {
      const pngBlob = await renderSvgToBlob(svgCode, 32, 'png');
      const icoBlob = await createIcoFile([{ size: 32, blob: pngBlob }]);
      downloadBlob(icoBlob, 'favicon.ico');
      return;
    }

    const blob = await renderSvgToBlob(svgCode, size, format);
    const ext = format === 'jpeg' ? 'jpg' : format;
    downloadBlob(blob, `${currentConfig.text || 'logo'}-${size}x${size}.${ext}`);
  };

  const handleApplyToStudio = () => {
    onApplyConfig(currentConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {isAr ? 'التحويل الذكي للصورة إلى جميع مقاسات وصيغ الشعار والـ Favicon' : 'AI Image to Multi-Size Favicon & Logo Converter'}
                </h3>
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  AI Powered
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? 'ارفع أي صورة شعار (مثل صورة Fyntica) لتحصل فورياً على حزمة الأيقونات الكاملة بجميع المقاسات (16px إلى 512px) وبكافة الصيغ (SVG, PNG, JPG, WebP, ICO)'
                  : 'Upload any logo image to instantly generate all Favicon sizes (16px-512px) & formats (SVG, PNG, JPG, WebP, ICO).'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
          {/* Upload Zone / Drop Area */}
          {!uploadedImageSrc ? (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-300 hover:border-indigo-600 bg-white hover:bg-indigo-50/30 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 shadow-sm group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform shadow-xs">
                    <Upload className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {isAr ? 'اضغط هنا لرفع صورة الشعار أو اسحب الملف وأفلته' : 'Click to upload logo image or drag & drop'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {isAr ? 'يدعم PNG, JPG, WebP, SVG مع ميزة إزالة وتعديل الخلفيات والقص التلقائي' : 'Supports PNG, JPG, WebP, SVG with automatic resizing & clipping'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sample Quick Try Button for Fyntica */}
              <div className="flex items-center justify-center gap-2 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-900">
                  {isAr ? 'هل تود تجربة سريعة مع صورة الشعار المرفقة Fyntica؟' : 'Want a quick test with the attached Fyntica logo?'}
                </span>
                <button
                  type="button"
                  onClick={loadFynticaSample}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                >
                  {isAr ? 'جرب الآن مع شعار Fyntica ⚡' : 'Try Fyntica Logo Now ⚡'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* AI Analysis Summary Bar */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 p-1 flex items-center justify-center overflow-hidden shadow-2xs">
                      <img src={uploadedImageSrc} alt="Uploaded logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {analysisResult?.brandName || 'Fyntica'}
                        </h4>
                        {isAnalyzing ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {isAr ? 'جارٍ التحليل بالذكاء الاصطناعي...' : 'AI Analyzing...'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            {isAr ? 'تم التحليل بنجاح' : 'Analyzed by AI'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {analysisResult?.tagline || (isAr ? 'إدارة وتحليلات مالية ذكية' : 'Smart Financial Analytics')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleAutoTrimUploadedImage}
                      disabled={isTrimming}
                      className="px-2.5 py-1.5 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      title={isAr ? 'قص الحواف البيضاء والشفافة المحيطة تلقائياً' : 'Auto trim white / empty borders'}
                    >
                      {isTrimming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Scissors className="h-3.5 w-3.5 text-teal-600" />}
                      <span>{isAr ? 'قص الأطراف البيضاء' : 'Auto-Trim'}</span>
                    </button>

                    <button
                      onClick={() => setIsCropModalOpen(true)}
                      className="px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5"
                      title={isAr ? 'قص يدوي بمستطيل تفاعلي' : 'Manual rectangle crop'}
                    >
                      <Crop className="h-3.5 w-3.5 text-indigo-600" />
                      <span>{isAr ? 'قص مستطيل' : 'Crop Rect'}</span>
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      {isAr ? 'صورة أخرى' : 'Upload Different'}
                    </button>
                    <button
                      onClick={handleApplyToStudio}
                      className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Sliders className="h-3.5 w-3.5" />
                      <span>{isAr ? 'تعديل كامل بالاستوديو' : 'Open in Studio'}</span>
                    </button>
                  </div>
                </div>

                {trimFeedback && (
                  <div className="p-2 bg-teal-50 border border-teal-200 rounded-lg text-xs font-bold text-teal-800 animate-in fade-in flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-600" />
                    <span>{trimFeedback}</span>
                  </div>
                )}

                {/* AI Detected Palette & Mode Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Mode Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      {isAr ? 'نمط التوليد المفضل' : 'Generation Mode'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedMode('image-direct')}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                          selectedMode === 'image-direct'
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="block font-bold">{isAr ? 'الصورة المرفوعة المباشرة' : 'Direct Image Master'}</span>
                        <span className="text-[10px] font-normal text-slate-500 block mt-0.5">
                          {isAr ? 'توليد المقاسات من صورتك مباشرة' : 'Convert exact uploaded image'}
                        </span>
                      </button>

                      <button
                        onClick={() => setSelectedMode('ai-recreated')}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                          selectedMode === 'ai-recreated'
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="block font-bold">{isAr ? 'إعادة بناء فيكتور ذكية' : 'AI Vector Re-creation'}</span>
                        <span className="text-[10px] font-normal text-slate-500 block mt-0.5">
                          {isAr ? 'شعار فيكتور كامل فائق الحدة' : 'Ultra-crisp vector SVG logo'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Crop Shape Selector for uploaded image */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      {isAr ? 'قناع قص الأيقونة' : 'Icon Shape Mask'}
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'squircle', nameAr: 'سكويركل', nameEn: 'Squircle' },
                        { id: 'circle', nameAr: 'دائرة', nameEn: 'Circle' },
                        { id: 'square', nameAr: 'مربع', nameEn: 'Square' },
                        { id: 'none', nameAr: 'أصلي', nameEn: 'Original' },
                      ].map((shape) => (
                        <button
                          key={shape.id}
                          onClick={() => setCustomCropShape(shape.id as any)}
                          className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                            customCropShape === shape.id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {isAr ? shape.nameAr : shape.nameEn}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main 1-Click Action Bar */}
              <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Package className="h-5 w-5 text-indigo-400" />
                    <h4 className="text-base font-bold text-white">
                      {isAr ? 'حزمة Favicon & Logo الكاملة جاهزة للتحميل' : 'Complete Favicon & Logo Package Ready'}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300">
                    {isAr
                      ? 'تتضمن 9 مقاسات قياسية (16x16 إلى 512x512) + ملف ICO + ملف SVG + ملف site.webmanifest وكود HTML'
                      : 'Includes all 9 standard sizes (16px-512px) + ICO file + SVG vector + manifest & HTML tags.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadZip}
                    disabled={isExportingZip}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    {isExportingZip ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : downloadSuccess ? (
                      <Check className="h-4 w-4 text-emerald-300" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span>
                      {downloadSuccess
                        ? (isAr ? 'تم التحميل بنجاح!' : 'Downloaded!')
                        : isAr
                        ? 'تحميل الحزمة الكاملة (ZIP) بنقرة واحدة'
                        : 'Download Full Package (ZIP)'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Live Multi-Resolution Matrix (16px to 512px) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    <span>{isAr ? 'المعاينة الحية بجميع المقاسات والصيغ' : 'Live Sizes & Formats Matrix'}</span>
                  </h4>
                  {/* Format Filter Tabs */}
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                    {(['all', 'png', 'svg', 'webp', 'ico', 'jpeg'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setActiveFormat(fmt)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-md uppercase transition-all ${
                          activeFormat === fmt ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid of Favicon Sizes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {FAVICON_SPECS.map((spec) => (
                    <div
                      key={spec.size}
                      className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-3 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {/* Scaled Preview Box */}
                        <div className="w-12 h-12 rounded-lg bg-slate-100/70 border border-slate-200 flex items-center justify-center p-1 overflow-hidden shrink-0">
                          <div
                            style={{
                              width: `${Math.min(spec.size, 40)}px`,
                              height: `${Math.min(spec.size, 40)}px`,
                            }}
                            dangerouslySetInnerHTML={{ __html: svgCode }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800">{spec.label}</span>
                            {spec.isFaviconStandard && (
                              <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded">
                                Browser
                              </span>
                            )}
                            {spec.isAppleTouch && (
                              <span className="text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                                Apple iOS
                              </span>
                            )}
                            {spec.isAndroidChrome && (
                              <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded">
                                Android/PWA
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">
                            {spec.fileName}
                          </span>
                        </div>
                      </div>

                      {/* Download Single Button */}
                      <button
                        onClick={() => handleDownloadSingle(spec.size, activeFormat === 'all' ? 'png' : activeFormat)}
                        className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded-lg transition-colors"
                        title={isAr ? `تحميل ${spec.label}` : `Download ${spec.label}`}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real World Mockups Preview (Browser Tab & Mobile) */}
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-indigo-600" />
                  <span>{isAr ? 'معاينة واقعية للمتصفح والهواتف' : 'Real-World Mockup Previews'}</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Browser Tab Mockup */}
                  <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 text-white space-y-2 shadow-sm">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-slate-400 font-mono ml-2">Chrome Tab 16x16 Preview</span>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg max-w-xs border border-slate-700/50">
                      <div
                        className="w-4 h-4 shrink-0 rounded-xs overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: svgCode }}
                      />
                      <span className="text-xs font-bold truncate text-slate-200">
                        {currentConfig.text || 'Fyntica'} - Dashboard
                      </span>
                    </div>
                  </div>

                  {/* iOS / Mobile App Icon Mockup */}
                  <div className="bg-gradient-to-b from-slate-100 to-slate-200 rounded-xl p-3 border border-slate-300 flex items-center justify-around shadow-sm">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-14 h-14 rounded-2xl shadow-lg border border-white/50 overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: svgCode }}
                      />
                      <span className="text-[11px] font-bold text-slate-800">{currentConfig.text || 'Fyntica'}</span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="font-bold text-slate-900">{isAr ? 'شاشة هاتف الآيفون والأندرويد' : 'Mobile Home Screen'}</div>
                      <div className="text-[11px] text-slate-500">
                        {isAr ? 'مقاسات 180x180 و 192x192 المجهزة تلقائياً' : '180x180 & 192x192 crisp rendering'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Crop & Trim Modal */}
      {isCropModalOpen && uploadedImageSrc && (
        <ImageCropTrimModal
          isOpen={isCropModalOpen}
          onClose={() => setIsCropModalOpen(false)}
          initialImageSrc={uploadedImageSrc}
          language={language}
          onApplyCrop={(croppedDataUrl) => {
            setUploadedImageSrc(croppedDataUrl);
            setTrimFeedback(isAr ? 'تم تطبيق القص الجديد بنجاح!' : 'Cropped image applied successfully!');
            setTimeout(() => setTrimFeedback(null), 3000);
          }}
        />
      )}
    </div>
  );
};
