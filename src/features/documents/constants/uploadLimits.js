/**
 * @file uploadLimits.js
 * @description Konstanta batas upload file dokumen.
 *
 * [L-8] Sebelumnya hardcoded `10 * 1024 * 1024` di useUploadDoc.js + label
 * `'10 MB'` terpisah → mudah out of sync saat ada perubahan.
 *
 * Backend punya `MAX_FILE_SIZE` 1 GB (env), tapi frontend sengaja menahan
 * di 10 MB untuk:
 * - Menghemat bandwidth pemakai (mobile data)
 * - Menolak file besar lebih cepat (UX feedback)
 *
 * Ubah BYTES dan LABEL bersamaan agar pesan error tetap konsisten.
 */

/**
 * Batas ukuran upload sisi klien dalam bytes.
 * 10 MB = 10 * 1024 * 1024 = 10,485,760 bytes.
 */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Label user-facing untuk batas ukuran upload (untuk pesan error).
 */
export const MAX_UPLOAD_LABEL = '10 MB';
