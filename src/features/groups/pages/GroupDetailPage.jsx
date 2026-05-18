import React from 'react';
import {
  Users, FileText, FilePlus, Share2, RefreshCw,
  Loader2, Copy, CheckCircle, ArrowLeft, UserPlus,
  Settings, Search, SlidersHorizontal, LayoutGrid, List,
  Activity, Trash2, RotateCcw, ChevronDown,
} from 'lucide-react';
import GroupDocumentCard from '../components/GroupDocumentCard';
import GroupMemberList from '../components/GroupMemberList';
import UploadGroupDocModal from '../components/UploadGroupDocModal';
import ManageSignersModal from '../components/ManageSignersModal';
import StatusModal from '../../../components/ui/StatusModal';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { useGroupDetailPage } from '../hooks/useGroupDetailPage';
import AuditTrailToggle from '../../signature/components/AuditTrailToggle';
import { timeAgo } from '../../../utils/timeAgo';

/**
 * Collapsible section untuk dokumen terhapus di grup.
 */
const TrashSection = ({ trashDocs, trashMeta, trashPage, trashLoading, trashCount, onFetch, onRestore, onPageChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && trashDocs.length === 0) {
      onFetch({ page: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <div className="mt-4 bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-3 bg-transparent border-none cursor-pointer text-left"
      >
        <div className="flex items-center gap-2">
          <Trash2 size={14} className="text-rose-500" />
          <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">Terhapus</span>
          <span className="text-[10px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md">{trashCount}</span>
        </div>
        <ChevronDown size={14} className={`text-rose-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="px-5 pb-4 space-y-2">
          {trashLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="animate-spin text-rose-400" />
            </div>
          ) : trashDocs.length > 0 ? (
            <>
              {trashDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between bg-white dark:bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={16} className="text-zinc-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-200 truncate">{doc.title || 'Tanpa Judul'}</p>
                      <p className="text-[10px] text-zinc-400">
                        Dihapus {doc.deletedAt ? new Date(doc.deletedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onRestore(doc)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg text-[11px] font-semibold border-none cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all"
                  >
                    <RotateCcw size={12} /> Pulihkan
                  </button>
                </div>
              ))}
              {trashMeta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 pt-2">
                  <button onClick={() => onPageChange(trashPage - 1)} disabled={trashPage === 1} className="w-6 h-6 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-400 text-[11px] bg-white dark:bg-zinc-900 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">‹</button>
                  <span className="text-[10px] text-zinc-400 px-2">{trashPage}/{trashMeta.totalPages}</span>
                  <button onClick={() => onPageChange(trashPage + 1)} disabled={trashPage === trashMeta.totalPages} className="w-6 h-6 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-400 text-[11px] bg-white dark:bg-zinc-900 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">›</button>
                </div>
              )}
            </>
          ) : (
            <p className="text-[11px] text-zinc-400 text-center py-4">Tidak ada dokumen terhapus.</p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * @page GroupDetailPage
 * @description Redesigned — clean professional layout sesuai mockup.
 */
const GroupDetailPage = () => {
  const { state, actions } = useGroupDetailPage();
  const {
    groupId,
    currentUser,
    groupData,
    loading,
    isAdmin,
    isUploadModalOpen,
    manageSignersDoc,
    deleteTarget,
    isDeleting,
    isFinalizing,
    finalizeTarget,
    inviteLink,
    isCopied,
    kickTarget,
    kickingId,
    statusModal,
    // Document pagination
    documents,
    docMeta,
    docPage,
    docSearch,
    docSortBy,
    docLoading,
  } = state;

  if (loading && !groupData) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-emerald-500/50" />
      </div>
    );
  }

  const memberCount = groupData?.members?.length || 0;
  const docCount = docMeta.total || 0;
  const createdMonth = groupData?.createdAt
    ? new Date(groupData.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase()
    : '-';

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 no-scrollbar">

      {/* ── HEADER BANNER ─────────────────────────────────────────────── */}
      <div className="relative h-36 w-full overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500">
        <div className="absolute inset-0 bg-black/10" />
        <button
          onClick={actions.goBackToList}
          className="absolute top-5 left-6 z-10 flex items-center gap-2 text-white/80 hover:text-white text-xs font-bold bg-black/20 hover:bg-black/30 px-3 py-2 rounded-lg border-none cursor-pointer transition-all"
        >
          <ArrowLeft size={14} /> Kembali
        </button>
      </div>

      {/* ── WORKSPACE HEADER ──────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-10">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-white/5 shadow-sm px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Group avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-black shadow-lg -mt-8 border-4 border-white dark:border-zinc-900 shrink-0">
              {groupData?.name?.charAt(0)?.toUpperCase() || 'G'}
            </div>
            <div>
              <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Official Workspace
              </div>
              <h1 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                {groupData?.name || 'Loading...'}
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">Kolaborasi tim yang aman, efisien, dan terorganisir.</p>
              <div className="flex items-center gap-4 mt-1.5 text-[11px] text-zinc-400 font-medium">
                <span className="flex items-center gap-1"><Users size={11} /> {memberCount} Members</span>
                <span className="flex items-center gap-1"><FileText size={11} /> {docCount} Documents</span>
                <span className="flex items-center gap-1 text-emerald-500"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Active</span>
              </div>
            </div>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => actions.fetchGroup()}
              className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-white border border-zinc-100 dark:border-white/5 cursor-pointer transition-all"
              title="Refresh"
            >
              <RefreshCw size={15} />
            </button>
            {isAdmin && (
              <button
                onClick={actions.handleInvite}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-white/5 text-zinc-700 dark:text-zinc-200 text-[11px] font-bold hover:border-emerald-500/30 cursor-pointer transition-all"
              >
                <UserPlus size={14} /> Invite
              </button>
            )}
            <button
              onClick={actions.openUploadModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold border-none cursor-pointer shadow-md shadow-emerald-500/20 transition-all active:scale-95"
            >
              <FilePlus size={14} /> New Document
            </button>
          </div>
        </div>
      </div>

      {/* ── INVITE LINK BANNER ────────────────────────────────────────── */}
      {inviteLink && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <div className="bg-emerald-600 rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Share2 size={18} className="text-white/80 shrink-0" />
              <p className="text-sm text-white font-bold truncate max-w-sm">{inviteLink}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={actions.copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-emerald-700 text-[11px] font-black border-none cursor-pointer hover:bg-zinc-50 transition-all"
              >
                {isCopied ? <CheckCircle size={13} /> : <Copy size={13} />}
                {isCopied ? 'Copied' : 'Copy Link'}
              </button>
              <button
                onClick={actions.closeInviteLink}
                className="px-4 py-2 rounded-xl bg-black/20 text-white text-[11px] font-black border-none cursor-pointer hover:bg-black/30 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 mt-6 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: DOCUMENT VAULT (8 cols) */}
        <div className="lg:col-span-8 space-y-4">

          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-tight">Document Vault</h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">Kelola dan pantau semua dokumen tim dalam satu tempat.</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={docSearch}
                  onChange={(e) => { actions.setDocSearch(e.target.value); actions.setDocPage(1); }}
                  placeholder="Search in documents..."
                  className="pl-8 pr-4 py-2 text-[11px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-xl outline-none focus:border-emerald-500 text-zinc-700 dark:text-zinc-200 w-44 transition-all"
                />
              </div>
              {/* Sort */}
              <select
                value={docSortBy}
                onChange={(e) => { actions.setDocSortBy(e.target.value); actions.setDocPage(1); }}
                className="text-[11px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 text-zinc-600 dark:text-zinc-300 cursor-pointer"
              >
                <option value="newest">📅 Terbaru</option>
                <option value="oldest">📅 Terlama</option>
                <option value="az">🔤 A-Z</option>
                <option value="za">🔤 Z-A</option>
                <option value="status">🔖 Status</option>
                <option value="signers">👥 Banyak Signer</option>
              </select>
            </div>
          </div>

          {/* Document list */}
          {docLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-zinc-100 dark:border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc) => (
                <GroupDocumentCard
                  key={doc.id}
                  doc={doc}
                  isAdmin={isAdmin}
                  myStatus={actions.getMySignerStatus(doc)}
                  currentUserId={currentUser?.id}
                  isFinalizing={isFinalizing === doc.id}
                  isDeleting={isDeleting === doc.id}
                  onSign={() => actions.goToSign(doc.id)}
                  onPreview={() => actions.goToPreview(doc.id)}
                  onFinalize={() => actions.requestFinalize(doc)}
                  onManageSigners={() => actions.openManageSigners(doc)}
                  onDelete={() => actions.requestDelete(doc)}
                  onReject={actions.handleReject}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-white/10 rounded-2xl py-16 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mb-4">
                <FileText size={28} className="text-zinc-300 dark:text-zinc-600" />
              </div>
              <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-1">
                {docSearch ? 'Tidak ditemukan' : 'Belum ada dokumen'}
              </h3>
              <p className="text-[11px] text-zinc-400 mb-5">
                {docSearch ? `Tidak ada dokumen dengan kata kunci "${docSearch}"` : 'Mulai dengan mengunggah dokumen pertama.'}
              </p>
              {!docSearch && (
                <button
                  onClick={actions.openUploadModal}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold border-none cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  Upload Dokumen
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {docMeta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-[11px] text-zinc-400">
                {(docPage - 1) * docMeta.limit + 1} - {Math.min(docPage * docMeta.limit, docMeta.total)} dari {docMeta.total} dokumen
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => actions.setDocPage(docPage - 1)} disabled={docPage === 1} className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700 flex items-center justify-center bg-white dark:bg-zinc-900 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-[12px]">‹</button>
                {Array.from({ length: docMeta.totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => actions.setDocPage(p)} className={`w-7 h-7 rounded-lg text-[11px] font-semibold border cursor-pointer transition-all ${p === docPage ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300'}`}>{p}</button>
                ))}
                <button onClick={() => actions.setDocPage(docPage + 1)} disabled={docPage === docMeta.totalPages} className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700 flex items-center justify-center bg-white dark:bg-zinc-900 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-[12px]">›</button>
              </div>
            </div>
          )}

          {/* ── TRASH SECTION (Collapsible) ──────────────────────────── */}
          {state.trashCount > 0 && (
            <TrashSection
              trashDocs={state.trashDocs}
              trashMeta={state.trashMeta}
              trashPage={state.trashPage}
              trashLoading={state.trashLoading}
              trashCount={state.trashCount}
              onFetch={actions.fetchTrashDocuments}
              onRestore={actions.handleRestoreGroupDoc}
              onPageChange={actions.setTrashPage}
            />
          )}
        </div>

        {/* RIGHT: SIDEBAR (4 cols) */}
        <div className="lg:col-span-4 space-y-4">

          {/* Team Directory */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-50 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-emerald-500" />
                <h3 className="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-widest">Team Directory</h3>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-400 font-bold">{memberCount} members</span>
                {isAdmin && (
                  <button
                    onClick={actions.handleInvite}
                    className="ml-2 p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border-none bg-transparent cursor-pointer transition-all"
                    title="Invite member"
                  >
                    <UserPlus size={13} />
                  </button>
                )}
              </div>
            </div>
            <div className="p-3">
              <GroupMemberList
                members={groupData?.members || []}
                adminId={groupData?.adminId}
                currentUserId={currentUser?.id}
                onKick={isAdmin ? actions.requestKick : null}
                kickingId={kickingId}
              />
            </div>
          </div>

          {/* Workspace Status */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Settings size={13} className="text-zinc-400" />
              <h3 className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Workspace Status</h3>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-500/5 rounded-xl border border-emerald-100 dark:border-emerald-500/10 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-500/10 transition-all">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[12px] font-bold text-emerald-700 dark:text-emerald-400">ACTIVE HUB</span>
              </div>
              <span className="text-[10px] text-zinc-400">›</span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-2 px-1">Semua sistem berjalan dengan baik</p>
          </div>

          {/* Established */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 rounded-2xl p-5">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Established</p>
            <p className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">{createdMonth}</p>
            <p className="text-[10px] text-zinc-400 mt-1">Workspace ini telah aktif selama 1 bulan</p>
          </div>

          {/* Activity Feed */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-50 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Activity size={13} className="text-zinc-400" />
                <h3 className="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-widest">Activity Feed</h3>
              </div>
              <button className="text-[10px] font-bold text-emerald-600 bg-transparent border-none cursor-pointer hover:underline">View all</button>
            </div>
            <div className="p-4 space-y-3">
              {documents.slice(0, 3).map((doc) => {
                const name = doc.owner?.name || 'Unknown';
                const initials = name.trim().split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
                // [L-1] timeAgo dari utils/timeAgo.js. Pakai includeMinutes:false
                // di sini karena semula format `${hrs} jam lalu` (skip menit).
                return (
                  <div key={doc.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-[9px] font-black shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-zinc-700 dark:text-zinc-300 font-medium leading-snug">
                        <span className="font-bold">{name}</span> mengupload dokumen{' '}
                        <span className="font-bold text-zinc-900 dark:text-white">{doc.title}</span>
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{timeAgo(doc.createdAt, { includeMinutes: false })}</p>
                    </div>
                  </div>
                );
              })}
              {documents.length === 0 && (
                <p className="text-[11px] text-zinc-400 text-center py-2">Belum ada aktivitas</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALS ────────────────────────────────────────────────────── */}
      <UploadGroupDocModal
        isOpen={isUploadModalOpen}
        onClose={actions.closeUploadModal}
        groupId={groupId}
        members={groupData?.members || []}
        onSuccess={() => { actions.fetchGroup(true); actions.fetchDocuments({ page: 1 }); }}
      />

      <ManageSignersModal
        isOpen={!!manageSignersDoc}
        onClose={actions.closeManageSigners}
        groupId={groupId}
        doc={manageSignersDoc}
        members={groupData?.members || []}
        onSuccess={() => { actions.fetchGroup(true); actions.fetchDocuments({ silent: true }); }}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.isCompleted ? 'Hapus Dokumen Final?' : 'Hapus Dokumen'}
        message={
          deleteTarget?.isCompleted
            ? `Dokumen "${deleteTarget?.title}" sudah difinalisasi. Menghapus akan menghilangkan PDF final secara permanen.`
            : `Apakah Anda yakin ingin menghapus dokumen "${deleteTarget?.title}"?`
        }
        confirmText={deleteTarget?.isCompleted ? 'Hapus Permanen' : 'Hapus'}
        onConfirm={actions.handleDelete}
        onCancel={actions.cancelDelete}
        isLoading={!!isDeleting}
      />

      <ConfirmModal
        isOpen={!!kickTarget}
        title="Keluarkan Anggota"
        message={`Apakah Anda yakin ingin mengeluarkan "${kickTarget?.name}" dari grup ini?`}
        confirmText="Keluarkan"
        onConfirm={actions.handleKick}
        onCancel={actions.cancelKick}
        isLoading={kickingId === kickTarget?.userId}
      />

      <StatusModal
        {...statusModal}
        onClose={actions.closeStatusModal}
      />

      {/* Finalize Modal with Audit Trail Toggle */}
      {finalizeTarget && (
        <FinalizeWithAuditModal
          docTitle={finalizeTarget.title}
          onConfirm={actions.confirmFinalize}
          onCancel={actions.cancelFinalize}
          isLoading={!!isFinalizing}
        />
      )}
    </div>
  );
};

/**
 * Modal konfirmasi finalisasi dengan opsi audit trail.
 */
const FinalizeWithAuditModal = ({ docTitle, onConfirm, onCancel, isLoading }) => {
  const [auditMode, setAuditMode] = React.useState("embedded");

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md p-6 space-y-5">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Finalisasi Dokumen</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Semua penanda tangan sudah selesai. Finalisasi dokumen <strong>"{docTitle}"</strong>?
        </p>

        <AuditTrailToggle value={auditMode} onChange={setAuditMode} />

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 text-sm font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-xl border-none cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={() => onConfirm(auditMode)}
            disabled={isLoading}
            className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl border-none cursor-pointer transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            Finalisasi Sekarang
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailPage;
