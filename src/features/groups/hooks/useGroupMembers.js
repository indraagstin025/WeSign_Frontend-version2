import { useState, useEffect, useCallback } from 'react';
import { getGroupMembers } from '../api/groupService';
import { createLogger } from '../../../utils/logger';

const log = createLogger('GroupMembers');

const DEFAULT_LIMIT = 100; // [FE-15] Default cukup besar untuk komponen yang
//   render full list (signer picker, member list). UI yang butuh paginated
//   beneran (admin settings) bisa pass `limit` lebih kecil + page control.

/**
 * @hook useGroupMembers
 * @description [FE-15] Fetch list members grup via endpoint paginated ringan
 *   `/groups/:id/members?page=&limit=&search=` (BE-4 split). Hook ini bisa
 *   dipakai standalone atau di-compose di parent hook (mis. useGroupDetailPage).
 *
 *   Backend cache 60 detik per (groupId, page, limit, search) — Redis P3-1.
 *
 * @param {string|number} groupId
 * @param {object} [opts]
 * @param {number} [opts.page=1]
 * @param {number} [opts.limit=100]
 * @param {string} [opts.search]
 * @param {boolean} [opts.enabled=true] - Skip fetch bila false (mis. tab belum aktif)
 *
 * @returns {{
 *   members: Array,
 *   pagination: { page, limit, total, totalPages },
 *   loading: boolean,
 *   error: string|null,
 *   refresh: () => Promise<void>,
 * }}
 */
export function useGroupMembers(groupId, { page = 1, limit = DEFAULT_LIMIT, search = '', enabled = true } = {}) {
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMembers = useCallback(
    async (silent = false) => {
      if (!groupId || !enabled) return;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await getGroupMembers(groupId, { page, limit, search });
        if (res?.status === 'success') {
          setMembers(res.data?.data || []);
          setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
        } else {
          throw new Error(res?.message || 'Gagal memuat anggota grup.');
        }
      } catch (err) {
        log.warn('fetchMembers error:', err.message);
        setError(err.message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [groupId, page, limit, search, enabled],
  );

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    pagination,
    loading,
    error,
    refresh: () => fetchMembers(true),
  };
}
