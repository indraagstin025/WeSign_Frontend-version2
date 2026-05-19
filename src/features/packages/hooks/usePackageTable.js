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
      if (menuRef.current && !menuRef.current.contains(event.target)) {
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
