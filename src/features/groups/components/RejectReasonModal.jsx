import React, { useState, useEffect, useRef } from 'react';
import { XCircle, X } from 'lucide-react';

/**
 * @component RejectReasonModal
 * @description Modal untuk input alasan penolakan dokumen group signing.
 *
 * [H-4] Replace `window.prompt('Alasan penolakan...')` yang blocking,
 * tidak match design WeSign, tidak bisa di-close dengan ESC, dan
 * tidak punya cancel state yang jelas.
 *
 * Behavior:
 * - Submit dengan reason kosong tetap diterima (alasan opsional, sama dengan
 *   `prompt` lama yang `null` ketika cancel vs string kosong ketika submit)
 * - Cancel atau ESC -> onClose() tanpa onSubmit
 * - Backdrop click -> onClose() (kecuali loading)
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {(reason: string) => void} props.onSubmit - Dipanggil dengan trimmed reason (boleh empty string)
 * @param {string} [props.title='Tolak Dokumen'] - Judul modal
 * @param {string} [props.documentTitle] - Judul dokumen yang ditolak (untuk konteks)
 * @param {boolean} [props.loading=false]
 */
const RejectReasonModal = ({
  isOpen,
  onClose,
  onSubmit,
  title = 'Tolak Dokumen',
  documentTitle,
  loading = false,
}) => {
  const [reason, setReason] = useState('');
  const textareaRef = useRef(null);

  // Auto-focus textarea setelah modal mount.
  // Reset reason di-handle oleh wrapper: onClose/onSubmit di parent component
  // memanggil setRejectOpen(false), lalu saat di-open lagi, kita reset di
  // handler onOpen (lihat onClick caller). Pattern ini menghindari
  // setState-in-effect lint error.
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => textareaRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [isOpen]);

  // Reset reason saat user klik close/cancel atau setelah submit.
  // Wrapper di handleClose/handleSubmit, bukan di useEffect, untuk avoid
  // cascading renders dari setState-in-effect (ESLint react-hooks/set-state-in-effect).
  const handleClose = () => {
    setReason('');
    onClose();
  };

  // Listen ESC untuk close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // handleClose adalah closure stable per render — re-bind tiap render
    // tidak masalah karena listener addEventListener idempotent dengan ref
    // function instance, dan effect cleanup men-detach instance lama.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, loading]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = reason.trim();
    setReason('');
    onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={!loading ? handleClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-[modalIn_0.2s_ease-out] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-reason-modal-title"
      >
        {/* Tombol X (Tutup) */}
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors bg-transparent border-none cursor-pointer disabled:opacity-50"
          aria-label="Tutup"
        >
          <X size={18} />
        </button>

        {/* Konten */}
        <div className="p-6 pt-8">
          {/* Ikon + Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <XCircle size={24} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0 mt-1">
              <h3 id="reject-reason-modal-title" className="text-lg font-bold text-zinc-900 dark:text-white font-heading">
                {title}
              </h3>
              {documentTitle && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                  {documentTitle}
                </p>
              )}
            </div>
          </div>

          <label
            htmlFor="reject-reason-textarea"
            className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2"
          >
            Alasan penolakan <span className="font-normal normal-case lowercase text-zinc-400">(opsional)</span>
          </label>
          <textarea
            id="reject-reason-textarea"
            ref={textareaRef}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
            rows={4}
            placeholder="Contoh: Dokumen masih perlu revisi pada bagian XYZ"
            maxLength={500}
            className="w-full px-3 py-2.5 text-[13px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-zinc-900 dark:text-white transition-all resize-none disabled:opacity-50"
          />
          <p className="text-[10px] text-zinc-400 mt-1 text-right">{reason.length}/500</p>
        </div>

        {/* Footer Tombol */}
        <div className="flex gap-3 p-5 pt-0 pb-6 px-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border-none cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-400/30"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all shadow-lg shadow-rose-600/25 bg-rose-600 hover:bg-rose-700 border-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500/40"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Menolak...
              </>
            ) : (
              'Tolak Dokumen'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RejectReasonModal;
