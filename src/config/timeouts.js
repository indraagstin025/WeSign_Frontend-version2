/**
 * @file timeouts.js
 * @description Centralized timeout & delay constants untuk seluruh aplikasi.
 *
 * Konvensi: semua durasi dalam milidetik (kecuali ada suffix _SECONDS).
 *
 * Refs: docs/code-review/04-low.md (L-4)
 */

// ── HTTP Request Timeouts ──────────────────────────────────────────────────

/**
 * Default timeout untuk request HTTP biasa (GET/PUT/POST/DELETE).
 * 15 detik cukup untuk 99% endpoint backend di kondisi normal.
 */
export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

/**
 * Timeout upload file biasa (FormData via apiUpload).
 * 30 detik untuk file kecil-medium (PDF s/d 10MB).
 */
export const UPLOAD_TIMEOUT_MS = 30_000;

/**
 * Timeout upload file besar (mis. avatar, profile picture).
 * 60 detik untuk file s/d 5MB dengan compression.
 */
export const UPLOAD_LARGE_TIMEOUT_MS = 60_000;

/**
 * Timeout signing endpoint (digital sign + PDF generate + S3 upload).
 * 120 detik karena backend perlu generate PDF + sign + upload.
 * Dipakai di:
 * - addPersonalSignature
 * - signPackage
 * - signGroupDocument
 */
export const SIGNING_TIMEOUT_MS = 120_000;

// ── Retry & Backoff ────────────────────────────────────────────────────────

/**
 * Maksimal retry attempt untuk transient HTTP error (5xx/408/429/network).
 */
export const RETRY_MAX_ATTEMPTS = 3;

/**
 * Base delay untuk exponential backoff (1 detik).
 * Formula: delay = min(baseDelay * 2^attempt, maxDelay)
 */
export const RETRY_BASE_DELAY_MS = 1_000;

/**
 * Maksimal delay antar retry (4 detik).
 */
export const RETRY_MAX_DELAY_MS = 4_000;

// ── Socket.IO Reconnection ─────────────────────────────────────────────────

/**
 * Initial delay sebelum reconnect attempt pertama (1 detik).
 */
export const SOCKET_RECONNECT_DELAY_MS = 1_000;

/**
 * Maksimal delay untuk reconnect backoff (30 detik).
 * Setelah backoff capped, akan tetap retry pakai delay ini.
 */
export const SOCKET_RECONNECT_DELAY_MAX_MS = 30_000;

/**
 * Connection timeout untuk Socket.IO handshake (20 detik).
 */
export const SOCKET_CONNECT_TIMEOUT_MS = 20_000;

/**
 * Randomization factor untuk reconnect delay jitter (0.5).
 * Mencegah thundering herd reconnect saat server back online.
 */
export const SOCKET_RECONNECT_JITTER = 0.5;

// ── UI / UX Delays ─────────────────────────────────────────────────────────

/**
 * Delay sebelum redirect setelah session expire (auth-expired event).
 * 0 = immediate, atau bisa di-tweak supaya user sempat baca toast.
 */
export const AUTH_EXPIRED_REDIRECT_DELAY_MS = 0;

/**
 * Delay sebelum auto-redirect ke /login setelah register/reset-password sukses.
 * User butuh waktu baca pesan "Berhasil! Mengarahkan...".
 *
 * - Register: 2 detik (cukup untuk lihat banner success singkat)
 * - Reset password: 3 detik (lebih panjang karena pesan lebih spesifik dan
 *   user perlu sadar mereka harus login ulang dengan password baru)
 *
 * Refs: docs/code-review-feat-auth/04-low.md L-3
 */
export const AUTH_REGISTER_REDIRECT_DELAY_MS = 2_000;
export const AUTH_RESET_PASSWORD_REDIRECT_DELAY_MS = 3_000;

/**
 * Delay sebelum auto-redirect ke /dashboard/groups setelah join group via
 * invitation link berhasil (atau already_member). User butuh waktu baca
 * banner "Berhasil bergabung di grup X".
 *
 * Refs: docs/code-review-feat-groups/03-medium.md M-3
 */
export const GROUPS_JOIN_REDIRECT_DELAY_MS = 2_000;

/**
 * Durasi feedback "Tersalin" pada tombol copy invitation link sebelum
 * auto-revert ke state default.
 *
 * Refs: docs/code-review-feat-groups/04-low.md L-8
 */
export const GROUPS_COPY_FEEDBACK_MS = 2_000;

/**
 * Throttle interval untuk socket emit (drag, resize signature).
 * 30ms = ~33 emit/detik, balance antara smoothness & bandwidth.
 */
export const SOCKET_EMIT_THROTTLE_MS = 30;
