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
    <div className="sm:hidden fixed bottom-1 left-4 right-4 bg-white/95 dark:bg-[#202c33]/95 backdrop-blur-md border border-slate-200 dark:border-white/5 z-[130] shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl animate-in slide-in-from-bottom duration-500 mb-20 pointer-events-auto">
      {/* 1. Action Buttons Only (Pagination removed as it is in the footer) */}
      <div className="flex items-center gap-2 p-2">
        
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
