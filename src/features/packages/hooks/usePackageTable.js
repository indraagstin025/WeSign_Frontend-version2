import { useState, useRef, useEffect } from 'react';
import { formatDate } from '../../../utils/formatDate';

/**
 * @hook usePackageTable
 * @description Hook untuk mengelola logika tabel paket — dropdown menu
 * row action, deteksi click outside, dan formatting tanggal.
 *
 * [L-2] formatDate sekarang import dari `utils/formatDate.js` (centralized)
 * supaya konsisten dengan formatter di feature lain.
 *
 * [Bug fix] Sebelumnya `handleClickOutside` cek `menuRef.current.contains(target)`,
 * tapi dropdown di-render via fixed portal di luar wrapper PackageTable. Akibatnya
 * setiap mousedown di dropdown button = "outside" → setOpenMenuId(null) fire
 * sebelum click handler, action tidak ke-trigger.
 *
 * Fix: pakai attribute selector `[data-package-menu]` pada trigger button + dropdown
 * wrapper. Kalau target click berada di element yang punya attribute itu (atau
 * descendant-nya), tidak fire close handler.
 *
 * @param {(type: string, pkg: object) => void} onAction - Callback row action
 */
export const usePackageTable = (onAction) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  /**
   * Close menu when clicking outside the menu container
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Cek via attribute selector — dropdown render via fixed portal di luar
      // wrapper, jadi `menuRef.contains()` selalu return false untuk klik di
      // dropdown. Pakai `closest('[data-package-menu]')` untuk detect klik
      // di trigger button atau dropdown wrapper.
      if (!event.target.closest('[data-package-menu]')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handle dropdown actions with auto-close
   */
  const handleActionClick = (type, pkg) => {
    setOpenMenuId(null);
    if (onAction) onAction(type, pkg);
  };

  return {
    openMenuId,
    setOpenMenuId,
    menuRef,
    helpers: {
      formatDate
    },
    handleActionClick
  };
};
