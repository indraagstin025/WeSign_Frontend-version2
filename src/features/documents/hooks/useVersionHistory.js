import { useState, useEffect } from 'react';
import { getDocumentHistory, getVersionFile, restoreVersion } from '../api/docService';

/**
 * Hook for managing the logic of Document Version History.
 * Centralizes fetching, downloading versions, and rolling back signatures.
 */
export const useVersionHistory = (isOpen, document, onRollbackSuccess, onClose) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  // Sync data when modal opens
  useEffect(() => {
    if (isOpen && document) {
      fetchHistory();
    } else {
      setVersions([]);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, document]);

  /**
   * Fetch version history from API
   */
  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDocumentHistory(document.id);
      if (response && response.status === 'success') {
        const historyData = response.data || [];
        // Backend usually returns desc, we put original (V1) first for timeline
        setVersions([...historyData].reverse());
      }
    } catch (err) {
      console.error("Failed to fetch versions:", err);
      setError("Gagal memuat riwayat versi dokumen.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle specific version download
   */
  const handleDownload = async (versionId) => {
    try {
      const resp = await getVersionFile(document.id, versionId);
      if (resp?.status === 'success' && resp.data?.url) {
        window.location.assign(resp.data.url);
      }
    } catch (err) {
      alert("Gagal mengunduh file versi dokumen.");
    }
  };

  /**
   * Handle rollback to original version (V1)
   */
  const handleRollback = async (v1Id) => {
    if (!window.confirm("Peringatan: Tindakan ini akan menghapus dokumen final secara permanen beserta file PDF-nya. Dokumen akan kembali menjadi versi asli (kosong). Lanjutkan?")) {
      return;
    }

    setIsRollingBack(true);
    try {
      await restoreVersion(document.id, v1Id);
      alert("Tanda tangan berhasil dibatalkan. Dokumen kembali menjadi versi asli.");
      if (onRollbackSuccess) onRollbackSuccess();
      onClose();
    } catch (err) {
      console.error("Rollback failed:", err);
      alert(err?.response?.data?.message || err.message || "Gagal membatalkan dokumen.");
    } finally {
      setIsRollingBack(false);
    }
  };

  return {
    state: {
      versions,
      loading,
      error,
      isRollingBack
    },
    actions: {
      handleDownload,
      handleRollback,
      fetchHistory
    }
  };
};
