import React from 'react';
import {
  FileText, CheckCircle, ExternalLink, PenLine,
  Loader2, UserCog, Trash2, Eye, Clock, ShieldCheck
} from 'lucide-react';

const STATUS_CONFIG = {
  DRAFT:      { label: 'Draft',    cls: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' },
  PENDING:    { label: 'Menunggu', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500' },
  COMPLETED:  { label: 'Selesai',  cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500' },
  PROCESSING: { label: 'Diproses', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500' },
};

const GroupDocumentCard = ({
  doc,
  isAdmin,
  myStatus,
  isFinalizing,
  isDeleting,
  onSign,
  onPreview,
  onFinalize,
  onManageSigners,
  onDelete,
}) => {
  const docStatus = doc.status?.toUpperCase();
  const signedCount = doc.signerRequests?.filter((s) => s.status?.toUpperCase() === 'SIGNED').length || 0;
  const totalSigners = doc.signerRequests?.length || 0;
  const allSigned = totalSigners > 0 && signedCount === totalSigners;
  const canFinalize = isAdmin && allSigned && docStatus !== 'COMPLETED';
  const isCompleted = docStatus === 'COMPLETED';

  const status = STATUS_CONFIG[docStatus] || STATUS_CONFIG.PENDING;

  return (
    <div className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-3xl p-5 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-emerald-900/5 transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        
        {/* LEFT: INFO */}
        <div className="flex items-start gap-4 min-w-0">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors
            ${isCompleted ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}
          `}>
            {isCompleted ? <ShieldCheck size={24} /> : <FileText size={24} />}
          </div>
          
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight truncate max-w-[200px] sm:max-w-md">
                {doc.title}
              </h3>
              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${status.cls}`}>
                {status.label}
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <Clock size={11} className="opacity-50" />
                {isCompleted ? 'Finalized' : `${signedCount}/${totalSigners} Tertanda`}
              </span>
              {myStatus === 'SIGNED' && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-500">
                  <CheckCircle size={11} /> Anda sudah TTD
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: ACTIONS */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Main Action: Tanda Tangan */}
          {myStatus === 'PENDING' && docStatus === 'PENDING' && (
            <button
              onClick={onSign}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-emerald-600 hover:bg-zinc-800 dark:hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest border-none cursor-pointer shadow-lg shadow-zinc-900/10 dark:shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <PenLine size={14} /> Tanda Tangan
            </button>
          )}

          {/* Admin: Finalisasi */}
          {canFinalize && (
            <button
              onClick={onFinalize}
              disabled={isFinalizing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest border-none cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isFinalizing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Finalisasi
            </button>
          )}

          {/* Utility Actions */}
          <div className="flex items-center bg-zinc-50 dark:bg-white/5 rounded-xl p-1 gap-1">
            <button
              onClick={onPreview}
              className="p-2 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-400 hover:text-blue-500 transition-all border-none bg-transparent cursor-pointer"
              title="Pratinjau Dokumen"
            >
              <Eye size={16} />
            </button>
            
            {isAdmin && !isCompleted && (
              <button
                onClick={onManageSigners}
                className="p-2 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-400 hover:text-emerald-500 transition-all border-none bg-transparent cursor-pointer"
                title="Kelola Signer"
              >
                <UserCog size={16} />
              </button>
            )}

            {isCompleted && (
              <button
                onClick={() => window.open(doc.currentVersion?.url, '_blank')}
                className="p-2 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-400 hover:text-emerald-500 transition-all border-none bg-transparent cursor-pointer"
                title="Unduh PDF Final"
              >
                <ExternalLink size={16} />
              </button>
            )}

            {isAdmin && !isCompleted && (
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="p-2 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-400 hover:text-rose-500 transition-all border-none bg-transparent cursor-pointer disabled:opacity-50"
                title="Hapus Dokumen"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDocumentCard;
