import React from 'react';
import { Mail, Lock, Eye, EyeOff, KeyRound, Loader2, ArrowRight } from 'lucide-react';
import { useLogin } from '../hooks/useLogin';

/**
 * @component LoginForm
 * @description Formulir login pengguna dengan validasi dan sanitasi terintegrasi.
 * Refaktorisasi: Logika autentikasi & form state dipisahkan ke useLogin hook.
 */
const LoginForm = () => {
  const { state, actions } = useLogin();

  return (
    <form onSubmit={actions.handleLogin} className="flex flex-col gap-3">
      
      {/* Error Banner - More Compact */}
      <div className={`transition-all duration-300 overflow-hidden ${state.error ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-2xl px-4 py-2.5 text-[13px] font-medium flex items-start gap-2.5 mb-1">
          <span className="shrink-0 text-sm">⚠️</span>
          <span className="leading-relaxed">{state.error}</span>
        </div>
      </div>

      {/* Input Email Group */}
      <div className="flex flex-col gap-1.5 text-left">
        <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 ml-1 uppercase tracking-wider">Alamat Email</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-primary transition-colors">
            <Mail size={16} />
          </div>
          <input 
            type="email" 
            placeholder="nama@perusahaan.com"
            value={state.email}
            onChange={(e) => actions.setEmail(e.target.value)}
            required
            disabled={state.loading}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 disabled:opacity-50 font-medium text-[13px]"
          />
        </div>
      </div>

      {/* Input Password Group */}
      <div className="flex flex-col gap-1.5 text-left">
        <div className="flex justify-between items-center px-1">
          <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Kata Sandi</label>
          <a href="/forgot-password" className="text-[11px] font-bold text-primary hover:text-primary-dark transition-colors" tabIndex="-1">Lupa sandi?</a>
        </div>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-primary transition-colors">
            <Lock size={16} />
          </div>
          <input 
            type={state.showPassword ? "text" : "password"} 
            placeholder="••••••••"
            value={state.password}
            onChange={(e) => actions.setPassword(e.target.value)}
            required
            disabled={state.loading}
            className="w-full pl-10 pr-12 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-zinc-900 dark:text-white tracking-widest placeholder:tracking-normal placeholder-zinc-400 disabled:opacity-50 font-medium text-[13px]"
          />
          <button 
            type="button"
            onClick={actions.togglePasswordVisibility}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-primary transition-colors cursor-pointer bg-transparent border-none"
            aria-label="Tampilkan sandi"
          >
            {state.showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Remember Me Checkbox */}
      <div className="flex items-center ml-1 cursor-pointer group">
        <input 
          type="checkbox" 
          id="remember" 
          checked={state.rememberMe}
          onChange={(e) => actions.setRememberMe(e.target.checked)}
          className="w-3.5 h-3.5 text-primary bg-zinc-100 border-zinc-300 rounded focus:ring-primary focus:ring-offset-0 dark:bg-zinc-700 dark:border-zinc-600 accent-primary cursor-pointer"
        />
        <label htmlFor="remember" className="ml-2.5 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 cursor-pointer group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
          Ingat perangkat ini
        </label>
      </div>

      {/* Submit Button */}
      <button 
        type="submit" 
        disabled={state.loading}
        className="w-full h-12 bg-primary hover:bg-primary-dark text-white rounded-full text-[15px] font-bold transition-all shadow-lg shadow-primary/20 mt-1 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed border-none group"
      >
        {state.loading ? (
          <><Loader2 size={18} className="animate-spin" /> Memproses...</>
        ) : (
          <>
            <KeyRound size={18} className="group-hover:rotate-12 transition-transform" /> 
            Masuk ke Dashboard
          </>
        )}
      </button>

      {/* Footer / Switcher */}
      <div className="mt-2 text-center text-[13px] text-zinc-500 font-medium">
        Belum punya akun?
        <a href="/register" className="font-bold text-primary hover:text-primary-dark ml-2 transition-colors inline-flex items-center gap-1">
          Daftar Gratis <ArrowRight size={12} />
        </a>
      </div>
    </form>
  );
};

export default LoginForm;
