import React from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale/id';

const ActivityHistory = ({ activities, itemVariants }) => {
  return (
    <motion.div 
      variants={itemVariants}
      className="bg-white dark:bg-zinc-800/80 rounded-[2.5rem] p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)] dark:shadow-[0_35px_70px_-20px_rgba(0,0,0,0.9)] border border-zinc-200/60 dark:border-zinc-700/50 flex flex-col backdrop-blur-md"
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Riwayat</h3>
        <MoreVertical size={20} className="text-zinc-400 cursor-pointer" />
      </div>
      <div className="space-y-6">
        {activities && activities.length > 0 ? (
          activities.map((activity, i) => (
            <div key={i} className="flex gap-4 group cursor-default">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                  <CheckCircle2 size={14} />
                </div>
                {i !== activities.length - 1 && (
                  <div className="w-px h-10 bg-zinc-100 dark:bg-zinc-800 my-1"></div>
                )}
              </div>
              <div className="pb-2">
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 leading-tight mb-1">
                  {activity.title || 'Aktivitas Dokumen'}
                </p>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
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
