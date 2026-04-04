import React from 'react';
import { Mail, Lock, Eye, EyeOff, User, Building2, UserPlus, Loader2, CheckCircle } from 'lucide-react';
import { useRegister } from '../hooks/useRegister';

/**
 * @component RegisterForm
 * @description Formulir pendaftaran pengguna baru dengan validasi kekuatan sandi.
 * Refaktorisasi: Logika registrasi & form state dipisahkan ke useRegister hook.
 */
const RegisterForm = () => {
  const { state, actions } = useRegister();

  return (
    <form onSubmit={actions.handleRegister} className="flex flex-col gap-4">
      
      {/* Error Banner - Smooth Collapsible */}
      <div className={`transition-all duration-300 overflow-hidden ${state.error ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm font-medium flex items-start gap-2 mb-1">
          <span className="shrink-0 leading-relaxed md:mt-0.5">⚠️</span>
          <span className="leading-relaxed">{state.error}</span>
        </div>
      </div>

      {/* Success Banner */}
      {state.success && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
          <CheckCircle size={16} /> {state.success}
        </div>
      )}

      {/* Tipe Akun Toggle */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-2">
        <button 
          type="button"
          onClick={() => actions.setAccountType(false)}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg flex justify-center items-center gap-2 transition-all cursor-pointer border-none ${!state.formData.isCompany ? 'bg-white dark:bg-slate-600 shadow text-primary' : 'bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
        >
          <User size={16}/> Personal
        </button>
        <button 
          type="button"
          onClick={() => actions.setAccountType(true)}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg flex justify-center items-center gap-2 transition-all cursor-pointer border-none ${state.formData.isCompany ? 'bg-white dark:bg-slate-600 shadow text-primary' : 'bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
        >
          <Building2 size={16}/> Perusahaan
        </button>
      </div>

      {/* Input Nama Lengkap / Perusahaan */}
      <div className="flex flex-col gap-1.5 text-left">
        <label className="text-sm font-semibold text-[var(--color-text-main)] ml-1">
          {state.formData.isCompany ? "Nama Perusahaan" : "Nama Lengkap"}
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)] group-focus-within:text-primary transition-colors">
            {state.formData.isCompany ? <Building2 size={18} /> : <User size={18} />}
          </div>
          <input 
            type="text" 
            name="name"
            placeholder={state.formData.isCompany ? "PT Sejahtera Amanosa" : "Budi Santoso"}
            value={state.formData.name}
            onChange={actions.handleFieldChange}
            required
            disabled={state.loading}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-[var(--color-text-main)] placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Input Email */}
      <div className="flex flex-col gap-1.5 text-left">
        <label className="text-sm font-semibold text-[var(--color-text-main)] ml-1">Alamat Email</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)] group-focus-within:text-primary transition-colors">
            <Mail size={18} />
          </div>
          <input 
            type="email" 
            name="email"
            placeholder="nama@email.com"
            value={state.formData.email}
            onChange={actions.handleFieldChange}
            required
            disabled={state.loading}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-[var(--color-text-main)] placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Password Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        {/* Buat Sandi */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[var(--color-text-main)] ml-1">Buat Sandi</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)] group-focus-within:text-primary transition-colors">
              <Lock size={18} />
            </div>
            <input 
              type={state.showPassword ? "text" : "password"} 
              name="password"
              placeholder="••••••••"
              value={state.formData.password}
              onChange={actions.handleFieldChange}
              required
              disabled={state.loading}
              className="w-full pl-10 pr-10 py-2.5 bg-transparent border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-[var(--color-text-main)] tracking-widest placeholder:tracking-normal placeholder-slate-400 text-sm disabled:opacity-50"
            />
            <button 
              type="button"
              onClick={actions.togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--color-text-muted)] hover:text-primary transition-colors cursor-pointer bg-transparent border-none"
              tabIndex="-1"
            >
              {state.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Konfirmasi Sandi */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[var(--color-text-main)] ml-1">Ketik Ulang Sandi</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)] group-focus-within:text-primary transition-colors">
              <Lock size={18} />
            </div>
            <input 
              type={state.showConfirm ? "text" : "password"} 
              name="confirmPassword"
              placeholder="••••••••"
              value={state.formData.confirmPassword}
              onChange={actions.handleFieldChange}
              required
              disabled={state.loading}
              className="w-full pl-10 pr-10 py-2.5 bg-transparent border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-[var(--color-text-main)] tracking-widest placeholder:tracking-normal placeholder-slate-400 text-sm disabled:opacity-50"
            />
            <button 
              type="button"
              onClick={actions.toggleConfirmVisibility}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--color-text-muted)] hover:text-primary transition-colors cursor-pointer bg-transparent border-none"
              tabIndex="-1"
            >
              {state.showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Password Strength Indicator */}
      {state.formData.password && (
        <div className="ml-1 flex flex-wrap gap-2 text-xs">
          {[
            { label: '8+ karakter', valid: state.formData.password.length >= 8 },
            { label: 'Huruf besar', valid: /[A-Z]/.test(state.formData.password) },
            { label: 'Huruf kecil', valid: /[a-z]/.test(state.formData.password) },
            { label: 'Angka', valid: /[0-9]/.test(state.formData.password) },
          ].map((rule, i) => (
            <span key={i} className={`px-2 py-0.5 rounded-full font-medium transition-colors ${rule.valid ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
              {rule.valid ? '✓' : '○'} {rule.label}
            </span>
          ))}
        </div>
      )}

      {/* Term of Service */}
      <div className="flex items-start mt-2 ml-1 cursor-pointer">
        <input type="checkbox" id="tos" required className="w-4 h-4 mt-0.5 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600 accent-primary cursor-pointer"/>
        <label htmlFor="tos" className="ml-2 text-xs font-medium text-[var(--color-text-muted)] cursor-pointer leading-tight text-left">
          Saya menyetujui Ketentuan Layanan, Kebijakan Privasi, dan Pemrosesan Dokumen Elektronik menurut payung hukum WeSign.
        </label>
      </div>

      {/* Submit Button */}
      <button 
        type="submit" 
        disabled={state.loading || (state.formData.password.length > 0 && !state.isPasswordValid)}
        className="w-full h-12 bg-primary hover:bg-primary-dark text-white rounded-xl text-md font-bold transition-all shadow-lg shadow-primary/30 mt-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed border-none"
      >
        {state.loading ? (
          <><Loader2 size={18} className="animate-spin" /> Menyiapkan Akun...</>
        ) : (
          <><UserPlus size={18}/> Buat Akun WeSign</>
        )}
      </button>

      {/* Footer / Switcher */}
      <div className="mt-4 text-center text-sm text-[var(--color-text-muted)]">
        Sudah pernah mendaftar? <br className="lg:hidden"/>
        <a href="/login" className="font-semibold text-primary hover:text-primary-dark ml-1">Jalur Masuk Kembali 🚀</a>
      </div>
    </form>
  );
};

export default RegisterForm;
