/**
 * @file docService.js
 * @description Layanan API untuk manajemen dokumen (Vault).
 *              Berkomunikasi dengan Backend-DigiSign endpoint /api/documents/*
 */

import { apiFetch } from '../../../services/api';
import { apiUpload } from '../../../services/apiUpload';

/**
 * Mengambil daftar dokumen milik pengguna dengan filter dan paginasi.
 * @param {object} params - query params (page, limit, search, status)
 * @returns {Promise<object>} Data dokumen + metadata paginasi
 */
export async function getUserDocuments({ page = 1, limit = 10, search = '', status = '' } = {}) {
  // Bangun query string
  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
    status
  }).toString();

  return apiFetch(`/documents?${query}`, {
    method: 'GET',
  });
}

/**
 * Mengambil detail satu dokumen berdasarkan ID.
 * @param {string} id - Document ID
 * @returns {Promise<object>} Detail dokumen lengkap
 */
export async function getDocumentDetail(id) {
  return apiFetch(`/documents/${id}`, {
    method: 'GET',
  });
}

/**
 * Mengambil daftar tipe dokumen yang boleh dipilih user.
 * @returns {Promise<object>} Daftar tipe dokumen dari backend
 */
export async function getDocumentTypes() {
  return apiFetch('/documents/types', {
    method: 'GET',
  });
}

/**
 * Menghapus dokumen (Soft/Hard delete ditangani backend).
 * @param {string} id - Document ID
 * @returns {Promise<object>} Pesan konfirmasi
 */
export async function deleteDocument(id) {
  return apiFetch(`/documents/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Mengunggah dokumen baru (PDF).
 * @param {FormData} formData - Harus berisi 'documentFile', 'title', dan 'type'
 * @param {object} options - { onProgress }
 * @returns {Promise<object>} Data dokumen yang baru dibuat
 */
export async function uploadDocument(formData, options = {}) {
  return apiUpload('/documents', formData, options);
}

/**
 * Direct upload dokumen ke Backblaze B2 via Presigned URL.
 * 1. Minta presigned URL dari backend
 * 2. Upload biner PDF langsung ke Backblaze via HTTP PUT dengan progress callback
 * 3. Konfirmasi ke backend untuk mencatat metadata dokumen ke database
 *
 * @param {File} file - Objek File PDF
 * @param {string} title - Judul dokumen
 * @param {string} type - Tipe dokumen (misal: "General")
 * @param {object} [options] - { onProgress: (percent) => void, hash: string }
 * @returns {Promise<object>} Data dokumen yang berhasil dibuat
 */
export async function uploadDocumentDirect(file, title, type = 'General', options = {}) {
  const { onProgress, hash } = options;
  const tTotalStart = performance.now();

  // 1. Minta Presigned URL dari Backend
  const tTicketStart = performance.now();
  const ticketRes = await apiFetch('/documents/presigned-url', {
    method: 'POST',
    body: {
      fileName: file.name,
      contentType: file.type || 'application/pdf',
    },
  });
  const ticketMs = performance.now() - tTicketStart;

  const { uploadUrl, filePath } = ticketRes.data;

  // 2. Upload file langsung ke Backblaze B2 via HTTP PUT
  const tPutStart = performance.now();
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type || 'application/pdf');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Gagal mengunggah file ke Backblaze (Status: ${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error('Koneksi terputus saat mengunggah ke penyimpanan cloud.'));
    xhr.ontimeout = () => reject(new Error('Upload ke penyimpanan cloud timeout.'));

    xhr.send(file);
  });
  const putMs = performance.now() - tPutStart;

  // 3. Konfirmasi ke Backend untuk simpan ke database
  const tConfirmStart = performance.now();
  const res = await apiFetch('/documents/confirm', {
    method: 'POST',
    body: {
      filePath,
      title: title || file.name.replace(/\.[^/.]+$/, ''),
      type: type || 'General',
      hash: hash || null,
    },
  });
  const confirmMs = performance.now() - tConfirmStart;
  const totalMs = performance.now() - tTotalStart;

  console.log(
    `%c[WeSign Metrics] 🚀 Upload Selesai (${file.name} - ${(file.size / 1024).toFixed(1)} KB):%c\n` +
    `  • Tiket Presigned : ${ticketMs.toFixed(1)} ms\n` +
    `  • Direct PUT B2   : ${putMs.toFixed(1)} ms\n` +
    `  • Simpan ke DB    : ${confirmMs.toFixed(1)} ms\n` +
    `  👉 TOTAL PROSES   : ${totalMs.toFixed(1)} ms (~${(totalMs / 1000).toFixed(2)}s)`,
    'color: #0284c7; font-weight: bold;',
    'color: inherit;'
  );

  return res;
}

/**
 * Mendapatkan URL file dokumen (Signed URL).
 * @param {string} id - Document ID
 * @param {string} purpose - 'view' atau 'download'
 * @returns {Promise<object>} URL bertimeout untuk akses file
 */
export async function getDocumentFile(id, purpose = 'view') {
  return apiFetch(`/documents/${id}/file?purpose=${purpose}`, {
    method: 'GET',
  });
}/**
 * Memperbarui metadata dokumen (saat ini mendukung pembaruan judul).
 * @param {string} id - Document ID
 * @param {object} data - Objek berisi field yang akan diupdate (misal: { title: 'Baru' })
 * @returns {Promise<object>} Data dokumen yang sudah diperbarui
 */
export async function updateDocument(id, data) {
  return apiFetch(`/documents/${id}`, {
    method: 'PUT',
    body: data,
  });
}

/**
 * Mendapatkan riwayat versi dokumen.
 * @param {string} id - Document ID
 * @returns {Promise<object>} Daftar versi dokumen (V1 dan V2)
 */
export async function getDocumentHistory(id) {
  return apiFetch(`/documents/${id}/versions`, {
    method: 'GET',
  });
}

/**
 * Membatalkan dokumen / Mengembalikan ke Versi 1 (Rollback).
 * Memicu penghapusan V2 di backend sesuai Arsitektur 2-Versi.
 * @param {string} id - Document ID
 * @param {string} versionId - Version ID yang ingin dijadikan current (selalu V1)
 * @returns {Promise<object>} Data dokumen yang sudah di-rollback
 */
export async function restoreVersion(id, versionId) {
  return apiFetch(`/documents/${id}/versions/${versionId}/use`, {
    method: 'PUT',
  });
}

/**
 * Mendapatkan URL signed untuk akses file pada versi spesifik.
 *
 * Backend (FIX #59) sekarang membedakan dua mode akses lewat query
 * `?purpose=view|download`:
 *   - `view`     → signed URL bertanda Content-Disposition `inline` (buka di tab).
 *   - `download` → signed URL bertanda `attachment` (memicu download di browser).
 *
 * Default `'view'` agar sinkron dengan {@link getDocumentFile} dan agar pemanggil
 * yang ingin tampilkan preview tidak perlu pass argumen tambahan.
 *
 * @param {string} id - Document ID
 * @param {string} versionId - Version ID (V1 atau V2)
 * @param {'view'|'download'} [purpose='view'] - Intent akses file
 * @returns {Promise<object>} Signed URL & metadata (mode, expiresIn, dst.)
 */
export async function getVersionFile(id, versionId, purpose = 'view') {
  return apiFetch(`/documents/${id}/versions/${versionId}/file?purpose=${purpose}`, {
    method: 'GET',
  });
}

// ── Trash Management (Admin Only) ─────────────────────────────────────────

/**
 * Mengambil daftar dokumen di trash (soft-deleted) milik user sendiri.
 * @param {object} params - { page, limit }
 * @returns {Promise<object>} Data dokumen terhapus + metadata paginasi
 */
export async function getMyTrashDocuments({ page = 1, limit = 10 } = {}) {
  const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() }).toString();
  return apiFetch(`/documents/trash?${query}`, { method: 'GET' });
}

/**
 * Restore dokumen milik user dari trash.
 * @param {string} documentId
 * @returns {Promise<object>} Dokumen yang di-restore
 */
export async function restoreMyDocument(documentId) {
  return apiFetch(`/documents/trash/${documentId}/restore`, { method: 'POST' });
}

// NOTE: Admin endpoints (`/admin/trash/*`) sudah dihapus dari user feature
// karena pollution arsitektural — admin functionality tidak boleh ada di
// user-facing feature. Kalau perlu admin trash management di masa depan,
// pindahkan ke `src/features/admin/api/adminService.js` (belum ada).
//
// Endpoint backend tetap di-protect oleh `requireAdmin` middleware.
//
// Refs: docs/code-review-feat-documents/01-critical.md (CR-2)
