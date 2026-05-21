/**
 * @hook useDocumentInfo
 * @description Pure helper hook untuk DocumentInfoModal — return badge
 * config dan formatter tanggal Bahasa Indonesia.
 *
 * Tidak menyimpan state; semua nilai derived/util. Konsumer pakai
 * `helpers.getStatusConfig(status)` dan `helpers.formatDate(dateString)`.
 *
 * Catatan: hook ini sengaja tidak menerima param `document`. Sebelumnya
 * param `document` diterima tapi tidak pernah dibaca (lint error
 * `no-unused-vars`). Konsumer cukup pass status/date langsung ke helper.
 *
 * @returns {{
 *   helpers: {
 *     getStatusConfig: (status: string) => { label: string, className: string },
 *     formatDate: (dateString: string) => string
 *   }
 * }}
 */
export const useDocumentInfo = () => {

  /**
   * Helper untuk dapat metadata badge status dokumen.
   * @param {string} status
   * @returns {{ label: string, className: string }}
   */
  const getStatusConfig = (status) => {
    if (!status) return { label: '-', className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800' };

    switch (status.toLowerCase()) {
      case 'completed':
        return {
          label: 'Selesai',
          className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
        };
      case 'pending':
        return {
          label: 'Menunggu',
          className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
        };
      case 'draft':
        return {
          label: 'Draf',
          className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
        };
      default:
        return {
          label: status,
          className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800',
        };
    }
  };

  /**
   * Format tanggal ISO ke format Bahasa Indonesia "1 Jan 2026, 14:30".
   * @param {string|Date} dateString
   * @returns {string}
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return {
    helpers: {
      getStatusConfig,
      formatDate,
    },
  };
};
