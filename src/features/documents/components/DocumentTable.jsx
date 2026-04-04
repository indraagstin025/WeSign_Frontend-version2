import React from 'react';
import { 
  FileText, 
  MoreVertical, 
  Info, 
  Eye, 
  Download, 
  Trash2, 
  ChevronRight, 
  PenTool, 
  FileEdit,
  History
} from 'lucide-react';
import { useDocumentTable } from '../hooks/useDocumentTable';

/**
 * @component ActionButton
 * @description Tombol aksi dalam menu dropdown.
 */
const ActionButton = ({ icon, label, onClick, variant = 'default' }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3.5 px-5 py-3 text-[13px] font-bold transition-all border-none bg-transparent cursor-pointer group/item
      ${variant === 'danger' 
        ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20' 
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
      }`}
  >
    <span className="shrink-0 transition-transform group-hover/item:scale-110">{icon}</span>
    <span className="flex-1 text-left uppercase tracking-wider">{label}</span>
    <ChevronRight size={14} className="opacity-0 group-hover/item:opacity-40 transition-all -translate-x-2 group-hover/item:translate-x-0" />
  </button>
);

/**
 * @component DocumentTable
 * @description Komponen tabel dokumen dengan gaya minimalis (tanpa kartu) dan Smart Dropdown.
 */
const DocumentTable = ({ documents, onAction, modals = {} }) => {
  const { state, helpers } = useDocumentTable(onAction);

  return (
    <div className="w-full relative">
      
      {/* A. MOBILE VIEW (Legacy List Style) */}
      <div className="lg:hidden space-y-0 divide-y divide-slate-100 dark:divide-slate-800">
        {documents.map((doc, index) => (
          <div 
            key={doc.id} 
            className="py-4 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer" 
            onClick={() => helpers.handleAction('view', doc)}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 shrink-0 flex-1 min-w-0">
                <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900/30">
                  <FileText size={20} className="text-red-500" />
                </div>
                <div className="truncate">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate mb-0.5">{doc.title}</h4>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] text-slate-400 font-medium">{helpers.formatDate(doc.createdAt)}</span>
                     <span className="text-slate-300 dark:text-slate-600">·</span>
                     <span className="text-[10px] text-slate-400 truncate">{doc.type || 'General'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shrink-0 ${helpers.getStatusStyles(doc.status)}`}>
                  {helpers.getStatusLabel(doc.status)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* B. DESKTOP VIEW (Flex-based Table) */}
      <div className="hidden lg:block overflow-visible relative">
        <div className="flex flex-col" ref={state.menuRef}>
          {documents.map((doc, index) => {
            const isNearBottom = index >= documents.length - 2 && documents.length > 2;

            return (
              <div 
                key={doc.id} 
                className="flex items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-200/30 dark:hover:bg-slate-800/40 transition-all duration-300 group"
              >
                {/* 0. Nomor (5%) */}
                <div className="w-[5%] text-[11px] font-bold text-slate-400 dark:text-slate-600 pl-2">
                  {String(index + 1).padStart(2, '0')}
                </div>

                {/* 1. Nama Dokumen (36%) */}
                <div className="w-[36%] flex items-center gap-4 min-w-0 pr-4">
                  <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900/30 transition-transform group-hover:scale-105">
                    <FileText size={18} className="text-red-500" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-slate-900 dark:text-white truncate transition-colors group-hover:text-primary">
                      {doc.title}
                    </span>
                  </div>
                </div>

                {/* 2. Status (15%) */}
                <div className="w-[15%] flex justify-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shrink-0 ${helpers.getStatusStyles(doc.status)}`}>
                    {helpers.getStatusLabel(doc.status)}
                  </span>
                </div>

                {/* 3. Tipe (15%) */}
                <div className="w-[15%] flex justify-center">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-tight">
                    {doc.type || 'General'}
                  </div>
                </div>

                {/* 4. Tanggal (18%) */}
                <div className="w-[18%] flex justify-center">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-tight">
                    {helpers.formatDate(doc.createdAt)}
                  </div>
                </div>

                {/* 5. Aksi (11%) */}
                <div className="w-[11%] flex justify-end items-center relative pr-6">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      state.setOpenMenuId(state.openMenuId === doc.id ? null : doc.id);
                    }}
                    className="p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all opacity-100 shadow-sm"
                  >
                    <MoreVertical size={20} />
                  </button>
                  {state.openMenuId === doc.id && (
                    <div className={`absolute right-0 w-56 bg-white dark:bg-slate-800 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-slate-700 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 ${isNearBottom ? 'bottom-full mb-3' : 'top-full mt-3'}`}>
                      <ActionButton icon={<Info size={16} />} label="Info Detail" onClick={() => helpers.handleAction('info', doc)} />
                      {doc.status.toLowerCase() !== 'completed' && (
                        <ActionButton icon={<PenTool size={16} className="text-primary" />} label="Tanda Tangani" onClick={() => helpers.handleAction('sign', doc)} />
                      )}
                      <ActionButton icon={<Eye size={16} />} label="Pratinjau" onClick={() => helpers.handleAction('view', doc)} />
                      {modals.version && <ActionButton icon={<History size={16} />} label="Riwayat Versi" onClick={() => helpers.handleAction('history', doc)} />}
                      <ActionButton icon={<FileEdit size={16} />} label="Ubah Judul" onClick={() => helpers.handleAction('edit', doc)} />
                      <ActionButton icon={<Download size={16} />} label="Unduh PDF" onClick={() => helpers.handleAction('download', doc)} />
                      <div className="h-px bg-slate-50 dark:bg-slate-700/50 my-1 mx-2" />
                      <ActionButton icon={<Trash2 size={16} />} label="Hapus" onClick={() => helpers.handleAction('delete', doc)} variant="danger" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default DocumentTable;
