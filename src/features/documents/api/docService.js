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

/**
 * Mengambil daftar dokumen di trash (soft-deleted).
 * @param {object} params - { page, limit }
 * @returns {Promise<object>} Data dokumen terhapus + metadata paginasi
 */
export async function getTrashDocuments({ page = 1, limit = 10 } = {}) {
  const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() }).toString();
  return apiFetch(`/admin/trash?${query}`, { method: 'GET' });
}

/**
 * Restore dokumen dari trash.
 * @param {string} documentId
 * @returns {Promise<object>} Dokumen yang di-restore
 */
export async function restoreDocument(documentId) {
  return apiFetch(`/admin/trash/${documentId}/restore`, { method: 'POST' });
}

/**
 * Hapus dokumen secara permanen (hard delete).
 * @param {string} documentId
 * @returns {Promise<object>} Konfirmasi
 */
export async function permanentDeleteDocument(documentId) {
  return apiFetch(`/admin/trash/${documentId}/permanent`, { method: 'DELETE' });
}
