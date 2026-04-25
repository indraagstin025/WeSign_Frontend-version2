import React from 'react';
import { motion } from 'framer-motion';

const DashboardHeader = ({ itemVariants }) => {
  return (
    <div className="flex items-center justify-between">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-zinc-900 dark:text-white tracking-tight">
          Ruang Kerja
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-md">Pantau dokumen dan aktivitas tim Anda hari ini.</p>
      </motion.div>
      
      {/* CALENDAR */}
      <motion.div 
        variants={itemVariants}
        className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-zinc-800/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-zinc-200/60 dark:border-zinc-700/50 backdrop-blur-md"
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/10">
          <span className="text-sm font-black uppercase tracking-tighter">{new Date().getDate()}</span>
        </div>
        <div className="flex flex-col">
          <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.1em] leading-none mb-1">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long' })}
          </p>
          <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 leading-none">
            {new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardHeader;
