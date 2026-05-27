/**
 * @file signatureService.js
 * @description Layanan API untuk fitur penandatanganan (Signatures).
 *              Berkomunikasi dengan Backend-DigiSign endpoint /api/signatures/*
 */

import { apiFetch } from '../../../services/api';

/**
 * Menambahkan tanda tangan personal ke dokumen (Finalisasi).
 *
 * Phase 4 backend mendukung dua mode:
 *   - Sync (legacy): response { status: "success", data: { url, accessCode, ... } }
 *   - Async (job):   response { status: "success", data: { jobId, status, mode: "job" } }
 * Caller (hook) yang membedakan dua shape ini.
 *
 * @param {object} payload
 * @param {Array<object>} payload.signatures
 * @param {"embedded"|"separate"|"none"} [payload.auditTrailMode]
 * @param {object} [options]
 * @param {string|null} [options.idempotencyKey] - Header Idempotency-Key.
 *   Dianjurkan dipasang bahkan saat sync mode supaya replay aman.
 * @returns {Promise<object>}
 */
export async function addPersonalSignature({ signatures, auditTrailMode = "embedded" }, options = {}) {
  return apiFetch('/signatures/personal', {
    method: 'POST',
    body: {
      signatures,
      auditTrailMode,
    },
    timeout: 120000, // 2 menit — sync signing butuh waktu generate PDF + crypto + upload
    idempotencyKey: options.idempotencyKey || undefined,
  });
}
