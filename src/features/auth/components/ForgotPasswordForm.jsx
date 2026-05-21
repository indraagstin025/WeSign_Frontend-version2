import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useForgotPassword } from '../hooks/useForgotPassword';

const ForgotPasswordForm = () => {
  const { state, actions } = useForgotPassword();

  return (
    <div className="w-full">
      {/* Success State */}
      {state.success ? (
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={28} className="text-emerald-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">Email Terkirim!</h3>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {state.success}
            </p>
          </div>
          <p className="text-[11px] text-zinc-400 mt-4">
            Tidak menerima email? Cek folder spam atau{' '}
            <button
              onClick={() => window.location.reload()}
              className="text-emerald-600 font-semibold bg-transparent border-none cursor-pointer underline p-0"
            >
              kirim ulang
            </button>
          </p>
        </div>
      ) : (
        <form onSubmit={actions.handleSubmit} className="space-y-5">
          {/* Error */}
          {state.error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl">
              <AlertCircle size={14} className="text-rose-500 shrink-0" />
              <p className="text-[12px] text-rose-600 dark:text-rose-400 font-medium">{state.error}</p>
            </div>
          )}

          {/* Email Input */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              Email Terdaftar
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                <Mail size={16} />
              </div>
              <input
                type="email"
                placeholder="nama@perusahaan.com"
                value={state.email}
                onChange={(e) => actions.setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-[13px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-zinc-900 dark:text-white transition-all"
                required
                autoFocus
                autoComplete="email"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={state.loading || state.cooldownSec > 0}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-bold rounded-xl border-none cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40"
          >
            {state.loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Mengirim...
              </>
            ) : state.cooldownSec > 0 ? (
              `Kirim Ulang dalam ${state.cooldownSec}s`
            ) : (
              'Kirim Link Reset Password'
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
      )}
    </div>
  );
};

export default ForgotPasswordForm;
