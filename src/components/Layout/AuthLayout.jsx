import React from 'react';
import { Feather, Sun, Moon, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';

const AuthLayout = ({ children, title, subtitle, imageNode, quote, maxWidth = "max-w-[440px]" }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 lg:p-8 relative overflow-hidden transition-colors duration-300">
      {/* Background Decorations (Wavy shapes like reference) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Tombol Tema (Floating) */}
      <button 
        onClick={toggleTheme} 
        className="absolute top-6 right-6 z-50 w-11 h-11 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-lg"
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-zinc-600" />}
      </button>

      {/* KONTEN UTAMA (KARTU BESAR 30/70) */}
      <div className="w-full max-w-7xl min-h-[550px] bg-white dark:bg-zinc-900 rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-zinc-200 dark:border-zinc-800 flex flex-col lg:flex-row overflow-hidden relative z-10 transition-all duration-500 transform scale-[0.95]">
        
        {/* KIRI - Panel Branding (30%) */}
        <div className="lg:w-[30%] relative bg-primary dark:bg-zinc-900 text-white p-8 flex flex-col justify-between overflow-hidden border-r border-white/5">
          {/* Dekorasi Visual Background */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-0 w-full h-full bg-black/10"></div>
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:20px_20px]"></div>
          </div>

          {/* 1. Header (Logo) */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <Feather size={28} className="text-white" strokeWidth={2.5} />
              <span className="text-2xl font-dancing font-bold tracking-tight">WeSign</span>
            </div>
          </div>

          {/* 2. Center Content */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-6 flex-1 py-12">
            {imageNode ? (
              <div className="w-full transition-transform hover:scale-105 duration-500">
                {imageNode}
              </div>
            ) : (
              <div className="p-8 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 shadow-2xl">
                <ShieldCheck size={80} strokeWidth={1} className="text-white opacity-90" />
              </div>
            )}
            <div className="space-y-3 px-2">
              <h2 className="text-2xl font-heading font-bold tracking-tight leading-tight">
                {quote?.title || "Legalitas Terpercaya"}
              </h2>
              <p className="text-sm text-white/70 leading-relaxed font-light">
                {quote?.body || "Kelola dokumen Anda dalam satu platform aman."}
              </p>
            </div>
          </div>

          {/* 3. Footer */}
          <div className="relative z-10 text-[9px] font-medium text-white/40 uppercase tracking-[0.2em] text-center">
            © {new Date().getFullYear()} WeSign Technologies.
          </div>
        </div>

        {/* KANAN - Panel Form (70%) */}
        <div className="lg:w-[70%] flex flex-col justify-center items-center py-12 px-8 sm:px-16 lg:p-20 relative bg-white dark:bg-zinc-900">
          {/* Tombol Kembali */}
          <div className="absolute top-8 left-8 flex items-center gap-2 z-10">
            <Link to="/" className="flex items-center gap-2 text-zinc-400 hover:text-primary transition-all no-underline font-bold text-xs group">
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <ArrowLeft size={14} /> 
              </div>
              Kembali
            </Link>
          </div>

          <div className={`w-full ${maxWidth} relative z-10`}>
            {/* Header Form */}
            <div className="mb-6 text-left">
              <h1 className="text-3xl font-heading font-bold mb-2 tracking-tighter text-zinc-900 dark:text-white">
                {title}
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-base font-light leading-relaxed">
                {subtitle}
              </p>
            </div>

            {/* Render Komponen Form */}
            <div className="w-full">
               {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
