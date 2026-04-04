import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';

/**
 * @component StatusModal
 * @description Modal feedback untuk status Sukses, Error, atau Warning.
 *              Mengikuti bahasa desain premium WeSign (Glassmorphism).
 * 
 * @param {boolean} isOpen - Status buka/tutup modal
 * @param {function} onClose - Callback saat modal ditutup
 * @param {'success'|'error'|'warning'} type - Tipe status (ikon & warna)
 * @param {string} title - Judul pesan
 * @param {string} message - Deskripsi pesan
 * @param {string} buttonText - Label tombol utama
 * @param {function} onConfirm - Callback tambahan saat tombol diklik (opsional)
 */
const StatusModal = ({ 
  isOpen, 
  onClose, 
  type = 'success', 
  title, 
  message, 
  buttonText = 'Tutup',
  onConfirm
}) => {
  if (!isOpen) return null;

  const themes = {
    success: {
      icon: <CheckCircle2 size={32} className="text-emerald-500" />,
      bgIcon: 'bg-emerald-500/10',
      button: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20',
      glow: 'shadow-[0_0_40px_rgba(16,185,129,0.15)]'
    },
    error: {
      icon: <XCircle size={32} className="text-rose-500" />,
      bgIcon: 'bg-rose-500/10',
      button: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20',
      glow: 'shadow-[0_0_40px_rgba(244,63,94,0.15)]'
    },
    warning: {
      icon: <AlertCircle size={32} className="text-amber-500" />,
      bgIcon: 'bg-amber-500/10',
      button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20',
      glow: 'shadow-[0_0_40px_rgba(245,158,11,0.15)]'
    }
  };

  const current = themes[type] || themes.success;

  const handleAction = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className={`relative w-full max-w-sm bg-white dark:bg-[#111b21] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${current.glow}`}>
        
        {/* Tombol Tutup X */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all border-none cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="p-8 pt-12 flex flex-col items-center text-center">
          {/* Ikon Wrapper */}
          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 ${current.bgIcon} relative`}>
             {current.icon}
             {/* Subtle animated ring around icon */}
             <div className="absolute inset-0 rounded-[2rem] border border-current opacity-20 animate-ping duration-[3s]" />
          </div>

          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-3">
            {title}
          </h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-8 px-2">
            {message}
          </p>

          <button
            onClick={handleAction}
            className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-white transition-all shadow-xl border-none cursor-pointer active:scale-95 ${current.button}`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusModal;
