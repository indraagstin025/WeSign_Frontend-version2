/**
 * @file groupSignatureService.js
 * @description API calls untuk proses tanda tangan group (draft, update, sign, finalize).
 * Endpoint: /api/group-signatures/*
 */

import { apiFetch } from '../../../services/api';
import { withRetryCoalesce } from '../../../services/withRetryCoalesce';

/**
 * Simpan draft tanda tangan awal saat user pertama kali menaruh TTD di PDF.
 * @param {string} documentId
 * @param {object} payload - { id, signatureImageUrl, positionX, positionY, pageNumber, width, height, method }
 */
export const saveDraft = (documentId, payload) =>
  apiFetch(`/group-signatures/draft/${documentId}`, {
    method: 'POST',
    body: payload,
  });

/**
 * Update posisi/ukuran draft saat user melakukan drag.
 * Dipanggil saat drag selesai (onDragStop / resize end).
 *
 * Dibungkus withRetryCoalesce:
 *   - Retry exponential backoff (3x: 1s, 2s, 4s) untuk transient errors
 *     (5xx/408/429/network). 4xx tidak di-retry.
 *   - Coalesce per signatureId: kalau ada PATCH baru sebelum yang lama selesai,
 *     yang lama di-abort. Mencegah out-of-order writes (mis. drag → drag → drag
 *     yang ke-2 boleh sampai server lebih dulu dari ke-3).
 *   - Lapor ke saveStatus store untuk indikator "saving"/"saved" di UI.
 *
 * @param {string} signatureId
 * @param {{ positionX, positionY, width, height, pageNumber }} payload
 */
export const updateDraftPosition = (signatureId, payload) =>
  withRetryCoalesce(
    `patch:position:${signatureId}`,
    (signal) =>
      apiFetch(`/group-signatures/${signatureId}/position`, {
        method: 'PATCH',
        body: payload,
        signal,
      })
  );

/**
 * Hapus draft tanda tangan (sebelum disimpan final).
 * @param {string} signatureId
 */
export const deleteDraft = (signatureId) =>
  apiFetch(`/group-signatures/${signatureId}`, { method: 'DELETE' });

/**
 * Simpan tanda tangan sebagai FINAL (tidak bisa diubah lagi).
 * Backend akan mengubah status dari 'draft' ke 'final'.
 * @param {string} documentId
 * @param {object} payload - Sama dengan saveDraft: { id, signatureImageUrl, positionX, positionY, pageNumber, width, height, method }
 * @returns {{ isComplete, remainingSigners, readyToFinalize }}
 */
export const signDocument = (documentId, payload) =>
  apiFetch(`/group-signatures/${documentId}/sign`, {
    method: 'POST',
    body: payload,
  });
