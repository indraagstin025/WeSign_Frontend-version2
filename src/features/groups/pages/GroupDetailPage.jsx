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
import StatusModal from '../../../components/ui/StatusModal';
import ConfirmModal from '../../../components/ui/ConfirmModal';
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
    <div className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-transparent no-scrollbar">
      {/* WORKSPACE BANNER - DISCORD STYLE */}
      <div className="relative h-64 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-emerald-600 to-fuchsia-600 animate-gradient-x" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        
        {/* LARGE FLOATING BACK BUTTON */}
        <div className="absolute top-8 left-8 z-30">
          <button 
            onClick={() => navigate('/dashboard/groups')}
            className="w-14 h-14 rounded-full bg-black/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-emerald-600 transition-all duration-500 cursor-pointer group shadow-2xl"
            title="Back to Communities"
          >
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="max-w-7xl mx-auto h-full px-6 sm:px-10 flex flex-col justify-end pb-12 relative z-10">
          {/* Content space reserved for padding/balance */}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 -mt-20 relative z-20 space-y-12 pb-20">
        
        {/* WORKSPACE HEADER CARD */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-2xl border border-zinc-100 dark:border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 shrink-0 aspect-square rounded-full bg-white dark:bg-zinc-800 p-2 shadow-2xl -mt-20 lg:-mt-24 border-4 border-zinc-50 dark:border-zinc-900 transition-transform hover:scale-105 duration-500">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-4xl font-black shadow-inner uppercase">
                {groupData?.name?.charAt(0)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-[0.3em]">
                <Shield size={14} /> Official Workspace
              </div>
              <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase leading-none">
                {groupData?.name}
              </h1>
              <p className="text-zinc-500 dark:text-zinc-100 text-sm font-bold opacity-70">
                Kolaborasi tim yang aman, efisien, dan terorganisir.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchGroup()}
              className="p-3 rounded-full bg-zinc-50 dark:bg-white/5 text-zinc-400 hover:text-emerald-500 transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw size={18} />
            </button>
            {isAdmin && (
              <button
                onClick={handleInvite}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-[10px] font-black uppercase tracking-widest hover:border-emerald-500 transition-all cursor-pointer shadow-md"
              >
                <UserPlus size={16} /> Invite
              </button>
            )}
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-7 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest border-none cursor-pointer shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
            >
              <FilePlus size={16} /> New Document
            </button>
          </div>
        </div>

        {/* INVITE LINK BOX */}
        {inviteLink && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-[2rem] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 shadow-xl shadow-emerald-500/10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                <Share2 size={24} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em]">Share Invitation Link</p>
                <p className="text-sm text-white font-bold truncate max-w-[200px] sm:max-w-md">{inviteLink}</p>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={copyToClipboard}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white text-emerald-600 text-[11px] font-black uppercase tracking-widest border-none cursor-pointer hover:bg-zinc-50 transition-all"
              >
                {isCopied ? <CheckCircle size={16} /> : <Copy size={16} />}
                {isCopied ? 'Copied' : 'Copy Link'}
              </button>
              <button 
                onClick={() => setInviteLink(null)}
                className="px-6 py-4 rounded-full bg-black/20 text-white hover:bg-black/30 text-[11px] font-black uppercase tracking-widest border-none cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* MAIN LAYOUT: 2 COLUMNS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT: DOCUMENTS (8 COLS) */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-emerald-500 rounded-full" />
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Document Vault</h2>
              </div>
              <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-100 uppercase tracking-widest bg-zinc-100 dark:bg-white/5 px-4 py-2 rounded-full border border-zinc-200 dark:border-white/10">
                {groupData?.documents?.length || 0} Files Total
              </span>
            </div>

            {groupData?.documents?.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
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
              <div className="bg-white dark:bg-zinc-900/50 border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-[2.5rem] py-24 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-zinc-50 dark:bg-white/5 flex items-center justify-center mb-6">
                  <FileText size={48} className="text-zinc-300 dark:text-zinc-700" />
                </div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-2">No Documents Yet</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-100 font-bold opacity-60 mb-8">Start by uploading a document for your team to sign.</p>
                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-8 py-4 rounded-full bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest border-none cursor-pointer shadow-xl shadow-emerald-500/20"
                >
                  Upload First Document
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: MEMBERS (4 COLS) */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-zinc-50 dark:border-white/5 bg-zinc-50/50 dark:bg-white/2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users size={20} className="text-emerald-500" />
                  <h3 className="text-[12px] font-black text-zinc-900 dark:text-white uppercase tracking-widest">Team Directory</h3>
                </div>
                {isAdmin && (
                  <button 
                    onClick={handleInvite}
                    className="p-2.5 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-500/10 text-zinc-400 hover:text-emerald-600 transition-all border-none bg-transparent cursor-pointer"
                  >
                    <UserPlus size={18} />
                  </button>
                )}
              </div>
              <div className="p-4">
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
            <div className="grid grid-cols-1 gap-4">
               <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 blur-3xl rounded-full" />
                  <p className="text-[11px] font-black text-white/60 uppercase tracking-[0.2em] mb-4">Workspace Status</p>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-2xl font-black uppercase tracking-tighter">Active Hub</p>
                  </div>
               </div>
               <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-white/5 shadow-xl">
                  <p className="text-[11px] font-black text-zinc-400 dark:text-zinc-100 opacity-60 uppercase tracking-[0.2em] mb-4">Established</p>
                  <p className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">
                    {groupData?.createdAt ? new Date(groupData.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '-'}
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

      <ManageSignersModal
        isOpen={!!manageSignersDoc}
        onClose={() => setManageSignersDoc(null)}
        groupId={groupId}
        doc={manageSignersDoc}
        members={groupData?.members || []}
        onSuccess={() => fetchGroup(true)}
      />

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
