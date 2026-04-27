import React from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Clock, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale/id';

const ActivityHistory = ({ activities, itemVariants }) => {
  return (
    <motion.div 
      variants={itemVariants}
      className="bg-white dark:bg-zinc-800/80 rounded-[2.5rem] p-8 shadow-sm border border-zinc-100 dark:border-zinc-700/50 flex flex-col backdrop-blur-md"
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Riwayat</h3>
        <button className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-violet-600 transition-all border-none cursor-pointer">
          <MoreVertical size={16} />
        </button>
      </div>
      <div className="space-y-6">
        {activities && activities.length > 0 ? (
          activities.map((activity, i) => (
            <div key={i} className="flex items-start gap-4 group cursor-pointer">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform shadow-sm">
                  <Clock size={18} />
                </div>
                {i !== activities.length - 1 && (
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-zinc-100 dark:bg-zinc-700/50" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-violet-600 transition-colors">
                  {activity.title || 'Aktivitas Dokumen'}
                </h4>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">
                  {activity.activityType === 'signature' ? 'Ditandatangani' : 'Diperbarui'} • {activity.updatedAt ? formatDistanceToNow(new Date(activity.updatedAt), { addSuffix: true, locale: id }) : '-'}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="py-10 flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-700 opacity-60 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Belum ada riwayat</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ActivityHistory;
