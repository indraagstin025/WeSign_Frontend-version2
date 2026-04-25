import React from 'react';
import { 
  X, 
  Download, 
  RotateCcw, 
  FileText, 
  CheckCircle2, 
  Clock
} from 'lucide-react';
import { useVersionHistory } from '../hooks/useVersionHistory';

/**
 * @component VersionHistoryModal
 */
const VersionHistoryModal = ({ isOpen, onClose, document, onRollbackSuccess }) => {
  const { state, actions } = useVersionHistory(isOpen, document, onRollbackSuccess, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="text-left">
            <h2 className="text-xl font-bold font-heading tracking-tight text-zinc-800 dark:text-white">
              Riwayat Versi Dokumen
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">
              {document?.title || "Dokumen Tanpa Judul"}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 transition-colors border-none bg-transparent cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 sm:p-6 flex-1 max-h-[70vh] overflow-y-auto">
          {state.loading ? (
             <div className="flex flex-col items-center justify-center py-10">
               <div className="w-10 h-10 border-4 border-zinc-100 dark:border-zinc-800 border-t-primary rounded-full animate-spin" />
               <p className="mt-4 text-sm font-medium text-zinc-500">Memuat riwayat...</p>
             </div>
          ) : state.error ? (
            <div className="p-4 bg-rose-50 text-rose-500 rounded-xl text-center text-sm font-medium border border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/50">
              {state.error}
            </div>
          ) : state.versions.length > 0 ? (
            <div className="space-y-6 relative">
              {/* Timeline Connector */}
              <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-zinc-200 dark:bg-zinc-800" />

              {state.versions.map((ver, idx) => {
                const isV1 = idx === 0; // V1 pasti index 0 (reversed in hook)
                const isFinal = !isV1; // V2 pasti index > 0

                return (
                  <div key={ver.id} className="relative pl-16">
                    {/* Icon Bullet */}
                    <div className="absolute left-0 top-1 w-14 flex justify-center">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center border-[3px] border-white dark:border-zinc-900 z-10 ${
                         isFinal ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                       }`}>
                          {isFinal ? <CheckCircle2 size={20} /> : <FileText size={20} />}
                       </div>
                    </div>

                    {/* Card Content */}
                    <div className={`p-4 rounded-xl border text-left ${
                      isFinal ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/30' : 'bg-white border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700'
                    }`}>
                       <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                         
                         <div>
                           <div className="flex items-center gap-2 mb-1">
                             <h4 className="font-bold text-zinc-800 dark:text-white capitalize">
                               {isV1 ? "Versi 1 (Dokumen Asli)" : "Versi 2 (Dokumen Final)"}
                             </h4>
                             {((isFinal) || (!isFinal && state.versions.length === 1)) && (
                               <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full">
                                 Aktif
                               </span>
                             )}
                           </div>
                           
                           <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                             <Clock size={12} />
                             {new Intl.DateTimeFormat('id-ID', {
                               day: '2-digit', month: 'short', year: 'numeric',
                               hour: '2-digit', minute: '2-digit'
                             }).format(new Date(ver.createdAt))}
                           </div>

                           {/* Metadata / Signers section - jika V2 tampilkan info signer */}
                           {isFinal && ver.signaturesPersonal?.length > 0 && (
                             <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                               <span className="font-semibold">Ditandatangani oleh: </span>
                               {ver.signaturesPersonal.map(s => s.signer?.name || "User").join(", ")}
                             </div>
                           )}
                         </div>

                         {/* Actions Container */}
                         <div className="flex flex-col gap-3 w-full sm:w-48 shrink-0 mt-4 sm:mt-0">
                           <button 
                             onClick={() => actions.handleDownload(ver.id)}
                             className={`group flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border-none cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${
                               isFinal 
                               ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 focus:ring-emerald-500' 
                               : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-zinc-700 dark:text-zinc-200 shadow-sm focus:ring-blue-500'
                             }`}
                           >
                             <Download size={16} className={`transition-transform duration-200 ${!isFinal ? 'group-hover:-translate-y-0.5' : 'group-hover:translate-y-0.5'}`} /> 
                             {isFinal ? 'Unduh PDF Final' : 'Unduh Dokumen'}
                           </button>

                           {isFinal && (
                             <button
                               onClick={() => actions.handleRollback(state.versions[0].id)}
                               disabled={state.isRollingBack}
                               className={`group flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500 dark:hover:text-white border border-rose-200 dark:border-rose-500/20 hover:border-rose-500 rounded-xl text-sm font-bold transition-all duration-300 border-none cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 dark:focus:ring-offset-zinc-900 ${
                                 state.isRollingBack ? 'opacity-60 cursor-not-allowed scale-100' : ''
                               }`}
                             >
                               <RotateCcw size={16} className={`${state.isRollingBack ? 'animate-spin' : 'transition-transform duration-300 group-hover:-rotate-180'}`} /> 
                               {state.isRollingBack ? 'Membatalkan...' : 'Batalkan Tanda Tangan'}
                             </button>
                           )}
                         </div>

                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
             <div className="text-center py-10 text-zinc-500">Tidak ada riwayat.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryModal;
