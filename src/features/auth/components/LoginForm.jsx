import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../api/authService';
import { sanitizeEmail, isValidEmail } from '../../../utils/sanitize';

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Sanitasi input sebelum dikirim
    const cleanEmail = sanitizeEmail(email);

    // Validasi format email di sisi klien
    if (!isValidEmail(cleanEmail)) {
      setError('Format email tidak valid. Contoh: nama@perusahaan.com');
      return;
    }

    if (!password || password.length < 1) {
      setError('Kata sandi tidak boleh kosong.');
      return;
    }

    setLoading(true);

    try {
      const result = await loginUser({ email: cleanEmail, password });
      
      // Login berhasil → arahkan ke halaman terakhir atau dashboard
      if (result?.success) {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa kembali email dan kata sandi Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-5">
      
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm font-medium animate-pulse">
          ⚠️ {error}
        </div>
      )}

      {/* Input Email Group */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-[var(--color-text-main)] ml-1">Alamat Email</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)] group-focus-within:text-primary transition-colors">
            <Mail size={18} />
          </div>
          <input 
            type="email" 
            placeholder="nama@perusahaan.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full pl-10 pr-4 py-3 bg-transparent border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-[var(--color-text-main)] placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Input Password Group */}
      <div className="flex flex-col gap-1.5 mt-2">
        <div className="flex justify-between items-center ml-1">
          <label className="text-sm font-semibold text-[var(--color-text-main)]">Kata Sandi</label>
          <a href="#" className="text-xs font-semibold text-primary hover:underline" tabIndex="-1">Lupa sandi?</a>
        </div>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)] group-focus-within:text-primary transition-colors">
            <Lock size={18} />
          </div>
          <input 
            type={showPassword ? "text" : "password"} 
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full pl-10 pr-12 py-3 bg-transparent border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-[var(--color-text-main)] tracking-widest placeholder:tracking-normal placeholder-slate-400 disabled:opacity-50"
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--color-text-muted)] hover:text-primary transition-colors cursor-pointer bg-transparent border-none"
            aria-label="Tampilkan sandi"
          >
            {showPassword ? <EyeOff size={20} strokeWidth={1.5} /> : <Eye size={20} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Remember Me Checkbox */}
      <div className="flex items-center mt-1 ml-1 cursor-pointer">
        <input type="checkbox" id="remember" className="w-4 h-4 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600 accent-primary cursor-pointer"/>
        <label htmlFor="remember" className="ml-2 text-sm font-medium text-[var(--color-text-muted)] cursor-pointer">
          Ingat perangkat ini
        </label>
      </div>

      {/* Submit Button */}
      <button 
        type="submit" 
        disabled={loading}
        className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-md font-bold transition-all shadow-lg shadow-primary/30 transform hover:-translate-y-0.5 mt-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
      >
        {loading ? (
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
