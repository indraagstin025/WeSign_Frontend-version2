import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Sun, Moon, Bell, User as UserIcon, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { logoutUser } from '../../features/auth/api/authService';
import ConfirmModal from '../UI/ConfirmModal';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, loading, clearUser } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
      clearUser();
      localStorage.removeItem('wesign_token');
      localStorage.removeItem('wesign_refresh_token');
    } catch {
      localStorage.removeItem('wesign_token');
      localStorage.removeItem('wesign_refresh_token');
      clearUser();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
      
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        <header className="h-16 flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 z-40 transition-colors sticky top-0">
          
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border-none bg-transparent cursor-pointer"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors border-none bg-transparent cursor-pointer">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <button className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors border-none bg-transparent cursor-pointer">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-slate-900"></span>
            </button>

            {/* Profile Dropdown Container */}
            <div className="relative ml-2" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 bg-transparent cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shadow-sm ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900 transition-transform group-hover:scale-105">
                  {user?.profilePictureUrl ? (
                    <img src={user.profilePictureUrl} alt="Me" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary font-bold text-xs">
                      {loading ? '...' : getInitials(user?.name)}
                    </span>
                  )}
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* ACTUAL DROPDOWN MENU */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right z-50">
                  {/* Dropdown Header */}
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user?.name || 'User WeSign'}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email || 'user@example.com'}</p>
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-bold uppercase tracking-widest rounded-md border border-emerald-500/20">
                      {user?.userStatus || 'Verified Member'}
                    </div>
                  </div>

                  {/* Dropdown Links */}
                  <div className="p-2 space-y-1">
                    <Link 
                      to="/dashboard/profile" 
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-colors no-underline"
                    >
                      <UserIcon size={16} />
                      Profil Saya
                    </Link>
                    <Link 
                      to="/dashboard/settings" 
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-colors no-underline"
                    >
                      <Settings size={16} />
                      Pengaturan Akun
                    </Link>
                  </div>

                  {/* Dropdown Footer */}
                  <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setShowLogoutModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors border-none bg-transparent cursor-pointer text-left uppercase tracking-widest"
                    >
                      <LogOut size={16} />
                      Keluar Sesi
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col bg-slate-50 dark:bg-[#0B1120] overflow-hidden no-scrollbar">
          <div className="flex-1 flex flex-col min-h-0 w-full">
            <Outlet />
          </div>
        </main>
      </div>

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
    </div>
  );
};

export default DashboardLayout;
