import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Wand2,
  Sparkles,
  Check,
  RefreshCw,
} from 'lucide-react';
import { LogoConfig, SupportedLanguage } from '../types';
import {
  generate4ComplementaryColors,
  ComplementaryColorOption,
} from '../utils/paletteGenerator';

interface ComplementaryPaletteBarProps {
  config: LogoConfig;
  onChange: (patch: Partial<LogoConfig>) => void;
  language?: SupportedLanguage;
}

export const ComplementaryPaletteBar: React.FC<ComplementaryPaletteBarProps> = ({
  config,
  onChange,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [variationSeed, setVariationSeed] = useState<number>(0);
  const [appliedColorHex, setAppliedColorHex] = useState<string | null>(null);
  const [applyTarget, setApplyTarget] = useState<'all' | 'bgGradient' | 'icon' | 'border'>('all');

  // Derive the primary anchor color from current logo config
  const primaryColor = useMemo(() => {
    return config.bgColor1 || config.iconColor || '#0f172a';
  }, [config.bgColor1, config.iconColor]);

  // Compute the 4 complementary colors
  const complementaryColors = useMemo(() => {
    return generate4ComplementaryColors(primaryColor, variationSeed);
  }, [primaryColor, variationSeed]);

  // When primary color changes, reset applied color state
  useEffect(() => {
    setAppliedColorHex(null);
  }, [primaryColor]);

  // Handle "Generate Palette" button click
  const handleGeneratePalette = () => {
    setVariationSeed((prev) => prev + 1);
  };

  // Handle clicking one of the 4 complementary colors to update secondary theme
  const handleApplyComplementaryColor = (option: ComplementaryColorOption) => {
    const hex = option.hex;
    setAppliedColorHex(hex);

    const patch: Partial<LogoConfig> = {};

    if (applyTarget === 'all' || applyTarget === 'bgGradient') {
      patch.bgColor2 = hex;
      if (config.bgType === 'solid' || config.bgType === 'transparent') {
        patch.bgType = 'linear';
      }
    }

    if (applyTarget === 'all' || applyTarget === 'icon') {
      patch.iconColor2 = hex;
      patch.iconOutlineColor = hex;
    }

    if (applyTarget === 'all' || applyTarget === 'border') {
      patch.borderColor = hex;
      patch.ringColor = hex;
      patch.innerGlowColor = hex;
    }

    if (applyTarget === 'all') {
      patch.textColor2 = hex;
    }

    onChange(patch);
  };

  return (
    <div
      id="generate-palette-container"
      className="rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-50/70 via-white to-slate-50 p-4 space-y-3.5 shadow-sm"
    >
      {/* Header & Primary Color Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-indigo-100/90">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shrink-0">
            <Wand2 className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                {t('controlPanel.complementary.title')}
              </h4>
              <span className="rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-black px-2 py-0.5 border border-indigo-200 uppercase">
                {t('controlPanel.complementary.badge')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {t('controlPanel.complementary.subtitle')}
            </p>
          </div>
        </div>

        {/* The 'Generate Palette' Button */}
        <button
          id="btn-generate-palette"
          type="button"
          onClick={handleGeneratePalette}
          className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-sm hover:bg-indigo-700 active:scale-95 transition-all shrink-0 cursor-pointer"
          title={t('controlPanel.complementary.generateBtn')}
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
          <span>{t('controlPanel.complementary.generateBtn')}</span>
          <RefreshCw className="h-3 w-3 opacity-70 ml-0.5" />
        </button>
      </div>

      {/* Primary Color Badge & Secondary Target Scope Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-semibold">
            {t('controlPanel.complementary.primaryColorLabel')}
          </span>
          <div
            className="w-4 h-4 rounded-full border border-slate-300 shadow-inner"
            style={{ backgroundColor: primaryColor }}
          />
          <span className="font-mono text-[11px] font-bold text-slate-800 uppercase">
            {primaryColor}
          </span>
        </div>

        {/* Target Scope Pill */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-0.5 rounded-lg border border-slate-200 text-[10px] font-semibold text-slate-600">
          <span className="px-1.5 text-slate-400 text-[9px] uppercase font-bold">
            {t('controlPanel.complementary.targetLabel')}
          </span>
          <button
            type="button"
            onClick={() => setApplyTarget('all')}
            className={`px-2 py-0.5 rounded-md transition-all ${
              applyTarget === 'all'
                ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                : 'hover:text-slate-900'
            }`}
          >
            {t('controlPanel.complementary.targetAll')}
          </button>
          <button
            type="button"
            onClick={() => setApplyTarget('bgGradient')}
            className={`px-2 py-0.5 rounded-md transition-all ${
              applyTarget === 'bgGradient'
                ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                : 'hover:text-slate-900'
            }`}
          >
            {t('controlPanel.complementary.targetGradient')}
          </button>
          <button
            type="button"
            onClick={() => setApplyTarget('icon')}
            className={`px-2 py-0.5 rounded-md transition-all ${
              applyTarget === 'icon'
                ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                : 'hover:text-slate-900'
            }`}
          >
            {t('controlPanel.complementary.targetIcon')}
          </button>
        </div>
      </div>

      {/* 4 Complementary Color Suggestion Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {complementaryColors.map((item) => {
          const isApplied =
            appliedColorHex === item.hex ||
            config.bgColor2?.toLowerCase() === item.hex.toLowerCase() ||
            config.iconColor2?.toLowerCase() === item.hex.toLowerCase();

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleApplyComplementaryColor(item)}
              className={`group relative flex flex-col items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer select-none ${
                isApplied
                  ? 'bg-indigo-50/80 border-indigo-500 shadow-md ring-2 ring-indigo-400/30'
                  : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-sm hover:-translate-y-0.5'
              }`}
              title={`${isAr ? item.nameAr : item.nameEn} (${item.hex})`}
            >
              {/* Active / Check Badge */}
              {isApplied && (
                <div className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white shadow-2xs animate-in zoom-in-50 duration-150">
                  <Check className="h-2.5 w-2.5" />
                </div>
              )}

              {/* Color Swatch Circle */}
              <div className="relative mb-2 mt-1">
                <div
                  className="w-10 h-10 rounded-full border-2 border-white shadow-md group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: item.hex }}
                />
                <div
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-white shadow-2xs"
                  style={{ backgroundColor: primaryColor }}
                />
              </div>

              {/* Color Hex & Name */}
              <div className="w-full text-center space-y-0.5">
                <span className="font-mono text-xs font-black text-slate-800 tracking-tight block uppercase">
                  {item.hex}
                </span>
                <span className="text-[10px] font-bold text-slate-600 truncate block">
                  {isAr ? item.nameAr : item.nameEn}
                </span>
                <span className="text-[8.5px] font-medium text-slate-400 truncate block">
                  {isAr ? item.harmonyTypeAr : item.harmonyTypeEn}
                </span>
              </div>

              {/* Click to Apply indicator */}
              <div
                className={`mt-2 w-full py-1 rounded-md text-[9px] font-extrabold text-center transition-colors ${
                  isApplied
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-800'
                }`}
              >
                {isApplied
                  ? t('controlPanel.complementary.appliedBtn')
                  : t('controlPanel.complementary.applySecondaryBtn')}
              </div>
            </button>
          );
        })}
      </div>

      {/* Applied Feedback Bar */}
      {appliedColorHex && (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-xs text-emerald-800 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="text-[11px] font-bold">
              {t('controlPanel.complementary.applySuccess', { color: appliedColorHex })}
            </span>
          </div>
          <div
            className="w-3.5 h-3.5 rounded-full border border-emerald-300"
            style={{ backgroundColor: appliedColorHex }}
          />
        </div>
      )}
    </div>
  );
};
