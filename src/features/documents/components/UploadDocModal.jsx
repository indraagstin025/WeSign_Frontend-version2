import React, { useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Loader2,
  FileBox,
  ShieldAlert
} from 'lucide-react';
import { useUploadDoc } from '../hooks/useUploadDoc';

/**
 * @component UploadDocModal
 */
const UploadDocModal = ({ isOpen, onClose, onSuccess }) => {
  const fileInputRef = useRef(null);
  const { state, actions } = useUploadDoc(onSuccess, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 drop-shadow-2xl animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={actions.handleClose} />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Upload size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-heading tracking-tight text-left">Unggah Dokumen</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-left">PDF Digital • Maks 10MB • Aman & Terenkripsi</p>
            </div>
          </div>
          <button 
            disabled={state.loading || state.validating}
            onClick={actions.handleClose} 
            className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 transition-colors border-none bg-transparent cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={actions.handleSubmit} className="p-6 space-y-5">
          {state.success ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-90 duration-300">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-500">
                <CheckCircle2 size={48} className="animate-bounce" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white">Berhasil Diunggah</h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Dokumen Anda sedang diproses ke Brankas.</p>
              </div>
            </div>
          ) : (
            <>
              {!state.file ? (
                <div 
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={actions.handleDrop}
                  onClick={() => !(state.loading || state.validating) && fileInputRef.current?.click()}
                  className={`group relative border-2 border-dashed ${state.error ? 'border-rose-300 bg-rose-50/30' : 'border-zinc-200 dark:border-zinc-700'} rounded-2xl p-10 flex flex-col items-center justify-center gap-3 hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer`}
                >
                  <div className={`w-16 h-16 ${state.error ? 'bg-rose-100 text-rose-500' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-400'} rounded-full flex items-center justify-center group-hover:text-primary group-hover:scale-110 transition-all shadow-inner`}>
                    {state.validating ? <Loader2 size={32} className="animate-spin text-primary" /> : <FileBox size={32} />}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{state.validating ? 'Memvalidasi PDF...' : 'Klik atau Seret file PDF'}</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-1 uppercase tracking-wider font-semibold">Tipe File: PDF (Tanpa Password)</p>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={(e) => actions.setFile(e.target.files[0])} 
                    className="hidden" 
                    accept=".pdf,application/pdf"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                      <FileText size={24} />
                    </div>
                    <div className="flex-1 min-w-0 pr-8 text-left">
                       <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">{state.file.name}</p>
                       <p className="text-[10px] text-zinc-500 font-medium mt-0.5">{(state.file.size / 1024 / 1024).toFixed(2)} MB • PDF Digital</p>
                    </div>
                    {!state.loading && (
                      <button 
                        type="button"
                        onClick={() => actions.setFile(null)}
                        className="p-1.5 px-3 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                      >
                        Ganti
                      </button>
                    )}
                  </div>

                  {/* PROGRESS BAR */}
                  {state.loading && state.uploadProgress > 0 && (
                    <div className="space-y-2 px-1">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                        <span className="text-primary animate-pulse">Sedang mengunggah...</span>
                        <span className="text-zinc-500">{state.uploadProgress}%</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300 ease-out"
                          style={{ width: `${state.uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div className="text-left">
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">Judul Dokumen</label>
                  <input 
                    type="text"
                    required
                    disabled={state.loading}
                    value={state.title}
                    onChange={(e) => actions.setTitle(e.target.value)}
                    placeholder="Contoh: Surat Perjanjian Kerjasama"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white placeholder:text-zinc-400 transition-all font-medium"
                  />
                </div>
                <div className="text-left">
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">Kategori / Tipe</label>
                  <select 
                    disabled={state.loading}
                    value={state.type}
                    onChange={(e) => actions.setType(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all cursor-pointer font-medium"
                  >
                    <option value="General">Umum (General)</option>
                    <option value="Contract">Kontrak / Perjanjian</option>
                    <option value="Invoice">Invoice / Faktur</option>
                    <option value="Certificate">Sertifikat / Bukti</option>
                  </select>
                </div>
              </div>

              {state.error && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-xs animate-in shake-in duration-300">
                  <ShieldAlert size={18} className="shrink-0" />
                  <span className="text-left font-medium leading-relaxed">{state.error}</span>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button 
                  type="submit"
                  disabled={state.loading || !state.file}
                  className="flex-[2] flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-primary/30 transition-all disabled:opacity-50 border-none cursor-pointer"
                >
                  {state.loading ? (
                    <><Loader2 size={18} className="animate-spin" /> {state.uploadProgress > 0 ? 'Mengamankan File...' : 'Menghubungi Server...'}</>
                  ) : (
                    <>Mulai Unggah</>
                  )}
                </button>
                <button 
                  type="button"
                  disabled={state.loading}
                  onClick={actions.handleClose}
                  className="flex-1 px-4 py-3.5 text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all border-none bg-transparent cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default UploadDocModal;
