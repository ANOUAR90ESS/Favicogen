import { useTranslation } from 'react-i18next';
import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  Share2,
  Image as Sparkles,
  Check,
  Sliders,
  FileArchive,
  Info,
  Copy,
  Shield,
  Youtube,
} from 'lucide-react';
import { LogoConfig, SupportedLanguage, SocialBannerOptions, SocialMediaPreset } from '../types';
import {
  SOCIAL_MEDIA_PRESETS,
  generateSvgString,
  generateSocialBannerSvg,
  renderSvgToBlob,
  rasterizeSvg,
  generateSocialMediaKitZip,
  SOCIAL_BANNER_LAYOUT_IDS,
} from '../utils/canvasRenderer';
import { downloadBlob, downloadSvg } from '../utils/download';
import { hasDocumentedSafeArea } from '../utils/platformAssets';
import { Modal } from './Modal';

interface SocialMediaKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LogoConfig;
  lang: SupportedLanguage;
  onOpenYouTubeKit?: () => void;
  onOpenAIGenerator?: () => void;
}

export const SocialMediaKitModal: React.FC<SocialMediaKitModalProps> = ({
  isOpen,
  onClose,
  config,
  lang,
  onOpenYouTubeKit,
  onOpenAIGenerator,
}) => {
  const { t } = useTranslation();
  // Tab filter: 'all' | '1:1' | '16:9' | 'platform'
  const [activeTab, setActiveTab] = useState<'all' | '1:1' | '16:9'>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  
  // Banner Customization Options
  const [bannerOptions, setBannerOptions] = useState<SocialBannerOptions>({
    layout: 'center-hero',
    title: config.text || config.name || 'Brand Name',
    subtitle: config.tagline || '',
    bgTheme: 'brand',
    showBadge: false,
    badgeText: '',
    showGlowEffect: true,
    showSafeZone: false,
  });

  // State for downloads and copying
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter presets
  const filteredPresets = useMemo(() => {
    return SOCIAL_MEDIA_PRESETS.filter((preset) => {
      if (activeTab === '1:1' && preset.ratio !== '1:1') return false;
      if (activeTab === '16:9' && preset.type !== 'banner') return false;
      if (platformFilter !== 'all' && preset.platform !== platformFilter && preset.platform !== 'general') {
        return false;
      }
      return true;
    });
  }, [activeTab, platformFilter]);

  // One label table, so the picker and the generator cannot drift apart.
  const layoutLabels: Record<(typeof SOCIAL_BANNER_LAYOUT_IDS)[number], string> = {
    'center-hero': t('socialKitModal.layoutCenterHero'),
    'split-hero': t('socialKitModal.layoutLogoDetail'),
    'minimal-clean': t('socialKitModal.layoutMinimal'),
    'brand-luxury': t('socialKitModal.layoutLuxury'),
  };

  // A name alone ("Luxury identity") says nothing about what the button does.
  const layoutThumbnails = useMemo(() => {
    const drawn = {} as Record<(typeof SOCIAL_BANNER_LAYOUT_IDS)[number], string>;
    for (const id of SOCIAL_BANNER_LAYOUT_IDS) {
      drawn[id] = generateSocialBannerSvg(
        config,
        { ...bannerOptions, layout: id, showSafeZone: false },
        640,
        240
      );
    }
    return drawn;
  }, [config, bannerOptions]);

  // Base SVG for 1:1 items
  const base1x1Svg = useMemo(() => {
    return generateSvgString(config, 512);
  }, [config]);

  // Download Single Preset
  const handleDownloadSingle = async (preset: SocialMediaPreset, format: 'png' | 'svg' = 'png') => {
    try {
      setDownloadingId(`${preset.id}-${format}`);
      const filename = `${(config.text || 'brand').toLowerCase().replace(/\s+/g, '_')}_${preset.id}_${preset.width}x${preset.height}.${format}`;

      if (preset.type === 'profile' || preset.ratio === '1:1') {
        if (format === 'svg') {
          await downloadSvg(base1x1Svg, filename);
        } else {
          const blob = await renderSvgToBlob(base1x1Svg, preset.width, 'png');
          downloadBlob(blob, filename);
        }
      } else {
        // Banner SVG
        const bannerSvg = generateSocialBannerSvg(
          config,
          { ...bannerOptions, showSafeZone: false },
          preset.width,
          preset.height
        );
        if (format === 'svg') {
          await downloadSvg(bannerSvg, filename);
        } else {
          const blob = await rasterizeSvg(bannerSvg, preset.width, preset.height, 'png');
          downloadBlob(blob, filename);
        }
      }
    } catch (err) {
      console.error('Failed to download single asset:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  // Copy SVG Code
  const handleCopySvg = async (preset: SocialMediaPreset) => {
    try {
      const svgCode =
        preset.type === 'profile' || preset.ratio === '1:1'
          ? base1x1Svg
          : generateSocialBannerSvg(
              config,
              { ...bannerOptions, showSafeZone: false },
              preset.width,
              preset.height
            );

      await navigator.clipboard.writeText(svgCode);
      setCopiedId(preset.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      console.error('Failed to copy SVG code:', err);
    }
  };

  // Download All as ZIP
  const handleDownloadAllZip = async () => {
    try {
      setIsExportingAll(true);
      const zipBlob = await generateSocialMediaKitZip(config, bannerOptions);
      const filename = `${(config.text || 'brand').toLowerCase().replace(/\s+/g, '_')}_social_media_kit.zip`;
      downloadBlob(zipBlob, filename);
    } catch (err) {
      console.error('Failed to generate Social Media Kit ZIP:', err);
    } finally {
      setIsExportingAll(false);
    }
  };

  const isAr = lang === 'ar';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      label={t('socialKitModal.socialMediaKit')}
      className="relative w-full max-w-7xl max-h-full flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
      overlayClassName="z-50"
    >
      {/* Modal Header */}
      <div
        id="social-media-kit-modal-container"
        className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur shrink-0"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-xl font-bold tracking-tight text-white flex flex-wrap items-center gap-x-2">
              {t('socialKitModal.socialMediaDesignKit')}
              <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full">
                PRO
              </span>
            </h2>
            <p className="hidden sm:block text-xs text-slate-400">
              {t('socialKitModal.generatePreviewLogoAcross')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Download Full Kit ZIP button */}
          <button
            id="download-all-social-kit-btn"
            onClick={handleDownloadAllZip}
            disabled={isExportingAll}
            title={t('socialKitModal.exportFullKitZip')}
            aria-label={t('socialKitModal.exportFullKitZip')}
            className="inline-flex shrink-0 items-center gap-2 px-2.5 sm:px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {isExportingAll ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FileArchive className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{t('socialKitModal.exportFullKitZip')}</span>
          </button>

          <button
            id="close-social-media-kit-modal-btn"
            onClick={onClose}
            aria-label={t('socialKitModal.close')}
            className="shrink-0 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

{/* Modal Body: Two-Column Workspace */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Customizer Controls (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Filter Tabs */}
            <div className="bg-slate-950/60 p-1.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-medium">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  activeTab === 'all'
                    ? 'bg-indigo-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('socialKitModal.allSizes')}
              </button>
              <button
                onClick={() => setActiveTab('1:1')}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  activeTab === '1:1'
                    ? 'bg-indigo-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('socialKitModal.profile11')}
              </button>
              <button
                onClick={() => setActiveTab('16:9')}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  activeTab === '16:9'
                    ? 'bg-indigo-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('socialKitModal.banners169')}
              </button>
            </div>

            {/* Platform Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              {[
                { id: 'all', label: t('socialKitModal.platformAll') },
                { id: 'youtube', label: t('socialKitModal.platformYoutube') },
                { id: 'twitter', label: t('socialKitModal.platformX') },
                { id: 'instagram', label: t('socialKitModal.platformInstagram') },
                { id: 'linkedin', label: t('socialKitModal.platformLinkedin') },
                { id: 'facebook', label: t('socialKitModal.platformFacebook') },
                { id: 'discord', label: t('socialKitModal.platformDiscord') },
                { id: 'tiktok', label: t('socialKitModal.platformTiktok') },
              ].map((plat) => (
                <button
                  key={plat.id}
                  onClick={() => setPlatformFilter(plat.id)}
                  className={`px-3 py-1.5 rounded-full whitespace-nowrap border transition-all ${
                    platformFilter === plat.id
                      ? 'bg-slate-700 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {plat.label}
                </button>
              ))}
            </div>

            {/* Banner & Cover Appearance Customizer */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  {t('socialKitModal.bannerCoverStudio')}
                </h3>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">
                  16:9 / 3:1 / 4:1
                </span>
              </div>

              {/* Layout Styles */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">
                  {t('socialKitModal.bannerComposition')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SOCIAL_BANNER_LAYOUT_IDS.map((id) => (
                    <button
                      key={id}
                      onClick={() => setBannerOptions((prev) => ({ ...prev, layout: id }))}
                      aria-pressed={bannerOptions.layout === id}
                      className={`rounded-lg border p-1.5 text-start text-xs transition-all ${
                        bannerOptions.layout === id
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {/* Drawn by the generator that draws the banner, so the
                          thumbnail cannot promise a composition it will not
                          produce — including the user's own colours and text. */}
                      <span
                        className="block w-full overflow-hidden rounded-md border border-slate-800/80 [&>svg]:h-full [&>svg]:w-full"
                        style={{ aspectRatio: '640 / 240' }}
                        dangerouslySetInnerHTML={{ __html: layoutThumbnails[id] }}
                      />
                      <span className="mt-1.5 block px-0.5">{layoutLabels[id]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Themes */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">
                  {t('socialKitModal.backgroundTheme')}
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {([
                    { id: 'brand', label: t('socialKitModal.themeBrand') },
                    { id: 'dark', label: t('socialKitModal.themeDarkLuxe') },
                    { id: 'sunset', label: t('socialKitModal.themeSunset') },
                    { id: 'emerald', label: t('socialKitModal.themeEmerald') },
                    { id: 'cyberpunk', label: t('socialKitModal.themeCyberpunk') },
                    { id: 'light', label: t('socialKitModal.themeBright') },
                    { id: 'transparent', label: t('socialKitModal.themeTransparent') },
                  ] satisfies { id: SocialBannerOptions['bgTheme']; label: string }[]).map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() =>
                        setBannerOptions((prev) => ({
                          ...prev,
                          bgTheme: theme.id,
                        }))
                      }
                      className={`px-2.5 py-1.5 rounded-lg border text-center transition-all ${
                        bannerOptions.bgTheme === theme.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Text Inputs */}
              <div className="space-y-2 pt-1">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">
                    {t('socialKitModal.channelPageTitle')}
                  </label>
                  <input
                    type="text"
                    value={bannerOptions.title || ''}
                    onChange={(e) =>
                      setBannerOptions((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    placeholder="Enter channel title"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">
                    {t('socialKitModal.subtitleTagline')}
                  </label>
                  <input
                    type="text"
                    value={bannerOptions.subtitle || ''}
                    onChange={(e) =>
                      setBannerOptions((prev) => ({ ...prev, subtitle: e.target.value }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    placeholder="Official channel tagline"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <span className="text-xs text-slate-300">
                    {t('socialKitModal.ambientGlowEffect')}
                  </span>
                  <input
                    type="checkbox"
                    checked={bannerOptions.showGlowEffect}
                    onChange={(e) =>
                      setBannerOptions((prev) => ({
                        ...prev,
                        showGlowEffect: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-indigo-500 rounded bg-slate-900"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-1">
                  <span className="text-xs text-slate-300">
                    {t('socialKitModal.officialChannelBadge')}
                  </span>
                  <input
                    type="checkbox"
                    checked={bannerOptions.showBadge}
                    onChange={(e) =>
                      setBannerOptions((prev) => ({
                        ...prev,
                        showBadge: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-indigo-500 rounded bg-slate-900"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-1">
                  <span className="text-xs text-amber-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    {t('socialKitModal.safeZoneOverlay')}
                  </span>
                  <input
                    type="checkbox"
                    checked={bannerOptions.showSafeZone}
                    onChange={(e) =>
                      setBannerOptions((prev) => ({
                        ...prev,
                        showSafeZone: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-amber-500 rounded bg-slate-900"
                  />
                </label>
              </div>
            </div>

            {/* Mobile Export Full Kit ZIP Button */}
            <div className="sm:hidden">
              <button
                onClick={handleDownloadAllZip}
                disabled={isExportingAll}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg"
              >
                {isExportingAll ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FileArchive className="w-4 h-4" />
                )}
                <span>{t('socialKitModal.exportFullKitZip2')}</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Grid Previews (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Dedicated YouTube Studio Quick Banner */}
            {onOpenYouTubeKit && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/60 via-slate-900 to-red-950/40 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-red-600/30">
                    <Youtube className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {t('socialKitModal.dedicatedYoutubeChannelStudio')}
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-300 rounded-full border border-red-500/30">
                        NEW
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300">
                      {t('socialKitModal.customizeChannelBannerMobile')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onOpenAIGenerator && (
                    <button
                      type="button"
                      onClick={onOpenAIGenerator}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 transition flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>{t('socialKitModal.aiGenerate')}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onOpenYouTubeKit}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30 transition flex items-center gap-1.5"
                  >
                    <Youtube className="w-4 h-4" />
                    <span>{t('socialKitModal.openYoutubeStudio')}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {isAr
                  ? t('socialKitModal.assetsReady', { count: filteredPresets.length })
                  : `Export Assets Ready (${filteredPresets.length})`}
              </span>
              <span className="text-xs text-slate-500">
                {t('socialKitModal.losslessVectorUltraHd')}
              </span>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPresets.map((preset) => {
                const isProfile = preset.ratio === '1:1';
                const isBanner = preset.type === 'banner';

                return (
                  <div
                    key={preset.id}
                    className={`bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all group relative overflow-hidden ${
                      isBanner ? 'md:col-span-2' : ''
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                            {isAr ? preset.nameAr : preset.nameEn}
                          </h4>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${
                              preset.ratio === '1:1'
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {preset.ratio}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {isAr ? preset.descriptionAr : preset.descriptionEn}
                        </p>
                      </div>

                      <div className="text-end">
                        <span className="font-mono text-xs text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                          {preset.width} × {preset.height}
                        </span>
                      </div>
                    </div>

                    {/* Preview Canvas Area */}
                    <div className="relative my-2 w-full bg-slate-900/90 rounded-lg border border-slate-800/80 overflow-hidden flex items-center justify-center p-3">
                      {/* Checkered pattern background */}
                      <div
                        className="absolute inset-0 opacity-15"
                        style={{
                          backgroundImage: `
                            linear-gradient(45deg, #475569 25%, transparent 25%),
                            linear-gradient(-45deg, #475569 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #475569 75%),
                            linear-gradient(-45deg, transparent 75%, #475569 75%)
                          `,
                          backgroundSize: '16px 16px',
                          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                        }}
                      />

                      {/* 1:1 Profile Picture Preview */}
                      {isProfile && (
                        <div className="relative flex items-center justify-center py-2">
                          <div
                            className={`relative w-32 h-32 transition-transform duration-300 group-hover:scale-105 ${
                              preset.cropStyle === 'circle' ? 'rounded-full overflow-hidden' : ''
                            }`}
                          >
                            <div
                              className="w-full h-full"
                              dangerouslySetInnerHTML={{ __html: base1x1Svg }}
                            />
                          </div>

                          {/* Social avatar watermark pill */}
                          <div className="absolute -bottom-1 bg-slate-950/90 border border-slate-800 text-[10px] text-slate-400 px-2 py-0.5 rounded-full backdrop-blur">
                            {preset.cropStyle === 'circle'
                              ? t('socialKitModal.cropCircle')
                              : t('socialKitModal.cropSquare')}
                          </div>
                        </div>
                      )}

                      {/* A guide is only shown where the platform publishes one */}
                      {isBanner &&
                        bannerOptions.showSafeZone &&
                        !hasDocumentedSafeArea(preset.width, preset.height) && (
                          <div className="absolute inset-x-3 top-2 z-10 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-300">
                            {t('socialKitModal.noDocumentedSafeArea')}
                          </div>
                        )}

                      {/* 16:9 / Banner Preview */}
                      {isBanner && (
                        <div className="w-full relative flex items-center justify-center">
                          <div
                            className="w-full overflow-hidden"
                            style={{
                              aspectRatio: `${preset.width} / ${preset.height}`,
                              maxHeight: '260px',
                            }}
                            dangerouslySetInnerHTML={{
                              __html: generateSocialBannerSvg(
                                config,
                                bannerOptions,
                                preset.width,
                                preset.height
                              ),
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
                      {/* Copy SVG Code */}
                      <button
                        onClick={() => handleCopySvg(preset)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors"
                      >
                        {copiedId === preset.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">{t('socialKitModal.copied')}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>{t('socialKitModal.copySvg')}</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        {/* Download SVG */}
                        <button
                          onClick={() => handleDownloadSingle(preset, 'svg')}
                          disabled={downloadingId === `${preset.id}-svg`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-400" />
                          <span>SVG</span>
                        </button>

                        {/* Download PNG */}
                        <button
                          onClick={() => handleDownloadSingle(preset, 'png')}
                          disabled={downloadingId === `${preset.id}-png`}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow transition-colors disabled:opacity-50"
                        >
                          {downloadingId === `${preset.id}-png` ? (
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>PNG ({preset.width}px)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Info className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>
              {t('socialKitModal.allAssetsRenderedPixel')}
            </span>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
          >
            {t('socialKitModal.close')}
          </button>
        </div>
</Modal>
  );
};
