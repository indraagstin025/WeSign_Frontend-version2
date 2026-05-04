import React from 'react';
import { 
  PanelBottomOpen, 
  Plus, 
  Check 
} from 'lucide-react';

/**
 * @component SigningMobileBar
 * @description Bar navigasi & aksi khusus mobile (Bottom Fixed).
 * Menangani paginasi PDF dan tombol pintasan aksi tanda tangan.
 *
 * @param {'sign'|'finalize'} mode - 'sign' = alur tanda tangan biasa,
 *   'finalize' = admin siap memfinalisasi (tombol utama jadi "Finalisasi Dokumen").
 */
const SigningMobileBar = ({ 
  pageNumber, 
  numPages, 
  setPageNumber, 
  onOpenSheet, 
  onOpenCanvas, 
  onFinalize, 
  signatureCount, 
  isSubmitting,
  mode = 'sign',
}) => {
  const isFinalizeMode = mode === 'finalize';
  const finalizeDisabled = isSubmitting || (!isFinalizeMode && signatureCount === 0);

  return (
    <div className="sm:hidden fixed bottom-1 left-4 right-4 bg-white/95 dark:bg-[#202c33]/95 backdrop-blur-md border border-zinc-200 dark:border-white/5 z-[130] shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl animate-in slide-in-from-bottom duration-500 mb-20 pointer-events-auto">
      <div className="flex items-center gap-2 p-2">
        
        {/* Panel Toggle (Control Sheet) */}
        <button 
          onClick={onOpenSheet}
          className="relative w-11 h-11 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 cursor-pointer active:scale-90 transition-all border-none"
          title="Panel Kontrol"
        >
          <PanelBottomOpen size={18} />
          {signatureCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
              {signatureCount}
            </span>
          )}
        </button>

        {isFinalizeMode ? (
          /* Finalize Mode: Tombol prominen "Finalisasi Dokumen" */
          <button
            onClick={onFinalize}
            disabled={finalizeDisabled}
            className={`flex-1 h-11 flex items-center justify-center gap-2 rounded-xl font-bold text-sm border-none transition-all
              ${finalizeDisabled
                ? 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer'
              }
            `}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check size={18} />
                <span>Finalisasi Dokumen</span>
              </>
            )}
          </button>
        ) : (
          <>
            {/* Add Signature (Canvas) */}
            <button 
              onClick={onOpenCanvas}
              className="flex-1 h-11 flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md border-none cursor-pointer active:scale-95 transition-all shadow-emerald-600/20"
            >
              <Plus size={18} />
              <span>Tanda Tangan</span>
            </button>

            {/* Submit (Save / Finalize) */}
            <button 
              onClick={onFinalize}
              disabled={finalizeDisabled}
              className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all border-none cursor-pointer shadow-lg
                ${finalizeDisabled
                  ? 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 border border-zinc-200 dark:border-white/5 cursor-not-allowed shadow-none' 
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
          </>
        )}
      </div>
    </div>
  );
};

export default SigningMobileBar;
