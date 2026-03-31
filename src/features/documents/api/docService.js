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
    body: JSON.stringify(data),
  });
}
