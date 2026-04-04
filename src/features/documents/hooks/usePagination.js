/**
 * Hook for managing the logic of Pagination.
 * Centralizes page range calculation and ellipsis handling.
 */
export const usePagination = (currentPage, totalPages) => {
  
  /**
   * Helper to generate the array of page numbers and ellipses.
   * Example output: [1, '...', 4, 5, 6, '...', 10]
   */
  const getPageNumbers = () => {
    const pages = [];
    
    if (totalPages <= 7) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Complex pagination logic with ellipses
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return {
    pageNumbers: getPageNumbers()
  };
};
