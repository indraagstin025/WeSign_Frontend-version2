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
 *
 * Value JSON:
 *   { jobId, status, savedAt }
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

export const groupFinalizeJobKey = (groupId, documentId) =>
  buildKey(["group", String(groupId), documentId]);

export const persistGroupFinalizeJob = (groupId, documentId, jobId, status) =>
  writeJob(groupFinalizeJobKey(groupId, documentId), jobId, status);

export const readGroupFinalizeJob = (groupId, documentId) =>
  readJob(groupFinalizeJobKey(groupId, documentId));

export const clearGroupFinalizeJob = (groupId, documentId) =>
  safeRemove(groupFinalizeJobKey(groupId, documentId));
