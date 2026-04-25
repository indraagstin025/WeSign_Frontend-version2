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
    <div className="px-5 py-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-900/50">
      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium order-2 sm:order-1">
        Halaman <span className="text-zinc-900 dark:text-white font-bold">{currentPage}</span> dari <span className="text-zinc-900 dark:text-white font-bold">{totalPages}</span>
      </p>

      <div className="flex items-center gap-2 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 
                     text-zinc-600 dark:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((pageNum, i) => (
            pageNum === '...' ? (
              <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-zinc-400">...</span>
            ) : (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`
                  w-9 h-9 rounded-lg text-sm font-bold transition-all border-none cursor-pointer
                  ${currentPage === pageNum 
                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
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
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 
                     text-zinc-600 dark:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
