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
  if (typeof str !== "string") return "";
  return str
    .trim() // Hapus spasi di awal/akhir
    .replace(/[<>]/g, "") // Hapus karakter < dan > (anti-XSS)
    .replace(/javascript:/gi, "") // Hapus pola javascript: URI
    .replace(/on\w+\s*=/gi, "") // Hapus event handler (onclick=, onerror=, dll.)
    // eslint-disable-next-line no-control-regex -- Sengaja strip control char (0x00-0x1F, 0x7F) untuk anti-XSS via NULL/CTRL injection
    .replace(/[\x00-\x1F\x7F]/g, ""); // Hapus control characters
}

/**
 * Membersihkan dan memvalidasi format email.
 * @param {string} email - Alamat email mentah
 * @returns {string} Email yang sudah di-trim dan di-lowercase
 */
export function sanitizeEmail(email) {
  if (typeof email !== "string") return "";
  return email
    .trim()
    .toLowerCase()
    .replace(/[<>"'`;(){}[\]\\]/g, ""); // Hapus karakter berbahaya dari email
}

/**
 * Memvalidasi format email untuk match dengan backend express-validator isEmail().
 *
 * [H-2] Backend pakai 2 layer validasi:
 *   1. express-validator `isEmail()` — RFC 5322 compliance (strict, mengikuti
 *      validator.js library)
 *   2. authService EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/ — basic format check
 *
 * Frontend match dengan EMAIL_REGEX (basic) + tambah constraint RFC 5321:
 *   - Total length ≤ 254 chars
 *   - Local part ≤ 64 chars
 *   - Tidak ada consecutive dots di local part (".." invalid)
 *   - Local part tidak boleh diawali/diakhiri dengan dot
 *
 * Edge case yang masih bisa lolos client tapi reject backend (mis. internal
 * domain not exists, special unicode chars) — di-handle gracefully dengan
 * error message dari backend response.
 *
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (typeof email !== 'string' || !email) return false;

  // Pattern dasar: local-part@domain dengan minimal satu dot di domain
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;

  // RFC 5321 length constraints
  if (email.length > 254) return false;

  const [local, domain] = email.split("@");
  if (!local || local.length > 64) return false;
  if (!domain || domain.length > 253) return false;

  // Local part: tidak boleh ".." (consecutive dots) atau diawali/diakhiri dengan "."
  if (local.startsWith('.') || local.endsWith('.')) return false;
  if (local.includes('..')) return false;

  // Domain: harus punya valid TLD (minimal 2 char) dan tidak ".." consecutive
  if (domain.includes('..')) return false;
  const tld = domain.split('.').pop();
  if (!tld || tld.length < 2) return false;

  return true;
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

/**
 * Memvalidasi password strength untuk match dengan backend validation.
 * Backend requirements: Minimal 8 karakter, 1 angka, 1 huruf besar, 1 huruf kecil.
 * @param {string} password
 * @returns {object} { isValid: boolean, errors: string[] }
 */
export function validatePasswordStrength(password) {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push("Password minimal 8 karakter");
  }
  if (password && password.length > 128) {
    errors.push("Password maksimal 128 karakter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password harus mengandung minimal satu angka (0-9)");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password harus mengandung minimal satu huruf besar (A-Z)");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password harus mengandung minimal satu huruf kecil (a-z)");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
