import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getDocumentFile, getDocumentDetail } from '../api/docService';
import { apiFetch } from '../../../services/api';
import { createLogger } from '../../../utils/logger';

const log = createLogger('DocumentPreview');

/**
 * Hook for managing the logic of Document Preview.
 * Centralizes data fetching, secure URL handling, and navigation.
 * Supports `?mode=audit-trail` query param to preview audit trail PDF.
 */
export const useDocumentPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isAuditTrailMode = searchParams.get('mode') === 'audit-trail';
  
  const [doc, setDoc] = useState(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load document and preview URL
  useEffect(() => {
    const loadPreview = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // 1. Fetch metadata
        const docResponse = await getDocumentDetail(id);
        if (docResponse.status === 'success') {
          setDoc(docResponse.data);
        }

        // 2. Fetch URL berdasarkan mode
        if (isAuditTrailMode) {
          // Mode audit trail: minta signed URL dari endpoint audit-trail
          const auditRes = await apiFetch(`/documents/${id}/audit-trail`);
          if (auditRes?.status === 'success' && auditRes.data?.url) {
            setUrl(auditRes.data.url);
          } else {
            throw new Error('Audit trail tidak tersedia untuk dokumen ini.');
          }
        } else {
          // Mode normal: minta signed URL file dokumen
          const urlResponse = await getDocumentFile(id, 'view');
          if (urlResponse.status === 'success' && urlResponse.data?.url) {
            setUrl(urlResponse.data.url);
          } else {
            throw new Error('Gagal mendapatkan akses ke file dokumen.');
          }
        }
      } catch (err) {
        console.error('Preview error:', err);
        setError(err.message || 'Terjadi kesalahan saat memuat pratinjau.');
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [id, isAuditTrailMode]);

  /**
   * Handle download action (using direct download URL)
   */
  const handleDownload = async () => {
    try {
      const response = await getDocumentFile(id, 'download');
      if (response.status === 'success' && response.data?.url) {
        window.location.assign(response.data.url);
      }
    } catch (err) {
      // [H-1] Replace alert dengan toast.error
      log.error('Download document failed:', err.message);
      toast.error(err?.message || 'Gagal mengunduh dokumen.');
    }
  };

  /**
   * [H-2] Toggle audit trail mode reactive via React Router navigate
   * (bukan `window.location.reload()`) supaya tidak full-page reload —
   * useEffect di atas sudah re-trigger saat `isAuditTrailMode` berubah
   * via deps `[id, isAuditTrailMode]`.
   *
   * Pakai `replace: true` agar tidak menambah entry history (toggle
   * back-and-forward jadi confusing kalau push).
   */
  const toggleAuditTrail = () => {
    if (isAuditTrailMode) {
      // Hapus query param ?mode=audit-trail
      navigate(location.pathname, { replace: true });
    } else {
      // Tambah query param ?mode=audit-trail
      navigate(`${location.pathname}?mode=audit-trail`, { replace: true });
    }
  };

  /**
   * Safe back navigation with history fallback
   */
  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
    } else {
      navigate('/dashboard/documents');
    }
  };

  return {
    state: {
      doc,
      url,
      loading,
      error,
      isAuditTrailMode,
    },
    actions: {
      handleDownload,
      handleBack,
      toggleAuditTrail,
      openInNewTab: () => window.open(url, '_blank'),
      reload: () => window.location.reload(),
    }
  };
};
