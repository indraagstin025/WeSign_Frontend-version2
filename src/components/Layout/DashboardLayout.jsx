import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Sun, Moon, Bell, Search } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
      
      {/* 1. Komponen Sidebar Terpisah */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* 2. Area Ruang Kerja Kanan (Workspace) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* A. Topbar Khusus Dashboard (Mobile-first Top Navigation) */}
        <header className="h-16 flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 z-10 transition-colors">
          
          <div className="flex items-center gap-4">
            {/* Hamburger Button (Hanya Mobile & Tablet) */}
            <button 
              className="lg:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border-none bg-transparent cursor-pointer"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Tombol Tema */}
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors border-none bg-transparent cursor-pointer">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            {/* Tombol Notifikasi */}
            <button className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors border-none bg-transparent cursor-pointer">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>
            </button>

            {/* Avatar Profil Mini */}
            <div className="ml-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-slate-900 cursor-pointer shadow-sm">
              AD
            </div>
          </div>
        </header>

        {/* B. Area Konten Dinamis Utama (Tergantung Rute URL) */}
        <main className="flex-1 flex flex-col bg-slate-50 dark:bg-[#0B1120] overflow-hidden no-scrollbar">
          <div className="flex-1 flex flex-col min-h-0 w-full">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
};

export default DashboardLayout;
