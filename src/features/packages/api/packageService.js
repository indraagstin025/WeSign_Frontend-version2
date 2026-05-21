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
 *
 * [FE-1] In-flight deduplication + short TTL cache.
 *   3 hook (`usePackageInfo`, `usePackagePreview`, `useSignPackage`) panggil
 *   endpoint sama di flow user yang berdekatan. Tanpa dedup, request dobel.
 *   Sekarang:
 *   - Request yang sama (`packageId`) di-share via `_inFlight` map
 *     (deduplication selama promise belum settled)
 *   - Hasil sukses di-cache 30 detik di `_resultCache` — navigasi cepat
 *     antar hook (info modal → close → sign page → preview) hit cache.
 *
 *   Cache di-bust saat:
 *   - Mutation lewat `updatePackage` / `deletePackage` (lihat helper di bawah)
 *   - TTL 30 detik (auto expire)
 *
 * @param {string} packageId
 * @returns {Promise<Object>}
 */
const _packageDetailsInFlight = new Map();
const _packageDetailsCache = new Map(); // { id: { data, expiresAt } }
const PACKAGE_CACHE_TTL_MS = 30 * 1000;

export async function getPackageDetails(packageId) {
  if (!packageId) throw new Error('packageId required');

  // Cek cache TTL dulu
  const cached = _packageDetailsCache.get(packageId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // De-dup in-flight
  const existing = _packageDetailsInFlight.get(packageId);
  if (existing) return existing;

  const promise = apiFetch(`/packages/${packageId}`, { method: 'GET' })
    .then((data) => {
      _packageDetailsCache.set(packageId, {
        data,
        expiresAt: Date.now() + PACKAGE_CACHE_TTL_MS,
      });
      return data;
    })
    .finally(() => {
      _packageDetailsInFlight.delete(packageId);
    });

  _packageDetailsInFlight.set(packageId, promise);
  return promise;
}

/**
 * [FE-1] Bust cache untuk paket tertentu setelah mutation.
 *   Dipanggil otomatis di `updatePackage`, `deletePackage`, atau bisa
 *   dipanggil manual oleh hook setelah signing sukses.
 */
export function invalidatePackageCache(packageId) {
  if (!packageId) return;
  _packageDetailsCache.delete(packageId);
  _packageDetailsInFlight.delete(packageId);
}

/**
 * Sign Package (Batch Sign)
 *
 * [FE-1] Setelah signing sukses, status paket berubah → cache stale → bust.
 *
 * @param {string} packageId
 * @param {Array} signaturesPayload - Array konfigurasi tanda tangan untuk setiap dokumen
 */
export async function signPackage(packageId, signaturesPayload, auditTrailMode = "embedded") {
  const result = await apiFetch(`/packages/${packageId}/sign`, {
    method: 'POST',
    body: { signatures: signaturesPayload, auditTrailMode },
    timeout: 120000, // 2 menit — signing butuh waktu lama (generate PDF + upload per dokumen)
  });
  invalidatePackageCache(packageId);
  return result;
}

/**
 * Update Package (Change Title/Label)
 *
 * [FE-1] Bust cache supaya next read return data baru.
 *
 * @param {string} packageId
 * @param {object} data - {title, label}
 */
export async function updatePackage(packageId, data) {
  const result = await apiFetch(`/packages/${packageId}`, {
    method: 'PUT',
    body: data,
  });
  invalidatePackageCache(packageId);
  return result;
}

/**
 * Delete Package
 *
 * [FE-1] Bust cache (paket sudah hilang, jangan return stale data).
 *
 * @param {string} packageId
 */
export async function deletePackage(packageId) {
  const result = await apiFetch(`/packages/${packageId}`, {
    method: 'DELETE',
  });
  invalidatePackageCache(packageId);
  return result;
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
