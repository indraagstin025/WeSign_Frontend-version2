import { useState } from 'react';
import { forgotPassword } from '../api/authService';
import { sanitizeEmail, isValidEmail } from '../../../utils/sanitize';

/**
 * Hook untuk mengelola logika form Forgot Password.
 */
export const useForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanEmail = sanitizeEmail(email);

    if (!isValidEmail(cleanEmail)) {
      setError('Format email tidak valid. Contoh: nama@perusahaan.com');
      return;
    }

    setLoading(true);

    try {
      const result = await forgotPassword(cleanEmail);
      setSuccess(result?.message || 'Jika email terdaftar, link reset password telah dikirim.');
    } catch {
      // Tetap tampilkan pesan generik untuk keamanan (anti-enumeration)
      setSuccess('Jika email terdaftar, link reset password telah dikirim ke email Anda.');
    } finally {
      setLoading(false);
    }
  };

  return {
    state: { email, loading, error, success },
    actions: { setEmail, handleSubmit },
  };
};
