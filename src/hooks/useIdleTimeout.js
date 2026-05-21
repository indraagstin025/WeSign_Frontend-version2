import { useEffect, useRef } from 'react';

/**
 * Hook untuk memantau aktivitas pengguna dan melakukan logout otomatis
 * jika pengguna tidak aktif (idle) dalam durasi tertentu.
 *
 * [H-2 fix] Pakai timestamp-based check untuk akurasi saat tab di-background.
 * Browser modern (Chrome/Firefox) throttle setTimeout saat tab inactive
 * (~1 invoke per minute) — tanpa fix ini, user yang switch tab 30 menit
 * lalu kembali bisa melihat timer "stuck" di posisi lama atau drift.
 *
 * Solusi:
 * 1. Catat timestamp aktivitas terakhir (lastActivityRef)
 * 2. setTimeout cuma "scheduler" — saat fire, hitung elapsed dari timestamp
 * 3. Kalau elapsed >= timeoutMs → trigger onIdle
 * 4. Visibilitychange listener: re-check saat tab kembali visible
 *
 * @param {Function} onIdle - Fungsi yang akan dijalankan saat user idle
 * @param {number} timeoutMs - Batas waktu idle dalam milidetik (Default: 60 Menit)
 */
export const useIdleTimeout = (onIdle, timeoutMs = 3600000) => {
  const timerRef = useRef(null);
  // [H-2] Ref di-init dengan 0 (lazy), set ke Date.now() di useEffect supaya
  // tidak panggil impure function di render phase (react-hooks/purity).
  const lastActivityRef = useRef(0);
  const onIdleRef = useRef(onIdle);

  // Capture latest onIdle dalam ref agar tidak butuh masuk dependency
  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  useEffect(() => {
    // Init activity timestamp saat mount
    lastActivityRef.current = Date.now();

    const checkIdle = () => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= timeoutMs) {
        onIdleRef.current?.();
        return;
      }
      // Schedule next check di sisa waktu (atau minimal 1 detik untuk
      // re-validate kalau ada drift)
      const remaining = Math.max(timeoutMs - elapsed, 1000);
      timerRef.current = setTimeout(checkIdle, remaining);
    };

    const resetTimer = () => {
      lastActivityRef.current = Date.now();
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(checkIdle, timeoutMs);
    };

    // Saat tab kembali visible, immediate re-check (jangan tunggu timeout)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (timerRef.current) clearTimeout(timerRef.current);
        checkIdle();
      }
    };

    // List event yang dianggap sebagai "Aktivitas"
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click'
    ];

    // Mulai timer pertama kali
    resetTimer();

    // Tambah listener untuk setiap event
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup saat unmount
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [timeoutMs]);

  return null;
};
