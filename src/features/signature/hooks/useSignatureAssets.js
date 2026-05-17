import { useState, useEffect, useCallback } from 'react';
import { getMyAssets, uploadAsset, deleteAsset, setAssetDefault } from '../api/signatureAssetService';

/**
 * @hook useSignatureAssets
 * @description Hook untuk mengelola saved signature assets.
 * Fetch saat mount, expose CRUD operations.
 */
export const useSignatureAssets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyAssets();
      if (res.status === 'success') {
        setAssets(res.data || []);
      }
    } catch (err) {
      console.error('[useSignatureAssets] Failed to fetch:', err.message);
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
      console.error('[useSignatureAssets] Upload failed:', err.message);
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
      console.error('[useSignatureAssets] Delete failed:', err.message);
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
      console.error('[useSignatureAssets] Set default failed:', err.message);
    }
  };

  /** Ambil default asset per tipe */
  const getDefault = (type) => assets.find(a => a.type === type && a.isDefault);

  /** Ambil semua assets per tipe */
  const getByType = (type) => assets.filter(a => a.type === type);

  return { assets, loading, fetchAssets, upload, remove, makeDefault, getDefault, getByType };
};
