import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Crop,
  Sparkles,
  Scissors,
  Download,
  Check,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  Eye,
  Layers,
  Upload,
  Move,
  CheckCircle2,
  RefreshCw,
  Square,
  Smartphone,
  Monitor,
  FolderDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SupportedLanguage } from '../types';
import {
  CropRect,
  detectTrimBounds,
  cropImageToBlob,
  autoTrimImage,
  TrimResult,
} from '../utils/imageCropper';
import { downloadBlob } from '../utils/canvasRenderer';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Active Image Source
  const [imageSrc, setImageSrc] = useState<string | null>(initialImageSrc || null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  // Modes: 'auto-trim' | 'manual-crop'
  const [activeTab, setActiveTab] = useState<'auto-trim' | 'manual-crop'>('auto-trim');

  // Auto-Trim Settings
  const [trimTolerance, setTrimTolerance] = useState<number>(18);
  const [trimPadding, setTrimPadding] = useState<number>(0);
  const [trimMode, setTrimMode] = useState<'auto' | 'white' | 'transparent' | 'corner-color'>('white');
  const [detectedTrim, setDetectedTrim] = useState<TrimResult | null>(null);

  // Manual Crop Rect (in original image coordinates)
  const [cropRect, setCropRect] = useState<CropRect>({ x: 0, y: 0, width: 100, height: 100 });
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>('free');

  // Interactive Dragging State
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragAction, setDragAction] = useState<string | null>(null); // 'move' | 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r'
  const [dragStart, setDragStart] = useState<{ x: number; y: number; rect: CropRect }>({
    x: 0,
    y: 0,
    rect: { x: 0, y: 0, width: 0, height: 0 },
  });

  // Display Zoom & Fit
  const [zoomLevel, setZoomLevel] = useState<number>(1);
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
          x: Math.round(img.naturalWidth * 0.1),
          y: Math.round(img.naturalHeight * 0.1),
          width: Math.round(img.naturalWidth * 0.8),
          height: Math.round(img.naturalHeight * 0.8),
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

  // Update Live Cropped Preview
  useEffect(() => {
    if (!loadedImage || cropRect.width <= 0 || cropRect.height <= 0) return;

    let isMounted = true;
    cropImageToBlob(loadedImage, cropRect, 'png').then((res) => {
      if (isMounted) {
        setCroppedPreviewUrl(res.dataUrl);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [loadedImage, cropRect]);

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setImageSrc(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
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
      particleCount: 40,
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
      const { blob } = await cropImageToBlob(loadedImage, cropRect, exportFormat);
      const filename = `fyntica_cropped_${cropRect.width}x${cropRect.height}.${exportFormat === 'jpeg' ? 'jpg' : exportFormat}`;
      downloadBlob(blob, filename);

      confetti({
        particleCount: 50,
        spread: 70,
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
      // Calculate scale factor from visual display to image natural pixels
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
        // Resizing from handles
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

        // Lock aspect ratio if required
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

  return (
    <div
      id="image-crop-trim-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 text-white flex items-center justify-center shadow-sm">
              <Scissors className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                {isAr ? 'أداة قص الأطراف البيضاء وتحديد المستطيل (Auto-Trim & Crop)' : 'Smart Image Trimmer & Rectangle Cropper'}
                <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                  {isAr ? 'إزالة الحواف تلقائياً' : 'Auto-Border Remover'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'قص الأطراف البيضاء والشفافة المحيطة بالشعار تلقائياً أو تحديد مستطيل يدوي بدقة بكسل كاملة'
                  : 'Automatically trim unwanted white/transparent borders or interactively crop any rectangle with pixel precision'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-close-cropper"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-100/60 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('auto-trim');
                handleSnapToSubject();
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'auto-trim'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>{isAr ? '⚡ قص الأطراف البيضاء تلقائياً (Auto-Trim)' : '⚡ Auto-Trim White Borders'}</span>
            </button>

            <button
              onClick={() => setActiveTab('manual-crop')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'manual-crop'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Crop className="h-3.5 w-3.5 text-indigo-600" />
              <span>{isAr ? '✂️ قص يدوي بمستطيل تفاعلي (Manual Box)' : '✂️ Interactive Rectangle Crop'}</span>
            </button>
          </div>

          {/* Quick upload another image */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs"
            >
              <Upload className="h-3 w-3 text-slate-500" />
              <span>{isAr ? 'رفع صورة أخرى' : 'Upload Another Image'}</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-y-auto">
          {/* Left / Center: Interactive Canvas Visualizer (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5 font-bold text-slate-800">
                <Eye className="h-3.5 w-3.5 text-indigo-600" />
                {isAr ? 'معاينة منطقة القص التفاعلية' : 'Interactive Crop Area Preview'}
              </span>

              {loadedImage && (
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                  <span>
                    {isAr ? 'الأصل:' : 'Orig:'} {loadedImage.naturalWidth}×{loadedImage.naturalHeight}px
                  </span>
                  <span>
                    {isAr ? 'المقصوص:' : 'Crop:'} {cropRect.width}×{cropRect.height}px
                  </span>
                </div>
              )}
            </div>

            {/* Interactive Image Frame Container */}
            <div className="relative w-full aspect-square max-h-[440px] bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center p-4 border border-slate-300 shadow-inner select-none">
              {!imageSrc ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 text-center cursor-pointer p-8 rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-400 text-slate-400 transition-colors"
                >
                  <Upload className="h-10 w-10 text-indigo-400" />
                  <p className="text-sm font-bold text-white">
                    {isAr ? 'اضغط لرفع صورة لقص حوافها' : 'Click to upload an image to trim'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {isAr ? 'يدعم PNG, JPG, WebP' : 'Supports PNG, JPG, WebP'}
                  </p>
                </div>
              ) : loadedImage ? (
                <div
                  ref={containerRef}
                  className="relative w-full h-full flex items-center justify-center"
                  style={{
                    backgroundImage:
                      'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)',
                    backgroundSize: '16px 16px',
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
                        backgroundColor: 'rgba(0, 0, 0, 0.55)',
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
                    className="absolute border-2 border-teal-400 shadow-2xl cursor-move transition-all"
                    style={{
                      left: `${(cropRect.x / loadedImage.naturalWidth) * 100}%`,
                      top: `${(cropRect.y / loadedImage.naturalHeight) * 100}%`,
                      width: `${(cropRect.width / loadedImage.naturalWidth) * 100}%`,
                      height: `${(cropRect.height / loadedImage.naturalHeight) * 100}%`,
                      boxShadow: '0 0 0 1px rgba(255,255,255,0.8), 0 0 20px rgba(13, 148, 136, 0.4)',
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'move')}
                  >
                    {/* Grid Rule of Thirds Guide Lines */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
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

                    {/* Corner Drag Handles */}
                    {/* Top-Left */}
                    <div
                      className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-teal-600 rounded-sm cursor-nwse-resize shadow-md"
                      onMouseDown={(e) => handleMouseDown(e, 'tl')}
                    />
                    {/* Top-Right */}
                    <div
                      className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-teal-600 rounded-sm cursor-nesw-resize shadow-md"
                      onMouseDown={(e) => handleMouseDown(e, 'tr')}
                    />
                    {/* Bottom-Left */}
                    <div
                      className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-teal-600 rounded-sm cursor-nesw-resize shadow-md"
                      onMouseDown={(e) => handleMouseDown(e, 'bl')}
                    />
                    {/* Bottom-Right */}
                    <div
                      className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-teal-600 rounded-sm cursor-nwse-resize shadow-md"
                      onMouseDown={(e) => handleMouseDown(e, 'br')}
                    />

                    {/* Edge Handles */}
                    {/* Top */}
                    <div
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-teal-400 border border-white rounded-full cursor-ns-resize"
                      onMouseDown={(e) => handleMouseDown(e, 't')}
                    />
                    {/* Bottom */}
                    <div
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-teal-400 border border-white rounded-full cursor-ns-resize"
                      onMouseDown={(e) => handleMouseDown(e, 'b')}
                    />
                    {/* Left */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -left-1 h-6 w-2 bg-teal-400 border border-white rounded-full cursor-ew-resize"
                      onMouseDown={(e) => handleMouseDown(e, 'l')}
                    />
                    {/* Right */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -right-1 h-6 w-2 bg-teal-400 border border-white rounded-full cursor-ew-resize"
                      onMouseDown={(e) => handleMouseDown(e, 'r')}
                    />

                    {/* Center Move Indicator */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/40 text-white p-1 rounded-full pointer-events-none opacity-60">
                      <Move className="h-3.5 w-3.5" />
                    </div>

                    {/* Dimensions Pill */}
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-teal-900 text-teal-100 text-[9px] font-mono px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap">
                      {cropRect.width} × {cropRect.height} px
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Quick Canvas Toolbar below image */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSnapToSubject}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                >
                  <Sparkles className="h-3 w-3 text-teal-600" />
                  <span>{isAr ? 'تحديد الشعار تلقائياً' : 'Snap to Subject'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetFull}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="h-3 w-3 text-slate-500" />
                  <span>{isAr ? 'إعادة كامل الصورة' : 'Full Image'}</span>
                </button>
              </div>

              {/* Aspect Ratio Presets */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-500 font-bold ml-1">
                  {isAr ? 'النسبة:' : 'Ratio:'}
                </span>
                {(['free', '1:1', '16:9', '9:16', '4:3'] as AspectRatioPreset[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => applyAspectRatio(r)}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded border transition-all ${
                      aspectRatio === r
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {r === 'free' ? (isAr ? 'حر' : 'Free') : r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Controls, Auto-Trim Parameters & Actions (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Trim Intelligence Card */}
            {activeTab === 'auto-trim' ? (
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-teal-600" />
                    <span className="text-xs font-black text-teal-900">
                      {isAr ? 'إعدادات الكشف والقص التلقائي' : 'Auto-Trim Settings'}
                    </span>
                  </div>
                  {detectedTrim && (
                    <span className="text-[10px] font-bold bg-teal-200 text-teal-900 px-2 py-0.5 rounded-full">
                      {isAr
                        ? `حذف ${Math.round((detectedTrim.trimSavedPixels / (detectedTrim.originalWidth * detectedTrim.originalHeight)) * 100)}% حواف`
                        : `${Math.round((detectedTrim.trimSavedPixels / (detectedTrim.originalWidth * detectedTrim.originalHeight)) * 100)}% trimmed`}
                    </span>
                  )}
                </div>

                {/* Trim Mode selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-teal-950 block">
                    {isAr ? 'نوع الحواف المراد إزالتها:' : 'Border Type to Trim:'}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'white', nameAr: 'أطراف بيضاء', nameEn: 'White Borders' },
                      { id: 'transparent', nameAr: 'أطراف شفافة', nameEn: 'Transparent' },
                      { id: 'corner-color', nameAr: 'لون الزوايا', nameEn: 'Corner Color' },
                      { id: 'auto', nameAr: 'كشف ذكي', nameEn: 'Smart Auto' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setTrimMode(m.id as any)}
                        className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-all text-center ${
                          trimMode === m.id
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-white text-slate-700 border-teal-200 hover:bg-teal-100/50'
                        }`}
                      >
                        {isAr ? m.nameAr : m.nameEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sensitivity / Tolerance Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-teal-950 font-medium">
                    <span>{isAr ? 'حساسية اللون (Tolerance)' : 'Color Sensitivity'}</span>
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
                  <p className="text-[10px] text-teal-700">
                    {isAr
                      ? 'زيادة الحساسية تزيل التدرجات الرمادية الفاتحة والظلال البيضاء'
                      : 'Higher tolerance removes faint off-white anti-aliased edges'}
                  </p>
                </div>

                {/* Margin Padding */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-teal-950 font-medium">
                    <span>{isAr ? 'هامش أمان حول الشعار' : 'Safety Padding Margin'}</span>
                    <span className="font-mono font-bold">{trimPadding} px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={trimPadding}
                    onChange={(e) => setTrimPadding(Number(e.target.value))}
                    className="w-full accent-teal-600 bg-teal-200 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            ) : (
              /* Manual Rectangle Inputs Card */
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-xs font-black text-slate-900 block">
                  {isAr ? 'إحداثيات المستطيل الدقيقة (px)' : 'Precise Rectangle Coordinates'}
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">
                      {isAr ? 'العرض (W)' : 'Width'}
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
                      {isAr ? 'الارتفاع (H)' : 'Height'}
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
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">
                      {isAr ? 'الموقع X' : 'Position X'}
                    </label>
                    <input
                      type="number"
                      value={cropRect.x}
                      onChange={(e) => setCropRect({ ...cropRect, x: Number(e.target.value) })}
                      className="w-full text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg p-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">
                      {isAr ? 'الموقع Y' : 'Position Y'}
                    </label>
                    <input
                      type="number"
                      value={cropRect.y}
                      onChange={(e) => setCropRect({ ...cropRect, y: Number(e.target.value) })}
                      className="w-full text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg p-1.5"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Live Result Thumbnail */}
            {croppedPreviewUrl && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">
                  {isAr ? 'نتيجة القص المعزولة' : 'Cropped Result Output'}
                </span>
                <div className="w-full h-28 bg-slate-200 rounded-lg flex items-center justify-center p-2 overflow-hidden border border-slate-300">
                  <img
                    src={croppedPreviewUrl}
                    alt="Cropped thumbnail"
                    className="max-h-full max-w-full object-contain rounded shadow-xs"
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                  <span>{cropRect.width} × {cropRect.height} px</span>
                  <span className="text-emerald-600 font-bold">
                    {isAr ? 'جاهزة للتطبيق' : 'Ready to apply'}
                  </span>
                </div>
              </div>
            )}

            {/* Main Action Buttons */}
            <div className="space-y-2 mt-auto pt-2">
              {/* Apply to Logo Studio Canvas */}
              <button
                id="btn-apply-cropped-logo"
                type="button"
                onClick={handleApplyToCanvas}
                disabled={!croppedPreviewUrl || isProcessing}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>
                  {isAr
                    ? 'قص وتطبيق في الشعار الحالي (Apply to Logo)'
                    : 'Crop & Apply to Active Logo'}
                </span>
              </button>

              {/* Download Cropped standalone file */}
              <div className="flex items-center gap-2">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="bg-white border border-slate-300 text-xs font-bold rounded-xl px-2.5 py-2.5 text-slate-700"
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
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl shadow-2xs transition-colors disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5 text-slate-600" />
                  <span>{isAr ? 'تحميل الصورة المقصوصة' : 'Download Cropped Image'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
