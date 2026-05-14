import React from 'react';
import { motion } from 'framer-motion';
import { PenTool, Package, Users, Files, ChevronRight } from 'lucide-react';

const QuickActions = ({ itemVariants }) => {
  const actions = [
    {
      title: 'Personal Sign',
      desc: 'Upload a document and sign it yourself',
      icon: <PenTool size={18} />,
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Create Package',
      desc: 'Sign up to 5 documents at once',
      icon: <Package size={18} />,
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Create Group',
      desc: 'Invite others and sign together',
      icon: <Users size={18} />,
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Templates',
      desc: 'Use templates for frequent documents',
      icon: <Files size={18} />,
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      iconColor: 'text-emerald-600',
    },
  ];

  return (
    <motion.div
      variants={itemVariants}
      className="col-span-12 lg:col-span-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm"
    >
      <div className="px-5 py-4 border-b border-zinc-50 dark:border-zinc-800">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Quick Actions</h3>
      </div>

      <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-zinc-50 dark:divide-zinc-800">
        {actions.map((action, i) => (
          <button
            key={i}
            className="p-4 text-left flex flex-col gap-2.5 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors bg-transparent border-none cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className={`w-8 h-8 rounded-lg ${action.iconBg} ${action.iconColor} flex items-center justify-center`}>
                {action.icon}
              </div>
              <ChevronRight size={13} className="text-zinc-300 group-hover:text-emerald-500 transition-colors" />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-zinc-800 dark:text-white">{action.title}</p>
              <p className="text-[10px] text-zinc-400 leading-relaxed mt-0.5">{action.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default QuickActions;
