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
    { title: "Dashboard", icon: <LayoutDashboard size={16} />, path: "/dashboard" },
    { title: "Packages", icon: <Package size={16} />, path: "/dashboard/packages" },
    { title: "Groups / MultiSign", icon: <Users size={16} />, path: "/dashboard/groups" },
    { title: "Documents", icon: <FileText size={16} />, path: "/dashboard/documents" },
    { title: "Templates", icon: <FileCheck size={16} />, path: "/dashboard/templates", isComingSoon: true },
    { title: "History", icon: <Clock size={16} />, path: "/dashboard/history", isComingSoon: true },
    { title: "Contacts", icon: <UserCircle size={16} />, path: "/dashboard/contacts", isComingSoon: true },
  ];

  const bottomItems = [
    { title: "Settings", icon: <Settings size={16} />, path: "/dashboard/settings", isComingSoon: true },
    { title: "Help & Support", icon: <HelpCircle size={16} />, path: "/dashboard/support", isComingSoon: true },
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
        className={`fixed top-0 left-0 z-50 h-screen w-56 bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header LOGO */}
        <div className="h-20 flex flex-col items-center justify-center px-2 shrink-0 relative">
          <div className="cursor-pointer flex justify-center w-full" onClick={() => navigate('/dashboard')}>
            <img 
              src="/icons/LogoWhiteMode.svg" 
              alt="WeSign Logo" 
              className="w-44 h-auto object-contain transition-all duration-300 block dark:hidden" 
            />
            <img 
              src="/icons/LogoDarkMode.svg" 
              alt="WeSign Logo" 
              className="w-44 h-auto object-contain transition-all duration-300 hidden dark:block" 
            />
          </div>

          <button 
            className="lg:hidden p-2 rounded-full text-zinc-400 hover:bg-zinc-100 absolute top-3 right-3"
            onClick={() => setIsOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        {/* Daftar Navigasi Utama */}
        <nav className="flex-1 overflow-y-auto pt-3 pb-8 px-4 no-scrollbar flex flex-col">
          <div className="space-y-0.5 mb-6">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all no-underline ${
                    isActive 
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" 
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800/50"
                  }`
                }
                onClick={(e) => handleItemClick(e, item)}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.title}</span>
                </div>
                {item.isComingSoon && (
                  <span className="text-[8px] font-black bg-zinc-100 dark:bg-white/5 text-zinc-400 px-1.5 py-0.5 rounded-full uppercase tracking-tighter ml-auto">Soon</span>
                )}
              </NavLink>
            ))}
          </div>

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 mb-6">
            <p className="px-3 text-[9px] font-black text-zinc-400 dark:text-zinc-100 uppercase tracking-widest mb-3">Support</p>
            <div className="space-y-0.5">
              {bottomItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => 
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all no-underline ${
                      isActive 
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" 
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800/50"
                    }`
                  }
                  onClick={(e) => handleItemClick(e, item)}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.title}</span>
                  </div>
                  {item.isComingSoon && (
                    <span className="text-[8px] font-black bg-zinc-100 dark:bg-white/5 text-zinc-400 px-1.5 py-0.5 rounded-full uppercase tracking-tighter ml-auto">Soon</span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>

          {/* UPGRADE CARD */}
          <div className="mt-auto p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 relative overflow-hidden text-center shrink-0">
            <div className="relative z-10">
              <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl shadow-sm flex items-center justify-center mx-auto mb-3 border border-zinc-50 dark:border-zinc-700">
                <ShieldCheck size={20} className="text-emerald-500" />
              </div>
              <h4 className="text-[12px] font-bold text-zinc-900 dark:text-white mb-1">Upgrade to Pro</h4>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-100 mb-4 leading-relaxed">
                Unlock more features and manage documents more efficiently.
              </p>
              <button className="w-full bg-emerald-500 text-white py-2 rounded-full text-[11px] font-bold hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20 border-none cursor-pointer">
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
