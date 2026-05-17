import React, { useState } from 'react';
import { MoreVertical, Trash2, Eye, Download, Layers, PenTool, FileText, Pencil, RotateCcw } from 'lucide-react';
import { usePackageTable } from '../hooks/usePackageTable';

const STATUS_BADGE = {
  draft:     { label: 'Draft',    cls: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' },
  pending:   { label: 'Menunggu', cls: 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' },
  completed: { label: 'Selesai',  cls: 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' },
  archived:  { label: 'Arsip',    cls: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' },
};

const LABEL_BADGE = {
  General: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Legal:   'bg-blue-50 text-blue-700 border border-blue-200',
  HR:      'bg-purple-50 text-purple-700 border border-purple-200',
  Finance: 'bg-orange-50 text-orange-700 border border-orange-200',
};

const PackageTable = ({ packages, onAction, isTrashMode = false }) => {
  const { openMenuId, setOpenMenuId, menuRef, helpers, handleActionClick } = usePackageTable(onAction);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  const handleOpenMenu = (e, pkgId) => {
    e.stopPropagation();
    if (openMenuId === pkgId) {
      setOpenMenuId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownHeight = 200; // estimasi tinggi dropdown
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < dropdownHeight;

    setMenuPos({
      top: showAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
    setOpenMenuId(pkgId);
  };

  const activePkg = openMenuId ? packages.find(p => p.id === openMenuId) : null;

  if (!packages || packages.length === 0) return null;

  return (
    <div className="w-full" ref={menuRef}>

      {/* ── DESKTOP TABLE ─────────────────────────────────────────── */}
      <div className="hidden lg:block">
        {/* Header */}
        <div className="grid grid-cols-[48px_1fr_120px_120px_160px_140px_60px] items-center px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
          {['NO.', 'NAMA PAKET', 'KATEGORI', 'STATUS', 'DOKUMEN', 'DIBUAT', 'AKSI'].map((h) => (
            <div key={h} className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{h}</div>
          ))}
        </div>

        {/* Rows */}
        {packages.map((pkg, index) => {
          const badge = STATUS_BADGE[pkg.status?.toLowerCase()] || STATUS_BADGE.draft;
          const labelCls = LABEL_BADGE[pkg.label] || 'bg-zinc-50 text-zinc-500 border border-zinc-200';
          const signedCount = pkg.signedCount || 0;
          const docCount = pkg.documentCount || 0;

          return (
            <div
              key={pkg.id}
              className="grid grid-cols-[48px_1fr_120px_120px_160px_140px_60px] items-center px-5 py-3.5 border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group"
            >
              {/* No */}
              <div className="text-[11px] font-semibold text-zinc-400">
                {String(index + 1).padStart(2, '0')}
              </div>

              {/* Nama Paket */}
              <div className="flex items-center gap-3 min-w-0 pr-4 cursor-pointer" onClick={() => onAction('info', pkg)}>
                <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <Layers size={16} className="text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-zinc-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">
                    {pkg.title || 'Tanpa Judul'}
                  </p>
                  <p className="text-[10px] text-zinc-400">ID: PKT-{String(index + 1).padStart(4, '0')}</p>
                </div>
              </div>

              {/* Kategori */}
              <div>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide ${labelCls}`}>
                  {pkg.label || 'General'}
                </span>
              </div>

              {/* Status */}
              <div>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>

              {/* Dokumen */}
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-emerald-500 shrink-0" />
                <div>
                  <p className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300">{docCount} dokumen</p>
                  {docCount > 0 && (
                    <p className={`text-[10px] font-semibold ${signedCount === docCount ? 'text-emerald-500' : 'text-zinc-400'}`}>
                      {signedCount}/{docCount} signed
                    </p>
                  )}
                </div>
              </div>

              {/* Dibuat */}
              <div>
                <p className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
                  {helpers.formatDate(pkg.createdAt)}
                </p>
                <p className="text-[10px] text-zinc-400">
                  {pkg.createdAt ? new Date(pkg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                </p>
              </div>

              {/* Aksi */}
              <div className="flex justify-end">
                <button
                  onClick={(e) => handleOpenMenu(e, pkg.id)}
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
        {packages.map((pkg) => {
          const badge = STATUS_BADGE[pkg.status?.toLowerCase()] || STATUS_BADGE.draft;
          const labelCls = LABEL_BADGE[pkg.label] || 'bg-zinc-50 text-zinc-500 border border-zinc-200';
          return (
            <div key={pkg.id} className="p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
              <div className="flex items-start justify-between gap-3" onClick={() => onAction('info', pkg)}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <Layers size={18} className="text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-zinc-900 dark:text-white truncate">{pkg.title || 'Tanpa Judul'}</p>
                    <p className="text-[10px] text-zinc-400">{helpers.formatDate(pkg.createdAt)}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${labelCls}`}>{pkg.label || 'General'}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 pt-3 border-t border-zinc-50 dark:border-zinc-800">
                {isTrashMode ? (
                  <button onClick={() => onAction('restore', pkg)} className="flex-1 py-2 flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg text-[11px] font-semibold border-none cursor-pointer">
                    <RotateCcw size={13} /> Pulihkan
                  </button>
                ) : (
                  <>
                    <button onClick={() => onAction('preview', pkg)} className="flex-1 py-2 flex items-center justify-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg text-[11px] font-semibold border-none cursor-pointer">
                      <Eye size={13} /> Preview
                    </button>
                    {pkg.status?.toLowerCase() === 'draft' && (
                      <button onClick={() => onAction('sign', pkg)} className="flex-1 py-2 flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg text-[11px] font-semibold border-none cursor-pointer">
                        <PenTool size={13} /> Sign
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FIXED DROPDOWN PORTAL — tidak terpotong overflow ──────── */}
      {activePkg && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
          <div
            className="fixed z-50 w-52 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-zinc-100 dark:border-zinc-700 py-1 animate-in fade-in zoom-in-95 duration-150"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            {isTrashMode ? (
              <>
                <button onClick={() => handleActionClick('restore', activePkg)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 bg-transparent border-none cursor-pointer text-left">
                  <RotateCcw size={14} /> Pulihkan Paket
                </button>
                <button onClick={() => handleActionClick('info', activePkg)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 bg-transparent border-none cursor-pointer text-left">
                  <Eye size={14} /> Info Detail
                </button>
              </>
            ) : (
              <>
                <button onClick={() => handleActionClick('info', activePkg)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 bg-transparent border-none cursor-pointer text-left">
                  <Eye size={14} /> Info Detail
                </button>
                <button onClick={() => handleActionClick('edit', activePkg)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 bg-transparent border-none cursor-pointer text-left">
                  <Pencil size={14} className="text-blue-500" /> Edit Paket
                </button>
                <button onClick={() => handleActionClick('preview', activePkg)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 bg-transparent border-none cursor-pointer text-left">
                  <Eye size={14} className="text-emerald-500" /> Preview Paket
                </button>
                {activePkg.status?.toLowerCase() === 'draft' && (
                  <button onClick={() => handleActionClick('sign', activePkg)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 bg-transparent border-none cursor-pointer text-left">
                    <PenTool size={14} className="text-emerald-500" /> Sign Paket
                  </button>
                )}
                {activePkg.status?.toLowerCase() === 'completed' && (
                  <button onClick={() => handleActionClick('download', activePkg)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 bg-transparent border-none cursor-pointer text-left">
                    <Download size={14} /> Unduh (.zip)
                  </button>
                )}
                <div className="h-px bg-zinc-100 dark:bg-zinc-700 my-1" />
                <button onClick={() => handleActionClick('delete', activePkg)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 bg-transparent border-none cursor-pointer text-left">
                  <Trash2 size={14} /> Hapus Paket
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PackageTable;
