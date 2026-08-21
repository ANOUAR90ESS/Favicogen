import React, { useRef, useState } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Sliders,
  RotateCw,
  Trash2,
  Maximize,
  Sparkles,
  Crop,
  Layers,
  Sun,
  Contrast,
  RefreshCw,
  Scissors,
  Check,
  Loader2,
} from 'lucide-react';
import { LogoConfig, SupportedLanguage } from '../types';
import { autoTrimImage } from '../utils/imageCropper';

interface ImageUploadEditorProps {
  config: LogoConfig;
  onChange: (patch: Partial<LogoConfig>) => void;
  language: SupportedLanguage;
  onOpenCropTrimModal?: (src?: string) => void;
}

export const ImageUploadEditor: React.FC<ImageUploadEditorProps> = ({
  config,
  onChange,
  language,
  onOpenCropTrimModal,
}) => {
  const isAr = language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAutoTrimming, setIsAutoTrimming] = useState(false);
  const [trimFeedback, setTrimFeedback] = useState<string | null>(null);

  const filters = config.uploadedImageFilters || {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hueRotate: 0,
    grayscale: 0,
    invert: 0,
    sepia: 0,
    blur: 0,
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onChange({
          iconType: 'image',
          uploadedImageSrc: dataUrl,
          uploadedImageScale: config.uploadedImageScale || 100,
          uploadedImageOpacity: config.uploadedImageOpacity ?? 1,
          uploadedImageOffsetX: config.uploadedImageOffsetX || 0,
          uploadedImageOffsetY: config.uploadedImageOffsetY || 0,
          uploadedImageRotation: config.uploadedImageRotation || 0,
          uploadedImageCropShape: config.uploadedImageCropShape || 'squircle',
          uploadedImageFilters: filters,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    onChange({
      iconType: 'library',
      uploadedImageSrc: undefined,
    });
  };

  // Perform quick automatic white/corner border trimming
  const handleQuickAutoTrim = async () => {
    if (!config.uploadedImageSrc) return;
    setIsAutoTrimming(true);
    setTrimFeedback(null);
    try {
      const result = await autoTrimImage(config.uploadedImageSrc, {
        mode: 'auto',
        tolerance: 18,
        padding: 0,
      });

      if (result.trimResult.foundSubject && result.trimResult.trimSavedPixels > 0) {
        onChange({
          uploadedImageSrc: result.dataUrl,
        });
        const savedPct = Math.round(
          (result.trimResult.trimSavedPixels /
            (result.trimResult.originalWidth * result.trimResult.originalHeight)) *
            100
        );
        setTrimFeedback(
          isAr
            ? `تم قص الأطراف البيضاء بنجاح (حذف ${savedPct}% هوامش فارغة)`
            : `White borders trimmed (${savedPct}% empty margins removed)`
        );
      } else {
        setTrimFeedback(
          isAr
            ? 'الصورة نظيفة بالفعل ولا تحتوي على هوامش بيضاء إضافية'
            : 'Image is already tight with no extra white borders'
        );
      }
    } catch (err) {
      console.error('Trim error', err);
    } finally {
      setIsAutoTrimming(false);
      setTimeout(() => setTrimFeedback(null), 4000);
    }
  };

  const updateFilters = (patch: Partial<typeof filters>) => {
    onChange({
      uploadedImageFilters: {
        ...filters,
        ...patch,
      },
    });
  };

  const resetFilters = () => {
    onChange({
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
      uploadedImageScale: 100,
      uploadedImageRotation: 0,
      uploadedImageOffsetX: 0,
      uploadedImageOffsetY: 0,
    });
  };

  return (
    <div className="space-y-4">
      {/* Upload Box / Existing Image Preview */}
      {!config.uploadedImageSrc ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/70 hover:bg-indigo-50/20 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageFile}
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                {isAr ? 'اضغط لرفع صورة أو اسحبها هنا' : 'Click to upload image or drag & drop'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isAr ? 'يدعم PNG, JPG, WebP, SVG بأعلى دقة' : 'Supports PNG, JPG, WebP, SVG'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Image Preview & Action */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center p-0.5 shadow-2xs">
                <img
                  src={config.uploadedImageSrc}
                  alt="Uploaded preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {isAr ? 'صورة الشعار النشطة' : 'Active Logo Image'}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  {isAr ? 'جاهزة للتحرير والتأثيرات' : 'Ready for editing & filters'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageFile}
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs"
              >
                {isAr ? 'تغيير' : 'Replace'}
              </button>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="p-1.5 text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 shadow-2xs"
                title={isAr ? 'حذف الصورة' : 'Remove Image'}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Smart Trim & Crop Action Box */}
          <div className="p-3 bg-gradient-to-r from-teal-50 to-indigo-50 border border-teal-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-teal-900 flex items-center gap-1.5">
                <Scissors className="h-3.5 w-3.5 text-teal-600" />
                {isAr ? 'قص وضبط حواف الصورة (Trim & Crop)' : 'Smart Border Trimmer & Crop'}
              </span>
              <span className="text-[9px] bg-teal-200 text-teal-900 font-bold px-1.5 py-0.5 rounded">
                {isAr ? 'إزالة الأطراف' : 'Auto-Trim'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Quick 1-click Auto Trim White Borders */}
              <button
                id="btn-quick-auto-trim"
                type="button"
                onClick={handleQuickAutoTrim}
                disabled={isAutoTrimming}
                className="flex items-center justify-center gap-1.5 py-2 px-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-95 disabled:opacity-50"
                title={isAr ? 'حذف الأطراف البيضاء والشفافة المحيطة بالشعار تلقائياً' : 'Automatically trim white and empty surrounding borders'}
              >
                {isAutoTrimming ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span className="truncate">{isAr ? 'قص الحواف البيضاء' : 'Auto-Trim White'}</span>
              </button>

              {/* Interactive Rectangle Crop Modal Trigger */}
              <button
                id="btn-open-manual-crop"
                type="button"
                onClick={() => onOpenCropTrimModal && onOpenCropTrimModal(config.uploadedImageSrc)}
                className="flex items-center justify-center gap-1.5 py-2 px-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold rounded-lg shadow-2xs transition-all active:scale-95"
                title={isAr ? 'فتح أداة القص اليدوي بمستطيل تفاعلي' : 'Open interactive rectangle cropping tool'}
              >
                <Crop className="h-3.5 w-3.5 text-indigo-600" />
                <span className="truncate">{isAr ? 'قص يدوي بمستطيل' : 'Manual Rectangle'}</span>
              </button>
            </div>

            {trimFeedback && (
              <p className="text-[10px] text-teal-800 font-medium bg-white/80 p-1.5 rounded border border-teal-200/80 animate-in fade-in">
                {trimFeedback}
              </p>
            )}
          </div>

          {/* Crop Shape Mask */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {isAr ? 'قناع قص الصورة (Shape Mask)' : 'Image Crop Shape'}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'squircle', nameAr: 'سكويركل', nameEn: 'Squircle' },
                { id: 'circle', nameAr: 'دائري', nameEn: 'Circle' },
                { id: 'hexagon', nameAr: 'سداسي', nameEn: 'Hexagon' },
                { id: 'none', nameAr: 'أصلي', nameEn: 'Original' },
              ].map((crop) => (
                <button
                  key={crop.id}
                  type="button"
                  onClick={() => onChange({ uploadedImageCropShape: crop.id as any })}
                  className={`py-1.5 text-xs rounded-lg border font-bold transition-all shadow-2xs ${
                    config.uploadedImageCropShape === crop.id
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {isAr ? crop.nameAr : crop.nameEn}
                </button>
              ))}
            </div>
          </div>

          {/* Scale & Opacity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>{isAr ? 'مقياس الحجم' : 'Scale'}</span>
                <span className="font-mono font-bold">{config.uploadedImageScale || 100}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="250"
                value={config.uploadedImageScale || 100}
                onChange={(e) => onChange({ uploadedImageScale: Number(e.target.value) })}
                className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>{isAr ? 'الشفافية' : 'Opacity'}</span>
                <span className="font-mono font-bold">
                  {Math.round((config.uploadedImageOpacity ?? 1) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={Math.round((config.uploadedImageOpacity ?? 1) * 100)}
                onChange={(e) => onChange({ uploadedImageOpacity: Number(e.target.value) / 100 })}
                className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
              />
            </div>
          </div>

          {/* Image Adjustments / Visual Filters */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isAr ? 'تأثيرات وفلاتر الصورة (Filters)' : 'Image Adjustments & Filters'}
              </span>
              <button
                type="button"
                onClick={resetFilters}
                className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="h-2.5 w-2.5" />
                <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
              </button>
            </div>

            {/* Brightness */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>{isAr ? 'السطوع (Brightness)' : 'Brightness'}</span>
                <span className="font-mono font-bold">{filters.brightness}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="200"
                value={filters.brightness}
                onChange={(e) => updateFilters({ brightness: Number(e.target.value) })}
                className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
              />
            </div>

            {/* Contrast */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>{isAr ? 'التباين (Contrast)' : 'Contrast'}</span>
                <span className="font-mono font-bold">{filters.contrast}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="200"
                value={filters.contrast}
                onChange={(e) => updateFilters({ contrast: Number(e.target.value) })}
                className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
              />
            </div>

            {/* Saturation */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>{isAr ? 'تشبع الألوان (Saturation)' : 'Saturation'}</span>
                <span className="font-mono font-bold">{filters.saturation}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.saturation}
                onChange={(e) => updateFilters({ saturation: Number(e.target.value) })}
                className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
              />
            </div>

            {/* Hue Rotate */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>{isAr ? 'تدوير تدرج اللون (Hue)' : 'Hue Rotate'}</span>
                <span className="font-mono font-bold">{filters.hueRotate}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={filters.hueRotate}
                onChange={(e) => updateFilters({ hueRotate: Number(e.target.value) })}
                className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
              />
            </div>

            {/* Blur Softness */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>{isAr ? 'ضبابية ناعمة (Blur)' : 'Blur'}</span>
                <span className="font-mono font-bold">{filters.blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={filters.blur}
                onChange={(e) => updateFilters({ blur: Number(e.target.value) })}
                className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
