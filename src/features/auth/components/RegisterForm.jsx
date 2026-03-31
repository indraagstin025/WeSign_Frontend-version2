import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Building2, UserPlus, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api/authService';
import { sanitizeText, sanitizeEmail, isValidEmail, isValidName } from '../../../utils/sanitize';

const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    isCompany: false
  });

  // Validasi password di sisi klien (sinkron dengan backend)
  const getPasswordErrors = (pw) => {
    const errors = [];
    if (pw.length < 8) errors.push('Minimal 8 karakter');
    if (!/[A-Z]/.test(pw)) errors.push('Harus ada huruf besar (A-Z)');
    if (!/[0-9]/.test(pw)) errors.push('Harus ada angka (0-9)');
    if (!/[a-z]/.test(pw)) errors.push('Harus ada huruf kecil (a-z)');
    return errors;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validasi klien: konfirmasi password
    if (formData.password !== formData.confirmPassword) {
      setError('Kata sandi dan konfirmasi sandi tidak cocok.');
      return;
    }

    // Validasi klien: kekuatan password
    const pwErrors = getPasswordErrors(formData.password);
    if (pwErrors.length > 0) {
      setError(`Password lemah: ${pwErrors.join(', ')}.`);
      return;
    }

    // Sanitasi input sebelum dikirim
    const cleanName = sanitizeText(formData.name);
    const cleanEmail = sanitizeEmail(formData.email);

    // Validasi nama
    if (!isValidName(cleanName)) {
      setError('Nama harus terdiri dari 2 hingga 100 karakter yang valid.');
      return;
    }

    // Validasi format email
    if (!isValidEmail(cleanEmail)) {
      setError('Format email tidak valid. Contoh: nama@email.com');
      return;
    }

    setLoading(true);

    try {
      const result = await registerUser({
        name: cleanName,
        email: cleanEmail,
        password: formData.password,
      });

      if (result?.success) {
        setSuccess(result.message || 'Registrasi berhasil! Mengarahkan ke halaman login...');
        // Tunggu 2 detik agar user membaca pesan sebelum redirect
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError(err.message || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const passwordErrors = formData.password ? getPasswordErrors(formData.password) : [];
  const passwordValid = formData.password.length > 0 && passwordErrors.length === 0;

  return (
    <form onSubmit={handleRegister} className="flex flex-col gap-4">
      
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Success Banner */}
      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {/* Tipe Akun Toggle */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-2">
        <button 
          type="button"
          onClick={() => setFormData({...formData, isCompany: false})}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg flex justify-center items-center gap-2 transition-all cursor-pointer border-none ${!formData.isCompany ? 'bg-white dark:bg-slate-600 shadow text-primary' : 'bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
        >
          <User size={16}/> Personal
        </button>
        <button 
          type="button"
          onClick={() => setFormData({...formData, isCompany: true})}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg flex justify-center items-center gap-2 transition-all cursor-pointer border-none ${formData.isCompany ? 'bg-white dark:bg-slate-600 shadow text-primary' : 'bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
        >
          <Building2 size={16}/> Perusahaan
        </button>
      </div>

      {/* Input Nama Lengkap */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-[var(--color-text-main)] ml-1">
          {formData.isCompany ? "Nama Perusahaan" : "Nama Lengkap"}
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)] group-focus-within:text-primary transition-colors">
            {formData.isCompany ? <Building2 size={18} /> : <User size={18} />}
          </div>
          <input 
            type="text" 
            name="name"
            placeholder={formData.isCompany ? "PT Sejahtera Amanosa" : "Budi Santoso"}
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-[var(--color-text-main)] placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Input Email */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-[var(--color-text-main)] ml-1">Alamat Email</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)] group-focus-within:text-primary transition-colors">
            <Mail size={18} />
          </div>
          <input 
            type="email" 
            name="email"
            placeholder="nama@email.com"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-[var(--color-text-main)] placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Password Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Buat Sandi */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[var(--color-text-main)] ml-1">Buat Sandi</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)] group-focus-within:text-primary transition-colors">
              <Lock size={18} />
            </div>
            <input 
              type={showPassword ? "text" : "password"} 
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full pl-10 pr-10 py-2.5 bg-transparent border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-[var(--color-text-main)] tracking-widest placeholder:tracking-normal placeholder-slate-400 text-sm disabled:opacity-50"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--color-text-muted)] hover:text-primary transition-colors cursor-pointer bg-transparent border-none"
              tabIndex="-1"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
              type={showConfirm ? "text" : "password"} 
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full pl-10 pr-10 py-2.5 bg-transparent border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-[var(--color-text-main)] tracking-widest placeholder:tracking-normal placeholder-slate-400 text-sm disabled:opacity-50"
            />
            <button 
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--color-text-muted)] hover:text-primary transition-colors cursor-pointer bg-transparent border-none"
              tabIndex="-1"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Password Strength Indicator */}
      {formData.password && (
        <div className="ml-1 flex flex-wrap gap-2 text-xs">
          {[
            { label: '8+ karakter', valid: formData.password.length >= 8 },
            { label: 'Huruf besar', valid: /[A-Z]/.test(formData.password) },
            { label: 'Huruf kecil', valid: /[a-z]/.test(formData.password) },
            { label: 'Angka', valid: /[0-9]/.test(formData.password) },
          ].map((rule, i) => (
            <span key={i} className={`px-2 py-0.5 rounded-full font-medium ${rule.valid ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
              {rule.valid ? '✓' : '○'} {rule.label}
            </span>
          ))}
        </div>
      )}

      {/* Term of Service */}
      <div className="flex items-start mt-2 ml-1 cursor-pointer">
        <input type="checkbox" id="tos" required className="w-4 h-4 mt-0.5 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600 accent-primary cursor-pointer"/>
        <label htmlFor="tos" className="ml-2 text-xs font-medium text-[var(--color-text-muted)] cursor-pointer leading-tight">
          Saya menyetujui Ketentuan Layanan, Kebijakan Privasi, dan Pemrosesan Dokumen Elektronik menurut payung hukum WeSign.
        </label>
      </div>

      {/* Submit Button */}
      <button 
        type="submit" 
        disabled={loading}
        className="w-full mt-3 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-md font-bold transition-all shadow-lg shadow-primary/30 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
      >
        {loading ? (
          <><Loader2 size={18} className="animate-spin" /> Mendaftarkan...</>
        ) : (
          <><UserPlus size={18}/> Daftarkan Akun Baru</>
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
