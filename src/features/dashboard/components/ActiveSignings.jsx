import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, UserCircle, ArrowRight } from 'lucide-react';

const ActiveSignings = ({ signings, itemVariants }) => {
  const displaySignings = signings?.length > 0 ? signings : [
    { id: 1, name: 'Project Proposal.pdf', progress: 60, detail: 'Group / 3 of 5 completed', avatars: ['https://i.pravatar.cc/150?u=1', 'https://i.pravatar.cc/150?u=2', 'https://i.pravatar.cc/150?u=3'] },
    { id: 2, name: 'Vendor Agreement.pdf', progress: 66, detail: 'Package / 2 of 3 completed', avatars: ['https://i.pravatar.cc/150?u=4', 'https://i.pravatar.cc/150?u=5'] },
    { id: 3, name: 'Service Contract.pdf', progress: 100, detail: 'Personal', status: 'Completed', avatars: ['https://i.pravatar.cc/150?u=6'] },
    { id: 4, name: 'Company Policy.pdf', progress: 0, detail: 'Group / Waiting for 2 people', status: 'Waiting', avatars: ['https://i.pravatar.cc/150?u=7', 'https://i.pravatar.cc/150?u=8'] },
  ];

  return (
    <motion.div
      variants={itemVariants}
      className="col-span-12 lg:col-span-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-50 dark:border-zinc-800">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Active Signings</h3>
        <button className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1">
          View All <ArrowRight size={12} />
        </button>
      </div>

      <div className="flex-1 divide-y divide-zinc-50 dark:divide-zinc-800 overflow-y-auto no-scrollbar">
        {displaySignings.map((item, i) => (
          <div key={i} className="px-5 py-3.5 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
            <div className="flex items-center gap-3 mb-2.5">
              {/* Avatars */}
              <div className="flex -space-x-1.5 shrink-0">
                {item.avatars?.slice(0, 3).map((url, idx) => (
                  <img
                    key={idx}
                    className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-900 object-cover bg-zinc-100"
                    src={url}
                    alt="avatar"
                  />
                ))}
                {!item.avatars?.length && (
                  <div className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-100 flex items-center justify-center text-zinc-300">
                    <UserCircle size={14} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-zinc-900 dark:text-white truncate">{item.name || item.title || 'Document'}</p>
                <p className="text-[10px] text-zinc-400 truncate">{item.detail || 'Signing Progress'}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.progress || 0}%` }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className={`h-full rounded-full ${item.progress === 100 ? 'bg-emerald-500' : 'bg-emerald-500'}`}
                />
              </div>
              <div className="shrink-0 min-w-[52px] text-right">
                {item.status === 'Completed' || item.progress === 100 ? (
                  <span className="flex items-center gap-1 text-emerald-500 text-[10px] font-semibold justify-end">
                    <CheckCircle2 size={11} /> Completed
                  </span>
                ) : item.status === 'Waiting' ? (
                  <span className="text-amber-500 text-[10px] font-semibold">Waiting</span>
                ) : (
                  <span className="text-zinc-400 text-[10px] font-semibold">{item.progress || 0}%</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default ActiveSignings;
