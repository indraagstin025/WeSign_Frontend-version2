import React from 'react';
import { motion as Motion } from 'framer-motion';
import { FileSignature, Package, UserCircle, ArrowRight } from 'lucide-react';

const ActiveSignings = ({ signings, itemVariants }) => {
  const displaySignings = Array.isArray(signings) ? signings : [];

  const getTypeLabel = (type) => {
    switch (String(type || '').toLowerCase()) {
      case 'group': return 'Group document';
      case 'package': return 'Package';
      case 'personal': return 'Personal document';
      default: return 'Document';
    }
  };

  const getStatusLabel = (item) => {
    if (item.status === 'DRAFT' && item.type === 'package') return `${item.count || 0} dokumen perlu diproses`;
    if (item.status === 'DRAFT') return 'Draft perlu dilanjutkan';
    return 'Menunggu tanda tangan Anda';
  };

  return (
    <Motion.div
      variants={itemVariants}
      className="col-span-12 lg:col-span-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-50 dark:border-zinc-800">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Perlu Ditandatangani</h3>
        <button className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1">
          View All <ArrowRight size={12} />
        </button>
      </div>

      <div className="flex-1 divide-y divide-zinc-50 dark:divide-zinc-800 overflow-y-auto no-scrollbar">
        {displaySignings.map((item) => (
          <div key={`${item.type}-${item.id}`} className="px-5 py-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.type === 'package' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {item.type === 'package' ? <Package size={16} /> : <FileSignature size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-zinc-900 dark:text-white truncate">{item.title || 'Document'}</p>
                <p className="text-[10px] text-zinc-400 truncate">{getTypeLabel(item.type)} - {item.ownerName || '-'}</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                    {getStatusLabel(item)}
                  </span>
                  <button className="shrink-0 rounded-lg border border-emerald-500 px-3 py-1 text-[10px] font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors bg-transparent">
                    Buka
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {displaySignings.length === 0 && (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3">
              <UserCircle size={18} />
            </div>
            <p className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-200">Tidak ada signing aktif</p>
            <p className="text-[10px] text-zinc-400 mt-1">Dokumen yang perlu Anda tanda tangani akan muncul di sini.</p>
          </div>
        )}
      </div>
    </Motion.div>
  );
};

export default ActiveSignings;
