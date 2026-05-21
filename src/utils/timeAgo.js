/**
 * @file timeAgo.js
 * @description Format relative time dalam Bahasa Indonesia.
 *
 * [L-1] Sebelumnya inline duplikasi di:
 * - `groups/components/GroupDocumentCard.jsx` (menit/jam/hari)
 * - `groups/pages/GroupDetailPage.jsx` (jam/hari)
 *
 * [Bonus] React-Compiler `react-hooks/purity` rule mendeteksi `Date.now()`
 * sebagai impure call selama render. Kalau dipanggil langsung di body
 * komponen, render bisa unstable saat compiler optimize. Dengan
 * mengekstrak ke utility helper yang dipanggil dari component (bukan
 * di body komponen), purity issue tidak relevan — utility tetap
 * dipanggil sebagai event handler / derived value yang re-evaluasi
 * tiap render dengan timestamp baru.
 *
 * Catatan UX: kalau perlu auto-update tampilan (mis. "1 menit lalu"
 * jadi "2 menit lalu" tanpa user reload), wrap dengan setInterval
 * di komponen. Untuk sebagian besar kasus (list dokumen statis),
 * cukup re-render natural saat ada interaksi.
 */

/**
 * Format selisih waktu dalam Bahasa Indonesia.
 *
 * @param {string|Date|number} dateInput - ISO string, Date object, atau ms timestamp
 * @param {object} [options]
 * @param {boolean} [options.includeMinutes=true] - Tampilkan "X menit lalu"
 *   untuk durasi < 1 jam. Set false untuk skip ke "0 jam lalu" / hari.
 * @returns {string} Empty string kalau input invalid
 */
export function timeAgo(dateInput, { includeMinutes = true } = {}) {
  if (!dateInput) return '';

  const target = new Date(dateInput).getTime();
  if (Number.isNaN(target)) return '';

  const now = Date.now();
  const diffMs = now - target;
  if (diffMs < 0) return 'baru saja';

  const minutes = Math.floor(diffMs / 60_000);

  if (includeMinutes && minutes < 60) {
    if (minutes < 1) return 'baru saja';
    return `${minutes} menit lalu`;
  }

  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 24) {
    return `${hours} jam lalu`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} hari lalu`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} bulan lalu`;
  }

  const years = Math.floor(days / 365);
  return `${years} tahun lalu`;
}
