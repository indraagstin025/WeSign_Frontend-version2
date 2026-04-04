import React from 'react';
import { Mail, Lock, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { useLogin } from '../hooks/useLogin';

/**
 * @component LoginForm
 * @description Formulir login pengguna dengan validasi dan sanitasi terintegrasi.
 * Refaktorisasi: Logika autentikasi & form state dipisahkan ke useLogin hook.
 */
const LoginForm = () => {
  const { state, actions } = useLogin();

  return (
    <form onSubmit={actions.handleLogin} className="flex flex-col gap-5">
      
      {/* Error Banner - Smooth Collapsible */}
      <div className={`transition-all duration-300 overflow-hidden ${state.error ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm font-medium flex items-start gap-2 mb-1">
          <span className="shrink-0 leading-relaxed md:mt-0.5">⚠️</span>
          <span className="leading-relaxed">{state.error}</span>
        </div>
      </div>

      {/* Input Email Group */}
      <div className="flex flex-col gap-1.5 text-left">
        <label className="text-sm font-semibold text-[var(--color-text-main)] ml-1">Alamat Email</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)] group-focus-within:text-primary transition-colors">
            <Mail size={18} />
          </div>
          <input 
            type="email" 
            placeholder="nama@perusahaan.com"
            value={state.email}
            onChange={(e) => actions.setEmail(e.target.value)}
            required
            disabled={state.loading}
            className="w-full pl-10 pr-4 py-3 bg-transparent border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-[var(--color-text-main)] placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Input Password Group */}
      <div className="flex flex-col gap-1.5 mt-2 text-left">
        <div className="flex justify-between items-center ml-1">
          <label className="text-sm font-semibold text-[var(--color-text-main)]">Kata Sandi</label>
          <a href="/forgot-password" className="text-xs font-semibold text-primary hover:underline" tabIndex="-1">Lupa sandi?</a>
        </div>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)] group-focus-within:text-primary transition-colors">
            <Lock size={18} />
          </div>
          <input 
            type={state.showPassword ? "text" : "password"} 
            placeholder="••••••••"
            value={state.password}
            onChange={(e) => actions.setPassword(e.target.value)}
            required
            disabled={state.loading}
            className="w-full pl-10 pr-12 py-3 bg-transparent border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-[var(--color-text-main)] tracking-widest placeholder:tracking-normal placeholder-slate-400 disabled:opacity-50"
          />
          <button 
            type="button"
            onClick={actions.togglePasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--color-text-muted)] hover:text-primary transition-colors cursor-pointer bg-transparent border-none"
            aria-label="Tampilkan sandi"
          >
            {state.showPassword ? <EyeOff size={20} strokeWidth={1.5} /> : <Eye size={20} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Remember Me Checkbox */}
      <div className="flex items-center mt-1 ml-1 cursor-pointer">
        <input 
          type="checkbox" 
          id="remember" 
          checked={state.rememberMe}
          onChange={(e) => actions.setRememberMe(e.target.checked)}
          className="w-4 h-4 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600 accent-primary cursor-pointer"
        />
        <label htmlFor="remember" className="ml-2 text-sm font-medium text-[var(--color-text-muted)] cursor-pointer">
          Ingat perangkat ini
        </label>
      </div>

      {/* Submit Button */}
      <button 
        type="submit" 
        disabled={state.loading}
        className="w-full h-12 bg-primary hover:bg-primary-dark text-white rounded-xl text-md font-bold transition-all shadow-lg shadow-primary/30 mt-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed border-none"
      >
        {state.loading ? (
          <><Loader2 size={18} className="animate-spin" /> Memproses...</>
        ) : (
          <><KeyRound size={18}/> Masuk ke Dashboard</>
        )}
      </button>

      {/* Footer / Switcher */}
      <div className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
        Belum mendaftarkan perusahaan Anda? <br className="lg:hidden"/>
        <a href="/register" className="font-semibold text-primary hover:text-primary-dark ml-1">Buat Akun Gratis 🎉</a>
      </div>
    </form>
  );
};

export default LoginForm;
