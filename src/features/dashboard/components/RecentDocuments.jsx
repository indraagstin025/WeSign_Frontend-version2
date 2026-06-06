import React from 'react';
import { motion as Motion } from 'framer-motion';
import { FileText, MoreVertical, ArrowRight } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';

const RecentDocuments = ({ documents, itemVariants }) => {
  const safeFormat = (dateValue, formatStr) => {
    try {
      if (!dateValue) return '-';
      const date = typeof dateValue === 'string' ? parseISO(dateValue) : dateValue;
      return isValid(date) ? format(date, formatStr) : '-';
    } catch { return '-'; }
  };

  const displayDocs = Array.isArray(documents) ? documents : [];

  const normalizeStatus = (status) => String(status || 'unknown').toLowerCase();

  const getStatusStyle = (status) => {
    switch (normalizeStatus(status)) {
      case 'signed':
      case 'completed':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
      case 'pending':
      case 'finalizing':
        return 'bg-amber-50 text-amber-600 border border-amber-200';
      case 'rejected':
      case 'failed':
        return 'bg-rose-50 text-rose-600 border border-rose-200';
      case 'draft':
        return 'bg-zinc-50 text-zinc-500 border border-zinc-200';
      default: return 'bg-zinc-50 text-zinc-500 border border-zinc-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (normalizeStatus(status)) {
      case 'signed': return 'Signed';
      case 'completed': return 'Selesai';
      case 'pending': return 'Pending';
      case 'finalizing': return 'Finalizing';
      case 'rejected': return 'Ditolak';
      case 'draft': return 'Draft';
      default: return 'Unknown';
    }
  };

  const getTypeLabel = (type) => {
    switch (String(type || '').toLowerCase()) {
      case 'group': return 'Group';
      case 'package': return 'Package';
      case 'personal': return 'Personal';
      default: return 'Document';
    }
  };

  return (
    <Motion.div
      variants={itemVariants}
      className="col-span-12 lg:col-span-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-50 dark:border-zinc-800">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Recent Activity</h3>
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
            {displayDocs.map((doc) => (
              <tr key={`${doc.type}-${doc.id}-${doc.updatedAt}`} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${doc.iconBg || 'bg-zinc-50'} dark:bg-opacity-10 ${doc.iconColor || 'text-zinc-500'} flex items-center justify-center shrink-0`}>
                      <FileText size={15} />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-zinc-900 dark:text-white line-clamp-1 max-w-[220px]">{doc.title || doc.name || 'Untitled'}</p>
                      <p className="text-[10px] text-zinc-400">{doc.activityType === 'signature' ? 'Signature activity' : 'Document update'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${getStatusStyle(doc.status)}`}>
                    {getStatusLabel(doc.status)}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{getTypeLabel(doc.type)}</p>
                </td>
                <td className="px-3 py-3">
                  <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">{safeFormat(doc.updatedAt || doc.date || doc.createdAt, 'MMM d, yyyy')}</p>
                  <p className="text-[10px] text-zinc-400">{safeFormat(doc.updatedAt || doc.date || doc.createdAt, 'hh:mm a')}</p>
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button className="px-3 py-1 rounded-lg border border-emerald-500 text-[10px] font-semibold text-emerald-600 hover:bg-emerald-50 transition-all bg-transparent cursor-pointer">
                      {normalizeStatus(doc.status) === 'pending' ? 'Review' : 'View'}
                    </button>
                    <button className="p-1 rounded-lg text-zinc-300 hover:text-zinc-600 dark:hover:text-white transition-colors bg-transparent border-none cursor-pointer">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {displayDocs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center">
                  <div className="mx-auto w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-300 mb-3">
                    <FileText size={18} />
                  </div>
                  <p className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-200">Belum ada aktivitas dokumen</p>
                  <p className="text-[10px] text-zinc-400 mt-1">Upload atau tanda tangani dokumen untuk melihat aktivitas terbaru.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-zinc-50 dark:border-zinc-800">
        <button className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-all bg-transparent border-none cursor-pointer">
          View all documents <ArrowRight size={12} />
        </button>
      </div>
    </Motion.div>
  );
};

export default RecentDocuments;
