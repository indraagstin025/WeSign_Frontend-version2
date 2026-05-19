import { useState, useEffect, useRef } from 'react';
import {
  getStatusLabel as centralGetStatusLabel,
  getStatusStyles as centralGetStatusStyles,
} from '../constants/documentStatus';

/**
 * Hook for managing the logic of Document Table.
 * Handles dropdown states and display helpers.
 *
 * [M-2] Status helper di-delegate ke constants/documentStatus.js
 * (single source of truth dengan DocumentTable + DocumentsPage).
 */
export const useDocumentTable = (onAction) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // [M-2] Re-export helper dari constants — backward-compat untuk konsumer
  // yang destructure helpers.{getStatusLabel, getStatusStyles}.
  const getStatusStyles = centralGetStatusStyles;
  const getStatusLabel = centralGetStatusLabel;

  /**
   * Helper for Indonesian date formatting
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  /**
   * Wrapper for actions that closes the menu after trigger
   */
  const handleAction = (type, doc) => {
    onAction(type, doc);
    setOpenMenuId(null);
  };

  return {
    state: {
      openMenuId,
      setOpenMenuId,
      menuRef
    },
    helpers: {
      getStatusStyles,
      getStatusLabel,
      formatDate,
      handleAction
    }
  };
};
