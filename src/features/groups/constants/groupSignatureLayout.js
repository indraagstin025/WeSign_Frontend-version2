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
 * 30ms = ~33 emit/detik, balance smoothness untuk peer dan bandwidth/CPU server.
 *
 * Nilai ini sama dengan implementasi lama (PlacedSignatureGroup) yang
 * terbukti smooth. Sempat saya turunkan ke 16ms (60fps) untuk "lebih
 * smooth", tapi ternyata pattern repo lama dengan 30ms work better
 * karena server tidak overwhelmed dengan emit dan browser receiver
 * tidak ke-dispatch event terlalu sering.
 *
 * Catatan: ada konstanta serupa di config/timeouts.js
 * (`SOCKET_EMIT_THROTTLE_MS`) untuk personal signing. Sengaja duplikat
 * di sini untuk eksplisit per-feature, tapi nilai harus sama agar UX konsisten.
 */
export const SIGNATURE_SOCKET_THROTTLE_MS = 30;

/**
 * Drag realtime boleh lebih rapat dari resize karena drag hanya mengubah
 * transform (murah di compositor), sementara resize menyentuh layout box.
 */
export const SIGNATURE_DRAG_SOCKET_THROTTLE_MS = 20;

/**
 * Delay visual untuk observer remote. Nilai kecil membuat gerak tetap halus
 * tanpa terasa "mengejar terlalu jauh" seperti transition fixed 120ms.
 */
export const REMOTE_SIGNATURE_DRAG_INTERPOLATION_MS = 22;

/**
 * Resize tetap boleh sedikit lebih smooth karena width/height update lebih
 * berat dan secara visual memang lebih enak kalau tidak terlalu snap.
 */
export const REMOTE_SIGNATURE_RESIZE_INTERPOLATION_MS = 65;

/**
 * Kalau jarak target remote sudah terlalu jauh, snap langsung. Ini mencegah
 * backlog visual saat network hiccup atau tab receiver sempat freeze.
 */
export const REMOTE_SIGNATURE_SNAP_DISTANCE_PX = 180;
