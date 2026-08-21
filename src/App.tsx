import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { ControlPanel } from './components/ControlPanel';
import { CanvasStage } from './components/CanvasStage';
import { FaviconExportModal } from './components/FaviconExportModal';
import { TemplateGalleryModal } from './components/TemplateGalleryModal';
import { LiveMockupsModal } from './components/LiveMockupsModal';
import { AIGeneratorModal } from './components/AIGeneratorModal';
import { AIImageConverterModal } from './components/AIImageConverterModal';
import { SavedProjectsModal } from './components/SavedProjectsModal';
import { FeatureGraphicModal } from './components/FeatureGraphicModal';
import { UniversalImageResizerModal } from './components/UniversalImageResizerModal';
import { SocialMediaKitModal } from './components/SocialMediaKitModal';
import { LogoConfig, SupportedLanguage, Template } from './types';
import { DEFAULT_LOGO_CONFIG } from './utils/templates';
import {
  loadCurrentProject,
  saveCurrentProject,
  saveProjectToList,
} from './utils/storage';
import { generateSvgString } from './utils/canvasRenderer';

export function App() {
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('logo_studio_lang');
    return (saved as SupportedLanguage) || 'ar';
  });

  const [config, setConfig] = useState<LogoConfig>(() => loadCurrentProject());
  const [history, setHistory] = useState<LogoConfig[]>([config]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [lastSavedAt, setLastSavedAt] = useState<number>(Date.now());

  // Modal open states
  const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(false);
  const [isMockupsOpen, setIsMockupsOpen] = useState<boolean>(false);
  const [isSocialMediaKitOpen, setIsSocialMediaKitOpen] = useState<boolean>(false);
  const [isFaviconExportOpen, setIsFaviconExportOpen] = useState<boolean>(false);
  const [isFeatureGraphicOpen, setIsFeatureGraphicOpen] = useState<boolean>(false);
  const [isUniversalResizerOpen, setIsUniversalResizerOpen] = useState<boolean>(false);
  const [isSavedProjectsOpen, setIsSavedProjectsOpen] = useState<boolean>(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState<boolean>(false);
  const [isImageConverterOpen, setIsImageConverterOpen] = useState<boolean>(false);

  // Debounced auto-save timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update language setting
  const toggleLanguage = () => {
    const nextLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(nextLang);
    localStorage.setItem('logo_studio_lang', nextLang);
  };

  // State change with History support & Partial Patch Safety
  const handleConfigChange = useCallback(
    (newConfigOrPatch: LogoConfig | Partial<LogoConfig>) => {
      setConfig((prev) => {
        const merged: LogoConfig = {
          ...DEFAULT_LOGO_CONFIG,
          ...prev,
          ...newConfigOrPatch,
          updatedAt: Date.now(),
        };

        // Add to history
        setHistory((prevHistory) => {
          const next = prevHistory.slice(0, historyIndex + 1);
          if (next.length > 30) next.shift();
          return [...next, merged];
        });
        setHistoryIndex((prevIdx) => Math.min(prevIdx + 1, 30));

        // Auto-save debounce
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(() => {
          saveCurrentProject(merged);
          setLastSavedAt(Date.now());
        }, 500);

        return merged;
      });
    },
    [historyIndex]
  );

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const targetConfig = history[prevIndex];
      setHistoryIndex(prevIndex);
      setConfig(targetConfig);
      saveCurrentProject(targetConfig);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const targetConfig = history[nextIndex];
      setHistoryIndex(nextIndex);
      setConfig(targetConfig);
      saveCurrentProject(targetConfig);
    }
  }, [historyIndex, history]);

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

  // Apply AI Suggestion
  const handleApplyAISuggestion = (patch: Partial<LogoConfig>) => {
    const updated: LogoConfig = {
      ...config,
      ...patch,
      id: 'proj_' + Date.now(),
    };
    handleConfigChange(updated);
  };

  // New blank project
  const handleNewProject = () => {
    const blank: LogoConfig = {
      ...DEFAULT_LOGO_CONFIG,
      id: 'proj_' + Date.now(),
    };
    handleConfigChange(blank);
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

  const isAr = language === 'ar';
  const displayProjectName = config.text || config.name || (isAr ? 'مشروع_بدون_عنوان' : 'Untitled_Design');

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className="flex flex-col h-screen w-screen bg-slate-50 text-slate-900 font-sans antialiased overflow-hidden select-none"
    >
      {/* Top Main Navigation */}
      <Navbar
        projectName={config.text || config.name || ''}
        onProjectNameChange={(name) => handleConfigChange({ ...config, name, text: name })}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onNewProject={handleNewProject}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenMockups={() => setIsMockupsOpen(true)}
        onOpenSocialMediaKit={() => setIsSocialMediaKitOpen(true)}
        onOpenFaviconExport={() => setIsFaviconExportOpen(true)}
        onOpenFeatureGraphic={() => setIsFeatureGraphicOpen(true)}
        onOpenUniversalResizer={() => setIsUniversalResizerOpen(true)}
        onOpenSavedProjects={() => setIsSavedProjectsOpen(true)}
        onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
        onOpenImageConverter={() => setIsImageConverterOpen(true)}
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
            onOpenImageConverter={() => setIsImageConverterOpen(true)}
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

      {/* 4. AI Generator (Gemini 3.7 Flash) */}
      <AIGeneratorModal
        isOpen={isAIGeneratorOpen}
        onClose={() => setIsAIGeneratorOpen(false)}
        currentConfig={config}
        onApplySuggestion={handleApplyAISuggestion}
        language={language}
      />

      {/* 5. AI Image to Multi-Size Favicon Converter */}
      <AIImageConverterModal
        isOpen={isImageConverterOpen}
        onClose={() => setIsImageConverterOpen(false)}
        language={language}
        onApplyConfig={(newCfg) => handleConfigChange(newCfg)}
      />

      {/* 6. Saved Projects Vault */}
      <SavedProjectsModal
        isOpen={isSavedProjectsOpen}
        onClose={() => setIsSavedProjectsOpen(false)}
        onLoadProject={(loaded) => handleConfigChange(loaded)}
        onNewProject={handleNewProject}
        language={language}
      />
    </div>
  );
}

export default App;
