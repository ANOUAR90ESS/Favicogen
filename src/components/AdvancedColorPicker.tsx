import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Sliders,
  } from 'lucide-react';
import { SavedColorPalette } from '../types';

interface AdvancedColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
  showShades?: boolean;
}

// Convert HEX to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean || '000000', 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Convert RGB to HEX
function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
  );
}

// Convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Convert HSL to HEX
function hslToHex(h: number, s: number, l: number): string {
  h /= 360;
  s /= 100;
  l /= 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return rgbToHex(r * 255, g * 255, b * 255);
}

// Generate 8 shades/tints of given color
function generateTintsAndShades(hex: string): string[] {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const steps = [15, 30, 45, 60, 75, 85, 95];
  return steps.map((l) => hslToHex(hsl.h, hsl.s, l));
}

// Generate color harmonies
function generateHarmonies(hex: string): { nameKey: string; colors: string[] }[] {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return [
    {
      nameKey: 'colorPicker.harmonyComplementary',
      colors: [hex, hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l)],
    },
    {
      nameKey: 'colorPicker.harmonyTriadic',
      colors: [
        hex,
        hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l),
      ],
    },
    {
      nameKey: 'colorPicker.harmonyAnalogous',
      colors: [
        hslToHex((hsl.h + 330) % 360, hsl.s, hsl.l),
        hex,
        hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l),
      ],
    },
  ];
}

const STORAGE_PALETTES_KEY = 'logo_studio_saved_palettes';

export const AdvancedColorPicker: React.FC<AdvancedColorPickerProps> = ({
  label,
  color,
  onChange,
  showShades = true,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [savedPalettes, setSavedPalettes] = useState<SavedColorPalette[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_PALETTES_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // A corrupt saved palette is not worth surfacing; fall back to defaults.
    }
    return [
      { id: '1', name: 'Cyber Indigo', colors: ['#4338ca', '#312e81', '#38bdf8', '#818cf8'] },
      { id: '2', name: 'Royal Gold', colors: ['#18140c', '#facc15', '#ca8a04', '#fef08a'] },
      { id: '3', name: 'Emerald Pure', colors: ['#064e3b', '#34d399', '#10b981', '#a7f3d0'] },
    ];
  });

  const rgb = hexToRgb(color || '#4338ca');
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const shades = generateTintsAndShades(color || '#4338ca');
  const harmonies = generateHarmonies(color || '#4338ca');

  const handleSavePalette = () => {
    const newPal: SavedColorPalette = {
      id: 'pal_' + Date.now(),
      name: `${t('colorPicker.palette')} #${savedPalettes.length + 1}`,
      colors: [color, ...shades.slice(0, 3)],
    };
    const updated = [newPal, ...savedPalettes];
    setSavedPalettes(updated);
    localStorage.setItem(STORAGE_PALETTES_KEY, JSON.stringify(updated));
  };

  const handleDeletePalette = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedPalettes.filter((p) => p.id !== id);
    setSavedPalettes(updated);
    localStorage.setItem(STORAGE_PALETTES_KEY, JSON.stringify(updated));
  };

  return (
    <div className="space-y-1.5 relative">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          {label}
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          <Sliders className="h-3 w-3" />
          <span>{isOpen ? (t('colorPicker.close')) : t('colorPicker.colorWheel')}</span>
        </button>
      </div>

      {/* Main Input Row */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1.5 shadow-2xs">
        <input
          type="color"
          value={color || '#4338ca'}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent shrink-0"
        />
        <input
          type="text"
          value={color || '#4338ca'}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-xs font-mono font-bold text-slate-800 focus:outline-none uppercase"
        />
        <div
          className="w-5 h-5 rounded-full border border-slate-300 shrink-0 shadow-2xs"
          style={{ backgroundColor: color || '#4338ca' }}
        />
      </div>

      {/* Quick Swatches / Tints Row */}
      {showShades && (
        <div className="flex items-center gap-1 pt-1">
          {shades.map((shade, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(shade)}
              className="flex-1 h-4 rounded-xs border border-slate-200/80 hover:scale-110 transition-transform"
              style={{ backgroundColor: shade }}
              title={shade}
            />
          ))}
        </div>
      )}

      {/* Advanced Color Wheel & Palettes Modal / Flyout */}
      {isOpen && (
        <div className="mt-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-md animate-in fade-in-50 duration-150">
          {/* HSL Sliders */}
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                <span>{t('colorPicker.hue')}</span>
                <span className="font-mono">{hsl.h}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={hsl.h}
                onChange={(e) => onChange(hslToHex(Number(e.target.value), hsl.s, hsl.l))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                  <span>{t('colorPicker.saturation')}</span>
                  <span className="font-mono">{hsl.s}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={hsl.s}
                  onChange={(e) => onChange(hslToHex(hsl.h, Number(e.target.value), hsl.l))}
                  className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                  <span>{t('colorPicker.lightness')}</span>
                  <span className="font-mono">{hsl.l}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={hsl.l}
                  onChange={(e) => onChange(hslToHex(hsl.h, hsl.s, Number(e.target.value)))}
                  className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Color Harmonies */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              {t('colorPicker.harmonies')}
            </span>
            <div className="space-y-1.5">
              {harmonies.map((harm, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-600 font-medium">{t(harm.nameKey)}</span>
                  <div className="flex gap-1">
                    {harm.colors.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => onChange(c)}
                        className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Saved Custom Palettes Manager */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {t('colorPicker.mySavedPalettes')}
              </span>
              <button
                type="button"
                onClick={handleSavePalette}
                className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100"
              >
                <Plus className="h-2.5 w-2.5" />
                <span>{t('colorPicker.save')}</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar">
              {savedPalettes.map((pal) => (
                <div
                  key={pal.id}
                  className="flex items-center justify-between p-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs"
                >
                  <span className="text-[11px] font-bold text-slate-700 truncate max-w-[80px]">
                    {pal.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {pal.colors.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => onChange(c)}
                        className="w-4 h-4 rounded-full border border-slate-200 hover:scale-110"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={(e) => handleDeletePalette(pal.id, e)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
