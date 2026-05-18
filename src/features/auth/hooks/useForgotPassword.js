import { useState, useEffect } from 'react';
import { forgotPassword } from '../api/authService';
import { sanitizeEmail, isValidEmail } from '../../../utils/sanitize';

/**
 * Konstanta cooldown dan storage key untuk rate-limit client-side.
 * [M-3] Cegah user spam tombol "Kirim Link Reset" yang akan trigger
 * email service backend berkali-kali. Backend punya rate limit per IP,
 * tapi client-side cooldown lebih cepat feedback ke user.
 */
const COOLDOWN_MS = 60_000;
const COOLDOWN_KEY = 'wesign_forgot_password_cooldown_until';

/**
 * Cek sisa waktu cooldown dari sessionStorage. Return ms tersisa atau 0.
 */
function getCooldownRemaining() {
  try {
    const until = parseInt(sessionStorage.getItem(COOLDOWN_KEY) || '0', 10);
    if (!until || Number.isNaN(until)) return 0;
    return Math.max(0, until - Date.now());
  } catch {
    return 0;
  }
}

/**
 * Hook untuk mengelola logika form Forgot Password.
 *
 * [M-3] Tambah rate-limit client-side: setelah submit sukses, simpan
 * timestamp `Date.now() + 60_000` di sessionStorage. Submit berikutnya
 * dalam 60 detik akan ditolak dengan pesan countdown sisa detik.
 *
 * Anti-enumeration: pesan sukses generic dan ditampilkan baik saat
 * email valid (terdaftar) maupun tidak terdaftar — backend juga
 * menerapkan strategi serupa.
 *
 * @returns {{
 *   state: {
 *     email: string,
 *     loading: boolean,
 *     error: string,
 *     success: string,
 *     cooldownSec: number
 *   },
 *   actions: {
 *     setEmail: (value: string) => void,
 *     handleSubmit: (e: import('react').FormEvent) => Promise<void>
 *   }
 * }}
 */
export const useForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cooldownSec, setCooldownSec] = useState(() =>
    Math.ceil(getCooldownRemaining() / 1000)
  );

  // [M-3] Tick countdown setiap detik agar UI menampilkan sisa waktu.
  // Cleanup interval saat unmount atau saat cooldown habis untuk
  // hindari leak.
  useEffect(() => {
    if (cooldownSec <= 0) return;

    const id = setInterval(() => {
      const remaining = Math.ceil(getCooldownRemaining() / 1000);
      setCooldownSec(remaining);
      if (remaining <= 0) clearInterval(id);
    }, 1000);

    return () => clearInterval(id);
  }, [cooldownSec]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // [M-3] Block submit kalau masih dalam window cooldown.
    const remainingMs = getCooldownRemaining();
    if (remainingMs > 0) {
      const remainingSec = Math.ceil(remainingMs / 1000);
      setError(
        `Mohon tunggu ${remainingSec} detik sebelum mengirim ulang. ` +
        `Cek folder spam jika belum menerima email.`
      );
      return;
    }

    const cleanEmail = sanitizeEmail(email);

    if (!isValidEmail(cleanEmail)) {
      setError('Format email tidak valid. Contoh: nama@perusahaan.com');
      return;
    }

    setLoading(true);

    try {
      const result = await forgotPassword(cleanEmail);
      setSuccess(result?.message || 'Jika email terdaftar, link reset password telah dikirim.');
      // [M-3] Set cooldown setelah submit sukses.
      try {
        sessionStorage.setItem(COOLDOWN_KEY, String(Date.now() + COOLDOWN_MS));
      } catch {
        // sessionStorage tidak tersedia (private mode safari di iOS lama)
        // -> skip cooldown, biarkan backend rate limit yang handle.
      }
      setCooldownSec(Math.ceil(COOLDOWN_MS / 1000));
    } catch {
      // Tetap tampilkan pesan generik untuk keamanan (anti-enumeration).
      // Tetap set cooldown — kalau request fail di network, jangan
      // biarkan user spam retry tanpa jeda.
      setSuccess('Jika email terdaftar, link reset password telah dikirim ke email Anda.');
      try {
        sessionStorage.setItem(COOLDOWN_KEY, String(Date.now() + COOLDOWN_MS));
      } catch {
        /* noop */
      }
      setCooldownSec(Math.ceil(COOLDOWN_MS / 1000));
    } finally {
      setLoading(false);
    }
  };

  return {
    state: { email, loading, error, success, cooldownSec },
    actions: { setEmail, handleSubmit },
  };
};
