import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  getAllPackages,
  deletePackage,
  getMyTrashPackages,
  restoreMyPackage,
} from '../api/packageService';

const PAGE_SIZE = 5;

export const usePackages = () => {
  const navigate = useNavigate();

  // ── Data state ──────────────────────────────────────────────────────────
  const [packages, setPackages] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trashCount, setTrashCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState({ all: 0, draft: 0, completed: 0 });

  // ── Filter state ─────────────────────────────────────────────────────────
  // status: '', 'draft', 'completed', 'trash'
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ── Modal state ──────────────────────────────────────────────────────────
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [infoPkg, setInfoPkg] = useState(null);
  const [editPkg, setEditPkg] = useState(null);
  const [deletePkg, setDeletePkg] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isTrashMode = status === 'trash';

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchPackages = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (status === 'trash') {
        response = await getMyTrashPackages({ page, limit: PAGE_SIZE });
      } else {
        response = await getAllPackages({
          page,
          limit: PAGE_SIZE,
          status: status || '',
          search: search || '',
        });
      }

      if (response?.status === 'success') {
        const payload = response.data;
        // Backend: { data: [...], meta: { total, page, limit, totalPages } }
        if (payload && typeof payload === 'object' && !Array.isArray(payload) && payload.data && payload.meta) {
          setPackages(payload.data);
          setMeta(payload.meta);
        } else {
          // Fallback (legacy): payload = array
          const arr = Array.isArray(payload) ? payload : [];
          const start = (page - 1) * PAGE_SIZE;
          const sliced = arr.slice(start, start + PAGE_SIZE);
          setPackages(sliced);
          setMeta({
            total: arr.length,
            page,
            limit: PAGE_SIZE,
            totalPages: Math.ceil(arr.length / PAGE_SIZE),
          });
        }
      }
    } catch (err) {
      setError(err.message || 'Gagal mengambil daftar paket. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  // Fetch trash count secara terpisah (untuk badge di tab "Terhapus")
  const fetchTrashCount = useCallback(async () => {
    try {
      const res = await getMyTrashPackages({ page: 1, limit: 1 });
      if (res?.status === 'success') {
        const m = res.data?.meta || res.meta;
        setTrashCount(m?.total || 0);
      }
    } catch { /* silent */ }
  }, []);

  // Fetch count per status (Semua / Draft / Selesai) — independen dari view aktif.
  // Pakai limit=1 supaya light, hanya butuh meta.total.
  const fetchStatusCounts = useCallback(async () => {
    try {
      const [all, draft, completed] = await Promise.all([
        getAllPackages({ page: 1, limit: 1 }),
        getAllPackages({ page: 1, limit: 1, status: 'draft' }),
        getAllPackages({ page: 1, limit: 1, status: 'completed' }),
      ]);
      setStatusCounts({
        all: all?.data?.meta?.total ?? all?.meta?.total ?? 0,
        draft: draft?.data?.meta?.total ?? draft?.meta?.total ?? 0,
        completed: completed?.data?.meta?.total ?? completed?.meta?.total ?? 0,
      });
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchPackages(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search, currentPage]);

  useEffect(() => {
    fetchTrashCount();
    fetchStatusCounts();
  }, [fetchTrashCount, fetchStatusCounts]);

  // Reset to page 1 when filters change
  const handleSetStatus = (val) => {
    setStatus(val);
    setCurrentPage(1);
  };

  const handleSetSearch = (val) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= meta.totalPages) {
      setCurrentPage(page);
    }
  };

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleAction = async (type, pkg) => {
    switch (type) {
      case 'edit':
        setEditPkg(pkg);
        break;
      case 'sign':
        if (pkg.status?.toLowerCase() === 'completed') {
          toast.warning('Paket ini sudah selesai dan tidak dapat ditandatangani ulang.');
          return;
        }
        navigate(`/dashboard/packages/sign/${pkg.id}`);
        break;
      case 'info':
        setInfoPkg(pkg);
        break;
      case 'preview':
        navigate(`/dashboard/packages/preview/${pkg.id}`);
        break;
      case 'download':
        toast.info('Fitur download zip paket akan segera hadir.');
        break;
      case 'delete':
        setDeletePkg(pkg);
        break;
      case 'restore':
        try {
          await restoreMyPackage(pkg.id);
          toast.success(`Paket "${pkg.title || 'Tanpa Judul'}" berhasil di-restore.`);
          fetchPackages(currentPage);
          fetchTrashCount();
          fetchStatusCounts();
        } catch (err) {
          toast.error(err.message || 'Gagal me-restore paket.');
        }
        break;
      default:
        break;
    }
  };

  const handleConfirmDelete = async (pkgToDelete = null) => {
    const target = pkgToDelete || deletePkg;
    if (!target) return;
    setIsDeleting(true);
    try {
      await deletePackage(target.id);
      const deletedTitle = target.title || 'Tanpa Judul';
      if (deletePkg && target.id === deletePkg.id) setDeletePkg(null);

      // Refresh current page (or go back one if last item on page)
      const newPage = packages.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      setCurrentPage(newPage);
      fetchPackages(newPage);
      fetchTrashCount();
      fetchStatusCounts();

      toast.success(
        `Paket "${deletedTitle}" dipindahkan ke Terhapus. Bisa di-restore dalam 30 hari.`,
        { autoClose: 4000 }
      );
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus paket.');
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    packages,
    meta,
    loading,
    error,
    trashCount,
    statusCounts,
    isTrashMode,
    filters: {
      status,
      setStatus: handleSetStatus,
      search,
      setSearch: handleSetSearch,
    },
    pagination: {
      currentPage,
      totalPages: meta.totalPages,
      total: meta.total,
      pageSize: PAGE_SIZE,
      goToPage,
      showPagination: meta.total > PAGE_SIZE,
    },
    actions: {
      refresh: () => {
        fetchPackages(currentPage);
        fetchTrashCount();
        fetchStatusCounts();
      },
      handleAction,
      handleConfirmDelete,
      setStatus: handleSetStatus,
    },
    modals: {
      upload: { isOpen: isUploadModalOpen, setOpen: setIsUploadModalOpen },
      info: { data: infoPkg, setOpen: (val) => !val && setInfoPkg(null) },
      edit: { data: editPkg, setOpen: (val) => !val && setEditPkg(null) },
      delete: { data: deletePkg, setOpen: (val) => !val && setDeletePkg(null), isDeleting },
    },
  };
};
