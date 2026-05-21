import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Upload } from 'lucide-react';
import { useUser } from '../../../context/UserContext';

const DashboardHeader = ({ itemVariants }) => {
  const { user } = useUser();
  const firstName = user?.name?.split(' ')[0] || 'John';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
          Welcome back, {firstName}! 👋
        </h2>
        <p className="text-[12px] text-zinc-400 mt-0.5">
          Here's what's happening with your documents today.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="flex items-center gap-2 shrink-0">
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-emerald-500 text-emerald-600 font-semibold text-[12px] hover:bg-emerald-50 transition-all bg-transparent cursor-pointer">
          <Plus size={14} />
          Create Package
        </button>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold text-[12px] hover:bg-emerald-600 transition-all shadow-sm border-none cursor-pointer">
          <Upload size={14} />
          Upload Document
        </button>
      </motion.div>
    </div>
  );
};

export default DashboardHeader;
