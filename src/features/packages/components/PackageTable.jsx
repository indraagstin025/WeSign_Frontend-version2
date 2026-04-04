import React from 'react';
import { 
  MoreVertical, 
  Trash2, 
  Eye, 
  Download,
  Layers,
  PenTool
} from 'lucide-react';
import { usePackageTable } from '../hooks/usePackageTable';

const PackageTable = ({ packages, onAction }) => {
  const {
    openMenuId,
    setOpenMenuId,
    menuRef,
    helpers,
    handleActionClick
  } = usePackageTable(onAction);

  if (!packages || packages.length === 0) return null;

  return (
    <div className="w-full relative">
      {/* 1. MOBILE VIEW (List Style yang Responsif) */}
      <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
        {packages.map((pkg) => (
          <div key={pkg.id} className="py-5 px-3 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all group border-b border-slate-100 dark:border-slate-800/50 last:border-none">
            <div className="flex items-start justify-between gap-4 overflow-hidden" onClick={() => onAction('info', pkg)}>
              <div className="flex items-center gap-4 shrink-0 flex-1 min-w-0">
                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-900/20 shadow-sm transition-transform group-hover:scale-105">
                  <Layers size={22} className="text-primary" />
                </div>
                <div className="truncate flex-1">
                  <h4 className="text-[15px] font-bold text-slate-900 dark:text-white truncate mb-1 leading-tight">{pkg.title || 'Tanpa Judul'}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-medium">{helpers.formatDate(pkg.createdAt)}</span>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="text-[11px] text-slate-400 font-black uppercase tracking-tight">{pkg.label || 'Umum'}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${helpers.getStatusStyles(pkg.status)}`}>
                  {pkg.status}
                </span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {pkg.documentCount || 0} File
                </span>
              </div>
            </div>

            {/* Quick Actions Mobile */}
            <div className="mt-5 flex items-center gap-2 pt-4 border-t border-slate-50 dark:border-slate-800/40">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction('preview', pkg);
                  }}
                  className="flex-1 h-11 flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl text-[11px] font-black uppercase tracking-widest border-none cursor-pointer transition-all active:scale-95"
                >
                  <Eye size={18} className="text-primary" />
                  <span>Preview</span>
                </button>

                {pkg.status === 'draft' && (
                   <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction('sign', pkg);
                    }}
                    className="flex-1 h-11 flex items-center justify-center gap-2 bg-emerald-500/10 dark:bg-emerald-500/20 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-[11px] font-black uppercase tracking-widest border-none cursor-pointer transition-all active:scale-95 shadow-sm"
                  >
                    <PenTool size={18} />
                    <span>Sign Paket</span>
                  </button>
                )}

                {pkg.status === 'completed' && (
                   <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction('download', pkg);
                    }}
                    className="flex-1 h-11 flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl text-[11px] font-black uppercase tracking-widest border-none cursor-pointer transition-all active:scale-95"
                  >
                    <Download size={18} />
                    <span>Download</span>
                  </button>
                )}
            </div>
          </div>
        ))}
      </div>

      {/* 2. DESKTOP VIEW (Flex Row Style - lg:flex) */}
      <div className="hidden lg:flex flex-col" ref={menuRef}>
        {packages.map((pkg, index) => {
          const isNearBottom = index >= packages.length - 2 && packages.length > 2;

          return (
            <div 
              key={pkg.id} 
              className="flex items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-200/30 dark:hover:bg-slate-800/40 transition-all duration-300 group"
            >
              {/* 0. Nomor (5%) */}
              <div className="w-[5%] text-[11px] font-bold text-slate-400 dark:text-slate-600 pl-2">
                {String(index + 1).padStart(2, '0')}
              </div>

              {/* 1. Nama Paket (36%) */}
              <div className="w-[36%] flex items-center gap-4 min-w-0 pr-4">
                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center shrink-0 border border-primary/20 dark:border-primary/30 transition-transform group-hover:scale-105">
                  <Layers size={18} className="text-primary" />
                </div>
                <div className="flex flex-col min-w-0 pointer-events-auto cursor-pointer" onClick={() => onAction('info', pkg)}>
                  <span className="text-sm font-medium text-slate-900 dark:text-white truncate transition-colors group-hover:text-primary">
                    {pkg.title || 'Tanpa Judul'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{helpers.formatDate(pkg.createdAt)}</span>
                </div>
              </div>

              {/* 2. Kategori (15%) */}
              <div className="w-[15%] flex justify-center">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1 rounded-md uppercase tracking-tight">
                  {pkg.label || 'Umum'}
                </span>
              </div>

              {/* 3. Status (15%) */}
              <div className="w-[15%] flex justify-center">
                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${helpers.getStatusStyles(pkg.status)}`}>
                  {pkg.status}
                </span>
              </div>

              {/* 4. Jumlah Dokumen (15%) */}
              <div className="w-[15%] flex justify-center focus:outline-none">
                <div className="w-7 h-7 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/20 flex items-center justify-center text-[11px] text-primary font-bold shadow-sm">
                  {pkg.documentCount || 0}
                </div>
              </div>

              {/* 5. Aksi (14%) */}
              <div className="w-[14%] flex justify-end items-center relative pr-6">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === pkg.id ? null : pkg.id);
                  }}
                  className="p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all opacity-100 shadow-sm"
                >
                  <MoreVertical size={20} />
                </button>

                {openMenuId === pkg.id && (
                  <div className={`absolute right-0 w-56 bg-white dark:bg-slate-800 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-slate-700 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 ${isNearBottom ? 'bottom-full mb-3' : 'top-full mt-3'}`}>
                    <button 
                      onClick={() => handleActionClick('info', pkg)}
                      className="w-full flex items-center gap-3.5 px-5 py-3 text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all border-none bg-transparent cursor-pointer group/item"
                    >
                      <Eye size={16} className="shrink-0 transition-transform group-hover/item:scale-110" />
                      <span className="flex-1 text-left uppercase tracking-wider">Info Detail</span>
                    </button>

                    <div className="h-px bg-slate-50 dark:bg-slate-700/50 my-1 mx-2" />

                    <button 
                      onClick={() => handleActionClick('preview', pkg)}
                      className="w-full flex items-center gap-3.5 px-5 py-3 text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all border-none bg-transparent cursor-pointer group/item"
                    >
                      <Eye size={16} className="text-primary shrink-0 transition-transform group-hover/item:scale-110" />
                      <span className="flex-1 text-left uppercase tracking-wider">Preview Paket</span>
                    </button>

                    <div className="h-px bg-slate-50 dark:bg-slate-700/50 my-1 mx-2" />

                    {pkg.status === 'draft' && (
                      <button 
                        onClick={() => handleActionClick('sign', pkg)}
                        className="w-full flex items-center gap-3.5 px-5 py-3 text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all border-none bg-transparent cursor-pointer group/item"
                      >
                        <PenTool size={16} className="text-emerald-500 shrink-0 transition-transform group-hover/item:scale-110" />
                        <span className="flex-1 text-left uppercase tracking-wider">Sign Paket</span>
                      </button>
                    )}

                    {pkg.status === 'completed' && (
                      <button 
                        onClick={() => handleActionClick('download', pkg)}
                        className="w-full flex items-center gap-3.5 px-5 py-3 text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all border-none bg-transparent cursor-pointer group/item"
                      >
                        <Download size={16} className="shrink-0 transition-transform group-hover/item:scale-110" />
                        <span className="flex-1 text-left uppercase tracking-wider">Unduh (.zip)</span>
                      </button>
                    )}

                    <div className="h-px bg-slate-50 dark:bg-slate-700/50 my-1 mx-2" />

                    <button 
                      onClick={() => handleActionClick('delete', pkg)}
                      className="w-full flex items-center gap-3.5 px-5 py-3 text-[13px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all border-none bg-transparent cursor-pointer group/item"
                    >
                      <Trash2 size={16} className="shrink-0 transition-transform group-hover/item:scale-110" />
                      <span className="flex-1 text-left uppercase tracking-wider">Hapus Paket</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PackageTable;
