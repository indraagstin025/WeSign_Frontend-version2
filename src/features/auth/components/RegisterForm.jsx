import React from 'react';
import { Mail, Lock, Eye, EyeOff, User, Building2, UserPlus, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { useRegister } from '../hooks/useRegister';

/**
 * @component RegisterForm
 * @description Formulir pendaftaran pengguna baru dengan validasi kekuatan sandi.
 * Refaktorisasi: Logika registrasi & form state dipisahkan ke useRegister hook.
 */
const RegisterForm = () => {
  const { state, actions } = useRegister();

  return (
    <form onSubmit={actions.handleRegister} className="flex flex-col gap-3">
      
      {/* Error Banner - More Compact */}
      <div className={`transition-all duration-300 overflow-hidden ${state.error ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-2xl px-4 py-2.5 text-[13px] font-medium flex items-start gap-2.5 mb-1">
          <span className="shrink-0 text-sm">⚠️</span>
          <span className="leading-relaxed">{state.error}</span>
        </div>
      </div>

      {/* Success Banner */}
      {state.success && (
        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 rounded-2xl px-4 py-2.5 text-[13px] font-medium flex items-center gap-2.5 mb-1">
          <CheckCircle size={16} /> {state.success}
        </div>
      )}

      {/* Tipe Akun Toggle - Slimmer */}
      <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl mb-1">
        <button 
          type="button"
          onClick={() => actions.setAccountType(false)}
          className={`flex-1 py-1.5 text-[13px] font-bold rounded-lg flex justify-center items-center gap-2 transition-all cursor-pointer border-none ${!state.formData.isCompany ? 'bg-white dark:bg-zinc-700 shadow-sm text-primary' : 'bg-transparent text-zinc-500 hover:text-zinc-700'}`}
        >
          <User size={14}/> Personal
        </button>
        <button 
          type="button"
          onClick={() => actions.setAccountType(true)}
          className={`flex-1 py-1.5 text-[13px] font-bold rounded-lg flex justify-center items-center gap-2 transition-all cursor-pointer border-none ${state.formData.isCompany ? 'bg-white dark:bg-zinc-700 shadow-sm text-primary' : 'bg-transparent text-zinc-500 hover:text-zinc-700'}`}
        >
          <Building2 size={14}/> Perusahaan
        </button>
      </div>

      {/* Grid Utama (Nama & Email Side-by-Side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-left">
        {/* Input Nama */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 ml-1 uppercase tracking-wider">
            {state.formData.isCompany ? "Nama Perusahaan" : "Nama Lengkap"}
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-primary transition-colors">
              {state.formData.isCompany ? <Building2 size={16} /> : <User size={16} />}
            </div>
            <input 
              type="text" 
              name="name"
              placeholder={state.formData.isCompany ? "PT Sejahtera Amanosa" : "Budi Santoso"}
              value={state.formData.name}
              onChange={actions.handleFieldChange}
              required
              disabled={state.loading}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-zinc-900 dark:text-white placeholder-zinc-400 text-[13px] font-medium"
            />
          </div>
        </div>

        {/* Input Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 ml-1 uppercase tracking-wider">Alamat Email</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-primary transition-colors">
              <Mail size={16} />
            </div>
            <input 
              type="email" 
              name="email"
              placeholder="nama@email.com"
              value={state.formData.email}
              onChange={actions.handleFieldChange}
              required
              disabled={state.loading}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-zinc-900 dark:text-white placeholder-zinc-400 text-[13px] font-medium"
            />
          </div>
        </div>
      </div>

      {/* Password Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-left">
        {/* Buat Sandi */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 ml-1 uppercase tracking-wider">Buat Sandi</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-primary transition-colors">
              <Lock size={16} />
            </div>
            <input 
              type={state.showPassword ? "text" : "password"} 
              name="password"
              placeholder="••••••••"
              value={state.formData.password}
              onChange={actions.handleFieldChange}
              required
              disabled={state.loading}
              className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-zinc-900 dark:text-white tracking-widest placeholder:tracking-normal placeholder-zinc-400 text-[13px] disabled:opacity-50 font-medium"
            />
            <button 
              type="button"
              onClick={actions.togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-primary transition-colors cursor-pointer bg-transparent border-none"
              tabIndex="-1"
            >
              {state.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Konfirmasi Sandi */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 ml-1 uppercase tracking-wider">Konfirmasi</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-primary transition-colors">
              <Lock size={16} />
            </div>
            <input 
              type={state.showConfirm ? "text" : "password"} 
              name="confirmPassword"
              placeholder="••••••••"
              value={state.formData.confirmPassword}
              onChange={actions.handleFieldChange}
              required
              disabled={state.loading}
              className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-zinc-900 dark:text-white tracking-widest placeholder:tracking-normal placeholder-zinc-400 text-[13px] disabled:opacity-50 font-medium"
            />
            <button 
              type="button"
              onClick={actions.toggleConfirmVisibility}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-primary transition-colors cursor-pointer bg-transparent border-none"
              tabIndex="-1"
            >
              {state.showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Password Strength Indicator - Minimalist */}
      {state.formData.password && (
        <div className="ml-1 flex flex-wrap gap-2 text-[10px]">
          {[
            { label: '8+ Karakter', valid: state.formData.password.length >= 8 },
            { label: 'A-Z', valid: /[A-Z]/.test(state.formData.password) },
            { label: 'a-z', valid: /[a-z]/.test(state.formData.password) },
            { label: '0-9', valid: /[0-9]/.test(state.formData.password) },
          ].map((rule, i) => (
            <span key={i} className={`px-2 py-0.5 rounded-full font-bold transition-all ${rule.valid ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-zinc-100 text-zinc-400 opacity-60'}`}>
              {rule.valid ? '✓' : '○'} {rule.label}
            </span>
          ))}
        </div>
      )}

      {/* Term of Service - Compact */}
      <div className="flex items-start mt-1 ml-1 cursor-pointer group">
        <input type="checkbox" id="tos" required className="w-3.5 h-3.5 mt-0.5 text-primary bg-zinc-100 border-zinc-300 rounded focus:ring-primary focus:ring-offset-0 accent-primary cursor-pointer"/>
        <label htmlFor="tos" className="ml-2.5 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 cursor-pointer leading-tight text-left group-hover:text-zinc-700 transition-colors">
          Saya menyetujui Ketentuan Layanan, Kebijakan Privasi, dan Pemrosesan Dokumen Elektronik WeSign.
        </label>
      </div>

      {/* Submit Button - Slimmer */}
      <button 
        type="submit" 
        disabled={state.loading || (state.formData.password.length > 0 && !state.isPasswordValid)}
        className="w-full h-12 bg-primary hover:bg-primary-dark text-white rounded-full text-[15px] font-bold transition-all shadow-lg shadow-primary/20 mt-1 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed border-none group"
      >
        {state.loading ? (
          <><Loader2 size={18} className="animate-spin" /> Memproses...</>
        ) : (
          <>
            <UserPlus size={18} className="group-hover:scale-110 transition-transform" /> 
            Buat Akun WeSign
          </>
        )}
      </button>

      {/* Footer / Switcher */}
      <div className="mt-2 text-center text-[13px] text-zinc-500 font-medium">
        Sudah punya akun?
        <a href="/login" className="font-bold text-primary hover:text-primary-dark ml-2 transition-colors">
          Masuk Sekarang <ArrowRight size={12} className="inline ml-1" />
        </a>
      </div>
    </form>
  );
};

export default RegisterForm;
