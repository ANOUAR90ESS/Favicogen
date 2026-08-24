import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  FolderOpen,
  Trash2,
  Upload,
  Clock,
  FileJson,
  Plus,
} from 'lucide-react';
import { LogoConfig, SupportedLanguage } from '../types';
import {
  SavedProjectItem,
  getSavedProjects,
  deleteSavedProject,
  exportProjectAsJson,
} from '../utils/storage';
import { generateSvgString } from '../utils/canvasRenderer';
import { parseLogoConfig } from '../utils/configSchema';
import { Modal } from './Modal';

interface SavedProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadProject: (config: LogoConfig) => void;
  onNewProject: () => void;
  language?: SupportedLanguage;
}

export const SavedProjectsModal: React.FC<SavedProjectsModalProps> = ({
  isOpen,
  onClose,
  onLoadProject,
  onNewProject,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [projects, setProjects] = useState<SavedProjectItem[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Projects live in IndexedDB, so the list is fetched when the modal opens
  // rather than read synchronously during render.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    void getSavedProjects().then((list) => {
      if (!cancelled) setProjects(list);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjects(await deleteSavedProject(id));
  };

  const handleExport = (config: LogoConfig, e: React.MouseEvent) => {
    e.stopPropagation();
    exportProjectAsJson(config);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        // Project files are made to be shared, so this is attacker input:
        // coerce every field to its declared type and range before it can
        // reach the renderer.
        const config = parseLogoConfig(JSON.parse(event.target?.result as string));
        onLoadProject(config);
        onClose();
      } catch (err) {
        console.error('Invalid JSON project:', err);
        setImportError(t('savedProjectsModal.importFailed'));
      }
    };
    reader.onerror = () => setImportError(t('savedProjectsModal.importFailed'));
    reader.readAsText(file);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      label={t('savedProjectsModal.title')}
      className="flex flex-col w-full max-w-4xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
      overlayClassName="z-50 p-3 sm:p-6 bg-slate-900/60"
    >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-600 font-bold shadow-2xs">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {t('savedProjectsModal.title')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('savedProjectsModal.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJson}
              accept=".json,application/json"
              className="hidden"
            />

            {importError && (
              <p role="alert" className="w-full text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-2">
                {importError}
              </p>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{t('savedProjectsModal.importJson')}</span>
            </button>

            <button
              onClick={() => {
                onNewProject();
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t('savedProjectsModal.newDesignBtn')}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-50/30">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12 space-y-3">
              <FolderOpen className="h-12 w-12 text-slate-400" />
              <p className="text-sm font-bold text-slate-700">
                {t('savedProjectsModal.emptyTitle')}
              </p>
              <p className="text-xs text-slate-500 max-w-sm font-medium">
                {t('savedProjectsModal.emptyDesc')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {projects.map((item) => {
                const svgThumbnail = generateSvgString(item.config, 200);
                const dateStr = new Date(item.updatedAt).toLocaleDateString(
                  isAr ? 'ar-EG' : 'en-US',
                  {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }
                );

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onLoadProject(item.config);
                      onClose();
                    }}
                    className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md p-4 transition-all duration-200 cursor-pointer shadow-2xs"
                  >
                    {/* Thumbnail */}
                    <div className="flex h-36 w-full items-center justify-center rounded-xl bg-slate-50 border border-slate-200 p-2 overflow-hidden group-hover:scale-[1.02] transition-transform">
                      <div className="w-24 h-24 drop-shadow-xs" dangerouslySetInnerHTML={{ __html: svgThumbnail }} />
                    </div>

                    {/* Metadata */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="space-y-0.5 max-w-[65%]">
                        <h4 className="text-sm font-bold text-slate-800 truncate">
                          {item.name || t('common.untitledProject')}
                        </h4>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                          <Clock className="h-3 w-3" />
                          <span>{dateStr}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleExport(item.config, e)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Export JSON"
                        >
                          <FileJson className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => void handleDelete(item.id, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
  );
};
