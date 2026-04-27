import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle2, XCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const StatCards = ({ counts, itemVariants }) => {
  const stats = [
    { 
      label: 'TOTAL DOCUMENTS', 
      value: counts?.total || 128, 
      trend: '-12%', 
      isUp: false,
      color: 'text-indigo-400', 
      gradient: 'from-indigo-500/20 to-white dark:from-indigo-500/30 dark:to-zinc-900',
      icon: <FileText size={16} className="text-white"/>,
      data: [30, 40, 35, 50, 40, 55, 45, 60]
    },
    { 
      label: 'PENDING SIGNATURES', 
      value: counts?.pending || 24, 
      trend: '+8%', 
      isUp: true,
      color: 'text-lime-400', 
      gradient: 'from-lime-500/20 to-white dark:from-lime-500/30 dark:to-zinc-900',
      icon: <Clock size={16} className="text-white"/>,
      data: [20, 25, 22, 30, 25, 35, 30, 40]
    },
    { 
      label: 'COMPLETED', 
      value: counts?.completed || 89, 
      trend: '-4%', 
      isUp: false,
      color: 'text-teal-400', 
      gradient: 'from-teal-500/20 to-white dark:from-teal-500/30 dark:to-zinc-900',
      icon: <CheckCircle2 size={16} className="text-white"/>,
      data: [40, 50, 45, 60, 50, 70, 60, 80]
    },
    { 
      label: 'REJECTED', 
      value: counts?.rejected || 15, 
      trend: '+8%', 
      isUp: true,
      color: 'text-emerald-400', 
      gradient: 'from-emerald-500/20 to-white dark:from-emerald-500/30 dark:to-zinc-900',
      icon: <XCircle size={16} className="text-white"/>,
      data: [15, 12, 18, 14, 20, 15, 22, 18]
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <motion.div 
          key={i}
          variants={itemVariants}
          className={`bg-gradient-to-br ${stat.gradient} p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl relative overflow-hidden group min-h-[220px] flex flex-col justify-between`}
        >
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center mb-8">
              {stat.icon}
            </div>
            
            <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-100 tracking-wider">
                {stat.label}
              </p>
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-4xl font-medium text-zinc-900 dark:text-white">
                  {stat.value}
                </h3>
                <div className={`text-xs font-bold ${stat.isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stat.trend}
                </div>
              </div>
            </div>
          </div>

          <div className="h-10 w-full absolute bottom-0 left-0 right-0 opacity-10 pointer-events-none">
            <ResponsiveContainer width="100%" height={40}>
              <AreaChart data={stat.data.map((v, i) => ({ v, i }))}>
                <Area 
                  type="monotone" 
                  dataKey="v" 
                  stroke={stat.isUp ? '#10b981' : '#ef4444'} 
                  strokeWidth={1} 
                  fill="transparent" 
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      ))}
    </div>
  );

};

export default StatCards;


