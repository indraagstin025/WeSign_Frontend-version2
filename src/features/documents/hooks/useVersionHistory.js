import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getDocumentHistory, getVersionFile, restoreVersion } from '../api/docService';
import { createLogger } from '../../../utils/logger';

const log = createLogger('VersionHistory');

/**
 * @hook useVersionHistory
 * @description Hook for managing the logic of Document Version History.
 * Centralizes fetching, downloading versions, and rolling back signatures.
 *
 * [H-1] Replace blocking `window.confirm`/`alert` dengan ConfirmModal +
 * toast. Modal pattern memberikan UX yang konsisten dengan design WeSign,
 * non-blocking, dan bisa di-cancel via ESC/backdrop. State `rollbackTarget`
 * + `isRollingBack` di-expose ke konsumer (VersionHistoryModal) yang
 * render ConfirmModal.
 *
 * Flow:
 * - User klik "Batalkan Tanda Tangan" → handleRollback(v1Id) set rollbackTarget
 * - Konsumer render ConfirmModal dengan state.rollbackTarget !== null
 * - User confirm → confirmRollback() panggil API + toast
 * - User cancel → cancelRollback() reset state
 */
export const useVersionHistory = (isOpen, document, onRollbackSuccess, onClose) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  // [H-1] Target version untuk rollback. null = modal closed,
  // string id = modal open dengan target version yang akan di-restore.
  const [rollbackTarget, setRollbackTarget] = useState(null);

  // Sync data when modal opens
  useEffect(() => {
    if (isOpen && document) {
      fetchHistory();
    } else {
      setVersions([]);
      setError(null);
      setRollbackTarget(null);
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
      log.error('Failed to fetch versions:', err.message);
      setError('Gagal memuat riwayat versi dokumen.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle specific version download
   *
   * Pass `'download'` agar backend mengembalikan signed URL ber-Content-Disposition
   * `attachment` (memicu download). Tanpa ini, URL default `'view'` hanya membuka
   * file inline di tab baru — bug setelah backend FIX #59.
   */
  const handleDownload = async (versionId) => {
    try {
      const resp = await getVersionFile(document.id, versionId, 'download');
      if (resp?.status === 'success' && resp.data?.url) {
        window.location.assign(resp.data.url);
      }
    } catch (err) {
      // [H-1] Replace alert dengan toast.error
      log.error('Download version failed:', err.message);
      toast.error('Gagal mengunduh file versi dokumen.');
    }
  };

  /**
   * [H-1] Step 1: open confirm modal dengan target version V1.
   * Konsumer render ConfirmModal saat `state.rollbackTarget !== null`.
   */
  const handleRollback = (v1Id) => {
    setRollbackTarget(v1Id);
  };

  /**
   * [H-1] Step 2: user click "Lanjutkan" di ConfirmModal → benar-benar
   * panggil API rollback. Tutup modal di akhir baik sukses maupun gagal.
   */
  const confirmRollback = async () => {
    if (!rollbackTarget) return;

    setIsRollingBack(true);
    try {
      await restoreVersion(document.id, rollbackTarget);
      toast.success('Tanda tangan berhasil dibatalkan. Dokumen kembali menjadi versi asli.');
      setRollbackTarget(null);
      if (onRollbackSuccess) onRollbackSuccess();
      onClose();
    } catch (err) {
      log.error('Rollback failed:', err.message);
      toast.error(err?.response?.data?.message || err.message || 'Gagal membatalkan dokumen.');
    } finally {
      setIsRollingBack(false);
    }
  };

  /**
   * [H-1] Step 3: user click "Batal" / ESC / backdrop → cancel.
   */
  const cancelRollback = () => {
    if (isRollingBack) return; // tidak boleh cancel saat API in-flight
    setRollbackTarget(null);
  };

  return {
    state: {
      versions,
      loading,
      error,
      isRollingBack,
      rollbackTarget, // [H-1] String|null — controls ConfirmModal isOpen
    },
    actions: {
      handleDownload,
      handleRollback,
      confirmRollback,
      cancelRollback,
      fetchHistory,
    },
  };
};
