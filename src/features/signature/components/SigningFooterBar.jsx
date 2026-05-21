import React from 'react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';

/**
 * @component SigningFooterBar
 * @description Footer bar — pagination + hint text.
 * Hanya tampil di desktop. Mobile pakai SigningMobileBar.
 */
const SigningFooterBar = ({ 
  pageNumber, 
  numPages, 
  setPageNumber,
}) => {
  return (
    <footer className="hidden sm:flex h-10 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 items-center justify-between px-5 shrink-0 z-10">
      
      {/* LEFT: Spacer */}
      <div className="w-40" />

      {/* CENTER: Pagination */}
      <div className="flex items-center gap-2">
        <button 
          disabled={pageNumber <= 1} 
          onClick={() => setPageNumber(p => Math.max(p - 1, 1))} 
          className={`p-1 rounded-md border-none transition-all flex items-center justify-center
            ${pageNumber <= 1 
              ? 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed' 
              : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer'
            }`}
          aria-label="Halaman Sebelumnya"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 min-w-[80px] text-center select-none">
          Halaman {pageNumber} / {numPages || '—'}
        </span>

        <button 
          disabled={pageNumber >= numPages} 
          onClick={() => setPageNumber(p => Math.min(p + 1, numPages))} 
          className={`p-1 rounded-md border-none transition-all flex items-center justify-center
            ${pageNumber >= numPages 
              ? 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed' 
              : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer'
            }`}
          aria-label="Halaman Berikutnya"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* RIGHT: Hint */}
      <div className="flex items-center gap-1.5 w-40 justify-end">
        <Info size={11} className="text-emerald-500 shrink-0" />
        <p className="text-[9px] text-zinc-400 dark:text-zinc-500 hidden lg:block">
          Gunakan mode <span className="font-bold text-zinc-600 dark:text-zinc-300">Geser</span> untuk scroll, lalu <span className="font-bold text-zinc-600 dark:text-zinc-300">Tempel</span> untuk menempatkan elemen.
        </p>
      </div>
    </footer>
  );
};

export default SigningFooterBar;
