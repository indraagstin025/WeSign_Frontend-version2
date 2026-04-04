import { useState, useRef, useEffect } from 'react';

/**
 * Hook for managing the logic of the Package Table.
 * Handles dropdown menus, click outside detection, and display formatting.
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
   * Helper to get CSS classes based on signature status
   */
  const getStatusStyles = (status) => {
    if (!status) return 'bg-slate-100 text-slate-700 dark:bg-slate-800';
    
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
      case 'draft':
      case 'pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800';
    }
  };

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
      getStatusStyles,
      formatDate
    },
    handleActionClick
  };
};
