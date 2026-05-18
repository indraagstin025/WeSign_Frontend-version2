/**
 * @file signatureLayout.js
 * @description Konstanta layout untuk drag/drop dan rendering signature
 *              di personal signing (DocumentSigningPage + DraggableSignature).
 *
 * [M-6] Sebelumnya magic numbers tersebar di:
 * - useDraggableSignature.js: VISUAL_PADDING=18, MIN_W=10
 * - useDocumentSigner.js: defaultWidth=0.25, defaultHeight=0.1
 * - renderToImage.js: DPR cap (sudah di-fix di M-3)
 *
 * Centralize di sini agar:
 * - Mudah di-tweak terpusat
 * - Self-documented dengan JSDoc per konstanta
 * - Konsisten dengan pola groups (lihat groups/constants/groupSignatureLayout.js)
 */

/**
 * Default lebar signature saat baru di-drop (relatif terhadap halaman PDF).
 * 0.25 = 25% dari lebar halaman. Cukup besar untuk readable, tidak overflow.
 */
export const DEFAULT_SIGNATURE_WIDTH = 0.25;

/**
 * Default tinggi signature saat baru di-drop (relatif terhadap tinggi halaman).
 * 0.1 = 10% dari tinggi halaman. Aspect ratio yang benar akan ter-update saat
 * `handleImageLoad` di useDraggableSignature fire.
 */
export const DEFAULT_SIGNATURE_HEIGHT = 0.1;

/**
 * Padding visual di luar signature box untuk handle resize/drag.
 * 18px di tiap sisi -> total 36px di width/height.
 *
 * NB: Ada konstanta serupa di groups/constants/groupSignatureLayout.js
 * (`SIGNATURE_VISUAL_PADDING`). Sengaja per-feature untuk eksplisit
 * (group dan personal punya container yang berbeda), tapi nilainya harus
 * sama agar UX konsisten.
 */
export const VISUAL_PADDING = 18;

/**
 * Total padding (per axis) — handy untuk perhitungan inner ↔ outer dimension.
 */
export const TOTAL_PADDING = VISUAL_PADDING * 2;

/**
 * Lebar minimum INNER (tanpa padding) saat resize. Mencegah signature
 * dikecilkan sampai tidak terlihat.
 */
export const MIN_INNER_WIDTH = 10;
