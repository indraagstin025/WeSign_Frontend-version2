import React, { useState, useMemo } from 'react';
import { FileText, RefreshCcw, Plus, Search, SlidersHorizontal, RotateCcw, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments';
import { useDocumentTypes } from '../hooks/useDocumentTypes';
import DocumentTable from '../components/DocumentTable';
import DocumentModals from '../components/DocumentModals';

const STATUS_TABS = [
  { label: 'Semua', value: '' },
  { label: 'Draft', value: 'draft' },
  { label: 'Proses', value: 'pending' },
  { label: 'Selesai', value: 'completed' },
  { label: 'Terhapus', value: 'trash' },
];

const DocumentsPage = () => {
  const { documents, loading, error, meta, trashCount, statusCounts, filters, modals, actions } = useDocuments();
  const [sortBy, setSortBy] = useState('Terbaru');
  // [H-5] Filter type pakai daftar dari useDocumentTypes (single source of
  // truth dengan whitelist USER_ALLOWED_DOCUMENT_TYPES di backend).
  // Sebelumnya hardcode 4 opsi inline yang bisa drift dari backend.
  // Filter ini client-side (backend belum support `type` query param di
  // GET /documents). Kalau nanti backend support, tinggal pindah ke
  // useDocuments hook.
  const documentTypes = useDocumentTypes();
  const [typeFilter, setTypeFilter] = useState('');

  const filteredDocuments = useMemo(() => {
    if (!typeFilter) return documents;
    return documents.filter((d) => d.type === typeFilter);
  }, [documents, typeFilter]);

  const countByStatus = (status) => {
    if (status === 'trash') return trashCount;
    if (status === 'draft') return statusCounts.draft;
    if (status === 'pending') return statusCounts.pending;
    if (status === 'completed') return statusCounts.completed;
    return statusCounts.all; // '' = Semua
  };

  const showPagination = meta.totalPages > 1;

  const getPageNumbers = () => {
    const total = meta.totalPages;
    const cur = meta.page;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 3) return [1, 2, 3, '...', total];
    if (cur >= total - 2) return [1, '...', total - 2, total - 1, total];
    return [1, '...', cur, '...', total];
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-6">

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Brankas Dokumen</h1>
            <p className="text-[12px] text-zinc-400 mt-1 max-w-md">
              Kelola, tandatangani, dan pantau seluruh berkas digital Anda dengan aman dan terorganisir.
            </p>
          </div>
          <button
            onClick={() => modals.upload.setOpen(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[12px] font-semibold transition-all shadow-sm border-none cursor-pointer shrink-0 active:scale-95"
          >
            <Plus size={15} strokeWidth={2.5} /> Unggah Baru
          </button>
        </div>

        {/* ── FILTER BAR ─────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3 mb-4 shadow-sm">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari dokumen..."
              value={filters.search}
              onChange={(e) => { filters.setSearch(e.target.value); filters.setPage(1); }}
              className="w-full pl-8 pr-3 py-2 text-[12px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-zinc-700 dark:text-zinc-200 transition-all"
            />
          </div>

          <div className="relative">
            <select
              value={filters.status || ''}
              onChange={(e) => filters.setStatus(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-[12px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-zinc-600 dark:text-zinc-300 cursor-pointer"
            >
              <option value="">Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Proses</option>
              <option value="completed">Selesai</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>

          <div className="relative">
            {/* [H-5] Tipe options dari useDocumentTypes (sebelumnya hardcode) */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              disabled={documentTypes.loading}
              className="appearance-none pl-3 pr-8 py-2 text-[12px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-zinc-600 dark:text-zinc-300 cursor-pointer disabled:opacity-60"
            >
              <option value="">Tipe</option>
              {documentTypes.types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>

          <button className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-lg cursor-pointer transition-all bg-transparent">
            <SlidersHorizontal size={13} /> Filter Lainnya
          </button>

          <button
            onClick={() => { filters.setSearch(''); filters.setStatus(''); filters.setPage(1); setTypeFilter(''); }}
            className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-emerald-600 hover:text-emerald-700 bg-transparent border-none cursor-pointer transition-all ml-auto"
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>

        {/* ── STATUS CEPAT + SORT ─────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-zinc-400 mr-1">Status Cepat</span>
            {STATUS_TABS.map((tab) => {
              const count = countByStatus(tab.value);
              const isActive = (filters.status || '') === tab.value;
              const pendingStyle = tab.value === 'pending' && count > 0 ? 'border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-500/10' : '';
              const completedStyle = tab.value === 'completed' && count > 0 ? 'border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : '';
              const trashStyle = tab.value === 'trash' ? 'border-rose-200 text-rose-500 bg-rose-50 dark:bg-rose-500/10' : '';
              return (
                <button
                  key={tab.value}
                  onClick={() => filters.setStatus(tab.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer
                    ${isActive
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                      : pendingStyle || completedStyle || trashStyle || 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300'
                    }`}
                >
                  {tab.label}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400">Urutkan:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1.5 text-[11px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none text-zinc-600 dark:text-zinc-300 cursor-pointer"
              >
                <option>Terbaru</option>
                <option>Terlama</option>
                <option>A-Z</option>
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── TABLE ──────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-zinc-100 dark:border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">Memuat dokumen...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <RefreshCcw size={28} className="text-rose-400" />
              <p className="text-sm text-zinc-500">{error}</p>
              <button onClick={actions.refresh} className="px-5 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[12px] font-semibold rounded-xl border-none cursor-pointer">
                Muat Ulang
              </button>
            </div>
          ) : filteredDocuments.length > 0 ? (
            <DocumentTable documents={filteredDocuments} onAction={actions.handleAction} modals={modals} isTrashMode={filters.status === 'trash'} />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
              <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-700">
                <FileText size={28} className="text-zinc-300 dark:text-zinc-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">
                  {filters.search || filters.status ? 'Tidak Ditemukan' : 'Belum Ada Dokumen'}
                </h3>
                <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                  {filters.search || filters.status
                    ? 'Tidak ada dokumen yang sesuai dengan filter.'
                    : 'Unggah dokumen pertama Anda untuk mulai.'}
                </p>
              </div>
              {!filters.search && !filters.status && (
                <button
                  onClick={() => modals.upload.setOpen(true)}
                  className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-[12px] font-semibold border-none cursor-pointer hover:bg-emerald-600 transition-all"
                >
                  <Plus size={14} /> Unggah Sekarang
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── PAGINATION ─────────────────────────────────────────────── */}
        {showPagination && (
          <div className="flex items-center justify-between mt-4 px-1">
            <p className="text-[11px] text-zinc-400">
              Menampilkan {(meta.page - 1) * meta.limit + 1} - {Math.min(meta.page * meta.limit, meta.total)} dari {meta.total} dokumen
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => actions.handlePageChange(meta.page - 1)}
                disabled={meta.page === 1}
                className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700 flex items-center justify-center bg-white dark:bg-zinc-900 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={13} />
              </button>

              {getPageNumbers().map((p, i) =>
                p === '...' ? (
                  <span key={`e-${i}`} className="text-zinc-300 text-[11px] px-1">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => actions.handlePageChange(p)}
                    className={`w-7 h-7 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border
                      ${p === meta.page
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300'
                      }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => actions.handlePageChange(meta.page + 1)}
                disabled={meta.page === meta.totalPages}
                className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700 flex items-center justify-center bg-white dark:bg-zinc-900 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODALS ─────────────────────────────────────────────────── */}
      <DocumentModals modals={modals} actions={actions} />
    </div>
  );
};

export default DocumentsPage;
