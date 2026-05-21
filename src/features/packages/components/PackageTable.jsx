import React, { useState } from 'react';
import { MoreVertical, Trash2, Eye, Download, Layers, PenTool, FileText, Pencil, RotateCcw } from 'lucide-react';
import { usePackageTable } from '../hooks/usePackageTable';
import { getPackageStatusBadge, getPackageLabelClass } from '../constants/packageStatus';

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
        <div className="grid grid-cols-[48px_1fr_120px_120px_160px_140px_180px] items-center px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
          {['NO.', 'NAMA PAKET', 'KATEGORI', 'STATUS', 'DOKUMEN', 'DIBUAT', 'AKSI'].map((h) => (
            <div key={h} className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{h}</div>
          ))}
        </div>

        {/* Rows */}
        {packages.map((pkg, index) => {
          const badge = getPackageStatusBadge(pkg.status);
          const labelCls = getPackageLabelClass(pkg.label);
          const signedCount = pkg.signedCount || 0;
          const docCount = pkg.documentCount || 0;
          const statusKey = pkg.status?.toLowerCase();
          const canSign = statusKey === 'draft';

          return (
            <div
              key={pkg.id}
              className="grid grid-cols-[48px_1fr_120px_120px_160px_140px_180px] items-center px-5 py-3.5 border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group"
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

              {/* Aksi — Inline icons (primary) + kebab (secondary) */}
              <div className="flex items-center justify-end gap-1">
                {isTrashMode ? (
                  <button
                    onClick={() => onAction('restore', pkg)}
                    title="Pulihkan Paket"
                    className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 bg-transparent border-none cursor-pointer text-emerald-500 hover:text-emerald-600 transition-all"
                    aria-label="Pulihkan paket"
                  >
                    <RotateCcw size={16} />
                  </button>
                ) : (
                  <>
                    {/* Sign Paket — primary action, hanya bila draft */}
                    {canSign && (
                      <button
                        onClick={() => onAction('sign', pkg)}
                        title="Sign Paket"
                        className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 bg-transparent border-none cursor-pointer text-zinc-400 hover:text-emerald-600 transition-all"
                        aria-label="Tanda tangani paket"
                      >
                        <PenTool size={16} />
                      </button>
                    )}

                    {/* Preview — selalu tampil */}
                    <button
                      onClick={() => onAction('preview', pkg)}
                      title="Preview Paket"
                      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 bg-transparent border-none cursor-pointer text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all"
                      aria-label="Preview paket"
                    >
                      <Eye size={16} />
                    </button>

                    {/* Edit Paket — selalu tampil */}
                    <button
                      onClick={() => onAction('edit', pkg)}
                      title="Edit Paket"
                      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 bg-transparent border-none cursor-pointer text-zinc-400 hover:text-blue-500 transition-all"
                      aria-label="Edit paket"
                    >
                      <Pencil size={16} />
                    </button>

                    {/* Kebab — secondary actions (Info, Download bila completed, Delete) */}
                    <button
                      data-package-menu
                      onClick={(e) => handleOpenMenu(e, pkg.id)}
                      title="Aksi lainnya"
                      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 bg-transparent border-none cursor-pointer text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all"
                      aria-label={`Aksi paket ${pkg.title || 'tanpa judul'}`}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MOBILE LIST ───────────────────────────────────────────── */}
      <div className="lg:hidden flex flex-col gap-3">
        {packages.map((pkg) => {
          const badge = getPackageStatusBadge(pkg.status);
          const labelCls = getPackageLabelClass(pkg.label);
          const statusKey = pkg.status?.toLowerCase();
          const canSign = statusKey === 'draft';
          return (
            <div
              key={pkg.id}
              className="bg-white dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-700/60 overflow-hidden"
            >
              {/* TOP SECTION — info paket + badges */}
              <div
                className="p-4 cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors"
                onClick={() => onAction('info', pkg)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                      <Layers size={18} className="text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-zinc-900 dark:text-white truncate">{pkg.title || 'Tanpa Judul'}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{helpers.formatDate(pkg.createdAt)} · {pkg.label || 'General'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${labelCls}`}>{pkg.label || 'General'}</span>
                  </div>
                </div>
              </div>

              {/* DIVIDER */}
              <div className="h-px bg-zinc-100 dark:bg-zinc-700/60" />

              {/* ACTION ROW */}
              <div className="flex items-center justify-between px-2 py-2">
                {isTrashMode ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onAction('restore', pkg); }}
                    className="flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 bg-transparent border-none cursor-pointer rounded-lg"
                  >
                    <RotateCcw size={15} /> Pulihkan
                  </button>
                ) : (
                  <>
                    <div className="flex items-center gap-1">
                      {/* Lihat (Preview) */}
                      <button
                        onClick={(e) => { e.stopPropagation(); onAction('preview', pkg); }}
                        className="flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 bg-transparent border-none cursor-pointer rounded-lg"
                      >
                        <Eye size={15} /> Lihat
                      </button>

                      {/* Tanda Tangan — bila draft */}
                      {canSign && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onAction('sign', pkg); }}
                          className="flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 bg-transparent border-none cursor-pointer rounded-lg"
                        >
                          <PenTool size={15} /> Tanda Tangan
                        </button>
                      )}
                    </div>

                    {/* Kebab — secondary */}
                    <button
                      data-package-menu
                      onClick={(e) => { e.stopPropagation(); handleOpenMenu(e, pkg.id); }}
                      title="Aksi lainnya"
                      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 bg-transparent border-none cursor-pointer text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all"
                      aria-label="Buka menu aksi lainnya"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FIXED DROPDOWN PORTAL — Secondary actions saja ────────── */}
      {/*    Aksi primer (Sign, Preview, Edit) sudah jadi icon button       */}
      {/*    inline. Menu kebab hanya untuk aksi sekunder.                  */}
      {activePkg && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
          <div
            data-package-menu
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
                {/* Edit Paket di mobile (di desktop sudah jadi icon inline) */}
                <button onClick={() => handleActionClick('edit', activePkg)} className="lg:hidden w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 bg-transparent border-none cursor-pointer text-left">
                  <Pencil size={14} className="text-blue-500" /> Edit Paket
                </button>
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
