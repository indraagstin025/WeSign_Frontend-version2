import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  getUserDocuments, 
  getDocumentFile, 
  getDocumentDetail, 
  deleteDocument,
  updateDocument,
  getMyTrashDocuments,
  restoreMyDocument,
} from '../api/docService';

/**
 * @hook useDocuments
 * @description Custom hook untuk mengelola seluruh logika bisnis Brankas Dokumen.
 * Memisahkan state, fetch API, dan event handler dari komponen UI.
 */
export const useDocuments = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- STATE DATA ---
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [trashCount, setTrashCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState({ all: 0, draft: 0, pending: 0, completed: 0 });
  
  // --- STATE FILTER ─────────────────────────────────────────────────────
  // [H-4] Status sync 2-way dengan URL `?status=`:
  //
  // Sebelumnya: `useState(() => searchParams.get('status'))` lazy init —
  // hanya sync URL → state SEKALI saat mount. Setelah itu state-only,
  // perubahan URL eksternal (mis. user click link, browser back/forward,
  // toast deeplink) tidak ter-react ke state.
  //
  // Fix: useState dengan default kosong, lalu useEffect read URL → state
  // setiap kali searchParams berubah. Sync state → URL juga via useEffect
  // terpisah supaya tidak race (URL → state useEffect bisa fire setelah
  // state → URL useEffect saat user toggle filter, tapi guard "kalau
  // sama, skip" mencegah infinite loop).
  const [status, setStatus] = useState(() => searchParams.get('status') || '');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // [H-4] URL → state: ikuti perubahan URL eksternal.
  useEffect(() => {
    const urlStatus = searchParams.get('status') || '';
    if (urlStatus !== status) {
      setStatus(urlStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // [H-4] state → URL: replace agar tidak menambah history entry per filter
  // change. Guard "kalau sama, skip" untuk hindari loop dengan effect di atas.
  useEffect(() => {
    const urlStatus = searchParams.get('status') || '';
    if (urlStatus === status) return;
    const params = new URLSearchParams(searchParams);
    if (status) params.set('status', status);
    else params.delete('status');
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // --- STATE MODAL & DETAIL ---
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [infoDoc, setInfoDoc] = useState(null);
  const [isInfoLoading, setIsInfoLoading] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // State khusus Riwayat Versi (V1/V2)
  const [versionDoc, setVersionDoc] = useState(null);

  // --- FETCH DATA ---
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (status === 'trash') {
        response = await getMyTrashDocuments({ page, limit: 10 });
      } else {
        response = await getUserDocuments({ page, status, search, limit: 10 });
      }
      if (response?.status === 'success') {
        setDocuments(response.data?.data || response.data || []);
        setMeta(response.data?.meta || response.meta || { total: 0, page: 1, limit: 10, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setError(err.message || 'Gagal mengambil daftar dokumen. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  // Fetch trash count secara terpisah (untuk badge di tab)
  const fetchTrashCount = useCallback(async () => {
    try {
      const res = await getMyTrashDocuments({ page: 1, limit: 1 });
      if (res?.status === 'success') {
        const m = res.data?.meta || res.meta;
        setTrashCount(m?.total || 0);
      }
    } catch { /* silent */ }
  }, []);

  // Fetch count per status (independen dari view aktif)
  const fetchStatusCounts = useCallback(async () => {
    try {
      const [all, draft, pending, completed] = await Promise.all([
        getUserDocuments({ page: 1, limit: 1 }),
        getUserDocuments({ page: 1, limit: 1, status: 'draft' }),
        getUserDocuments({ page: 1, limit: 1, status: 'pending' }),
        getUserDocuments({ page: 1, limit: 1, status: 'completed' }),
      ]);
      setStatusCounts({
        all: all?.data?.meta?.total ?? all?.meta?.total ?? 0,
        draft: draft?.data?.meta?.total ?? draft?.meta?.total ?? 0,
        pending: pending?.data?.meta?.total ?? pending?.meta?.total ?? 0,
        completed: completed?.data?.meta?.total ?? completed?.meta?.total ?? 0,
      });
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    fetchTrashCount();
    fetchStatusCounts();
  }, [fetchTrashCount, fetchStatusCounts]);

  // --- HANDLERS ---
  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setPage(1); // Reset ke halaman 1 saat filter berubah
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAction = async (type, doc) => {
    switch (type) {
      case 'info':
        try {
          setIsInfoLoading(true);
          const response = await getDocumentDetail(doc.id);
          if (response.status === 'success') {
            setInfoDoc(response.data);
          }
        } catch (err) {
          console.error("Gagal mengambil detail dokumen:", err);
          toast.error("Gagal memuat detail dokumen.");
        } finally {
          setIsInfoLoading(false);
        }
        break;
      
      case 'edit':
        setEditDoc(doc);
        break;

      case 'history':
        setVersionDoc(doc);
        break;

      case 'view':
        navigate(`/dashboard/documents/preview/${doc.id}`);
        break;

      case 'sign':
        if (doc.status?.toLowerCase() === 'completed') {
          toast.warning('Dokumen ini sudah ditandatangani dan tidak dapat ditandatangani ulang.');
          return;
        }
        navigate(`/dashboard/documents/sign/${doc.id}`);
        break;

      case 'download':
        try {
          const response = await getDocumentFile(doc.id, 'download');
          if (response.status === 'success' && response.data?.url) {
            window.location.assign(response.data.url);
          }
        } catch (err) {
          console.error(`Gagal mengunduh dokumen:`, err);
          toast.error('Gagal mengunduh dokumen.');
        }
        break;

      case 'delete':
        setDeleteDoc(doc);
        break;

      case 'restore':
        try {
          await restoreMyDocument(doc.id);
          toast.success(`Dokumen "${doc.title}" berhasil di-restore.`);
          fetchDocuments();
          fetchTrashCount();
          fetchStatusCounts();
        } catch (err) {
          toast.error(err.message || 'Gagal me-restore dokumen.');
        }
        break;

      default:
        console.log('Action for doc:', type, doc.id);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDoc) return;
    setIsDeleting(true);
    try {
      await deleteDocument(deleteDoc.id);
      const deletedTitle = deleteDoc.title;
      setDeleteDoc(null);
      fetchDocuments();
      fetchTrashCount();
      fetchStatusCounts();

      // Toast dengan info bahwa dokumen bisa di-restore via admin
      toast.success(`Dokumen "${deletedTitle}" berhasil dihapus.`, { autoClose: 4000 });
    } catch (err) {
      console.error("Gagal menghapus dokumen:", err);
      toast.error(err.message || "Gagal menghapus dokumen.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateDocument = async (id, data) => {
    setIsUpdating(true);
    try {
      const response = await updateDocument(id, data);
      if (response.status === 'success') {
        setEditDoc(null);
        fetchDocuments(); // Refresh list
      }
    } catch (err) {
      console.error("Gagal mengupdate dokumen:", err);
      toast.error(err.message || "Gagal memperbarui judul dokumen.");
    } finally {
      setIsUpdating(false);
    }
  };

  const actions = {
    refresh: fetchDocuments,
    handleStatusChange,
    handlePageChange,
    handleAction,
    handleConfirmDelete,
    handleUpdateDocument
  };

  const modals = {
    upload: {
      isOpen: isUploadModalOpen,
      setOpen: setIsUploadModalOpen,
      onSuccess: () => {
        setIsUploadModalOpen(false);
        fetchDocuments();
      }
    },
    info: {
      data: infoDoc,
      setOpen: setInfoDoc,
      isLoading: isInfoLoading
    },
    edit: {
      data: editDoc,
      setOpen: setEditDoc,
      onUpdate: handleUpdateDocument,
      loading: isUpdating
    },
    delete: {
      data: deleteDoc,
      setOpen: setDeleteDoc,
      onConfirm: handleConfirmDelete,
      loading: isDeleting
    },
    version: {
      data: versionDoc,
      setOpen: setVersionDoc,
      onRollbackSuccess: fetchDocuments // Refresh saat rollback (V2 di-delete)
    }
  };

  return {
    documents,
    loading,
    error,
    meta,
    trashCount,
    statusCounts,
    filters: {
      status, setStatus: handleStatusChange,
      search, setSearch,
      page, setPage
    },
    modals,
    actions
  };
};
