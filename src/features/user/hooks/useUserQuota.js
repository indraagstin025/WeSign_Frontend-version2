import { useState, useEffect, useCallback } from 'react';
import { getUserQuota } from '../api/userService';

/**
 * @hook useUserQuota
 * @description Hook kustom untuk mengambil dan mengelola data kuota serta penggunaan user.
 *              Menyediakan state loading, error, dan data kuota terformat.
 */
export const useUserQuota = () => {
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Mengambil data kuota dari server.
   */
  const fetchQuota = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUserQuota();
      // Backend Sigify V2 mengembalikan { success: true, data: { ... } }
      if (response?.status === 'success') {
        setQuota(response.data);
      } else {
        throw new Error(response?.message || 'Gagal mengambil data kuota.');
      }
    } catch (err) {
      console.error('[useUserQuota] Fetch Error:', err);
      setError(err.message || 'Terjadi kesalahan saat memuat data kuota.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Ambil data saat pertama kali hook digunakan
  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  return {
    quota,
    loading,
    error,
    refreshQuota: fetchQuota,
  };
};
