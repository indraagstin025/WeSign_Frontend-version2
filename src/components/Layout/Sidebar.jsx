import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PenTool, 
  Package, 
  Users, 
  FileText, 
  FileCheck, 
  Clock, 
  UserCircle, 
  Settings, 
  HelpCircle,
  X,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import StatusModal from '../ui/StatusModal';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();

  const [statusModal, setStatusModal] = React.useState({ 
    isOpen: false, 
    type: 'warning', 
    title: '', 
    message: '' 
  });

  const menuItems = [
    { title: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    { title: "Packages", icon: <Package size={20} />, path: "/dashboard/packages" },
    { title: "Groups / MultiSign", icon: <Users size={20} />, path: "/dashboard/groups" },
    { title: "Documents", icon: <FileText size={20} />, path: "/dashboard/documents", isComingSoon: true },
    { title: "Templates", icon: <FileCheck size={20} />, path: "/dashboard/templates", isComingSoon: true },
    { title: "History", icon: <Clock size={20} />, path: "/dashboard/history", isComingSoon: true },
    { title: "Contacts", icon: <UserCircle size={20} />, path: "/dashboard/contacts", isComingSoon: true },
  ];

  const bottomItems = [
    { title: "Settings", icon: <Settings size={20} />, path: "/dashboard/settings", isComingSoon: true },
    { title: "Help & Support", icon: <HelpCircle size={20} />, path: "/dashboard/support", isComingSoon: true },
  ];

  const handleItemClick = (e, item) => {
    if (item.isComingSoon) {
      e.preventDefault();
      setStatusModal({
        isOpen: true,
        type: 'warning',
        title: 'Coming Soon!',
        message: `Fitur "${item.title}" sedang dalam tahap pengembangan dan akan segera dirilis. Terima kasih atas kesabaran Anda!`
      });
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* OVERLAY MOBILE */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR UTAMA */}
      <aside 
        className={`fixed top-0 left-0 z-50 h-screen w-72 bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header LOGO */}
        <div className="h-28 flex flex-col items-center justify-center px-2 shrink-0 relative">
          <div className="cursor-pointer flex justify-center w-full" onClick={() => navigate('/dashboard')}>
            {/* Logo for Light Mode */}
            <img 
              src="/icons/LogoWhiteMode.svg" 
              alt="WeSign Logo" 
              className="w-64 h-auto object-contain transition-all duration-300 block dark:hidden" 
            />
            {/* Logo for Dark Mode */}
            <img 
              src="/icons/LogoDarkMode.svg" 
              alt="WeSign Logo" 
              className="w-64 h-auto object-contain transition-all duration-300 hidden dark:block" 
            />
          </div>

          <button 
            className="lg:hidden p-2 rounded-full text-zinc-400 hover:bg-zinc-100 absolute top-4 right-4"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Daftar Navigasi Utama */}
        <nav className="flex-1 overflow-y-auto pt-4 pb-10 px-6 no-scrollbar flex flex-col">
          <div className="space-y-1 mb-8">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all no-underline ${
                    isActive 
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" 
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800/50"
                  }`
                }
                onClick={(e) => handleItemClick(e, item)}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.title}</span>
                </div>
                {item.isComingSoon && (
                  <span className="text-[8px] font-black bg-zinc-100 dark:bg-white/5 text-zinc-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">Soon</span>
                )}
              </NavLink>
            ))}
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mb-8">
            <p className="px-4 text-[10px] font-black text-zinc-400 dark:text-zinc-100 uppercase tracking-widest mb-4">Support</p>
            <div className="space-y-1">
              {bottomItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all no-underline ${
                      isActive 
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" 
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800/50"
                    }`
                  }
                  onClick={(e) => handleItemClick(e, item)}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.title}</span>
                  </div>
                  {item.isComingSoon && (
                    <span className="text-[8px] font-black bg-zinc-100 dark:bg-white/5 text-zinc-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">Soon</span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>

          {/* UPGRADE CARD */}
          <div className="mt-auto p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 relative overflow-hidden text-center shrink-0">
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-zinc-50 dark:border-zinc-700">
                <ShieldCheck size={28} className="text-emerald-500" />
              </div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">Upgrade to Pro</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-100 mb-5 leading-relaxed">
                Unlock more features and manage documents more efficiently.
              </p>
              <button className="w-full bg-emerald-500 text-white py-3 rounded-full text-xs font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 border-none cursor-pointer">
                Upgrade Now
              </button>
            </div>
          </div>
        </nav>
      </aside>

      <StatusModal
        {...statusModal}
        onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};

export default Sidebar;
