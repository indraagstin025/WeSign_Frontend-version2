import React from 'react';
import { Plus, Trash2, Check, FileText, PenTool, Type, Stamp, Calendar, ChevronDown, MoreVertical } from 'lucide-react';

/**
 * @component SigningSidebar
 * @description Sidebar kiri halaman signing — dengan logo di atas.
 * Berisi: Logo + Tombol TTD + Preview aktif + Tools + Progress + Kolaborator.
 */
const SigningSidebar = ({ 
  onOpenCanvas,
  onForceOpenCanvas,
  onOpenParaf,
  onOpenStamp,
  onOpenText,
  onOpenDate,
  currentSignature,
  activeElement,
  signatures, 
  onRemoveSignature,
  onFinalize,
  isSubmitting,
  finalizeText = "Selesaikan Dokumen",
  disabled = null,
  children = null,
}) => {
  const canFinalize = signatures.length > 0;
  const isDisabled = disabled !== null ? disabled : (!canFinalize || isSubmitting);

  return (
    <aside className="hidden sm:flex w-56 lg:w-64 bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800 flex-col shrink-0 z-10 h-full">

      {/* LOGO HEADER */}
      <div className="h-20 flex flex-col items-center justify-center px-2 shrink-0">
        <img 
          src="/icons/LogoWhiteMode.svg" 
          alt="WeSign Logo"
          className="w-44 h-auto object-contain transition-all duration-300 block dark:hidden"
        />
        <img 
          src="/icons/LogoDarkMode.svg" 
          alt="WeSign Logo"
          className="w-44 h-auto object-contain transition-all duration-300 hidden dark:block"
        />
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-emerald-500 rounded-full" />
          <h3 className="text-[12px] font-bold text-zinc-900 dark:text-white tracking-tight">Tanda Tangan</h3>
        </div>

        {/* Tombol Tambah TTD — selalu buka modal */}
        <button 
          onClick={onForceOpenCanvas || onOpenCanvas}
          className="w-full h-9 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white border-none font-bold text-[11px] shadow-md shadow-emerald-500/20 cursor-pointer active:scale-[0.97] transition-all relative"
        >
          <Plus size={15} />
          <span>Tambah Tanda Tangan</span>
          <ChevronDown size={12} className="ml-1 opacity-70" />
        </button>

        {/* Preview Elemen Aktif */}
        {currentSignature && (
          <div className="space-y-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                {activeElement?.type === 'initial' ? 'Paraf Aktif' 
                  : activeElement?.type === 'stamp' ? 'Stamp Aktif'
                  : activeElement?.type === 'text' ? 'Teks Aktif'
                  : activeElement?.type === 'date' ? 'Tanggal Aktif'
                  : 'Tanda Tangan Aktif'}
              </p>
              <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">Default</span>
            </div>
            <div className="w-full aspect-[2.5/1] bg-white rounded-lg border border-zinc-100 dark:border-zinc-700 flex items-center justify-center p-2 overflow-hidden">
              <img src={currentSignature} alt="Active element" className="max-w-full max-h-full object-contain" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-200">
                  {activeElement?.type === 'initial' ? 'Paraf Anda' 
                    : activeElement?.type === 'stamp' ? 'Stamp Anda'
                    : activeElement?.type === 'text' ? 'Teks Anda'
                    : activeElement?.type === 'date' ? 'Tanggal Anda'
                    : 'Signature Anda'}
                </p>
                <p className="text-[8px] text-zinc-400 dark:text-zinc-500">Dibuat: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <button
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 bg-transparent border-none cursor-pointer rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Opsi tanda tangan"
              >
                <MoreVertical size={12} />
              </button>
            </div>
          </div>
        )}

        {/* TOOLS Section */}
        <div className="space-y-1.5">
          <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Tools</p>
          
          <button 
            onClick={onOpenCanvas}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left bg-transparent border-none cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
          >
            <PenTool size={14} className="text-zinc-400 group-hover:text-emerald-500 transition-colors" />
            <div>
              <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">Signature</p>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500">Buat tanda tangan</p>
            </div>
          </button>

          {onOpenParaf && (
          <button 
            onClick={onOpenParaf}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left bg-transparent border-none cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
          >
            <span className="text-[12px] font-bold text-zinc-400 group-hover:text-emerald-500 transition-colors w-[14px] text-center">IA</span>
            <div>
              <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">Paraf (Initials)</p>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500">Buat paraf / inisial</p>
            </div>
          </button>
          )}

          {onOpenStamp && (
          <button 
            onClick={onOpenStamp}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left bg-transparent border-none cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
          >
            <Stamp size={14} className="text-zinc-400 group-hover:text-emerald-500 transition-colors" />
            <div>
              <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">Stamp</p>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500">Tambahkan stamp</p>
            </div>
          </button>
          )}

          {onOpenText && (
          <button 
            onClick={onOpenText}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left bg-transparent border-none cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
          >
            <Type size={14} className="text-zinc-400 group-hover:text-emerald-500 transition-colors" />
            <div>
              <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">Text</p>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500">Tambahkan teks</p>
            </div>
          </button>
          )}

          {onOpenDate && (
          <button 
            onClick={onOpenDate}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left bg-transparent border-none cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
          >
            <Calendar size={14} className="text-zinc-400 group-hover:text-emerald-500 transition-colors" />
            <div>
              <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">Date Field</p>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500">Tambahkan tanggal</p>
            </div>
          </button>
          )}
        </div>

        {/* Daftar Signature yang Ditempatkan */}
        {signatures.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              Ditempatkan ({signatures.length})
            </p>
            <div className="space-y-1">
              {signatures.map((sig, idx) => (
                <div 
                  key={sig.id} 
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 group transition-all"
                >
                  <span className="w-5 h-5 rounded bg-white dark:bg-zinc-800 flex items-center justify-center text-[9px] font-bold text-zinc-400 border border-zinc-100 dark:border-zinc-700">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-[10px] font-semibold text-zinc-700 dark:text-zinc-200">
                    Halaman {sig.pageNumber}
                  </span>
                  <button
                    onClick={() => onRemoveSignature(sig.id)}
                    className="p-1 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md border-none bg-transparent cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
                    title="Hapus"
                    aria-label={`Hapus tanda tangan halaman ${sig.pageNumber}`}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

        {/* Children: Progress Kolaborator / Audit Trail / Tolak Dokumen */}
        {children}
      </div>

      {/* FIXED BOTTOM ACTION */}
      <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
        <button 
          onClick={onFinalize}
          disabled={isDisabled}
          className={`w-full h-9 flex items-center justify-center gap-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer border-none
            ${isDisabled
              ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed' 
              : 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.97] shadow-md shadow-emerald-500/20'
            }
          `}
        >
          {isSubmitting ? (
             <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Check size={14} />
              <span>{finalizeText}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default SigningSidebar;
