import React from 'react';
import { ShieldCheck, Sun, Moon, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const AuthLayout = ({ children, title, subtitle, imageNode, quote }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[var(--color-bg-light)] relative transition-colors duration-300">
      
      {/* Tombol Tolak / Tema (Kanan Atas) */}
      <button 
        onClick={toggleTheme} 
        className="absolute top-6 right-6 lg:top-8 lg:right-10 z-50 p-2.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-all border-none cursor-pointer flex items-center justify-center backdrop-blur-md shadow-sm"
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? <Sun size={20} className="text-primary" /> : <Moon size={20} className="text-[var(--color-text-main)]" />}
      </button>
      
      {/* KIRI - Panel Gambar/Branding (Sembunyi di Mobile) */}
      <div className="hidden lg:flex flex-col justify-between relative bg-primary-darker text-white p-12 overflow-hidden">
        {/* Dekorasi Visual Background */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" style={{ mixBlendMode: 'overlay' }}></div>
        <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] bg-primary rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-accent rounded-full blur-[120px] opacity-20"></div>

        {/* Header Kiri */}
        <div className="relative z-10">
          <a href="/" className="flex items-center gap-3 w-fit text-white hover:opacity-80 transition-opacity no-underline">
            <ShieldCheck size={36} strokeWidth={2.5} />
            <span className="text-3xl font-heading font-bold tracking-tight">WeSign</span>
          </a>
        </div>

        {/* Konten Kustom Tengah-Kiri */}
        <div className="relative z-10 flex flex-col justify-center h-full">
          {imageNode && <div className="mb-8">{imageNode}</div>}
          <div className="space-y-4 max-w-lg">
            <h2 className="text-4xl font-heading font-bold leading-tight">{quote?.title || "Legalitas Tanpa Batas"}</h2>
            <p className="text-lg opacity-80 leading-relaxed font-sans">{quote?.body || "Infrastruktur penandatanganan elektronik terenkripsi dan teraman se-Indonesia."}</p>
          </div>
        </div>

        {/* Footer Kiri */}
        <div className="relative z-10 text-sm opacity-60">
          © {new Date().getFullYear()} WeSign Technologies. Sistem TTD Digital Tersertifikasi.
        </div>
      </div>

      {/* KANAN - Panel Interaksi Formulir */}
      <div className="flex flex-col justify-center items-center pt-24 pb-12 px-5 sm:px-12 lg:p-20 relative w-full min-h-screen lg:min-h-0">
        {/* Tombol Back to Home (Semua Layar) */}
        <div className="absolute top-6 left-5 lg:left-8 flex items-center gap-2">
          <a href="/" className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-primary transition-colors no-underline font-semibold bg-transparent px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
            <ArrowLeft size={18} /> Kembali
          </a>
        </div>

        <div className="w-full max-w-md">
          {/* Header Form */}
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-3 tracking-tight text-[var(--color-text-main)]">
              {title}
            </h1>
            <p className="text-[var(--color-text-muted)] text-base">
              {subtitle}
            </p>
          </div>

          {/* Render Komponen Form Spesifik (Dari Child) */}
          <div className="glass-panel p-6 sm:p-10 shadow-[0_20px_50px_rgba(41,181,122,0.1)] bg-[var(--color-bg-light)] border border-slate-200 dark:border-slate-800 relative z-10">
             {children}
          </div>
        </div>
      </div>

    </div>
  );
};

export default AuthLayout;
