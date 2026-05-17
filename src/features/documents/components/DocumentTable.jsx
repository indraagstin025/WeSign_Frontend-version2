import React, { useState } from 'react';
import {
  FileText, MoreVertical, Info, Eye, Download,
  Trash2, PenTool, FileEdit, History, RotateCcw,
} from 'lucide-react';
import { useDocumentTable } from '../hooks/useDocumentTable';

const STATUS_BADGE = {
  draft:     { label: 'Draft',   cls: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' },
  pending:   { label: 'Proses',  cls: 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' },
  completed: { label: 'Selesai', cls: 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' },
  archived:  { label: 'Arsip',   cls: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' },
};

const DocumentTable = ({ documents, onAction, modals = {}, isTrashMode = false }) => {
  const { state, helpers } = useDocumentTable(onAction);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  const handleOpenMenu = (e, docId) => {
    e.stopPropagation();
    if (state.openMenuId === docId) {
      state.setOpenMenuId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownHeight = 260;
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < dropdownHeight;
    setMenuPos({
      top: showAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
    state.setOpenMenuId(docId);
  };

  const activeDoc = state.openMenuId ? documents.find(d => d.id === state.openMenuId) : null;

  if (!documents || documents.length === 0) return null;

  return (
    <div className="w-full">

      {/* ── DESKTOP TABLE ─────────────────────────────────────────── */}
      <div className="hidden lg:block">
        {/* Header */}
        <div className="grid grid-cols-[48px_1fr_120px_120px_160px_60px] items-center px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
          {['NO.', 'NAMA DOKUMEN', 'STATUS', 'TIPE', 'TANGGAL', 'AKSI'].map((h) => (
            <div key={h} className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{h}</div>
          ))}
        </div>

        {/* Rows */}
        {documents.map((doc, index) => {
          const badge = STATUS_BADGE[doc.status?.toLowerCase()] || STATUS_BADGE.draft;
          return (
            <div
              key={doc.id}
              className="grid grid-cols-[48px_1fr_120px_120px_160px_60px] items-center px-5 py-3.5 border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group"
            >
              {/* No */}
              <div className="text-[11px] font-semibold text-zinc-400">
                {String(index + 1).padStart(2, '0')}
              </div>

              {/* Nama */}
              <div
                className="flex items-center gap-3 min-w-0 pr-4 cursor-pointer"
                onClick={() => helpers.handleAction('view', doc)}
              >
                <div className="w-9 h-9 bg-rose-50 dark:bg-rose-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-rose-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-zinc-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">
                    {doc.title}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>

              {/* Tipe */}
              <div>
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  {doc.type || 'General'}
                </span>
              </div>

              {/* Tanggal */}
              <div>
                <p className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
                  {helpers.formatDate(doc.createdAt)}
                </p>
              </div>

              {/* Aksi */}
              <div className="flex justify-end">
                <button
                  onClick={(e) => handleOpenMenu(e, doc.id)}
                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 bg-transparent border-none cursor-pointer text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all"
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MOBILE LIST ───────────────────────────────────────────── */}
      <div className="lg:hidden divide-y divide-zinc-50 dark:divide-zinc-800">
        {documents.map((doc) => {
          const badge = STATUS_BADGE[doc.status?.toLowerCase()] || STATUS_BADGE.draft;
          return (
            <div
              key={doc.id}
              className="p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors cursor-pointer"
              onClick={() => helpers.handleAction('view', doc)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-rose-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-zinc-900 dark:text-white truncate">{doc.title}</p>
                    <p className="text-[10px] text-zinc-400">{helpers.formatDate(doc.createdAt)} · {doc.type || 'General'}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0 ${badge.cls}`}>{badge.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FIXED DROPDOWN PORTAL ─────────────────────────────────── */}
      {activeDoc && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => state.setOpenMenuId(null)} />
          <div
            className="fixed z-50 w-52 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-zinc-100 dark:border-zinc-700 py-1 animate-in fade-in zoom-in-95 duration-150"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            {isTrashMode ? (
              <>
                <button onClick={() => helpers.handleAction('restore', activeDoc)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 bg-transparent border-none cursor-pointer text-left">
                  <RotateCcw size={14} /> Restore
                </button>
              </>
            ) : (
              <>
                <button onClick={() => helpers.handleAction('info', activeDoc)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 bg-transparent border-none cursor-pointer text-left">
                  <Info size={14} /> Info Detail
                </button>
                {activeDoc.status?.toLowerCase() !== 'completed' && (
                  <button onClick={() => helpers.handleAction('sign', activeDoc)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 bg-transparent border-none cursor-pointer text-left">
                    <PenTool size={14} className="text-emerald-500" /> Tanda Tangani
                  </button>
                )}
                <button onClick={() => helpers.handleAction('view', activeDoc)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 bg-transparent border-none cursor-pointer text-left">
                  <Eye size={14} className="text-emerald-500" /> Pratinjau
                </button>
                {modals.version && (
                  <button onClick={() => helpers.handleAction('history', activeDoc)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 bg-transparent border-none cursor-pointer text-left">
                    <History size={14} /> Riwayat Versi
                  </button>
                )}
                <button onClick={() => helpers.handleAction('edit', activeDoc)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 bg-transparent border-none cursor-pointer text-left">
                  <FileEdit size={14} /> Ubah Judul
                </button>
                <button onClick={() => helpers.handleAction('download', activeDoc)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 bg-transparent border-none cursor-pointer text-left">
                  <Download size={14} /> Unduh PDF
                </button>
                <div className="h-px bg-zinc-100 dark:bg-zinc-700 my-1" />
                <button onClick={() => helpers.handleAction('delete', activeDoc)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 bg-transparent border-none cursor-pointer text-left">
                  <Trash2 size={14} /> Hapus
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DocumentTable;
