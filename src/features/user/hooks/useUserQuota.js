import { useState, useEffect, useCallback } from 'react';
import { getUserQuota } from '../api/userService';

/**
 * [FE-9] Module-level cache untuk quota.
 *
 * Quota nyaris tidak berubah per detik (cuma saat upload/delete dokumen
 * atau create/delete group). Sebelumnya hook fetch tiap mount → setiap
 * komponen yang baca quota (Profile sidebar, Upload modal, Dashboard) =
 * 1 fetch. Sekarang share via cache module-level + dedup in-flight.
 *
 * Backend sudah cache 60 detik (Redis P1-4) — frontend cache 30 detik
 * supaya saat backend cache miss, kita masih punya cache yang cukup
 * lama untuk navigation cepat. Konsumer bisa panggil `refreshQuota()`
 * setelah upload/delete untuk force update.
 */
const QUOTA_CACHE_TTL_MS = 30 * 1000;
let _cachedQuota = null;
let _cachedAt = 0;
let _inFlight = null;

const _isCacheValid = () =>
  _cachedQuota && Date.now() - _cachedAt < QUOTA_CACHE_TTL_MS;

/**
 * [FE-9] Helper public — invalidate quota cache. Panggil setelah mutation
 *   yang affect counts (upload dokumen, create paket, delete group).
 */
export const invalidateUserQuotaCache = () => {
  _cachedQuota = null;
  _cachedAt = 0;
};

/**
 * @hook useUserQuota
 * @description Hook kustom untuk mengambil dan mengelola data kuota serta penggunaan user.
 *              Menyediakan state loading, error, dan data kuota terformat.
 *
 * [FE-9] Pakai module-level cache + in-flight dedup. Multiple komponen mount
 *   bersamaan = 1 fetch (atau 0 fetch kalau cache valid). `refreshQuota()`
 *   force re-fetch (bypass cache).
 */
export const useUserQuota = () => {
  const [quota, setQuota] = useState(_cachedQuota);
  const [loading, setLoading] = useState(!_isCacheValid());
  const [error, setError] = useState(null);

  /**
   * Mengambil data kuota dari server. Bila `force=true`, bypass cache.
   */
  const fetchQuota = useCallback(async (force = false) => {
    // Cache hit → set state from cache + skip fetch
    if (!force && _isCacheValid()) {
      setQuota(_cachedQuota);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Dedup in-flight
      if (!_inFlight || force) {
        if (force) _inFlight = null; // bust pending
        _inFlight = getUserQuota()
          .then((response) => {
            if (response?.status === 'success') {
              _cachedQuota = response.data;
              _cachedAt = Date.now();
              return response.data;
            }
            throw new Error(response?.message || 'Gagal mengambil data kuota.');
          })
          .finally(() => {
            _inFlight = null;
          });
      }
      const data = await _inFlight;
      setQuota(data);
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
    refreshQuota: () => fetchQuota(true),
  };
};
