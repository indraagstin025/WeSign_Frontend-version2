import React from 'react';
import { ChevronLeft, ChevronRight, Hand, MousePointer2, ZoomIn, ZoomOut } from 'lucide-react';

/**
 * @component PdfToolbar
 * @description Toolbar bar (navbar kedua) di bawah navbar utama — berisi tools PDF.
 * Pagination + Hand/Cursor toggle. Bukan floating, tapi fixed bar.
 */
const PdfToolbar = ({
  pageNumber,
  numPages,
  setPageNumber,
  interactionMode = 'cursor', // 'cursor' | 'hand'
  onToggleMode,
}) => {
  return (
    <div className="h-11 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between px-4 shrink-0 z-10">
      
      {/* LEFT: Interaction Mode Toggle */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onToggleMode('hand')}
          className={`p-1.5 rounded-lg border-none cursor-pointer transition-all flex items-center justify-center gap-1.5
            ${interactionMode === 'hand' 
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
              : 'bg-transparent text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
          aria-label="Mode Geser (Hand)"
          title="Mode Geser — Scroll & Pan"
        >
          <Hand size={15} />
          <span className="text-[10px] font-bold hidden md:inline">Geser</span>
        </button>
        <button
          onClick={() => onToggleMode('cursor')}
          className={`p-1.5 rounded-lg border-none cursor-pointer transition-all flex items-center justify-center gap-1.5
            ${interactionMode === 'cursor' 
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
              : 'bg-transparent text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
          aria-label="Mode Tanda Tangan (Cursor)"
          title="Mode Tanda Tangan — Klik untuk menempel"
        >
          <MousePointer2 size={15} />
          <span className="text-[10px] font-bold hidden md:inline">Tempel</span>
        </button>
      </div>

      {/* CENTER: Pagination */}
      <div className="flex items-center gap-2">
        <button 
          disabled={pageNumber <= 1} 
          onClick={() => setPageNumber(p => Math.max(p - 1, 1))} 
          className={`p-1.5 rounded-lg border-none transition-all flex items-center justify-center
            ${pageNumber <= 1 
              ? 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed' 
              : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer'
            }`}
          aria-label="Halaman Sebelumnya"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200 min-w-[50px] text-center select-none tabular-nums">
          {pageNumber} / {numPages || '—'}
        </span>

        <button 
          disabled={pageNumber >= numPages} 
          onClick={() => setPageNumber(p => Math.min(p + 1, numPages))} 
          className={`p-1.5 rounded-lg border-none transition-all flex items-center justify-center
            ${pageNumber >= numPages 
              ? 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed' 
              : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer'
            }`}
          aria-label="Halaman Berikutnya"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* RIGHT: Placeholder for future tools (zoom, etc.) */}
      <div className="flex items-center gap-1 opacity-0 pointer-events-none">
        <ZoomOut size={15} />
        <ZoomIn size={15} />
      </div>
    </div>
  );
};

export default PdfToolbar;
