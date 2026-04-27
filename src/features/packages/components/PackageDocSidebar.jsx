import React from 'react';
import { FileText, CheckCircle2, ChevronRight, Layers } from 'lucide-react';

/**
 * @component PackageDocSidebar
 * @description Sidebar navigasi Playlist Dokumen untuk pengerjaan Paket (Batch).
 */
const PackageDocSidebar = ({ 
  documents, 
  currentIndex, 
  onSelect, 
  signaturesMap = {},
  isReadOnly = false
}) => {
  return (
    <aside className="hidden lg:flex w-64 bg-zinc-50 dark:bg-[#0b141a] border-r border-zinc-200 dark:border-white/5 flex-col shrink-0 z-20 overflow-hidden">
      {/* Header Sidebar */}
      <div className="p-6 border-b border-zinc-200 dark:border-white/5 bg-white dark:bg-[#111b21]">
        <div className="flex items-center gap-3 mb-2">
           <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Layers size={18} />
           </div>
           <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Isi Paket</h3>
        </div>
        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-relaxed">
          {documents.length} Dokumen Total
        </p>
      </div>

      {/* Playlist List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1.5 focus:outline-none">
        {documents.map((doc, idx) => {
          const isActive = currentIndex === idx;
          const hasSignatures = signaturesMap[doc.id] && signaturesMap[doc.id].length > 0;

          return (
            <button
              key={doc.id}
              onClick={() => onSelect(idx)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 border-none cursor-pointer group text-left
                ${isActive 
                  ? 'bg-white dark:bg-[#202c33] shadow-lg shadow-zinc-200/50 dark:shadow-black/20 ring-1 ring-zinc-200/50 dark:ring-white/10' 
                  : 'hover:bg-zinc-200/50 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-400'
                }
              `}
            >
              {/* Icon / Number */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors
                ${isActive 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                  : 'bg-zinc-200/50 dark:bg-white/5 text-zinc-400 group-hover:bg-zinc-300/50 dark:group-hover:bg-white/10'
                }
              `}>
                {(!isReadOnly && hasSignatures) ? (
                  <CheckCircle2 size={16} strokeWidth={3} />
                ) : (
                  <span className="text-[11px] font-black uppercase tracking-tighter">{idx + 1}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 pr-1">
                <p className={`text-[11px] font-bold truncate leading-tight mb-0.5
                  ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-300'}
                `}>
                  {doc.docVersion?.document?.title || `Dokumen ${idx + 1}`}
                </p>
                <div className="flex items-center gap-1.5 grayscale opacity-60">
                   <FileText size={10} className="text-zinc-400" />
                   <span className="text-[9px] font-bold uppercase tracking-tight text-zinc-400">PDF Document</span>
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight 
                size={14} 
                className={`transition-transform duration-300 shrink-0
                  ${isActive ? 'translate-x-0 opacity-100 text-emerald-500' : '-translate-x-2 opacity-0 text-zinc-300'}
                `} 
              />
            </button>
          );
        })}
      </div>

      {/* Footer Info (Only for Signing Mode) */}
      {!isReadOnly && (
        <div className="p-4 border-t border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-[#0b141a]">
           <div className="flex items-center justify-between text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest px-2">
              <span>Kemajuan</span>
              <span>{Object.keys(signaturesMap).length}/{documents.length} TTD</span>
           </div>
           <div className="mt-2 w-full h-1 bg-zinc-200 dark:bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-700 ease-out" 
                style={{ width: `${(Object.keys(signaturesMap).length / documents.length) * 100}%` }}
              />
           </div>
        </div>
      )}
    </aside>
  );
};

export default PackageDocSidebar;
