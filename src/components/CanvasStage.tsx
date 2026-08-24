import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Crosshair,
  Check,
  Download,
  Image as ImageIcon,
  Code2,
  Sparkles,
} from 'lucide-react';
import { LogoConfig, SupportedLanguage } from '../types';
import { generateSvgString, renderSvgToBlob, downloadBlob } from '../utils/canvasRenderer';

interface CanvasStageProps {
  config: LogoConfig;
  language?: SupportedLanguage;
  onUpdateConfig?: (patch: Partial<LogoConfig>) => void;
  onOpenFaviconExport: () => void;
  onOpenMockups: () => void;
  onOpenSocialMediaKit?: () => void;
  onOpenCropTrimModal?: () => void;
  onOpenFeatureGraphic?: () => void;
  onOpenUniversalResizer?: () => void;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  config,
  onUpdateConfig,
  onOpenFaviconExport,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [zoom, setZoom] = useState<number>(100);
  const [stageBg, setStageBg] = useState<'checker' | 'slate' | 'white' | 'dark'>('slate');
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [showCenterGuide, setShowCenterGuide] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isDownloadingQuick, setIsDownloadingQuick] = useState<boolean>(false);

  // Generate SVG representation
  const svgString = useMemo(() => {
    return generateSvgString(config, 512);
  }, [config]);

  const handleCopySvg = async () => {
    try {
      await navigator.clipboard.writeText(svgString);
      setCopiedType('svg');
      setTimeout(() => setCopiedType(null), 2000);
    } catch (e) {
      console.error('Failed to copy SVG:', e);
    }
  };

  const handleQuickDownloadPng = async (size = 512) => {
    try {
      setIsDownloadingQuick(true);
      const blob = await renderSvgToBlob(svgString, size, 'png');
      downloadBlob(blob, `${(config.text || config.name || 'logo').replace(/\s+/g, '_')}_${size}x${size}.png`);
    } catch (e) {
      console.error('Quick PNG download failed:', e);
    } finally {
      setIsDownloadingQuick(false);
    }
  };

  const handleQuickDownloadSvg = () => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, `${(config.text || config.name || 'logo').replace(/\s+/g, '_')}.svg`);
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-100 relative select-none">
      {/* Top Stage Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-slate-200 bg-white shrink-0">
        {/* Stage Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
          <button
            id="btn-zoom-out"
            onClick={() => setZoom((prev) => Math.max(prev - 25, 25))}
            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors cursor-pointer"
            title={t('canvasStage.zoomOut')}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs font-mono font-semibold text-slate-700 px-1.5 min-w-[44px] text-center">
            {zoom}%
          </span>
          <button
            id="btn-zoom-in"
            onClick={() => setZoom((prev) => Math.min(prev + 25, 300))}
            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors cursor-pointer"
            title={t('canvasStage.zoomIn')}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <div className="h-3 w-px bg-slate-300 mx-0.5" />
          <button
            id="btn-zoom-reset"
            onClick={() => setZoom(100)}
            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors text-[11px] px-1.5 cursor-pointer"
            title={t('canvasStage.zoomReset')}
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Guides & Background Viewers */}
        <div className="flex items-center flex-wrap gap-2">
          {/* 'Transparent Background' Toggle Switch */}
          <div
            id="wrapper-transparent-background-toggle"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition-colors"
          >
            <button
              id="toggle-transparent-background"
              role="switch"
              type="button"
              aria-checked={config.bgType === 'transparent'}
              onClick={() => {
                const newBgType = config.bgType === 'transparent' ? 'solid' : 'transparent';
                if (onUpdateConfig) {
                  onUpdateConfig({
                    bgType: newBgType,
                    bgColor1: config.bgColor1 || '#0f172a',
                  });
                }
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 ${
                config.bgType === 'transparent' ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
              title={t('canvasStage.transparentBg')}
            >
              <span
                className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${
                  config.bgType === 'transparent'
                    ? isAr
                      ? '-translate-x-4'
                      : 'translate-x-4.5'
                    : isAr
                    ? '-translate-x-0.5'
                    : 'translate-x-0.5'
                }`}
              />
            </button>

            <span
              onClick={() => {
                const newBgType = config.bgType === 'transparent' ? 'solid' : 'transparent';
                if (onUpdateConfig) {
                  onUpdateConfig({
                    bgType: newBgType,
                    bgColor1: config.bgColor1 || '#0f172a',
                  });
                }
              }}
              className="text-xs font-bold text-slate-700 cursor-pointer select-none flex items-center gap-1.5"
            >
              {/* Pattern thumbnail indicator */}
              <span
                className={`inline-block w-3.5 h-3.5 rounded-xs border shrink-0 transition-all ${
                  config.bgType === 'transparent'
                    ? 'border-emerald-600 bg-[linear-gradient(45deg,#10b981_25%,transparent_25%),linear-gradient(-45deg,#10b981_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#10b981_75%),linear-gradient(-45deg,transparent_75%,#10b981_75%)] [background-size:6px_6px] [background-position:0_0,0_3px,3px_-3px,-3px_0]'
                    : 'border-slate-400 bg-slate-800'
                }`}
              />
              <span>{t('canvasStage.transparentBg')}</span>
            </span>
          </div>

          {/* Stage Backdrop Selector */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => setStageBg('checker')}
              className={`px-2 py-1 text-[11px] rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                stageBg === 'checker'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title={t('canvasStage.checkerBg')}
            >
              <span>{t('canvasStage.checkerBg')}</span>
            </button>
            <button
              onClick={() => setStageBg('slate')}
              className={`px-2 py-1 text-[11px] rounded-md font-semibold transition-all cursor-pointer ${
                stageBg === 'slate'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title={t('canvasStage.slateBg')}
            >
              {t('canvasStage.slateBg')}
            </button>
            <button
              onClick={() => setStageBg('white')}
              className={`px-2 py-1 text-[11px] rounded-md font-semibold transition-all cursor-pointer ${
                stageBg === 'white'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title={t('canvasStage.whiteBg')}
            >
              {t('canvasStage.whiteBg')}
            </button>
            <button
              onClick={() => setStageBg('dark')}
              className={`px-2 py-1 text-[11px] rounded-md font-semibold transition-all cursor-pointer ${
                stageBg === 'dark'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title={t('canvasStage.darkBg')}
            >
              {t('canvasStage.darkBg')}
            </button>
          </div>

          {/* Grid & Crosshair Toggles */}
          <button
            onClick={() => setShowGrid((p) => !p)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
              showGrid
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            title={t('canvasStage.gridGuide')}
          >
            <Grid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('canvasStage.gridGuide')}</span>
          </button>

          <button
            onClick={() => setShowCenterGuide((p) => !p)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
              showCenterGuide
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            title={t('canvasStage.centerGuide')}
          >
            <Crosshair className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('canvasStage.centerGuide')}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Display Area */}
      <div
        className={`flex-1 flex flex-col items-center justify-center p-6 sm:p-10 overflow-auto min-h-[380px] relative ${
          stageBg === 'dark'
            ? 'bg-slate-900'
            : stageBg === 'white'
            ? 'bg-white'
            : stageBg === 'checker'
            ? 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50'
            : 'bg-slate-100 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px]'
        }`}
      >
        {/* Dynamic Scale Wrapper */}
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
          }}
          className={`relative flex items-center justify-center shadow-xl rounded-2xl border p-2 ${
            config.bgType === 'transparent'
              ? 'bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] [background-size:16px_16px] [background-position:0_0,0_8px,8px_-8px,-8px_0] bg-white border-slate-300'
              : 'bg-white border-slate-200/80'
          }`}
        >
          {/* Main SVG Render Container */}
          <div
            id="logo-svg-canvas-container"
            className="w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] md:w-[400px] md:h-[400px] relative drop-shadow-md flex items-center justify-center rounded-xl overflow-hidden"
            dangerouslySetInnerHTML={{ __html: svgString }}
          />

          {/* Optional Overlay Grid */}
          {showGrid && (
            <div className="absolute inset-2 pointer-events-none grid grid-cols-8 grid-rows-8 border border-indigo-500/30 rounded-xl overflow-hidden">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className="border border-indigo-500/10" />
              ))}
            </div>
          )}

          {/* Optional Center Crosshair Guide */}
          {showCenterGuide && (
            <div className="absolute inset-2 pointer-events-none flex items-center justify-center">
              <div className="absolute w-full h-px bg-indigo-500/40 border-t border-dashed border-indigo-400" />
              <div className="absolute h-full w-px bg-indigo-500/40 border-l border-dashed border-indigo-400" />
              <div className="w-6 h-6 rounded-full border border-indigo-500 bg-indigo-500/10" />
            </div>
          )}
        </div>

        {/* Live Multi-Size Preview Badges (16px, 32px, 128px) */}
        <div className="mt-8 flex items-end gap-6 sm:gap-8 select-none">
          <div className="flex flex-col items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
            <div
              className={`w-4 h-4 border border-slate-300 rounded shadow-2xs flex items-center justify-center overflow-hidden ${
                config.bgType === 'transparent'
                  ? 'bg-[linear-gradient(45deg,#cbd5e1_25%,transparent_25%),linear-gradient(-45deg,#cbd5e1_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#cbd5e1_75%),linear-gradient(-45deg,transparent_75%,#cbd5e1_75%)] [background-size:4px_4px] [background-position:0_0,0_2px,2px_-2px,-2px_0] bg-white'
                  : 'bg-white'
              }`}
              dangerouslySetInnerHTML={{ __html: svgString }}
            />
            <span className="text-[10px] font-mono text-slate-500 font-semibold">16x16</span>
          </div>

          <div className="flex flex-col items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
            <div
              className={`w-8 h-8 border border-slate-300 rounded shadow-2xs flex items-center justify-center overflow-hidden ${
                config.bgType === 'transparent'
                  ? 'bg-[linear-gradient(45deg,#cbd5e1_25%,transparent_25%),linear-gradient(-45deg,#cbd5e1_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#cbd5e1_75%),linear-gradient(-45deg,transparent_75%,#cbd5e1_75%)] [background-size:6px_6px] [background-position:0_0,0_3px,3px_-3px,-3px_0] bg-white'
                  : 'bg-white'
              }`}
              dangerouslySetInnerHTML={{ __html: svgString }}
            />
            <span className="text-[10px] font-mono text-slate-600 font-semibold">32x32</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-16 h-16 border border-slate-300 rounded-lg shadow-sm flex items-center justify-center overflow-hidden ${
                config.bgType === 'transparent'
                  ? 'bg-[linear-gradient(45deg,#cbd5e1_25%,transparent_25%),linear-gradient(-45deg,#cbd5e1_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#cbd5e1_75%),linear-gradient(-45deg,transparent_75%,#cbd5e1_75%)] [background-size:8px_8px] [background-position:0_0,0_4px,4px_-4px,-4px_0] bg-white'
                  : 'bg-white'
              }`}
              dangerouslySetInnerHTML={{ __html: svgString }}
            />
            <span className="text-[10px] font-mono font-bold text-slate-700">128x128</span>
          </div>
        </div>
      </div>

      {/* Bottom Stage Action Bar */}
      <div className="border-t border-slate-200 bg-white p-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Canvas Dimension & Mode Info */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-700">
            512 × 512 px (Vector Master)
          </span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span
            className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
              config.bgType === 'transparent'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'text-slate-600'
            }`}
          >
            {(config.shapeMask || 'square').toUpperCase()} / {config.bgType === 'transparent' ? 'TRANSPARENT' : (config.bgType || 'solid').toUpperCase()}
          </span>
        </div>

        {/* Quick Export & Actions */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Copy SVG Code */}
          <button
            id="btn-copy-svg"
            onClick={handleCopySvg}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            title={t('canvasStage.copySvg')}
          >
            {copiedType === 'svg' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-bold">{t('canvasStage.copied')}</span>
              </>
            ) : (
              <>
                <Code2 className="h-3.5 w-3.5 text-slate-600" />
                <span>{t('canvasStage.copySvg')}</span>
              </>
            )}
          </button>

          {/* Quick SVG Download */}
          <button
            id="btn-quick-download-svg"
            onClick={handleQuickDownloadSvg}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-indigo-600" />
            <span>{t('canvasStage.quickSvg')}</span>
          </button>

          {/* Quick PNG Download */}
          <button
            id="btn-quick-download-png"
            onClick={() => handleQuickDownloadPng(512)}
            disabled={isDownloadingQuick}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <ImageIcon className="h-3.5 w-3.5 text-emerald-600" />
            <span>{t('canvasStage.quickPng')}</span>
          </button>

          {/* Open Full Favicon Suite */}
          <button
            id="btn-stage-export-suite"
            onClick={onOpenFaviconExport}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
            <span>{t('canvasStage.faviconSuite')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
