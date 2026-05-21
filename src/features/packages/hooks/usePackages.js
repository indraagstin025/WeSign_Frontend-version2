import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  getAllPackages,
  deletePackage,
  getMyTrashPackages,
  restoreMyPackage,
} from '../api/packageService';
import { SEARCH_DEBOUNCE_MS } from '../constants/layout';

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
  const [search, setSearch] = useState('');           // input value (immediate)
  const [debouncedSearch, setDebouncedSearch] = useState(''); // dipakai untuk fetch
  const [currentPage, setCurrentPage] = useState(1);

  // [M-2] Debounce search 400ms supaya tidak fire fetch tiap keystroke.
  // User type 'invoice' (7 karakter) sebelumnya = 7 fetch berturut-turut
  // -> ke backend + ke status counts (3x lagi per fetch). Sekarang cuma
  // 1 fetch setelah user berhenti ketik 400ms.
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // reset page saat search berubah
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [search]);

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
          search: debouncedSearch || '',
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
  }, [status, debouncedSearch]);

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

  // ── Optimistic Counters ──────────────────────────────────────────────────
  /**
   * [FE-2] Update statusCounts secara lokal tanpa hit endpoint counts ulang.
   *
   * Sebelumnya setiap delete/restore = 3× round-trip ke `/packages?status=`
   * untuk recount. Sekarang langsung adjust counter berdasarkan paket yang
   * di-affect — saving 3 request per action.
   *
   * Fungsi ini idempotent secara tipe (cek apakah status valid) tapi tetap
   * apply increment/decrement bahkan kalau nilai jadi negatif (defensive 0).
   *
   * @param {string} pkgStatus - status paket yang affected ('draft' | 'completed' | dll)
   * @param {number} delta - +1 untuk add, -1 untuk remove
   */
  const adjustStatusCounts = useCallback((pkgStatus, delta) => {
    const key = pkgStatus?.toLowerCase();
    setStatusCounts((prev) => ({
      all: Math.max(0, (prev.all || 0) + delta),
      draft: key === 'draft' ? Math.max(0, (prev.draft || 0) + delta) : (prev.draft || 0),
      completed: key === 'completed' ? Math.max(0, (prev.completed || 0) + delta) : (prev.completed || 0),
    }));
  }, []);

  /**
   * [FE-2] Adjust trashCount lokal.
   */
  const adjustTrashCount = useCallback((delta) => {
    setTrashCount((prev) => Math.max(0, (prev || 0) + delta));
  }, []);

  useEffect(() => {
    fetchPackages(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, debouncedSearch, currentPage]);

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
    // [M-2] Tidak reset page di sini — debounce effect yang akan reset
    // setelah user berhenti ketik. Kalau di-reset di sini, list akan
    // flicker dan loading state aneh.
    setSearch(val);
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

          // [FE-2] Optimistic update — paket pindah dari trash ke list aktif.
          //   Sebelumnya 3× round-trip (fetchPackages + fetchTrashCount + fetchStatusCounts).
          //   Sekarang: re-fetch list page saat ini (wajib karena urutan berubah)
          //   tapi counter trash + status counts adjust lokal tanpa request.
          adjustTrashCount(-1);
          adjustStatusCounts(pkg.status, +1);
          fetchPackages(currentPage);
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
      const deletedStatus = target.status;
      if (deletePkg && target.id === deletePkg.id) setDeletePkg(null);

      // [FE-2] Optimistic update — paket pindah ke trash.
      //   Sebelumnya 3× round-trip setelah delete (fetchPackages +
      //   fetchTrashCount + fetchStatusCounts). Sekarang adjust counter
      //   lokal dan hanya re-fetch list page yang sedang dilihat (wajib
      //   supaya item yang ke-delete hilang dari render).
      adjustStatusCounts(deletedStatus, -1);
      adjustTrashCount(+1);

      // Refresh current page (or go back one if last item on page)
      const newPage = packages.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      setCurrentPage(newPage);
      fetchPackages(newPage);

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
