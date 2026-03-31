import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getUserDocuments, 
  getDocumentFile, 
  getDocumentDetail, 
  deleteDocument,
  updateDocument 
} from '../api/docService';

/**
 * @hook useDocuments
 * @description Custom hook untuk mengelola seluruh logika bisnis Brankas Dokumen.
 * Memisahkan state, fetch API, dan event handler dari komponen UI.
 */
export const useDocuments = () => {
  const navigate = useNavigate();

  // --- STATE DATA ---
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  
  // --- STATE FILTER ---
  const [status, setStatus] = useState(''); // '', 'draft', 'pending', 'completed', 'archived'
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // --- STATE MODAL & DETAIL ---
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [infoDoc, setInfoDoc] = useState(null);
  const [isInfoLoading, setIsInfoLoading] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // --- FETCH DATA ---
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUserDocuments({ page, status, search, limit: 10 });
      if (response?.status === 'success') {
        setDocuments(response.data);
        setMeta(response.meta);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setError(err.message || 'Gagal mengambil daftar dokumen. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

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
          alert("Gagal memuat detail dokumen.");
        } finally {
          setIsInfoLoading(false);
        }
        break;
      
      case 'edit':
        setEditDoc(doc);
        break;

      case 'view':
        navigate(`/dashboard/documents/preview/${doc.id}`);
        break;

      case 'sign':
        navigate(`/dashboard/documents/sign/${doc.id}`);
        break;

      case 'download':
        try {
          const response = await getDocumentFile(doc.id, 'download');
          if (response.success && response.url) {
            window.location.assign(response.url);
          }
        } catch (err) {
          console.error(`Gagal mengunduh dokumen:`, err);
          alert(`Gagal mengunduh dokumen.`);
        }
        break;

      case 'delete':
        setDeleteDoc(doc);
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
      setDeleteDoc(null);
      fetchDocuments(); // Refresh
    } catch (err) {
      console.error("Gagal menghapus dokumen:", err);
      alert("Gagal menghapus dokumen.");
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
      alert(err.message || "Gagal memperbarui judul dokumen.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUploadSuccess = () => {
    fetchDocuments(); // Refresh daftar dokumen
  };

  return {
    // Data & Loading States
    documents,
    loading,
    error,
    meta,
    
    // Filter States & Handlers
    filters: {
      status,
      search,
      page,
      setStatus: handleStatusChange,
      setSearch,
      setPage
    },

    // Modal States & Handlers
    modals: {
      upload: {
        isOpen: isUploadModalOpen,
        setOpen: setIsUploadModalOpen,
        onSuccess: handleUploadSuccess
      },
      info: {
        data: infoDoc,
        setOpen: setInfoDoc,
        isLoading: isInfoLoading
      },
      delete: {
        data: deleteDoc,
        setOpen: setDeleteDoc,
        loading: isDeleting,
        onConfirm: handleConfirmDelete
      },
      edit: {
        data: editDoc,
        setOpen: setEditDoc,
        loading: isUpdating,
        onUpdate: handleUpdateDocument
      }
    },

    // Action Handlers
    actions: {
      handleAction,
      handlePageChange,
      refresh: fetchDocuments
    }
  };
};
