import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

/**
 * @component ActiveSignatureMobileCard
 * @description Card preview tanda tangan aktif khusus mobile.
 *   Tampil di antara PDF viewer dan bottom action bar.
 *
 * Layout (sesuai mockup):
 *   [📝 thumb]  Tanda Tangan Aktif                         [v]
 *               N penempatan
 *               • N/N selesai
 *
 *   Saat di-expand, tampilkan list penempatan dengan tombol delete per item.
 *
 * @param {object} props
 * @param {string} [props.currentSignature] - Data URL preview signature aktif.
 *   Bila null/undefined, card tidak di-render (user belum pilih signature).
 * @param {Array} props.signatures - Array signature yang user sudah tempelkan ke PDF.
 *   Termasuk yang status='draft' maupun 'final'.
 * @param {(id: string) => void} props.onRemoveSignature - Handler hapus signature.
 */
const ActiveSignatureMobileCard = ({
  currentSignature,
  signatures = [],
  onRemoveSignature,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Tidak tampil bila tidak ada signature aktif & belum ada penempatan.
  if (!currentSignature && signatures.length === 0) return null;

  const placedCount = signatures.length;
  const finalCount = signatures.filter((s) => s.status === 'final').length;

  return (
    <div
      className="sm:hidden fixed left-4 right-4 bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-700/60 rounded-2xl shadow-sm overflow-hidden z-[129] animate-in slide-in-from-bottom duration-500"
      style={{
        // Posisi di atas SigningMobileBar (yang ada di bottom: 80px + safe-area).
        // SigningMobileBar tinggi ~64px, gap 8px → ActiveSignatureMobileCard
        // bottom: 80 + 64 + 8 = 152px + safe-area.
        bottom: 'calc(152px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Header — clickable untuk expand/collapse */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full p-3 flex items-center gap-3 bg-transparent border-none cursor-pointer text-left"
      >
        {/* Thumbnail signature */}
        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center shrink-0 overflow-hidden p-1">
          {currentSignature ? (
            <img
              src={currentSignature}
              alt="Active signature"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-zinc-100 dark:bg-zinc-700/40 rounded-lg" />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-zinc-900 dark:text-white">Tanda Tangan Aktif</p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            {placedCount} penempatan
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {finalCount} / {placedCount} selesai
          </p>
        </div>

        {/* Chevron */}
        <div className="text-zinc-400 shrink-0">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Expanded content — list penempatan dengan tombol hapus */}
      {isExpanded && signatures.length > 0 && (
        <div className="border-t border-zinc-100 dark:border-zinc-700/60 px-3 py-2 space-y-1.5 max-h-48 overflow-y-auto">
          {signatures.map((sig, idx) => (
            <div
              key={sig.id}
              className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60"
            >
              <span className="w-6 h-6 rounded-md bg-white dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-700">
                {idx + 1}
              </span>
              <span className="flex-1 text-[12px] font-medium text-zinc-700 dark:text-zinc-200">
                Halaman {sig.pageNumber}
              </span>
              {sig.status === 'final' ? (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10">
                  Final
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onRemoveSignature?.(sig.id)}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 border-none bg-transparent cursor-pointer"
                  title="Hapus"
                  aria-label={`Hapus tanda tangan ${idx + 1}`}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveSignatureMobileCard;
