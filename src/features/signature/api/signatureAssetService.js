/**
 * @file signatureAssetService.js
 * @description API service untuk CRUD Signature Assets (saved TTD/Paraf/Stamp/Text/Date).
 */

import { apiFetch } from '../../../services/api';

/**
 * List semua assets milik user.
 * @param {string} [type] - Filter by type (optional)
 */
export async function getMyAssets(type) {
  const query = type ? `?type=${type}` : '';
  return apiFetch(`/signatures/assets${query}`);
}

/**
 * Upload asset baru.
 * @param {object} data - { image, type, label, isDefault, metadata }
 */
export async function uploadAsset({ image, type, label, isDefault, metadata }) {
  return apiFetch('/signatures/assets', {
    method: 'POST',
    body: { image, type, label, isDefault, metadata },
    timeout: 30000,
  });
}

/**
 * Hapus asset.
 * @param {string} id - Asset ID
 */
export async function deleteAsset(id) {
  return apiFetch(`/signatures/assets/${id}`, { method: 'DELETE' });
}

/**
 * Set asset sebagai default.
 * @param {string} id - Asset ID
 */
export async function setAssetDefault(id) {
  return apiFetch(`/signatures/assets/${id}/default`, { method: 'PATCH' });
}
