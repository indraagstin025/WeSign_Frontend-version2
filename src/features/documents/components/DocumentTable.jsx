import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  MoreVertical, 
  Calendar, 
  Tag, 
  Info, 
  Eye, 
  Download, 
  Trash2,
  ChevronRight,
  PenTool,
  FileEdit
} from 'lucide-react';

/**
 * @component DocumentTable
 * @description Tabel responsif yang berubah menjadi Card di layar Mobile dengan Dropdown Aksi.
 */
const DocumentTable = ({ documents, onAction }) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!documents || documents.length === 0) return null;

  const getStatusStyles = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
      case 'pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
      case 'draft':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      case 'archived':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleAction = (type, doc) => {
    onAction(type, doc);
    setOpenMenuId(null);
  };

  return (
    <div className="w-full relative">
      {/* 1. MOBILE VIEW (Card Layout) */}
      <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800/50">
        {documents.map((doc) => (
          <div key={doc.id} className="p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3 truncate">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
                  <FileText size={20} />
                </div>
                <div className="truncate">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate mb-0.5">{doc.title}</h4>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyles(doc.status)}`}>
                    {doc.status}
                  </span>
                </div>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setOpenMenuId(openMenuId === doc.id ? null : doc.id)}
                  className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <MoreVertical size={18} />
                </button>
                {openMenuId === doc.id && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <ActionButton icon={<Info size={16} />} label="Info Detail" onClick={() => handleAction('info', doc)} />
                    {doc.status.toLowerCase() !== 'completed' && (
                      <ActionButton icon={<PenTool size={16} className="text-primary" />} label="Tanda Tangani" onClick={() => handleAction('sign', doc)} />
                    )}
                    <ActionButton icon={<Eye size={16} />} label="Pratinjau" onClick={() => handleAction('view', doc)} />
                    <ActionButton icon={<FileEdit size={16} />} label="Ubah Judul" onClick={() => handleAction('edit', doc)} />
                    <ActionButton icon={<Download size={16} />} label="Unduh PDF" onClick={() => handleAction('download', doc)} />
                    <ActionButton icon={<Trash2 size={16} />} label="Hapus" onClick={() => handleAction('delete', doc)} variant="danger" />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-2">
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <Calendar size={12} className="text-slate-400" />
                {formatDate(doc.createdAt)}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                <Tag size={12} className="text-slate-400 shrink-0" />
                {doc.type || 'General'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 2. DESKTOP VIEW (Table Layout) */}
      <div className="hidden lg:block overflow-x-visible">
        <table className="w-full border-collapse text-left">
          <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-5/12">Nama Dokumen</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipe</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tanggal</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 overflow-visible">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
                      <FileText size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[320px]">{doc.title}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tight ${getStatusStyles(doc.status)}`}>
                    {doc.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                     <Tag size={14} className="text-slate-400" />
                     {doc.type || 'General'}
                   </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                     <Calendar size={14} className="text-slate-400" />
                     {formatDate(doc.createdAt)}
                   </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right relative">
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === doc.id ? null : doc.id)}
                    className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <MoreVertical size={18} />
                  </button>
                  {openMenuId === doc.id && (
                    <div className="absolute right-6 top-[80%] mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <ActionButton icon={<Info size={16} />} label="Info Detail" onClick={() => handleAction('info', doc)} />
                      {doc.status.toLowerCase() !== 'completed' && (
                        <ActionButton icon={<PenTool size={16} className="text-primary" />} label="Tanda Tangani" onClick={() => handleAction('sign', doc)} />
                      )}
                      <ActionButton icon={<Eye size={16} />} label="Pratinjau" onClick={() => handleAction('view', doc)} />
                      <ActionButton icon={<FileEdit size={16} />} label="Ubah Judul" onClick={() => handleAction('edit', doc)} />
                      <ActionButton icon={<Download size={16} />} label="Unduh PDF" onClick={() => handleAction('download', doc)} />
                      <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-2" />
                      <ActionButton icon={<Trash2 size={16} />} label="Hapus" onClick={() => handleAction('delete', doc)} variant="danger" />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ActionButton = ({ icon, label, onClick, variant = 'default' }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors border-none bg-transparent cursor-pointer 
      ${variant === 'danger' 
        ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20' 
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
      }`}
  >
    <span className="shrink-0">{icon}</span>
    <span className="flex-1 text-left">{label}</span>
    <ChevronRight size={14} className="opacity-0 group-hover:opacity-40" />
  </button>
);


export default DocumentTable;
