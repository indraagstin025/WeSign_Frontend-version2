import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../api/authService';
import { sanitizeEmail, isValidEmail } from '../../../utils/sanitize';
import { useUser } from '../../../context/UserContext';
import { PENDING_GROUP_JOIN_KEY } from '../../../config/sessionKeys';

/**
 * Hook to manage the logic of the Login Form.
 * Handles input sanitization, client-side validation, and navigation redirect.
 *
 * Redirect priority (highest to lowest):
 * 1. Pending group join token di sessionStorage → /groups/join?token=...
 * 2. `from` location state (origin URL sebelum di-protect-redirect ke login)
 * 3. Default → /dashboard
 */
export const useLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useUser();
  // [H-3 + M-1] Resolve target path dengan priority:
  // 1. pending join token (cross-flow restore)
  // 2. location.state.from (redirect-back-after-protect)
  // 3. default /dashboard
  //
  // [M-1] Preserve full URL: pathname + search (query string) + hash.
  // Sebelumnya hanya `from.pathname` -> kalau user di "/docs?folder=x#sec"
  // dan dipaksa redirect ke /login, setelah login redirect-back hanya
  // sampai /docs (kehilangan query + scroll position via hash).
  const fromState = location.state?.from;
  const fromPath = fromState
    ? `${fromState.pathname || '/dashboard'}${fromState.search || ''}${fromState.hash || ''}`
    : '/dashboard';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Sanitization
    const cleanEmail = sanitizeEmail(email);

    // Client-side Validation
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
      const result = await loginUser({ email: cleanEmail, password, rememberMe });
      
      if (result?.success) {
        // [PENTING] Sinkronkan UserContext dengan token baru di localStorage
        // GuestRoute akan otomatis redirect ke /groups/join jika ada pending join token,
        // atau ke /dashboard jika tidak ada.
        await refreshUser();

        // [H-3] Resolve redirect target dengan priority eksplisit:
        // 1. Pending group join token (cross-flow restore) — user klik link
        //    invite saat belum login, token disimpan di sessionStorage.
        // 2. location.state.from — origin URL sebelum diredirect ke /login.
        // 3. Default /dashboard.
        // Catatan: GuestRoute biasanya yang handle redirect duluan, ini fallback
        // untuk kasus user manual login dari /login langsung.
        const pendingJoinToken = sessionStorage.getItem(PENDING_GROUP_JOIN_KEY);
        if (pendingJoinToken) {
          navigate(`/groups/join?token=${encodeURIComponent(pendingJoinToken)}`, { replace: true });
        } else {
          navigate(fromPath, { replace: true });
        }
      }
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa kembali email dan kata sandi Anda.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(prev => !prev);

  return {
    state: {
      email,
      password,
      rememberMe,
      showPassword,
      loading,
      error
    },
    actions: {
      setEmail,
      setPassword,
      setRememberMe,
      togglePasswordVisibility,
      handleLogin
    }
  };
};
