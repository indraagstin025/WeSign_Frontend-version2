/**
 * Hook for managing the logic of Document Info Modal.
 * Pure JS (No JSX) to prevent extension issues and maintain separation.
 */
export const useDocumentInfo = (document) => {
  
  /**
   * Helper to get status metadata for Badge
   */
  const getStatusConfig = (status) => {
    if (!status) return { label: '-', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800' };
    
    switch (status.toLowerCase()) {
      case 'completed':
        return {
          label: 'Selesai',
          className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
        };
      case 'pending':
        return {
          label: 'Menunggu',
          className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
        };
      case 'draft':
        return {
          label: 'Draf',
          className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
        };
      default:
        return {
          label: status,
          className: 'bg-slate-100 text-slate-700 dark:bg-slate-800'
        };
    }
  };

  /**
   * Helper for Indonesian date-time formatting
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return {
    helpers: {
      getStatusConfig,
      formatDate
    }
  };
};
