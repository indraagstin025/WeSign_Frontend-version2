import React from 'react';
import { motion } from 'framer-motion';
import { FileText, MoreVertical, ChevronRight, ArrowRight } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';

const RecentDocuments = ({ documents, itemVariants }) => {
  const safeFormat = (dateValue, formatStr) => {
    try {
      if (!dateValue) return '-';
      const date = typeof dateValue === 'string' ? parseISO(dateValue) : dateValue;
      return isValid(date) ? format(date, formatStr) : '-';
    } catch { return '-'; }
  };

  const displayDocs = documents?.length > 0 ? documents : [
    { id: 1, name: 'Contract Agreement.pdf', status: 'Pending', type: 'Personal', date: new Date('2024-05-22T10:30:00'), size: '2.4 MB', iconColor: 'text-rose-500', iconBg: 'bg-rose-50' },
    { id: 2, name: 'NDA Document.docx', status: 'Signed', type: 'Package', date: new Date('2024-05-21T15:15:00'), size: '1.8 MB', iconColor: 'text-blue-500', iconBg: 'bg-blue-50' },
    { id: 3, name: 'Partnership Agreement.pdf', status: 'Pending', type: 'Group', date: new Date('2024-05-20T11:20:00'), size: '3.2 MB', iconColor: 'text-rose-500', iconBg: 'bg-rose-50' },
    { id: 4, name: 'Employment Contract.docx', status: 'Signed', type: 'Personal', date: new Date('2024-05-19T09:45:00'), size: '2.1 MB', iconColor: 'text-blue-500', iconBg: 'bg-blue-50' },
    { id: 5, name: 'Invoice #INV-2024-001.pdf', status: 'Rejected', type: 'Package', date: new Date('2024-05-18T14:30:00'), size: '1.2 MB', iconColor: 'text-rose-500', iconBg: 'bg-rose-50' },
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Signed': return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
      case 'Pending': return 'bg-amber-50 text-amber-600 border border-amber-200';
      case 'Rejected': return 'bg-rose-50 text-rose-600 border border-rose-200';
      default: return 'bg-zinc-50 text-zinc-500 border border-zinc-200';
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      className="col-span-12 lg:col-span-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-50 dark:border-zinc-800">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Recent Documents</h3>
        <button className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1">
          View All <ArrowRight size={12} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-50 dark:border-zinc-800">
              <th className="px-5 py-3">Document Name</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Last Updated</th>
              <th className="px-3 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {displayDocs.map((doc, i) => (
              <tr key={i} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${doc.iconBg || 'bg-zinc-50'} dark:bg-opacity-10 ${doc.iconColor || 'text-zinc-500'} flex items-center justify-center shrink-0`}>
                      <FileText size={15} />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-zinc-900 dark:text-white line-clamp-1 max-w-[180px]">{doc.name || 'Untitled'}</p>
                      <p className="text-[10px] text-zinc-400">{doc.size || '0 KB'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${getStatusStyle(doc.status)}`}>
                    {doc.status || 'Unknown'}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{doc.type || 'Standard'}</p>
                </td>
                <td className="px-3 py-3">
                  <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">{safeFormat(doc.date || doc.createdAt, 'MMM d, yyyy')}</p>
                  <p className="text-[10px] text-zinc-400">{safeFormat(doc.date || doc.createdAt, 'hh:mm a')}</p>
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button className="px-3 py-1 rounded-lg border border-emerald-500 text-[10px] font-semibold text-emerald-600 hover:bg-emerald-50 transition-all bg-transparent cursor-pointer">
                      {doc.status === 'Pending' ? 'Review' : 'View'}
                    </button>
                    <button className="p-1 rounded-lg text-zinc-300 hover:text-zinc-600 dark:hover:text-white transition-colors bg-transparent border-none cursor-pointer">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-zinc-50 dark:border-zinc-800">
        <button className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-all bg-transparent border-none cursor-pointer">
          View all documents <ArrowRight size={12} />
        </button>
      </div>
    </motion.div>
  );
};

export default RecentDocuments;
