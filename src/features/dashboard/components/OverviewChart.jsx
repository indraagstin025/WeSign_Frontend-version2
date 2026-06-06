import React from 'react';
import { motion as Motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const OverviewChart = ({ counts, itemVariants }) => {
  const waiting = counts?.waiting ?? 0;
  const process = counts?.process ?? 0;
  const actionRequired = counts?.actionRequired ?? 0;
  const completed = counts?.completed ?? 0;
  const data = [
    { name: 'Draft', value: waiting, fill: '#71717a' },
    { name: 'Proses', value: process, fill: '#f59e0b' },
    { name: 'Perlu Aksi', value: actionRequired, fill: '#14b8a6' },
    { name: 'Selesai', value: completed, fill: '#10b981' },
  ];

  return (
    <Motion.div
      variants={itemVariants}
      className="col-span-12 lg:col-span-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-50 dark:border-zinc-800">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Status Overview</h3>
        <span className="text-[11px] font-semibold text-zinc-400">Real-time snapshot</span>
      </div>

      <div className="p-5">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{
                  borderRadius: '0.75rem',
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)',
                  fontSize: '11px',
                  fontWeight: '600',
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={44}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Motion.div>
  );
};

export default OverviewChart;
