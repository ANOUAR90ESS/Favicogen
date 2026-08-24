import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Check,
  Palette,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { LogoConfig, SupportedLanguage } from '../types';
import { generateHarmonies, ColorHarmony, getContrastRatio } from '../utils/paletteGenerator';

interface SmartPaletteGeneratorProps {
  config: LogoConfig;
  onChange: (patch: Partial<LogoConfig>) => void;
  language: SupportedLanguage;
}

export const SmartPaletteGenerator: React.FC<SmartPaletteGeneratorProps> = ({
  config,
  onChange,
  language,
}) => {
  const isAr = language === 'ar';
  const [baseColorSource, setBaseColorSource] = useState<'primary-bg' | 'icon' | 'text' | 'custom'>('primary-bg');
  const [customBaseColor, setCustomBaseColor] = useState<string>('#4338ca');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [appliedHarmonyId, setAppliedHarmonyId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Active base color
  const activeBaseColor = useMemo(() => {
    switch (baseColorSource) {
      case 'primary-bg':
        return config.bgColor1 || '#0f172a';
      case 'icon':
        return config.iconColor || '#38bdf8';
      case 'text':
        return config.textColor || '#ffffff';
      case 'custom':
      default:
        return customBaseColor;
    }
  }, [baseColorSource, config.bgColor1, config.iconColor, config.textColor, customBaseColor]);

  // Generated Harmonies
  const harmonies = useMemo(() => {
    return generateHarmonies(activeBaseColor);
  }, [activeBaseColor]);

  // Apply harmony
  const handleApplyHarmony = (harmony: ColorHarmony) => {
    onChange({
      bgColor1: harmony.suggestedUsage.bg1,
      bgColor2: harmony.suggestedUsage.bg2,
      bgType: 'linear',
      iconColor: harmony.suggestedUsage.icon1,
      iconColor2: harmony.suggestedUsage.icon2,
      textColor: harmony.suggestedUsage.text,
      borderColor: harmony.suggestedUsage.accent,
    });
    setAppliedHarmonyId(harmony.id);
    setTimeout(() => setAppliedHarmonyId(null), 2200);
  };

  const handleCopy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      setTimeout(() => setCopiedHex(null), 1800);
    } catch (e) {
      console.error('Failed to copy hex:', e);
    }
  };

  return (
    <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 p-3.5 space-y-3 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-2xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>{isAr ? 'مولد لوحات الألوان الذكي' : 'Smart Color Palette Generator'}</span>
              <span className="rounded bg-indigo-100 text-indigo-800 text-[9px] font-black px-1.5 py-0.2">
                AI HARMONY
              </span>
            </h4>
            <p className="text-[10px] text-slate-500">
              {isAr
                ? 'يقترح لوحات وتدرجات متكاملة ومكملة بناءً على لون الشعار'
                : 'Suggests complementary color palettes based on active brand hue'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3 pt-1 animate-in fade-in duration-150">
          {/* Base Color Source Switcher */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold">
              <span>{isAr ? 'اللون الأساسي المعتمد:' : 'Base Color Anchor:'}</span>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs"
                  style={{ backgroundColor: activeBaseColor }}
                />
                <span className="font-mono text-[10px] text-slate-700 font-bold">{activeBaseColor}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1 bg-slate-100/90 p-1 rounded-lg border border-slate-200 text-[10px]">
              <button
                type="button"
                onClick={() => setBaseColorSource('primary-bg')}
                className={`py-1 px-1 rounded-md font-bold transition-all truncate ${
                  baseColorSource === 'primary-bg'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isAr ? 'الخلفية' : 'Background'}
              </button>
              <button
                type="button"
                onClick={() => setBaseColorSource('icon')}
                className={`py-1 px-1 rounded-md font-bold transition-all truncate ${
                  baseColorSource === 'icon'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isAr ? 'الأيقونة' : 'Icon'}
              </button>
              <button
                type="button"
                onClick={() => setBaseColorSource('text')}
                className={`py-1 px-1 rounded-md font-bold transition-all truncate ${
                  baseColorSource === 'text'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isAr ? 'النص' : 'Text'}
              </button>
              <label
                className={`py-1 px-1 rounded-md font-bold transition-all truncate text-center cursor-pointer flex items-center justify-center gap-1 ${
                  baseColorSource === 'custom'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{isAr ? 'مخصص' : 'Custom'}</span>
                <input
                  type="color"
                  value={customBaseColor}
                  onChange={(e) => {
                    setCustomBaseColor(e.target.value);
                    setBaseColorSource('custom');
                  }}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          {/* Harmonies List */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
            {harmonies.map((harmony) => {
              const isApplied = appliedHarmonyId === harmony.id;
              const contrastOnBg = getContrastRatio(harmony.suggestedUsage.bg1, harmony.suggestedUsage.text);

              return (
                <div
                  key={harmony.id}
                  className="group relative rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all space-y-2"
                >
                  {/* Harmony Title & Quick Apply */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-900 truncate">
                          {isAr ? harmony.nameAr : harmony.nameEn}
                        </span>
                        {contrastOnBg >= 4.5 && (
                          <span className="rounded bg-emerald-50 text-emerald-700 text-[8px] font-bold px-1 border border-emerald-200 shrink-0">
                            WCAG AA
                          </span>
                        )}
                      </div>
                      <p className="text-[9.5px] text-slate-500 truncate">
                        {isAr ? harmony.descriptionAr : harmony.descriptionEn}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyHarmony(harmony)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-2xs transition-all shrink-0 ${
                        isApplied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>{isAr ? 'تم التطبيق!' : 'Applied'}</span>
                        </>
                      ) : (
                        <>
                          <Palette className="h-3 w-3" />
                          <span>{isAr ? 'تطبيق' : 'Apply'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Swatches Row */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {harmony.colors.map((c, i) => (
                      <button
                        key={`${harmony.id}-${c}-${i}`}
                        type="button"
                        onClick={() => handleCopy(c)}
                        title={`Click to copy: ${c}`}
                        className="group/chip relative flex flex-col items-center justify-center rounded-lg border border-slate-200/80 p-1 bg-slate-50 hover:bg-slate-100 transition-all"
                      >
                        <div
                          className="h-6 w-full rounded-md shadow-inner border border-black/10 transition-transform group-hover/chip:scale-105"
                          style={{ backgroundColor: c }}
                        />
                        <span className="font-mono text-[8.5px] font-semibold text-slate-600 mt-1 uppercase">
                          {copiedHex === c ? 'COPIED!' : c.slice(0, 7)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
