import React from 'react';
import { Search } from 'lucide-react';

/**
 * @component DocumentToolbar
 * @description Status tabs and search input for the Documents Page.
 */
const DocumentToolbar = ({ filters }) => {
  const tabs = [
    { label: 'Semua', value: '' },
    { label: 'Draf', value: 'draft' },
    { label: 'Proses', value: 'pending' },
    { label: 'Selesai', value: 'completed' },
    { label: 'Arsip', value: 'archived' }
  ];

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 animate-in fade-in duration-700">
      <div className="flex p-1.5 bg-slate-100/50 dark:bg-slate-800/40 rounded-[20px] backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/30 overflow-x-auto no-scrollbar max-w-full">
        {tabs.map((tab) => (
          <button 
            key={tab.label}
            onClick={() => filters.setStatus(tab.value)}
            className={`px-6 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap border-none cursor-pointer
              ${(filters.status === tab.value)
                ? 'bg-white dark:bg-slate-700 text-primary shadow-[0_8px_20px_-4px_rgba(var(--primary-rgb),0.2)]' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/30'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative flex-1 group w-full md:w-auto">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors duration-300">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="Cari dokumen..."
          value={filters.search}
          onChange={(e) => filters.setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && filters.setPage(1)}
          className="w-full pl-12 pr-5 py-3 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 dark:text-white placeholder:text-slate-500 transition-all font-medium"
        />
      </div>
    </div>
  );
};

export default DocumentToolbar;
