import { useState, useEffect } from 'react';

export const useTheme = () => {
  // Inisialisasi state secara sinkron agar tidak ada glitch
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('wesign-theme');
    if (storedTheme) return storedTheme;
    
    // Check system preference jika belum ada di storage
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Sinkronisasi DOM saat mount pertama kali (hanya untuk memastikan, 
  // blocking script di index.html sudah menanganinya ditiap refresh)
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

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('wesign-theme', newTheme);
      return newTheme;
    });
  };

  return { theme, toggleTheme };
};
