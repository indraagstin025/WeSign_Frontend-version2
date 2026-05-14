import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Sun, Moon, Bell, User as UserIcon, Settings, LogOut, ChevronDown, Search } from 'lucide-react';
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
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 font-sans">
      
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        <header className="h-14 flex-shrink-0 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between px-5 lg:px-8 z-40 transition-all sticky top-0">
          
          <div className="flex items-center gap-3 flex-1">
            <button 
              className="lg:hidden p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-none bg-transparent cursor-pointer"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

            {/* SEARCH BAR */}
            <div className="hidden md:flex items-center relative max-w-sm w-full group">
              <div className="absolute left-3 text-zinc-400 group-focus-within:text-emerald-500 transition-colors">
                <Search size={15} />
              </div>
              <input 
                type="text" 
                placeholder="Search documents, packages, groups..." 
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700/50 rounded-xl py-2 pl-9 pr-4 text-[12px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-zinc-700 dark:text-zinc-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors border-none bg-transparent cursor-pointer">
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            
            <button className="relative p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors border-none bg-transparent cursor-pointer">
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-900">3</span>
            </button>

            {/* Profile */}
            <div className="relative ml-1" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all border border-transparent bg-transparent cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                  {user?.profilePictureUrl ? (
                    <img src={user.profilePictureUrl} alt="Me" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase">
                      {loading ? '...' : getInitials(user?.name)}
                    </span>
                  )}
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <p className="text-[12px] font-semibold text-zinc-900 dark:text-white leading-none">{user?.name || 'John Doe'}</p>
                  <p className="text-[10px] text-zinc-400 leading-none mt-0.5">{user?.email || 'john.doe@email.com'}</p>
                </div>
                <ChevronDown size={13} className={`text-zinc-400 transition-transform duration-300 hidden sm:block ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* ACTUAL DROPDOWN MENU */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right z-50">
                  {/* Dropdown Header */}
                  <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                    <p className="text-sm font-bold text-zinc-800 dark:text-white truncate">{user?.name || 'User WeSign'}</p>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5">{user?.email || 'user@example.com'}</p>
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-bold uppercase tracking-widest rounded-md border border-emerald-500/20">
                      {user?.userStatus || 'Verified Member'}
                    </div>
                  </div>

                  {/* Dropdown Links */}
                  <div className="p-2 space-y-1">
                    <Link 
                      to="/dashboard/profile" 
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-colors no-underline"
                    >
                      <UserIcon size={16} />
                      Profil Saya
                    </Link>
                    <Link 
                      to="/dashboard/settings" 
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-colors no-underline"
                    >
                      <Settings size={16} />
                      Pengaturan Akun
                    </Link>
                  </div>

                  {/* Dropdown Footer */}
                  <div className="p-2 border-t border-zinc-100 dark:border-zinc-800">
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

        <main className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden no-scrollbar">
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
