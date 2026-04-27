import React from 'react';
import { 
  Plus, 
  Search, 
  Layers, 
  RefreshCcw 
} from 'lucide-react';

import { usePackages } from '../hooks/usePackages';
import PackageTable from '../components/PackageTable';
import CreatePackageModal from '../components/CreatePackageModal';
import PackageInfoModal from '../components/PackageInfoModal';
import DocumentFilter from '../../documents/components/DocumentFilter';
import ConfirmModal from '../../../components/UI/ConfirmModal';

const PackagesPage = () => {
    const {
        packages,
        loading,
        error,
        filters,
        actions,
        modals
    } = usePackages();

    return (
        <div className="flex flex-col h-screen lg:h-[calc(100vh-4rem)] max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 overflow-hidden">
            
            {/* 1. FIXED TOP AREA (Judul, Filter, Header Kolom) */}
            <div className="flex-shrink-0 animate-in fade-in duration-700">
                
                {/* 1.1 HEADER (Judul & CTA) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-1 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-zinc-900 dark:text-white tracking-tight">
                            Paket Tanda Tangan
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-md">
                            Kelola batch dokumen (banyak file) untuk ditandatangani sekaligus dengan aman.
                        </p>
                    </div>
                    
                    <button 
                      onClick={() => modals.upload.setOpen(true)}
                      className="flex items-center justify-center gap-3 bg-primary hover:bg-primary-dark text-white px-7 py-3.5 rounded-2xl text-sm font-bold transition-all shadow-xl shadow-primary/25 cursor-pointer border-none shrink-0 group hover:-translate-y-0.5 active:scale-95"
                    >
                      <Plus size={20} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" /> Buat Paket Baru
                    </button>
                </div>

                {/* 1.2 TOOLBAR (Filter & Search) */}
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex p-1.5 bg-zinc-100/50 dark:bg-zinc-800/40 rounded-[20px] backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/30 overflow-x-auto no-scrollbar max-w-full">
                        {[
                            { label: 'Semua', value: '' },
                            { label: 'Draf', value: 'draft' },
                            { label: 'Proses', value: 'pending' },
                            { label: 'Selesai', value: 'completed' },
                            { label: 'Arsip', value: 'archived' }
                        ].map((tab) => (
                            <button 
                                key={tab.label}
                                onClick={() => actions.setStatus?.(tab.value)}
                                className={`px-6 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap border-none cursor-pointer
                                    ${(filters?.status === tab.value)
                                        ? 'bg-white dark:bg-zinc-700 text-primary shadow-[0_8px_20px_-4px_rgba(var(--primary-rgb),0.2)]' 
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-zinc-700/30'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative flex-1 group w-full md:w-auto">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors duration-300">
                            <Search size={18} />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Cari paket..."
                            value={filters.search}
                            onChange={(e) => filters.setSearch(e.target.value)}
                            className="w-full pl-12 pr-5 py-3 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 dark:text-white placeholder:text-zinc-500 transition-all font-medium"
                        />
                    </div>
                </div>

                {/* 1.3 TABLE COLUMN HEADERS (Fixed) */}
                <div className="hidden lg:flex items-center px-6 py-4 mt-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 transition-colors rounded-t-2xl shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                   <div className="w-[5%] text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-2">No.</div>
                   <div className="w-[36%] text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Nama Paket</div>
                   <div className="w-[15%] text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-center">Kategori</div>
                   <div className="w-[15%] text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-center">Status</div>
                   <div className="w-[15%] text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-center">Dokumen</div>
                   <div className="w-[14%] text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-right pr-6">Aksi</div>
                </div>
            </div>

            {/* 2. SCROLLABLE CONTENT AREA (Hanya Tabel Paket yang Scroll) */}
            <div className="flex-1 overflow-y-auto no-scrollbar relative pt-2">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center p-12 space-y-5">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-zinc-100 dark:border-zinc-800 border-t-primary rounded-full animate-spin"></div>
                            <Layers size={28} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
                        </div>
                        <div className="text-center animate-pulse">
                            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 tracking-wider uppercase">Memproses Paket</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Mengambil data arsip Anda...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="h-full flex flex-col items-center justify-center p-12 space-y-6 text-center">
                        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/10 rounded-[32px] flex items-center justify-center text-rose-500 border border-rose-100 dark:border-rose-900/30">
                            <RefreshCcw size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Terjadi Gangguan</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">{error}</p>
                        </div>
                        <button 
                            onClick={actions.refresh}
                            className="px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold rounded-2xl border-none cursor-pointer hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-zinc-900/20 dark:shadow-white/10"
                        >
                            Muat Ulang Halaman
                        </button>
                    </div>
                ) : packages.length > 0 ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
                        <PackageTable packages={packages} onAction={actions.handleAction} />
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in fade-in duration-700">
                        <div className="w-28 h-28 bg-zinc-50 dark:bg-zinc-800/40 rounded-[40px] flex items-center justify-center text-zinc-300 dark:text-zinc-700 border-2 border-dashed border-zinc-200 dark:border-zinc-800 shadow-inner">
                            <Layers size={48} />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white font-heading">
                                Belum Ada Paket
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                                Anda belum memiliki arsip paket tanda tangan. Mulai kumpulkan dokumen Anda dalam satu paket untuk proses yang lebih cepat.
                            </p>
                        </div>
                        <button 
                            onClick={() => modals.upload.setOpen(true)}
                            className="flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl text-sm font-bold border-none cursor-pointer hover:bg-primary-dark transition-all shadow-xl shadow-primary/25"
                        >
                            <Plus size={20} strokeWidth={2.5} /> Buat Paket Sekarang
                        </button>
                    </div>
                )}
            </div>

            <CreatePackageModal 
              isOpen={modals.upload.isOpen} 
              onClose={() => modals.upload.setOpen(false)} 
              onSuccess={actions.refresh} 
            />

            <PackageInfoModal 
              isOpen={modals.info?.data !== null}
              pkg={modals.info?.data}
              onClose={() => modals.info.setOpen(false)}
              onRefresh={actions.refresh}
              onDelete={() => actions.handleConfirmDelete(modals.info?.data)}
            />

            <ConfirmModal
              isOpen={modals.delete?.data !== null}
              onClose={() => modals.delete.setOpen(false)}
              onConfirm={() => actions.handleConfirmDelete()}
              title="Hapus Paket Tanda Tangan?"
              message={`Anda yakin ingin menghapus paket "${modals.delete?.data?.title || 'ini'}"? Tindakan ini akan menghapus seluruh dokumen PDF di dalam paket secara permanen.`}
              confirmText="Ya, Hapus Paket"
              cancelText="Batal"
              variant="danger"
              loading={modals.delete.isDeleting}
            />
        </div>
    );
};

export default PackagesPage;
