import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthProvider';
import { isAuthConfigured } from '../utils/supabaseConfig';
import type { Route } from '../utils/router';
import {
  FolderOpen,
  LayoutGrid,
  Eye,
  Download,
  RotateCcw,
  RotateCw,
  Layers,
  FilePlus2,
  AlertCircle,
  Share2,
  Scissors,
  Sparkles,
  Youtube,
  UploadCloud,
  Save,
  ShieldCheck,
  MoreHorizontal,
  Package,
  } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { Modal } from './Modal';

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
  onOpenYouTubeKit?: () => void;
  onOpenAIGenerator?: () => void;
  onOpenCropTrim?: () => void;
  onSmartImport?: () => void;
  onOpenFaviconExport: () => void;
  onOpenBrandPackage: () => void;
  onOpenFeatureGraphic: () => void;
  onOpenUniversalResizer: () => void;
  onOpenSavedProjects: () => void;
  onOpenGooglePlayPolicy?: () => void;
  onQuickSave: () => void;
  lastSavedAt: number;
  language: SupportedLanguage;
  onToggleLanguage: () => void;
  /** Landing-screen chrome: the brand and the language switch, nothing that
   *  acts on a project the visitor has not started yet. */
  minimal?: boolean;
  /**
   * Where the account control leads. Absent when the studio is mounted on its
   * own, in which case no account control is drawn at all — a button that
   * cannot navigate is worse than no button.
   */
  onNavigate?: (to: Route) => void;
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
  onOpenYouTubeKit,
  onOpenAIGenerator,
  onOpenCropTrim,
  onOpenFaviconExport,
  onOpenBrandPackage,
  onOpenUniversalResizer,
  onOpenSavedProjects,
  onOpenGooglePlayPolicy,
  onQuickSave,
  minimal = false,
  onToggleLanguage,
  onNavigate,
}) => {
  const { status: authStatus, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [showNewConfirm, setShowNewConfirm] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const handleConfirmNew = () => {
    onNewProject();
    setShowNewConfirm(false);
  };

  const handleSetLanguage = (lang: 'en' | 'ar') => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
      onToggleLanguage();
    }
  };

  // Click outside listener for more menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full min-h-14 bg-white border-b border-slate-200 shadow-2xs px-3 sm:px-5 py-1.5 md:py-0 flex items-center justify-between shrink-0">
      <div className="mx-auto flex w-full flex-wrap md:flex-nowrap items-center justify-between gap-x-2.5 gap-y-1.5">
        {/* Left / Brand Identity */}
        <div className="order-1 flex items-center gap-2.5 min-w-0 shrink max-md:max-w-[42%]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold shadow-2xs shrink-0">
            <Layers className="h-4 w-4 text-white" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-xs sm:text-sm tracking-tight text-slate-900 font-sans truncate">
                {t('nav.appTitle')}
              </span>
              <span className="hidden md:inline-flex items-center rounded-md bg-indigo-50 px-1.5 py-0.2 text-[9px] font-bold text-indigo-600 border border-indigo-100 uppercase">
                PRO
              </span>
            </div>
            {!minimal && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => onProjectNameChange(e.target.value)}
                  placeholder={t('common.untitledProject')}
                  className="bg-transparent text-slate-700 font-medium hover:text-slate-900 focus:text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-indigo-600 focus:outline-none px-0 py-0 text-[11px] transition-colors max-w-[90px] sm:max-w-[140px]"
                  title={t('common.edit')}
                />
                <div className="hidden sm:tall:flex items-center gap-1 px-1.5 py-0.2 bg-emerald-50 rounded-full border border-emerald-200">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  <span className="text-[9px] font-bold text-emerald-700 uppercase">
                    {t('nav.autoSaved')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Primary Action Buttons - Sleek & Organized */}
        {!minimal && (
          <div className="order-2 max-md:tall:order-3 max-md:tall:basis-full flex items-center gap-1.5 overflow-x-auto scrollbar-none min-w-0 flex-1 justify-start md:justify-center [&>*]:shrink-0">
            {/* History Undo / Redo & New Project */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 shadow-2xs">
              <button
                id="btn-new-project"
                onClick={() => setShowNewConfirm(true)}
                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-md transition-colors cursor-pointer"
                title={t('nav.newLogo')}
              >
                <FilePlus2 className="h-3.5 w-3.5" />
              </button>
              <div className="h-3.5 w-px bg-slate-200 mx-0.5" />
              <button
                id="btn-undo"
                onClick={onUndo}
                disabled={!canUndo}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent rounded-md transition-colors cursor-pointer"
                title={`${t('common.undo')} (Ctrl+Z)`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                id="btn-redo"
                onClick={onRedo}
                disabled={!canRedo}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent rounded-md transition-colors cursor-pointer"
                title={`${t('common.redo')} (Ctrl+Y)`}
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* AI Generator Button */}
            {onOpenAIGenerator && (
              <button
                id="btn-ai-generator"
                onClick={onOpenAIGenerator}
                className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-2.5 py-1 text-xs font-bold text-white shadow-2xs transition-all cursor-pointer"
                title={t('nav.aiGenerator')}
              >
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                <span className="hidden md:tall:inline">{t('nav.aiGenerator')}</span>
              </button>
            )}

            {/* YouTube Kit */}
            {onOpenYouTubeKit && (
              <button
                id="btn-youtube-kit"
                onClick={onOpenYouTubeKit}
                className="hidden lg:flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/70 hover:bg-red-100/80 px-2 py-1 text-xs font-bold text-red-700 transition-colors cursor-pointer"
                title={t('nav.youtubeKit')}
              >
                <Youtube className="h-3.5 w-3.5 text-red-600" />
                <span>{t('nav.youtubeKit')}</span>
              </button>
            )}

            {/* Social Media Kit */}
            <button
              id="btn-social-media-kit"
              onClick={onOpenSocialMediaKit}
              className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100/80 px-2 py-1 text-xs font-bold text-purple-700 transition-colors cursor-pointer"
              title={t('nav.socialKit')}
            >
              <Share2 className="h-3.5 w-3.5 text-purple-600" />
              <span className="hidden md:tall:inline">{t('nav.socialKit')}</span>
            </button>

            {/* Crop & 90° Corner Rounder Button */}
            {onOpenCropTrim && (
              <button
                id="btn-nav-crop-trim"
                onClick={onOpenCropTrim}
                className="flex items-center gap-1 rounded-lg border border-teal-300 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 text-xs font-bold text-teal-800 transition-colors cursor-pointer"
                title={t('nav.text90CornerRounderCropper')}
              >
                <Scissors className="h-3.5 w-3.5 text-teal-600" />
                <span className="hidden md:tall:inline">{t('nav.corners')}</span>
              </button>
            )}

            {/* Universal Resizer */}
            <button
              id="btn-universal-resizer"
              onClick={onOpenUniversalResizer}
              className="hidden xl:flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-700 transition-colors cursor-pointer"
              title={t('nav.imageResizer')}
            >
              <UploadCloud className="h-3.5 w-3.5 text-indigo-600" />
              <span>{t('nav.imageResizer')}</span>
            </button>

            {/* Templates Gallery */}
            <button
              id="btn-templates"
              onClick={onOpenTemplates}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              title={t('nav.templates')}
            >
              <LayoutGrid className="h-3.5 w-3.5 text-indigo-600" />
              <span className="hidden md:tall:inline">{t('nav.templates')}</span>
            </button>

            {/* Quick Save */}
            <button
              id="btn-quick-save"
              onClick={onQuickSave}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 px-2 py-1 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              title={`${t('nav.quickSave')}`}
            >
              <Save className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden md:tall:inline">{t('common.save')}</span>
            </button>

            {/* More Tools Dropdown for Secondary Tools & Policy */}
            <div className="relative" ref={moreMenuRef}>
              <button
                id="btn-more-menu"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="flex items-center gap-1 p-1.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                title={t('nav.moreToolsCompliance')}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>

              {showMoreMenu && (
                <div
                  className={`absolute top-full mt-1.5 ${
                    isAr ? 'left-0' : 'right-0'
                  } w-52 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs`}
                >
                  <button
                    onClick={() => {
                      onOpenMockups();
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 text-start font-medium cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-600" />
                    <span>{t('nav.mockups')}</span>
                  </button>

                  <button
                    id="btn-saved-projects"
                    onClick={() => {
                      onOpenSavedProjects();
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 text-start font-medium cursor-pointer"
                  >
                    <FolderOpen className="h-3.5 w-3.5 text-amber-600" />
                    <span>{t('nav.saved')}</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenUniversalResizer();
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 text-start font-medium cursor-pointer"
                  >
                    <UploadCloud className="h-3.5 w-3.5 text-indigo-600" />
                    <span>{t('nav.imageResizer')}</span>
                  </button>

                  {onOpenGooglePlayPolicy && (
                    <>
                      <div className="my-1 h-px bg-slate-100" />
                      <button
                        onClick={() => {
                          onOpenGooglePlayPolicy();
                          setShowMoreMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100/70 text-start font-bold cursor-pointer"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{t('nav.googlePlayPrivacy')}</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right / Export and Language */}
        <div className="order-3 max-md:tall:order-2 flex items-center gap-1.5 shrink-0">
          {/*
            * The account, for the workspace.
            *
            * Only drawn when this build has an account service *and* somewhere
            * to navigate. Otherwise someone who signed in on the landing page
            * would reach the studio and find no way back out of the session.
            */}
          {isAuthConfigured && onNavigate && authStatus === 'signed-in' && (
            <button
              onClick={() => void signOut()}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              {t('auth.nav.signOut')}
            </button>
          )}
          {isAuthConfigured && onNavigate && authStatus === 'signed-out' && (
            <button
              id="btn-nav-signin"
              onClick={() => onNavigate('/signin')}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              {t('auth.nav.signIn')}
            </button>
          )}

          {/* Segmented Language Switcher */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 shadow-2xs">
            <button
              id="btn-lang-en"
              type="button"
              onClick={() => handleSetLanguage('en')}
              className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                !isAr
                  ? 'bg-white text-indigo-700 shadow-2xs font-sans'
                  : 'text-slate-500 hover:text-slate-900 font-sans'
              }`}
              title="Switch to English"
            >
              EN
            </button>
            <button
              id="btn-lang-ar"
              type="button"
              onClick={() => handleSetLanguage('ar')}
              className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                isAr
                  ? 'bg-white text-indigo-700 shadow-2xs font-sans'
                  : 'text-slate-500 hover:text-slate-900 font-sans'
              }`}
              title={t('nav.switchToArabic')}
            >
              {
                // A language's own name stays in that language, the way a
                // "Deutsch" button does — translating it defeats the control.
                // eslint-disable-next-line no-restricted-syntax
                'عربي'
              }
            </button>
          </div>

          {!minimal && (
              <>
            {/* The whole package — the thing most people came for */}
            <button
              id="btn-brand-package"
              onClick={onOpenBrandPackage}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 px-3 py-1 text-xs font-bold text-white shadow-2xs transition-colors cursor-pointer"
              title={t('brandPackage.title')}
              aria-label={t('brandPackage.title')}
            >
              <Package className="h-3.5 w-3.5" />
              <span className="hidden lg:inline font-sans font-bold">{t('brandPackage.cta')}</span>
            </button>

            {/* Favicon & Multi-size Export Button */}
            <button
              id="btn-export-favicon-pack"
              onClick={onOpenFaviconExport}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1 text-xs font-bold text-white shadow-2xs transition-colors cursor-pointer"
              title={t('nav.exportFavicon')}
              aria-label={t('nav.exportFavicon')}
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline font-sans font-bold">{t('nav.exportFavicon')}</span>
            </button>
              </>
          )}
        </div>
      </div>

      {/* Reset confirmation modal */}
      <Modal
        isOpen={showNewConfirm}
        onClose={() => setShowNewConfirm(false)}
        label={t('nav.startNewProject')}
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150"
      >
            <div className="flex items-center gap-2.5 text-amber-600 mb-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 shrink-0">
                <AlertCircle className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {t('nav.startNewProject2')}
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {t('nav.areYouSureYou')}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowNewConfirm(false)}
                className="px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleConfirmNew}
                className="px-3.5 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                {t('nav.yesStartNew')}
              </button>
            </div>
      </Modal>
    </header>
  );
};
