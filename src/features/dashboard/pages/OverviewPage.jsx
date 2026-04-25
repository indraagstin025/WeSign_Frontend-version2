import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDashboard } from '../hooks/useDashboard';

// Components
import DashboardHeader from '../components/DashboardHeader';
import StatCards from '../components/StatCards';
import PendingActions from '../components/PendingActions';
import DashboardCalendar from '../components/DashboardCalendar';
import ActivityHistory from '../components/ActivityHistory';

const OverviewPage = () => {
  const { counts, actions, activities, loading, error, refresh } = useDashboard();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sinkronisasi Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar bg-zinc-100 dark:bg-zinc-950 transition-colors duration-300 relative">
      
      {/* AREA HEADER & STATS */}
      <div className="px-6 lg:px-10 pt-6 lg:pt-8 pb-6">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-[1600px] mx-auto space-y-8"
        >
          <DashboardHeader itemVariants={itemVariants} />
          <StatCards counts={counts} itemVariants={itemVariants} />
        </motion.div>
      </div>

      {/* AREA CONTENT */}
      <div className="px-6 lg:px-10 pb-10">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-[1600px] mx-auto"
        >
          <div className="grid grid-cols-12 gap-10 items-stretch">
            
            <PendingActions actions={actions} itemVariants={itemVariants} />

            <div className="col-span-12 lg:col-span-4 flex flex-col gap-10">
              <DashboardCalendar itemVariants={itemVariants} />
              <ActivityHistory activities={activities} itemVariants={itemVariants} />
            </div>

          </div>
        </motion.div>
      </div>

    </div>
  );
};

export default OverviewPage;
