import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * @component ConfirmModal
 * @description Modal konfirmasi kustom yang selaras dengan desain WeSign (Glassmorphism + Emerald).
 *              Bisa dipakai ulang untuk berbagai aksi konfirmasi (hapus dokumen, logout, dll.)
 * 
 * @param {boolean} isOpen - Tampilkan/sembunyikan modal
 * @param {function} onClose - Callback saat modal ditutup (batal)
 * @param {function} onConfirm - Callback saat tombol konfirmasi ditekan
 * @param {string} title - Judul modal
 * @param {string} message - Pesan deskripsi
 * @param {string} confirmText - Label tombol konfirmasi (default: "Ya, Lanjutkan")
 * @param {string} cancelText - Label tombol batal (default: "Batal")
 * @param {'danger'|'warning'|'info'} variant - Skema warna (default: 'danger')
 * @param {boolean} loading - Tampilkan spinner di tombol konfirmasi
 */
const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Konfirmasi', 
  message = 'Apakah Anda yakin?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  variant = 'danger',
  loading = false,
  showClose = true
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      button: 'bg-red-600 hover:bg-red-700 shadow-red-600/25',
    },
    warning: {
      icon: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25',
    },
    info: {
      icon: 'bg-primary/10 dark:bg-primary/20 text-primary',
      button: 'bg-primary hover:bg-primary-dark shadow-primary/25',
    },
  };

  const style = variantStyles[variant] || variantStyles.danger;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={!loading ? onClose : undefined}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl animate-[modalIn_0.2s_ease-out] overflow-hidden">
        
        {/* Tombol X (Tutup) */}
        {showClose && (
          <button 
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors bg-transparent border-none cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        )}

        {/* Konten */}
        <div className="p-6 pt-8 flex flex-col items-center text-center">
          {/* Ikon */}
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 ${style.icon}`}>
            <AlertTriangle size={28} strokeWidth={2} />
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading mb-2">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
            {message}
          </p>
        </div>

        {/* Footer Tombol */}
        <div className="flex gap-3 p-5 pt-2 pb-6 px-6">
          {cancelText && (
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border-none cursor-pointer disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all shadow-lg border-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${style.button}`}
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Proses...</>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
