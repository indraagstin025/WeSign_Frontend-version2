/**
 * @file sanitize.js
 * @description Utilitas sanitasi input untuk mencegah XSS dan data tidak valid.
 */

/**
 * Membersihkan string dari tag HTML dan script berbahaya.
 * @param {string} str - String mentah dari input pengguna
 * @returns {string} String yang sudah dibersihkan
 */
export function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str
    .trim()                                    // Hapus spasi di awal/akhir
    .replace(/[<>]/g, '')                      // Hapus karakter < dan > (anti-XSS)
    .replace(/javascript:/gi, '')              // Hapus pola javascript: URI
    .replace(/on\w+\s*=/gi, '')                // Hapus event handler (onclick=, onerror=, dll.)
    .replace(/[\x00-\x1F\x7F]/g, '');          // Hapus control characters
}

/**
 * Membersihkan dan memvalidasi format email.
 * @param {string} email - Alamat email mentah
 * @returns {string} Email yang sudah di-trim dan di-lowercase
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email
    .trim()
    .toLowerCase()
    .replace(/[<>"'`;(){}[\]\\]/g, '');        // Hapus karakter berbahaya dari email
}

/**
 * Memvalidasi format email secara ketat.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Memvalidasi panjang nama (2-100 karakter, tidak boleh hanya spasi).
 * @param {string} name
 * @returns {boolean}
 */
export function isValidName(name) {
  const cleaned = sanitizeText(name);
  return cleaned.length >= 2 && cleaned.length <= 100;
}
