import React from 'react';
import { motion } from 'framer-motion';
import { PenTool, Package, Users, Files, ChevronRight } from 'lucide-react';

const QuickActions = ({ itemVariants }) => {
  const actions = [
    { title: 'Personal Sign', desc: 'Upload a document and sign it yourself', icon: <PenTool size={28} />, color: 'text-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { title: 'Create Package', desc: 'Sign up to 5 documents at once', icon: <Package size={28} />, color: 'text-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { title: 'Create Group', desc: 'Invite others and sign together', icon: <Users size={28} />, color: 'text-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { title: 'Templates', desc: 'Use templates for frequent documents', icon: <Files size={28} />, color: 'text-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-500/10' },
  ];

  return (
    <motion.div 
      variants={itemVariants}
      className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-6"
    >
      {actions.map((action, i) => (
        <button 
          key={i}
          className="bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-500/10 dark:to-zinc-900 p-6 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl hover:shadow-2xl transition-all text-left flex flex-col group relative overflow-hidden bg-transparent cursor-pointer"
        >
          <div className={`w-12 h-12 rounded-2xl ${action.bgColor} ${action.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm`}>
            {action.icon}
          </div>
          <h4 className="text-sm font-black text-zinc-900 dark:text-white mb-1">{action.title}</h4>
          <p className="text-[10px] text-zinc-400 font-bold leading-relaxed pr-1">{action.desc}</p>
          <div className="absolute top-6 right-6 text-zinc-200 group-hover:text-emerald-500 transition-colors">
            <ChevronRight size={20} />
          </div>
        </button>
      ))}
    </motion.div>

  );
};

export default QuickActions;

