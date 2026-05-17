import React from 'react';
import { Lock, Unlock, ChevronLeft, Settings, Check, CloudUpload } from 'lucide-react';

/**
 * @component SigningNavbar
 * @description Navbar halaman signing — minimalis.
 * Layout: [◀ Judul] ... spacer ... [⚙ Pengaturan Dokumen] [Status Badge]
 * 
 * Status badge berubah berdasarkan prop `status`:
 * - 'unsigned'  → 🔓 Belum Terenkripsi (abu)
 * - 'saving'    → ☁️ Menyimpan... (biru, pulse)
 * - 'saved'     → ✓ Tersimpan (hijau, fade)
 * - 'encrypted' → 🔒 Terenkripsi (hijau)
 * - 'locked'    → 🔒 Dokumen Terkunci (hijau solid)
 */
const SigningNavbar = ({ 
  title, 
  onBack,
  onOpenSettings,
  status = 'unsigned', // 'unsigned' | 'saving' | 'saved' | 'encrypted' | 'locked'
}) => {

  const statusConfig = {
    unsigned: {
      icon: <Unlock size={12} />,
      label: 'Belum Terenkripsi',
      className: 'text-zinc-400 dark:text-zinc-500',
    },
    saving: {
      icon: <CloudUpload size={12} className="animate-pulse" />,
      label: 'Menyimpan...',
      className: 'text-blue-500 dark:text-blue-400',
    },
    saved: {
      icon: <Check size={12} />,
      label: 'Tersimpan',
      className: 'text-emerald-600 dark:text-emerald-400',
    },
    encrypted: {
      icon: <Lock size={12} />,
      label: 'Terenkripsi',
      className: 'text-emerald-600 dark:text-emerald-400',
    },
    locked: {
      icon: <Lock size={12} />,
      label: 'Dokumen Terkunci',
      className: 'text-emerald-600 dark:text-emerald-400',
    },
  };

  const currentStatus = statusConfig[status] || statusConfig.unsigned;

  return (
    <header className="h-14 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between px-4 shrink-0 z-20">
      
      {/* LEFT: Back + Title */}
      <div className="flex items-center gap-2 min-w-0">
        {onBack && (
          <button 
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 transition-all border-none bg-transparent cursor-pointer"
            aria-label="Kembali"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        <h1 className="text-[13px] font-semibold text-zinc-800 dark:text-white truncate max-w-[250px] lg:max-w-lg">
          {title || 'Untitled'}
        </h1>
      </div>

      {/* RIGHT: Settings Button + Status Badge */}
      <div className="flex items-center gap-3 shrink-0">
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 transition-all bg-transparent border-none cursor-pointer flex items-center justify-center"
            aria-label="Pengaturan Dokumen"
            title="Pengaturan Dokumen"
          >
            <Settings size={16} />
          </button>
        )}

        {/* Status Badge — hanya tampil jika ada status */}
        {status && statusConfig[status] && (
          <div className={`flex items-center gap-1.5 shrink-0 transition-all ${currentStatus.className}`}>
            {currentStatus.icon}
            <span className="text-[11px] font-medium hidden sm:inline">{currentStatus.label}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default SigningNavbar;
