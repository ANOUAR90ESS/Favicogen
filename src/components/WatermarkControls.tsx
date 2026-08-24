import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Stamp,
  Type,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';
import {
  LogoConfig,
  SupportedLanguage,
  WatermarkConfig,
  WatermarkPosition,
} from '../types';
import { AdvancedColorPicker } from './AdvancedColorPicker';
import { intakeImageFile, isIntakeFailure, ACCEPT_ATTRIBUTE } from '../utils/imageIntake';

interface WatermarkControlsProps {
  config: LogoConfig;
  onChange: (patch: Partial<LogoConfig>) => void;
  language?: SupportedLanguage;
}

const WATERMARK_PRESET_TEXTS = [
  'CONFIDENTIAL',
  'SAMPLE / عينة',
  '© COPYRIGHT',
  'DRAFT',
  'PROTOTYPE',
  'DO NOT COPY',
];

export const WatermarkControls: React.FC<WatermarkControlsProps> = ({
  config,
  onChange,
  language,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const watermark: WatermarkConfig = config.watermark || {
    enabled: false,
    type: 'text',
    text: 'CONFIDENTIAL',
    opacity: 0.25,
    position: 'bottom-right',
    size: 24,
    rotation: 0,
    color: '#ffffff',
    fontFamily: 'Cairo',
    fontSize: 18,
  };

  const updateWatermark = (patch: Partial<WatermarkConfig>) => {
    onChange({
      watermark: {
        ...watermark,
        ...patch,
      },
    });
  };

  const handleWatermarkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    // A watermark is drawn small, so it never needs more than 512px.
    const intake = await intakeImageFile(file, { maxDimension: 512 });
    if (isIntakeFailure(intake)) return;

    updateWatermark({
      type: 'custom-image',
      customImageSrc: intake.dataUrl,
      enabled: true,
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 shadow-2xs">
      {/* Master Toggle Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              watermark.enabled ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
            } transition-colors shadow-2xs`}
          >
            <Stamp className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>{t('controlPanel.watermarkTab.title')}</span>
              {watermark.enabled && (
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5">
                  ACTIVE
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-500">
              {t('controlPanel.watermarkTab.subtitle')}
            </p>
          </div>
        </div>

        {/* Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={watermark.enabled}
            onChange={(e) => updateWatermark({ enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      {watermark.enabled && (
        <div className="space-y-4 animate-in fade-in duration-200 pt-1">
          {/* Watermark Type */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {t('controlPanel.watermarkTab.type')}
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => updateWatermark({ type: 'text' })}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md font-bold transition-all ${
                  watermark.type === 'text'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Type className="h-3.5 w-3.5" />
                <span>{t('controlPanel.watermarkTab.typeText')}</span>
              </button>

              <button
                type="button"
                onClick={() => updateWatermark({ type: 'logo' })}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md font-bold transition-all ${
                  watermark.type === 'logo'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>{t('controlPanel.watermarkTab.typeLogo')}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md font-bold transition-all ${
                  watermark.type === 'custom-image'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>{t('controlPanel.watermarkTab.typeCopyright')}</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_ATTRIBUTE}
              onChange={(e) => void handleWatermarkImageUpload(e)}
              className="hidden"
            />
          </div>

          {/* Watermark Content: Text Input & Presets */}
          {watermark.type === 'text' && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {t('controlPanel.watermarkTab.textLabel')}
              </label>
              <input
                type="text"
                value={watermark.text}
                onChange={(e) => updateWatermark({ text: e.target.value })}
                placeholder={t('controlPanel.watermarkTab.textPlaceholder')}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
              />

              <div className="flex flex-wrap gap-1">
                {WATERMARK_PRESET_TEXTS.map((txt) => (
                  <button
                    key={txt}
                    type="button"
                    onClick={() => updateWatermark({ text: txt })}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 font-semibold border border-slate-200 transition-colors"
                  >
                    {txt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Watermark Position Matrix & Tile mode */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {t('controlPanel.watermarkTab.position')}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'top-left', labelKey: 'controlPanel.watermarkTab.positions.topLeft' },
                { id: 'center', labelKey: 'controlPanel.watermarkTab.positions.center' },
                { id: 'top-right', labelKey: 'controlPanel.watermarkTab.positions.topRight' },
                { id: 'bottom-left', labelKey: 'controlPanel.watermarkTab.positions.bottomLeft' },
                { id: 'bottom-right', labelKey: 'controlPanel.watermarkTab.positions.bottomRight' },
                { id: 'tile', labelKey: 'controlPanel.watermarkTab.positions.tile' },
              ].map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => updateWatermark({ position: pos.id as WatermarkPosition })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all text-center truncate shadow-2xs ${
                    watermark.position === pos.id
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t(pos.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-600 font-medium">
              <span>{t('controlPanel.watermarkTab.opacity')}</span>
              <span className="font-mono font-bold text-indigo-600">
                {Math.round((watermark.opacity ?? 0.25) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={Math.round((watermark.opacity ?? 0.25) * 100)}
              onChange={(e) => updateWatermark({ opacity: Number(e.target.value) / 100 })}
              className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
            />
          </div>

          {/* Rotation & Size */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>{t('controlPanel.watermarkTab.rotation')}</span>
                <span className="font-mono font-bold text-slate-700">
                  {watermark.rotation ?? 0}°
                </span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={watermark.rotation ?? 0}
                onChange={(e) => updateWatermark({ rotation: Number(e.target.value) })}
                className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>{t('controlPanel.watermarkTab.size')}</span>
                <span className="font-mono font-bold text-slate-700">
                  {watermark.fontSize ?? 18}px
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="72"
                value={watermark.fontSize ?? 18}
                onChange={(e) =>
                  updateWatermark({
                    fontSize: Number(e.target.value),
                    size: Number(e.target.value) * 2,
                  })
                }
                className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
              />
            </div>
          </div>

          {/* Text Color for Watermark */}
          {watermark.type === 'text' && (
            <div className="pt-2 border-t border-slate-100">
              <AdvancedColorPicker
                label={t('controlPanel.watermarkTab.color')}
                color={watermark.color || '#ffffff'}
                onChange={(c) => updateWatermark({ color: c })}
                language={language || (isAr ? 'ar' : 'en')}
                showShades={false}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
