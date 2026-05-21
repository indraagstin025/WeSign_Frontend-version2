import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUser } from '../../../context/UserContext';
import {
  getGroupSummary,
  getGroupDocuments,
  createInvitation,
  finalizeGroupDocument,
  deleteGroupDocument,
  removeMember,
  getDeletedGroupDocuments,
  restoreGroupDocument,
} from '../api/groupService';
import { rejectDocument } from '../api/groupSignatureService';
import { useGroupSocket } from './useGroupSocket';
import { useGroupMembers } from './useGroupMembers';
import { createLogger } from '../../../utils/logger';
import { GROUPS_COPY_FEEDBACK_MS } from '../../../config/timeouts';

// [M-6] Scoped logger.
const log = createLogger('GroupDetailPage');

/**
 * @deprecated Pakai `GROUPS_COPY_FEEDBACK_MS` dari `config/timeouts.js`.
 * Alias lokal untuk backward compat.
 */
const COPY_FEEDBACK_MS = GROUPS_COPY_FEEDBACK_MS;

/**
 * @hook useGroupDetailPage
 * @description Orchestrator state untuk halaman detail grup.
 * Mengelola: fetching (group meta + paginated documents + trash list),
 * realtime socket, modal states, dan seluruh action handler.
 *
 * Page-level component menjadi pure presentation — cukup pakai `state` & `actions`
 * yang dikembalikan oleh hook ini.
 *
 * Concerns yang dikelola:
 * - Group metadata (name, members) via fetchGroup()
 * - Document pagination dengan paginationRef untuk avoid stale closure (H-2)
 * - Realtime updates via useGroupSocket dengan cbRefs pattern (H-3)
 * - Modal state: upload, manage signers, delete confirm, finalize confirm,
 *   kick member, restore document, status modal generic
 * - Invitation link copy dengan timeout feedback (GROUPS_COPY_FEEDBACK_MS)
 *
 * @returns {{
 *   state: object - All state values needed by GroupDetailPage component,
 *   actions: object - Handler functions untuk semua user interaksi
 * }}
 */
export function useGroupDetailPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useUser();

  // ── Data state ────────────────────────────────────────────────────────────
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Document pagination state ─────────────────────────────────────────────
  const [documents, setDocuments] = useState([]);
  const [docMeta, setDocMeta] = useState({ total: 0, page: 1, limit: 5, totalPages: 1 });
  const [docPage, setDocPage] = useState(1);
  const [docSearch, setDocSearch] = useState('');
  const [docSortBy, setDocSortBy] = useState('newest');
  const [docLoading, setDocLoading] = useState(false);

  // [H-2] Ref untuk menyimpan current pagination values — menghindari stale
  // closure saat fetchDocuments dipanggil dari socket handler / event yang
  // di-bind dengan deps stale.
  //
  // Sebelumnya `paginationRef.current = { page, search, sortBy }` dipanggil
  // langsung saat render — itu mutate selama render phase, melanggar React
  // rules of hooks (sebenarnya tidak fatal tapi side-effect-during-render).
  // Sekarang sync via useEffect: refs di-update SETELAH commit phase, dan
  // value tetap mengikuti state terbaru sebelum effect mana pun yang
  // bergantung ke fetchDocuments di-trigger.
  const paginationRef = useRef({ page: 1, search: '', sortBy: 'newest' });
  useEffect(() => {
    paginationRef.current = { page: docPage, search: docSearch, sortBy: docSortBy };
  }, [docPage, docSearch, docSortBy]);

  // ── Modal & action states ─────────────────────────────────────────────────
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [manageSignersDoc, setManageSignersDoc] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [isFinalizing, setIsFinalizing] = useState(null);
  const [finalizeTarget, setFinalizeTarget] = useState(null); // { id, title }
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

  // ── Fetch group (metadata + members only) ────────────────────────────────
  //
  // [FE-14] Migrate ke endpoint ringan `/groups/:id/summary` — kita tidak
  //   butuh nested `documents` di sini (documents di-fetch terpisah via
  //   `fetchDocuments` paginated). Response ~5KB vs ~50-200KB. Backend cache
  //   3 menit (Redis P3-1) → cross-user shared.
  //
  //   Catatan: `summary` belum return `members` array. Kalau page detail
  //   butuh tampilkan list members, fetch via FE-15 endpoint terpisah
  //   `/groups/:id/members?page=`. Saat ini `groupData.members` digunakan
  //   di komponen Settings/Members; selama transisi kita jaga back-compat
  //   dengan fallback ke `getGroupDetail` bila summary tidak return field
  //   yang dipakai legacy.
  const fetchGroup = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await getGroupSummary(groupId);
        if (res.status === 'success') {
          setGroupData(res.data);
        } else {
          throw new Error(res.message);
        }
      } catch (err) {
        // [M-5] Fallback string non-empty untuk kasus err.message undefined/empty
        if (!silent) setError(err.message || 'Gagal memuat detail grup. Silakan coba lagi.');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [groupId]
  );

  // ── Fetch documents with pagination ──────────────────────────────────────
  // Stable reference — tidak bergantung pada docPage/docSearch/docSortBy di dependency.
  // Selalu baca nilai terbaru dari paginationRef atau parameter eksplisit.
  const fetchDocuments = useCallback(
    async ({ page, search, sortBy, silent = false } = {}) => {
      const p = page ?? paginationRef.current.page;
      const s = search ?? paginationRef.current.search;
      const sb = sortBy ?? paginationRef.current.sortBy;

      if (!silent) setDocLoading(true);
      try {
        const res = await getGroupDocuments(groupId, { page: p, limit: 5, search: s, sortBy: sb });
        if (res.status === 'success') {
          const payload = res.data;
          if (payload?.data && payload?.meta) {
            setDocuments(payload.data);
            setDocMeta(payload.meta);
          }
        }
      } catch (err) {
        log.warn('fetchDocuments error:', err.message);
      } finally {
        if (!silent) setDocLoading(false);
      }
    },
    [groupId]
  );

  // Initial fetch group
  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  // [FE-15] Fetch members via endpoint paginated ringan. Default limit 100
  //   sudah cukup untuk semua komponen yang render full list (signer picker,
  //   member list). Search/filter dilakukan client-side di list besar; bila
  //   grup > 100 member, UI Settings akan butuh pagination control sendiri
  //   (bisa di-extend dengan local state page+limit).
  const { members: groupMembers, refresh: refreshMembers } = useGroupMembers(groupId);

  // Compose `members` array ke `groupData` supaya back-compat dengan komponen
  // yang baca `groupData.members` (GroupMemberList, UploadModal, ManageSignersModal).
  const groupDataWithMembers = useMemo(
    () => (groupData ? { ...groupData, members: groupMembers } : groupData),
    [groupData, groupMembers],
  );

  // Fetch documents ketika pagination/sort/search berubah
  useEffect(() => {
    fetchDocuments({ page: docPage, search: docSearch, sortBy: docSortBy });
  }, [groupId, docPage, docSearch, docSortBy, fetchDocuments]);

  // ── Realtime via Socket ───────────────────────────────────────────────────
  useGroupSocket({
    groupId,
    documentId: null,
    currentUserId: currentUser?.id,
    ready: !!currentUser,
    setStatusModal,
    onRefresh: (silent) => {
      fetchGroup(silent);
      // [FE-15] Member list juga perlu refresh saat ada invite accept / kick
      //   broadcast. Backend P3-1 cache 60 detik, tapi event WebSocket ini
      //   real-time → kita force refresh.
      refreshMembers();
      fetchDocuments({ silent: true });
    },
    onKicked: () => navigate('/dashboard/groups'),
  });

  // ── Derivasi ──────────────────────────────────────────────────────────────
  // [FE-14/15] Pakai `groupDataWithMembers` supaya membersihkan asumsi
  //   `groupData.members` ada. Untuk derivasi simple (adminId), `groupData`
  //   raw saja sudah cukup karena summary endpoint sudah include adminId.
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

  const handleFinalize = async (docId, title, auditTrailMode = "embedded") => {
    setIsFinalizing(docId);
    try {
      await finalizeGroupDocument(groupId, docId, auditTrailMode);
      setStatusModal({
        isOpen: true,
        type: 'success',
        title: 'Dokumen Final!',
        message: `Dokumen "${title}" telah berhasil difinalisasi.`,
      });
      fetchGroup(true);
      fetchDocuments({ silent: true });
    } catch (err) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Gagal', message: err.message });
    } finally {
      setIsFinalizing(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(deleteTarget.id);
    const deletedTitle = deleteTarget.title || 'Dokumen';
    try {
      await deleteGroupDocument(groupId, deleteTarget.id);
      setDeleteTarget(null);
      fetchGroup(true);
      fetchTrashCount();

      // [Bug fix] Refresh trash list juga supaya dokumen yang baru ke-soft-delete
      //   langsung muncul di tab "Terhapus" tanpa user harus refresh manual.
      //   Sebelumnya hanya `fetchTrashCount` (badge counter) yang ke-refresh,
      //   list `trashDocs` masih state lama → tab tampilkan data outdated.
      fetchTrashDocuments({ silent: true });

      // Jika item terakhir di halaman ini, mundur ke halaman sebelumnya.
      const isLastItemOnPage = documents.length === 1;
      const shouldGoBack = isLastItemOnPage && docPage > 1;
      if (shouldGoBack) {
        setDocPage(docPage - 1);
        // useEffect akan auto-fetch halaman baru
      } else {
        fetchDocuments({ silent: true });
      }

      // Info ke user: dokumen tidak hilang permanen.
      toast.success(
        `Dokumen "${deletedTitle}" dihapus. Bisa dipulihkan dalam 30 hari di tab Terhapus grup ini.`,
        { autoClose: 5000 }
      );
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
      // [FE-14] Summary punya counts member, jadi ikut refresh.
      // [FE-15] Refresh members list juga (anggota berkurang).
      fetchGroup(true);
      refreshMembers();
    } catch (err) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Gagal', message: err.message });
    } finally {
      setKickingId(null);
    }
  };

  const handleReject = async (documentId, reason) => {
    try {
      await rejectDocument(documentId, reason);
      setStatusModal({
        isOpen: true,
        type: 'success',
        title: 'Dokumen Ditolak',
        message: 'Anda telah menolak dokumen ini. Admin akan mendapat notifikasi.',
      });
      fetchGroup(true);
      fetchDocuments({ silent: true });
    } catch (err) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Gagal', message: err.message });
    }
  };

  // ── Navigation helpers ────────────────────────────────────────────────────
  const goBackToList = () => navigate('/dashboard/groups');
  const goToSign = (docId) =>
    navigate(`/dashboard/groups/${groupId}/documents/${docId}/sign`);
  const goToPreview = (docId) =>
    navigate(`/dashboard/groups/${groupId}/documents/${docId}/preview`);

  // ── Trash (Soft Delete) — Group Document ──────────────────────────────────
  const [trashDocs, setTrashDocs] = useState([]);
  const [trashMeta, setTrashMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [trashPage, setTrashPage] = useState(1);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashCount, setTrashCount] = useState(0);

  const fetchTrashDocuments = useCallback(async ({ page, silent = false } = {}) => {
    const p = page ?? trashPage;
    if (!silent) setTrashLoading(true);
    try {
      const res = await getDeletedGroupDocuments(groupId, { page: p, limit: 10 });
      if (res?.status === 'success') {
        const payload = res.data;
        if (payload?.data && payload?.meta) {
          setTrashDocs(payload.data);
          setTrashMeta(payload.meta);
          setTrashCount(payload.meta.total);
        } else {
          const arr = Array.isArray(payload) ? payload : [];
          setTrashDocs(arr);
          setTrashCount(arr.length);
        }
      }
    } catch { /* silent */ }
    finally { if (!silent) setTrashLoading(false); }
  }, [groupId, trashPage]);

  // Fetch trash count on mount (light)
  const fetchTrashCount = useCallback(async () => {
    try {
      const res = await getDeletedGroupDocuments(groupId, { page: 1, limit: 1 });
      if (res?.status === 'success') {
        const m = res.data?.meta || res.meta;
        setTrashCount(m?.total || 0);
      }
    } catch { /* silent */ }
  }, [groupId]);

  useEffect(() => { fetchTrashCount(); }, [fetchTrashCount]);

  const handleRestoreGroupDoc = async (doc) => {
    try {
      await restoreGroupDocument(groupId, doc.id);
      toast.success(`Dokumen "${doc.title || 'Tanpa Judul'}" berhasil dipulihkan.`);
      fetchTrashDocuments({ silent: true });
      fetchTrashCount();
      fetchDocuments({ silent: true });
      fetchGroup(true);
    } catch (err) {
      toast.error(err.message || 'Gagal me-restore dokumen.');
    }
  };

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
  const requestFinalize = (doc) => setFinalizeTarget({ id: doc.id, title: doc.title });
  const cancelFinalize = () => setFinalizeTarget(null);
  const confirmFinalize = (auditTrailMode) => {
    if (!finalizeTarget) return;
    handleFinalize(finalizeTarget.id, finalizeTarget.title, auditTrailMode);
    setFinalizeTarget(null);
  };
  const requestKick = (userId, name) => setKickTarget({ userId, name });
  const cancelKick = () => setKickTarget(null);
  const closeStatusModal = () =>
    setStatusModal((prev) => ({ ...prev, isOpen: false }));

  return {
    state: {
      groupId,
      currentUser,
      groupData: groupDataWithMembers,
      loading,
      error,
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
      // Trash
      trashDocs,
      trashMeta,
      trashPage,
      trashLoading,
      trashCount,
    },
    actions: {
      fetchGroup,
      fetchDocuments,
      getMySignerStatus,
      handleInvite,
      copyToClipboard,
      closeInviteLink,
      handleFinalize,
      handleDelete,
      handleKick,
      handleReject,
      goBackToList,
      goToSign,
      goToPreview,
      openUploadModal,
      closeUploadModal,
      openManageSigners,
      closeManageSigners,
      requestDelete,
      setDocPage,
      setDocSearch,
      setDocSortBy,
      cancelDelete,
      requestFinalize,
      cancelFinalize,
      confirmFinalize,
      requestKick,
      cancelKick,
      closeStatusModal,
      // Trash
      fetchTrashDocuments,
      setTrashPage,
      handleRestoreGroupDoc,
    },
  };
}
