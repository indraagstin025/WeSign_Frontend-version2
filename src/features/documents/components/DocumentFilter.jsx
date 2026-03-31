import React from 'react';

/**
 * @component DocumentFilter
 * @description Tab filter untuk menyaring dokumen berdasarkan status.
 *              Mendukung: Semua, draft, pending, completed, archived.
 */
const DocumentFilter = ({ activeStatus, onStatusChange }) => {
  const tabs = [
    { id: '', label: 'Semua' },
    { id: 'draft', label: 'Draf' },
    { id: 'pending', label: 'Proses' },
    { id: 'completed', label: 'Selesai' },
    { id: 'archived', label: 'Arsip' },
  ];

  return (
    <div 
      className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-full sm:w-auto overflow-x-auto selection:bg-transparent"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
    >
      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onStatusChange(tab.id)}
          className={`
            px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-[10px] text-[11px] sm:text-sm font-bold whitespace-nowrap transition-all border-none cursor-pointer
            ${activeStatus === tab.id 
              ? 'bg-white dark:bg-slate-700 text-primary shadow-sm ring-1 ring-slate-200 dark:ring-slate-600' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default DocumentFilter;
