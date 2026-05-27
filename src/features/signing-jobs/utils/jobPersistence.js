/**
 * @file jobPersistence.js
 * @description Simpan jobId aktif per flow di sessionStorage supaya saat
 *   user refresh halaman setelah submit, frontend bisa lanjut polling
 *   job yang sama. Pakai sessionStorage (bukan localStorage) supaya
 *   kalau user buka tab baru atau navigate ke lain origin, key tidak
 *   ikut bocor.
 *
 * Key pattern:
 *   signing-job:personal:{documentId}
 *   signing-job:package:{packageId}
 *   signing-job:group:{groupId}:{documentId}
 *   signing-job:group-active:{groupId}
 *
 * Value JSON:
 *   { jobId, status, savedAt }
 *
 * Active key value adalah ekstensi:
 *   { jobId, documentId, documentTitle, status, savedAt }
 */

const PREFIX = "signing-job";

const safeGet = (key) => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key, value) => {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* noop */
  }
};

const safeRemove = (key) => {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* noop */
  }
};

const buildKey = (parts) => [PREFIX, ...parts].join(":");

const writeJob = (key, jobId, status) => {
  if (!jobId) return;
  const value = JSON.stringify({
    jobId,
    status: status || "queued",
    savedAt: new Date().toISOString(),
  });
  safeSet(key, value);
};

const readJob = (key) => {
  const raw = safeGet(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.jobId) return null;
    return parsed;
  } catch {
    safeRemove(key);
    return null;
  }
};

// ─── Personal ────────────────────────────────────────────────────

export const personalJobKey = (documentId) =>
  buildKey(["personal", documentId]);

export const persistPersonalJob = (documentId, jobId, status) =>
  writeJob(personalJobKey(documentId), jobId, status);

export const readPersonalJob = (documentId) =>
  readJob(personalJobKey(documentId));

export const clearPersonalJob = (documentId) =>
  safeRemove(personalJobKey(documentId));

// ─── Package ─────────────────────────────────────────────────────

export const packageJobKey = (packageId) =>
  buildKey(["package", packageId]);

export const persistPackageJob = (packageId, jobId, status) =>
  writeJob(packageJobKey(packageId), jobId, status);

export const readPackageJob = (packageId) =>
  readJob(packageJobKey(packageId));

export const clearPackageJob = (packageId) =>
  safeRemove(packageJobKey(packageId));

// ─── Group finalize ──────────────────────────────────────────────
//
// Key model:
//   signing-job:group:{groupId}:{documentId}     — per-document key
//   signing-job:group-active:{groupId}           — group-level "active"
//                                                   pointer ({ jobId,
//                                                   documentId,
//                                                   documentTitle, ... })
//
// Per-document key dipakai untuk path yang tahu documentId (signing page,
// dan detail page setelah list dokumen ter-load). Active key dipakai
// detail page untuk RESTORE saat list paginated belum mengandung dokumen
// yang sedang difinalisasi (mis. job dibuat di page 2, refresh balik ke
// page 1).

export const groupFinalizeJobKey = (groupId, documentId) =>
  buildKey(["group", String(groupId), documentId]);

export const groupFinalizeActiveKey = (groupId) =>
  buildKey(["group-active", String(groupId)]);

/**
 * @param {string|number} groupId
 * @param {string} documentId
 * @param {string} jobId
 * @param {string} [status]
 * @param {{ documentTitle?: string }} [meta] — opsional, untuk active key.
 */
export const persistGroupFinalizeJob = (
  groupId,
  documentId,
  jobId,
  status,
  meta = {},
) => {
  writeJob(groupFinalizeJobKey(groupId, documentId), jobId, status);
  // Tulis active key juga supaya detail page (yang tidak tahu documentId
  // sampai user buka halaman dokumen di list paginated) bisa langsung
  // discover job aktif. Active key disengaja overwrite — group hanya
  // boleh punya satu finalize job aktif pada satu waktu.
  if (jobId && documentId) {
    const value = JSON.stringify({
      jobId,
      documentId,
      documentTitle: meta.documentTitle || null,
      status: status || "queued",
      savedAt: new Date().toISOString(),
    });
    safeSet(groupFinalizeActiveKey(groupId), value);
  }
};

export const readGroupFinalizeJob = (groupId, documentId) =>
  readJob(groupFinalizeJobKey(groupId, documentId));

/**
 * Baca active finalize job untuk group. Berguna saat caller belum tahu
 * documentId mana yang punya job aktif.
 *
 * @returns {{ jobId, documentId, documentTitle, status, savedAt } | null}
 */
export const readGroupFinalizeActive = (groupId) => {
  const raw = safeGet(groupFinalizeActiveKey(groupId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.jobId || !parsed?.documentId) return null;
    return parsed;
  } catch {
    safeRemove(groupFinalizeActiveKey(groupId));
    return null;
  }
};

export const clearGroupFinalizeJob = (groupId, documentId) => {
  safeRemove(groupFinalizeJobKey(groupId, documentId));
  // Clear active key hanya bila pointer-nya merujuk dokumen yang sama.
  // Ini menjaga skenario edge di mana ada active key pointing ke dokumen
  // lain (seharusnya jarang karena 1 group = 1 active job, tapi tetap
  // defensive).
  const active = readGroupFinalizeActive(groupId);
  if (active?.documentId && String(active.documentId) === String(documentId)) {
    safeRemove(groupFinalizeActiveKey(groupId));
  }
};

export const clearGroupFinalizeActive = (groupId) =>
  safeRemove(groupFinalizeActiveKey(groupId));
