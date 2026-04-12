import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../api/authService';
import { sanitizeEmail, isValidEmail } from '../../../utils/sanitize';
import { useUser } from '../../../context/UserContext';

/**
 * Hook to manage the logic of the Login Form.
 * Handles input sanitization, client-side validation, and navigation redirect.
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
  const from = location.state?.from?.pathname || '/dashboard';

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
        await refreshUser();
        
        // Successful login -> redirect
        navigate(from, { replace: true });
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
