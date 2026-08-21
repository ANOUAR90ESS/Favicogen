import React, { useState } from 'react';
import {
  FolderOpen,
  LayoutGrid,
  Eye,
  Download,
  RotateCcw,
  RotateCw,
  Globe,
  Save,
  Layers,
  Wand2,
  UploadCloud,
  Image as ImageIcon,
  FilePlus2,
  AlertCircle,
  X,
  Share2,
  Scissors,
} from 'lucide-react';
import { SupportedLanguage } from '../types';

interface NavbarProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onNewProject: () => void;
  onOpenTemplates: () => void;
  onOpenMockups: () => void;
  onOpenSocialMediaKit: () => void;
  onOpenCropTrim?: () => void;
  onSmartImport?: () => void;
  onOpenFaviconExport: () => void;
  onOpenFeatureGraphic: () => void;
  onOpenUniversalResizer: () => void;
  onOpenSavedProjects: () => void;
  onQuickSave: () => void;
  lastSavedAt: number;
  language: SupportedLanguage;
  onToggleLanguage: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  projectName,
  onProjectNameChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onNewProject,
  onOpenTemplates,
  onOpenMockups,
  onOpenSocialMediaKit,
  onOpenCropTrim,
  onSmartImport,
  onOpenFaviconExport,
  onOpenFeatureGraphic,
  onOpenUniversalResizer,
  onOpenSavedProjects,
  onQuickSave,
  lastSavedAt,
  language,
  onToggleLanguage,
}) => {
  const isAr = language === 'ar';
  const [showNewConfirm, setShowNewConfirm] = useState<boolean>(false);

  const handleConfirmNew = () => {
    onNewProject();
    setShowNewConfirm(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-white border-b border-slate-200 shadow-xs px-4 sm:px-6 flex items-center justify-between shrink-0">
      <div className="mx-auto flex w-full items-center justify-between gap-3">
        {/* Left / Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold shadow-sm">
            <Layers className="h-5 w-5 text-white" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-slate-900 font-sans">
                {isAr ? 'استوديو الشعارات والأيقونات' : 'Logo & Favicon Studio'}
              </span>
              <span className="hidden sm:inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 border border-indigo-100 uppercase tracking-wide">
                PRO
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <input
                type="text"
                value={projectName}
                onChange={(e) => onProjectNameChange(e.target.value)}
                placeholder={isAr ? 'اسم المشروع...' : 'Project Name...'}
                className="bg-transparent text-slate-700 font-medium hover:text-slate-900 focus:text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-indigo-600 focus:outline-none px-0 py-0 text-xs transition-colors max-w-[130px] sm:max-w-[180px]"
                title={isAr ? 'تعديل اسم المشروع' : 'Edit Project Name'}
              />
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 rounded-full border border-green-200">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-semibold text-green-700 uppercase tracking-wider">
                  {isAr ? 'محفوظ تلقائياً' : 'Auto-Saved'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Actions / History & Modals */}
        <div className="flex items-center gap-1.5 order-3 sm:order-2 w-full sm:w-auto justify-center">
          {/* Start New / Reset to Start Button */}
          <button
            id="btn-new-project"
            onClick={() => setShowNewConfirm(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 shadow-2xs transition-colors"
            title={isAr ? 'بدء تصميم جديد / العودة لصفحة البداية والتصميم الافتراضي' : 'Start New Project / Reset to Start Default'}
          >
            <FilePlus2 className="h-3.5 w-3.5 text-indigo-600" />
            <span>{isAr ? 'جديد / بداية' : 'New'}</span>
          </button>

          {/* Undo / Redo */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 shadow-2xs">
            <button
              id="btn-undo"
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent rounded-md transition-colors"
              title={isAr ? 'تراجع (Ctrl+Z)' : 'Undo (Ctrl+Z)'}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <button
              id="btn-redo"
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent rounded-md transition-colors"
              title={isAr ? 'إعادة (Ctrl+Y)' : 'Redo (Ctrl+Y)'}
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>

          {/* One-shot pipeline: image -> auto-trim -> full-bleed -> package */}
          {onSmartImport && (
            <button
              id="btn-smart-import"
              onClick={onSmartImport}
              className="flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:scale-105 active:scale-95"
              title={
                isAr
                  ? 'ارفع صورة: يقص الحواف البيضاء تلقائياً، يملأ الإطار، ثم يفتح حزمة التصدير بكل المقاسات'
                  : 'Upload an image: auto-trims white borders, fits edge-to-edge, then opens the full size package'
              }
            >
              <Wand2 className="h-4 w-4" />
              <span>{isAr ? 'صورة ← حزمة كاملة' : 'Image → Full Package'}</span>
              <span className="hidden xl:inline-block text-[9px] bg-white/25 px-1 py-0.2 rounded font-black">
                1-CLICK
              </span>
            </button>
          )}

          {/* Universal Image Resizer to Any Dimension & Tamaño */}
          <button
            id="btn-universal-resizer"
            onClick={onOpenUniversalResizer}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-gradient-to-r from-indigo-50 to-blue-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:from-indigo-100 hover:to-blue-100 shadow-2xs transition-all hover:scale-105 active:scale-95"
            title={isAr ? 'تحويل وتغيير مقاسات أي صورة لجميع المقاسات والأبعاد والأحجام' : 'Resize & convert image to any dimension, size & format'}
          >
            <UploadCloud className="h-4 w-4 text-indigo-600 animate-bounce" />
            <span>{isAr ? 'تغيير المقاسات لأي حجم' : 'Universal Resizer'}</span>
            <span className="hidden xl:inline-block text-[9px] bg-indigo-200 text-indigo-900 px-1 py-0.2 rounded font-black">
              ALL SIZES
            </span>
          </button>

          {/* Templates Gallery Button */}
          <button
            id="btn-templates"
            onClick={onOpenTemplates}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-indigo-600" />
            <span className="hidden md:inline">{isAr ? 'القوالب' : 'Templates'}</span>
          </button>

          {/* Live Mockups Preview Button */}
          <button
            id="btn-mockups"
            onClick={onOpenMockups}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Eye className="h-3.5 w-3.5 text-slate-600" />
            <span className="hidden md:inline">{isAr ? 'معاينة واقعية' : 'Live Mockups'}</span>
          </button>

          {/* Smart Crop & Trim Margins Button */}
          {onOpenCropTrim && (
            <button
              id="btn-nav-crop-trim"
              onClick={onOpenCropTrim}
              className="flex items-center gap-1.5 rounded-lg border border-teal-300 bg-teal-50/90 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 hover:border-teal-400 shadow-2xs transition-all hover:scale-105 active:scale-95"
              title={isAr ? 'قص الحواف البيضاء والشفافة أو تحديد مستطيل يدوي' : 'Trim white margins or manually crop rectangular area'}
            >
              <Scissors className="h-3.5 w-3.5 text-teal-600" />
              <span className="hidden sm:inline">{isAr ? 'قص الحواف' : 'Trim & Crop'}</span>
            </button>
          )}

          {/* Social Media Kit (1:1 & 16:9) Button */}
          <button
            id="btn-social-media-kit"
            onClick={onOpenSocialMediaKit}
            className="flex items-center gap-1.5 rounded-lg border border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:from-purple-100 hover:to-indigo-100 shadow-2xs transition-all hover:scale-105 active:scale-95"
            title={isAr ? 'حزمة شبكات التواصل الاجتماعي - تصاميم البروفايل 1:1 والبانرات 16:9' : 'Social Media Kit - Profile Avatars (1:1) & Channel Banners (16:9)'}
          >
            <Share2 className="h-3.5 w-3.5 text-purple-600" />
            <span className="hidden sm:inline">{isAr ? 'سوشيال ميديا' : 'Social Kit'}</span>
            <span className="text-[9px] bg-purple-200 text-purple-900 px-1 py-0.2 rounded font-black">
              1:1 & 16:9
            </span>
          </button>

          {/* Google Play Feature Graphic 1024x500 Button */}
          <button
            id="btn-feature-graphic"
            onClick={onOpenFeatureGraphic}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50/80 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400 shadow-2xs transition-all"
            title={isAr ? 'الرسم المميز لمتجر Google Play بدقة 1024 × 500 بكسل' : 'Google Play Feature Graphic (1024x500 px)'}
          >
            <ImageIcon className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden sm:inline">{isAr ? 'رسم مميز 1024×500' : 'Feature Graphic'}</span>
            <span className="hidden lg:inline-block text-[9px] bg-emerald-200 text-emerald-900 px-1 py-0.2 rounded font-black">
              PLAY
            </span>
          </button>

          {/* Saved Projects Button */}
          <button
            id="btn-saved-projects"
            onClick={onOpenSavedProjects}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <FolderOpen className="h-3.5 w-3.5 text-amber-600" />
            <span className="hidden lg:inline">{isAr ? 'المشاريع' : 'Projects'}</span>
          </button>
        </div>

        {/* Right / End: Language Switcher & Export Suite */}
        <div className="flex items-center gap-2.5 order-2 sm:order-3">
          {/* Language Switch */}
          <button
            id="btn-language-toggle"
            onClick={onToggleLanguage}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-2xs transition-colors"
            title={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            <Globe className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-[11px] font-bold uppercase">{language === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {/* Quick Save button */}
          <button
            id="btn-quick-save"
            onClick={onQuickSave}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-colors"
            title={isAr ? 'حفظ المشروع' : 'Save Project'}
          >
            <Save className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden xl:inline">{isAr ? 'حفظ' : 'Save'}</span>
          </button>

          {/* Export Suite / Favicon Generator Button */}
          <button
            id="btn-open-export"
            onClick={onOpenFaviconExport}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all"
          >
            <Download className="h-4 w-4" />
            <span>{isAr ? 'تصدير وحزمة Favicon' : 'Export All Sizes'}</span>
          </button>
        </div>
      </div>

      {/* New Project / Reset to Start Confirmation Modal */}
      {showNewConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
                  <FilePlus2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isAr ? 'بدء تصميم جديد / العودة للبداية' : 'Start New Design / Reset to Start'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isAr ? 'إنشاء لوحة عمل جديدة نظيفة' : 'Create a fresh, clean canvas'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewConfirm(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 p-3.5 bg-blue-50/80 rounded-xl border border-blue-200/70 text-xs text-blue-900">
                <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {isAr
                    ? 'يقوم التطبيق بحفظ عملك الأخير تلقائياً في المتصفح حتى لا تفقده. عند الضغط على "تأكيد وبدء جديد"، سيتم تفريغ اللوحة وإعادة تعيين التصميم إلى البداية الافتراضية.'
                    : 'The app auto-saves your last work in your browser. Clicking "Confirm & Start Fresh" will reset the canvas to a clean default state.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  id="btn-confirm-start-new"
                  onClick={handleConfirmNew}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  <FilePlus2 className="h-4 w-4" />
                  <span>{isAr ? 'تأكيد وبدء جديد' : 'Confirm & Start Fresh'}</span>
                </button>
                <button
                  id="btn-open-templates-instead"
                  onClick={() => {
                    setShowNewConfirm(false);
                    onOpenTemplates();
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 rounded-xl text-xs font-semibold transition-all border border-slate-200"
                >
                  <LayoutGrid className="h-4 w-4 text-slate-600" />
                  <span>{isAr ? 'اختيار من القوالب' : 'Pick a Template'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
