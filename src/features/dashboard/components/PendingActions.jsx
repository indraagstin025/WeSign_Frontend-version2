import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, FileText, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale/id';

const PendingActions = ({ actions, itemVariants }) => {
  return (
    <motion.div 
      variants={itemVariants}
      className="col-span-12 lg:col-span-8 bg-white dark:bg-zinc-800/80 rounded-[2.5rem] p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)] dark:shadow-[0_35px_70px_-20px_rgba(0,0,0,0.9)] border border-zinc-200/80 dark:border-zinc-700/50 flex flex-col min-h-[480px] backdrop-blur-md"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Agenda Mendesak</h3>
        <button className="text-[10px] font-black text-violet-600 underline uppercase tracking-widest bg-transparent border-none cursor-pointer hover:text-violet-700 transition-all">
          LIHAT SEMUA
        </button>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-3">
          <thead>
            <tr className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-4">
              <th className="pb-2 pl-4">DOKUMEN</th>
              <th className="pb-2">PEMILIK</th>
              <th className="pb-2">STATUS</th>
              <th className="pb-2 text-right pr-4">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {actions && actions.length > 0 ? (
              actions.map((action, i) => (
                <tr key={i} className="group bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-white dark:hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-100 dark:hover:border-zinc-700">
                  <td className="py-4 pl-4 rounded-l-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center text-violet-600 shadow-sm border border-zinc-100 dark:border-zinc-800">
                        <FileText size={18} />
                      </div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">{action.title || 'Dokumen'}</h4>
                    </div>
                  </td>
                  <td className="py-4">
                    <p className="text-xs font-medium text-zinc-500">{action.ownerName || 'Sistem'}</p>
                  </td>
                  <td className="py-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-violet-50 text-violet-600 border border-violet-100">
                      Vierify
                    </span>
                  </td>
                  <td className="py-4 text-right pr-4 rounded-r-2xl">
                    <button className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-violet-600 shadow-sm border border-zinc-100 dark:border-zinc-800 ml-auto transition-all">
                      <ArrowUpRight size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-700 space-y-4 opacity-60">
                    <CheckCircle2 size={56} strokeWidth={1} />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Tidak ada agenda tertunda</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default PendingActions;
