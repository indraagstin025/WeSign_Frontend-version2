import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api/authService';
import { sanitizeText, sanitizeEmail, isValidEmail, isValidName } from '../../../utils/sanitize';

/**
 * Hook to manage the logic of the Registration Form.
 * Handles password strength validation, input sanitization, and redirect logic.
 */
export const useRegister = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    isCompany: false
  });

  // Password Validation Logic
  const getPasswordErrors = (pw) => {
    const errors = [];
    if (pw.length < 8) errors.push('Minimal 8 karakter');
    if (!/[A-Z]/.test(pw)) errors.push('Harus ada huruf besar (A-Z)');
    if (!/[0-9]/.test(pw)) errors.push('Harus ada angka (0-9)');
    if (!/[a-z]/.test(pw)) errors.push('Harus ada huruf kecil (a-z)');
    return errors;
  };

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const setAccountType = (isCompany) => {
    setFormData(prev => ({ ...prev, isCompany }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    // Client-side Validation: Matching Passwords
    if (formData.password !== formData.confirmPassword) {
      setError('Kata sandi dan konfirmasi sandi tidak cocok.');
      return;
    }

    // Client-side Validation: Password Strength
    const pwErrors = getPasswordErrors(formData.password);
    if (pwErrors.length > 0) {
      setError(`Password lemah: ${pwErrors.join(', ')}.`);
      return;
    }

    // Sanitization
    const cleanName = sanitizeText(formData.name);
    const cleanEmail = sanitizeEmail(formData.email);

    // Name Validation
    if (!isValidName(cleanName)) {
      setError('Nama harus terdiri dari 2 hingga 100 karakter yang valid.');
      return;
    }

    // Email Validation
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
        isCompany: formData.isCompany
      });

      if (result?.success) {
        setSuccess(result.message || 'Registrasi berhasil! Mengarahkan ke halaman login...');
        // Auto-redirect after 2 seconds
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError(err.message || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmVisibility = () => setShowConfirm(!showConfirm);

  // Derived Values
  const passwordErrors = formData.password ? getPasswordErrors(formData.password) : [];
  const isPasswordValid = formData.password.length > 0 && passwordErrors.length === 0;

  return {
    state: {
      formData,
      loading,
      error,
      success,
      showPassword,
      showConfirm,
      passwordErrors,
      isPasswordValid
    },
    actions: {
      handleFieldChange,
      setAccountType,
      handleRegister,
      togglePasswordVisibility,
      toggleConfirmVisibility
    }
  };
};
