import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/authService";
import { sanitizeText, sanitizeEmail, isValidEmail, isValidName, validatePasswordStrength } from "../../../utils/sanitize";

/**
 * Hook to manage the logic of the Registration Form.
 * Handles password strength validation, input sanitization, and redirect logic.
 */
export const useRegister = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    isCompany: false,
  });

  // [H-1] Track redirect timer dengan ref supaya bisa cleanup saat unmount
  const redirectTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, []);

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const setAccountType = (isCompany) => {
    setFormData((prev) => ({ ...prev, isCompany }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    // Client-side Validation: Matching Passwords
    if (formData.password !== formData.confirmPassword) {
      setError("Kata sandi dan konfirmasi sandi tidak cocok.");
      return;
    }

    // Client-side Validation: Password Strength (match backend requirements)
    const passwordValidation = validatePasswordStrength(formData.password);
    if (!passwordValidation.isValid) {
      setError(`Password lemah: ${passwordValidation.errors.join(", ")}.`);
      return;
    }

    // Sanitization
    const cleanName = sanitizeText(formData.name);
    const cleanEmail = sanitizeEmail(formData.email);

    // Name Validation
    if (!isValidName(cleanName)) {
      setError("Nama harus terdiri dari 2 hingga 100 karakter yang valid.");
      return;
    }

    // Email Validation
    if (!isValidEmail(cleanEmail)) {
      setError("Format email tidak valid. Contoh: nama@email.com");
      return;
    }

    setLoading(true);

    try {
      const result = await registerUser({
        name: cleanName,
        email: cleanEmail,
        password: formData.password,
        isCompany: formData.isCompany,
      });

      if (result?.success) {
        setSuccess(result.message || "Registrasi berhasil! Mengarahkan ke halaman login...");
        // Setelah register, redirect ke login. Pending join token (kalau ada
        // di sessionStorage) akan diproses oleh useLogin setelah user login.
        // Konsumer key ini ada di src/config/sessionKeys.js (PENDING_GROUP_JOIN_KEY).
        // [H-1] Track timer ID untuk cleanup di unmount.
        redirectTimerRef.current = setTimeout(() => {
          navigate("/login");
          redirectTimerRef.current = null;
        }, 2000);
      }
    } catch (err) {
      setError(err.message || "Registrasi gagal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmVisibility = () => setShowConfirm(!showConfirm);

  // Derived Values - Use centralized password validation from sanitize.js
  const passwordValidation = formData.password ? validatePasswordStrength(formData.password) : { isValid: false, errors: [] };
  const passwordErrors = passwordValidation.errors;
  const isPasswordValid = formData.password.length > 0 && passwordValidation.isValid;

  return {
    state: {
      formData,
      loading,
      error,
      success,
      showPassword,
      showConfirm,
      passwordErrors,
      isPasswordValid,
    },
    actions: {
      handleFieldChange,
      setAccountType,
      handleRegister,
      togglePasswordVisibility,
      toggleConfirmVisibility,
    },
  };
};
