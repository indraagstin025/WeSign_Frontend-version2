/**
 * @file groupSignatureService.js
 * @description API calls untuk proses tanda tangan group (draft, update, sign, finalize).
 * Endpoint: /api/group-signatures/*
 */

import { apiFetch } from '../../../services/api';

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
 * @param {string} signatureId
 * @param {{ positionX, positionY, width, height, pageNumber }} payload
 */
export const updateDraftPosition = (signatureId, payload) =>
  apiFetch(`/group-signatures/${signatureId}/position`, {
    method: 'PATCH',
    body: payload,
  });

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
