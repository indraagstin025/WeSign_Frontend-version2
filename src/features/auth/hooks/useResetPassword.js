import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/authService';
import { validatePasswordStrength } from '../../../utils/sanitize';

/**
 * Hook untuk mengelola logika form Reset Password.
 * Token diambil dari URL query param `?token=xxx`.
 */
export const useResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Token reset password tidak ditemukan. Silakan request ulang dari halaman Lupa Password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.');
      return;
    }

    const validation = validatePasswordStrength(password);
    if (!validation.isValid) {
      setError(`Password lemah: ${validation.errors.join(', ')}.`);
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(token, password);
      setSuccess(result?.message || 'Password berhasil direset. Silakan login dengan password baru.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Gagal mereset password. Link mungkin sudah kadaluarsa.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  // Derived
  const passwordValidation = password ? validatePasswordStrength(password) : { isValid: false, errors: [] };
  const isPasswordValid = password.length > 0 && passwordValidation.isValid;

  return {
    state: {
      token,
      password,
      confirmPassword,
      showPassword,
      loading,
      error,
      success,
      passwordErrors: passwordValidation.errors,
      isPasswordValid,
    },
    actions: {
      setPassword,
      setConfirmPassword,
      togglePasswordVisibility,
      handleSubmit,
    },
  };
};
