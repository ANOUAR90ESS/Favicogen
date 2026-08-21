import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { LogoConfig, SupportedLanguage, Template } from './types';
import { DEFAULT_LOGO_CONFIG } from './utils/templates';
import {
  loadCurrentProject,
  saveCurrentProject,
  saveProjectToList,
} from './utils/storage';
import { generateSvgString } from './utils/canvasRenderer';
import { smartImportImage, readFileAsDataUrl } from './utils/smartImport';

const HISTORY_LIMIT = 30;

export function App() {
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('logo_studio_lang');
    return (saved as SupportedLanguage) || 'ar';
  });

  const isAr = language === 'ar';

  const [config, setConfig] = useState<LogoConfig>(() => loadCurrentProject());

  // Undo stack and cursor live in one state value so a single pure updater can
  // move both. Splitting them let StrictMode's double-invoked updaters push a
  // duplicate entry per edit, which made every undo need two presses.
  const [history, setHistory] = useState<{ entries: LogoConfig[]; index: number }>(() => ({
    entries: [config],
    index: 0,
  }));
  const [lastSavedAt, setLastSavedAt] = useState<number>(Date.now());

  // Modal open states
  const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(false);
  const [isMockupsOpen, setIsMockupsOpen] = useState<boolean>(false);
  const [isSocialMediaKitOpen, setIsSocialMediaKitOpen] = useState<boolean>(false);
  const [isCropTrimModalOpen, setIsCropTrimModalOpen] = useState<boolean>(false);
  const [cropImageSource, setCropImageSource] = useState<string | null>(null);
  const [isFaviconExportOpen, setIsFaviconExportOpen] = useState<boolean>(false);
  const [isFeatureGraphicOpen, setIsFeatureGraphicOpen] = useState<boolean>(false);
  const [isUniversalResizerOpen, setIsUniversalResizerOpen] = useState<boolean>(false);
  const [isSavedProjectsOpen, setIsSavedProjectsOpen] = useState<boolean>(false);

  // Latest config, readable from callbacks without re-creating them on every edit.
  const configRef = useRef<LogoConfig>(config);
  configRef.current = config;

  // Update language setting
  const toggleLanguage = () => {
    const nextLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(nextLang);
    localStorage.setItem('logo_studio_lang', nextLang);
  };

  // Debounced auto-save of whatever is currently on the canvas.
  useEffect(() => {
    const timer = setTimeout(() => {
      saveCurrentProject(config);
      setLastSavedAt(Date.now());
    }, 500);
    return () => clearTimeout(timer);
  }, [config]);

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
  const handleQuickSave = () => {
    const thumb = generateSvgString(config, 200);
    saveProjectToList(config, thumb);
    setLastSavedAt(Date.now());
  };

  // Apply Template
  const handleSelectTemplate = (template: Template) => {
    const merged: LogoConfig = {
      ...config,
      ...template.config,
      id: 'proj_' + Date.now(),
      name: template.nameAr,
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
  // edge-to-edge -> open the export package. Previously each of those steps
  // was its own disconnected button.
  // ---------------------------------------------------------------------
  const smartImportInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSmartImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImportStatus(isAr ? 'جارٍ قص الحواف وتجهيز المقاسات…' : 'Trimming borders & preparing sizes…');
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const result = await smartImportImage(dataUrl, { autoTrim: true });

      handleConfigChange({
        ...result.patch,
        id: 'proj_' + Date.now(),
        name: file.name.replace(/\.[^.]+$/, '') || 'Imported Logo',
      });

      setImportStatus(
        result.trimmedPercent > 0
          ? isAr
            ? `تم قص ${result.trimmedPercent}% من الحواف الفارغة — جاهز للتصدير`
            : `Trimmed ${result.trimmedPercent}% of empty border — ready to export`
          : isAr
          ? 'الصورة جاهزة للتصدير'
          : 'Image ready to export'
      );

      // Hand straight over to the package export.
      setIsFaviconExportOpen(true);
    } catch (err) {
      console.error('Smart import failed:', err);
      setImportStatus(isAr ? 'تعذر استيراد الصورة' : 'Could not import the image');
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

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+S, Ctrl+E)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        e.preventDefault();
        handleRedo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleQuickSave();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        setIsFaviconExportOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, config]);

  const displayProjectName = config.text || config.name || (isAr ? 'مشروع_بدون_عنوان' : 'Untitled_Design');

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
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
      />

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
        onOpenCropTrim={() => handleOpenCropTrim()}
        onSmartImport={() => smartImportInputRef.current?.click()}
        onOpenFaviconExport={() => setIsFaviconExportOpen(true)}
        onOpenFeatureGraphic={() => setIsFeatureGraphicOpen(true)}
        onOpenUniversalResizer={() => setIsUniversalResizerOpen(true)}
        onOpenSavedProjects={() => setIsSavedProjectsOpen(true)}
        onQuickSave={handleQuickSave}
        lastSavedAt={lastSavedAt}
        language={language}
        onToggleLanguage={toggleLanguage}
      />

      {/* Main Studio Workspace: Sidebar Controls + Interactive Canvas Stage */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative">
        {/* Sidebar Customizer Controls */}
        <aside className="w-full md:w-[380px] lg:w-[410px] h-[45vh] md:h-full shrink-0 order-2 md:order-1 z-10">
          <ControlPanel
            config={config}
            onChange={handleConfigChange}
            language={language}
            onOpenCropTrimModal={handleOpenCropTrim}
          />
        </aside>

        {/* Center Live Stage Preview */}
        <main className="flex-1 h-[55vh] md:h-full order-1 md:order-2 overflow-hidden">
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
      <footer className="h-9 bg-white border-t border-slate-200 flex items-center justify-between px-4 sm:px-6 text-[11px] font-medium text-slate-500 shrink-0">
        <div className="flex items-center gap-4">
          <span>{isAr ? 'المشروع:' : 'Project:'} <strong className="text-slate-700 font-semibold">{displayProjectName}</strong></span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="hidden sm:inline font-mono">{isAr ? 'الدقة:' : 'Resolution:'} 512 × 512 px</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-semibold text-slate-600">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            {isAr ? 'مزامنة السحابة مفعلة' : 'Cloud Sync Enabled'}
          </span>
          <span className="hidden sm:inline text-slate-400 font-mono">v1.5.0</span>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Universal Image Resizer & Multi-Size Converter (Any Dimension & Tamaño) */}
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

      {/* 3. Social Media Design Kit (1:1 Profiles & 16:9 Banners) */}
      <SocialMediaKitModal
        isOpen={isSocialMediaKitOpen}
        onClose={() => setIsSocialMediaKitOpen(false)}
        config={config}
        lang={language}
      />

      {/* 4. Google Play Feature Graphic (1024x500 px) Modal */}
      <FeatureGraphicModal
        isOpen={isFeatureGraphicOpen}
        onClose={() => setIsFeatureGraphicOpen(false)}
        config={config}
        language={language}
      />

      {/* 3. Templates Gallery */}
      <TemplateGalleryModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        currentConfig={config}
        onSelectTemplate={handleSelectTemplate}
        language={language}
      />

      {/* 3. Realistic Live Mockups (Browser Tab, Mobile, Google) */}
      <LiveMockupsModal
        isOpen={isMockupsOpen}
        onClose={() => setIsMockupsOpen(false)}
        config={config}
        language={language}
      />

      {/* 6. Saved Projects Vault */}
      <SavedProjectsModal
        isOpen={isSavedProjectsOpen}
        onClose={() => setIsSavedProjectsOpen(false)}
        onLoadProject={(loaded) => handleConfigChange(loaded)}
        onNewProject={handleNewProject}
        language={language}
      />

      {/* 7. Image Auto-Trim & Manual Crop Modal */}
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
    </div>
  );
}

export default App;
