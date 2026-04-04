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
  isReadOnly = false
}) => {
  return (
    <footer className="flex h-14 bg-white dark:bg-black border-t border-slate-200 dark:border-emerald-500/10 items-center justify-center gap-8 px-6 shrink-0 z-[120]">
      <div className="flex items-center gap-4">
        <button 
          disabled={pageNumber <= 1} 
          onClick={() => setPageNumber(p => Math.max(p - 1, 1))} 
          className={`p-2 rounded-xl border border-slate-200 dark:border-slate-800 transition-all flex items-center justify-center shrink-0
            ${pageNumber <= 1 
              ? 'bg-slate-50 text-slate-300 dark:text-white/20 cursor-not-allowed opacity-50' 
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-800 cursor-pointer'
            }
          `}
          title="Halaman Sebelumnya"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex flex-col items-center">
          <span className="text-xs font-extrabold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full min-w-[80px] text-center border border-slate-200 dark:border-slate-700">
            {pageNumber} / {numPages || '?'}
          </span>
        </div>

        <button 
          disabled={pageNumber >= numPages} 
          onClick={() => setPageNumber(p => Math.min(p + 1, numPages))} 
          className={`p-2 rounded-xl border border-slate-200 dark:border-slate-800 transition-all flex items-center justify-center shrink-0
            ${pageNumber >= numPages 
              ? 'bg-slate-50 text-slate-300 dark:text-white/20 cursor-not-allowed opacity-50' 
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-800 cursor-pointer'
            }
          `}
          title="Halaman Berikutnya"
        >
          <ArrowRight size={20} />
        </button>
      </div>

      {/* Hint Shortcut (Only for signing mode) */}
      {!isReadOnly && (
        <p className="hidden lg:block text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute right-8">
          Klik Area PDF untuk Menempel Tanda Tangan
        </p>
      )}
    </footer>
  );
};

export default SigningFooter;
