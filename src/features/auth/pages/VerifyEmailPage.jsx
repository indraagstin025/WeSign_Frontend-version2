import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import AuthLayout from '../../../components/Layout/AuthLayout';
import { verifyEmail } from '../../auth/api/authService';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('Memverifikasi email Anda...');
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token verifikasi tidak ditemukan di URL.');
      return;
    }

    if (hasFetched.current) return;
    hasFetched.current = true;

    const doVerify = async () => {
      try {
        const response = await verifyEmail(token);
        setStatus('success');
        setMessage(response?.message || 'Email Anda berhasil diverifikasi!');
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Verifikasi gagal. Link mungkin sudah kedaluwarsa.');
      }
    };

    doVerify();
  }, [token]);

  return (
    <AuthLayout
      title="Verifikasi Keamanan"
      subtitle="Kami sedang memverifikasi identitas Anda untuk memastikan keamanan akun."
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-5">
        
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-2 shadow-inner">
              <Loader2 size={32} className="animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Memproses...</h3>
            <p className="text-[14px] text-zinc-600 dark:text-zinc-400 max-w-sm leading-relaxed">
              {message}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-2 shadow-inner">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Verifikasi Berhasil!</h3>
            <p className="text-[14px] text-zinc-600 dark:text-zinc-400 max-w-sm leading-relaxed">
              {message}
            </p>
            <div className="pt-4 w-full">
              <Link to="/login" className="flex items-center justify-center gap-2 bg-primary text-white py-3 px-6 rounded-xl font-bold hover:bg-primary-dark transition-all text-[14px] shadow-lg shadow-primary/20">
                Lanjutkan ke Login <ArrowRight size={16} />
              </Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-2 shadow-inner">
              <XCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Verifikasi Gagal</h3>
            <p className="text-[14px] text-zinc-600 dark:text-zinc-400 max-w-sm leading-relaxed">
              {message}
            </p>
            <div className="pt-4 w-full flex flex-col gap-3">
              <Link to="/login" className="flex items-center justify-center gap-2 bg-primary text-white py-3 px-6 rounded-xl font-bold hover:bg-primary-dark transition-all text-[14px] shadow-lg shadow-primary/20">
                Kembali ke Login
              </Link>
              <Link to="/register" className="text-[13px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors">
                Daftar Ulang Akun Baru
              </Link>
            </div>
          </>
        )}

      </div>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
