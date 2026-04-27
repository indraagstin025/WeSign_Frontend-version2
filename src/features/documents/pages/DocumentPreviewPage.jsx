import React from 'react';
import { 
  FileText, 
  Download, 
  AlertCircle,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { useDocumentPreview } from '../hooks/useDocumentPreview';

/**
 * @page DocumentPreviewPage
 * @description Halaman pratinjau dokumen internal (White-Label).
 * Memuat file PDF di dalam iframe untuk menyembunyikan URL Supabase.
 */
const DocumentPreviewPage = () => {
  const { state, actions } = useDocumentPreview();

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-50 dark:bg-zinc-950 flex flex-col overflow-hidden animate-in fade-in duration-300">
      
      {/* HEADER NAVIGASI */}
      <div className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 sm:px-6 shadow-sm shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <button 
            onClick={actions.handleBack}
            className="p-2 -ml-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-all border-none bg-transparent cursor-pointer flex items-center gap-1 group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline font-bold text-sm">Kembali</span>
          </button>
          
          <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
          
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
              <FileText size={18} />
            </div>
            <div className="truncate text-left">
              <h1 className="text-sm font-bold text-zinc-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
                {state.doc ? state.doc.title : 'Memuat Dokumen...'}
              </h1>
              {state.doc && (
                <p className="text-[10px] text-zinc-500 dark:text-zinc-500 font-bold uppercase tracking-widest">{state.doc.type || 'General Document'}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={actions.handleDownload}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all border-none bg-transparent cursor-pointer"
          >
            <Download size={16} /> Unduh
          </button>
          <button 
            onClick={actions.openInNewTab}
            disabled={!state.url}
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-all border-none bg-transparent cursor-pointer disabled:opacity-30"
            title="Buka di Tab Baru"
          >
            <ExternalLink size={20} />
          </button>
        </div>
      </div>

      {/* VIEWER AREA */}
      <div className="flex-1 relative bg-zinc-200 dark:bg-zinc-900/50 overflow-hidden">
        {state.loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
            <div className="relative">
               <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
               <FileText size={24} className="absolute inset-0 m-auto text-primary animate-pulse" />
            </div>
            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest animate-pulse">Menyiapkan Pratinjau...</p>
          </div>
        ) : state.error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-3xl flex items-center justify-center text-rose-500 mb-2 border border-dashed border-rose-200 dark:border-rose-900/30">
              <AlertCircle size={32} />
            </div>
            <div className="max-w-sm">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Gagal Memuat Pratinjau</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">{state.error}</p>
            </div>
            <button 
              onClick={actions.reload}
              className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/25 border-none cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <iframe 
            src={`${state.url}#toolbar=0&navpanes=0`} 
            className="w-full h-full border-none shadow-inner bg-white"
            title="PDF Preview"
          />
        )}
      </div>

    </div>
  );
};

export default DocumentPreviewPage;
