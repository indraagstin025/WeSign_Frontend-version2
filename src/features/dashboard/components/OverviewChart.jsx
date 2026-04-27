import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const OverviewChart = ({ itemVariants }) => {
  const data = [
    { name: 'May 1', sent: 20, completed: 15, pending: 25, rejected: 10 },
    { name: 'May 7', sent: 35, completed: 25, pending: 30, rejected: 12 },
    { name: 'May 13', sent: 30, completed: 28, pending: 35, rejected: 15 },
    { name: 'May 19', sent: 45, completed: 35, pending: 25, rejected: 10 },
    { name: 'May 25', sent: 55, completed: 45, pending: 30, rejected: 14 },
    { name: 'May 31', sent: 65, completed: 55, pending: 20, rejected: 12 },
  ];

  return (
    <motion.div 
      variants={itemVariants}
      className="col-span-12 lg:col-span-8 bg-gradient-to-br from-teal-50/50 to-white dark:from-teal-500/10 dark:to-zinc-900 rounded-[2.5rem] p-8 border border-zinc-100 dark:border-zinc-800 shadow-xl"
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Overview</h3>
        <select className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
          <option>This Month</option>
          <option>Last Month</option>
        </select>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '1rem', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 
                fontSize: '12px',
                fontWeight: 'bold'
              }} 
            />
            <Legend 
              iconType="circle" 
              verticalAlign="top" 
              align="left" 
              wrapperStyle={{ top: -20, left: 0, fontSize: '10px', fontWeight: 'bold', textTransform: 'capitalize' }}
            />
            <Line type="monotone" dataKey="sent" stroke="#94a3b8" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default OverviewChart;
