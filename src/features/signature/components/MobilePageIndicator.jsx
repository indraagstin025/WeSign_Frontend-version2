import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * @component MobilePageIndicator
 * @description Pill indikator + navigasi halaman PDF khusus mobile.
 *   Tampil floating di antara PDF viewer dan ActiveSignatureMobileCard.
 *
 *   Layout: [<] Halaman X / Y [>]
 *
 *   Sesuai mockup user: pill compact tanpa kontrol zoom (catatan user:
 *   "untuk tools zoom jangan digunakan"). Tombol prev/next inline supaya
 *   tidak menambah layer baru di stack mobile (sheet/activeCard/actionBar
 *   sudah cukup padat).
 *
 * @param {object} props
 * @param {number} props.pageNumber
 * @param {number} props.numPages
 * @param {(updater: number | ((prev: number) => number)) => void} props.setPageNumber
 *   Setter untuk pindah halaman. Optional — kalau tidak diberikan, pill
 *   tampil tanpa chevron (read-only).
 */
const MobilePageIndicator = ({ pageNumber, numPages, setPageNumber }) => {
  if (!numPages) return null;

  const canPrev = pageNumber > 1;
  const canNext = pageNumber < numPages;
  const showNav = typeof setPageNumber === 'function' && numPages > 1;

  return (
    <div className="sm:hidden flex justify-center px-4 -mt-3 mb-3 pointer-events-none">
      <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-full shadow-sm flex items-center gap-1 pl-1 pr-1 py-1 pointer-events-auto">
        {showNav && (
          <button
            type="button"
            onClick={() => setPageNumber((p) => Math.max(p - 1, 1))}
            disabled={!canPrev}
            className={`w-7 h-7 flex items-center justify-center rounded-full border-none bg-transparent cursor-pointer transition-colors
              ${canPrev
                ? 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 active:scale-95'
                : 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
              }`}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-200 select-none px-2 min-w-[80px] text-center">
          Halaman {pageNumber} / {numPages}
        </span>

        {showNav && (
          <button
            type="button"
            onClick={() => setPageNumber((p) => Math.min(p + 1, numPages))}
            disabled={!canNext}
            className={`w-7 h-7 flex items-center justify-center rounded-full border-none bg-transparent cursor-pointer transition-colors
              ${canNext
                ? 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 active:scale-95'
                : 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
              }`}
            aria-label="Halaman berikutnya"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MobilePageIndicator;
