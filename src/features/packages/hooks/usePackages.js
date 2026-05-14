import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPackages, deletePackage } from '../api/packageService';

const PAGE_SIZE = 5;

export const usePackages = () => {
  const navigate = useNavigate();

  // ── Data state ──────────────────────────────────────────────────────────
  const [packages, setPackages] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Filter state ─────────────────────────────────────────────────────────
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ── Modal state ──────────────────────────────────────────────────────────
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [infoPkg, setInfoPkg] = useState(null);
  const [editPkg, setEditPkg] = useState(null);
  const [deletePkg, setDeletePkg] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchPackages = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllPackages({
        page,
        limit: PAGE_SIZE,
        status: status || '',
        search: search || '',
      });
      if (response?.status === 'success') {
        const payload = response.data;
        // Backend baru: { data: [...], meta: { total, page, limit, totalPages } }
        if (payload && typeof payload === 'object' && !Array.isArray(payload) && payload.data && payload.meta) {
          setPackages(payload.data);
          setMeta(payload.meta);
        } else {
          // Fallback: backend lama masih return array langsung
          // Lakukan client-side pagination
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

  useEffect(() => {
    fetchPackages(currentPage);
  }, [status, search, currentPage]);

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
          alert('Paket ini sudah selesai dan tidak dapat ditandatangani ulang.');
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
        alert('Fitur download zip paket akan segera hadir.');
        break;
      case 'delete':
        setDeletePkg(pkg);
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
      if (deletePkg && target.id === deletePkg.id) setDeletePkg(null);
      // Refresh current page (or go back one if last item on page)
      const newPage = packages.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      setCurrentPage(newPage);
      fetchPackages(newPage);
    } catch (err) {
      alert(err.message || 'Gagal menghapus paket.');
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    packages,
    meta,
    loading,
    error,
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
      refresh: () => fetchPackages(currentPage),
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
