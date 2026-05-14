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
 * Mengambil tipe dokumen dari backend agar dropdown frontend mengikuti
 * whitelist `USER_ALLOWED_DOCUMENT_TYPES`.
 */
export const useDocumentTypes = () => {
  const [types, setTypes] = useState(FALLBACK_DOCUMENT_TYPES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchTypes = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getDocumentTypes();
        const nextTypes = Array.isArray(response?.data) && response.data.length > 0
          ? response.data
          : FALLBACK_DOCUMENT_TYPES;

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
