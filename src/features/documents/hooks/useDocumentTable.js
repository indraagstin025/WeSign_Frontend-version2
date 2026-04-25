import { useState, useEffect, useRef } from 'react';

/**
 * Hook for managing the logic of Document Table.
 * Handles dropdown states and display helpers.
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

  /**
   * Helper for status chip CSS classes
   */
  const getStatusStyles = (status) => {
    if (!status) return 'bg-zinc-400 text-white border-transparent';
    
    switch (status.toLowerCase()) {
      case 'completed':
      case 'selesai':
        return 'bg-emerald-500 text-white border-transparent shadow-sm';
      case 'pending':
        return 'bg-amber-500 text-white border-transparent shadow-sm';
      case 'action_needed':
      case 'perlu aksi':
        return 'bg-blue-500 text-white border-transparent shadow-sm';
      case 'waiting':
      case 'menunggu':
      case 'draft':
        return 'bg-zinc-400 text-white border-transparent shadow-sm';
      default:
        return 'bg-zinc-400 text-white border-transparent';
    }
  };

  /**
   * Helper for human-readable status labels
   */
  const getStatusLabel = (status) => {
    if (!status) return '-';
    
    const labels = {
      completed: 'Selesai',
      pending: 'Pending',
      action_needed: 'Perlu Aksi',
      waiting: 'Menunggu',
      signed: 'Signed',
      draft: 'Draft'
    };
    return labels[status.toLowerCase()] || status;
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
