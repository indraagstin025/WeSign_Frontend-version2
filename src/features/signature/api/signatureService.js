/**
 * @file signatureService.js
 * @description Layanan API untuk fitur penandatanganan (Signatures).
 *              Berkomunikasi dengan Backend-DigiSign endpoint /api/signatures/*
 */

import { apiFetch } from '../../../services/api';

/**
 * Menambahkan tanda tangan personal ke dokumen (Finalisasi).
 * @param {object} payload - { signatures: [...] }
 * @returns {Promise<object>} Status sukses dan data dokumen baru
 */
export async function addPersonalSignature({ signatures }) {
  return apiFetch('/signatures/personal', {
    method: 'POST',
    body: {
      signatures // Backend mengharapkan field 'signatures' berupa array
    }
  });
}
