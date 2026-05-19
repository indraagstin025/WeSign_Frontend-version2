import { useState, useEffect } from 'react';
import { getStatusLabel as centralGetStatusLabel } from '../constants/documentStatus';

/**
 * @hook useDocumentTable
 * @description State + helper untuk DocumentTable — kelola dropdown menu
 * action dan handler proxy ke parent.
 *
 * [M-2] Status helper di-delegate ke `constants/documentStatus.js`.
 * [L-4] `getStatusStyles` dan `menuRef` dihapus karena tidak dipakai
 * konsumer (DocumentTable.jsx). Konsumer cukup pakai `helpers.getStatusLabel`
 * dan `state.openMenuId`/`setOpenMenuId`.
 *
 * @param {(type: string, doc: object) => void} onAction - Callback action
 * @returns {{
 *   state: { openMenuId: string|null, setOpenMenuId: Function },
 *   helpers: {
 *     getStatusLabel: (status: string) => string,
 *     formatDate: (dateString: string) => string,
 *     handleAction: (type: string, doc: object) => void
 *   }
 * }}
 */
export const useDocumentTable = (onAction) => {
  const [openMenuId, setOpenMenuId] = useState(null);

  // Tutup menu saat klik di luar component table
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Cek via event target. Konsumer bisa stopPropagation di tombol
      // toggle menu untuk hindari close immediate.
      if (!event.target.closest('[data-document-menu]')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // [M-2] Re-export helper dari constants — backward-compat untuk konsumer
  // yang destructure `helpers.getStatusLabel`.
  const getStatusLabel = centralGetStatusLabel;

  /**
   * Format tanggal ISO ke format Bahasa Indonesia singkat "1 Jan 2026".
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  /**
   * Wrapper action yang juga close menu setelah trigger.
   */
  const handleAction = (type, doc) => {
    onAction(type, doc);
    setOpenMenuId(null);
  };

  return {
    state: {
      openMenuId,
      setOpenMenuId,
    },
    helpers: {
      getStatusLabel,
      formatDate,
      handleAction,
    },
  };
};
