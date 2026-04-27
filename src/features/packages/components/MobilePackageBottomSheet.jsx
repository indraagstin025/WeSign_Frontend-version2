import React from 'react';
import { 
  Plus, 
  Trash2, 
  Check, 
  FileText, 
  Layers, 
  PenTool,
  CheckCircle2
} from 'lucide-react';
import { useMobilePackageBottomSheet } from '../hooks/useMobilePackageBottomSheet';

const MobilePackageBottomSheet = ({ 
  isOpen,
  onClose,
  onOpenCanvas, 
  currentSignature, 
  signatures, 
  onRemoveSignature,
  onFinalize,
  isSubmitting,
  documents,
  currentIndex,
  onSelectDocument,
  signaturesMap = {},
  isReadOnly = false
}) => {
  const {
    activeTab,
    setActiveTab,
    gestureHandlers,
    sheetStyle
  } = useMobilePackageBottomSheet(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300"
        onClick={onClose}
      />

      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[101] flex flex-col"
        style={{
          maxHeight: '90vh',
          ...sheetStyle
        }}
      >
        <div className="bg-white dark:bg-[#111b21] rounded-t-[2.5rem] shadow-2xl flex flex-col overflow-hidden border-t border-x border-zinc-200 dark:border-white/10">
          
          {/* Drag Handle */}
          <div 
            className="py-4 flex flex-col items-center cursor-grab active:cursor-grabbing select-none"
            {...gestureHandlers}
          >
            <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
          </div>

          {/* Tab Navigation */}
          {!isReadOnly && (
            <div className="flex px-6 pb-4 gap-2">
               <button 
                  onClick={() => setActiveTab('docs')}
                  className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all border-none cursor-pointer
                    ${activeTab === 'docs' 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                      : 'bg-zinc-100 dark:bg-white/5 text-zinc-500'
                    }
                  `}
               >
                 <Layers size={16} />
                 <span>Playlist</span>
               </button>
               <button 
                  onClick={() => setActiveTab('tools')}
                  className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all border-none cursor-pointer
                    ${activeTab === 'tools' 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                      : 'bg-zinc-100 dark:bg-white/5 text-zinc-500'
                    }
                  `}
               >
                 <PenTool size={16} />
                 <span>Alat Ttd</span>
               </button>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6 no-scrollbar" style={{ maxHeight: 'calc(90vh - 220px)' }}>
            
            {(activeTab === 'docs' || isReadOnly) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                   <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Pilih Dokumen</p>
                   <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">{currentIndex + 1} / {documents.length}</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {documents.map((doc, idx) => {
                    const isActive = currentIndex === idx;
                    const hasSignatures = signaturesMap[doc.id] && signaturesMap[doc.id].length > 0;
                    
                    return (
                      <button
                        key={doc.id}
                        onClick={() => {
                          onSelectDocument(idx);
                        }}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all border-none cursor-pointer text-left
                          ${isActive 
                            ? 'bg-emerald-500/5 dark:bg-emerald-500/10 ring-2 ring-emerald-500/20 shadow-sm' 
                            : 'bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10'
                          }
                        `}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                          ${isActive ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-zinc-800 text-zinc-400'}
                        `}>
                          {hasSignatures ? <CheckCircle2 size={18} /> : <span className="text-xs font-black">{idx + 1}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className={`text-xs font-bold truncate ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                             {doc.docVersion?.document?.title || `Dokumen ${idx + 1}`}
                           </p>
                           <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight mt-0.5">PDF Document</p>
                        </div>
                        {isActive && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'tools' && !isReadOnly && (
              <div className="space-y-6">
                {/* Tombol Tambah Tanda Tangan */}
                <button 
                  onClick={() => {
                    onOpenCanvas();
                    onClose();
                  }}
                  className="w-full h-14 flex items-center justify-center gap-3 rounded-[1.25rem] bg-emerald-600 hover:bg-emerald-700 text-white border-none font-black text-sm shadow-xl shadow-emerald-600/20 cursor-pointer active:scale-95 transition-all"
                >
                  <Plus size={22} />
                  <span>BUAT TANDA TANGAN</span>
                </button>

                {/* Preview Tanda Tangan Aktif */}
                {currentSignature && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] px-1">Tanda Tangan Aktif</p>
                    <div className="w-full aspect-[2.8/1] bg-white rounded-3xl border border-zinc-200 dark:border-white/10 flex items-center justify-center p-5 shadow-inner overflow-hidden">
                      <img src={currentSignature} alt="Signature" className="max-w-full max-h-full object-contain" />
                    </div>
                  </div>
                )}

                {/* Daftar Signature yang Ditempatkan */}
                {signatures.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] px-1">Ditempatkan Di Dokumen Ini ({signatures.length})</p>
                    <div className="space-y-2">
                      {signatures.map((sig, idx) => (
                        <div 
                          key={sig.id} 
                          className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-white/5 border border-zinc-100 dark:border-white/5 transition-all shadow-sm"
                        >
                          <span className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-black text-zinc-400">
                            {idx + 1}
                          </span>
                          <span className="flex-1 text-xs font-bold text-zinc-700 dark:text-zinc-200">
                            Halaman {sig.pageNumber}
                          </span>
                          <button 
                            onClick={() => onRemoveSignature(sig.id)} 
                            className="p-2.5 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl border-none bg-transparent cursor-pointer transition-colors active:scale-90"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {signatures.length === 0 && !currentSignature && (
                  <div className="flex flex-col items-center justify-center text-center py-10 opacity-30">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-300 mb-4 flex items-center justify-center text-zinc-400">
                       <FileText size={28} />
                    </div>
                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Belum ada Tanda Tangan</p>
                    <p className="text-[10px] text-zinc-400 mt-2 font-bold px-8">Silakan buat tanda tangan baru dan tempelkan pada area dokumen.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fixed Bottom Action */}
          <div className="p-6 bg-zinc-50 dark:bg-[#1a2329] border-t border-zinc-200 dark:border-white/5">
            <button 
              onClick={currentIndex === documents.length - 1 && isReadOnly ? onClose : onFinalize}
              disabled={isSubmitting}
              className={`w-full h-14 flex items-center justify-center gap-3 rounded-[1.25rem] text-sm font-black uppercase tracking-[0.15em] transition-all cursor-pointer shadow-xl
                ${isSubmitting || (currentIndex === documents.length - 1 && isReadOnly)
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed shadow-none' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-emerald-600/20'
                }
              `}
            >
              {isSubmitting ? (
                 <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check size={20} />
                  <span>
                    {isReadOnly 
                      ? (currentIndex === documents.length - 1 ? 'Selesai Preview' : 'Lanjut Dokumen Berikutnya')
                      : (currentIndex === documents.length - 1 ? 'Selesaikan Paket' : 'Lanjut Dokumen Berikutnya')
                    }
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobilePackageBottomSheet;
