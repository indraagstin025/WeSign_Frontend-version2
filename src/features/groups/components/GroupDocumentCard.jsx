import React, { useState } from 'react';
import {
  FileText, CheckCircle, ExternalLink, PenLine,
  Loader2, UserCog, Trash2, Eye, MoreVertical, Clock,
  ShieldCheck, XCircle,
} from 'lucide-react';
import { useGroupDocumentCardState } from '../hooks/useGroupDocumentCardState';
import RejectReasonModal from './RejectReasonModal';

/**
 * @component GroupDocumentCard
 * @description Card dokumen grup — list row style sesuai mockup.
 */
const GroupDocumentCard = ({
  doc,
  isAdmin,
  myStatus,
  currentUserId,
  isFinalizing,
  isDeleting,
  onSign,
  onPreview,
  onFinalize,
  onManageSigners,
  onDelete,
  onReject,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  // [H-4] State untuk RejectReasonModal — replace blocking window.prompt.
  const [rejectOpen, setRejectOpen] = useState(false);
  const {
    signedCount,
    totalSigners,
    isCompleted,
    canFinalize,
    canSignNow,
    canDownload,
    canManageSigners,
    canDelete,
    status,
  } = useGroupDocumentCardState({ doc, isAdmin, myStatus, currentUserId });

  // [H-1] Status badge dari centralized config (constants/groupDocumentStatus.js).
  // Sebelumnya STATUS_BADGE inline di sini, useGroupDocumentCardState dan
  // useGroupDocumentPreviewPage masing-masing punya STATUS_CONFIG sendiri
  // dengan label inkonsisten (mis. COMPLETED "Selesai" vs "Finalized").
  const docStatus = doc?.status?.toUpperCase();
  const badge = getGroupDocumentStatus(docStatus);

  // Signer avatars (max 3 + overflow)
  const signers = doc?.signerRequests || [];
  const visibleSigners = signers.slice(0, 3);
  const overflowCount = signers.length - 3;

  // Signing progress dots
  const progressDots = signers.slice(0, 3).map((s) => s.status?.toUpperCase() === 'SIGNED');

  // Uploader name
  const uploaderName = doc?.owner?.name || 'Unknown';

  // Time ago (simple)
  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} menit lalu`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} jam lalu`;
    const days = Math.floor(hrs / 24);
    return `${days} hari lalu`;
  };

  // Left accent color by status
  const accentColor = {
    DRAFT: 'bg-zinc-300 dark:bg-zinc-600',
    PENDING: 'bg-amber-400',
    COMPLETED: 'bg-emerald-500',
    REJECTED: 'bg-rose-500',
  }[docStatus] || 'bg-zinc-300';

  return (
    <div className="relative flex items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 rounded-2xl px-5 py-4 hover:shadow-md hover:border-zinc-200 dark:hover:border-white/10 transition-all duration-200 group">
      {/* Left accent bar */}
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${accentColor}`} />

      {/* File icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ml-2
        ${isCompleted ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-300'}
      `}>
        {isCompleted ? <ShieldCheck size={20} /> : <FileText size={20} />}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-zinc-900 dark:text-white truncate max-w-[220px] sm:max-w-sm">
            {doc.title}
          </p>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${badge.cls}`}>
            {badge.label}
          </span>
        </div>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
          Dibuat oleh {uploaderName} · {timeAgo(doc.createdAt)}
        </p>

        {/* Progress dots */}
        {signers.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {progressDots.map((signed, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full border-2 transition-colors
                  ${signed
                    ? 'bg-emerald-500 border-emerald-500'
                    : signers[i]?.status?.toUpperCase() === 'REJECTED'
                      ? 'bg-rose-400 border-rose-400'
                      : 'bg-transparent border-zinc-300 dark:border-zinc-600'}
                `}
              />
            ))}
            {signers.length > 3 && (
              <span className="text-[10px] text-zinc-400 font-bold">+{signers.length - 3}</span>
            )}
            <span className="text-[10px] text-zinc-400 ml-1">{signedCount} of {totalSigners} signed</span>
          </div>
        )}
      </div>

      {/* Signer avatars */}
      {visibleSigners.length > 0 && (
        <div className="hidden sm:flex items-center -space-x-2 shrink-0">
          {visibleSigners.map((sr, i) => {
            const name = sr.user?.name || 'U';
            const initials = name.trim().split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
            const signed = sr.status?.toUpperCase() === 'SIGNED';
            return (
              <div
                key={sr.id || i}
                title={`${name} — ${sr.status}`}
                className={`w-7 h-7 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[9px] font-black
                  ${signed ? 'bg-emerald-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}
                `}
              >
                {initials}
              </div>
            );
          })}
          {overflowCount > 0 && (
            <div className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-[9px] font-black text-zinc-500">
              +{overflowCount}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Sign button */}
        {canSignNow && (
          <button
            onClick={onSign}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold border-none cursor-pointer transition-all active:scale-95"
          >
            <PenLine size={13} /> Sign Document
          </button>
        )}

        {/* Finalize button */}
        {canFinalize && (
          <button
            onClick={onFinalize}
            disabled={isFinalizing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold border-none cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            {isFinalizing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
            Finalize
          </button>
        )}

        {/* Preview */}
        <button
          onClick={onPreview}
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-none bg-transparent cursor-pointer transition-all"
          title="Preview"
        >
          <Eye size={16} />
        </button>

        {/* Manage signers */}
        {canManageSigners && (
          <button
            onClick={onManageSigners}
            className="p-2 rounded-lg text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-none bg-transparent cursor-pointer transition-all"
            title="Manage Signers"
          >
            <UserCog size={16} />
          </button>
        )}

        {/* More menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-none bg-transparent cursor-pointer transition-all"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-white/10 rounded-xl shadow-xl py-1 min-w-[160px]">
                {canDownload && (
                  <button
                    onClick={() => { window.open(doc.currentVersion?.url, '_blank'); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-[12px] font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 bg-transparent border-none cursor-pointer text-left"
                  >
                    <ExternalLink size={13} /> Download PDF
                  </button>
                )}
                {isAdmin && !isCompleted && docStatus === 'PENDING' && onReject && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      // [H-4] Buka modal RejectReasonModal alih-alih
                      // window.prompt yang blocking dan tidak match design.
                      setRejectOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-[12px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 bg-transparent border-none cursor-pointer text-left"
                  >
                    <XCircle size={13} /> Tolak Dokumen
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(); }}
                    disabled={isDeleting}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-[12px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 bg-transparent border-none cursor-pointer text-left disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    Hapus
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* [H-4] Reject reason modal — replace window.prompt */}
      <RejectReasonModal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onSubmit={(reason) => {
          setRejectOpen(false);
          // Convert empty string -> null untuk konsistensi dengan kontrak lama
          // (prompt cancel = null, submit empty = "" yang juga di-coerce ke null)
          onReject(doc.id, reason || null);
        }}
        documentTitle={doc?.title}
      />
    </div>
  );
};

export default GroupDocumentCard;
