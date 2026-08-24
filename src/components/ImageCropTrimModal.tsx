import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Crop,
  Sparkles,
  Scissors,
  Download,
  Check,
  RotateCcw,
  Eye,
  Upload,
  Move,
  Square,
  Circle,
  Shield,
  Layers,
  Sliders,
  Maximize2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SupportedLanguage } from '../types';
import {
  CropRect,
  detectTrimBounds,
  cropImageToBlob,
  TrimResult,
  CropMaskShape,
} from '../utils/imageCropper';
import { downloadBlob } from '../utils/canvasRenderer';
import { intakeImageFile, isIntakeFailure, ACCEPT_ATTRIBUTE } from '../utils/imageIntake';

interface ImageCropTrimModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  initialImageSrc?: string | null;
  onApplyCrop: (croppedDataUrl: string, meta: { width: number; height: number }) => void;
}

type AspectRatioPreset = 'free' | '1:1' | '16:9' | '9:16' | '4:3' | '3:2';

export const ImageCropTrimModal: React.FC<ImageCropTrimModalProps> = ({
  isOpen,
  onClose,
  language,
  initialImageSrc,
  onApplyCrop,
}) => {
  const isAr = language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active Image Source
  const [imageSrc, setImageSrc] = useState<string | null>(initialImageSrc || null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  // Modes: 'auto-trim' | 'manual-crop' | 'corner-round'
  const [activeTab, setActiveTab] = useState<'auto-trim' | 'manual-crop' | 'corner-round'>('auto-trim');

  // Auto-Trim Settings
  const [trimTolerance, setTrimTolerance] = useState<number>(18);
  const [trimPadding, setTrimPadding] = useState<number>(0);
  const [trimMode, setTrimMode] = useState<'auto' | 'white' | 'transparent' | 'corner-color'>('white');
  const [detectedTrim, setDetectedTrim] = useState<TrimResult | null>(null);

  // Corner Rounding & Mask Settings (for trimming 90° sharp corners into rounded/squircle/circle)
  const [cornerShape, setCornerShape] = useState<CropMaskShape>('rounded');
  const [cornerRadius, setCornerRadius] = useState<number>(36); // px or relative radius

  // Manual Crop Rect (in original image coordinates)
  const [cropRect, setCropRect] = useState<CropRect>({ x: 0, y: 0, width: 100, height: 100 });
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>('free');

  // Interactive Dragging State
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragAction, setDragAction] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; rect: CropRect }>({
    x: 0,
    y: 0,
    rect: { x: 0, y: 0, width: 0, height: 0 },
  });

  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'webp'>('png');

  // Keep imageSrc updated when initialImageSrc changes
  useEffect(() => {
    if (initialImageSrc) {
      setImageSrc(initialImageSrc);
    }
  }, [initialImageSrc]);

  // Load Image element whenever imageSrc updates
  useEffect(() => {
    if (!imageSrc) {
      setLoadedImage(null);
      setDetectedTrim(null);
      setCroppedPreviewUrl(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setLoadedImage(img);

      // Perform initial detection
      const trim = detectTrimBounds(img, {
        mode: trimMode,
        tolerance: trimTolerance,
        padding: trimPadding,
      });
      setDetectedTrim(trim);

      // Default crop box to detected bounds or full image
      if (trim.foundSubject) {
        setCropRect({
          x: trim.x,
          y: trim.y,
          width: trim.width,
          height: trim.height,
        });
      } else {
        setCropRect({
          x: Math.round(img.naturalWidth * 0.05),
          y: Math.round(img.naturalHeight * 0.05),
          width: Math.round(img.naturalWidth * 0.9),
          height: Math.round(img.naturalHeight * 0.9),
        });
      }
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Re-run trim detection when auto-trim settings change
  useEffect(() => {
    if (!loadedImage) return;

    const trim = detectTrimBounds(loadedImage, {
      mode: trimMode,
      tolerance: trimTolerance,
      padding: trimPadding,
    });
    setDetectedTrim(trim);

    if (activeTab === 'auto-trim' && trim.foundSubject) {
      setCropRect({
        x: trim.x,
        y: trim.y,
        width: trim.width,
        height: trim.height,
      });
    }
  }, [trimTolerance, trimPadding, trimMode, loadedImage, activeTab]);

  // Update Live Cropped Preview with corner rounding & mask support
  useEffect(() => {
    if (!loadedImage || cropRect.width <= 0 || cropRect.height <= 0) return;

    let isMounted = true;
    cropImageToBlob(loadedImage, cropRect, {
      format: 'png',
      shape: activeTab === 'corner-round' || cornerRadius > 0 ? cornerShape : 'rect',
      cornerRadius: activeTab === 'corner-round' ? cornerRadius : 0,
    }).then((res) => {
      if (isMounted) {
        setCroppedPreviewUrl(res.dataUrl);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [loadedImage, cropRect, activeTab, cornerShape, cornerRadius]);

  // Handle local file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const intake = await intakeImageFile(file);
    if (isIntakeFailure(intake)) {
      setUploadError(
        intake.reason === 'too-large'
          ? isAr
            ? 'حجم الصورة يتجاوز 25 ميجابايت. اختر ملفاً أصغر.'
            : 'That image is larger than 25 MB. Pick a smaller file.'
          : isAr
            ? 'تعذّرت قراءة هذا الملف كصورة.'
            : 'That file could not be read as an image.'
      );
      return;
    }

    setUploadError(null);
    setImageSrc(intake.dataUrl);
  };

  // Preset Ratio Enforcer
  const applyAspectRatio = (ratioType: AspectRatioPreset) => {
    setAspectRatio(ratioType);
    if (!loadedImage) return;

    let targetRatio = 1;
    if (ratioType === '1:1') targetRatio = 1;
    else if (ratioType === '16:9') targetRatio = 16 / 9;
    else if (ratioType === '9:16') targetRatio = 9 / 16;
    else if (ratioType === '4:3') targetRatio = 4 / 3;
    else if (ratioType === '3:2') targetRatio = 3 / 2;
    else return; // 'free'

    const currentW = cropRect.width;
    let newH = Math.round(currentW / targetRatio);
    let newW = currentW;

    if (newH > loadedImage.naturalHeight) {
      newH = loadedImage.naturalHeight;
      newW = Math.round(newH * targetRatio);
    }

    const newX = Math.max(0, Math.min(cropRect.x, loadedImage.naturalWidth - newW));
    const newY = Math.max(0, Math.min(cropRect.y, loadedImage.naturalHeight - newH));

    setCropRect({
      x: newX,
      y: newY,
      width: newW,
      height: newH,
    });
  };

  // Reset to Full Image
  const handleResetFull = () => {
    if (!loadedImage) return;
    setCropRect({
      x: 0,
      y: 0,
      width: loadedImage.naturalWidth,
      height: loadedImage.naturalHeight,
    });
    setAspectRatio('free');
  };

  // Snap to Auto-Detected Trim Subject
  const handleSnapToSubject = () => {
    if (!detectedTrim || !detectedTrim.foundSubject) return;
    setCropRect({
      x: detectedTrim.x,
      y: detectedTrim.y,
      width: detectedTrim.width,
      height: detectedTrim.height,
    });
  };

  // Apply to Main Active Project
  const handleApplyToCanvas = () => {
    if (!croppedPreviewUrl || !loadedImage) return;
    setIsProcessing(true);

    onApplyCrop(croppedPreviewUrl, {
      width: cropRect.width,
      height: cropRect.height,
    });

    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.6 },
    });

    setIsProcessing(false);
    onClose();
  };

  // Download Cropped Image
  const handleDownload = async () => {
    if (!loadedImage) return;
    setIsProcessing(true);
    try {
      const { blob } = await cropImageToBlob(loadedImage, cropRect, {
        format: exportFormat,
        shape: activeTab === 'corner-round' || cornerRadius > 0 ? cornerShape : 'rect',
        cornerRadius: activeTab === 'corner-round' ? cornerRadius : 0,
      });
      const filename = `fyntica_crop_${cropRect.width}x${cropRect.height}.${exportFormat === 'jpeg' ? 'jpg' : exportFormat}`;
      downloadBlob(blob, filename);

      confetti({
        particleCount: 40,
        spread: 65,
        origin: { y: 0.7 },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Interactive Mouse Dragging calculations on Preview Canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, action: string) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    setDragAction(action);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      rect: { ...cropRect },
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragAction || !loadedImage || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const scaleX = loadedImage.naturalWidth / rect.width;
      const scaleY = loadedImage.naturalHeight / rect.height;

      const deltaX = (e.clientX - dragStart.x) * scaleX;
      const deltaY = (e.clientY - dragStart.y) * scaleY;

      const orig = dragStart.rect;
      let nextRect = { ...orig };

      const imgW = loadedImage.naturalWidth;
      const imgH = loadedImage.naturalHeight;

      if (dragAction === 'move') {
        nextRect.x = Math.max(0, Math.min(imgW - orig.width, orig.x + deltaX));
        nextRect.y = Math.max(0, Math.min(imgH - orig.height, orig.y + deltaY));
      } else {
        let newX = orig.x;
        let newY = orig.y;
        let newW = orig.width;
        let newH = orig.height;

        if (dragAction.includes('l')) {
          const maxLeft = orig.x + orig.width - 20;
          newX = Math.max(0, Math.min(maxLeft, orig.x + deltaX));
          newW = orig.width - (newX - orig.x);
        }
        if (dragAction.includes('r')) {
          newW = Math.max(20, Math.min(imgW - orig.x, orig.width + deltaX));
        }
        if (dragAction.includes('t')) {
          const maxTop = orig.y + orig.height - 20;
          newY = Math.max(0, Math.min(maxTop, orig.y + deltaY));
          newH = orig.height - (newY - orig.y);
        }
        if (dragAction.includes('b')) {
          newH = Math.max(20, Math.min(imgH - orig.y, orig.height + deltaY));
        }

        if (aspectRatio !== 'free') {
          let ratio = 1;
          if (aspectRatio === '1:1') ratio = 1;
          else if (aspectRatio === '16:9') ratio = 16 / 9;
          else if (aspectRatio === '9:16') ratio = 9 / 16;
          else if (aspectRatio === '4:3') ratio = 4 / 3;
          else if (aspectRatio === '3:2') ratio = 3 / 2;

          if (dragAction.includes('r') || dragAction.includes('l')) {
            newH = Math.min(imgH - newY, Math.round(newW / ratio));
          } else {
            newW = Math.min(imgW - newX, Math.round(newH * ratio));
          }
        }

        nextRect = {
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
        };
      }

      setCropRect(nextRect);
    },
    [isDragging, dragAction, loadedImage, dragStart, aspectRatio]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragAction(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isOpen) return null;

  // Calculate dynamic border radius style for preview box
  const getVisualBorderRadius = () => {
    if (activeTab === 'corner-round') {
      if (cornerShape === 'circle') return '50%';
      if (cornerShape === 'squircle') return '22%';
      if (cornerShape === 'rounded') {
        const previewScale = containerRef.current && loadedImage
          ? containerRef.current.clientWidth / loadedImage.naturalWidth
          : 0.5;
        return `${Math.min(cornerRadius * previewScale, 80)}px`;
      }
    }
    return '4px';
  };

  return (
    <div
      id="image-crop-trim-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Scissors className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                {isAr ? 'أداة قص وتدوير الزوايا وإزالة الحواف' : 'Image Cropper & 90° Corner Rounder'}
                <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
                  {isAr ? 'قص الزوايا الحادة 90°' : '90° Sharp Edge Trimmer'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                {isAr
                  ? 'قص الحواف البيضاء والشفافة أو تدوير الأطراف الأربعة الحادة 90 درجة إلى شكل دائري/سكويركل'
                  : 'Trim white margins or round the 4 sharp 90-degree corners into smooth circular or squircle curves'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector & Upload Bar */}
        <div className="flex items-center justify-between px-5 py-2 bg-slate-100/70 border-b border-slate-200 shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {/* Tab 1: Auto-Trim */}
            <button
              onClick={() => {
                setActiveTab('auto-trim');
                handleSnapToSubject();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'auto-trim'
                  ? 'bg-white text-teal-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>{isAr ? '⚡ إزالة الحواف البيضاء' : '⚡ Auto-Trim Margins'}</span>
            </button>

            {/* Tab 2: 90° Corner Rounding (User's specific request) */}
            <button
              onClick={() => {
                setActiveTab('corner-round');
                applyAspectRatio('1:1');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'corner-round'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Circle className="h-3.5 w-3.5 text-indigo-600" />
              <span>{isAr ? '⭕ قص وتدوير الزوايا الأربع (90°)' : '⭕ 90° Corner Rounding'}</span>
            </button>

            {/* Tab 3: Interactive Crop */}
            <button
              onClick={() => setActiveTab('manual-crop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'manual-crop'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Crop className="h-3.5 w-3.5 text-slate-600" />
              <span>{isAr ? '✂️ قص مستطيل حر' : '✂️ Rectangle Box'}</span>
            </button>
          </div>

          {/* Quick upload input */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => void handleFileUpload(e)}
              accept={ACCEPT_ATTRIBUTE}
              className="hidden"
            />

            {uploadError && (
              <p role="alert" className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-2">
                {uploadError}
              </p>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            >
              <Upload className="h-3 w-3 text-slate-500" />
              <span>{isAr ? 'رفع صورة' : 'Upload Image'}</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 sm:p-5 overflow-y-auto">
          {/* Visual Canvas Viewport (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5 font-bold text-slate-800">
                <Eye className="h-3.5 w-3.5 text-teal-600" />
                {isAr ? 'معاينة التحديد والقص المباشر' : 'Live Interactive Crop Frame'}
              </span>

              {loadedImage && (
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                  <span>
                    {isAr ? 'الأصل:' : 'Orig:'} {loadedImage.naturalWidth}×{loadedImage.naturalHeight}px
                  </span>
                  <span>•</span>
                  <span className="text-teal-700 font-bold">
                    {isAr ? 'القص:' : 'Crop:'} {cropRect.width}×{cropRect.height}px
                  </span>
                </div>
              )}
            </div>

            {/* Interactive Image Frame */}
            <div className="relative w-full aspect-square max-h-[380px] bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center p-3 border border-slate-300 shadow-inner select-none">
              {!imageSrc ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer p-6 rounded-xl border-2 border-dashed border-slate-700 hover:border-teal-400 text-slate-400 transition-colors"
                >
                  <Upload className="h-8 w-8 text-teal-400" />
                  <p className="text-xs font-bold text-white">
                    {isAr ? 'اضغط لرفع صورة لقص أطرافها' : 'Click to upload an image'}
                  </p>
                </div>
              ) : loadedImage ? (
                <div
                  ref={containerRef}
                  className="relative w-full h-full flex items-center justify-center"
                  style={{
                    backgroundImage:
                      'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
                    backgroundSize: '14px 14px',
                  }}
                >
                  {/* Base Image */}
                  <img
                    src={imageSrc}
                    alt="Target crop source"
                    className="max-w-full max-h-full object-contain pointer-events-none"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />

                  {/* Shaded Backdrop Overlay outside crop rectangle */}
                  {containerRef.current && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        clipPath: `polygon(
                          0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
                          ${(cropRect.x / loadedImage.naturalWidth) * 100}% ${(cropRect.y / loadedImage.naturalHeight) * 100}%,
                          ${((cropRect.x + cropRect.width) / loadedImage.naturalWidth) * 100}% ${(cropRect.y / loadedImage.naturalHeight) * 100}%,
                          ${((cropRect.x + cropRect.width) / loadedImage.naturalWidth) * 100}% ${((cropRect.y + cropRect.height) / loadedImage.naturalHeight) * 100}%,
                          ${(cropRect.x / loadedImage.naturalWidth) * 100}% ${((cropRect.y + cropRect.height) / loadedImage.naturalHeight) * 100}%,
                          ${(cropRect.x / loadedImage.naturalWidth) * 100}% ${(cropRect.y / loadedImage.naturalHeight) * 100}%
                        )`,
                      }}
                    />
                  )}

                  {/* Interactive Crop Frame Box */}
                  <div
                    className="absolute border-2 border-teal-400 cursor-move transition-all"
                    style={{
                      left: `${(cropRect.x / loadedImage.naturalWidth) * 100}%`,
                      top: `${(cropRect.y / loadedImage.naturalHeight) * 100}%`,
                      width: `${(cropRect.width / loadedImage.naturalWidth) * 100}%`,
                      height: `${(cropRect.height / loadedImage.naturalHeight) * 100}%`,
                      borderRadius: getVisualBorderRadius(),
                      boxShadow:
                        '0 0 0 1px rgba(255,255,255,0.9), 0 0 16px rgba(13, 148, 136, 0.4)',
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'move')}
                  >
                    {/* Grid Lines */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
                      <div className="border-r border-b border-white/60"></div>
                      <div className="border-r border-b border-white/60"></div>
                      <div className="border-b border-white/60"></div>
                      <div className="border-r border-b border-white/60"></div>
                      <div className="border-r border-b border-white/60"></div>
                      <div className="border-b border-white/60"></div>
                      <div className="border-r border-white/60"></div>
                      <div className="border-r border-white/60"></div>
                      <div></div>
                    </div>

                    {/* Corner Handles */}
                    <div
                      className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-teal-600 rounded-xs cursor-nwse-resize shadow-xs"
                      onMouseDown={(e) => handleMouseDown(e, 'tl')}
                    />
                    <div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-teal-600 rounded-xs cursor-nesw-resize shadow-xs"
                      onMouseDown={(e) => handleMouseDown(e, 'tr')}
                    />
                    <div
                      className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-teal-600 rounded-xs cursor-nesw-resize shadow-xs"
                      onMouseDown={(e) => handleMouseDown(e, 'bl')}
                    />
                    <div
                      className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-teal-600 rounded-xs cursor-nwse-resize shadow-xs"
                      onMouseDown={(e) => handleMouseDown(e, 'br')}
                    />

                    {/* Dimensions Pill */}
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-teal-950/90 text-teal-100 text-[9px] font-mono px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap">
                      {cropRect.width} × {cropRect.height} px
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Quick Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSnapToSubject}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors cursor-pointer"
                >
                  <Sparkles className="h-3 w-3 text-teal-600" />
                  <span>{isAr ? 'تحديد تلقائي' : 'Snap Subject'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetFull}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3 text-slate-500" />
                  <span>{isAr ? 'كامل الصورة' : 'Full'}</span>
                </button>
              </div>

              {/* Aspect Ratio Buttons */}
              <div className="flex items-center gap-1">
                {(['free', '1:1', '16:9', '9:16', '4:3'] as AspectRatioPreset[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => applyAspectRatio(r)}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-md border transition-all cursor-pointer ${
                      aspectRatio === r
                        ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {r === 'free' ? (isAr ? 'حر' : 'Free') : r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Controls & Parameter Adjustments (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3.5">
            {/* 1. CORNER ROUNDING & 90° SHARP CORNER TRIMMING (User Primary Request) */}
            {activeTab === 'corner-round' && (
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-indigo-950 font-bold text-xs">
                    <Circle className="h-4 w-4 text-indigo-600" />
                    <span>{isAr ? 'قص وتدوير الزوايا الحادة 90°' : '90° Corner Rounding & Mask'}</span>
                  </div>
                  <span className="text-[10px] font-bold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full">
                    {cornerShape === 'circle'
                      ? isAr
                        ? 'دائري كامل'
                        : 'Full Circle'
                      : cornerShape === 'squircle'
                      ? isAr
                        ? 'أيقونة أندرويد'
                        : 'Squircle'
                      : `${cornerRadius}px`}
                  </span>
                </div>

                {/* Shape Mask Buttons */}
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'rounded', nameAr: 'انحناء الزوايا', nameEn: 'Rounded', icon: Square },
                    { id: 'squircle', nameAr: 'سكويركل أيقونة', nameEn: 'Squircle', icon: Shield },
                    { id: 'circle', nameAr: 'دائري كامل', nameEn: 'Circle', icon: Circle },
                  ].map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setCornerShape(s.id as any)}
                        className={`flex flex-col items-center justify-center p-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          cornerShape === s.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-indigo-200 hover:bg-indigo-100/50'
                        }`}
                      >
                        <Icon className="h-4 w-4 mb-1" />
                        <span className="text-[10px]">{isAr ? s.nameAr : s.nameEn}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Corner Radius Slider (when rounded) */}
                {cornerShape === 'rounded' && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs text-indigo-950 font-bold">
                      <span>{isAr ? 'نصف قطر تدوير الزوايا (Radius)' : 'Corner Radius'}</span>
                      <span className="font-mono">{cornerRadius} px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="128"
                      value={cornerRadius}
                      onChange={(e) => setCornerRadius(Number(e.target.value))}
                      className="w-full accent-indigo-600 bg-indigo-200 h-1.5 rounded-lg cursor-pointer"
                    />

                    {/* Quick presets */}
                    <div className="flex items-center gap-1 pt-1">
                      {[
                        { label: '0px (حادة 90°)', val: 0 },
                        { label: '16px', val: 16 },
                        { label: '36px', val: 36 },
                        { label: '64px', val: 64 },
                        { label: '90px', val: 90 },
                      ].map((p) => (
                        <button
                          key={p.val}
                          type="button"
                          onClick={() => setCornerRadius(p.val)}
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded border cursor-pointer ${
                            cornerRadius === p.val
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. AUTO-TRIM CARD */}
            {activeTab === 'auto-trim' && (
              <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-teal-950 font-bold text-xs">
                    <Sparkles className="h-4 w-4 text-teal-600" />
                    <span>{isAr ? 'إعدادات الكشف التلقائي للحواف' : 'Auto-Border Detection'}</span>
                  </div>
                  {detectedTrim && (
                    <span className="text-[10px] font-bold bg-teal-200 text-teal-900 px-2 py-0.5 rounded-full">
                      {isAr
                        ? `حذف ${Math.round((detectedTrim.trimSavedPixels / (detectedTrim.originalWidth * detectedTrim.originalHeight)) * 100)}%`
                        : `${Math.round((detectedTrim.trimSavedPixels / (detectedTrim.originalWidth * detectedTrim.originalHeight)) * 100)}% cut`}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'white', nameAr: 'أطراف بيضاء', nameEn: 'White' },
                    { id: 'transparent', nameAr: 'شفافة', nameEn: 'Transparent' },
                    { id: 'corner-color', nameAr: 'لون الزوايا', nameEn: 'Corners' },
                    { id: 'auto', nameAr: 'كشف ذكي', nameEn: 'Smart' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setTrimMode(m.id as any)}
                      className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                        trimMode === m.id
                          ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-teal-200 hover:bg-teal-100/50'
                      }`}
                    >
                      {isAr ? m.nameAr : m.nameEn}
                    </button>
                  ))}
                </div>

                {/* Sensitivity Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-teal-950 font-medium">
                    <span>{isAr ? 'حساسية اللون' : 'Sensitivity'}</span>
                    <span className="font-mono font-bold">{trimTolerance}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={trimTolerance}
                    onChange={(e) => setTrimTolerance(Number(e.target.value))}
                    className="w-full accent-teal-600 bg-teal-200 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* 3. MANUAL CROP DIMENSIONS */}
            {activeTab === 'manual-crop' && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-900 block">
                  {isAr ? 'أبعاد المستطيل الدقيقة (px)' : 'Precise Rectangle (px)'}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">
                      {isAr ? 'العرض W' : 'Width'}
                    </label>
                    <input
                      type="number"
                      value={cropRect.width}
                      onChange={(e) =>
                        setCropRect({ ...cropRect, width: Math.max(10, Number(e.target.value)) })
                      }
                      className="w-full text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg p-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">
                      {isAr ? 'الارتفاع H' : 'Height'}
                    </label>
                    <input
                      type="number"
                      value={cropRect.height}
                      onChange={(e) =>
                        setCropRect({ ...cropRect, height: Math.max(10, Number(e.target.value)) })
                      }
                      className="w-full text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg p-1.5"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Live Result Thumbnail Preview */}
            {croppedPreviewUrl && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                  <span>{isAr ? 'نتيجة القص المعزولة' : 'Isolated Output'}</span>
                  <span className="text-teal-700 font-mono text-[10px]">
                    {cropRect.width} × {cropRect.height} px
                  </span>
                </div>
                <div
                  className="w-full h-24 rounded-lg flex items-center justify-center p-2 overflow-hidden border border-slate-300"
                  style={{
                    backgroundImage:
                      'radial-gradient(rgba(0,0,0,0.08) 1px, transparent 1px)',
                    backgroundSize: '8px 8px',
                    backgroundColor: '#f1f5f9',
                  }}
                >
                  <img
                    src={croppedPreviewUrl}
                    alt="Cropped thumbnail"
                    className="max-h-full max-w-full object-contain drop-shadow-xs"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons - Refined & Well-Organized */}
            <div className="space-y-2 mt-auto pt-1">
              {/* Primary Action Button */}
              <button
                id="btn-apply-cropped-logo"
                type="button"
                onClick={handleApplyToCanvas}
                disabled={!croppedPreviewUrl || isProcessing}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>
                  {isAr ? 'تطبيق في الشعار الحالي' : 'Apply Cropped to Logo'}
                </span>
              </button>

              {/* Secondary Download Button with Format Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="bg-white border border-slate-300 text-xs font-bold rounded-xl px-2.5 py-2 text-slate-700 shadow-2xs outline-none"
                >
                  <option value="png">PNG</option>
                  <option value="jpeg">JPG</option>
                  <option value="webp">WebP</option>
                </select>

                <button
                  id="btn-download-cropped-standalone"
                  type="button"
                  onClick={handleDownload}
                  disabled={!croppedPreviewUrl || isProcessing}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5 text-slate-600" />
                  <span>{isAr ? 'تحميل الصورة' : 'Download File'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
