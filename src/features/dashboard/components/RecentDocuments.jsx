import React from 'react';
import { motion } from 'framer-motion';
import { FileText, MoreVertical, ChevronRight } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';

const RecentDocuments = ({ documents, itemVariants }) => {
  // Helper function to safely format dates
  const safeFormat = (dateValue, formatStr) => {
    try {
      if (!dateValue) return '-';
      const date = typeof dateValue === 'string' ? parseISO(dateValue) : dateValue;
      return isValid(date) ? format(date, formatStr) : '-';
    } catch (e) {
      return '-';
    }
  };

  // Mock data if none provided
  const displayDocs = documents?.length > 0 ? documents : [
    { id: 1, name: 'Contract Agreement.pdf', status: 'Pending', type: 'Personal', date: new Date('2024-05-22T10:30:00'), size: '2.4 MB', iconColor: 'text-rose-500', iconBg: 'bg-rose-50 dark:bg-rose-500/10' },
    { id: 2, name: 'NDA Document.docx', status: 'Signed', type: 'Package', date: new Date('2024-05-21T15:15:00'), size: '1.8 MB', iconColor: 'text-blue-500', iconBg: 'bg-blue-50 dark:bg-blue-500/10' },
    { id: 3, name: 'Partnership Agreement.pdf', status: 'Pending', type: 'Group', date: new Date('2024-05-20T11:20:00'), size: '3.2 MB', iconColor: 'text-rose-500', iconBg: 'bg-rose-50 dark:bg-rose-500/10' },
    { id: 4, name: 'Employment Contract.docx', status: 'Signed', type: 'Personal', date: new Date('2024-05-19T09:45:00'), size: '2.1 MB', iconColor: 'text-blue-500', iconBg: 'bg-blue-50 dark:bg-blue-500/10' },
    { id: 5, name: 'Invoice #INV-2024-001.pdf', status: 'Rejected', type: 'Package', date: new Date('2024-05-18T14:30:00'), size: '1.2 MB', iconColor: 'text-rose-500', iconBg: 'bg-rose-50 dark:bg-rose-500/10' },
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Signed': return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'Pending': return 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20';
      case 'Rejected': return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
      default: return 'bg-zinc-50 text-zinc-600 border-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
    }
  };

  return (
    <motion.div 
      variants={itemVariants}
      className="col-span-12 lg:col-span-8 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-500/10 dark:to-zinc-900 rounded-[2.5rem] p-8 border border-zinc-100 dark:border-zinc-800 shadow-xl"
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Recent Documents</h3>
        <button className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 transition-colors bg-transparent border-none cursor-pointer">
          View All
        </button>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black text-zinc-400 dark:text-zinc-100 uppercase tracking-[0.1em] border-b border-zinc-50 dark:border-zinc-800/50">
              <th className="pb-4">Document Name</th>
              <th className="pb-4">Status</th>
              <th className="pb-4">Type</th>
              <th className="pb-4">Last Updated</th>
              <th className="pb-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
            {displayDocs.map((doc, i) => (
              <tr key={i} className="group hover:bg-zinc-50/30 dark:hover:bg-zinc-800/20 transition-colors">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${doc.iconBg || 'bg-zinc-50'} ${doc.iconColor || 'text-zinc-500'} flex items-center justify-center shrink-0`}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white line-clamp-1">{doc.name || 'Untitled Document'}</p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-100 font-bold uppercase">{doc.size || '0 KB'}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${getStatusStyle(doc.status)}`}>
                    {doc.status || 'Unknown'}
                  </span>
                </td>
                <td className="py-4">
                  <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-100">{doc.type || 'Standard'}</p>
                </td>
                <td className="py-4">
                  <div>
                    <p className="text-[11px] font-bold text-zinc-900 dark:text-white">{safeFormat(doc.date || doc.createdAt, 'MMM d, yyyy')}</p>
                    <p className="text-[9px] text-zinc-400 dark:text-zinc-100 font-bold">{safeFormat(doc.date || doc.createdAt, 'hh:mm a')}</p>
                  </div>
                </td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="px-4 py-1.5 rounded-full border border-emerald-500 text-[9px] font-black uppercase tracking-widest text-emerald-500 hover:bg-emerald-50 transition-all bg-transparent cursor-pointer">
                      {doc.status === 'Pending' ? 'Review' : 'View'}
                    </button>
                    <button className="p-1.5 rounded-lg text-zinc-300 dark:text-zinc-100 hover:text-zinc-900 dark:hover:text-white transition-colors bg-transparent border-none cursor-pointer">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex justify-center">
        <button className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 hover:gap-3 transition-all bg-transparent border-none cursor-pointer">
          View all documents <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
};

export default RecentDocuments;
