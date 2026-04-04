import React, { useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Loader2, 
  Trash2, 
  CheckCircle2, 
  ShieldAlert, 
  Layers 
} from 'lucide-react';
import { useCreatePackage } from '../hooks/useCreatePackage';

const CreatePackageModal = ({ isOpen, onClose, onSuccess }) => {
  const fileInputRef = useRef(null);

  const {
    files,
    title,
    setTitle,
    category,
    setCategory,
    loading,
    error,
    setError,
    success,
    processNewFiles,
    removeFile,
    clearFiles,
    handleSubmit,
    handleClose
  } = useCreatePackage(onSuccess, onClose);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!loading) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      await processNewFiles(droppedFiles);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      await processNewFiles(selectedFiles);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 drop-shadow-2xl animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading tracking-tight text-left">Buat Paket Baru</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-left">Maksimal 5 dokumen • Hingga 50MB per file • PDF Digital</p>
            </div>
          </div>
          <button 
            disabled={loading}
            onClick={handleClose} 
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors border-none bg-transparent cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulir (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto w-full p-6">
          <form id="createPackageForm" onSubmit={handleSubmit} className="space-y-6">
            {success ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-90 duration-300">
                <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-500">
                  <CheckCircle2 size={56} className="animate-bounce" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Paket Berhasil Dibuat!</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{files.length} dokumen telah masuk ke dalam brankas paket.</p>
                </div>
              </div>
            ) : (
              <>
                {/* 1. Drag & Drop Upload Zone */}
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => !loading && fileInputRef.current?.click()}
                  className={`group relative border-2 border-dashed ${error && files.length === 0 ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20'} rounded-3xl p-10 flex flex-col items-center justify-center gap-4 hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer shadow-sm`}
                >
                  <div className={`w-20 h-20 ${error && files.length === 0 ? 'bg-rose-100 text-rose-500' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700'} rounded-2xl flex items-center justify-center group-hover:text-primary group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl group-hover:shadow-primary/20 transition-all shadow-md`}>
                    <UploadCloud size={40} strokeWidth={1.5} />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-slate-700 dark:text-slate-200">
                      Tarik & Lepas File PDF ke Sini
                    </p>
                    <p className="text-[12px] text-slate-500 mt-1 max-w-sm font-medium leading-relaxed">
                      Atau klik untuk menelusuri. Maksimal <strong className="text-primary font-bold">5 dokumen</strong> sekaligus (Hingga <strong className="text-primary font-bold">50MB per file</strong>).
                    </p>
                  </div>
                  <input 
                    type="file" 
                    multiple
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept=".pdf,application/pdf"
                  />
                </div>

                {/* 2. File Previews Array */}
                {files.length > 0 && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between px-2">
                       <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Antrean Dokumen ({files.length}/5)</h4>
                       {!loading && (
                           <button type="button" onClick={clearFiles} className="text-[11px] font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 bg-transparent border-none cursor-pointer transition-colors px-2 py-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/30">Hapus Semua</button>
                       )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-2 rounded-xl custom-scrollbar">
                      {files.map((f, idx) => (
                         <div key={`${f.name}-${idx}`} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-primary/30 transition-colors group shadow-sm">
                           <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center text-rose-500 shrink-0 border border-rose-100 dark:border-rose-800">
                             <FileText size={20} />
                           </div>
                           <div className="flex-1 truncate min-w-0">
                             <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{f.name}</p>
                             <p className="text-[10px] text-slate-500 font-medium font-mono">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                           </div>
                           {!loading && (
                             <button
                               type="button" 
                               onClick={() => removeFile(idx)}
                               className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-all shrink-0"
                             >
                               <Trash2 size={14} />
                             </button>
                           )}
                         </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Package Title & Category Input */}
                <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1 text-left">Nama Paket (Opsional)</label>
                     <input 
                       type="text"
                       disabled={loading}
                       value={title}
                       onChange={(e) => setTitle(e.target.value)}
                       placeholder="Contoh: Paket Kontrak"
                       className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 dark:text-white placeholder:text-slate-400 font-medium transition-all shadow-inner"
                     />
                     <p className="text-[11px] text-slate-500 mt-2 ml-2">Jika dikosongkan, nama paket akan mengikuti nama file dokumen pertama Anda.</p>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1 text-left">Label / Kategori</label>
                      <select 
                        disabled={loading}
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 dark:text-white font-medium transition-all shadow-inner cursor-pointer"
                      >
                        <option value="General">Umum (General)</option>
                        <option value="Contract">Kontrak / Perjanjian</option>
                        <option value="Invoice">Invoice / Faktur</option>
                        <option value="Certificate">Sertifikat / Bukti</option>
                      </select>
                   </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-xs animate-in shake-in duration-300">
                    <ShieldAlert size={18} className="shrink-0" />
                    <span className="text-left font-medium leading-relaxed">{error}</span>
                  </div>
                )}
              </>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        {!success && (
          <div className="p-6 pt-0 mt-4 shrink-0 flex gap-4 bg-white dark:bg-slate-900">
            <button 
              type="button"
              disabled={loading}
              onClick={handleClose}
              className="flex-1 px-4 py-4 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all border border-slate-200 dark:border-slate-800 bg-transparent cursor-pointer"
            >
              Kembali
            </button>
            <button 
              form="createPackageForm"
              type="submit"
              disabled={loading || files.length === 0}
              className="flex-[2] flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-bold py-4 rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all disabled:opacity-50 disabled:shadow-none border-none cursor-pointer group"
            >
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /> Mengunggah Paket...</>
              ) : (
                <>Konfirmasi & Simpan Paket <div className="bg-white/20 p-1 rounded-lg ml-2 group-hover:translate-x-1 transition-transform"><UploadCloud size={16} /></div></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePackageModal;
