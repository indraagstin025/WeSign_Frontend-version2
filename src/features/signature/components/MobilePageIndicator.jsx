import React from 'react';

/**
 * @component MobilePageIndicator
 * @description Pill indikator halaman PDF khusus mobile.
 *   Tampil floating di antara PDF viewer dan ActiveSignatureMobileCard.
 *
 *   Sesuai mockup user: hanya menampilkan "Halaman X / Y" tanpa kontrol zoom.
 *   Catatan user: "untuk tools zoom jangan digunakan".
 *
 * @param {object} props
 * @param {number} props.pageNumber
 * @param {number} props.numPages
 */
const MobilePageIndicator = ({ pageNumber, numPages }) => {
  if (!numPages) return null;

  return (
    <div className="sm:hidden flex justify-center px-4 -mt-3 mb-3 pointer-events-none">
      <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-full shadow-sm px-4 py-1.5 pointer-events-auto">
        <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-200 select-none">
          Halaman {pageNumber} / {numPages}
        </span>
      </div>
    </div>
  );
};

export default MobilePageIndicator;
