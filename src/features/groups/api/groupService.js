/**
 * @file groupService.js
 * @description API calls untuk manajemen Group (CRUD, invitasi, member, dokumen).
 */

import { apiFetch } from '../../../services/api';

// ── Group CRUD ──────────────────────────────────────────────────────────────

export const createGroup = (name) =>
  apiFetch('/groups', { method: 'POST', body: { name } }).then((res) => {
    invalidateAllGroupsCache();
    return res;
  });

/**
 * [FE-16] Cache list grup user 30 detik + dedup in-flight.
 *
 *   Backend Redis P3-1 sudah cache `groups:user:{userId}:list` TTL 60 detik.
 *   Frontend cache 30 detik defensive — saat user navigate dashboard ↔ groups
 *   list ↔ detail dalam 30 detik, langsung hit cache local (skip round-trip).
 *
 *   Cache di-bust saat:
 *   - createGroup (grup baru harus tampil)
 *   - User invalidate manual via `invalidateAllGroupsCache()`
 *   - TTL 30 detik
 */
const ALL_GROUPS_CACHE_TTL_MS = 30 * 1000;
let _allGroupsCache = null;
let _allGroupsAt = 0;
let _allGroupsInFlight = null;

const _isAllGroupsCacheValid = () =>
  _allGroupsCache && Date.now() - _allGroupsAt < ALL_GROUPS_CACHE_TTL_MS;

export const invalidateAllGroupsCache = () => {
  _allGroupsCache = null;
  _allGroupsAt = 0;
  _allGroupsInFlight = null;
};

// [LOGOUT-CLEANUP] Subscribe ke auth-cleanup event dari api.js handleLogout.
// Bust semua cache module-level supaya user berikutnya yang login tidak
// dapat data stale dari user sebelumnya.
if (typeof window !== 'undefined') {
  window.addEventListener('wesign:auth-cleanup', () => {
    invalidateAllGroupsCache();
    _groupDetailCache.clear();
    _groupDetailInFlight.clear();
  });
}

export const getAllGroups = () => {
  if (_isAllGroupsCacheValid()) {
    return Promise.resolve(_allGroupsCache);
  }

  if (_allGroupsInFlight) return _allGroupsInFlight;

  _allGroupsInFlight = apiFetch('/groups')
    .then((data) => {
      _allGroupsCache = data;
      _allGroupsAt = Date.now();
      return data;
    })
    .finally(() => {
      _allGroupsInFlight = null;
    });

  return _allGroupsInFlight;
};

/**
 * Mengambil detail grup.
 *
 * [BE-5] Param `includeSignatureImages` opt-in untuk fetch base64 signature
 * image (perlu di signing page untuk render preview). Default false untuk
 * hemat bandwidth — endpoint detail biasa cuma butuh metadata.
 *
 * [FE-5] In-flight dedup + short TTL cache (30 detik). Tiga hook (`useGroupData`,
 *   `useGroupDocumentPreviewPage`, dll) yang fire fetch identik dalam waktu
 *   berdekatan akan share cache. Cache bust di mutation (updateGroup,
 *   removeMember, dll) supaya tidak return data stale setelah perubahan.
 *
 *   Cache key meng-include `includeSignatureImages` agar signing page (yang
 *   butuh base64) tidak share cache dengan view biasa (yang tidak butuh).
 *
 * @param {string|number} groupId
 * @param {object} [opts]
 * @param {boolean} [opts.includeSignatureImages=false]
 */
const _groupDetailInFlight = new Map();
const _groupDetailCache = new Map(); // { key: { data, expiresAt } }
const GROUP_DETAIL_CACHE_TTL_MS = 30 * 1000;

const _groupDetailKey = (groupId, withImages) =>
  `${groupId}:${withImages ? 'full' : 'meta'}`;

export const getGroupDetail = (groupId, { includeSignatureImages = false } = {}) => {
  const key = _groupDetailKey(groupId, includeSignatureImages);

  // Cache TTL hit
  const cached = _groupDetailCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.data);
  }

  // De-dup in-flight
  const existing = _groupDetailInFlight.get(key);
  if (existing) return existing;

  const query = includeSignatureImages ? '?includeSignatureImages=true' : '';
  const promise = apiFetch(`/groups/${groupId}${query}`)
    .then((data) => {
      _groupDetailCache.set(key, {
        data,
        expiresAt: Date.now() + GROUP_DETAIL_CACHE_TTL_MS,
      });
      return data;
    })
    .finally(() => {
      _groupDetailInFlight.delete(key);
    });

  _groupDetailInFlight.set(key, promise);
  return promise;
};

/**
 * [FE-5] Bust cache untuk grup tertentu setelah mutation.
 *   Hapus baik versi `meta` maupun `full` agar caller berikutnya fresh.
 */
export const invalidateGroupCache = (groupId) => {
  if (!groupId) return;
  _groupDetailCache.delete(_groupDetailKey(groupId, false));
  _groupDetailCache.delete(_groupDetailKey(groupId, true));
  _groupDetailInFlight.delete(_groupDetailKey(groupId, false));
  _groupDetailInFlight.delete(_groupDetailKey(groupId, true));
};

/**
 * [FE-14] Endpoint ringan: metadata grup + admin + counts (~5KB vs ~50-200KB).
 *   Cocok untuk page header, breadcrumb, sidebar, atau pre-load data sebelum
 *   buka full detail. Backend cache 3 menit (Redis P3-1).
 *
 *   Response shape:
 *   {
 *     id, name, code, adminId, createdAt, updatedAt,
 *     admin: { id, name, email, userStatus, profilePictureUrl },
 *     members_count, docs_count, viewerRole
 *   }
 *
 * @param {string|number} groupId
 */
export const getGroupSummary = (groupId) =>
  apiFetch(`/groups/${groupId}/summary`);

/**
 * [FE-15] List anggota grup paginated + filter search.
 *
 *   Response shape:
 *   { data: [...members], pagination: { page, limit, total, totalPages } }
 *
 *   Backend cache per-page 60 detik (Redis P3-1).
 *
 * @param {string|number} groupId
 * @param {object} [params]
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20] - max 100 di backend
 * @param {string} [params.search] - filter by name/email
 */
export const getGroupMembers = (groupId, { page = 1, limit = 20, search = '' } = {}) => {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('limit', limit);
  if (search) params.set('search', search);
  return apiFetch(`/groups/${groupId}/members?${params.toString()}`);
};

export const updateGroup = (groupId, name) =>
  apiFetch(`/groups/${groupId}`, { method: 'PUT', body: { name } }).then((res) => {
    invalidateGroupCache(groupId);
    invalidateAllGroupsCache();
    return res;
  });

export const deleteGroup = (groupId) =>
  apiFetch(`/groups/${groupId}`, { method: 'DELETE' }).then((res) => {
    invalidateGroupCache(groupId);
    invalidateAllGroupsCache();
    return res;
  });

// ── Invitasi ─────────────────────────────────────────────────────────────────

// Default role: 'member' agar match dengan whitelist backend
// (`["member", "admin_group", "viewer"]`). Sebelumnya 'signer' → selalu 400.
export const createInvitation = (groupId, role = 'member') =>
  apiFetch(`/groups/${groupId}/invitations`, { method: 'POST', body: { role } });

export const acceptInvitation = (token) =>
  apiFetch('/groups/invitations/accept', { method: 'POST', body: { token } }).then((res) => {
    // [FE-16] User join group baru → list grup berubah.
    invalidateAllGroupsCache();
    return res;
  });

// ── Member ────────────────────────────────────────────────────────────────────

export const removeMember = (groupId, userIdToRemove) =>
  apiFetch(`/groups/${groupId}/members/${userIdToRemove}`, { method: 'DELETE' }).then((res) => {
    invalidateGroupCache(groupId);
    return res;
  });

// ── Dokumen Grup ──────────────────────────────────────────────────────────────

/**
 * Upload dokumen baru ke grup.
 * @param {string} groupId
 * @param {FormData} formData - Harus berisi: file (PDF), title, signerUserIds (JSON string)
 */
export const uploadGroupDocument = (groupId, formData, options = {}) =>
  apiFetch(`/groups/${groupId}/documents/upload`, {
    method: 'POST',
    body: formData,
    // apiFetch otomatis hapus Content-Type jika body instanceof FormData
    ...options,
  }).then((res) => {
    invalidateGroupCache(groupId);
    return res;
  });

/**
 * Pindahkan dokumen personal ke grup.
 */
export const assignDocumentToGroup = (groupId, documentId, signerUserIds = []) =>
  apiFetch(`/groups/${groupId}/documents`, {
    method: 'PUT',
    body: { documentId, signerUserIds },
  }).then((res) => {
    invalidateGroupCache(groupId);
    return res;
  });

/**
 * Kembalikan dokumen dari grup ke privat (tidak dihapus, hanya unassign).
 */
export const unassignDocument = (groupId, documentId) =>
  apiFetch(`/groups/${groupId}/documents/${documentId}`, { method: 'DELETE' }).then((res) => {
    invalidateGroupCache(groupId);
    return res;
  });

/**
 * Hapus dokumen secara permanen dari grup dan storage.
 */
export const deleteGroupDocument = (groupId, documentId) =>
  apiFetch(`/groups/${groupId}/documents/${documentId}/delete`, { method: 'DELETE' }).then((res) => {
    invalidateGroupCache(groupId);
    return res;
  });

/**
 * Update daftar penandatangan dokumen.
 * @param {string[]} signerUserIds - Array UUID user yang akan jadi signer
 */
export const updateDocumentSigners = (groupId, documentId, signerUserIds) =>
  apiFetch(`/groups/${groupId}/documents/${documentId}/signers`, {
    method: 'PUT',
    body: { signerUserIds },
  }).then((res) => {
    invalidateGroupCache(groupId);
    return res;
  });

/**
 * Finalisasi dokumen: burn PDF dengan semua tanda tangan.
 * Hanya bisa dipanggil oleh admin group setelah semua signer sudah sign.
 */
/**
 * Mengambil dokumen grup dengan server-side pagination.
 * @param {string|number} groupId
 * @param {object} params - { page, limit, search, status, sortBy }
 *   sortBy: 'newest' | 'oldest' | 'az' | 'za' | 'status' | 'signers'
 * @returns {Promise<{ data: Array, meta: { total, page, limit, totalPages } }>}
 */
export const getGroupDocuments = (
  groupId,
  { page = 1, limit = 10, search = '', status = '', sortBy = 'newest' } = {}
) => {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('limit', limit);
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  if (sortBy) params.set('sortBy', sortBy);
  return apiFetch(`/groups/${groupId}/documents?${params.toString()}`);
};

export const finalizeGroupDocument = (groupId, documentId, auditTrailMode = "embedded") =>
  apiFetch(`/groups/${groupId}/documents/${documentId}/finalize`, {
    method: 'POST',
    body: { auditTrailMode },
    timeout: 120000,
  }).then((res) => {
    // [Bug fix duplicate signature] Wajib bust cache /groups/:id setelah
    // finalize. Tanpa ini, user yang back ke /sign akan dapat data lama
    // dari cache 30 detik (signature draft + final terlihat dobel di UI).
    invalidateGroupCache(groupId);
    return res;
  });

/**
 * Upload dokumen baru ke grup.
 *
 * Note: didefinisikan ulang di sini supaya konsisten dengan helper invalidate.
 * Versi sebelumnya tidak invalidate cache — list dokumen di /groups/:id stale
 * sampai TTL 30s habis.
 */

// ── Trash (Soft Delete) — Group Document ──────────────────────────────────

/**
 * Mengambil dokumen grup yang sudah di-soft-delete.
 * @param {string|number} groupId
 * @param {object} params - { page, limit }
 */
export const getDeletedGroupDocuments = (groupId, { page = 1, limit = 10 } = {}) => {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  return apiFetch(`/groups/${groupId}/documents/trash?${params.toString()}`);
};

/**
 * Restore dokumen grup dari trash.
 * @param {string|number} groupId
 * @param {string} documentId
 */
export const restoreGroupDocument = (groupId, documentId) =>
  apiFetch(`/groups/${groupId}/documents/trash/${documentId}/restore`, { method: 'POST' }).then((res) => {
    invalidateGroupCache(groupId);
    return res;
  });
