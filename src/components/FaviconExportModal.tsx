import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Download,
  PackageCheck,
  Copy,
  Check,
  FileCode,
  Sparkles,
  ArrowDownToLine,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LogoConfig, SupportedLanguage } from '../types';
import {
  FAVICON_SPECS,
  generateSvgString,
  renderSvgToBlob,
  createIcoFile,
  generateFaviconZip,
  generateHtmlHeadSnippet,
  generateWebmanifestJson,
  generateFeatureGraphicSvg,
  rasterizeSvg,
} from '../utils/canvasRenderer';
import { downloadBlob, downloadSvg } from '../utils/download';
import { Modal } from './Modal';

interface FaviconExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LogoConfig;
  language?: SupportedLanguage;
}

export const FaviconExportModal: React.FC<FaviconExportModalProps> = ({
  isOpen,
  onClose,
  config,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ percent: number; status: string }>({ percent: 0, status: '' });
  const [includeWebp, setIncludeWebp] = useState(true);
  const [includeJpeg, setIncludeJpeg] = useState(true);
  const [includePlayFeature, setIncludePlayFeature] = useState(true);
  const [organizedFolders, setOrganizedFolders] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [activeFormat, setActiveFormat] = useState<'png' | 'webp' | 'jpeg' | 'svg' | 'ico'>('png');

  const svgString = useMemo(() => generateSvgString(config, 512), [config]);
  const brandName = config.text || config.name || 'Brand';
  const htmlSnippet = useMemo(
    () => generateHtmlHeadSnippet(brandName, config.bgColor1 || '#4338ca'),
    [brandName, config.bgColor1]
  );
  const manifestJson = useMemo(
    () => generateWebmanifestJson(brandName, config.bgColor1 || '#4338ca'),
    [brandName, config.bgColor1]
  );

  // Full Favicon ZIP generator with JSZip and live progress
  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      setZipProgress({ percent: 0, status: t('faviconModal.initializingZipPackage') });
      const zipBlob = await generateFaviconZip(config, {
        includeWebp,
        includeJpeg,
        includePlayStoreFeature: includePlayFeature,
        organizedFolders,
        onProgress: (percent, status) => {
          setZipProgress({ percent, status });
        },
      });
      downloadBlob(zipBlob, `favicon-package-${brandName.replace(/\s+/g, '_')}.zip`);
      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Failed to generate ZIP package:', err);
    } finally {
      setIsZipping(false);
      setZipProgress({ percent: 0, status: '' });
    }
  };

  // Download individual file
  const handleDownloadSingle = async (size: number, fileName: string, format: 'png' | 'webp' | 'jpeg' | 'svg' | 'ico') => {
    try {
      setDownloadingFile(fileName);

      if (format === 'svg') {
        const cleanName = fileName.replace(/\.png$/i, '.svg');
        await downloadSvg(svgString, cleanName);
        return;
      }

      if (format === 'ico') {
        const cleanName = fileName.replace(/\.png$/i, '.ico');
        const pngBlob = await renderSvgToBlob(svgString, size, 'png');
        const icoBlob = await createIcoFile([{ size, blob: pngBlob }]);
        downloadBlob(icoBlob, cleanName);
        return;
      }

      const ext = format === 'jpeg' ? 'jpg' : format;
      const cleanName = fileName.replace(/\.png$/i, `.${ext}`);
      const blob = await renderSvgToBlob(svgString, size, format);
      downloadBlob(blob, cleanName);
    } catch (err) {
      console.error('Failed to download single file:', err);
    } finally {
      setDownloadingFile(null);
    }
  };

  // Copy HTML Snippet
  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(htmlSnippet);
      setCopiedType('html');
      setTimeout(() => setCopiedType(null), 2500);
    } catch (e) {
      console.error('Failed to copy code:', e);
    }
  };

  // Copy Manifest JSON
  const handleCopyManifest = async () => {
    try {
      await navigator.clipboard.writeText(manifestJson);
      setCopiedType('manifest');
      setTimeout(() => setCopiedType(null), 2500);
    } catch (e) {
      console.error('Failed to copy manifest:', e);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      label={t('faviconModal.title')}
      className="flex flex-col w-full max-w-4xl max-h-full bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
      overlayClassName="z-50 bg-slate-900/60"
    >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm font-bold">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {t('faviconModal.title')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('faviconModal.subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-white">
          {/* Main Action Banner: 1-Click ZIP Package */}
          <div className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 p-4 sm:p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1.5 text-center sm:text-start">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 border border-indigo-200 px-2.5 py-0.5 text-xs font-bold text-indigo-800">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <span>{t('faviconModal.bundleTitle')}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {t('faviconModal.exportZipBtn')}
                </h3>
                <p className="text-xs text-slate-600 max-w-xl">
                  {t('faviconModal.bundleDesc')}
                </p>
              </div>

              <button
                id="btn-download-full-zip"
                onClick={handleDownloadZip}
                disabled={isZipping}
                className="flex items-center gap-2.5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 shrink-0 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>
                  {isZipping
                    ? `${t('faviconModal.packaging')} (${zipProgress.percent}%)...`
                    : t('faviconModal.exportZipBtn')}
                </span>
              </button>
            </div>

            {/* ZIP Options Checklist */}
            <div className="pt-3 border-t border-indigo-100/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeWebp}
                  onChange={(e) => setIncludeWebp(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                />
                <span>{t('faviconModal.includeWebp')}</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeJpeg}
                  onChange={(e) => setIncludeJpeg(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                />
                <span>{t('faviconModal.includeJpg')}</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includePlayFeature}
                  onChange={(e) => setIncludePlayFeature(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                />
                <span>{t('faviconModal.includePlayBanner')}</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={organizedFolders}
                  onChange={(e) => setOrganizedFolders(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                />
                <span>{t('faviconModal.subfolders')}</span>
              </label>
            </div>

            {/* Live Progress Bar when Packaging */}
            {isZipping && (
              <div className="space-y-1.5 pt-1 animate-in fade-in duration-150">
                <div className="flex justify-between text-xs font-bold text-indigo-900">
                  <span className="truncate">{zipProgress.status}</span>
                  <span className="font-mono">{zipProgress.percent}%</span>
                </div>
                <div className="w-full bg-indigo-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-200"
                    style={{ width: `${zipProgress.percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Google Play Feature Graphic 1024x500 Banner Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold shadow-xs shrink-0">
                <span className="text-[10px] font-black leading-tight text-center">1024<br/>×500</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                    Google Play Feature Graphic (1024 × 500 px)
                  </h4>
                  <span className="bg-emerald-200/80 text-emerald-900 text-[9px] font-black px-2 py-0.5 rounded-full">
                    PLAY STORE
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 line-clamp-1">
                  {t('featureGraphicModal.subtitle')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={async () => {
                  const svg = generateFeatureGraphicSvg(config, {
                    layout: 'center-hero',
                    title: config.text || config.name || 'App',
                    subtitle: config.tagline || 'Next Gen Mobile App',
                    badgeText: '★ 4.9 • 100K+ Downloads',
                    bgTheme: 'brand',
                    showPhoneMockup: true,
                    showPlayBadge: true,
                    showRatingStars: true,
                    showGlowEffect: true,
                  });
                  const blob = await rasterizeSvg(svg, 1024, 500, 'png');
                  downloadBlob(blob, `google_play_feature_graphic_${(config.text || 'app').replace(/\s+/g, '_')}_1024x500.png`);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              >
                PNG 1024×500
              </button>
              <button
                onClick={async () => {
                  const svg = generateFeatureGraphicSvg(config, {
                    layout: 'center-hero',
                    title: config.text || config.name || 'App',
                    subtitle: config.tagline || 'Next Gen Mobile App',
                    badgeText: '★ 4.9 • 100K+ Downloads',
                    bgTheme: 'brand',
                    showPhoneMockup: true,
                    showPlayBadge: true,
                    showRatingStars: true,
                    showGlowEffect: true,
                  });
                  const blob = await rasterizeSvg(svg, 1024, 500, 'jpeg');
                  downloadBlob(blob, `google_play_feature_graphic_${(config.text || 'app').replace(/\s+/g, '_')}_1024x500.jpg`);
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              >
                JPG 1024×500
              </button>
            </div>
          </div>

          {/* Format Selector for Individual Exports */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('faviconModal.sizesList')}
            </span>
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-1">
              <span className="text-[11px] text-slate-500 px-1 font-medium">{t('faviconModal.sizesList')}</span>
              {(['png', 'svg', 'ico', 'webp', 'jpeg'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setActiveFormat(fmt)}
                  className={`px-2.5 py-0.5 text-xs rounded-md font-bold uppercase transition-all cursor-pointer ${
                    activeFormat === fmt ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {fmt === 'jpeg' ? 'JPG' : fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Sizes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {FAVICON_SPECS.map((spec) => (
              <div
                key={spec.size}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/60 shadow-2xs transition-all group"
              >
                <div className="flex items-center gap-3">
                  {/* Mini Preview Box */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg checkerboard ring-1 ring-slate-200 overflow-hidden shrink-0">
                    <div
                      style={{ width: Math.min(spec.size, 38), height: Math.min(spec.size, 38) }}
                      dangerouslySetInnerHTML={{ __html: svgString }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 font-mono">{spec.label}</span>
                      {spec.isAppleTouch && (
                        <span className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.2 text-[9px] font-bold text-slate-700">
                          iOS
                        </span>
                      )}
                      {spec.isPWA && (
                        <span className="rounded bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700">
                          PWA
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{isAr ? spec.descriptionAr : spec.descriptionEn}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadSingle(spec.size, spec.fileName, activeFormat)}
                  disabled={downloadingFile === spec.fileName}
                  className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white transition-colors group-hover:scale-105 cursor-pointer"
                  title={`${t('common.download')} ${spec.fileName}`}
                >
                  <ArrowDownToLine className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* HTML Snippet & Integration Code */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">
                  {t('faviconModal.htmlCodeTitle')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyManifest}
                  className="flex items-center gap-1 text-xs text-slate-600 font-semibold hover:text-slate-900 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs cursor-pointer"
                >
                  {copiedType === 'manifest' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{t('faviconModal.manifestJson')}</span>
                </button>

                <button
                  onClick={handleCopyHtml}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer"
                >
                  {copiedType === 'html' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">{t('common.copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>{t('faviconModal.copyHtmlCode')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-200 overflow-x-auto select-all">
              {htmlSnippet}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold">{t('faviconModal.compliantNote')}</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-white border border-slate-200 px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </Modal>
  );
};
