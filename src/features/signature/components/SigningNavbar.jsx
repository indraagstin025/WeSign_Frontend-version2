import React from 'react';
import { FileText, Sun, Moon, ChevronLeft } from 'lucide-react';

/**
 * @component SigningNavbar
 * @description Header khusus untuk halaman penandatanganan dokumen (Focused Mode).
 */
const SigningNavbar = ({ 
  title, 
  theme, 
  toggleTheme, 
  onBack 
}) => {
  return (
    <header className="h-20 bg-white dark:bg-[#202c33] border-b border-zinc-200 dark:border-white/5 flex items-center justify-between px-4 sm:px-8 shadow-sm shrink-0 z-20">
      <div className="flex items-center gap-2 min-w-0">
        {onBack && (
          <button 
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 dark:text-white transition-all border-none bg-transparent cursor-pointer flex items-center gap-1.5"
          >
            <ChevronLeft size={20} />
            <span className="hidden md:inline font-bold text-sm">Keluar</span>
          </button>
        )}
        
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 ml-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-500/20">
            <FileText size={22} />
          </div>
          <div className="flex flex-col min-w-0">
             <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-0.5">Nama Dokumen</p>
             <h1 className="text-lg font-black text-zinc-900 dark:text-white truncate max-w-[150px] md:max-w-md leading-tight">
               {title || 'Untitled Document'}
             </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme} 
          className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-all text-zinc-500 dark:text-zinc-400 border-none bg-transparent cursor-pointer flex items-center justify-center"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="h-4 w-px bg-zinc-200 dark:bg-white/10 hidden sm:block" />

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter hidden sm:inline">Encrypted Mode</span>
        </div>
      </div>
    </header>
  );
};

export default SigningNavbar;
