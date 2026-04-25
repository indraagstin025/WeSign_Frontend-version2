import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Users, CheckCircle, XCircle, Loader2, LogIn, UserPlus } from 'lucide-react';
import { useUser } from '../../../context/UserContext';
import { acceptInvitation } from '../api/groupService';

/**
 * @page JoinGroupPage
 * @route /groups/join?token=...
 * @description Halaman publik untuk bergabung ke grup via invitation link.
 *
 * 3 kondisi:
 * 1. Belum login + belum register → tampil tombol Register & Login, simpan token di sessionStorage
 * 2. Belum login + sudah punya akun → tampil tombol Login, simpan token di sessionStorage
 * 3. Sudah login → langsung proses join otomatis
 *
 * Guard: useRef memastikan processJoin hanya dipanggil SEKALI meski React StrictMode
 * double-fires useEffect, atau user redirect balik ke halaman ini.
 */

export const SESSION_KEY = 'wesign_pending_join_token';

const JoinGroupPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useUser();

  const token = searchParams.get('token');

  const [status, setStatus] = useState('idle'); // idle | joining | success | error | already_member
  const [groupName, setGroupName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Guard: prevent double-call dari React StrictMode atau multiple renders
  const hasProcessed = useRef(false);

  // ── Proses join via API ───────────────────────────────────────────────────
  const processJoin = useCallback(async (joinToken) => {
    // Prevent double execution
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
        setTimeout(() => navigate('/dashboard/groups', { replace: true }), 2000);
      } else {
        throw new Error(res.message || 'Gagal bergabung ke grup.');
      }
    } catch (err) {
      sessionStorage.removeItem(SESSION_KEY);

      const msg = err.message || '';

      // Jika sudah menjadi member — anggap sukses (idempotent)
      if (
        msg.toLowerCase().includes('already') ||
        msg.toLowerCase().includes('sudah') ||
        msg.toLowerCase().includes('member') ||
        err.status === 409
      ) {
        setStatus('already_member');
        setTimeout(() => navigate('/dashboard/groups', { replace: true }), 2000);
      } else {
        setErrorMsg(msg || 'Link undangan tidak valid atau sudah kedaluwarsa.');
        setStatus('error');
        // Reset guard agar user bisa coba lagi jika mau
        hasProcessed.current = false;
      }
    }
  }, [navigate]);

  // ── Effect utama ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setErrorMsg('Token undangan tidak ditemukan di URL.');
      setStatus('error');
      return;
    }

    if (authLoading) return; // Tunggu auth selesai

    if (user) {
      // Kondisi 3: Sudah login → langsung join (guard di dalam processJoin)
      processJoin(token);
    } else {
      // Kondisi 1 & 2: Belum login → simpan token, tampilkan pilihan
      sessionStorage.setItem(SESSION_KEY, token);
      setStatus('idle');
    }
  }, [token, user, authLoading, processJoin]);

  // ── Loading auth ─────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-emerald-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-emerald-950/20 p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/30 mb-4">
            <Users size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">WeSign</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Platform Tanda Tangan Digital</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-100 dark:border-white/5 p-8">

          {/* Joining */}
          {status === 'joining' && (
            <div className="text-center py-4">
              <Loader2 size={40} className="animate-spin text-emerald-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-zinc-800 dark:text-white">Memproses Undangan...</h2>
              <p className="text-sm text-zinc-500 mt-2">Sedang bergabung ke grup</p>
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div className="text-center py-4">
              <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-zinc-800 dark:text-white">Berhasil Bergabung!</h2>
              <p className="text-sm text-zinc-500 mt-2">
                Anda sekarang menjadi anggota <span className="font-bold text-emerald-600">{groupName}</span>.
              </p>
              <p className="text-xs text-zinc-400 mt-3">Mengalihkan ke halaman grup...</p>
            </div>
          )}

          {/* Already member — anggap sukses */}
          {status === 'already_member' && (
            <div className="text-center py-4">
              <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-zinc-800 dark:text-white">Anda Sudah Anggota</h2>
              <p className="text-sm text-zinc-500 mt-2">
                Anda sudah terdaftar di grup ini sebelumnya.
              </p>
              <p className="text-xs text-zinc-400 mt-3">Mengalihkan ke halaman grup...</p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="text-center py-4">
              <XCircle size={48} className="text-rose-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-zinc-800 dark:text-white">Undangan Tidak Valid</h2>
              <p className="text-sm text-zinc-500 mt-2">{errorMsg}</p>
              <button
                onClick={() => navigate('/', { replace: true })}
                className="mt-6 w-full py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all border-none cursor-pointer"
              >
                Kembali ke Beranda
              </button>
            </div>
          )}

          {/* Idle: belum login */}
          {status === 'idle' && (
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-5">
                <Users size={24} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-black text-zinc-800 dark:text-white mb-2">
                Anda Diundang!
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
                Anda menerima undangan untuk bergabung ke sebuah grup di WeSign.
                Silakan login atau daftar untuk melanjutkan.
              </p>

              <div className="flex flex-col gap-3">
                <Link
                  to={`/login`}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all no-underline shadow-lg shadow-emerald-600/20 active:scale-95"
                >
                  <LogIn size={16} />
                  Masuk ke Akun
                </Link>

                <Link
                  to={`/register`}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-200 font-bold text-sm bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all no-underline active:scale-95"
                >
                  <UserPlus size={16} />
                  Daftar Akun Baru
                </Link>
              </div>

              <p className="text-xs text-zinc-400 mt-6">
                Link undangan akan otomatis diproses setelah Anda masuk.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinGroupPage;
