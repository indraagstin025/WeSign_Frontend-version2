import React from 'react';
import { ShieldCheck, LogIn, Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="glass-nav fixed top-0 left-0 right-0 h-20 z-50 flex items-center">
      <div className="max-w-7xl w-full mx-auto px-6 flex justify-between items-center">
        {/* LOGO */}
        <div className="flex items-center gap-2 cursor-pointer z-10">
          <ShieldCheck size={32} className="text-primary" strokeWidth={2.5} />
          <h2 className="text-2xl font-bold font-heading text-primary tracking-tight m-0">WeSign</h2>
        </div>

        {/* BROWSER LINKS (Desktop) - Absolutely Centered */}
        <div className="hidden md:flex gap-8 items-center absolute left-1/2 transform -translate-x-1/2">
          <a href="#fitur" className="text-[var(--color-text-muted)] hover:text-primary font-medium text-base transition-colors">Fitur Utama</a>
          <a href="#harga" className="text-[var(--color-text-muted)] hover:text-primary font-medium text-base transition-colors">Harga</a>
          <a href="#bantuan" className="text-[var(--color-text-muted)] hover:text-primary font-medium text-base transition-colors">Pusat Bantuan</a>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-4 z-10">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-500/10 transition-colors bg-transparent border-none cursor-pointer flex items-center justify-center" aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} className="text-primary" /> : <Moon size={20} className="text-[var(--color-text-main)]" />}
          </button>
          
          <a href="/login" className="hidden md:block font-semibold text-primary pr-2 no-underline">
            Masuk
          </a>
          <button className="hidden md:flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 border-none font-heading font-semibold cursor-pointer">
            Daftar Gratis <LogIn size={18} />
          </button>

          {/* MOBILE MENU */}
          <button className="md:hidden flex p-2 text-[var(--color-text-main)] bg-transparent border-none cursor-pointer items-center justify-center" aria-label="Buka Menu">
            <Menu size={28} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
