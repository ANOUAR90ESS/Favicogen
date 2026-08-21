import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Upload,
  Download,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Sliders,
  Maximize2,
  Lock,
  Unlock,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Check,
  Search,
  Package,
  FileCode,
  Palette,
  Eye,
  Crop,
  CheckCircle2,
  Smartphone,
  Globe,
  Monitor,
  Printer,
  Copy,
  FolderDown,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  LogoConfig,
  SupportedLanguage,
  UniversalResizeOptions,
  ResizePreset,
  ResizeCategory,
} from '../types';
import { RESIZE_PRESETS } from '../utils/resizePresets';
import {
  loadImageElement,
  renderResizedImageToBlob,
  generateMultiSizeZip,
  convertUnitsToPixels,
} from '../utils/imageResizer';
import { generateSvgString, downloadBlob } from '../utils/canvasRenderer';

interface UniversalImageResizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  currentLogoConfig: LogoConfig;
}

export const UniversalImageResizerModal: React.FC<UniversalImageResizerModalProps> = ({
  isOpen,
  onClose,
  language,
  currentLogoConfig,
}) => {
  const isAr = language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Source Image State
  const [sourceImageSrc, setSourceImageSrc] = useState<string | null>(null);
  const [sourceDimensions, setSourceDimensions] = useState<{ width: number; height: number }>({
    width: 512,
    height: 512,
  });

  // Active Tool Tab: 'custom' | 'presets' | 'batch'
  const [activeTab, setActiveTab] = useState<'custom' | 'presets' | 'batch'>('custom');

  // Selected Category filter for presets
  const [selectedCategory, setSelectedCategory] = useState<ResizeCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected presets for Batch Export
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>([
    'gp-icon',
    'gp-feature',
    'ios-app-store',
    'web-fav-32',
    'web-fav-180',
    'web-fav-512',
    'web-og-image',
    'ig-post-square',
    'ig-story-reel',
    'yt-thumb',
  ]);

  // Universal Resize Options State
  const [options, setOptions] = useState<UniversalResizeOptions>({
    width: 1024,
    height: 500,
    unit: 'px',
    dpi: 300,
    maintainAspectRatio: false,
    fitMode: 'contain',
    backgroundStyle: 'transparent',
    backgroundColor: '#ffffff',
    backgroundColor2: '#06b6d4',
    cropShape: 'none',
    borderRadius: 32,
    format: 'png',
    quality: 0.95,
    flipHorizontal: false,
    flipVertical: false,
    rotation: 0,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0,
    blur: 0,
  });

  // Aspect ratio lock ratio value
  const [aspectRatioValue, setAspectRatioValue] = useState<number | null>(null);

  // Rendered Output Preview State
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [renderedSizeInfo, setRenderedSizeInfo] = useState<{
    width: number;
    height: number;
    sizeBytes: number;
  }>({
    width: 1024,
    height: 500,
    sizeBytes: 0,
  });

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isExportingBatch, setIsExportingBatch] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Object URL of the generated studio-logo source, so it can be revoked on replace.
  const sourceObjectUrlRef = useRef<string | null>(null);

  // Replaces the working source image, releasing any object URL it supersedes.
  const applySourceImage = (src: string, isObjectUrl: boolean) => {
    if (sourceObjectUrlRef.current && sourceObjectUrlRef.current !== src) {
      URL.revokeObjectURL(sourceObjectUrlRef.current);
    }
    sourceObjectUrlRef.current = isObjectUrl ? src : null;
    setSourceImageSrc(src);
  };

  // Renders the studio logo into a fresh source image for the resizer.
  const loadStudioLogoAsSource = () => {
    const svg = generateSvgString(currentLogoConfig, 512);
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    applySourceImage(URL.createObjectURL(blob), true);
    setSourceDimensions({ width: 512, height: 512 });
  };

  // Initialize with current logo SVG from studio canvas if no image uploaded yet
  useEffect(() => {
    if (isOpen && !sourceImageSrc) {
      loadStudioLogoAsSource();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentLogoConfig, sourceImageSrc]);

  // Release the last generated object URL when the modal unmounts.
  useEffect(() => {
    return () => {
      if (sourceObjectUrlRef.current) {
        URL.revokeObjectURL(sourceObjectUrlRef.current);
        sourceObjectUrlRef.current = null;
      }
    };
  }, []);

  // Load Image and update original source dimensions
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        applySourceImage(result, false);
        setSourceDimensions({ width: img.naturalWidth || 512, height: img.naturalHeight || 512 });
        // Set initial resize options to match source image
        setOptions((prev) => ({
          ...prev,
          width: img.naturalWidth || 512,
          height: img.naturalHeight || 512,
        }));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  // Re-render live preview whenever options or source image change
  useEffect(() => {
    if (!sourceImageSrc || !isOpen) return;

    let isMounted = true;
    const updatePreview = async () => {
      setIsProcessing(true);
      try {
        const result = await renderResizedImageToBlob(sourceImageSrc, options);
        if (isMounted) {
          setPreviewDataUrl(result.dataUrl);
          setRenderedSizeInfo({
            width: result.width,
            height: result.height,
            sizeBytes: result.sizeBytes,
          });
        }
      } catch (err) {
        console.error('Resize render error:', err);
      } finally {
        if (isMounted) setIsProcessing(false);
      }
    };

    const timeout = setTimeout(updatePreview, 60);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [sourceImageSrc, options, isOpen]);

  // Handle Width change with aspect ratio lock
  const handleWidthChange = (newWidth: number) => {
    if (newWidth <= 0) return;
    if (options.maintainAspectRatio && aspectRatioValue) {
      const calculatedHeight = Math.round(newWidth / aspectRatioValue);
      setOptions((prev) => ({ ...prev, width: newWidth, height: calculatedHeight }));
    } else {
      setOptions((prev) => ({ ...prev, width: newWidth }));
    }
  };

  // Handle Height change with aspect ratio lock
  const handleHeightChange = (newHeight: number) => {
    if (newHeight <= 0) return;
    if (options.maintainAspectRatio && aspectRatioValue) {
      const calculatedWidth = Math.round(newHeight * aspectRatioValue);
      setOptions((prev) => ({ ...prev, height: newHeight, width: calculatedWidth }));
    } else {
      setOptions((prev) => ({ ...prev, height: newHeight }));
    }
  };

  // Toggle Aspect Ratio Lock
  const toggleAspectLock = () => {
    if (!options.maintainAspectRatio) {
      const ratio = (options.width || 1) / (options.height || 1);
      setAspectRatioValue(ratio);
      setOptions((prev) => ({ ...prev, maintainAspectRatio: true }));
    } else {
      setOptions((prev) => ({ ...prev, maintainAspectRatio: false }));
    }
  };

  // Apply Ratio Preset (e.g. 1:1, 16:9, 1024:500)
  const applyRatioPreset = (ratioW: number, ratioH: number) => {
    const baseW = options.width || 1024;
    const newH = Math.round((baseW * ratioH) / ratioW);
    setAspectRatioValue(ratioW / ratioH);
    setOptions((prev) => ({
      ...prev,
      height: newH,
      maintainAspectRatio: true,
    }));
  };

  // Apply Specific Preset from Library
  const applyPreset = (preset: ResizePreset) => {
    setOptions((prev) => ({
      ...prev,
      width: preset.width,
      height: preset.height,
      unit: 'px',
      format: preset.defaultFormat,
      maintainAspectRatio: false,
    }));
    setActiveTab('custom');
  };

  // 1-Click Download Current Rendered Image
  const handleDownloadSingle = async (customFormat?: 'png' | 'jpeg' | 'webp' | 'ico') => {
    if (!sourceImageSrc) return;
    try {
      const targetFormat = customFormat || options.format;
      const optsToUse = { ...options, format: targetFormat };
      const { blob, width, height } = await renderResizedImageToBlob(sourceImageSrc, optsToUse);

      const ext = targetFormat === 'jpeg' ? 'jpg' : targetFormat;
      const fileName = `resized_${width}x${height}_${Date.now()}.${ext}`;

      downloadBlob(blob, fileName);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (err) {
      console.error('Failed to download image:', err);
    }
  };

  // 1-Click Batch Download All Selected Sizes as ZIP
  const handleDownloadBatchZip = async () => {
    if (!sourceImageSrc || selectedPresetIds.length === 0) return;
    try {
      setIsExportingBatch(true);
      const presetsToExport = RESIZE_PRESETS.filter((p) => selectedPresetIds.includes(p.id));

      const zipBlob = await generateMultiSizeZip(
        sourceImageSrc,
        presetsToExport,
        options,
        'converted_all_sizes_pack'
      );

      downloadBlob(zipBlob, `all_sizes_pack_${presetsToExport.length}_files.zip`);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Failed to export batch zip:', err);
    } finally {
      setIsExportingBatch(false);
    }
  };

  // Copy Image to Clipboard
  const handleCopyToClipboard = async () => {
    if (!previewDataUrl) return;
    try {
      const res = await fetch(previewDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  // Toggle Preset Selection for Batch
  const togglePresetSelect = (id: string) => {
    setSelectedPresetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filtered Presets List
  const filteredPresets = useMemo(() => {
    return RESIZE_PRESETS.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        p.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${p.width}x${p.height}`.includes(searchQuery) ||
        p.descriptionAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.descriptionEn.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-7xl max-h-[95vh] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Crop className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  {isAr
                    ? 'تحويل وتغيير مقاسات الصور لجميع المقاسات والأحجام'
                    : 'Universal Image Resizer & Multi-Size Converter'}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-800 border border-indigo-200">
                  <Sparkles className="h-3 w-3" />
                  {isAr ? 'أي مقاس وأي أبعاد' : 'Any Dimension & Tamaño'}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">
                {isAr
                  ? 'غيّر حجم أي صورة بدقة فائقة إلى أي مقاس مخصص، أو اختر من مكتبة المقاسات الرسمية لـ Google Play، App Store، الويب، والسوشيال ميديا.'
                  : 'Resize any image to custom WxH dimensions or export standard sizes for Google Play, App Store, Favicons & Social Media.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-colors"
            >
              <Upload className="h-3.5 w-3.5 text-indigo-600" />
              <span>{isAr ? 'رفع صورة جديدة' : 'Upload Image'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-1 sm:gap-2 -mb-px">
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 text-xs font-bold transition-all ${
                activeTab === 'custom'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sliders className="h-4 w-4" />
              <span>{isAr ? 'مقاس مخصص وتحكم كامل' : 'Custom Dimensions (WxH)'}</span>
            </button>

            <button
              onClick={() => setActiveTab('presets')}
              className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 text-xs font-bold transition-all ${
                activeTab === 'presets'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>{isAr ? 'مكتبة المقاسات الجاهزة' : 'Standard Presets Library'}</span>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600 font-bold">
                {RESIZE_PRESETS.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('batch')}
              className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 text-xs font-bold transition-all ${
                activeTab === 'batch'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FolderDown className="h-4 w-4" />
              <span>{isAr ? 'حزمة التصدير الدفعي (.ZIP)' : 'Batch Export Suite (.ZIP)'}</span>
              <span className="rounded-full bg-indigo-100 text-indigo-800 px-1.5 py-0.2 text-[10px] font-bold">
                {selectedPresetIds.length}
              </span>
            </button>
          </div>

          {/* Quick Source Pill */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            <span>{isAr ? 'المصدر الحالي:' : 'Source:'}</span>
            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
              {sourceDimensions.width} × {sourceDimensions.height} px
            </span>
          </div>
        </div>

        {/* Main Body: Stage Preview on Left, Settings on Right */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* LEFT: Live Canvas Stage */}
          <div className="flex-1 flex flex-col bg-slate-900 p-4 sm:p-6 items-center justify-center relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200">
            {/* Live Size & Resolution Badge */}
            <div className="w-full max-w-xl flex items-center justify-between gap-2 mb-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px] font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {renderedSizeInfo.width} × {renderedSizeInfo.height} px
                </span>
                <span className="text-slate-400 font-normal">
                  ({(renderedSizeInfo.width / (renderedSizeInfo.height || 1)).toFixed(3)}:1)
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-300 text-xs">
                <span className="font-mono text-[11px] text-slate-400">
                  {renderedSizeInfo.sizeBytes > 0
                    ? `~${Math.round(renderedSizeInfo.sizeBytes / 1024)} KB`
                    : ''}
                </span>
                <span className="uppercase font-bold text-indigo-300 bg-slate-800 px-2 py-0.5 rounded text-[10px] border border-slate-700">
                  {options.format}
                </span>
              </div>
            </div>

            {/* Checkerboard Preview Stage */}
            <div className="w-full max-w-xl flex-1 min-h-[220px] max-h-[380px] rounded-2xl border border-slate-700/80 relative flex items-center justify-center p-4 overflow-hidden bg-[#0c1220] shadow-2xl">
              {/* Subtle grid background */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle, #6366f1 1px, transparent 1px)`,
                  backgroundSize: '16px 16px',
                }}
              />

              {previewDataUrl ? (
                <div
                  className="relative flex items-center justify-center transition-all duration-150"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    aspectRatio: `${renderedSizeInfo.width} / ${renderedSizeInfo.height}`,
                  }}
                >
                  <img
                    src={previewDataUrl}
                    alt="Resized Preview"
                    className="max-h-[340px] max-w-full object-contain rounded-lg shadow-xl"
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center rounded-lg">
                      <RefreshCw className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                  <ImageIcon className="h-10 w-10 text-slate-600 animate-pulse" />
                  <span className="text-xs">{isAr ? 'جارِ معالجة الصورة...' : 'Processing image...'}</span>
                </div>
              )}
            </div>

            {/* Quick Actions Under Stage */}
            <div className="w-full max-w-xl flex flex-wrap items-center justify-between gap-2 mt-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors"
                >
                  {copiedNotification ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                      <span>{isAr ? 'نسخ للحافظة' : 'Copy'}</span>
                    </>
                  )}
                </button>

                {/* Reset to current studio logo button */}
                <button
                  onClick={loadStudioLogoAsSource}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors"
                  title={isAr ? 'استرجاع الشعار الحالي من مساحة العمل' : 'Reset to current studio canvas logo'}
                >
                  <RefreshCw className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{isAr ? 'شعار الاستوديو' : 'Studio Logo'}</span>
                </button>
              </div>

              {/* Download Current Output Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadSingle('png')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>PNG ({renderedSizeInfo.width}×{renderedSizeInfo.height})</span>
                </button>

                <button
                  onClick={() => handleDownloadSingle('jpeg')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-950/40 transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>JPG</span>
                </button>

                <button
                  onClick={() => handleDownloadSingle('webp')}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors"
                >
                  WEBP
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Interactive Settings Panels */}
          <div className="w-full lg:w-[460px] bg-slate-50/70 p-4 sm:p-6 overflow-y-auto custom-scrollbar flex flex-col shrink-0">
            {/* TAB 1: CUSTOM DIMENSIONS (W x H) */}
            {activeTab === 'custom' && (
              <div className="space-y-5">
                {/* 1. Dimension Inputs (Width & Height) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Maximize2 className="h-4 w-4 text-indigo-600" />
                      {isAr ? 'الأبعاد والمقاس المخصص' : 'Custom Dimensions'}
                    </label>

                    {/* Lock Aspect Ratio Toggle */}
                    <button
                      onClick={toggleAspectLock}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                        options.maintainAspectRatio
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {options.maintainAspectRatio ? (
                        <>
                          <Lock className="h-3 w-3 text-indigo-600" />
                          <span>{isAr ? 'النسبة مقفلة' : 'Ratio Locked'}</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="h-3 w-3 text-slate-400" />
                          <span>{isAr ? 'نسبة حرة' : 'Free Ratio'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Width Input */}
                    <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        {isAr ? 'العرض (Width)' : 'Width'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          max="16000"
                          value={options.width}
                          onChange={(e) => handleWidthChange(Number(e.target.value))}
                          className="w-full text-base font-mono font-bold text-slate-900 focus:outline-none"
                        />
                        <span className="text-xs font-bold text-slate-400">{options.unit}</span>
                      </div>
                    </div>

                    {/* Height Input */}
                    <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        {isAr ? 'الارتفاع (Height)' : 'Height'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          max="16000"
                          value={options.height}
                          onChange={(e) => handleHeightChange(Number(e.target.value))}
                          className="w-full text-base font-mono font-bold text-slate-900 focus:outline-none"
                        />
                        <span className="text-xs font-bold text-slate-400">{options.unit}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Aspect Ratio Presets Pills */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                    {isAr ? 'نسب الأبعاد القياسية (Aspect Ratio)' : 'Quick Aspect Ratios'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: '1:1 (مربع)', rw: 1, rh: 1 },
                      { label: '16:9 (عريض)', rw: 16, rh: 9 },
                      { label: '9:16 (ستوري)', rw: 9, rh: 16 },
                      { label: '1024:500 (Play)', rw: 1024, rh: 500 },
                      { label: '4:3', rw: 4, rh: 3 },
                      { label: '4:5 (إنستغرام)', rw: 4, rh: 5 },
                      { label: '1.91:1 (مشاركة)', rw: 191, rh: 100 },
                    ].map((r, idx) => (
                      <button
                        key={idx}
                        onClick={() => applyRatioPreset(r.rw, r.rh)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 text-[11px] font-bold text-slate-700 transition-colors shadow-2xs"
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Fit & Scaling Mode */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2">
                    <Crop className="h-4 w-4 text-indigo-600" />
                    {isAr ? 'طريقة ملء وملاءمة الصورة (Fit Mode)' : 'Scaling & Fit Mode'}
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'contain', nameAr: 'احتواء', nameEn: 'Contain' },
                      { id: 'cover', nameAr: 'قص وملء', nameEn: 'Cover' },
                      { id: 'stretch', nameAr: 'تمديد', nameEn: 'Stretch' },
                      { id: 'pad', nameAr: 'حشو', nameEn: 'Padding' },
                    ].map((fit) => (
                      <button
                        key={fit.id}
                        onClick={() => setOptions((p) => ({ ...p, fitMode: fit.id as any }))}
                        className={`p-2 rounded-xl border text-xs font-bold text-center transition-all ${
                          options.fitMode === fit.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isAr ? fit.nameAr : fit.nameEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Background Style & Fill */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2">
                    <Palette className="h-4 w-4 text-indigo-600" />
                    {isAr ? 'خلفية الإطار عند الاحتواء' : 'Background Canvas Style'}
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    {[
                      { id: 'transparent', nameAr: 'شفاف', nameEn: 'Transparent' },
                      { id: 'solid', nameAr: 'لون مصمت', nameEn: 'Solid' },
                      { id: 'blur-fill', nameAr: 'ضبابي مموه', nameEn: 'Blur Fill' },
                      { id: 'gradient', nameAr: 'تدرج لوني', nameEn: 'Gradient' },
                    ].map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => setOptions((p) => ({ ...p, backgroundStyle: bg.id as any }))}
                        className={`p-2 rounded-xl border text-[11px] font-bold text-center transition-all ${
                          options.backgroundStyle === bg.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isAr ? bg.nameAr : bg.nameEn}
                      </button>
                    ))}
                  </div>

                  {/* Color pickers if solid or gradient */}
                  {(options.backgroundStyle === 'solid' || options.backgroundStyle === 'gradient') && (
                    <div className="flex items-center gap-2 mt-2 p-2.5 rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="color"
                          value={options.backgroundColor}
                          onChange={(e) => setOptions((p) => ({ ...p, backgroundColor: e.target.value }))}
                          className="h-7 w-7 rounded-lg border border-slate-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={options.backgroundColor}
                          onChange={(e) => setOptions((p) => ({ ...p, backgroundColor: e.target.value }))}
                          className="w-24 text-xs font-mono font-bold text-slate-800 focus:outline-none"
                        />
                      </div>

                      {options.backgroundStyle === 'gradient' && (
                        <div className="flex items-center gap-2 flex-1 border-l border-slate-200 pl-2">
                          <input
                            type="color"
                            value={options.backgroundColor2 || '#06b6d4'}
                            onChange={(e) => setOptions((p) => ({ ...p, backgroundColor2: e.target.value }))}
                            className="h-7 w-7 rounded-lg border border-slate-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={options.backgroundColor2 || '#06b6d4'}
                            onChange={(e) => setOptions((p) => ({ ...p, backgroundColor2: e.target.value }))}
                            className="w-24 text-xs font-mono font-bold text-slate-800 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Shape Mask & Corners */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                    {isAr ? 'قص وشكل الحواف (Shape Mask)' : 'Corner Mask & Shape'}
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'none', nameAr: 'مستطيل / مربع', nameEn: 'None' },
                      { id: 'rounded', nameAr: 'حواف مستديرة', nameEn: 'Rounded' },
                      { id: 'squircle', nameAr: 'سكويركل آبل', nameEn: 'Squircle' },
                      { id: 'circle', nameAr: 'دائري', nameEn: 'Circle' },
                    ].map((shape) => (
                      <button
                        key={shape.id}
                        onClick={() => setOptions((p) => ({ ...p, cropShape: shape.id as any }))}
                        className={`p-2 rounded-xl border text-[11px] font-bold text-center transition-all ${
                          options.cropShape === shape.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isAr ? shape.nameAr : shape.nameEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Transform Controls (Rotate & Flip) */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      {isAr ? 'التدوير والانعكاس' : 'Transform & Orientation'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          setOptions((p) => ({ ...p, rotation: ((p.rotation + 90) % 360) as any }))
                        }
                        className="flex items-center gap-1 p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700"
                        title={isAr ? 'تدوير 90 درجة' : 'Rotate 90°'}
                      >
                        <RotateCw className="h-3.5 w-3.5 text-indigo-600" />
                        <span>{options.rotation}°</span>
                      </button>

                      <button
                        onClick={() =>
                          setOptions((p) => ({ ...p, flipHorizontal: !p.flipHorizontal }))
                        }
                        className={`p-2 rounded-lg border text-xs font-bold ${
                          options.flipHorizontal
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                        title={isAr ? 'انعكاس أفقي' : 'Flip Horizontal'}
                      >
                        <FlipHorizontal className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() =>
                          setOptions((p) => ({ ...p, flipVertical: !p.flipVertical }))
                        }
                        className={`p-2 rounded-lg border text-xs font-bold ${
                          options.flipVertical
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                        title={isAr ? 'انعكاس رأسي' : 'Flip Vertical'}
                      >
                        <FlipVertical className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 6. Format & Quality */}
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {isAr ? 'صيغة التصدير وجودة الضغط' : 'Output Format & Quality'}
                    </label>
                    <span className="text-xs font-mono font-bold text-indigo-600">
                      {Math.round(options.quality * 100)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {['png', 'jpeg', 'webp', 'ico'].map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setOptions((p) => ({ ...p, format: fmt as any }))}
                        className={`p-2 rounded-xl border text-xs font-bold uppercase text-center transition-all ${
                          options.format === fmt
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {fmt === 'jpeg' ? 'JPG' : fmt}
                      </button>
                    ))}
                  </div>

                  {options.format !== 'png' && options.format !== 'ico' && (
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={options.quality}
                      onChange={(e) => setOptions((p) => ({ ...p, quality: parseFloat(e.target.value) }))}
                      className="w-full accent-indigo-600 cursor-pointer mt-1"
                    />
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: STANDARD PRESETS LIBRARY */}
            {activeTab === 'presets' && (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isAr ? 'بحث في المقاسات والمنصات...' : 'Search sizes (512, 1024, Instagram, etc)...'}
                    className="w-full rounded-xl border border-slate-200 bg-white pr-9 pl-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs"
                  />
                </div>

                {/* Category Filter Pills */}
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'all', nameAr: 'الكل', nameEn: 'All' },
                    { id: 'google-play', nameAr: 'Google Play', nameEn: 'Google Play' },
                    { id: 'app-store', nameAr: 'App Store', nameEn: 'App Store' },
                    { id: 'web-favicon', nameAr: 'Web & Favicons', nameEn: 'Web & Favicons' },
                    { id: 'social-media', nameAr: 'Social Media', nameEn: 'Social Media' },
                    { id: 'print-paper', nameAr: 'Print 300 DPI', nameEn: 'Print 300 DPI' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isAr ? cat.nameAr : cat.nameEn}
                    </button>
                  ))}
                </div>

                {/* Presets Grid */}
                <div className="space-y-2 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
                  {filteredPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono text-[10px] font-black shrink-0">
                          {preset.aspectRatio}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {isAr ? preset.nameAr : preset.nameEn}
                            </h4>
                            {preset.badge && (
                              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded">
                                {preset.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-indigo-600 font-bold">
                            {preset.width} × {preset.height} px • {(preset.defaultFormat || 'png').toUpperCase()}
                          </p>
                          <p className="text-[10px] text-slate-400 line-clamp-1">
                            {isAr ? preset.descriptionAr : preset.descriptionEn}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => applyPreset(preset)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 text-xs font-bold transition-colors shrink-0"
                      >
                        {isAr ? 'تطبيق' : 'Apply'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: BATCH EXPORT SUITE (.ZIP) */}
            {activeTab === 'batch' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      <FolderDown className="h-4 w-4 text-indigo-600" />
                      {isAr ? 'تصدير حزمة المقاسات دفعة واحدة' : 'Multi-Size Batch Exporter'}
                    </h4>
                    <span className="text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                      {selectedPresetIds.length} / {RESIZE_PRESETS.length} {isAr ? 'محدد' : 'Selected'}
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-800">
                    {isAr
                      ? 'حدد المقاسات المطلوبة وسيقوم المحول بإنشاء ملف ZIP منظم بمجلدات لكل منصة بدقة فائقة.'
                      : 'Select sizes to generate a structured ZIP folder containing all platform assets.'}
                  </p>

                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => setSelectedPresetIds(RESIZE_PRESETS.map((p) => p.id))}
                      className="text-[11px] font-bold text-indigo-700 hover:underline"
                    >
                      {isAr ? 'تحديد الكل (Select All)' : 'Select All'}
                    </button>
                    <span className="text-indigo-300">•</span>
                    <button
                      onClick={() => setSelectedPresetIds([])}
                      className="text-[11px] font-bold text-slate-500 hover:underline"
                    >
                      {isAr ? 'إلغاء التحديد' : 'Deselect All'}
                    </button>
                  </div>
                </div>

                {/* Preset Selection Checklist */}
                <div className="space-y-1.5 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                  {RESIZE_PRESETS.map((preset) => {
                    const isSelected = selectedPresetIds.includes(preset.id);
                    return (
                      <div
                        key={preset.id}
                        onClick={() => togglePresetSelect(preset.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between gap-3 transition-all ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-md border shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold block truncate">
                              {isAr ? preset.nameAr : preset.nameEn}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {preset.width} × {preset.height} px ({(preset.defaultFormat || 'png').toUpperCase()})
                            </span>
                          </div>
                        </div>

                        {preset.badge && (
                          <span className="text-[9px] font-black bg-slate-200/80 text-slate-800 px-1.5 py-0.2 rounded shrink-0">
                            {preset.badge}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Big Download ZIP Button */}
                <button
                  id="btn-download-all-sizes-zip"
                  onClick={handleDownloadBatchZip}
                  disabled={selectedPresetIds.length === 0 || isExportingBatch}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs shadow-lg shadow-indigo-950/20 transition-all disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  <span>
                    {isExportingBatch
                      ? isAr
                        ? 'جارِ إنشاء وتجميع ملف ZIP...'
                        : 'Generating ZIP Archive...'
                      : isAr
                      ? `تحميل حزمة المقاسات المحددة (${selectedPresetIds.length} ملفات .ZIP)`
                      : `Download Selected Sizes (${selectedPresetIds.length} Assets .ZIP)`}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
