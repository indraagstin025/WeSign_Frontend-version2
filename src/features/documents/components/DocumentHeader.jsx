import React from 'react';
import { Plus } from 'lucide-react';

/**
 * @component DocumentHeader
 * @description Header section for the Documents Page: Title, sub-text, and primary CTA.
 */
const DocumentHeader = ({ onUpload }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-1 mb-8 animate-in fade-in duration-700">
      <div className="text-left">
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white tracking-tight">
          Brankas Dokumen
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
          Kelola, tandatangani, dan pantau seluruh berkas digital Anda dengan aman dan terorganisir.
        </p>
      </div>
      
      <button 
        onClick={onUpload}
        className="flex items-center justify-center gap-3 bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 text-primary px-8 py-3.5 rounded-full text-sm font-bold transition-all border border-primary/20 dark:border-primary/40 backdrop-blur-sm cursor-pointer shrink-0 group active:scale-95 shadow-sm"
      >
        <Plus size={20} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" /> Unggah Baru
      </button>
    </div>
  );
};

export default DocumentHeader;
