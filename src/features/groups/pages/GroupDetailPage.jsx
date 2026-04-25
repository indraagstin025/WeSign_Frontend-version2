import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users, FileText, FilePlus, Share2, RefreshCw,
  Loader2, AlertCircle, Crown, Copy, CheckCircle,
  LayoutDashboard, ArrowLeft, MoreVertical,
  UserPlus, UserMinus, Shield
} from 'lucide-react';
import { useUser } from '../../../context/UserContext';
import {
  getGroupDetail,
  createInvitation,
  finalizeGroupDocument,
  deleteGroupDocument,
  removeMember,
} from '../api/groupService';
import GroupDocumentCard from '../components/GroupDocumentCard';
import GroupMemberList from '../components/GroupMemberList';
import UploadGroupDocModal from '../components/UploadGroupDocModal';
import ManageSignersModal from '../components/ManageSignersModal';
import StatusModal from '../../../components/UI/StatusModal';
import ConfirmModal from '../../../components/UI/ConfirmModal';
import { useGroupSocket } from '../hooks/useGroupSocket';

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useUser();

  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [manageSignersDoc, setManageSignersDoc] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [isFinalizing, setIsFinalizing] = useState(null);
  const [inviteLink, setInviteLink] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [kickTarget, setKickTarget] = useState(null);
  const [kickingId, setKickingId] = useState(null);
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  const fetchGroup = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getGroupDetail(groupId);
      if (res.status === 'success') setGroupData(res.data);
      else throw new Error(res.message);
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  // ── Realtime via Socket ──────────────────────────────────────────────────
  useGroupSocket({
    groupId,
    documentId: null,
    currentUserId: currentUser?.id,
    ready: !!currentUser,
    setStatusModal,
    onRefresh: fetchGroup,
    onKicked: () => navigate('/dashboard/groups'), // [RESTORED] Redirect on kick
  });

  const isAdmin = groupData?.adminId != null && currentUser?.id != null &&
    String(groupData.adminId) === String(currentUser.id);

  const getMySignerStatus = (doc) => {
    if (!doc.signerRequests || !currentUser?.id) return null;
    const found = doc.signerRequests.find((sr) => String(sr.userId) === String(currentUser.id));
    return found?.status ? found.status.toUpperCase() : null;
  };

  const handleInvite = async () => {
    try {
      const res = await createInvitation(groupId);
      if (res.status === 'success') {
        const link = `${window.location.origin}/groups/join?token=${res.data.token}`;
        setInviteLink(link);
      }
    } catch (err) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Gagal', message: err.message });
    }
  };

  const copyToClipboard = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFinalize = async (docId, title) => {
    setIsFinalizing(docId);
    try {
      await finalizeGroupDocument(groupId, docId);
      setStatusModal({
        isOpen: true, type: 'success',
        title: 'Dokumen Final!',
        message: `Dokumen "${title}" telah berhasil difinalisasi.`,
      });
      fetchGroup(true);
    } catch (err) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Gagal', message: err.message });
    } finally {
      setIsFinalizing(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(deleteTarget.id);
    try {
      await deleteGroupDocument(groupId, deleteTarget.id);
      setDeleteTarget(null);
      fetchGroup(true);
    } catch (err) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Gagal', message: err.message });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleKick = async () => {
    if (!kickTarget) return;
    setKickingId(kickTarget.userId);
    try {
      await removeMember(groupId, kickTarget.userId);
      setKickTarget(null);
      fetchGroup(true);
    } catch (err) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Gagal', message: err.message });
    } finally {
      setKickingId(null);
    }
  };

  if (loading && !groupData) return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <Loader2 size={32} className="animate-spin text-emerald-500/50" />
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-transparent">
      <div className="max-w-7xl mx-auto p-6 sm:p-10 space-y-10">
        
        {/* TOP NAVIGATION & HEADER */}
        <div className="flex flex-col gap-6">
          <button 
            onClick={() => navigate('/dashboard/groups')}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-emerald-500 transition-colors border-none bg-transparent cursor-pointer w-fit"
          >
            <ArrowLeft size={14} /> Kembali ke Dashboard
          </button>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <Users size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight leading-none uppercase">
                    {groupData?.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="flex items-center gap-1 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      <Shield size={10} /> Ruang Kerja Kolaboratif
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  onClick={handleInvite}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 text-zinc-700 dark:text-zinc-300 text-xs font-black uppercase tracking-widest hover:border-emerald-500 transition-all cursor-pointer"
                >
                  <Share2 size={15} /> Undang
                </button>
              )}
              <button
                onClick={() => fetchGroup()}
                className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 text-zinc-400 hover:text-emerald-500 transition-all cursor-pointer"
              >
                <RefreshCw size={18} />
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-zinc-900 dark:bg-emerald-600 hover:bg-zinc-800 dark:hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest border-none cursor-pointer shadow-xl shadow-zinc-900/10 dark:shadow-emerald-500/20"
              >
                <FilePlus size={16} /> Tambah Dokumen
              </button>
            </div>
          </div>
        </div>

        {/* INVITE LINK BOX */}
        {inviteLink && (
          <div className="bg-emerald-600/5 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Share2 size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Link Undangan Tersedia</p>
                <p className="text-xs text-emerald-600/70 font-medium truncate max-w-[200px] sm:max-w-md">{inviteLink}</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={copyToClipboard}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest border-none cursor-pointer"
              >
                {isCopied ? <CheckCircle size={14} /> : <Copy size={14} />}
                {isCopied ? 'Tersalin' : 'Salin Link'}
              </button>
              <button 
                onClick={() => setInviteLink(null)}
                className="px-4 py-2.5 rounded-xl bg-transparent text-emerald-600 hover:bg-emerald-600/10 text-[10px] font-black uppercase tracking-widest border-none cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {/* MAIN LAYOUT: 2 COLUMNS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: DOCUMENTS (8 COLS) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-zinc-400" />
                <h2 className="text-lg font-black text-zinc-800 dark:text-white uppercase tracking-wider">Arsip Dokumen</h2>
              </div>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-100 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                {groupData?.documents?.length || 0} File
              </span>
            </div>

            {groupData?.documents?.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {groupData.documents.map((doc) => (
                  <GroupDocumentCard
                    key={doc.id}
                    doc={doc}
                    isAdmin={isAdmin}
                    myStatus={getMySignerStatus(doc)}
                    isFinalizing={isFinalizing === doc.id}
                    isDeleting={isDeleting === doc.id}
                    onSign={() => navigate(`/dashboard/groups/${groupId}/documents/${doc.id}/sign`)}
                    onPreview={() => navigate(`/dashboard/groups/${groupId}/documents/${doc.id}/preview`)}
                    onFinalize={() => handleFinalize(doc.id, doc.title)}
                    onManageSigners={() => setManageSignersDoc(doc)}
                    onDelete={() => setDeleteTarget({ id: doc.id, title: doc.title })}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-white/5 rounded-3xl py-16 flex flex-col items-center text-center">
                <FileText size={48} className="text-zinc-200 dark:text-zinc-800 mb-4" />
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Belum Ada Dokumen</p>
                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="mt-6 text-xs font-black text-emerald-500 hover:underline bg-transparent border-none cursor-pointer"
                >
                  Upload Dokumen Pertama
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: MEMBERS (4 COLS) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-[2rem] overflow-hidden">
              <div className="p-6 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-zinc-400" />
                  <h3 className="text-[11px] font-black text-zinc-800 dark:text-white uppercase tracking-widest">Anggota Tim</h3>
                </div>
                {isAdmin && (
                  <button 
                    onClick={handleInvite}
                    className="p-1.5 rounded-lg hover:bg-emerald-50 text-zinc-400 hover:text-emerald-600 transition-colors border-none bg-transparent cursor-pointer"
                    title="Tambah Anggota"
                  >
                    <UserPlus size={16} />
                  </button>
                )}
              </div>
              <div className="p-2">
                <GroupMemberList
                  members={groupData?.members || []}
                  adminId={groupData?.adminId}
                  currentUserId={currentUser?.id}
                  onKick={isAdmin ? (userId, name) => setKickTarget({ userId, name }) : null}
                  kickingId={kickingId}
                />
              </div>
            </div>
            
            {/* Quick Stats Panel */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-white/5 text-center">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-xs font-bold text-emerald-500 uppercase tracking-tighter">Aktif</p>
               </div>
               <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-white/5 text-center">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Dibuat</p>
                  <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-tighter">
                    {groupData?.createdAt ? new Date(groupData.createdAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : '-'}
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <UploadGroupDocModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        groupId={groupId}
        onSuccess={() => fetchGroup(true)}
      />

      {manageSignersDoc && (
        <ManageSignersModal
          isOpen={!!manageSignersDoc}
          onClose={() => setManageSignersDoc(null)}
          groupId={groupId}
          documentId={manageSignersDoc.id}
          docTitle={manageSignersDoc.title}
          members={groupData?.members || []}
          initialSigners={manageSignersDoc.signerRequests || []}
          onSuccess={() => fetchGroup(true)}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Hapus Dokumen"
        message={`Apakah Anda yakin ingin menghapus dokumen "${deleteTarget?.title}"? Aksi ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={!!isDeleting}
      />

      <ConfirmModal
        isOpen={!!kickTarget}
        title="Keluarkan Anggota"
        message={`Apakah Anda yakin ingin mengeluarkan "${kickTarget?.name}" dari grup ini?`}
        confirmText="Keluarkan"
        onConfirm={handleKick}
        onCancel={() => setKickTarget(null)}
        isLoading={kickingId === kickTarget?.userId}
      />

      <StatusModal
        {...statusModal}
        onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default GroupDetailPage;
