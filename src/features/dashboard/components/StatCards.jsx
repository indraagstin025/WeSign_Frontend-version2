import React from 'react';
import { motion as Motion } from 'framer-motion';
import { FileText, Clock, CheckCircle2, FileEdit, TrendingUp, TrendingDown } from 'lucide-react';

const StatCards = ({ counts, itemVariants }) => {
  const waiting = counts?.waiting ?? 0;
  const process = counts?.process ?? 0;
  const completed = counts?.completed ?? 0;
  const actionRequired = counts?.actionRequired ?? process;
  const total = counts?.total ?? waiting + process + completed;
  const maxValue = Math.max(total, waiting, actionRequired, completed, 1);

  const stats = [
    {
      label: 'Total Dokumen',
      value: total,
      trend: 'Total seluruh dokumen Anda',
      isUp: true,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      icon: <FileText size={22} />,
      barColor: 'bg-emerald-500',
    },
    {
      label: 'Draft',
      value: waiting,
      trend: 'Dokumen belum di-assign',
      isUp: true,
      iconBg: 'bg-zinc-50',
      iconColor: 'text-zinc-500',
      icon: <FileEdit size={22} />,
      barColor: 'bg-zinc-500',
    },
    {
      label: 'Perlu Aksi',
      value: actionRequired,
      trend: 'Menunggu tindakan Anda',
      isUp: true,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      icon: <Clock size={22} />,
      barColor: 'bg-amber-500',
    },
    {
      label: 'Selesai',
      value: completed,
      trend: 'Sudah ditandatangani',
      isUp: true,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      icon: <CheckCircle2 size={22} />,
      barColor: 'bg-emerald-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Motion.div
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

          <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${stat.barColor}`}
              style={{ width: `${Math.min(100, Math.round((stat.value / maxValue) * 100))}%` }}
            />
          </div>
        </Motion.div>
      ))}
    </div>
  );
};

export default StatCards;
