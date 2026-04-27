import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, LogIn, Menu, Moon, Sun, Feather } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 fixed top-0 left-0 right-0 h-20 z-50 flex items-center transition-all duration-300">
      <div className="max-w-7xl w-full mx-auto px-6 flex justify-between items-center">
        {/* LOGO */}
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="p-2 bg-primary/10 rounded-2xl group-hover:bg-primary group-hover:rotate-6 transition-all duration-300">
             <Feather size={24} className="text-primary group-hover:text-white transition-colors" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-bold font-dancing text-zinc-900 dark:text-white tracking-tight m-0">WeSign</h2>
        </div>

        {/* NAV LINKS (Desktop) - Absolutely Centered */}
        <div className="hidden md:flex gap-10 items-center absolute left-1/2 transform -translate-x-1/2">
          {['Fitur Utama', 'Harga', 'Pusat Bantuan'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase().replace(' ', '-')}`} 
              className="text-zinc-500 dark:text-zinc-400 hover:text-primary font-bold text-sm transition-all relative group"
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </a>
          ))}
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme} 
            className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-white dark:hover:bg-zinc-700 transition-all shadow-sm"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-zinc-600" />}
          </button>
          
          <div className="hidden md:flex items-center border-l border-zinc-200 dark:border-zinc-800 ml-2 pl-4 gap-4">
            <Link to="/login" className="text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors">
              Masuk
            </Link>
            <button className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
              Daftar Gratis
            </button>
          </div>

          {/* MOBILE MENU */}
          <button className="md:hidden flex p-2 text-zinc-900 dark:text-white bg-transparent border-none cursor-pointer items-center justify-center" aria-label="Buka Menu">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
