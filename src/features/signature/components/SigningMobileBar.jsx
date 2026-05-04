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
 * Mode finalisasi (admin + readyToFinalize):
 *  - Tombol "Tanda Tangan" disembunyikan.
 *  - Tombol kanan menampilkan label "Finalisasi Dokumen" (bukan icon-only)
 *    sebagai aksi primer flex-1.
 */
const SigningMobileBar = ({ 
  // Pagination dipindahkan ke SigningFooter — props pageNumber/numPages/
  // setPageNumber tetap diterima (ignored) demi backward-compat dengan
  // DocumentSigningPage yang masih meneruskannya.
  onOpenSheet, 
  onOpenCanvas, 
  onFinalize, 
  signatureCount, 
  isSubmitting,
  // Optional: kalau true, tampilkan hint "Tap PDF untuk Menempel TTD"
  // (gunakan saat user sudah punya currentSignature tapi belum drop ke PDF)
  showPlacementHint = false,
  // Optional: kalau true, tombol kanan tampil sebagai tombol "Finalisasi"
  // berlabel (untuk admin di mode readyToFinalize). Default: tombol icon Check.
  isFinalizeMode = false,
  // Optional: label tombol finalisasi (default: "Finalisasi Dokumen").
  finalizeText = 'Finalisasi Dokumen',
  // Optional: jika diberikan (boolean), menggantikan logic disable internal.
  // Berguna untuk parent yang ingin kontrol penuh (mis. cegah double submit
  // setelah TTD final tersimpan, atau enable di mode finalisasi admin tanpa
  // perlu signature).
  disabled = null,
}) => {
  const isDisabled = disabled !== null ? disabled : (signatureCount === 0 || isSubmitting);
  return (
    <div
      className="sm:hidden fixed left-4 right-4 bg-white/95 dark:bg-[#202c33]/95 backdrop-blur-md border border-zinc-200 dark:border-white/5 z-[130] shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl animate-in slide-in-from-bottom duration-500 pointer-events-auto"
      style={{
        // 80px = SigningFooter (h-16 = 64px) + 16px gap visual.
        // Tambah safe-area-inset-bottom agar tidak ketutup home indicator iOS.
        bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Hint placement — pengganti hint footer yang tersembunyi di mobile.
          Hanya tampil saat user sudah punya signature tapi belum drop ke PDF. */}
      {showPlacementHint && (
        <p className="px-3 pt-2 text-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          Ketuk PDF untuk Menempel Tanda Tangan
        </p>
      )}

      {/* Action Buttons (Pagination ada di footer) */}
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

        {/* Add Signature (Canvas) — disembunyikan di mode finalisasi karena
            admin sudah/tidak perlu menambah TTD. */}
        {!isFinalizeMode && (
          <button 
            onClick={onOpenCanvas}
            className="flex-1 h-11 flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md border-none cursor-pointer active:scale-95 transition-all shadow-emerald-600/20"
          >
            <Plus size={18} />
            <span>Tanda Tangan</span>
          </button>
        )}

        {/* Tombol Aksi Utama: Simpan TTD (mode signer) atau Finalisasi (admin).
            Mode finalisasi → flex-1 berlabel, mode signer → icon-only kompak. */}
        <button 
          onClick={onFinalize}
          disabled={isDisabled}
          className={
            isFinalizeMode
              ? `flex-1 h-11 flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-all border-none cursor-pointer shadow-lg
                ${isDisabled
                  ? 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 text-white active:scale-95 shadow-emerald-600/20'
                }`
              : `w-11 h-11 flex items-center justify-center rounded-xl transition-all border-none cursor-pointer shadow-lg
                ${isDisabled
                  ? 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 border border-zinc-200 dark:border-white/5 cursor-not-allowed shadow-none' 
                  : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 active:scale-90 shadow-emerald-500/20'
                }`
          }
          title={isFinalizeMode ? finalizeText : 'Simpan Tanda Tangan'}
        >
          {isSubmitting ? (
            <div className={`${isFinalizeMode ? 'w-5 h-5 border-white/20 border-t-white' : 'w-5 h-5 border-emerald-500/20 border-t-emerald-500'} border-2 rounded-full animate-spin`} />
          ) : (
            <>
              <Check size={isFinalizeMode ? 18 : 22} />
              {isFinalizeMode && <span>{finalizeText}</span>}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SigningMobileBar;
