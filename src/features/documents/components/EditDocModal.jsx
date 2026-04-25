import React from 'react';
import { X, FileEdit, Save, AlertCircle, Tag } from 'lucide-react';
import { useEditDoc } from '../hooks/useEditDoc';

/**
 * @component EditDocModal
 */
const EditDocModal = ({ 
  isOpen, 
  onClose, 
  document, 
  onUpdate, 
  loading 
}) => {
  const { state, actions } = useEditDoc(document, onUpdate, onClose);

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity"
        onClick={!loading ? onClose : undefined}
      />

      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <FileEdit size={20} />
            </div>
            <h3 className="font-bold text-zinc-900 dark:text-white">Ubah Metadata</h3>
          </div>
          <button 
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-none bg-transparent cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={actions.handleSubmit} className="p-6 space-y-5">
          {/* Input Judul */}
          <div className="space-y-1.5 text-left">
            <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
              Judul Dokumen
            </label>
            <input 
              type="text" 
              value={state.title}
              disabled={loading}
              onChange={(e) => actions.setTitle(e.target.value)}
              placeholder="Masukkan judul baru..."
              className={`w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border ${state.error ? 'border-rose-400 focus:ring-rose-500/20' : 'border-zinc-200 dark:border-zinc-700 focus:ring-primary/20'} rounded-2xl focus:outline-none focus:ring-2 dark:text-white transition-all`}
            />
            {state.error && (
              <div className="flex items-center gap-1.5 text-rose-500 text-[10px] font-bold mt-1 ml-1">
                <AlertCircle size={12} />
                <span>{state.error}</span>
              </div>
            )}
          </div>

          {/* Select Kategori */}
          <div className="space-y-1.5 text-left">
            <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
              Kategori Dokumen
            </label>
            <div className="relative">
              <select 
                value={state.type}
                disabled={loading}
                onChange={(e) => actions.setType(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all appearance-none cursor-pointer"
              >
                <option value="General">Umum (General)</option>
                <option value="Contract">Kontrak / Perjanjian</option>
                <option value="Invoice">Invoice / Faktur</option>
                <option value="Certificate">Sertifikat / Bukti</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                <Tag size={16} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-2xl text-sm font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border-none cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !state.title.trim()}
              className="flex-[2] py-3 px-4 rounded-2xl text-sm font-bold bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/25 transition-all border-none cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
              ) : (
                <><Save size={16} /> Simpan Perubahan</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Loader2 = ({ size, className }) => (
  <div className={`w-${size/4} h-${size/4} border-2 border-white/20 border-t-white rounded-full animate-spin ${className}`} style={{ width: size, height: size }} />
);

export default EditDocModal;
