import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePagination } from '../hooks/usePagination';

/**
 * @component Pagination
 * @description Komponen navigasi halaman untuk data tabel.
 */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const { pageNumbers } = usePagination(currentPage, totalPages);

  if (totalPages <= 1) return null;

  return (
    <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium order-2 sm:order-1">
        Halaman <span className="text-slate-900 dark:text-white font-bold">{currentPage}</span> dari <span className="text-slate-900 dark:text-white font-bold">{totalPages}</span>
      </p>

      <div className="flex items-center gap-2 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 
                     text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((pageNum, i) => (
            pageNum === '...' ? (
              <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-slate-400">...</span>
            ) : (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`
                  w-9 h-9 rounded-lg text-sm font-bold transition-all border-none cursor-pointer
                  ${currentPage === pageNum 
                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }
                `}
              >
                {pageNum}
              </button>
            )
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 
                     text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
