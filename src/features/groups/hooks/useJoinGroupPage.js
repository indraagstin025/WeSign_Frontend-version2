import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useUser } from '../../../context/UserContext';
import { acceptInvitation } from '../api/groupService';

export const SESSION_KEY = 'wesign_pending_join_token';

const REDIRECT_DELAY_MS = 2000;

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
          setTimeout(() => navigate('/dashboard/groups', { replace: true }), REDIRECT_DELAY_MS);
        } else {
          throw new Error(res.message || 'Gagal bergabung ke grup.');
        }
      } catch (err) {
        sessionStorage.removeItem(SESSION_KEY);

        if (isAlreadyMemberError(err)) {
          setStatus('already_member');
          setTimeout(() => navigate('/dashboard/groups', { replace: true }), REDIRECT_DELAY_MS);
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
