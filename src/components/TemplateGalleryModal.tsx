import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, LayoutGrid, Search, Sparkles } from 'lucide-react';
import { LogoConfig, SupportedLanguage, Template } from '../types';
import { TEMPLATES } from '../utils/templates';
import { generateSvgString } from '../utils/canvasRenderer';
import { Modal } from './Modal';

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: LogoConfig;
  onSelectTemplate: (template: Template) => void;
  language?: SupportedLanguage;
}

export const TemplateGalleryModal: React.FC<TemplateGalleryModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSelectTemplate,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'all', nameAr: t('templatesModal.catAll'), nameEn: 'All Templates' },
    { id: 'tech', nameAr: t('templatesModal.catTech'), nameEn: 'Tech & AI' },
    { id: 'minimal', nameAr: t('templatesModal.catMinimal'), nameEn: 'Minimal & Monogram' },
    { id: 'luxury', nameAr: t('templatesModal.catLuxury'), nameEn: 'Luxury & Royal' },
    { id: 'arabesque', nameAr: t('templatesModal.catArabesque'), nameEn: 'Arabesque & Islamic' },
    { id: 'eco', nameAr: t('templatesModal.catNature'), nameEn: 'Nature & Eco' },
    { id: 'ecommerce', nameAr: t('templatesModal.catEcommerce'), nameEn: 'Ecommerce' },
    { id: 'creative', nameAr: t('templatesModal.catCreative'), nameEn: 'Creative & Art' },
    { id: 'gaming', nameAr: t('templatesModal.catGaming'), nameEn: 'Gaming & Esports' },
    { id: 'badges', nameAr: t('templatesModal.catBadges'), nameEn: 'Badges & Seals' },
  ];

  const filteredTemplates = useMemo(() => TEMPLATES.filter((tpl) => {
    const matchesCat = selectedCategory === 'all' || tpl.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      tpl.nameAr.includes(searchQuery) ||
      tpl.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.category.includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  }), [selectedCategory, searchQuery]);

  // Each preview is a full SVG render; without this they were regenerated for
  // every template on every keystroke in the search field.
  const previews = useMemo(() => {
    const map: Record<string, string> = {};
    for (const template of filteredTemplates) {
      const previewConfig: LogoConfig = {
        ...currentConfig,
        ...template.config,
        id: template.id,
      };
      map[template.id] = generateSvgString(previewConfig, 300);
    }
    return map;
  }, [filteredTemplates, currentConfig]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      label={t('templatesModal.title')}
      className="flex flex-col w-full max-w-5xl max-h-full bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
      overlayClassName="z-50 bg-slate-900/60"
    >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 font-bold shadow-2xs">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {t('templatesModal.title')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('templatesModal.subtitle')}
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

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/40 space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('templatesModal.searchPlaceholder')}
              className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
            />
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 shadow-2xs'
                }`}
              >
                {isAr ? cat.nameAr : cat.nameEn}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-50/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => {
              const svgPreview = previews[template.id];

              return (
                <div
                  key={template.id}
                  className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md p-4 transition-all duration-200 shadow-2xs"
                >
                  {/* Visual Preview */}
                  <div className="flex h-44 w-full items-center justify-center rounded-xl bg-slate-50 border border-slate-200 p-3 overflow-hidden group-hover:scale-[1.02] transition-transform">
                    <div
                      className="w-32 h-32 drop-shadow-sm"
                      dangerouslySetInnerHTML={{ __html: svgPreview }}
                    />
                  </div>

                  {/* Info & Apply */}
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {isAr ? template.nameAr : template.nameEn}
                      </h4>
                      <span className="text-[11px] text-indigo-600 font-semibold">
                        {isAr ? template.categoryLabelAr : template.categoryLabelEn}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onSelectTemplate(template);
                        onClose();
                      }}
                      className="flex items-center gap-1 rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all shadow-2xs cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>{t('templatesModal.useTemplate')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
  );
};
