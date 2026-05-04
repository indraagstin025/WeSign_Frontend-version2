import React, { useRef } from 'react';
import { Plus, Trash2, Check, FileText, X } from 'lucide-react';
import { useMobileBottomSheet } from '../hooks/useMobileBottomSheet';

/**
 * @component MobileBottomSheet
 * @description Bottom sheet yang muncul dari bawah layar untuk mobile.
 * Menggantikan SigningSidebar di viewport kecil.
 * Refaktorisasi: Logika gestur dipindahkan ke useMobileBottomSheet hook.
 */
const MobileBottomSheet = ({ 
  isOpen,
  onClose,
  onOpenCanvas, 
  currentSignature, 
  signatures, 
  onRemoveSignature,
  onFinalize,
  isSubmitting,
  // Optional: label tombol aksi utama (default: "Selesaikan Dokumen").
  finalizeText = 'Selesaikan Dokumen',
  // Optional: jika diberikan (boolean), menggantikan logic disable internal.
  // Berguna untuk parent yang ingin kontrol penuh (mis. cegah double submit
  // setelah TTD final tersimpan, atau force-enable mode finalisasi admin
  // tanpa signature).
  disabled = null,
}) => {
  const sheetRef = useRef(null);
  const { state, actions } = useMobileBottomSheet(isOpen, onClose);
  const canFinalize = signatures.length > 0;
  const isDisabled = disabled !== null ? disabled : (!canFinalize || isSubmitting);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="sm:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="sm:hidden fixed bottom-0 left-0 right-0 z-[101] flex flex-col"
        style={{
          // dvh = dynamic viewport height (iOS Safari address bar safe).
          // Fallback ke 85vh untuk browser yang tidak dukung dvh.
          maxHeight: 'min(85vh, 85dvh)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          ...state.sheetStyle
        }}
      >
        {/* Sheet Container */}
        <div className="bg-white dark:bg-[#111b21] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden border-t border-x border-zinc-200 dark:border-white/10">
          
          {/* Drag Handle */}
          <div 
            className="py-3 flex flex-col items-center cursor-grab active:cursor-grabbing select-none"
            {...actions.gestureHandlers}
          >
            <div className="w-10 h-1.5 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-5 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-emerald-500 rounded-full" />
              <h3 className="text-base font-black text-zinc-900 dark:text-white tracking-tight text-left">Panel Kontrol</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 border-none bg-transparent cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div
            className="flex-1 overflow-y-auto px-5 pb-4 space-y-4"
            style={{ maxHeight: 'min(calc(85vh - 180px), calc(85dvh - 180px))' }}
          >
            
            {/* Tombol Tambah Tanda Tangan */}
            <button 
              onClick={() => {
                onOpenCanvas();
                onClose();
              }}
              className="w-full h-12 flex items-center justify-center gap-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-none font-bold text-sm shadow-lg cursor-pointer active:scale-95 transition-all shadow-emerald-600/20"
            >
              <Plus size={20} />
              <span>Tambah Tanda Tangan</span>
            </button>

            {/* Preview Tanda Tangan Aktif */}
            {currentSignature && (
              <div className="space-y-2 text-left">
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">Tanda Tangan Aktif</p>
                <div className="w-full aspect-[2.5/1] bg-white rounded-2xl border border-zinc-100 dark:border-white/10 flex items-center justify-center p-4 shadow-inner overflow-hidden">
                  <img src={currentSignature} alt="Signature" className="max-w-full max-h-full object-contain" />
                </div>
              </div>
            )}

            {/* Daftar Signature yang Ditempatkan */}
            {signatures.length > 0 && (
              <div className="space-y-2 text-left">
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">Ditempatkan ({signatures.length})</p>
                <div className="space-y-2">
                  {signatures.map((sig, idx) => (
                    <div 
                      key={sig.id} 
                      className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 group transition-all"
                    >
                      <span className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 border border-zinc-100 dark:border-white/10">
                        {idx + 1}
                      </span>
                      <span className="flex-1 text-sm font-bold text-zinc-700 dark:text-zinc-200">
                        Halaman {sig.pageNumber}
                      </span>
                      <button 
                        onClick={() => onRemoveSignature(sig.id)} 
                        className="p-2 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg border-none bg-transparent cursor-pointer transition-colors active:scale-90"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {signatures.length === 0 && !currentSignature && (
              <div className="flex flex-col items-center justify-center text-center py-8 px-4 opacity-40">
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-zinc-300 mb-3 flex items-center justify-center text-zinc-300">
                   <FileText size={22} />
                </div>
                <p className="text-xs font-bold text-zinc-400 uppercase">Belum ada tanda tangan</p>
                <p className="text-[10px] text-zinc-400 mt-1">Tap "Tambah Tanda Tangan" untuk memulai</p>
              </div>
            )}
          </div>

          {/* Fixed Bottom Action */}
          <div className="p-5 bg-zinc-50 dark:bg-[#202c33] border-t border-zinc-200 dark:border-white/5">
            <button 
              onClick={() => {
                onFinalize();
                onClose();
              }}
              disabled={isDisabled}
              className={`w-full h-12 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all border-none cursor-pointer shadow-lg
                ${isDisabled
                  ? 'bg-zinc-200 dark:bg-[#111b21] text-zinc-400 dark:text-zinc-600 cursor-not-allowed shadow-none' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-emerald-600/20'
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
        </div>
      </div>
    </>
  );
};

export default MobileBottomSheet;
