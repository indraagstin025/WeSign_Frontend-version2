/**
 * @file signingJobService.js
 * @description API client untuk endpoint /api/signing-jobs/*.
 *   Hanya dipakai oleh hook polling `useSigningJobPolling`. Submit job
 *   tetap lewat endpoint bisnis existing (personal/package/group) yang
 *   sudah dual-path di backend; lihat
 *   docs/pdf-signing-worker-queue-implementation.md.
 *
 * Backend endpoint:
 *   GET    /api/signing-jobs/:jobId
 *   POST   /api/signing-jobs/:jobId/retry
 *   POST   /api/signing-jobs/:jobId/cancel
 */

import { apiFetch } from "../../../services/api";

/**
 * @param {string} jobId
 * @param {object} [options] - { signal } untuk abort.
 * @returns {Promise<object>} { status, data: SigningJobPublicShape }
 */
export async function getSigningJob(jobId, options = {}) {
  return apiFetch(`/signing-jobs/${jobId}`, {
    method: "GET",
    signal: options.signal,
    timeout: 15000,
  });
}

/**
 * @param {string} jobId
 * @returns {Promise<object>}
 */
export async function retrySigningJob(jobId) {
  return apiFetch(`/signing-jobs/${jobId}/retry`, {
    method: "POST",
    timeout: 15000,
  });
}

/**
 * @param {string} jobId
 * @returns {Promise<object>}
 */
export async function cancelSigningJob(jobId) {
  return apiFetch(`/signing-jobs/${jobId}/cancel`, {
    method: "POST",
    timeout: 15000,
  });
}

export default {
  getSigningJob,
  retrySigningJob,
  cancelSigningJob,
};
