import React from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  PanelBottomOpen, 
  Plus, 
  Check 
} from 'lucide-react';

/**
 * @component SigningMobileBar
 * @description Bar navigasi & aksi khusus mobile (Bottom Fixed).
 * Menangani paginasi PDF dan tombol pintasan aksi tanda tangan.
 */
const SigningMobileBar = ({ 
  pageNumber, 
  numPages, 
  setPageNumber, 
  onOpenSheet, 
  onOpenCanvas, 
  onFinalize, 
  signatureCount, 
  isSubmitting 
}) => {
  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#202c33] border-t border-slate-200 dark:border-white/5 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] animate-in slide-in-from-bottom duration-500">
      
      {/* 1. Page Navigation Row */}
      <div className="flex items-center justify-center gap-1 px-3 pt-2.5 pb-1">
        <button 
          disabled={pageNumber <= 1} 
          onClick={() => setPageNumber(p => Math.max(p - 1, 1))} 
          className={`p-2 rounded-lg border transition-all flex items-center justify-center shrink-0
            ${pageNumber <= 1 
              ? 'bg-slate-50 dark:bg-slate-800/30 text-slate-300 dark:text-white/20 border-slate-100 dark:border-white/5 cursor-not-allowed' 
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-700 cursor-pointer active:scale-90 active:bg-emerald-50 dark:active:bg-emerald-900/30'
            }
          `}
        >
          <ArrowLeft size={16} />
        </button>
        
        <span className="text-xs font-extrabold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full min-w-[70px] text-center border border-slate-200 dark:border-slate-700">
          {pageNumber} / {numPages || '?'}
        </span>

        <button 
          disabled={pageNumber >= numPages} 
          onClick={() => setPageNumber(p => Math.min(p + 1, numPages))} 
          className={`p-2 rounded-lg border transition-all flex items-center justify-center shrink-0
            ${pageNumber >= numPages 
              ? 'bg-slate-50 dark:bg-slate-800/30 text-slate-300 dark:text-white/20 border-slate-100 dark:border-white/5 cursor-not-allowed' 
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-700 cursor-pointer active:scale-90 active:bg-emerald-50 dark:active:bg-emerald-900/30'
            }
          `}
        >
          <ArrowRight size={16} />
        </button>
      </div>

      {/* 2. Primary Actions Row */}
      <div className="flex items-center gap-2 px-3 pb-3 pt-1">
        
        {/* Panel Toggle (Control Sheet) */}
        <button 
          onClick={onOpenSheet}
          className="relative w-11 h-11 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-90 transition-all border-none"
          title="Panel Kontrol"
        >
          <PanelBottomOpen size={18} />
          {signatureCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
              {signatureCount}
            </span>
          )}
        </button>

        {/* Add Signature (Canvas) */}
        <button 
          onClick={onOpenCanvas}
          className="flex-1 h-11 flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md border-none cursor-pointer active:scale-95 transition-all shadow-emerald-600/20"
        >
          <Plus size={18} />
          <span>Tanda Tangan</span>
        </button>

        {/* Finalize (Submit) */}
        <button 
          onClick={onFinalize}
          disabled={signatureCount === 0 || isSubmitting}
          className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all border-none cursor-pointer shadow-lg
            ${signatureCount === 0 || isSubmitting 
              ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 border border-slate-200 dark:border-white/5 cursor-not-allowed shadow-none' 
              : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 active:scale-90 shadow-emerald-500/20'
            }
          `}
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          ) : (
            <Check size={22} />
          )}
        </button>
      </div>
    </div>
  );
};

export default SigningMobileBar;
