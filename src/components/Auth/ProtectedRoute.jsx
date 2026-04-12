/**
 * @file ProtectedRoute.jsx
 * @description Auth Guard + Auto-Expiry Timer + Backend Integrity Check.
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import ConfirmModal from '../UI/ConfirmModal';
import { ShieldCheck, Loader2, Clock } from 'lucide-react';
import { useIdleTimeout } from '../../hooks/useIdleTimeout';
import { useUser } from '../../context/UserContext';

const SESSION_MAX_AGE = 10 * 60 * 60 * 1000; // 10 jam (PRODUKSI)

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('wesign_token');
  const refreshToken = localStorage.getItem('wesign_refresh_token');
  const loginAt = localStorage.getItem('wesign_login_at');
  const location = useLocation();
  const navigate = useNavigate();
  const timerRef = useRef(null);
  
  const { user, loading: isUserLoading, clearUser } = useUser();
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "Sesi Anda Telah Berakhir",
    message: "Demi keamanan, sesi aktif Anda telah berakhir karena melewati batas waktu. Silakan login kembali."
  });
  
  // Validasi jika ada token ATAU ada refresh token (untuk silent refresh di awal)
  const [isValidating, setIsValidating] = useState(true); 

  const clearSession = useCallback(() => {
    // Hanya hapus keys terkait autentikasi, bukan SEMUA localStorage
    localStorage.removeItem('wesign_token');
    localStorage.removeItem('wesign_refresh_token');
    localStorage.removeItem('wesign_csrf_token');
    localStorage.removeItem('wesign_user');
    localStorage.removeItem('wesign_login_at');
  }, []);

  const handleExpiredConfirm = useCallback(() => {
    clearUser(); // Bersihkan context
    clearSession(); // Bersihkan localStorage
    setShowExpiredModal(false);
    navigate('/login', { replace: true });
  }, [clearSession, clearUser, navigate]);

  // --- IDLE TIMEOUT: AUTO-LOGOUT SETELAH 1 JAM (TEST: 10 DETIK) ---
  const handleIdle = useCallback(() => {
    if (!token) return;
    setModalConfig({
      title: "Sesi Berakhir (Tidak Aktif)",
      message: "Akun Anda otomatis keluar karena tidak ada aktivitas terdeteksi selama 1 jam demi keamanan dokumen WeSign Anda."
    });
    setShowExpiredModal(true);
  }, [token]);

  useIdleTimeout(handleIdle, 3600000); // 1 JAM (Produksi)

  // Efek 1: Validasi Integritas Token dengan Backend saat pertama kali mount
  // Efek 1: Sinkronisasi status validasi dengan UserContext
  useEffect(() => {
    if (!isUserLoading) {
      // Jika loading context selesai, kita cek apakah user berhasil didapat
      if (!user && (token || refreshToken)) {
        // Jika ada token tapi user null, berarti session bermasalah
        clearSession();
        navigate('/login', { state: { from: location }, replace: true });
      }
      setIsValidating(false);
    }
  }, [isUserLoading, user, token, refreshToken, clearSession, navigate, location]);

  // Efek 2: Timer Auto-Expiry (Lama Sesi Total)
  useEffect(() => {
    if (!token || !loginAt || isValidating) return;

    const loginTime = parseInt(loginAt, 10);
    const elapsed = Date.now() - loginTime;
    const remaining = SESSION_MAX_AGE - elapsed;

    if (remaining <= 0) {
      setModalConfig({
        title: "Sesi Berakhir (Batas Waktu)",
        message: "Sesi login Anda (10 jam) telah habis. Silakan login kembali untuk melanjutkan."
      });
      setShowExpiredModal(true);
      return;
    }

    timerRef.current = setTimeout(() => {
       setModalConfig({
        title: "Sesi Berakhir (Batas Waktu)",
        message: "Sesi login Anda (10 jam) telah habis. Silakan login kembali untuk melanjutkan."
      });
      setShowExpiredModal(true);
    }, remaining);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [token, loginAt, isValidating]);

  // ... Screener Loading & Redirect logic (tetap sama) ...
  // 1. Screener Validasi (PENTING: Harus cek isValidating dulu sebelum cek !token)
  if (isValidating) {
    return (
      <div className="fixed inset-0 bg-slate-50 dark:bg-[#0B1120] flex flex-col items-center justify-center z-[9999]">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
           <div className="relative">
              <ShieldCheck size={48} className="text-primary animate-pulse" />
              <div className="absolute -bottom-1 -right-1">
                <Loader2 size={20} className="text-primary animate-spin" />
              </div>
           </div>
           <div className="text-center px-4">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading tracking-tight">Menyiapkan Ruang Kerja</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400">Verifikasi pemulihan sesi keamanan...</p>
           </div>
        </div>
      </div>
    );
  }

  // 2. Jika mutlak tidak ada token dan sudah selesai validasi
  if (!token && !refreshToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <>
      {children}

      {/* Modal Notifikasi Sesi Berakhir (Idle / Max Age) */}
      <ConfirmModal
        isOpen={showExpiredModal}
        onClose={handleExpiredConfirm}
        onConfirm={handleExpiredConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText="Login Kembali"
        cancelText={null}
        variant="warning"
        loading={false}
        showClose={false}
        icon={<Clock className="text-orange-500" size={40} />}
      />
    </>
  );
};

export default ProtectedRoute;
