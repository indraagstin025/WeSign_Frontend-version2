import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle2, FileEdit, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const StatCards = ({ counts, itemVariants }) => {
  // Mapping ke backend response shape: { waiting, process, completed }
  // - waiting: dokumen draft (belum di-assign ke siapa pun)
  // - process: dokumen pending signature (sedang berjalan)
  // - completed: dokumen sudah selesai ditandatangani
  // - total: agregasi waiting + process + completed
  const waiting = counts?.waiting ?? 0;
  const process = counts?.process ?? 0;
  const completed = counts?.completed ?? 0;
  const total = waiting + process + completed;

  const stats = [
    {
      label: 'Total Dokumen',
      value: total,
      trend: 'Total seluruh dokumen Anda',
      isUp: true,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      icon: <FileText size={22} />,
      lineColor: '#10b981',
      data: [30, 40, 35, 50, 40, 55, 45, 60],
    },
    {
      label: 'Draft',
      value: waiting,
      trend: 'Dokumen belum di-assign',
      isUp: true,
      iconBg: 'bg-zinc-50',
      iconColor: 'text-zinc-500',
      icon: <FileEdit size={22} />,
      lineColor: '#71717a',
      data: [20, 22, 18, 25, 22, 20, 18, 15],
    },
    {
      label: 'Sedang Berjalan',
      value: process,
      trend: 'Menunggu tanda tangan',
      isUp: true,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      icon: <Clock size={22} />,
      lineColor: '#f59e0b',
      data: [20, 25, 22, 30, 25, 35, 30, 40],
    },
    {
      label: 'Selesai',
      value: completed,
      trend: 'Sudah ditandatangani',
      isUp: true,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      icon: <CheckCircle2 size={22} />,
      lineColor: '#10b981',
      data: [40, 50, 45, 60, 50, 70, 60, 80],
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          variants={itemVariants}
          className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Icon + Label */}
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl ${stat.iconBg} dark:bg-opacity-10 ${stat.iconColor} flex items-center justify-center shrink-0`}>
              {stat.icon}
            </div>
            <p className="text-[12px] font-semibold text-zinc-500 dark:text-zinc-400">{stat.label}</p>
          </div>

          {/* Value */}
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-zinc-900 dark:text-white">{stat.value}</h3>
            <div className={`flex items-center gap-1 text-[11px] font-semibold ${stat.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
              {stat.isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {stat.trend.split(' ')[0]}
            </div>
          </div>

          {/* Trend text */}
          <p className="text-[10px] text-zinc-400">{stat.trend}</p>

          {/* Mini sparkline */}
          <div className="h-10 w-full -mx-1">
            <ResponsiveContainer width="100%" height={40}>
              <AreaChart data={stat.data.map((v, j) => ({ v, j }))}>
                <defs>
                  <linearGradient id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={stat.lineColor} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={stat.lineColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={stat.lineColor}
                  strokeWidth={2}
                  fill={`url(#grad${i})`}
                  isAnimationActive={false}
                  dot={false}
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
