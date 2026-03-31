import React, { useState, useEffect } from 'react';
import { X, FileEdit, Save, AlertCircle, Tag } from 'lucide-react';

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
  const [title, setTitle] = useState('');
  const [type, setType] = useState('General');
  const [error, setError] = useState('');

  // Sinkronisasi data saat modal dibuka
  useEffect(() => {
    if (document) {
      setTitle(document.title || '');
      setType(document.type || 'General');
      setError('');
    }
  }, [document]);

  if (!isOpen || !document) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validasi
    const cleanedTitle = title.trim();
    if (!cleanedTitle) {
      setError('Judul dokumen tidak boleh kosong.');
      return;
    }

    // Jika tidak ada perubahan sama sekali
    if (cleanedTitle === document.title && type === document.type) {
      onClose();
      return;
    }

    onUpdate(document.id, { 
      title: cleanedTitle,
      type: type 
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={!loading ? onClose : undefined}
      />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <FileEdit size={20} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">Ubah Metadata</h3>
          </div>
          <button 
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-none bg-transparent cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Input Judul */}
          <div className="space-y-1.5 text-left">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
              Judul Dokumen
            </label>
            <input 
              type="text" 
              value={title}
              disabled={loading}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="Masukkan judul baru..."
              className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${error ? 'border-rose-400 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-700 focus:ring-primary/20'} rounded-2xl focus:outline-none focus:ring-2 dark:text-white transition-all`}
            />
            {error && (
              <div className="flex items-center gap-1.5 text-rose-500 text-[10px] font-bold mt-1 ml-1">
                <AlertCircle size={12} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Select Kategori */}
          <div className="space-y-1.5 text-left">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
              Kategori Dokumen
            </label>
            <div className="relative">
              <select 
                value={type}
                disabled={loading}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all appearance-none cursor-pointer"
              >
                <option value="General">Umum (General)</option>
                <option value="Contract">Kontrak / Perjanjian</option>
                <option value="Invoice">Invoice / Faktur</option>
                <option value="Certificate">Sertifikat / Bukti</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
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
              className="flex-1 py-3 px-4 rounded-2xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border-none cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
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

