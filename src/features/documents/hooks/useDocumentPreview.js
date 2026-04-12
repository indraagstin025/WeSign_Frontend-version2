import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getDocumentFile, getDocumentDetail } from '../api/docService';

/**
 * Hook for managing the logic of Document Preview.
 * Centralizes data fetching, secure URL handling, and navigation.
 */
export const useDocumentPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
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

        // 2. Fetch secure view URL
        const urlResponse = await getDocumentFile(id, 'view');
        if (urlResponse.status === 'success' && urlResponse.data?.url) {
          setUrl(urlResponse.data.url);
        } else {
          throw new Error('Gagal mendapatkan akses ke file dokumen.');
        }
      } catch (err) {
        console.error('Preview error:', err);
        setError(err.message || 'Terjadi kesalahan saat memuat pratinjau dokumen.');
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [id]);

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
      alert('Gagal mengunduh dokumen.');
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
      error
    },
    actions: {
      handleDownload,
      handleBack,
      openInNewTab: () => window.open(url, '_blank'),
      reload: () => window.location.reload()
    }
  };
};
