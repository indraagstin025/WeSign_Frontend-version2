import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../context/UserContext';
import { getAllGroups, createGroup } from '../api/groupService';
import { socketService } from '../../../services/socketService';
import { GROUP_NAME_MAX, validateGroupName } from '../utils/groupValidation';

const CARD_THEMES = [
  { banner: 'from-indigo-600 via-indigo-500 to-blue-600',     tint: 'from-indigo-100 dark:from-indigo-600/40' },
  { banner: 'from-emerald-600 via-emerald-500 to-teal-600',   tint: 'from-emerald-100 dark:from-emerald-600/40' },
  { banner: 'from-fuchsia-600 via-fuchsia-500 to-purple-600', tint: 'from-fuchsia-100 dark:from-fuchsia-600/40' },
  { banner: 'from-amber-600 via-amber-500 to-orange-600',     tint: 'from-amber-100 dark:from-amber-600/40' },
  { banner: 'from-rose-600 via-rose-500 to-pink-600',         tint: 'from-rose-100 dark:from-rose-600/40' },
];

/**
 * @hook useGroupsPage
 * @description State + actions untuk halaman daftar grup.
 * Mengelola: fetch, realtime socket subscription, create form, dan navigasi.
 */
export function useGroupsPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useUser();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  const fetchGroups = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await getAllGroups();
      if (res.status === 'success') {
        setGroups(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat daftar grup.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // ── Realtime socket subscription ──────────────────────────────────────────
  useEffect(() => {
    if (!currentUser || groups.length === 0) return;
    socketService.connect();
    const joinedGroupIds = groups.map((g) => g.id);
    joinedGroupIds.forEach((gId) => socketService.joinGroupRoom(gId));

    const silentRefresh = () => fetchGroups(true);
    socketService.on('group_member_update', silentRefresh);
    socketService.on('group_document_update', silentRefresh);
    socketService.on('group_info_update', silentRefresh);

    return () => {
      joinedGroupIds.forEach((gId) => socketService.leaveGroupRoom(gId));
      socketService.off('group_member_update', silentRefresh);
      socketService.off('group_document_update', silentRefresh);
      socketService.off('group_info_update', silentRefresh);
    };
  }, [currentUser, groups.length, fetchGroups]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleCreateGroup = async (e) => {
    e?.preventDefault();
    const name = newGroupName.trim();

    // [VALIDATION] Cocokkan dengan backend (`groupController.createGroup`).
    const validationError = validateGroupName(name);
    if (validationError) {
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Validasi Gagal',
        message: validationError,
      });
      return;
    }

    setIsCreating(true);
    try {
      const res = await createGroup(name);
      if (res.status === 'success') {
        setNewGroupName('');
        setShowCreateForm(false);
        fetchGroups();
        setStatusModal({
          isOpen: true,
          type: 'success',
          title: 'Grup Berhasil Dibuat',
          message: `Grup "${name}" siap digunakan.`,
        });
      }
    } catch (err) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Gagal', message: err.message });
    } finally {
      setIsCreating(false);
    }
  };

  const openCreateForm = () => setShowCreateForm(true);
  const cancelCreateForm = () => {
    setShowCreateForm(false);
    setNewGroupName('');
  };
  const goToGroup = (id) => navigate(`/dashboard/groups/${id}`);
  const closeStatusModal = () =>
    setStatusModal((prev) => ({ ...prev, isOpen: false }));

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getCardTheme = (idx) => CARD_THEMES[idx % CARD_THEMES.length];
  const isAdminOf = (group) => String(group.adminId) === String(currentUser?.id);

  return {
    state: {
      currentUser,
      groups,
      loading,
      error,
      isCreating,
      newGroupName,
      showCreateForm,
      statusModal,
      nameMaxLength: GROUP_NAME_MAX,
    },
    actions: {
      fetchGroups,
      setNewGroupName,
      handleCreateGroup,
      openCreateForm,
      cancelCreateForm,
      goToGroup,
      closeStatusModal,
      getCardTheme,
      isAdminOf,
    },
  };
}
