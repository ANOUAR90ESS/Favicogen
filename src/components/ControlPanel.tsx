import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shapes,
  Type,
  Palette,
  Layout,
  Upload,
  Search,
  RotateCw,
  FlipHorizontal,
  Package,
  Stamp,
} from 'lucide-react';
import {
  LogoConfig,
  SupportedLanguage,
  ShapeMask,
  BackgroundType,
  PatternType,
  LayoutStyle,
} from '../types';
import { ICON_LIBRARY, ICON_CATEGORIES } from '../utils/iconLibrary';
import { AdvancedColorPicker } from './AdvancedColorPicker';
import { ImageUploadEditor } from './ImageUploadEditor';
import { SmartPaletteGenerator } from './SmartPaletteGenerator';
import { ComplementaryPaletteBar } from './ComplementaryPaletteBar';
import { WatermarkControls } from './WatermarkControls';
import { sanitizeSvgMarkup } from '../utils/svgSanitizer';

interface ControlPanelProps {
  config: LogoConfig;
  onChange: (newConfig: LogoConfig) => void;
  language?: SupportedLanguage;
  onOpenCropTrimModal?: (src?: string) => void;
}

const POPULAR_PALETTES = [
  { name: 'Indigo Core', c1: '#4338ca', c2: '#312e81', icon1: '#ffffff', icon2: '#a5b4fc' },
  { name: 'Cyber Slate', c1: '#0f172a', c2: '#1e293b', icon1: '#38bdf8', icon2: '#818cf8' },
  { name: 'Royal Gold', c1: '#18140c', c2: '#0c0a06', icon1: '#facc15', icon2: '#ca8a04' },
  { name: 'Emerald Pure', c1: '#064e3b', c2: '#022c22', icon1: '#34d399', icon2: '#10b981' },
  { name: 'Sunset Flame', c1: '#e11d48', c2: '#9f1239', icon1: '#ffffff', icon2: '#fecdd3' },
  { name: 'Clean White', c1: '#ffffff', c2: '#f1f5f9', icon1: '#0f172a', icon2: '#4338ca' },
];

const FONTS_LIST = [
  { id: 'Cairo', nameKey: 'controlPanel.fontCairo', type: 'arabic' },
  { id: 'Tajawal', nameKey: 'controlPanel.fontTajawal', type: 'arabic' },
  { id: 'Almarai', nameKey: 'controlPanel.fontAlmarai', type: 'arabic' },
  { id: 'IBM Plex Sans Arabic', nameKey: 'controlPanel.fontIbmPlex', type: 'arabic' },
  { id: 'Outfit', nameKey: 'controlPanel.fontOutfit', type: 'latin' },
  { id: 'Montserrat', nameKey: 'controlPanel.fontMontserrat', type: 'latin' },
  { id: 'Playfair Display', nameKey: 'controlPanel.fontPlayfair', type: 'latin' },
  { id: 'Righteous', nameKey: 'controlPanel.fontRighteous', type: 'latin' },
  { id: 'Fira Code', nameKey: 'controlPanel.fontFiraCode', type: 'latin' },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  onChange,
  language,
  onOpenCropTrimModal,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState<'icon' | 'text' | 'bg' | 'layout' | 'watermark'>('icon');
  const [iconCategory, setIconCategory] = useState<string>('all');
  const [iconSearch, setIconSearch] = useState<string>('');
  const [svgUploadError, setSvgUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateConfig = (patch: Partial<LogoConfig>) => {
    onChange({ ...config, ...patch, updatedAt: Date.now() });
  };

  // Filtered Icons
  const filteredIcons = ICON_LIBRARY.filter((item) => {
    const matchesCategory = iconCategory === 'all' || item.category === iconCategory;
    const matchesSearch =
      !iconSearch ||
      item.nameEn.toLowerCase().includes(iconSearch.toLowerCase()) ||
      item.nameAr.includes(iconSearch) ||
      item.key.includes(iconSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle custom SVG file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      // This markup is injected into the live DOM, so it goes through the
      // allow-list rather than a regex that only looks for <svg> tags.
      const safeMarkup = sanitizeSvgMarkup(content);
      if (!safeMarkup) {
        setSvgUploadError(t('controlPanel.svgRejected'));
        return;
      }

      setSvgUploadError(null);
      updateConfig({
        iconType: 'custom-svg',
        customSvgString: safeMarkup,
      });
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-full overflow-hidden">
      {/* Sidebar Tabs Header */}
      <div className="grid grid-cols-5 border-b border-slate-200 bg-slate-50/80 p-1.5 gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('icon')}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-0.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'icon'
              ? 'bg-white text-indigo-600 shadow-2xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          <Shapes className="h-3.5 w-3.5" />
          <span className="text-[10px] truncate">{t('controlPanel.tabs.icon')}</span>
        </button>

        <button
          onClick={() => setActiveTab('text')}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-0.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'text'
              ? 'bg-white text-indigo-600 shadow-2xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          <Type className="h-3.5 w-3.5" />
          <span className="text-[10px] truncate">{t('controlPanel.tabs.text')}</span>
        </button>

        <button
          onClick={() => setActiveTab('bg')}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-0.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'bg'
              ? 'bg-white text-indigo-600 shadow-2xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          <Palette className="h-3.5 w-3.5" />
          <span className="text-[10px] truncate">{t('controlPanel.tabs.colors')}</span>
        </button>

        <button
          onClick={() => setActiveTab('layout')}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-0.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'layout'
              ? 'bg-white text-indigo-600 shadow-2xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          <Layout className="h-3.5 w-3.5" />
          <span className="text-[10px] truncate">{t('controlPanel.tabs.layout')}</span>
        </button>

        <button
          onClick={() => setActiveTab('watermark')}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-0.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'watermark'
              ? 'bg-white text-indigo-600 shadow-2xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          <Stamp className="h-3.5 w-3.5" />
          <span className="text-[10px] truncate">{t('controlPanel.tabs.watermark')}</span>
        </button>
      </div>

      {/* Tab Content Panel */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar text-sm bg-white">
        {/* ========================================================= */}
        {/* TAB 1: ICON & IMAGE & SHAPES */}
        {/* ========================================================= */}
        {activeTab === 'icon' && (
          <div className="space-y-5">
            {/* Header with signature accent line */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1 h-4 bg-indigo-500 rounded"></span>
                <span>{t('controlPanel.iconTab.title')}</span>
              </h3>
              <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                <button
                  onClick={() => updateConfig({ iconType: 'library' })}
                  className={`px-2 py-0.5 text-[11px] rounded-md font-semibold transition-all ${
                    config.iconType === 'library' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  {t('controlPanel.icons')}
                </button>
                <button
                  onClick={() => updateConfig({ iconType: 'image' })}
                  className={`px-2 py-0.5 text-[11px] rounded-md font-semibold transition-all ${
                    config.iconType === 'image' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-500'
                  }`}
                >
                  {t('controlPanel.image')}
                </button>
                <button
                  onClick={() => updateConfig({ iconType: 'custom-svg' })}
                  className={`px-2 py-0.5 text-[11px] rounded-md font-semibold transition-all ${
                    config.iconType === 'custom-svg' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  SVG
                </button>
                <button
                  onClick={() => updateConfig({ iconType: 'emoji' })}
                  className={`px-2 py-0.5 text-[11px] rounded-md font-semibold transition-all ${
                    config.iconType === 'emoji' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  {t('controlPanel.emoji')}
                </button>
              </div>
            </div>

            {/* Image Upload & In-App Image Editor */}
            {config.iconType === 'image' && (
              <ImageUploadEditor
                config={config}
                onChange={(patch) => updateConfig(patch)}
                onOpenCropTrimModal={onOpenCropTrimModal}
              />
            )}

            {/* Custom SVG Upload Mode */}
            {config.iconType === 'custom-svg' && (
              <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 text-center space-y-3">
                <Upload className="mx-auto h-7 w-7 text-indigo-600" />
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    {t('controlPanel.iconTab.uploadCustom')}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {t('controlPanel.iconTab.uploadHint')}
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".svg,image/svg+xml"
                  className="hidden"
                />

                {svgUploadError && (
                  <p role="alert" className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-2 text-start">
                    {svgUploadError}
                  </p>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  {t('controlPanel.iconTab.uploadCustom')}
                </button>
              </div>
            )}

            {/* Emoji Mode */}
            {config.iconType === 'emoji' && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {t('controlPanel.emojiCharacter')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={config.emojiChar || '🚀'}
                    onChange={(e) => updateConfig({ emojiChar: e.target.value })}
                    className="w-14 text-center text-xl bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {['🚀', '⚡', '👑', '💎', '🔥', '✨', '🧠', '🌐', '🌿', '🎯', '🦁', '🛡️'].map((em) => (
                      <button
                        key={em}
                        onClick={() => updateConfig({ emojiChar: em })}
                        className="text-lg p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-white hover:border-slate-300 hover:scale-105 transition-all shadow-2xs cursor-pointer"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Icon Library Selector */}
            {config.iconType === 'library' && (
              <div className="space-y-3">
                {/* Search & Category Filter */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={iconSearch}
                      onChange={(e) => setIconSearch(e.target.value)}
                      placeholder={t('controlPanel.iconTab.searchPlaceholder')}
                      className="w-full bg-white border border-slate-200 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
                    />
                  </div>

                  {/* Categories Pills */}
                  <div className="flex flex-wrap gap-1">
                    {ICON_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setIconCategory(cat.id)}
                        className={`px-2 py-0.5 text-[11px] rounded-md font-semibold transition-all ${
                          iconCategory === cat.id
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {isAr ? cat.labelAr : cat.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Icons Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50 custom-scrollbar">
                  {filteredIcons.map((item) => {
                    const isSelected = config.iconKey === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => updateConfig({ iconKey: item.key, iconType: 'library' })}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-600 shadow-2xs scale-[1.02]'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 shadow-2xs'
                        }`}
                        title={isAr ? item.nameAr : item.nameEn}
                      >
                        <svg
                          width="22"
                          height="22"
                          viewBox={item.viewBox || '0 0 24 24'}
                          fill="currentColor"
                          dangerouslySetInnerHTML={{ __html: item.path }}
                        />
                        <span className="text-[9px] mt-1 text-center truncate max-w-full font-semibold">
                          {isAr ? item.nameAr : item.nameEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Icon Size Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-700 font-bold">{t('controlPanel.iconTab.scale')}</span>
                <span className="text-slate-500 font-mono font-semibold">{config.iconSize}px</span>
              </div>
              <input
                type="range"
                min="40"
                max="400"
                step="5"
                value={config.iconSize}
                onChange={(e) => updateConfig({ iconSize: Number(e.target.value) })}
                className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Icon Colors & Gradient with Advanced Color Picker */}
            {config.iconType !== 'image' && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {t('controlPanel.iconTab.iconColor')}
                  </span>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.iconGradient}
                      onChange={(e) => updateConfig({ iconGradient: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                    />
                    <span>{t('controlPanel.iconTab.dualTone')}</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <AdvancedColorPicker
                    label={t('controlPanel.iconTab.iconColor')}
                    color={config.iconColor}
                    onChange={(c) => updateConfig({ iconColor: c })}
                  />

                  {config.iconGradient && (
                    <AdvancedColorPicker
                      label={t('controlPanel.iconTab.secondaryColor')}
                      color={config.iconColor2 || '#818cf8'}
                      onChange={(c) => updateConfig({ iconColor2: c })}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Visual Effects: Drop Shadow & Outline */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {t('controlPanel.iconTab.iconGlow')}
              </span>

              {/* Shadow Controls */}
              <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{t('common.shadow')}</span>
                  <input
                    type="checkbox"
                    checked={config.iconShadow}
                    onChange={(e) => updateConfig({ iconShadow: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </div>

                {config.iconShadow && (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                        <span>{t('controlPanel.shadowBlur')}</span>
                        <span className="font-mono">{config.iconShadowBlur || 8}px</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        value={config.iconShadowBlur || 8}
                        onChange={(e) => updateConfig({ iconShadowBlur: Number(e.target.value) })}
                        className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
                      />
                    </div>

                    <AdvancedColorPicker
                      label={t('common.color')}
                      color={config.iconShadowColor || 'rgba(0,0,0,0.5)'}
                      onChange={(c) => updateConfig({ iconShadowColor: c })}
                      showShades={false}
                    />
                  </div>
                )}
              </div>

              {/* Outline / Stroke Controls */}
              <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{t('controlPanel.iconTab.iconOutline')}</span>
                  <input
                    type="checkbox"
                    checked={config.iconOutline}
                    onChange={(e) => updateConfig({ iconOutline: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </div>

                {config.iconOutline && (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                        <span>{t('controlPanel.colorsTab.borderWidth')}</span>
                        <span className="font-mono">{config.iconOutlineWidth || 3}px</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="12"
                        value={config.iconOutlineWidth || 3}
                        onChange={(e) => updateConfig({ iconOutlineWidth: Number(e.target.value) })}
                        className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
                      />
                    </div>

                    <AdvancedColorPicker
                      label={t('controlPanel.colorsTab.borderColor')}
                      color={config.iconOutlineColor || '#ffffff'}
                      onChange={(c) => updateConfig({ iconOutlineColor: c })}
                      showShades={false}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Transform & Rotation */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>{t('controlPanel.iconTab.scale')}</span>
                <button
                  onClick={() => updateConfig({ iconOffsetX: 0, iconOffsetY: 0, iconRotation: 0 })}
                  className="text-[11px] text-indigo-600 hover:underline font-semibold"
                >
                  {t('common.reset')}
                </button>
              </div>

              {/* Offset X & Y */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>{t('controlPanel.iconTab.offsetX')}</span>
                    <span>{config.iconOffsetX}px</span>
                  </div>
                  <input
                    type="range"
                    min="-150"
                    max="150"
                    value={config.iconOffsetX}
                    onChange={(e) => updateConfig({ iconOffsetX: Number(e.target.value) })}
                    className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>{t('controlPanel.iconTab.offsetY')}</span>
                    <span>{config.iconOffsetY}px</span>
                  </div>
                  <input
                    type="range"
                    min="-150"
                    max="150"
                    value={config.iconOffsetY}
                    onChange={(e) => updateConfig({ iconOffsetY: Number(e.target.value) })}
                    className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
                  />
                </div>
              </div>

              {/* Rotation Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                  <span>{t('controlPanel.iconTab.rotation')}</span>
                  <span>{config.iconRotation}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={config.iconRotation}
                  onChange={(e) => updateConfig({ iconRotation: Number(e.target.value) })}
                  className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
                />
              </div>

              {/* Flip Horizontal / Vertical */}
              <div className="flex gap-2">
                <button
                  onClick={() => updateConfig({ iconFlipH: !config.iconFlipH })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-semibold shadow-2xs transition-colors cursor-pointer ${
                    config.iconFlipH
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FlipHorizontal className="h-3.5 w-3.5" />
                  <span>{t('controlPanel.iconTab.flipH')}</span>
                </button>

                <button
                  onClick={() => updateConfig({ iconFlipV: !config.iconFlipV })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-semibold shadow-2xs transition-colors cursor-pointer ${
                    config.iconFlipV
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>{t('controlPanel.iconTab.flipV')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: TYPOGRAPHY & ADVANCED CURVES */}
        {/* ========================================================= */}
        {activeTab === 'text' && (
          <div className="space-y-5">
            {/* Header with signature accent */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1 h-4 bg-indigo-500 rounded"></span>
                <span>{t('controlPanel.textTab.title')}</span>
              </h3>
              <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showText}
                  onChange={(e) => updateConfig({ showText: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-0"
                />
                <span>{t('common.enabled')}</span>
              </label>
            </div>

            {/* The name is not only type on the canvas: it names every exported
                file and heads the guides in the package. Someone who uploaded a
                finished logo has the text layer off, and hiding the field with
                it left them no way to name their own download. */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {t('controlPanel.textTab.brandName')}
              </label>
              <input
                type="text"
                value={config.text}
                onChange={(e) => updateConfig({ text: e.target.value })}
                placeholder={t('controlPanel.textTab.brandNamePlaceholder')}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-base font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
              />
              {!config.showText && (
                <p className="text-[11px] text-slate-500">
                  {t('controlPanel.textTab.namesFilesOnly')}
                </p>
              )}
            </div>

            {config.showText && (
              <div className="space-y-4">
                {/* Font Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {t('controlPanel.textTab.fontFamily')}
                  </label>
                  <select
                    value={config.fontFamily}
                    onChange={(e) => updateConfig({ fontFamily: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
                  >
                    {FONTS_LIST.map((font) => (
                      <option key={font.id} value={font.id}>
                        {t(font.nameKey)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size & Weight */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                      <span>{t('controlPanel.textTab.fontSize')}</span>
                      <span className="font-mono font-semibold">{config.fontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="16"
                      max="110"
                      value={config.fontSize}
                      onChange={(e) => updateConfig({ fontSize: Number(e.target.value) })}
                      className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                      <span>{t('controlPanel.textTab.fontWeight')}</span>
                      <span className="font-semibold">{config.fontWeight}</span>
                    </div>
                    <select
                      value={config.fontWeight}
                      onChange={(e) => updateConfig({ fontWeight: Number(e.target.value) || e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
                    >
                      <option value="400">Normal 400</option>
                      <option value="600">SemiBold 600</option>
                      <option value="700">Bold 700</option>
                      <option value="800">ExtraBold 800</option>
                      <option value="900">Black 900</option>
                    </select>
                  </div>
                </div>

                {/* Letter Spacing & Transform */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                      <span>{t('controlPanel.textTab.letterSpacing')}</span>
                      <span className="font-mono font-semibold">{config.letterSpacing}px</span>
                    </div>
                    <input
                      type="range"
                      min="-2"
                      max="20"
                      value={config.letterSpacing}
                      onChange={(e) => updateConfig({ letterSpacing: Number(e.target.value) })}
                      className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                      <span>{t('controlPanel.textTab.textTransform')}</span>
                    </div>
                    <select
                      value={config.textTransform || 'none'}
                      onChange={(e) => updateConfig({ textTransform: e.target.value as any })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
                    >
                      <option value="none">{t('controlPanel.textTab.caseNormal')}</option>
                      <option value="uppercase">{t('controlPanel.textTab.caseUppercase')}</option>
                      <option value="capitalize">{t('controlPanel.textTab.caseCapitalize')}</option>
                    </select>
                  </div>
                </div>

                {/* Text Color with Advanced Color Picker */}
                <AdvancedColorPicker
                  label={t('controlPanel.textTab.textColor')}
                  color={config.textColor}
                  onChange={(c) => updateConfig({ textColor: c })}
                />

                {/* Text Curve Manipulation */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {t('controlPanel.textTab.curvedText')}
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'straight', nameAr: t('controlPanel.curveStraight'), nameEn: 'Straight' },
                      { id: 'arch-up', nameAr: t('controlPanel.curveArchUp'), nameEn: 'Arch Up' },
                      { id: 'arch-down', nameAr: t('controlPanel.curveArchDown'), nameEn: 'Arch Down' },
                      { id: 'wave', nameAr: t('controlPanel.curveWave'), nameEn: 'Wave' },
                    ].map((curve) => (
                      <button
                        key={curve.id}
                        type="button"
                        onClick={() => updateConfig({ textCurve: curve.id as any })}
                        className={`py-1.5 text-xs rounded-lg border font-bold transition-all shadow-2xs cursor-pointer ${
                          config.textCurve === curve.id
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {isAr ? curve.nameAr : curve.nameEn}
                      </button>
                    ))}
                  </div>

                  {config.textCurve !== 'straight' && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-xs text-slate-500 font-medium">
                        <span>{t('controlPanel.textTab.curveRadius')}</span>
                        <span className="font-mono font-semibold">{config.textCurveRadius || 180}px</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="300"
                        value={config.textCurveRadius || 180}
                        onChange={(e) => updateConfig({ textCurveRadius: Number(e.target.value) })}
                        className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Text Stroke / Outline & Shadow */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">{t('common.border')}</span>
                    <input
                      type="checkbox"
                      checked={config.textStroke}
                      onChange={(e) => updateConfig({ textStroke: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                  </div>

                  {config.textStroke && (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-500 font-medium">
                          <span>{t('controlPanel.colorsTab.borderWidth')}</span>
                          <span className="font-mono">{config.textStrokeWidth || 2}px</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="8"
                          value={config.textStrokeWidth || 2}
                          onChange={(e) => updateConfig({ textStrokeWidth: Number(e.target.value) })}
                          className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
                        />
                      </div>

                      <AdvancedColorPicker
                        label={t('controlPanel.colorsTab.borderColor')}
                        color={config.textStrokeColor || '#000000'}
                        onChange={(c) => updateConfig({ textStrokeColor: c })}
                        showShades={false}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tagline / Subtitle Section */}
            <div className="space-y-4 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t('controlPanel.textTab.tagline')}
                </span>
                <input
                  type="checkbox"
                  checked={config.showTagline}
                  onChange={(e) => updateConfig({ showTagline: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {config.showTagline && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={config.tagline}
                    onChange={(e) => updateConfig({ tagline: e.target.value })}
                    placeholder={t('controlPanel.textTab.taglinePlaceholder')}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-500 font-medium">{t('controlPanel.textTab.taglineFontSize')}</span>
                      <input
                        type="range"
                        min="10"
                        max="32"
                        value={config.taglineFontSize}
                        onChange={(e) => updateConfig({ taglineFontSize: Number(e.target.value) })}
                        className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-500 font-medium">{t('controlPanel.iconTab.offsetY')}</span>
                      <input
                        type="range"
                        min="-50"
                        max="100"
                        value={config.taglineOffsetY}
                        onChange={(e) => updateConfig({ taglineOffsetY: Number(e.target.value) })}
                        className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
                      />
                    </div>
                  </div>

                  <AdvancedColorPicker
                    label={t('controlPanel.textTab.taglineColor')}
                    color={config.taglineColor}
                    onChange={(c) => updateConfig({ taglineColor: c })}
                    showShades={false}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: BACKGROUND & SHAPE MASK & PALETTES */}
        {/* ========================================================= */}
        {activeTab === 'bg' && (
          <div className="space-y-5">
            {/* Header with signature accent */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1 h-4 bg-indigo-500 rounded"></span>
                <span>{t('controlPanel.colorsTab.title')}</span>
              </h3>
            </div>

            {/* Complementary Palette Generator with 4 Suggested Secondary Colors */}
            <ComplementaryPaletteBar config={config} onChange={updateConfig} language={language} />

            {/* Shape Mask Picker */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {t('controlPanel.colorsTab.shapeMask')}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'squircle', nameAr: t('controlPanel.shapeSquircleIos'), nameEn: 'Squircle' },
                  { id: 'circle', nameAr: t('controlPanel.shapeCircle'), nameEn: 'Circle' },
                  { id: 'shield', nameAr: t('controlPanel.shapeShield'), nameEn: 'Shield' },
                  { id: 'hexagon', nameAr: t('controlPanel.shapeHexagon'), nameEn: 'Hexagon' },
                  { id: 'octagon', nameAr: t('controlPanel.shapeOctagon'), nameEn: 'Octagon' },
                  { id: 'badge', nameAr: t('controlPanel.shapeBadge'), nameEn: 'Badge Star' },
                  { id: 'diamond', nameAr: t('controlPanel.shapeDiamond'), nameEn: 'Diamond' },
                  { id: 'square', nameAr: t('controlPanel.shapeSquare'), nameEn: 'Square' },
                  { id: 'pill', nameAr: t('controlPanel.shapePill'), nameEn: 'Pill' },
                ].map((shape) => (
                  <button
                    key={shape.id}
                    onClick={() => updateConfig({ shapeMask: shape.id as ShapeMask })}
                    className={`py-2 px-1 text-xs rounded-lg border font-semibold truncate transition-all shadow-2xs cursor-pointer ${
                      config.shapeMask === shape.id
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {isAr ? shape.nameAr : shape.nameEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Color Palette Generator (AI Harmonies) */}
            <div className="pt-2">
              <SmartPaletteGenerator
                config={config}
                onChange={updateConfig}
              />
            </div>

            {/* Quick Curated Color Palettes */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {t('controlPanel.curatedPalettes')}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {POPULAR_PALETTES.map((pal) => (
                  <button
                    key={pal.name}
                    onClick={() =>
                      updateConfig({
                        bgColor1: pal.c1,
                        bgColor2: pal.c2,
                        iconColor: pal.icon1,
                        iconColor2: pal.icon2,
                        bgType: 'linear',
                      })
                    }
                    className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 text-left transition-all shadow-2xs cursor-pointer"
                  >
                    <div className="flex -space-x-1">
                      <div className="w-3.5 h-3.5 rounded-full border border-white" style={{ backgroundColor: pal.c1 }} />
                      <div className="w-3.5 h-3.5 rounded-full border border-white" style={{ backgroundColor: pal.icon1 }} />
                    </div>
                    <span className="text-[11px] text-slate-700 font-bold truncate">{pal.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Background Type */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t('controlPanel.colorsTab.bgType')}
                </span>
                <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                  {[
                    { id: 'transparent', labelKey: 'controlPanel.colorsTab.bgTransparent' },
                    { id: 'solid', labelKey: 'controlPanel.colorsTab.bgSolid' },
                    { id: 'linear', labelKey: 'controlPanel.colorsTab.bgLinear' },
                    { id: 'radial', labelKey: 'controlPanel.colorsTab.bgRadial' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => updateConfig({ bgType: item.id as BackgroundType })}
                      className={`px-2 py-1 text-[11px] rounded-md font-bold transition-all cursor-pointer ${
                        config.bgType === item.id
                          ? item.id === 'transparent'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title={t(item.labelKey)}
                    >
                      {t(item.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {config.bgType !== 'transparent' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <AdvancedColorPicker
                      label={t('controlPanel.colorsTab.primaryBgColor')}
                      color={config.bgColor1}
                      onChange={(c) => updateConfig({ bgColor1: c })}
                    />

                    {(config.bgType === 'linear' || config.bgType === 'radial') && (
                      <AdvancedColorPicker
                        label={t('controlPanel.colorsTab.secondaryBgColor')}
                        color={config.bgColor2}
                        onChange={(c) => updateConfig({ bgColor2: c })}
                      />
                    )}
                  </div>

                  {config.bgType === 'linear' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500 font-medium">
                        <span>{t('controlPanel.colorsTab.gradientAngle')}</span>
                        <span className="font-mono font-semibold">{config.bgGradientAngle}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={config.bgGradientAngle}
                        onChange={(e) => updateConfig({ bgGradientAngle: Number(e.target.value) })}
                        className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pattern Overlay */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {t('controlPanel.colorsTab.patternOverlay')}
              </span>
              <div className="grid grid-cols-5 gap-1">
                {(['none', 'dots', 'grid', 'stripes', 'waves'] as PatternType[]).map((pat) => (
                  <button
                    key={pat}
                    onClick={() => updateConfig({ pattern: pat })}
                    className={`py-1.5 text-xs rounded-lg border font-semibold capitalize transition-all shadow-2xs cursor-pointer ${
                      config.pattern === pat
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pat}
                  </button>
                ))}
              </div>
            </div>

            {/* Border Width & Color */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>{t('controlPanel.colorsTab.borderWidth')}</span>
                  <span className="font-mono font-semibold">{config.borderWidth}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="16"
                  value={config.borderWidth}
                  onChange={(e) => updateConfig({ borderWidth: Number(e.target.value) })}
                  className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
                />
              </div>

              {config.borderWidth > 0 && (
                <AdvancedColorPicker
                  label={t('controlPanel.colorsTab.borderColor')}
                  color={config.borderColor}
                  onChange={(c) => updateConfig({ borderColor: c })}
                  showShades={false}
                />
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: LAYOUT & EFFECTS */}
        {/* ========================================================= */}
        {activeTab === 'layout' && (
          <div className="space-y-5">
            {/* Header with signature accent */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1 h-4 bg-indigo-500 rounded"></span>
                <span>{t('controlPanel.layoutTab.title')}</span>
              </h3>
            </div>

            {/* Layout Presets */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {t('controlPanel.layoutTab.presetLayouts')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'icon-top', nameAr: t('controlPanel.layoutIconTop'), nameEn: 'Icon Top + Text' },
                  { id: 'icon-left', nameAr: t('controlPanel.layoutIconLeft'), nameEn: 'Icon Left + Text' },
                  { id: 'icon-only', nameAr: t('controlPanel.layoutIconOnly'), nameEn: 'Icon Only (Favicon)' },
                  { id: 'text-only', nameAr: t('controlPanel.layoutTextOnly'), nameEn: 'Typography Only' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => updateConfig({ layout: item.id as LayoutStyle })}
                    className={`p-2.5 text-xs rounded-xl border font-bold text-left transition-all shadow-2xs cursor-pointer ${
                      config.layout === item.id
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {isAr ? item.nameAr : item.nameEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Decorative Accent Ring */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t('controlPanel.decorativeOrbitRing')}
                </span>
                <input
                  type="checkbox"
                  checked={config.showRing}
                  onChange={(e) => updateConfig({ showRing: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {config.showRing && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                      <span>{t('controlPanel.ringRadius')}</span>
                      <span className="font-mono font-semibold">{config.ringRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="240"
                      value={config.ringRadius}
                      onChange={(e) => updateConfig({ ringRadius: Number(e.target.value) })}
                      className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">{t('controlPanel.dashedLine')}</span>
                    <input
                      type="checkbox"
                      checked={config.ringDash}
                      onChange={(e) => updateConfig({ ringDash: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Included Favicon Bundle Banner */}
            <div className="mt-4 p-4 bg-slate-900 rounded-xl text-white shadow-md space-y-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-indigo-400" />
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  {t('faviconModal.sizesList')}
                </h4>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['16px', '32px', '48px', '64px', '128px', '180px (iOS)', '192px (PWA)', '256px', '512px'].map((sz) => (
                  <span key={sz} className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold border border-slate-700/60">
                    {sz}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: WATERMARK & ASSET PROTECTION */}
        {/* ========================================================= */}
        {activeTab === 'watermark' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1 h-4 bg-indigo-500 rounded"></span>
                <span>{t('controlPanel.watermarkTab.title')}</span>
              </h3>
            </div>

            <WatermarkControls config={config} onChange={updateConfig} language={language} />
          </div>
        )}
      </div>
    </div>
  );
};
