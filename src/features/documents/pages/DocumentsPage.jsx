import React from 'react';
import { 
  Plus, 
  Search, 
  FileText, 
  RefreshCcw 
} from 'lucide-react';

// --- COMPONENTS & HOOKS ---
import { useDocuments } from '../hooks/useDocuments';
import DocumentTable from '../components/DocumentTable';
import DocumentFilter from '../components/DocumentFilter';
import Pagination from '../components/Pagination';
import UploadDocModal from '../components/UploadDocModal';
import DocumentInfoModal from '../components/DocumentInfoModal';
import EditDocModal from '../components/EditDocModal';
import ConfirmModal from '../../../components/UI/ConfirmModal';

/**
 * @page DocumentsPage
 * @description Halaman utama Brankas Dokumen (Dashboard).
 * Telah direfaktorisasi: Logika dipindahkan ke 'useDocuments' hook agar komponen ini tetap bersih.
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
    <div className="space-y-6 pb-12">
      
      {/* 1. Header & Utama CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 dark:text-white tracking-tight">
            Brankas Dokumen
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola dan pantau semua dokumen elektronik Anda di sini.
          </p>
        </div>
        
        <button 
          onClick={() => modals.upload.setOpen(true)}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20 cursor-pointer border-none shrink-0 w-full sm:w-auto"
        >
          <Plus size={18} strokeWidth={2.5} /> Unggah Baru
        </button>
      </div>

      {/* 2. Filter & Tools Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* Status Tabs */}
        <DocumentFilter 
          activeStatus={filters.status} 
          onStatusChange={filters.setStatus} 
        />

        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Cari dokumen..."
            value={filters.search}
            onChange={(e) => filters.setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && filters.setPage(1)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* 3. Content Area (Tabel / Loader / Empty) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        
        {loading ? (
          /* LOADING STATE */
          <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
             <div className="relative">
                <div className="w-12 h-12 border-4 border-slate-100 dark:border-slate-800 border-t-primary rounded-full animate-spin"></div>
                <FileText size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
             </div>
             <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 animate-pulse">Memuat data dokumen...</p>
          </div>
        ) : error ? (
          /* ERROR STATE */
          <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4 text-center">
             <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center text-rose-500">
                <RefreshCcw size={28} />
             </div>
             <div>
               <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Terjadi Kesalahan</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">{error}</p>
             </div>
             <button 
                onClick={actions.refresh}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg border-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
             >
                Coba Lagi
             </button>
          </div>
        ) : documents.length > 0 ? (
          /* SUCCESS STATE */
          <>
            <div className="flex-1">
              <DocumentTable documents={documents} onAction={actions.handleAction} />
            </div>
            
            {/* Paginasi di bagian bawah */}
            <Pagination 
              currentPage={meta.page} 
              totalPages={meta.totalPages} 
              onPageChange={actions.handlePageChange} 
            />
          </>
        ) : (
          /* EMPTY STATE */
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4 animate-in fade-in duration-700">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl flex items-center justify-center text-slate-300 dark:text-slate-700 mb-2 border border-dashed border-slate-200 dark:border-slate-800">
              <FileText size={36} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                {filters.search || filters.status ? 'Pencarian Tidak Ditemukan' : 'Brankas Masih Kosong'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {filters.search || filters.status 
                  ? 'Kami tidak menemukan dokumen yang sesuai dengan kriteria filter Anda. Silakan coba kata kunci lain.' 
                  : 'Anda belum memiliki dokumen apapun di sini. Mulailah dengan mengunggah file PDF pertama Anda.'}
              </p>
            </div>
            {!filters.search && !filters.status && (
               <button 
                 onClick={() => modals.upload.setOpen(true)}
                 className="flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 rounded-xl text-sm font-bold border border-primary/20 cursor-pointer hover:bg-primary/20 transition-all"
               >
                 <Plus size={18} strokeWidth={2.5} /> Unggah Sekarang
               </button>
            )}
          </div>
        )}
      </div>

      {/* MODAL UNGGAH */}
      <UploadDocModal 
        isOpen={modals.upload.isOpen} 
        onClose={() => modals.upload.setOpen(false)}
        onSuccess={modals.upload.onSuccess}
      />

      {/* MODAL INFO */}
      <DocumentInfoModal 
        isOpen={!!modals.info.data} 
        onClose={() => modals.info.setOpen(null)}
        document={modals.info.data}
        onViewFile={(doc) => actions.handleAction('view', doc)}
        onDownload={(docId) => actions.handleAction('download', { id: docId })}
      />

      {/* MODAL EDIT */}
      <EditDocModal 
        isOpen={!!modals.edit.data}
        onClose={() => modals.edit.setOpen(null)}
        document={modals.edit.data}
        onUpdate={modals.edit.onUpdate}
        loading={modals.edit.loading}
      />

      {/* MODAL HAPUS */}
      <ConfirmModal 
        isOpen={!!modals.delete.data}
        onClose={() => modals.delete.setOpen(null)}
        onConfirm={modals.delete.onConfirm}
        loading={modals.delete.loading}
        title="Hapus Dokumen"
        message={`Apakah Anda yakin ingin menghapus "${modals.delete.data?.title}"? Dokumen ini akan dihapus secara permanen dari brankas Anda.`}
        confirmText="Ya, Hapus"
        variant="danger"
      />

      {/* LOADING OVERLAY UNTUK INFO */}
      {modals.info.isLoading && (
        <div className="fixed inset-0 z-[110] bg-slate-900/20 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl flex items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Menyiapkan Detail...</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default DocumentsPage;
