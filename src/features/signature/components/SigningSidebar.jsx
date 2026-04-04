import React from 'react';
import { Plus, Trash2, Check, FileText } from 'lucide-react';

/**
 * @component SigningSidebar
 * @description Sidebar untuk halaman penandatanganan - Clean Minimalist Style.
 */
const SigningSidebar = ({ 
  onOpenCanvas, 
  currentSignature, 
  signatures, 
  onRemoveSignature,
  onFinalize,
  isSubmitting,
  finalizeText = "Selesaikan Dokumen"
}) => {
  const canFinalize = signatures.length > 0;

  return (
    <aside className="hidden sm:flex w-72 bg-white dark:bg-[#111b21] border-r border-slate-200 dark:border-white/5 flex-col shrink-0 z-10 overflow-hidden relative">
      {/* SCROLLABLE AREA */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Judul Sidebar */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-emerald-500 rounded-full" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Panel Kontrol</h3>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed px-1">
            Kelola alat tanda tangan, pratinjau penempatan, dan selesaikan proses dokumen Anda di sini.
          </p>
        </div>
        <div className="h-px bg-slate-100 dark:bg-white/5" />

        {/* Tombol Utama */}
        <button 
          onClick={onOpenCanvas}
          className="w-full h-11 flex items-center justify-center gap-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-none font-bold text-sm shadow-md cursor-pointer active:scale-95 transition-all"
        >
          <Plus size={20} />
          <span>Tambah Tanda Tangan</span>
        </button>

        {/* Preview Tanda Tangan Aktif */}
        {currentSignature && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Tanda Tangan Aktif</p>
            <div className="w-full aspect-[2.5/1] bg-white rounded-2xl border border-slate-100 dark:border-white/10 flex items-center justify-center p-4 shadow-inner overflow-hidden">
              <img src={currentSignature} alt="Signature" className="max-w-full max-h-full object-contain" />
            </div>
          </div>
        )}

        {/* Daftar Signature yang Ditempatkan */}
        {signatures.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Ditempatkan ({signatures.length})</p>
            <div className="space-y-2">
              {signatures.map((sig, idx) => (
                <div 
                  key={sig.id} 
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group transition-all"
                >
                  <span className="w-6 h-6 rounded bg-white dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-100 dark:border-white/10">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Halaman {sig.pageNumber}
                  </span>
                  <button 
                    onClick={() => onRemoveSignature(sig.id)} 
                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg border-none bg-transparent cursor-pointer transition-colors"
                    title="Hapus"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {signatures.length === 0 && !currentSignature && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4 opacity-40">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 mb-3 flex items-center justify-center text-slate-300">
               <FileText size={20} />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Belum ada tanda tangan</p>
          </div>
        )}
      </div>

      {/* FIXED BOTTOM ACTION */}
      <div className="p-5 bg-slate-50 dark:bg-[#202c33] border-t border-slate-200 dark:border-white/5">
        <button 
          onClick={onFinalize}
          disabled={!canFinalize || isSubmitting}
          className={`w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-lg
            ${!canFinalize || isSubmitting
              ? 'bg-slate-200 dark:bg-[#111b21] text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none' 
              : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
            }
          `}
        >
          {isSubmitting ? (
             <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Check size={18} />
              <span>{finalizeText}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default SigningSidebar;
