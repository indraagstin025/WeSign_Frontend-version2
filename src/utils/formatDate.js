/**
 * @file formatDate.js
 * @description Format absolute date dalam Bahasa Indonesia.
 *
 * [L-2] Sebelumnya inline duplikat di:
 * - `packages/hooks/usePackageTable.js` -> helpers.formatDate
 * - `documents/hooks/useDocumentTable.js` (kalau ada — pattern serupa)
 * - `groups/components/...` (sebagian)
 *
 * Centralize supaya format tanggal konsisten di seluruh app dan
 * locale 'id-ID' tidak perlu di-hardcode berulang.
 */

/**
 * Format tanggal absolute (mis. "10 Mar 2026").
 *
 * @param {string|Date|number} dateInput - ISO string, Date object, atau ms timestamp
 * @param {object} [options]
 * @param {'short'|'long'|'numeric'} [options.month='short']
 * @param {boolean} [options.includeWeekday=false]
 * @returns {string} Empty string kalau input invalid, '-' kalau falsy
 */
export function formatDate(dateInput, { month = 'short', includeWeekday = false } = {}) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '';

  const opts = {
    day: 'numeric',
    month,
    year: 'numeric',
  };
  if (includeWeekday) opts.weekday = 'long';

  return d.toLocaleDateString('id-ID', opts);
}

/**
 * Format jam:menit (mis. "14:35").
 *
 * @param {string|Date|number} dateInput
 * @returns {string}
 */
export function formatTime(dateInput) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
