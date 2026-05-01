import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../../../context/UserContext';
import {
  getGroupDetail,
  createInvitation,
  finalizeGroupDocument,
  deleteGroupDocument,
  removeMember,
} from '../api/groupService';
import { useGroupSocket } from './useGroupSocket';

const COPY_FEEDBACK_MS = 2000;

/**
 * @hook useGroupDetailPage
 * @description Orchestrator state untuk halaman detail grup.
 * Mengelola: fetching, realtime socket, modal states, dan seluruh action handler.
 *
 * Page-level component menjadi pure presentation — cukup pakai `state` & `actions`
 * yang dikembalikan oleh hook ini.
 */
export function useGroupDetailPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useUser();

  // ── Data state ────────────────────────────────────────────────────────────
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Modal & action states ─────────────────────────────────────────────────
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [manageSignersDoc, setManageSignersDoc] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [isFinalizing, setIsFinalizing] = useState(null);
  const [inviteLink, setInviteLink] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [kickTarget, setKickTarget] = useState(null);
  const [kickingId, setKickingId] = useState(null);
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  // ── Fetch group ───────────────────────────────────────────────────────────
  const fetchGroup = useCallback(
    async (silent = false) => {
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
    },
    [groupId]
  );

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  // ── Realtime via Socket ───────────────────────────────────────────────────
  useGroupSocket({
    groupId,
    documentId: null,
    currentUserId: currentUser?.id,
    ready: !!currentUser,
    setStatusModal,
    onRefresh: fetchGroup,
    onKicked: () => navigate('/dashboard/groups'),
  });

  // ── Derivasi ──────────────────────────────────────────────────────────────
  const isAdmin = useMemo(
    () =>
      groupData?.adminId != null &&
      currentUser?.id != null &&
      String(groupData.adminId) === String(currentUser.id),
    [groupData?.adminId, currentUser?.id]
  );

  const getMySignerStatus = useCallback(
    (doc) => {
      if (!doc?.signerRequests || !currentUser?.id) return null;
      const found = doc.signerRequests.find(
        (sr) => String(sr.userId) === String(currentUser.id)
      );
      return found?.status ? found.status.toUpperCase() : null;
    },
    [currentUser?.id]
  );

  // ── Actions ───────────────────────────────────────────────────────────────
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
    setTimeout(() => setIsCopied(false), COPY_FEEDBACK_MS);
  };

  const closeInviteLink = () => setInviteLink(null);

  const handleFinalize = async (docId, title) => {
    setIsFinalizing(docId);
    try {
      await finalizeGroupDocument(groupId, docId);
      setStatusModal({
        isOpen: true,
        type: 'success',
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

  // ── Navigation helpers ────────────────────────────────────────────────────
  const goBackToList = () => navigate('/dashboard/groups');
  const goToSign = (docId) =>
    navigate(`/dashboard/groups/${groupId}/documents/${docId}/sign`);
  const goToPreview = (docId) =>
    navigate(`/dashboard/groups/${groupId}/documents/${docId}/preview`);

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);
  const openManageSigners = (doc) => setManageSignersDoc(doc);
  const closeManageSigners = () => setManageSignersDoc(null);
  const requestDelete = (doc) =>
    setDeleteTarget({
      id: doc.id,
      title: doc.title,
      isCompleted: doc.status?.toUpperCase() === 'COMPLETED',
    });
  const cancelDelete = () => setDeleteTarget(null);
  const requestKick = (userId, name) => setKickTarget({ userId, name });
  const cancelKick = () => setKickTarget(null);
  const closeStatusModal = () =>
    setStatusModal((prev) => ({ ...prev, isOpen: false }));

  return {
    state: {
      groupId,
      currentUser,
      groupData,
      loading,
      error,
      isAdmin,
      isUploadModalOpen,
      manageSignersDoc,
      deleteTarget,
      isDeleting,
      isFinalizing,
      inviteLink,
      isCopied,
      kickTarget,
      kickingId,
      statusModal,
    },
    actions: {
      fetchGroup,
      getMySignerStatus,
      handleInvite,
      copyToClipboard,
      closeInviteLink,
      handleFinalize,
      handleDelete,
      handleKick,
      goBackToList,
      goToSign,
      goToPreview,
      openUploadModal,
      closeUploadModal,
      openManageSigners,
      closeManageSigners,
      requestDelete,
      cancelDelete,
      requestKick,
      cancelKick,
      closeStatusModal,
    },
  };
}
