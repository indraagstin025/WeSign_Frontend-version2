import { apiFetch } from '../../../services/api';
import { apiUpload } from '../../../services/apiUpload';

/**
 * Upload Multiple Documents to create a new Package
 * @param {FormData} formData - Mengandung 'title' dan 'documentFiles' (array).
 * @param {object} options - { onProgress }
 * @returns {Promise<Object>} Package yang baru dibuat
 */
export async function uploadPackageDocuments(formData, options = {}) {
  return apiUpload('/packages/upload', formData, options);
}

/**
 * Get all packages for the logged in user with server-side pagination
 * @param {object} params - { page, limit, status, search }
 * @returns {Promise<{ data: Array, meta: { total, page, limit, totalPages } }>}
 */
export async function getAllPackages({ page = 1, limit = 5, status = '', search = '' } = {}) {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('limit', limit);
  if (status) params.set('status', status);
  if (search) params.set('search', search);

  return apiFetch(`/packages?${params.toString()}`, {
    method: 'GET',
  });
}

/**
 * Get a single package details
 * @param {string} packageId 
 * @returns {Promise<Object>}
 */
export async function getPackageDetails(packageId) {
  return apiFetch(`/packages/${packageId}`, {
    method: 'GET',
  });
}

/**
 * Sign Package (Batch Sign)
 * @param {string} packageId 
 * @param {Array} signaturesPayload - Array konfigurasi tanda tangan untuk setiap dokumen
 */
export async function signPackage(packageId, signaturesPayload, auditTrailMode = "embedded") {
  return apiFetch(`/packages/${packageId}/sign`, {
    method: 'POST',
    body: { signatures: signaturesPayload, auditTrailMode },
    timeout: 120000, // 2 menit — signing butuh waktu lama (generate PDF + upload per dokumen)
  });
}

/**
 * Update Package (Change Title/Label)
 * @param {string} packageId 
 * @param {object} data - {title, label}
 */
export async function updatePackage(packageId, data) {
  return apiFetch(`/packages/${packageId}`, {
    method: 'PUT',
    body: data,
  });
}

/**
 * Delete Package
 * @param {string} packageId 
 */
export async function deletePackage(packageId) {
  return apiFetch(`/packages/${packageId}`, {
    method: 'DELETE',
  });
}

// ── Trash (Soft Delete) — User Self-Service ──────────────────────────────

/**
 * Mengambil daftar paket di trash (soft-deleted) milik user sendiri.
 * @param {object} params - { page, limit }
 * @returns {Promise<object>} Data paket terhapus + metadata paginasi
 */
export async function getMyTrashPackages({ page = 1, limit = 10 } = {}) {
  const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() }).toString();
  return apiFetch(`/packages/trash?${query}`, { method: 'GET' });
}

/**
 * Restore paket milik user dari trash. Akan ikut me-restore semua dokumen
 * turunan PackageItem yang ada di paket tersebut.
 * @param {string} packageId
 * @returns {Promise<object>} Paket yang di-restore
 */
export async function restoreMyPackage(packageId) {
  return apiFetch(`/packages/trash/${packageId}/restore`, { method: 'POST' });
}
