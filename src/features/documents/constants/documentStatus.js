/**
 * @file documentStatus.js
 * @description Single source of truth untuk semua status dokumen personal.
 *
 * [M-2] Sebelumnya 3 lokasi punya mapping sendiri dengan label inkonsisten:
 * - components/DocumentTable.jsx   STATUS_BADGE (draft/pending/completed/archived)
 * - hooks/useDocumentTable.js       getStatusLabel + getStatusStyles
 * - pages/DocumentsPage.jsx         STATUS_TABS (label "Proses" untuk pending)
 *
 * Inkonsistensi: pending → "Pending" vs "Proses", completed → "Selesai" konsisten,
 * draft → "Draft" konsisten. STATUS_BADGE pakai `archived` yang tidak ada di tab.
 *
 * Sekarang: 1 source of truth dengan 4 status keys + helper lookup.
 */

/**
 * @typedef {Object} DocumentStatusConfig
 * @property {string} label  - Label user-facing (Bahasa Indonesia, "Proses" untuk pending)
 * @property {string} cls    - Tailwind class untuk badge style di table
 * @property {string} chip   - Tailwind class untuk chip variant (alternatif badge)
 */

/**
 * @type {Record<string, DocumentStatusConfig>}
 */
export const DOCUMENT_STATUS = {
  draft: {
    label: 'Draft',
    cls: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
    chip: 'bg-zinc-400 text-white border-transparent',
  },
  pending: {
    label: 'Proses',
    cls: 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    chip: 'bg-amber-500 text-white border-transparent shadow-sm',
  },
  completed: {
    label: 'Selesai',
    cls: 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    chip: 'bg-emerald-500 text-white border-transparent shadow-sm',
  },
  archived: {
    label: 'Arsip',
    cls: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
    chip: 'bg-zinc-400 text-white border-transparent',
  },
};

/**
 * Lookup case-insensitive dengan fallback ke draft.
 * @param {string} status
 * @returns {DocumentStatusConfig}
 */
export function getDocumentStatus(status) {
  if (!status) return DOCUMENT_STATUS.draft;
  return DOCUMENT_STATUS[String(status).toLowerCase()] || DOCUMENT_STATUS.draft;
}

/**
 * Helper for human-readable status label (backward-compat dengan
 * useDocumentTable.getStatusLabel).
 * @param {string} status
 * @returns {string}
 */
export function getStatusLabel(status) {
  if (!status) return '-';
  return getDocumentStatus(status).label;
}

/**
 * Helper for status chip CSS classes (backward-compat dengan
 * useDocumentTable.getStatusStyles).
 * @param {string} status
 * @returns {string}
 */
export function getStatusStyles(status) {
  if (!status) return 'bg-zinc-400 text-white border-transparent';
  return getDocumentStatus(status).chip;
}
