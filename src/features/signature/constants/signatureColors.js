/**
 * @file signatureColors.js
 * @description Color palette untuk signature tool modals.
 *
 * [L-2] Sebelumnya tiap modal punya array COLORS sendiri dengan urutan
 * berbeda. Sekarang centralized base palette + subset per-modal sesuai
 * konteks (mis. stamp lebih warna-warni dari date field yang formal).
 *
 * Semua hex code Tailwind palette agar match dengan UI lain.
 */

/**
 * Base palette — semua warna yang available di seluruh tool.
 * Urutan di-set agar warna paling umum di kiri.
 */
export const SIGNATURE_BASE_PALETTE = {
  slate: '#334155',  // Default — formal, neutral
  rose: '#e11d48',   // Aksen — high contrast, attention
  blue: '#2563eb',   // Aksen — informational
  emerald: '#16a34a', // Aksen — success/approved
  violet: '#7c3aed',  // Aksen — creative
  amber: '#d97706',  // Aksen — warning/draft
};

/**
 * Palette untuk Paraf modal — 5 warna (formal-leaning).
 */
export const PARAF_COLORS = [
  SIGNATURE_BASE_PALETTE.slate,
  SIGNATURE_BASE_PALETTE.rose,
  SIGNATURE_BASE_PALETTE.blue,
  SIGNATURE_BASE_PALETTE.emerald,
  SIGNATURE_BASE_PALETTE.violet,
];

/**
 * Palette untuk Stamp modal — 6 warna (full palette, stamp boleh lebih bold).
 */
export const STAMP_COLORS = [
  SIGNATURE_BASE_PALETTE.emerald,
  SIGNATURE_BASE_PALETTE.rose,
  SIGNATURE_BASE_PALETTE.blue,
  SIGNATURE_BASE_PALETTE.slate,
  SIGNATURE_BASE_PALETTE.violet,
  SIGNATURE_BASE_PALETTE.amber,
];

/**
 * Palette untuk Date Field modal — 4 warna (paling formal, no flashy).
 */
export const DATE_FIELD_COLORS = [
  SIGNATURE_BASE_PALETTE.slate,
  SIGNATURE_BASE_PALETTE.rose,
  SIGNATURE_BASE_PALETTE.blue,
  SIGNATURE_BASE_PALETTE.emerald,
];
