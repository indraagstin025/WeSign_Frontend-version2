import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * @component SigningFooter
 * @description Navigasi bawah untuk perpindahan halaman PDF pada Signing Page.
 */
const SigningFooter = ({ 
  pageNumber, 
  numPages, 
  setPageNumber,
  isReadOnly = false,
  rightContent = null
}) => {
  return (
    <footer
      className="flex h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md border-t border-zinc-200 dark:border-emerald-500/10 items-center justify-between px-6 shrink-0 z-[120] relative"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Spacer for left symmetry if needed */}
      <div className="hidden sm:block w-32" />

      <div className="flex items-center gap-4 mx-auto sm:mx-0">
        <button 
          disabled={pageNumber <= 1} 
          onClick={() => setPageNumber(p => Math.max(p - 1, 1))} 
          className={`p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all flex items-center justify-center shrink-0
            ${pageNumber <= 1 
              ? 'bg-zinc-50 text-zinc-300 dark:text-white/20 cursor-not-allowed opacity-50' 
              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-800 cursor-pointer'
            }
          `}
          title="Halaman Sebelumnya"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex flex-col items-center">
          <span className="text-xs font-extrabold text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full min-w-[80px] text-center border border-zinc-200 dark:border-zinc-700">
            {pageNumber} / {numPages || '?'}
          </span>
        </div>

        <button 
          disabled={pageNumber >= numPages} 
          onClick={() => setPageNumber(p => Math.min(p + 1, numPages))} 
          className={`p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all flex items-center justify-center shrink-0
            ${pageNumber >= numPages 
              ? 'bg-zinc-50 text-zinc-300 dark:text-white/20 cursor-not-allowed opacity-50' 
              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-800 cursor-pointer'
            }
          `}
          title="Halaman Berikutnya"
        >
          <ArrowRight size={20} />
        </button>
      </div>
  
      <div className="w-32 flex justify-end">
        {rightContent}
      </div>

      {/* Hint Shortcut (Only for desktop signing mode) */}
      {!isReadOnly && !rightContent && (
        <p className="hidden md:block text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] absolute right-8">
          Klik PDF untuk Menempel Tanda Tangan
        </p>
      )}
    </footer>
  );
};

export default SigningFooter;
