/**
 * @file groupService.js
 * @description API calls untuk manajemen Group (CRUD, invitasi, member, dokumen).
 */

import { apiFetch } from '../../../services/api';

// ── Group CRUD ──────────────────────────────────────────────────────────────

export const createGroup = (name) =>
  apiFetch('/groups', { method: 'POST', body: { name } });

export const getAllGroups = () =>
  apiFetch('/groups');

export const getGroupDetail = (groupId) =>
  apiFetch(`/groups/${groupId}`);

export const updateGroup = (groupId, name) =>
  apiFetch(`/groups/${groupId}`, { method: 'PUT', body: { name } });

export const deleteGroup = (groupId) =>
  apiFetch(`/groups/${groupId}`, { method: 'DELETE' });

// ── Invitasi ─────────────────────────────────────────────────────────────────

// Default role: 'member' agar match dengan whitelist backend
// (`["member", "admin_group", "viewer"]`). Sebelumnya 'signer' → selalu 400.
export const createInvitation = (groupId, role = 'member') =>
  apiFetch(`/groups/${groupId}/invitations`, { method: 'POST', body: { role } });

export const acceptInvitation = (token) =>
  apiFetch('/groups/invitations/accept', { method: 'POST', body: { token } });

// ── Member ────────────────────────────────────────────────────────────────────

export const removeMember = (groupId, userIdToRemove) =>
  apiFetch(`/groups/${groupId}/members/${userIdToRemove}`, { method: 'DELETE' });

// ── Dokumen Grup ──────────────────────────────────────────────────────────────

/**
 * Upload dokumen baru ke grup.
 * @param {string} groupId
 * @param {FormData} formData - Harus berisi: file (PDF), title, signerUserIds (JSON string)
 */
export const uploadGroupDocument = (groupId, formData) =>
  apiFetch(`/groups/${groupId}/documents/upload`, {
    method: 'POST',
    body: formData,
    // apiFetch otomatis hapus Content-Type jika body instanceof FormData
  });

/**
 * Pindahkan dokumen personal ke grup.
 */
export const assignDocumentToGroup = (groupId, documentId, signerUserIds = []) =>
  apiFetch(`/groups/${groupId}/documents`, {
    method: 'PUT',
    body: { documentId, signerUserIds },
  });

/**
 * Kembalikan dokumen dari grup ke privat (tidak dihapus, hanya unassign).
 */
export const unassignDocument = (groupId, documentId) =>
  apiFetch(`/groups/${groupId}/documents/${documentId}`, { method: 'DELETE' });

/**
 * Hapus dokumen secara permanen dari grup dan storage.
 */
export const deleteGroupDocument = (groupId, documentId) =>
  apiFetch(`/groups/${groupId}/documents/${documentId}/delete`, { method: 'DELETE' });

/**
 * Update daftar penandatangan dokumen.
 * @param {string[]} signerUserIds - Array UUID user yang akan jadi signer
 */
export const updateDocumentSigners = (groupId, documentId, signerUserIds) =>
  apiFetch(`/groups/${groupId}/documents/${documentId}/signers`, {
    method: 'PUT',
    body: { signerUserIds },
  });

/**
 * Finalisasi dokumen: burn PDF dengan semua tanda tangan.
 * Hanya bisa dipanggil oleh admin group setelah semua signer sudah sign.
 */
export const finalizeGroupDocument = (groupId, documentId) =>
  apiFetch(`/groups/${groupId}/documents/${documentId}/finalize`, { method: 'POST' });
