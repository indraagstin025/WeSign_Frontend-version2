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
    <div className="group bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-500/10 dark:via-zinc-900/95 dark:to-zinc-950 border border-zinc-200 dark:border-white/10 rounded-[2.5rem] p-6 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
      {/* Decorative Gradient Glow - Added pointer-events-none to prevent blocking clicks */}
      <div className={`absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full transition-opacity opacity-0 group-hover:opacity-100 pointer-events-none z-0`} />

      {/* LEFT: INFO */}
      <div className="flex items-start gap-6 min-w-0 relative z-10">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 shadow-2xl transition-all group-hover:scale-110 group-hover:rotate-3 duration-500
          ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-100'}
        `}>
          {isCompleted ? <ShieldCheck size={32} /> : <FileText size={32} />}
        </div>
        
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight truncate max-w-[200px] sm:max-w-md">
              {doc.title}
            </h3>
            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg ${status.cls}`}>
              {status.label}
            </span>
          </div>
          
          <div className="flex items-center gap-5 text-[11px] font-bold text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <Clock size={14} className="text-emerald-500" />
              {isCompleted ? 'Finalized' : `${signedCount}/${totalSigners} Signed`}
            </span>
            {myStatus === 'SIGNED' && (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black px-2 py-0.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <CheckCircle size={14} /> Ready
              </span>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: ACTIONS */}
      <div className="flex items-center gap-3 shrink-0 relative z-10">
        {/* Main Action: Tanda Tangan */}
        {myStatus === 'PENDING' && docStatus === 'PENDING' && (
          <button
            onClick={onSign}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest border-none cursor-pointer shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <PenLine size={16} /> Sign Document
          </button>
        )}

        {/* Admin: Finalisasi */}
        {canFinalize && (
          <button
            onClick={onFinalize}
            disabled={isFinalizing}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest border-none cursor-pointer shadow-xl shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isFinalizing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            Finalize
          </button>
        )}

        {/* Utility Actions */}
        <div className="flex items-center bg-zinc-50 dark:bg-white/5 rounded-full p-2 gap-1 shadow-inner">
          <button
            onClick={onPreview}
            className="p-3 rounded-full hover:bg-white dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-100 hover:text-emerald-500 transition-all border-none bg-transparent cursor-pointer"
            title="Preview"
          >
            <Eye size={20} />
          </button>
          
          {isAdmin && !isCompleted && (
            <button
              onClick={onManageSigners}
              className="p-3 rounded-full hover:bg-white dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-100 hover:text-indigo-500 transition-all border-none bg-transparent cursor-pointer"
              title="Manage Signers"
            >
              <UserCog size={20} />
            </button>
          )}

          {isCompleted && (
            <button
              onClick={() => window.open(doc.currentVersion?.url, '_blank')}
              className="p-3 rounded-full hover:bg-white dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-100 hover:text-emerald-500 transition-all border-none bg-transparent cursor-pointer"
              title="Download PDF"
            >
              <ExternalLink size={20} />
            </button>
          )}

          {isAdmin && !isCompleted && (
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="p-3 rounded-full hover:bg-white dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-100 hover:text-rose-500 transition-all border-none bg-transparent cursor-pointer disabled:opacity-50"
              title="Delete"
            >
              {isDeleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default GroupDocumentCard;
