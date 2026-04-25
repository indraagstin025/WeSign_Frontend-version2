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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Agenda Mendesak</h3>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Aksi tanda tangan tertunda</p>
        </div>
        <button className="text-[10px] font-black text-primary uppercase tracking-widest bg-transparent border-none cursor-pointer flex items-center gap-1.5 hover:translate-x-1 transition-all">
          LIHAT SEMUA <ChevronRight size={14} />
        </button>
      </div>

      <div className="space-y-4 pr-1">
        {actions && actions.length > 0 ? (
          actions.map((action, i) => (
            <div key={i} className="flex items-center justify-between p-5 bg-zinc-50 dark:bg-zinc-700/20 rounded-2xl hover:bg-white dark:hover:bg-zinc-700/40 transition-all group cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-600 hover:shadow-md">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center text-primary shadow-sm border border-zinc-100 dark:border-zinc-700">
                  <FileText size={20} />
                </div>
                <div className="max-w-[200px] sm:max-w-md">
                  <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 line-clamp-1">{action.title || 'Dokumen'}</h4>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                    {action.ownerName || 'Sistem'} • {action.updatedAt ? formatDistanceToNow(new Date(action.updatedAt), { addSuffix: true, locale: id }) : 'Baru saja'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="hidden sm:flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500">
                  Pending
                </div>
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                  <ArrowUpRight size={16} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-700 space-y-4 opacity-60">
            <CheckCircle2 size={56} strokeWidth={1} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Tidak ada agenda tertunda</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PendingActions;
