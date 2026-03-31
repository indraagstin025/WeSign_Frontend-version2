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
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
    } catch {
      // Tetap hapus token meskipun API gagal
      localStorage.removeItem('wesign_token');
      localStorage.removeItem('wesign_refresh_token');
    } finally {
      navigate('/login', { replace: true });
    }
  };
  const menuItems = [
    { title: "Beranda Ruang Kerja", icon: <LayoutDashboard size={18} />, path: "/dashboard" },
    { title: "Brankas Dokumen", icon: <FileText size={18} />, path: "/dashboard/documents" },
    { title: "Grup Kolaborasi", icon: <Users size={18} />, path: "/dashboard/groups" },
    { title: "Pengaturan Akun", icon: <Settings size={18} />, path: "/dashboard/settings" },
  ];

  return (
    <>
      {/* OVERLAY MOBILE: Muncul jika sidebar dibuka di HP */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 dark:bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR UTAMA: Mobile-first styling */}
      <aside 
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header LOGO */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800">
          <a href="/" className="flex items-center gap-2 text-primary no-underline">
            <ShieldCheck size={24} strokeWidth={2.5} />
            <span className="text-xl font-heading font-bold tracking-tight">WeSign</span>
          </a>
          {/* Tombol Tutup Sidebar untuk Layar HP */}
          <button 
            className="lg:hidden p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border-none bg-transparent cursor-pointer"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Daftar Navigasi Utama */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {menuItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-primary/10 text-primary dark:bg-primary/20" 
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                }`
              }
              end={item.path === "/dashboard"} // Mencegah highlight ganda 
              onClick={() => setIsOpen(false)} // Tutup otomatis di HP saat menu diklik
            >
              <div className="flex-shrink-0">{item.icon}</div>
              <span className="truncate">{item.title}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bagian Bawah: Profil/Keluar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button 
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors border-none bg-transparent cursor-pointer text-left"
          >
            <LogOut size={18} />
            Keluarkan Sesi
          </button>
        </div>
      </aside>

      {/* Modal Konfirmasi Logout */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Keluar dari WeSign?"
        message="Sesi aktif Anda akan diakhiri dan Anda perlu memasukkan kredensial kembali untuk mengakses ruang kerja."
        confirmText="Ya, Keluarkan Saya"
        cancelText="Tetap di Sini"
        variant="danger"
        loading={loggingOut}
      />
    </>
  );
};

export default Sidebar;
