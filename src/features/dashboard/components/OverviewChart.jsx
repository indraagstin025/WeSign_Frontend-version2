import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const OverviewChart = ({ itemVariants }) => {
  const data = [
    { name: 'May 1',  sent: 20, completed: 15, pending: 25, rejected: 10 },
    { name: 'May 7',  sent: 35, completed: 25, pending: 30, rejected: 12 },
    { name: 'May 13', sent: 30, completed: 28, pending: 35, rejected: 15 },
    { name: 'May 19', sent: 45, completed: 35, pending: 25, rejected: 10 },
    { name: 'May 25', sent: 55, completed: 45, pending: 30, rejected: 14 },
    { name: 'May 31', sent: 65, completed: 55, pending: 20, rejected: 12 },
  ];

  return (
    <motion.div
      variants={itemVariants}
      className="col-span-12 lg:col-span-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-50 dark:border-zinc-800">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Overview</h3>
        <select className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-zinc-600 dark:text-zinc-300 cursor-pointer">
          <option>This Month</option>
          <option>Last Month</option>
        </select>
      </div>

      <div className="p-5">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
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
                contentStyle={{
                  borderRadius: '0.75rem',
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)',
                  fontSize: '11px',
                  fontWeight: '600',
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                verticalAlign="top"
                align="left"
                wrapperStyle={{ top: -8, left: 0, fontSize: '10px', fontWeight: '600' }}
              />
              <Line type="monotone" dataKey="sent"      stroke="#94a3b8" strokeWidth={2} dot={{ r: 3, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={{ r: 3, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="pending"   stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="rejected"  stroke="#ef4444" strokeWidth={2} dot={{ r: 3, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

export default OverviewChart;
