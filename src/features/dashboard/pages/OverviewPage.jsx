import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { useDashboard } from '../hooks/useDashboard';

import DashboardHeader from '../components/DashboardHeader';
import StatCards from '../components/StatCards';
import RecentDocuments from '../components/RecentDocuments';
import ActiveSignings from '../components/ActiveSignings';
import OverviewChart from '../components/OverviewChart';
import QuickActions from '../components/QuickActions';

const OverviewPage = () => {
  const { counts, recentDocuments, activeSignings, loading, error } = useDashboard();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120 } },
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar bg-zinc-50 dark:bg-zinc-950">
      <div className="px-5 lg:px-8 py-5 lg:py-6">
        <Motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-[1600px] mx-auto space-y-5"
        >
          {/* Header */}
          <DashboardHeader itemVariants={itemVariants} />

          {error && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          {/* Stat Cards */}
          <StatCards counts={counts} itemVariants={itemVariants} />

          {/* Recent Documents + Active Signings */}
          <section className="grid grid-cols-12 gap-4 items-start">
            <RecentDocuments documents={recentDocuments} itemVariants={itemVariants} />
            <ActiveSignings signings={activeSignings} itemVariants={itemVariants} />
          </section>

          {/* Overview Chart + Quick Actions */}
          <section className="grid grid-cols-12 gap-4 items-start">
            <OverviewChart counts={counts} itemVariants={itemVariants} />
            <QuickActions itemVariants={itemVariants} />
          </section>
        </Motion.div>
      </div>
    </div>
  );
};

export default OverviewPage;
