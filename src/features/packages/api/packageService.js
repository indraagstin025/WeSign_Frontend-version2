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
 * Direct upload Multiple Documents to create a new Package via Presigned URLs.
 * 1. Minta batch presigned URLs dari backend
 * 2. Upload file-file secara paralel via HTTP PUT langsung ke Backblaze B2 (dengan tracking progress)
 * 3. Konfirmasi ke backend untuk menyimpan dokumen dan membuat paket
 *
 * @param {Array<File>} files
 * @param {string} title
 * @param {string} category
 * @param {object} [options] - { onProgress: (percent) => void, fileHashes: object }
 * @returns {Promise<Object>} Package yang baru dibuat
 */
export async function uploadPackageDirect(files, title, category = 'General', options = {}) {
  const { onProgress, fileHashes = {} } = options;

  // 1. Dapatkan Batch Presigned URLs dari backend
  const ticketRes = await apiFetch('/packages/presigned-urls', {
    method: 'POST',
    body: {
      files: files.map((f) => ({
        fileName: f.name,
        contentType: f.type || 'application/pdf',
      })),
    },
  });

  const items = ticketRes?.data?.items || [];
  if (items.length === 0) {
    throw new Error('Gagal mendapatkan tiket upload dari server.');
  }

  // 2. Upload masing-masing file langsung ke Backblaze B2 via HTTP PUT
  const fileProgresses = new Array(files.length).fill(0);
  const updateAggregateProgress = (index, percent) => {
    fileProgresses[index] = percent;
    if (onProgress) {
      const totalPercent = Math.round(
        fileProgresses.reduce((sum, p) => sum + p, 0) / files.length
      );
      onProgress(totalPercent);
    }
  };

  const uploadPromises = items.map((item, idx) => {
    const file = files.find((f) => f.name === item.fileName) || files[idx];
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', item.uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type || 'application/pdf');

      if (xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            updateAggregateProgress(idx, percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          updateAggregateProgress(idx, 100);
          resolve();
        } else {
          reject(new Error(`Gagal mengunggah file '${item.fileName}' ke Backblaze (Status: ${xhr.status})`));
        }
      };

      xhr.onerror = () => reject(new Error(`Koneksi terputus saat mengunggah '${item.fileName}' ke penyimpanan cloud.`));
      xhr.ontimeout = () => reject(new Error(`Upload '${item.fileName}' ke penyimpanan cloud timeout.`));

      xhr.send(file);
    });
  });

  await Promise.all(uploadPromises);

  // 3. Konfirmasi ke backend
  const documentsPayload = items.map((item) => ({
    fileName: item.fileName,
    filePath: item.filePath,
    hash: fileHashes[item.fileName] || null,
  }));

  return apiFetch('/packages/confirm-upload', {
    method: 'POST',
    body: {
      title: title || (files[0] ? `Paket: ${files[0].name.replace(/\.[^/.]+$/, '')}` : 'Paket Dokumen'),
      label: category || 'General',
      documents: documentsPayload,
    },
  });
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
 * Phase 4 backend dual-path: response bisa berupa
 *   - Sync: { status: "success", data: { packageId, status, success, failed, ... } }
 *   - Async: { status: "success", data: { jobId, status, mode: "job" } }
 * Caller (hook) yang membedakan dua shape.
 *
 * @param {string} packageId
 * @param {Array} signaturesPayload
 * @param {string} [auditTrailMode]
 * @param {object} [options]
 * @param {string|null} [options.idempotencyKey]
 */
export async function signPackage(packageId, signaturesPayload, auditTrailMode = "embedded", options = {}) {
  const result = await apiFetch(`/packages/${packageId}/sign`, {
    method: 'POST',
    body: { signatures: signaturesPayload, auditTrailMode },
    timeout: 120000, // 2 menit — sync signing butuh waktu lama (generate PDF + upload per dokumen)
    idempotencyKey: options.idempotencyKey || undefined,
  });
  // Cache hanya di-bust kalau response sync (status sudah berubah). Untuk
  // response job, status paket belum berubah saat ini — caller akan
  // memanggil invalidatePackageCache lagi setelah polling completed.
  if (result?.data?.mode !== 'job') {
    invalidatePackageCache(packageId);
  }
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

/**
 * Hard delete paket milik user dari trash. Penghapusan ini bersifat permanen
 * dan membersihkan file PDF fisik dari storage.
 * @param {string} packageId
 * @returns {Promise<object>} Status operasi
 */
export async function hardDeleteMyPackage(packageId) {
  return apiFetch(`/packages/trash/${packageId}`, { method: 'DELETE' });
}
