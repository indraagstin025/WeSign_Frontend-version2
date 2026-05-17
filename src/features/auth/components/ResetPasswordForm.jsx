import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useResetPassword } from '../hooks/useResetPassword';

const ResetPasswordForm = () => {
  const { state, actions } = useResetPassword();

  // No token in URL
  if (!state.token) {
    return (
      <div className="text-center space-y-4">
        <div className="w-14 h-14 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert size={28} className="text-rose-500" />
        </div>
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">Link Tidak Valid</h3>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Token reset password tidak ditemukan di URL. Silakan request ulang dari halaman Lupa Password.
          </p>
        </div>
        <Link
          to="/forgot-password"
          className="inline-flex items-center gap-2 text-[12px] text-emerald-600 font-semibold hover:underline"
        >
          <ArrowLeft size={14} /> Request Reset Password Baru
        </Link>
      </div>
    );
  }

  // Success State
  if (state.success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={28} className="text-emerald-500" />
        </div>
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">Password Berhasil Direset!</h3>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {state.success}
          </p>
        </div>
        <p className="text-[11px] text-zinc-400">Mengalihkan ke halaman login...</p>
      </div>
    );
  }

  return (
    <form onSubmit={actions.handleSubmit} className="space-y-5 w-full">
      {/* Error */}
      {state.error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl">
          <AlertCircle size={14} className="text-rose-500 shrink-0" />
          <p className="text-[12px] text-rose-600 dark:text-rose-400 font-medium">{state.error}</p>
        </div>
      )}

      {/* New Password */}
      <div>
        <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
          Password Baru
        </label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
            <Lock size={16} />
          </div>
          <input
            type={state.showPassword ? 'text' : 'password'}
            placeholder="Minimal 8 karakter"
            value={state.password}
            onChange={(e) => actions.setPassword(e.target.value)}
            className="w-full pl-10 pr-12 py-3 text-[13px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-zinc-900 dark:text-white transition-all"
            required
            autoFocus
          />
          <button
            type="button"
            onClick={actions.togglePasswordVisibility}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 bg-transparent border-none cursor-pointer"
          >
            {state.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Password strength indicators */}
        {state.password && (
          <div className="mt-2 space-y-1">
            {state.passwordErrors.map((err, i) => (
              <p key={i} className="text-[10px] text-rose-500 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-rose-400 shrink-0" />
                {err}
              </p>
            ))}
            {state.isPasswordValid && (
              <p className="text-[10px] text-emerald-500 flex items-center gap-1">
                <CheckCircle2 size={10} /> Password kuat
              </p>
            )}
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
          Konfirmasi Password
        </label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
            <Lock size={16} />
          </div>
          <input
            type={state.showPassword ? 'text' : 'password'}
            placeholder="Ulangi password baru"
            value={state.confirmPassword}
            onChange={(e) => actions.setConfirmPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-[13px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-zinc-900 dark:text-white transition-all"
            required
          />
        </div>
        {state.confirmPassword && state.password !== state.confirmPassword && (
          <p className="text-[10px] text-rose-500 mt-1">Password tidak cocok</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={state.loading || !state.isPasswordValid || state.password !== state.confirmPassword}
        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-bold rounded-xl border-none cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {state.loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Menyimpan...
          </>
        ) : (
          'Simpan Password Baru'
        )}
      </button>

      {/* Back to login */}
      <Link
        to="/login"
        className="flex items-center justify-center gap-2 text-[12px] text-zinc-500 hover:text-emerald-600 font-medium transition-colors mt-4"
      >
        <ArrowLeft size={14} /> Kembali ke Login
      </Link>
    </form>
  );
};

export default ResetPasswordForm;
