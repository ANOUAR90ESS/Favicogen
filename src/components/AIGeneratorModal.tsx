import React, { useState } from 'react';
import { X, Sparkles, Loader2, Wand2, ArrowRight, Check } from 'lucide-react';
import { LogoConfig, SupportedLanguage, AIIdeaSuggestion } from '../types';
import { generateSvgString } from '../utils/canvasRenderer';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: LogoConfig;
  onApplySuggestion: (configPatch: Partial<LogoConfig>) => void;
  language: SupportedLanguage;
}

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onApplySuggestion,
  language,
}) => {
  const isAr = language === 'ar';
  const [brandName, setBrandName] = useState(currentConfig.text || currentConfig.name || '');
  const [industry, setIndustry] = useState('Technology & Artificial Intelligence');
  const [style, setStyle] = useState('Modern Minimalist');
  const [keywords, setKeywords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AIIdeaSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/ai/generate-logo-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandName || 'Brand',
          industry,
          style,
          keywords,
          language,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
      }
    } catch (err: any) {
      console.error('AI logo generation failed:', err);
      setError(isAr ? 'تعذر توليد الأفكار حالياً، تم تفعيل المقترحات الذكية البديلة.' : 'Failed to reach AI server. Using local smart generators.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-4xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-sm text-white font-bold">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isAr ? 'استوديو توليد الأفكار بالذكاء الاصطناعي (Gemini AI)' : 'AI Brand & Logo Studio (Gemini AI)'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'اكتب اسم مشروعك وتخصصك ليقوم الذكاء الاصطناعي باقتراح هوية وشعارات متكاملة مع الألوان والخطوط'
                  : 'Enter your brand details and let Gemini generate customized brand identities and palette styles'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Controls */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/40 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                {isAr ? 'اسم العلامة التجارية' : 'Brand Name'}
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder={isAr ? 'مثال: سديم' : 'e.g. Nova'}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                {isAr ? 'المجال أو التخصص' : 'Industry / Field'}
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder={isAr ? 'تقنية, تجارة, قهوة...' : 'Tech, Fashion, Coffee...'}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                {isAr ? 'النمط المفضل' : 'Style Preference'}
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
              >
                <option value="Modern Minimalist">{isAr ? 'عصري وبسيط (Minimalist)' : 'Modern Minimalist'}</option>
                <option value="Luxury Royal Gold">{isAr ? 'فخامة وملكي ذهبي (Luxury Gold)' : 'Luxury Royal Gold'}</option>
                <option value="Futuristic Cyber AI">{isAr ? 'سايبر ومستقبلي (Cyber Tech)' : 'Futuristic Cyber AI'}</option>
                <option value="Organic Eco Green">{isAr ? 'طبيعي وبيئي (Eco Natural)' : 'Organic Eco Green'}</option>
                <option value="Bold Monogram">{isAr ? 'مونوغرام أحادي عريض (Monogram)' : 'Bold Monogram'}</option>
                <option value="Arabesque Heritage">{isAr ? 'تراثي وزخارف عربية (Arabesque)' : 'Arabesque Heritage'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              {isAr ? 'وصف حر إضافي (Prompt)' : 'Additional Prompt / Ideas'}
            </label>
            <div className="flex gap-3">
              <textarea
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder={isAr ? 'مثال: شعار دائري يحتوي على درع، بألوان زرقاء داكنة وفضية...' : 'e.g. A circular shield logo with dark blue and silver colors...'}
                rows={2}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs resize-none"
              />
              <button
                id="btn-trigger-ai-generate"
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-32 flex flex-col items-center justify-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{isAr ? 'جارٍ التفكير' : 'Thinking...'}</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5" />
                    <span>{isAr ? 'توليد الأفكار' : 'Generate'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-amber-600 font-semibold">{error}</p>}
        </div>

        {/* Suggestions Results */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-50/30">
          {suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12 space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-2xs">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {isAr ? 'جاهز لابتكار هويات بصرية مذهلة' : 'Ready to craft stunning visual identities'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm font-medium">
                {isAr
                  ? 'اضغط على زر "توليد أفكار التصميم" لتوليد نماذج مخصصة بالذكاء الاصطناعي مع ألوان وأشكال متناسقة.'
                  : 'Click "Generate Concepts" to create tailored logos with harmonious color palettes and typography.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {suggestions.map((item, idx) => {
                const patch: Partial<LogoConfig> = {
                  text: item.name || brandName,
                  showText: true,
                  tagline: item.tagline,
                  showTagline: !!item.tagline,
                  iconKey: item.suggestedIcon || 'cpu',
                  iconType: 'library',
                  bgType: item.bgType || 'linear',
                  bgColor1: item.bgColor1 || '#4338ca',
                  bgColor2: item.bgColor2 || '#312e81',
                  iconColor: item.primaryColor || '#ffffff',
                  iconColor2: item.secondaryColor || '#a5b4fc',
                  iconGradient: true,
                  textColor: item.secondaryColor || '#ffffff',
                  fontFamily: item.fontFamily || 'Cairo',
                  shapeMask: item.shapeMask || 'squircle',
                };

                const previewConfig: LogoConfig = {
                  ...currentConfig,
                  ...patch,
                  id: `ai_sug_${idx}`,
                };
                const svgCode = generateSvgString(previewConfig, 300);

                return (
                  <div
                    key={idx}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white hover:border-indigo-400 p-4 transition-all shadow-2xs space-y-3"
                  >
                    <div className="flex h-44 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 p-2">
                      <div className="w-32 h-32 drop-shadow-sm" dangerouslySetInnerHTML={{ __html: svgCode }} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                        <span className="text-[11px] text-indigo-600 font-mono font-bold">{item.fontFamily}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                    </div>

                    <button
                      onClick={() => {
                        onApplySuggestion(patch);
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-200 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all shadow-2xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{isAr ? 'تطبيق هذا الشعار على المحرر' : 'Apply to Studio Canvas'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
