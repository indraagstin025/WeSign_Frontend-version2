/**
 * @file groupSignatureLayout.js
 * @description Konstanta layout untuk drag/drop dan rendering signature
 *              di group signing page.
 *
 * [L-2] Sebelumnya magic numbers tersebar di 2 file:
 * - useGroupSigningPage.js: DEFAULT_SIG_WIDTH=0.25, DEFAULT_SIG_HEIGHT=0.1
 * - useDraggableSignatureGroup.js: VISUAL_PADDING=18, throttle limit=30
 *
 * Centralize agar mudah di-tweak dan terdokumentasi.
 */

/**
 * Default lebar signature saat baru di-drop (relatif terhadap halaman PDF).
 * 0.25 = 25% dari lebar halaman (cukup besar untuk readable, tidak overflow).
 */
export const DEFAULT_SIGNATURE_WIDTH = 0.25;

/**
 * Default tinggi signature saat baru di-drop (relatif terhadap tinggi halaman).
 * 0.1 = 10% dari tinggi halaman. Aspect ratio yang benar akan ter-update saat
 * `handleImageLoad` di useDraggableSignature fire (cek file useGroupSignatureActions
 * untuk timeline race window T0..T3).
 */
export const DEFAULT_SIGNATURE_HEIGHT = 0.1;

/**
 * Padding visual di luar signature box untuk handle resize/drag.
 * 18px di tiap sisi -> total 36px di width/height.
 */
export const SIGNATURE_VISUAL_PADDING = 18;

/**
 * Throttle interval (ms) untuk emit drag/resize ke socket.
 * 50ms = ~20 emit/detik, mengikuti pola realtime collaboration:
 * local movement instant, peer menerima snapshot realtime, database save final.
 *
 * Jangan samakan emit socket dengan frame rate UI. Local drag/resize tetap
 * direct DOM 60fps; socket hanya preview untuk user lain agar tidak terjadi
 * backlog event saat network production naik.
 *
 * Catatan: ada konstanta serupa di config/timeouts.js
 * (`SOCKET_EMIT_THROTTLE_MS`) untuk personal signing. Sengaja duplikat
 * di sini untuk eksplisit per-feature, tapi nilai harus sama agar UX konsisten.
 */
export const SIGNATURE_SOCKET_THROTTLE_MS = 50;
