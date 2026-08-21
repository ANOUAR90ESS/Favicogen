import React, { useState, useRef } from 'react';
import {
  X,
  FolderOpen,
  Trash2,
  Download,
  Upload,
  Clock,
  Check,
  FileJson,
  Layers,
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

interface SavedProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadProject: (config: LogoConfig) => void;
  onNewProject: () => void;
  language: SupportedLanguage;
}

export const SavedProjectsModal: React.FC<SavedProjectsModalProps> = ({
  isOpen,
  onClose,
  onLoadProject,
  onNewProject,
  language,
}) => {
  const isAr = language === 'ar';
  const [projects, setProjects] = useState<SavedProjectItem[]>(() => getSavedProjects());
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteSavedProject(id);
    setProjects(updated);
  };

  const handleExport = (config: LogoConfig, e: React.MouseEvent) => {
    e.stopPropagation();
    exportProjectAsJson(config);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          onLoadProject(parsed);
          onClose();
        }
      } catch (err) {
        console.error('Invalid JSON project:', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-4xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-600 font-bold shadow-2xs">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isAr ? 'المشاريع والتصاميم المحفوظة' : 'Saved Projects'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'نظام حفظ تلقائي فوري لمشاريعك مع إمكانية استيراد وتصدير ملفات JSON'
                  : 'Auto-saved local project history with instant JSON backup and restore'}
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
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{isAr ? 'استيراد JSON' : 'Import JSON'}</span>
            </button>

            <button
              onClick={() => {
                onNewProject();
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isAr ? 'مشروع جديد' : 'New Project'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
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
                {isAr ? 'لا توجد مشاريع محفوظة حالياً' : 'No saved projects yet'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm font-medium">
                {isAr
                  ? 'يتم حفظ أي تعديل تجريه تلقائياً، يمكنك أيضاً الضغط على زر "حفظ" في الشريط العلوي لتثبيت نسختك.'
                  : 'Your work is auto-saved continuously in browser storage.'}
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
                          {item.name || (isAr ? 'شعار بدون عنوان' : 'Untitled Logo')}
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
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title={isAr ? 'تصدير JSON' : 'Export JSON'}
                        >
                          <FileJson className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title={isAr ? 'حذف المشروع' : 'Delete Project'}
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
      </div>
    </div>
  );
};
