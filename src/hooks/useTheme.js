import { useState, useEffect } from 'react';

const THEME_STORAGE_KEY = 'wesign-theme';

export const useTheme = () => {
  // Inisialisasi state secara sinkron agar tidak ada glitch
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme) return storedTheme;

    // Check system preference jika belum ada di storage
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Sinkronisasi DOM saat theme berubah
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  }, [theme]);

  // [M-4] Listen system preference change saat user belum manually set theme.
  // Skenario: user pakai default (auto-follow OS), lalu OS toggle dark mode
  // di siang→malam. Tanpa listener ini, app tidak follow sampai user refresh.
  //
  // Behavior:
  // - Kalau ada wesign-theme di localStorage → user sudah explicit pilih,
  //   jangan override (respect manual preference).
  // - Kalau tidak ada → follow system preference change otomatis.
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemChange = (e) => {
      // Hanya auto-switch kalau user TIDAK punya manual preference
      if (localStorage.getItem(THEME_STORAGE_KEY)) return;
      setTheme(e.matches ? 'dark' : 'light');
    };

    // addEventListener (modern API) — fallback addListener untuk Safari < 14
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
      return () => mediaQuery.removeEventListener('change', handleSystemChange);
    } else {
      mediaQuery.addListener(handleSystemChange);
      return () => mediaQuery.removeListener(handleSystemChange);
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      return newTheme;
    });
  };

  return { theme, toggleTheme };
};
