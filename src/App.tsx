import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { ControlPanel } from './components/ControlPanel';
import { CanvasStage } from './components/CanvasStage';
import { FaviconExportModal } from './components/FaviconExportModal';
import { TemplateGalleryModal } from './components/TemplateGalleryModal';
import { LiveMockupsModal } from './components/LiveMockupsModal';
import { SavedProjectsModal } from './components/SavedProjectsModal';
import { FeatureGraphicModal } from './components/FeatureGraphicModal';
import { UniversalImageResizerModal } from './components/UniversalImageResizerModal';
import { SocialMediaKitModal } from './components/SocialMediaKitModal';
import { ImageCropTrimModal } from './components/ImageCropTrimModal';
import { AILogoGeneratorModal } from './components/AILogoGeneratorModal';
import { YouTubeKitModal } from './components/YouTubeKitModal';
import { GooglePlayPolicyModal } from './components/GooglePlayPolicyModal';
import { LogoConfig, SupportedLanguage, Template } from './types';
import { DEFAULT_LOGO_CONFIG } from './utils/templates';
import {
  loadCurrentProject,
  saveCurrentProject,
  saveProjectToList,
  StorageFailure,
} from './utils/storage';
import {
  intakeImageFile,
  isIntakeFailure,
  MAX_UPLOAD_BYTES,
  formatBytes,
  ACCEPT_ATTRIBUTE,
} from './utils/imageIntake';
import { generateSvgString } from './utils/canvasRenderer';
import { smartImportImage } from './utils/smartImport';
import { runProductionComplianceCheck } from './utils/productionCheck';

const HISTORY_LIMIT = 30;

export function App() {
  const { t, i18n } = useTranslation();
  const language = (i18n.language as SupportedLanguage) || 'en';
  const isAr = language === 'ar';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // Production and Google Play compliance check on application mount
  useEffect(() => {
    runProductionComplianceCheck();
  }, []);

  const [config, setConfig] = useState<LogoConfig>(DEFAULT_LOGO_CONFIG);
  const [isRestoring, setIsRestoring] = useState<boolean>(true);

  // Undo stack and cursor live in one state value
  const [history, setHistory] = useState<{ entries: LogoConfig[]; index: number }>(() => ({
    entries: [DEFAULT_LOGO_CONFIG],
    index: 0,
  }));
  const [lastSavedAt, setLastSavedAt] = useState<number>(Date.now());
  const [storageWarning, setStorageWarning] = useState<StorageFailure | null>(null);

  // Restore the last session. Projects live in IndexedDB, so this is async;
  // until it resolves the canvas shows the default design rather than a
  // half-loaded one.
  useEffect(() => {
    let cancelled = false;

    loadCurrentProject().then((restored) => {
      if (cancelled) return;
      setConfig(restored);
      setHistory({ entries: [restored], index: 0 });
      setIsRestoring(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Modal open states
  const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(false);
  const [isMockupsOpen, setIsMockupsOpen] = useState<boolean>(false);
  const [isSocialMediaKitOpen, setIsSocialMediaKitOpen] = useState<boolean>(false);
  const [isYouTubeKitOpen, setIsYouTubeKitOpen] = useState<boolean>(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState<boolean>(false);
  const [isCropTrimModalOpen, setIsCropTrimModalOpen] = useState<boolean>(false);
  const [cropImageSource, setCropImageSource] = useState<string | null>(null);
  const [isFaviconExportOpen, setIsFaviconExportOpen] = useState<boolean>(false);
  const [isFeatureGraphicOpen, setIsFeatureGraphicOpen] = useState<boolean>(false);
  const [isUniversalResizerOpen, setIsUniversalResizerOpen] = useState<boolean>(false);
  const [isSavedProjectsOpen, setIsSavedProjectsOpen] = useState<boolean>(false);
  const [isGooglePlayPolicyOpen, setIsGooglePlayPolicyOpen] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<{
    id: number;
    title: string;
    projectName: string;
  } | null>(null);

  // Latest config, readable from callbacks without re-creating them on every edit.
  const configRef = useRef<LogoConfig>(config);
  configRef.current = config;

  // Toggle language with i18next and persistence
  const toggleLanguage = () => {
    const nextLang = language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('logo_studio_lang', nextLang);
  };

  // Debounced auto-save of whatever is currently on the canvas. Held back
  // until the restore finishes, so an empty default never overwrites saved work.
  useEffect(() => {
    if (isRestoring) return;

    const timer = setTimeout(() => {
      void saveCurrentProject(config).then((result) => {
        if (result.ok) {
          setLastSavedAt(Date.now());
          setStorageWarning(null);
        } else {
          // Reporting "saved" over a failed write is how work goes missing.
          setStorageWarning(result.failure ?? 'unknown');
        }
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [config, isRestoring]);

  // State change with History support & Partial Patch Safety
  const handleConfigChange = useCallback(
    (newConfigOrPatch: LogoConfig | Partial<LogoConfig>) => {
      const merged: LogoConfig = {
        ...DEFAULT_LOGO_CONFIG,
        ...configRef.current,
        ...newConfigOrPatch,
        updatedAt: Date.now(),
      };

      setConfig(merged);
      setHistory((prev) => {
        const entries = prev.entries.slice(0, prev.index + 1);
        entries.push(merged);
        if (entries.length > HISTORY_LIMIT) entries.shift();
        return { entries, index: entries.length - 1 };
      });
    },
    []
  );

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (history.index <= 0) return;
    const index = history.index - 1;
    setHistory({ entries: history.entries, index });
    setConfig(history.entries[index]);
  }, [history]);

  const handleRedo = useCallback(() => {
    if (history.index >= history.entries.length - 1) return;
    const index = history.index + 1;
    setHistory({ entries: history.entries, index });
    setConfig(history.entries[index]);
  }, [history]);

  // Quick Manual Save
  const handleQuickSave = useCallback(async () => {
    const currentConf = configRef.current;
    const thumb = generateSvgString(currentConf, 200);
    const result = await saveProjectToList(currentConf, thumb);

    if (!result.ok) {
      setStorageWarning(result.failure ?? 'unknown');
      return;
    }

    const now = Date.now();
    setLastSavedAt(now);
    setStorageWarning(null);

    setSaveToast({
      id: now,
      title: t('common.savedSuccessfully'),
      projectName:
        currentConf.text ||
        currentConf.name ||
        t('common.untitledProject'),
    });
  }, [t]);

  // Auto dismiss save toast
  useEffect(() => {
    if (!saveToast) return;
    const timer = setTimeout(() => {
      setSaveToast(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, [saveToast]);

  // Apply Template
  const handleSelectTemplate = (template: Template) => {
    const merged: LogoConfig = {
      ...config,
      ...template.config,
      id: 'proj_' + Date.now(),
      name: isAr ? template.nameAr : template.nameEn,
    };
    handleConfigChange(merged);
  };

  // New blank project
  const handleNewProject = () => {
    const blank: LogoConfig = {
      ...DEFAULT_LOGO_CONFIG,
      id: 'proj_' + Date.now(),
    };
    handleConfigChange(blank);
  };

  // ---------------------------------------------------------------------
  // One-shot pipeline: pick an image -> trim its empty border -> fit it
  // edge-to-edge -> open the export package.
  // ---------------------------------------------------------------------
  const smartImportInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSmartImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImportStatus(t('nav.smartImport'));
    try {
      const intake = await intakeImageFile(file);
      if (isIntakeFailure(intake)) {
        setImportStatus(
          intake.reason === 'too-large'
            ? t('common.imageTooLarge', { limit: formatBytes(MAX_UPLOAD_BYTES) })
            : t('common.imageUnreadable')
        );
        return;
      }

      const result = await smartImportImage(intake.dataUrl, { autoTrim: true });

      handleConfigChange({
        ...result.patch,
        id: 'proj_' + Date.now(),
        name: file.name.replace(/\.[^.]+$/, '') || 'Imported Logo',
      });

      setImportStatus(
        result.trimmedPercent > 0
          ? `${t('imageCropTrimModal.title')} (${result.trimmedPercent}%)`
          : t('common.ready')
      );

      // Hand straight over to the package export.
      setIsFaviconExportOpen(true);
    } catch (err) {
      console.error('Smart import failed:', err);
      setImportStatus(t('common.imageUnreadable'));
    } finally {
      setTimeout(() => setImportStatus(null), 5000);
    }
  };

  // Open interactive Crop & Auto-Trim Modal
  const handleOpenCropTrim = (customSrc?: string) => {
    if (customSrc) {
      setCropImageSource(customSrc);
    } else if (config.uploadedImageSrc) {
      setCropImageSource(config.uploadedImageSrc);
    } else {
      const svg = generateSvgString(config, 512);
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      setCropImageSource(url);
    }
    setIsCropTrimModalOpen(true);
  };

  // Keyboard Shortcuts (Shift+S for Quick Save, Ctrl+S, Ctrl+Z, Ctrl+Y, Ctrl+E)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // Global Shift + S shortcut for Quick Save
      if (
        e.shiftKey &&
        (e.key === 'S' || e.key === 's') &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        if (!isInput) {
          e.preventDefault();
          void handleQuickSave();
          return;
        }
      }

      // Standard Ctrl+S / Cmd+S for Quick Save
      if ((e.metaKey || e.ctrlKey) && (e.key === 's' || e.key === 'S') && !e.shiftKey) {
        e.preventDefault();
        void handleQuickSave();
        return;
      }

      // Undo (Ctrl/Cmd + Z)
      if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        if (!isInput) {
          e.preventDefault();
          handleUndo();
        }
      }
      // Redo (Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z)
      else if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === 'y' || e.key === 'Y' || ((e.key === 'z' || e.key === 'Z') && e.shiftKey))
      ) {
        if (!isInput) {
          e.preventDefault();
          handleRedo();
        }
      }
      // Favicon Export (Ctrl/Cmd + E)
      else if ((e.metaKey || e.ctrlKey) && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        setIsFaviconExportOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleQuickSave]);

  const displayProjectName = config.text || config.name || t('common.untitledProject');

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className="flex flex-col h-screen w-screen bg-slate-50 text-slate-900 font-sans antialiased overflow-hidden select-none"
    >
      {/* Hidden picker driving the one-shot image -> package pipeline */}
      <input
        type="file"
        ref={smartImportInputRef}
        onChange={handleSmartImportFile}
        accept={ACCEPT_ATTRIBUTE}
        className="hidden"
      />

      {/* Storage problems are loud: a silent failure here loses the user's work. */}
      {storageWarning && (
        <div
          role="alert"
          className="shrink-0 flex items-start gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-300 text-amber-900"
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
          <p className="text-xs font-semibold leading-relaxed flex-1">
            {storageWarning === 'quota'
              ? t('common.storageQuotaFull')
              : storageWarning === 'unavailable'
                ? t('common.storageUnavailable')
                : t('common.storageFailed')}
          </p>
          <button
            onClick={() => setStorageWarning(null)}
            className="p-0.5 rounded hover:bg-amber-100 transition-colors cursor-pointer shrink-0"
            aria-label={t('common.close')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Pipeline progress / result toast */}
      {importStatus && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-lg animate-in fade-in">
          {importStatus}
        </div>
      )}

      {/* Top Main Navigation */}
      <Navbar
        projectName={config.text || config.name || ''}
        onProjectNameChange={(name) => handleConfigChange({ ...config, name, text: name })}
        canUndo={history.index > 0}
        canRedo={history.index < history.entries.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onNewProject={handleNewProject}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenMockups={() => setIsMockupsOpen(true)}
        onOpenSocialMediaKit={() => setIsSocialMediaKitOpen(true)}
        onOpenYouTubeKit={() => setIsYouTubeKitOpen(true)}
        onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
        onOpenCropTrim={() => handleOpenCropTrim()}
        onSmartImport={() => smartImportInputRef.current?.click()}
        onOpenFaviconExport={() => setIsFaviconExportOpen(true)}
        onOpenFeatureGraphic={() => setIsFeatureGraphicOpen(true)}
        onOpenUniversalResizer={() => setIsUniversalResizerOpen(true)}
        onOpenSavedProjects={() => setIsSavedProjectsOpen(true)}
        onOpenGooglePlayPolicy={() => setIsGooglePlayPolicyOpen(true)}
        onQuickSave={handleQuickSave}
        lastSavedAt={lastSavedAt}
        language={language}
        onToggleLanguage={toggleLanguage}
      />

      {/* Main Studio Workspace: Sidebar Controls + Interactive Canvas Stage */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative p-2 sm:p-3 gap-2.5 sm:gap-3 bg-slate-100/70">
        {/* Sidebar Customizer Controls */}
        <aside className="w-full md:w-[380px] lg:w-[410px] h-[45vh] md:h-full shrink-0 order-2 md:order-1 z-10 rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 bg-white">
          <ControlPanel
            config={config}
            onChange={handleConfigChange}
            language={language}
            onOpenCropTrimModal={handleOpenCropTrim}
          />
        </aside>

        {/* Center Live Stage Preview */}
        <main className="flex-1 h-[55vh] md:h-full order-1 md:order-2 overflow-hidden rounded-2xl shadow-xs border border-slate-200/80 bg-white flex flex-col">
          <CanvasStage
            config={config}
            language={language}
            onUpdateConfig={handleConfigChange}
            onOpenFaviconExport={() => setIsFaviconExportOpen(true)}
            onOpenMockups={() => setIsMockupsOpen(true)}
            onOpenSocialMediaKit={() => setIsSocialMediaKitOpen(true)}
            onOpenCropTrimModal={() => handleOpenCropTrim()}
            onOpenFeatureGraphic={() => setIsFeatureGraphicOpen(true)}
            onOpenUniversalResizer={() => setIsUniversalResizerOpen(true)}
          />
        </main>
      </div>

      {/* Bottom Professional Polish Footer Bar */}
      <footer className="h-9 bg-white border-t border-slate-200 flex items-center justify-between px-3 sm:px-6 text-[11px] font-medium text-slate-500 shrink-0">
        <div className="flex items-center gap-3">
          <span className="truncate max-w-[140px] sm:max-w-none">
            {t('nav.saved')}: <strong className="text-slate-700 font-semibold">{displayProjectName}</strong>
          </span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="hidden sm:inline font-mono">{t('common.resolution')}: 512 × 512 px</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsGooglePlayPolicyOpen(true)}
            className="flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 transition-colors cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>{isAr ? '🔒 سياسة الخصوصية و Google Play' : '🔒 Privacy & Google Play'}</span>
          </button>
          <span className="hidden md:inline text-slate-400 font-mono">v1.5.0</span>
        </div>
      </footer>

      {/* MODALS */}
      {/* 0. AI Logo & YouTube Banner Generator with Gemini AI */}
      <AILogoGeneratorModal
        isOpen={isAIGeneratorOpen}
        onClose={() => setIsAIGeneratorOpen(false)}
        language={language}
        config={config}
        onApplyLogo={(updates) => {
          handleConfigChange(updates);
        }}
        onOpenYouTubeKit={() => {
          setIsAIGeneratorOpen(false);
          setIsYouTubeKitOpen(true);
        }}
        onOpenFaviconExport={() => {
          setIsAIGeneratorOpen(false);
          setIsFaviconExportOpen(true);
        }}
        onOpenFeatureGraphic={() => {
          setIsAIGeneratorOpen(false);
          setIsFeatureGraphicOpen(true);
        }}
        onOpenUniversalResizer={() => {
          setIsAIGeneratorOpen(false);
          setIsUniversalResizerOpen(true);
        }}
        onOpenMockups={() => {
          setIsAIGeneratorOpen(false);
          setIsMockupsOpen(true);
        }}
      />

      {/* 0. Dedicated YouTube Channel Branding Studio */}
      <YouTubeKitModal
        isOpen={isYouTubeKitOpen}
        onClose={() => setIsYouTubeKitOpen(false)}
        config={config}
        lang={language}
        onOpenAIGenerator={() => {
          setIsYouTubeKitOpen(false);
          setIsAIGeneratorOpen(true);
        }}
      />

      {/* 1. Universal Image Resizer & Multi-Size Converter */}
      <UniversalImageResizerModal
        isOpen={isUniversalResizerOpen}
        onClose={() => setIsUniversalResizerOpen(false)}
        language={language}
        currentLogoConfig={config}
      />

      {/* 2. Complete Favicon Package & Export Suite */}
      <FaviconExportModal
        isOpen={isFaviconExportOpen}
        onClose={() => setIsFaviconExportOpen(false)}
        config={config}
        language={language}
      />

      {/* 3. Social Media Design Kit */}
      <SocialMediaKitModal
        isOpen={isSocialMediaKitOpen}
        onClose={() => setIsSocialMediaKitOpen(false)}
        config={config}
        lang={language}
        onOpenYouTubeKit={() => {
          setIsSocialMediaKitOpen(false);
          setIsYouTubeKitOpen(true);
        }}
        onOpenAIGenerator={() => {
          setIsSocialMediaKitOpen(false);
          setIsAIGeneratorOpen(true);
        }}
      />

      {/* 4. Google Play Feature Graphic Modal */}
      <FeatureGraphicModal
        isOpen={isFeatureGraphicOpen}
        onClose={() => setIsFeatureGraphicOpen(false)}
        config={config}
        language={language}
      />

      {/* 5. Templates Gallery */}
      <TemplateGalleryModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        currentConfig={config}
        onSelectTemplate={handleSelectTemplate}
        language={language}
      />

      {/* 6. Realistic Live Mockups */}
      <LiveMockupsModal
        isOpen={isMockupsOpen}
        onClose={() => setIsMockupsOpen(false)}
        config={config}
        language={language}
      />

      {/* 7. Saved Projects Vault */}
      <SavedProjectsModal
        isOpen={isSavedProjectsOpen}
        onClose={() => setIsSavedProjectsOpen(false)}
        onLoadProject={(loaded) => handleConfigChange(loaded)}
        onNewProject={handleNewProject}
        language={language}
      />

      {/* 8. Image Auto-Trim & Manual Crop Modal */}
      {isCropTrimModalOpen && (
        <ImageCropTrimModal
          isOpen={isCropTrimModalOpen}
          onClose={() => setIsCropTrimModalOpen(false)}
          initialImageSrc={cropImageSource || config.uploadedImageSrc || ''}
          language={language}
          onApplyCrop={(croppedDataUrl) => {
            handleConfigChange({
              iconType: 'image',
              uploadedImageSrc: croppedDataUrl,
              uploadedImageScale: 100,
              uploadedImageOffsetX: 0,
              uploadedImageOffsetY: 0,
            });
            setIsCropTrimModalOpen(false);
          }}
        />
      )}

      {/* 9. Google Play Compliance & Privacy Policy Modal */}
      <GooglePlayPolicyModal
        isOpen={isGooglePlayPolicyOpen}
        onClose={() => setIsGooglePlayPolicyOpen(false)}
        language={language}
      />

      {/* Quick Save Toast Notification */}
      {saveToast && (
        <div
          id="toast-quick-save"
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-[80] flex items-center gap-3 px-4 py-3 bg-slate-900/95 text-white rounded-xl shadow-2xl border border-emerald-500/40 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="flex flex-col text-start pr-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">
                {saveToast.title}
              </span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                Shift + S
              </span>
            </div>
            <p className="text-[11px] text-slate-300 max-w-[220px] truncate">
              {saveToast.projectName}
            </p>
          </div>
          <button
            onClick={() => setSaveToast(null)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            aria-label={t('common.close')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
