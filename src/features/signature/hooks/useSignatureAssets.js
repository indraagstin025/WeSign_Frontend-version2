import { useState, useEffect, useCallback } from 'react';
import { getMyAssets, uploadAsset, deleteAsset, setAssetDefault } from '../api/signatureAssetService';
import { createLogger } from '../../../utils/logger';

// [M-5] Scoped logger.
const log = createLogger('SignatureAssets');

/**
 * @hook useSignatureAssets
 * @description Hook untuk mengelola saved signature assets.
 * Fetch saat mount, expose CRUD operations.
 *
 * [M-5] Expose `error` state + `retry` action ke konsumer agar UI bisa
 * tampilkan retry button saat fetch gagal (mis. network error). Sebelumnya
 * error hanya di-console.error → konsumer tidak tahu fetch gagal, list
 * kosong padahal user pernah upload signature.
 *
 * @returns {{
 *   assets: Array,
 *   loading: boolean,
 *   error: string|null,
 *   fetchAssets: () => Promise<void>,
 *   retry: () => Promise<void>,
 *   upload: (image, type, label, metadata) => Promise<object|null>,
 *   remove: (id) => Promise<void>,
 *   makeDefault: (id) => Promise<void>,
 *   getDefault: (type) => object|undefined,
 *   getByType: (type) => Array
 * }}
 */
export const useSignatureAssets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyAssets();
      if (res.status === 'success') {
        setAssets(res.data || []);
      }
    } catch (err) {
      log.error('Failed to fetch:', err.message);
      // [M-5] Set error state agar konsumer bisa render retry UI.
      // Pesan tetap user-friendly fallback string non-empty (M-5 pattern
      // konsisten dengan groups M-5).
      setError(err.message || 'Gagal memuat signature tersimpan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  /**
   * Upload asset baru dan tambahkan ke state.
   * @returns {object|null} Asset yang dibuat, atau null jika gagal
   */
  const upload = async (image, type, label = null, metadata = null) => {
    try {
      const res = await uploadAsset({ image, type, label, isDefault: true, metadata });
      if (res.status === 'success' && res.data) {
        setAssets(prev => [res.data, ...prev]);
        return res.data;
      }
    } catch (err) {
      log.error('Upload failed:', err.message);
    }
    return null;
  };

  /**
   * Hapus asset dari state dan backend.
   */
  const remove = async (id) => {
    try {
      await deleteAsset(id);
      setAssets(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      log.error('Delete failed:', err.message);
    }
  };

  /**
   * Set asset sebagai default.
   */
  const makeDefault = async (id) => {
    try {
      const res = await setAssetDefault(id);
      if (res.status === 'success' && res.data) {
        setAssets(prev => prev.map(a => ({
          ...a,
          isDefault: a.id === id ? true : (a.type === res.data.type ? false : a.isDefault)
        })));
      }
    } catch (err) {
      log.error('Set default failed:', err.message);
    }
  };

  /** Ambil default asset per tipe */
  const getDefault = (type) => assets.find(a => a.type === type && a.isDefault);

  /** Ambil semua assets per tipe */
  const getByType = (type) => assets.filter(a => a.type === type);

  return {
    assets,
    loading,
    error,
    fetchAssets,
    // [M-5] retry sebagai alias eksplisit fetchAssets — semantic untuk
    // konsumer yang render retry button setelah error.
    retry: fetchAssets,
    upload,
    remove,
    makeDefault,
    getDefault,
    getByType,
  };
};
