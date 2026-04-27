import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDashboard } from '../hooks/useDashboard';

// Components
import DashboardHeader from '../components/DashboardHeader';
import StatCards from '../components/StatCards';
import RecentDocuments from '../components/RecentDocuments';
import ActiveSignings from '../components/ActiveSignings';
import OverviewChart from '../components/OverviewChart';
import QuickActions from '../components/QuickActions';

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
      <div className="flex-1 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Synchronizing Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar bg-zinc-50/50 dark:bg-zinc-950 transition-colors duration-300 relative">
      
      <div className="px-6 lg:px-8 py-6 lg:py-8">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-[1700px] mx-auto space-y-8"
        >
          {/* Header & Stats Section */}
          <section className="space-y-6">
            <DashboardHeader itemVariants={itemVariants} />
            <StatCards counts={counts} itemVariants={itemVariants} />
          </section>

          {/* Documents & Signings Section */}
          <section className="grid grid-cols-12 gap-6 items-stretch">
            <RecentDocuments documents={actions} itemVariants={itemVariants} />
            <ActiveSignings signings={activities} itemVariants={itemVariants} />
          </section>

          {/* Overview & Quick Actions Section */}
          <section className="grid grid-cols-12 gap-6 items-stretch">
            <OverviewChart itemVariants={itemVariants} />
            <QuickActions itemVariants={itemVariants} />
          </section>

        </motion.div>
      </div>

    </div>
  );

};

export default OverviewPage;

