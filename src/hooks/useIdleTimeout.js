import { useEffect, useRef } from 'react';

/**
 * Hook untuk memantau aktivitas pengguna dan melakukan logout otomatis 
 * jika pengguna tidak aktif (idle) dalam durasi tertentu.
 * 
 * @param {Function} onIdle - Fungsi yang akan dijalankan saat user idle
 * @param {number} timeoutMs - Batas waktu idle dalam milidetik (Default: 60 Menit)
 */
export const useIdleTimeout = (onIdle, timeoutMs = 3600000) => {
  const timerRef = useRef(null);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onIdle();
    }, timeoutMs);
  };

  useEffect(() => {
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

    // Cleanup saat unmount
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [onIdle, timeoutMs]);

  return null;
};
