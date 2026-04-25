import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, TrendingUp, Users } from 'lucide-react';

const StatCards = ({ counts, itemVariants }) => {
  const stats = [
    { label: 'Dokumen\nSelesai', value: counts?.completed || 0, progress: 100, color: '#10B981', icon: <CheckCircle2 size={14}/> },
    { label: 'Menunggu\nSaya', value: counts?.waiting || 0, progress: 40, color: '#F59E0B', icon: <Clock size={14}/> },
    { label: 'Dalam\nProses', value: counts?.process || 0, progress: 70, color: '#3B82F6', icon: <TrendingUp size={14}/> },
    { label: 'Grup\nAktif', value: '5', progress: 25, color: '#8B5CF6', icon: <Users size={14}/> },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {stats.map((stat, i) => (
        <motion.div 
          key={i}
          variants={itemVariants}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="bg-white dark:bg-zinc-800/80 p-6 rounded-[2.5rem] shadow-[0_15px_45px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border border-zinc-200 dark:border-zinc-700/50 flex items-center justify-between group cursor-pointer backdrop-blur-md"
        >
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 text-zinc-400 dark:text-zinc-500 scale-90">{stat.icon}</div>
              <p className="text-[10px] font-black uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400 leading-tight whitespace-pre-line">
                {stat.label}
              </p>
            </div>
            <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">{stat.value}</h3>
          </div>
          
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" className="stroke-zinc-100 dark:stroke-zinc-700/30 fill-none" strokeWidth="5" />
              <motion.circle 
                cx="32" cy="32" r="28" 
                stroke={stat.color}
                className="fill-none"
                strokeWidth="5" 
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
              />
            </svg>
            <div className="absolute text-[10px] font-black text-zinc-400 dark:text-zinc-500">
              {stat.progress}%
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default StatCards;
