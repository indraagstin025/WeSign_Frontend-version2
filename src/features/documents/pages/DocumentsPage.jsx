import React from 'react';
import { FileText, RefreshCcw, Plus } from 'lucide-react';

// --- COMPONENTS & HOOKS ---
import { useDocuments } from '../hooks/useDocuments';
import DocumentTable from '../components/DocumentTable';
import Pagination from '../components/Pagination';
import DocumentHeader from '../components/DocumentHeader';
import DocumentToolbar from '../components/DocumentToolbar';
import DocumentModals from '../components/DocumentModals';

/**
 * @page DocumentsPage
 * @description Halaman utama Brankas Dokumen (Dashboard).
 * High-Level Orchestrator: Hanya mengelola tata letak dan distribusi data ke sub-komponen.
 */
const DocumentsPage = () => {
  const {
    documents,
    loading,
    error,
    meta,
    filters,
    modals,
    actions
  } = useDocuments();

  return (
    <div className="flex flex-col h-screen lg:h-[calc(100vh-4rem)] max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 overflow-hidden">
      
      {/* 1. TOP AREA (Header & Toolbar) */}
      <div className="flex-shrink-0 space-y-0">
        <DocumentHeader onUpload={() => modals.upload.setOpen(true)} />
        <DocumentToolbar filters={filters} />

        {/* 1.1 TABLE COLUMN HEADERS (Fixed Visual) */}
        <div className="hidden lg:flex items-center px-6 py-4 mt-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 transition-colors rounded-t-2xl shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
           <div className="w-[5%] text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-2 font-heading">No.</div>
           <div className="w-[36%] text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-left font-heading">Nama Dokumen</div>
           <div className="w-[15%] text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-center font-heading">Status</div>
           <div className="w-[15%] text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-center font-heading">Tipe</div>
           <div className="w-[18%] text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-center font-heading">Tanggal</div>
           <div className="w-[11%] text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-right pr-6 font-heading">Aksi</div>
        </div>
      </div>

      {/* 2. SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative pt-2">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center p-12 space-y-5 animate-in fade-in duration-500">
             <div className="relative">
                <div className="w-16 h-16 border-4 border-zinc-100 dark:border-zinc-800 border-t-primary rounded-full animate-spin"></div>
                <FileText size={28} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
             </div>
             <div className="text-center animate-pulse">
               <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 tracking-wider uppercase">Memproses Data</p>
               <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Mohon tunggu sebentar...</p>
             </div>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center p-12 space-y-6 text-center animate-in fade-in duration-500">
             <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/10 rounded-[32px] flex items-center justify-center text-rose-500 border border-rose-100 dark:border-rose-900/30">
                <RefreshCcw size={32} />
             </div>
             <div>
               <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Terjadi Gangguan</h3>
               <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">{error}</p>
             </div>
             <button onClick={actions.refresh} className="px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold rounded-2xl border-none cursor-pointer hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-zinc-900/20 dark:shadow-white/10">
                Muat Ulang Halaman
             </button>
          </div>
        ) : documents.length > 0 ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
            <DocumentTable documents={documents} onAction={actions.handleAction} modals={modals} />
            <div className="pt-10 pb-8">
              <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={actions.handlePageChange} />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in fade-in duration-700">
            <div className="w-28 h-28 bg-zinc-50 dark:bg-zinc-800/40 rounded-[40px] flex items-center justify-center text-zinc-200 dark:text-zinc-700 border-2 border-dashed border-zinc-200 dark:border-zinc-800 shadow-inner">
              <FileText size={48} />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white font-heading">
                {filters.search || filters.status ? 'Pencarian Nihil' : 'Belum Ada Dokumen'}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                {filters.search || filters.status 
                  ? 'Kami tidak menemukan berkas yang sesuai dengan kriteria filter atau pencarian Anda.' 
                  : 'Sistem belum menemukan dokumen apapun di akun Anda. Ayo mulai amankan dokumen Anda hari ini.'}
              </p>
            </div>
            {!filters.search && !filters.status && (
               <button 
                 onClick={() => modals.upload.setOpen(true)} 
                 className="flex items-center gap-3 bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 text-primary px-10 py-4 rounded-full text-sm font-bold border border-primary/20 dark:border-primary/40 backdrop-blur-sm cursor-pointer transition-all active:scale-95 shadow-sm"
               >
                 <Plus size={20} strokeWidth={2.5} /> Unggah File Pertama
               </button>
            )}
          </div>
        )}
      </div>

      {/* 3. GLOBAL MODALS CONTAINER */}
      <DocumentModals modals={modals} actions={actions} />

    </div>
  );
};

export default DocumentsPage;
