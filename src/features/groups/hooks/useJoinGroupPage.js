import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useUser } from '../../../context/UserContext';
import { acceptInvitation } from '../api/groupService';
import { PENDING_GROUP_JOIN_KEY } from '../../../config/sessionKeys';
import { GROUPS_JOIN_REDIRECT_DELAY_MS } from '../../../config/timeouts';

// Re-export untuk backward-compat — caller yang import { SESSION_KEY } dari sini
// tetap bekerja (dengan deprecation warning di JSDoc).
/**
 * @deprecated Pakai `PENDING_GROUP_JOIN_KEY` dari `src/config/sessionKeys.js`.
 * SESSION_KEY tetap ada untuk backward compat.
 */
export const SESSION_KEY = PENDING_GROUP_JOIN_KEY;

/**
 * @deprecated Pakai `GROUPS_JOIN_REDIRECT_DELAY_MS` dari `src/config/timeouts.js`.
 */
const REDIRECT_DELAY_MS = GROUPS_JOIN_REDIRECT_DELAY_MS;

const isAlreadyMemberError = (err) => {
  const msg = err?.message?.toLowerCase() || '';
  return (
    msg.includes('already') ||
    msg.includes('sudah') ||
    msg.includes('member') ||
    err?.status === 409
  );
};

/**
 * @hook useJoinGroupPage
 * @description State machine untuk halaman join via invitation link.
 * Status: idle | joining | success | error | already_member.
 *
 * Tiga skenario:
 *  1. Belum login → simpan token ke sessionStorage, tampilkan tombol Login/Register.
 *  2. Token tidak ada → langsung error.
 *  3. Sudah login → proses join otomatis (guard via useRef agar StrictMode-safe).
 */
export function useJoinGroupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useUser();

  const token = searchParams.get('token');

  const [status, setStatus] = useState('idle');
  const [groupName, setGroupName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Guard: prevent double execution dari StrictMode/multi-render.
  const hasProcessed = useRef(false);

  // [M-3] Track redirect timer agar bisa cleanup saat unmount sebelum fire.
  // Sebelumnya `setTimeout(navigate, 2000)` tanpa cleanup → kalau user
  // navigate manual atau component unmount sebelum 2 detik, navigate
  // tetap akan fire ke /dashboard/groups (atau warning unmounted state).
  const redirectTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, []);

  const processJoin = useCallback(
    async (joinToken) => {
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      setStatus('joining');
      try {
        const res = await acceptInvitation(joinToken);
        if (res.status === 'success') {
          const name = res.data?.group?.name || 'Grup';
          setGroupName(name);
          setStatus('success');
          sessionStorage.removeItem(SESSION_KEY);
          // [M-3] Track timer ID untuk cleanup di unmount.
          redirectTimerRef.current = setTimeout(() => {
            navigate('/dashboard/groups', { replace: true });
            redirectTimerRef.current = null;
          }, REDIRECT_DELAY_MS);
        } else {
          throw new Error(res.message || 'Gagal bergabung ke grup.');
        }
      } catch (err) {
        sessionStorage.removeItem(SESSION_KEY);

        if (isAlreadyMemberError(err)) {
          setStatus('already_member');
          // [M-3] Track timer ID untuk cleanup di unmount.
          redirectTimerRef.current = setTimeout(() => {
            navigate('/dashboard/groups', { replace: true });
            redirectTimerRef.current = null;
          }, REDIRECT_DELAY_MS);
        } else {
          setErrorMsg(err.message || 'Link undangan tidak valid atau sudah kedaluwarsa.');
          setStatus('error');
          // Reset guard agar user bisa retry.
          hasProcessed.current = false;
        }
      }
    },
    [navigate]
  );

  // ── Effect utama ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setErrorMsg('Token undangan tidak ditemukan di URL.');
      setStatus('error');
      return;
    }
    if (authLoading) return;

    if (user) {
      processJoin(token);
    } else {
      // Simpan token agar setelah login langsung diproses oleh flow auth.
      sessionStorage.setItem(SESSION_KEY, token);
      setStatus('idle');
    }
  }, [token, user, authLoading, processJoin]);

  const goHome = () => navigate('/', { replace: true });

  return {
    state: {
      authLoading,
      status,
      groupName,
      errorMsg,
    },
    actions: {
      goHome,
    },
  };
}
