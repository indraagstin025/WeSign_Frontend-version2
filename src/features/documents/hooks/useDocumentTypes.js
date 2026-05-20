import { useEffect, useState } from 'react';
import { getDocumentTypes } from '../api/docService';

const FALLBACK_DOCUMENT_TYPES = ['General', 'Group', 'Contract', 'Invoice', 'Certificate'];

const DOCUMENT_TYPE_LABELS = {
  General: 'Umum (General)',
  Group: 'Grup (Group)',
  Contract: 'Kontrak / Perjanjian',
  Invoice: 'Invoice / Faktur',
  Certificate: 'Sertifikat / Bukti',
};

const toOption = (type) => ({
  value: type,
  label: DOCUMENT_TYPE_LABELS[type] || type,
});

/**
 * [FE-3] Module-level cache untuk document types.
 *
 * Whitelist 5 kategori static — di-fetch sekali per session dan share antar
 * komponen (DocumentsPage filter, UploadDocModal form, EditDocModal form).
 *
 * TTL 30 menit cukup karena value-nya nyaris static. Bila berubah, force
 * refresh dengan reload halaman / panggil `_resetDocumentTypesCache()`
 * dari devtools.
 */
const DOCUMENT_TYPES_CACHE_TTL_MS = 30 * 60 * 1000; // 30 menit
let _cachedTypes = null;
let _cachedAt = 0;
let _inFlight = null;

const _isCacheValid = () =>
  _cachedTypes && Date.now() - _cachedAt < DOCUMENT_TYPES_CACHE_TTL_MS;

/**
 * Mengambil tipe dokumen dari backend agar dropdown frontend mengikuti
 * whitelist `USER_ALLOWED_DOCUMENT_TYPES`.
 *
 * [FE-3] Cache hasil di module-level + dedup in-flight request supaya 3
 *   komponen mount bersamaan = 1 fetch, bukan 3.
 */
export const useDocumentTypes = () => {
  const [types, setTypes] = useState(_cachedTypes || FALLBACK_DOCUMENT_TYPES);
  const [loading, setLoading] = useState(!_isCacheValid());
  const [error, setError] = useState(null);

  useEffect(() => {
    // Cache hit → tidak perlu fetch sama sekali.
    if (_isCacheValid()) {
      setTypes(_cachedTypes);
      setLoading(false);
      return;
    }

    let active = true;

    const fetchTypes = async () => {
      setLoading(true);
      setError(null);
      try {
        // [FE-3] Dedup in-flight: kalau sudah ada request sedang jalan,
        //   nunggu hasilnya saja (tidak fire request baru).
        if (!_inFlight) {
          _inFlight = getDocumentTypes()
            .then((response) => {
              const nextTypes = Array.isArray(response?.data) && response.data.length > 0
                ? response.data
                : FALLBACK_DOCUMENT_TYPES;
              _cachedTypes = nextTypes;
              _cachedAt = Date.now();
              return nextTypes;
            })
            .finally(() => {
              _inFlight = null;
            });
        }
        const nextTypes = await _inFlight;

        if (active) setTypes(nextTypes);
      } catch (err) {
        console.error('Failed to fetch document types:', err);
        if (active) {
          setTypes(FALLBACK_DOCUMENT_TYPES);
          setError(err.message || 'Gagal memuat tipe dokumen.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTypes();

    return () => {
      active = false;
    };
  }, []);

  return {
    types,
    options: types.map(toOption),
    loading,
    error,
  };
};
