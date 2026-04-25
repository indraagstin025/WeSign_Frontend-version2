import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { logoutUser } from '../../features/auth/api/authService';
import ConfirmModal from '../UI/ConfirmModal';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  ShieldCheck,
  Layers,
  User,
  X,
  Plus,
  Feather
} from 'lucide-react';

import { useUser } from '../../context/UserContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const { user, clearUser } = useUser();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
      clearUser(); // Bersihkan context
    } catch {
      // Tetap hapus token meskipun API gagal
      localStorage.removeItem('wesign_token');
      localStorage.removeItem('wesign_refresh_token');
      clearUser();
    } finally {
      navigate('/login', { replace: true });
    }
  };
  const menuItems = [
    { title: "Beranda Ruang Kerja", icon: <LayoutDashboard size={18} />, path: "/dashboard" },
    { title: "Brankas Dokumen", icon: <FileText size={18} />, path: "/dashboard/documents" },
    { title: "Paket (Batch)", icon: <Layers size={18} />, path: "/dashboard/packages" },
    { title: "Grup Kolaborasi", icon: <Users size={18} />, path: "/dashboard/groups" },
  ];

  return (
    <>
      {/* OVERLAY MOBILE: Muncul jika sidebar dibuka di HP */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-zinc-900/50 dark:bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR UTAMA: Mobile-first styling */}
      <aside 
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-zinc-800/80 backdrop-blur-md border-r border-zinc-200 dark:border-zinc-700/50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header LOGO */}
        <div className="h-20 flex items-center justify-between px-5">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl group-hover:bg-primary group-hover:border-primary group-hover:rotate-6 transition-all duration-300 shadow-sm">
               <Feather size={26} className="text-primary group-hover:text-white transition-colors" strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-bold font-dancing text-zinc-900 dark:text-white tracking-tight m-0">WeSign</h2>
          </div>
          {/* Tombol Tutup Sidebar untuk Layar HP */}
          <button 
            className="lg:hidden p-1 rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-none bg-transparent cursor-pointer"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Daftar Navigasi Utama */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 no-scrollbar">
          {/* Tombol Create Baru (Ala Referensi) */}
          {/* USER PROFILE CARD */}
          <div className="mx-2 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] border border-zinc-100 dark:border-zinc-700/50 flex flex-col items-center text-center shadow-sm">
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center text-primary shadow-sm border border-zinc-100 dark:border-zinc-700 overflow-hidden">
                {user?.profilePictureUrl ? (
                  <img src={user.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-black">{user?.name?.charAt(0) || 'U'}</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-zinc-50 dark:border-zinc-800"></div>
            </div>
            <div className="max-w-full px-2">
              <p className="text-sm font-black text-zinc-900 dark:text-white truncate">{user?.name || 'User WeSign'}</p>
              <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{user?.email || 'user@email.com'}</p>
            </div>
          </div>

          {/* Menu Section: General */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-3 mb-4">Utama</p>
            <div className="space-y-1">
              {menuItems.map((item, index) => (
                <NavLink
                  key={index}
                  to={item.path}
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive 
                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white shadow-sm" 
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
                    }`
                  }
                  end={item.path === "/dashboard"}
                  onClick={() => setIsOpen(false)}
                >
                  <div className={`transition-colors ${item.path === window.location.pathname ? "text-primary" : ""}`}>
                    {item.icon}
                  </div>
                  <span className="truncate">{item.title}</span>
                </NavLink>
              ))}
            </div>
          </div>

          {/* Menu Section: Workspace/Account */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-3 mb-4">Pengaturan</p>
            <div className="space-y-1">
              <NavLink
                to="/dashboard/profile"
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    isActive ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                  }`
                }
              >
                <User size={18} />
                <span>Profil Saya</span>
              </NavLink>
              <NavLink
                to="/dashboard/settings"
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    isActive ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                  }`
                }
              >
                <Settings size={18} />
                <span>Konfigurasi Akun</span>
              </NavLink>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
