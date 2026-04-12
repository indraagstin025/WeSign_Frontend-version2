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
 * Menggunakan regex yang compatible dengan RFC 5322 standard (simplified).
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  // Regex yang match dengan express-validator isEmail() implementation
  // Pattern: local-part@domain dengan minimal satu dot di domain
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Additional checks untuk keamanan backend
  if (!emailRegex.test(email)) return false;
  if (email.length > 254) return false; // RFC 5321

  const [local, domain] = email.split("@");
  if (local.length > 64) return false; // RFC 5321 - local part max 64 chars

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
