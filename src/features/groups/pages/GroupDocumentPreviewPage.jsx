import React from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, FileText, Download, ExternalLink,
  AlertCircle, Loader2, CheckCircle2,
  Users, PenLine, RefreshCw, ShieldCheck,
} from 'lucide-react';
import StatusModal from '../../../components/UI/StatusModal';
import { useGroupDocumentPreviewPage } from '../hooks/useGroupDocumentPreviewPage';

/**
 * @page GroupDocumentPreviewPage
 * @description Pure presentation — semua logic di `useGroupDocumentPreviewPage`.
 */
const GroupDocumentPreviewPage = () => {
  const { state, actions } = useGroupDocumentPreviewPage();
  const {
    currentUser,
    groupData,
    doc,
    pdfUrl,
    loading,
    error,
    statusModal,
    signerRequests,
    signedCount,
    totalSigners,
    progress,
    myStatus,
    canSign,
    docStatusCfg,
    signUrl,
  } = state;

  const DocStatusIcon = docStatusCfg.icon;

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-50 dark:bg-zinc-950 flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="h-20 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between px-6 shadow-sm shrink-0 gap-8">
        <div className="flex items-center gap-6 min-w-0 flex-1">
          <button
            onClick={actions.goBackToGroup}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-emerald-600 transition-colors border-none bg-transparent cursor-pointer group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Kembali
          </button>

          <div className="h-8 w-px bg-zinc-100 dark:bg-white/5" />

          <div className="flex items-center gap-4 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-black text-zinc-900 dark:text-white truncate uppercase tracking-tight leading-none">
                {loading && !doc ? 'Memuat...' : doc?.title}
              </h1>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">
                {groupData?.name || 'Workspace'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={actions.handleRefresh}
            className="p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-400 hover:text-emerald-500 transition-all border-none bg-transparent cursor-pointer"
          >
            <RefreshCw size={18} />
          </button>

          {!loading && pdfUrl && (
            <div className="flex items-center gap-2 border-l border-zinc-100 dark:border-white/5 pl-3">
              <button
                onClick={actions.handleDownload}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 text-zinc-700 dark:text-zinc-300 text-[10px] font-black uppercase tracking-widest hover:border-emerald-500 transition-all cursor-pointer shadow-sm"
              >
                <Download size={14} /> Unduh
              </button>
              <button
                onClick={actions.openInNewTab}
                className="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 text-zinc-400 hover:text-emerald-500 transition-all cursor-pointer shadow-sm"
              >
                <ExternalLink size={18} />
              </button>
            </div>
          )}

          {canSign && (
            <Link
              to={signUrl}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 dark:bg-emerald-600 hover:bg-zinc-800 dark:hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest border-none cursor-pointer no-underline shadow-xl shadow-zinc-900/10 dark:shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <PenLine size={14} /> Tanda Tangan
            </Link>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">

        {/* PDF VIEW */}
        <div className="flex-1 relative bg-zinc-100 dark:bg-[#0b141a] overflow-hidden">
          {loading && !pdfUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <Loader2 size={40} className="animate-spin text-emerald-500/50" />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest animate-pulse">Menyiapkan Dokumen</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center gap-6">
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/30 rounded-[2.5rem] flex items-center justify-center text-rose-500 border border-dashed border-rose-200 dark:border-rose-900/30">
                <AlertCircle size={32} />
              </div>
              <div className="max-w-xs">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase">Akses Gagal</h3>
                <p className="text-sm text-zinc-500 font-medium mt-2">{error}</p>
              </div>
              <button
                onClick={actions.handleRetry}
                className="px-8 py-3.5 rounded-2xl bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white text-xs font-black uppercase tracking-widest border-none cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0`}
              className="w-full h-full border-none shadow-2xl bg-white"
              title="PDF Preview"
            />
          )}
        </div>

        {/* SIDEBAR */}
        {!loading && !error && (
          <div className="w-80 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-white/5 flex flex-col shrink-0 hidden xl:flex">

            <div className="p-8 space-y-10 overflow-y-auto">

              {/* STATUS CARD */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Dokumen Info</p>
                <div className={`flex items-center gap-3 p-4 rounded-3xl border border-zinc-100 dark:border-white/5 ${docStatusCfg.bg}`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${docStatusCfg.color} bg-white dark:bg-zinc-900 shadow-sm`}>
                    <DocStatusIcon size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Kondisi</p>
                    <p className={`text-sm font-black uppercase ${docStatusCfg.color}`}>{docStatusCfg.label}</p>
                  </div>
                </div>
              </div>

              {/* PROGRESS BAR */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Penyelesaian</p>
                  <span className="text-[10px] font-black text-zinc-900 dark:text-white uppercase">{signedCount}/{totalSigners}</span>
                </div>
                <div className="w-full h-3 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[10px] font-bold text-zinc-400 italic text-center">
                  {progress === 100 ? 'Siap untuk difinalisasi oleh admin' : 'Menunggu anggota lain menandatangani'}
                </p>
              </div>

              {/* SIGNERS LIST */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-emerald-500" />
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Daftar Signer</p>
                </div>

                <div className="space-y-3">
                  {signerRequests.map((sr) => {
                    const isMe = String(sr.userId) === String(currentUser?.id);
                    const signed = sr.status?.toUpperCase() === 'SIGNED';
                    const name = sr.user?.name || sr.name || 'User';
                    const initials = name.trim().split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

                    return (
                      <div
                        key={sr.id || sr.userId}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300
                          ${isMe ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-transparent border-transparent'}
                        `}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0
                          ${signed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-zinc-100 dark:bg-white/5 text-zinc-400'}
                        `}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-zinc-800 dark:text-white truncate uppercase">
                            {name} {isMe && <span className="text-[9px] text-emerald-500">(Anda)</span>}
                          </p>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight">{sr.status}</p>
                        </div>
                        {signed && <ShieldCheck size={16} className="text-emerald-500 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* SIDEBAR FOOTER */}
            <div className="mt-auto p-8 border-t border-zinc-100 dark:border-white/5 space-y-3">
              {canSign ? (
                <Link
                  to={signUrl}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all no-underline shadow-xl shadow-emerald-600/20 active:scale-95"
                >
                  <PenLine size={14} /> Tanda Tangan
                </Link>
              ) : myStatus === 'SIGNED' ? (
                <div className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em]">
                  <CheckCircle2 size={14} /> Terkirim
                </div>
              ) : null}

              <button
                onClick={actions.handleDownload}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 text-[10px] font-black uppercase tracking-[0.2em] bg-transparent hover:bg-zinc-50 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                <Download size={14} /> Simpan Copy
              </button>
            </div>
          </div>
        )}
      </div>

      <StatusModal
        {...statusModal}
        onClose={actions.closeStatusModal}
      />
    </div>
  );
};

export default GroupDocumentPreviewPage;
