import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, UserCircle } from 'lucide-react';

const ActiveSignings = ({ signings, itemVariants }) => {
  // Mock data if none provided by API
  const displaySignings = signings?.length > 0 ? signings : [
    { id: 1, name: 'Project Proposal.pdf', progress: 60, detail: 'Group / 3 of 5 completed', avatars: ['https://i.pravatar.cc/150?u=1', 'https://i.pravatar.cc/150?u=2', 'https://i.pravatar.cc/150?u=3'] },
    { id: 2, name: 'Vendor Agreement.pdf', progress: 66, detail: 'Package / 2 of 3 completed', avatars: ['https://i.pravatar.cc/150?u=4', 'https://i.pravatar.cc/150?u=5'] },
    { id: 3, name: 'Service Contract.pdf', progress: 100, detail: 'Personal', status: 'Completed', avatars: ['https://i.pravatar.cc/150?u=6'] },
    { id: 4, name: 'Company Policy.pdf', progress: 0, detail: 'Group / Waiting for 2 people', status: 'Waiting', avatars: ['https://i.pravatar.cc/150?u=7', 'https://i.pravatar.cc/150?u=8'] },
  ];

  return (
    <motion.div 
      variants={itemVariants}
      className="col-span-12 lg:col-span-4 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-500/10 dark:to-zinc-900 rounded-[2.5rem] p-8 border border-zinc-100 dark:border-zinc-800 shadow-xl flex flex-col"
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Active Signings</h3>
        <button className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 transition-colors bg-transparent border-none cursor-pointer">
          View All
        </button>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-1">
        {displaySignings.map((item, i) => (
          <div key={i} className="group">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex -space-x-2">
                {item.avatars && item.avatars.length > 0 ? (
                  item.avatars.slice(0, 3).map((url, idx) => (
                    <img 
                      key={idx} 
                      className="inline-block h-8 w-8 rounded-full border-2 border-white dark:border-zinc-900 object-cover bg-zinc-100" 
                      src={url} 
                      alt="avatar" 
                    />
                  ))
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-50 flex items-center justify-center text-zinc-300">
                    <UserCircle size={18} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{item.name || item.title || 'Document'}</p>
                <p className="text-[9px] text-zinc-100 dark:text-zinc-100 font-bold truncate uppercase">{item.detail || 'Signing Progress'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${item.progress || 0}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
              <div className="shrink-0 min-w-[40px] text-right">
                {item.status === 'Completed' || item.progress === 100 ? (
                  <div className="flex items-center gap-1 text-emerald-500 text-[9px] font-black uppercase tracking-widest">
                    <CheckCircle2 size={12} />
                    <span>Done</span>
                  </div>
                ) : item.status === 'Waiting' ? (
                  <span className="text-orange-500 text-[9px] font-black uppercase tracking-widest">Waiting</span>
                ) : (
                  <span className="text-zinc-400 text-[9px] font-black">{item.progress || 0}%</span>
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
