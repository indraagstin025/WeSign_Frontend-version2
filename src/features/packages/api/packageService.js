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
export async function signPackage(packageId, signaturesPayload) {
  return apiFetch(`/packages/${packageId}/sign`, {
    method: 'POST',
    body: { signatures: signaturesPayload },
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
