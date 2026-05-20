/**
 * @file signatureAssetService.js
 * @description API service untuk CRUD Signature Assets (saved TTD/Paraf/Stamp/Text/Date).
 */

import { apiFetch } from '../../../services/api';

/**
 * [FE-6] Cache + in-flight dedup untuk list assets.
 *
 * Modal SignatureCanvas dipakai di banyak tempat (sign personal, sign group,
 * sign package). Setiap mount fetch ulang assets, padahal data nyaris static
 * (user upload jarang). Sebelumnya 1 mount = 1 fetch ke backend yang
 * regenerate signed URL untuk semua asset.
 *
 * Backend Redis P1-2 sudah cache signed URL 24h, tapi tetap 1 round-trip
 * per mount. Frontend cache 60 detik supaya navigation antar modal hit cache.
 *
 * Cache key per `type` filter (atau "ALL" untuk no filter).
 */
const ASSETS_CACHE_TTL_MS = 60 * 1000;
const _assetsCache = new Map(); // { typeKey: { data, expiresAt } }
const _assetsInFlight = new Map();

const _assetsKey = (type) => type || '__ALL__';

/**
 * List semua assets milik user.
 * @param {string} [type] - Filter by type (optional)
 *
 * [FE-6] Cache hasil 60 detik per filter. `invalidateAssetsCache()` exposed
 *   supaya hook bisa bust setelah upload/delete/set default.
 */
export async function getMyAssets(type) {
  const key = _assetsKey(type);

  // Cache TTL hit
  const cached = _assetsCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // De-dup in-flight
  const existing = _assetsInFlight.get(key);
  if (existing) return existing;

  const query = type ? `?type=${type}` : '';
  const promise = apiFetch(`/signatures/assets${query}`)
    .then((data) => {
      _assetsCache.set(key, {
        data,
        expiresAt: Date.now() + ASSETS_CACHE_TTL_MS,
      });
      return data;
    })
    .finally(() => {
      _assetsInFlight.delete(key);
    });

  _assetsInFlight.set(key, promise);
  return promise;
}

/**
 * [FE-6] Bust cache assets — panggil setelah upload/delete/set default.
 *   Hapus semua key (ALL + per-type) supaya konsisten.
 */
export function invalidateAssetsCache() {
  _assetsCache.clear();
  _assetsInFlight.clear();
}

/**
 * Upload asset baru.
 * @param {object} data - { image, type, label, isDefault, metadata }
 */
export async function uploadAsset({ image, type, label, isDefault, metadata }) {
  const result = await apiFetch('/signatures/assets', {
    method: 'POST',
    body: { image, type, label, isDefault, metadata },
    timeout: 30000,
  });
  invalidateAssetsCache();
  return result;
}

/**
 * Hapus asset.
 * @param {string} id - Asset ID
 */
export async function deleteAsset(id) {
  const result = await apiFetch(`/signatures/assets/${id}`, { method: 'DELETE' });
  invalidateAssetsCache();
  return result;
}

/**
 * Set asset sebagai default.
 * @param {string} id - Asset ID
 */
export async function setAssetDefault(id) {
  const result = await apiFetch(`/signatures/assets/${id}/default`, { method: 'PATCH' });
  invalidateAssetsCache();
  return result;
}
