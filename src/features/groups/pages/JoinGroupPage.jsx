import React from 'react';
import { Link } from 'react-router-dom';
import { Users, CheckCircle, XCircle, Loader2, LogIn, UserPlus } from 'lucide-react';
import { useJoinGroupPage, SESSION_KEY } from '../hooks/useJoinGroupPage';

// Re-export agar import existing `import { SESSION_KEY } from '.../JoinGroupPage'`
// (jika ada) tetap bekerja.
export { SESSION_KEY };

/**
 * @page JoinGroupPage
 * @route /groups/join?token=...
 * @description Pure presentation — semua logic di `useJoinGroupPage`.
 */
const JoinGroupPage = () => {
  const { state, actions } = useJoinGroupPage();
  const { authLoading, status, groupName, errorMsg } = state;

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

          {status === 'joining' && (
            <div className="text-center py-4">
              <Loader2 size={40} className="animate-spin text-emerald-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-zinc-800 dark:text-white">Memproses Undangan...</h2>
              <p className="text-sm text-zinc-500 mt-2">Sedang bergabung ke grup</p>
            </div>
          )}

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

          {status === 'error' && (
            <div className="text-center py-4">
              <XCircle size={48} className="text-rose-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-zinc-800 dark:text-white">Undangan Tidak Valid</h2>
              <p className="text-sm text-zinc-500 mt-2">{errorMsg}</p>
              <button
                onClick={actions.goHome}
                className="mt-6 w-full py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all border-none cursor-pointer"
              >
                Kembali ke Beranda
              </button>
            </div>
          )}

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
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all no-underline shadow-lg shadow-emerald-600/20 active:scale-95"
                >
                  <LogIn size={16} />
                  Masuk ke Akun
                </Link>

                <Link
                  to="/register"
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
