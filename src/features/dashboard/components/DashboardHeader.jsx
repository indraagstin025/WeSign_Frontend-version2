import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Upload } from 'lucide-react';
import { useUser } from '../../../context/UserContext';

const DashboardHeader = ({ itemVariants }) => {
  const { user } = useUser();
  const firstName = user?.name?.split(' ')[0] || 'John';

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight mb-1">
          Welcome back, {firstName}! 👋
        </h2>
        <p className="text-xs font-bold text-zinc-400">
          Here's what's happening with your documents today.
        </p>
      </motion.div>
      
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-emerald-500 text-emerald-600 font-black text-xs hover:bg-emerald-50 transition-all bg-transparent cursor-pointer">
          <Plus size={18} />
          Create Package
        </button>
        <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 text-white font-black text-xs hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 border-none cursor-pointer">
          <Upload size={18} />
          Upload Document
        </button>
      </motion.div>
    </div>

  );
};

export default DashboardHeader;


