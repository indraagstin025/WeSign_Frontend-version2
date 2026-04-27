import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Users, CheckSquare, Square, Loader2, Info, AlertTriangle, WifiOff, ServerCrash } from 'lucide-react';
import { uploadGroupDocument } from '../api/groupService';

/**
 * @component UploadGroupDocModal
 * @description Modal untuk upload dokumen ke grup dengan gaya profesional.
 */
const UploadGroupDocModal = ({ isOpen, onClose, groupId, members = [], onSuccess }) => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [selectedSigners, setSelectedSigners] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);  // { message, type: 'network'|'server'|'validation' }
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf') {
      setError({ message: 'Sistem hanya menerima berkas berformat PDF.', type: 'validation' });
      return;
    }
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError({ message: 'Ukuran berkas tidak boleh melebihi 20MB.', type: 'validation' });
      return;
    }
    setFile(selectedFile);
    setError(null);
    if (!title) setTitle(selectedFile.name.replace('.pdf', ''));
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const toggleSigner = (userId) => {
    setSelectedSigners((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleAll = () => {
    if (selectedSigners.length === members.length) {
      setSelectedSigners([]);
    } else {
      setSelectedSigners(members.map((m) => m.userId || m.id));
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!file) { setError({ message: 'Pilih berkas PDF terlebih dahulu.', type: 'validation' }); return; }
    if (!title.trim()) { setError({ message: 'Berikan judul untuk dokumen Anda.', type: 'validation' }); return; }

    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      if (selectedSigners.length > 0) {
        formData.append('signerUserIds', JSON.stringify(selectedSigners));
      }

      const res = await uploadGroupDocument(groupId, formData);
      if (res.status === 'success') {
        onSuccess?.();
        handleClose();
      }
    } catch (err) {
      // Tentukan tipe error berdasarkan status atau pesan
      let errorType = 'server';
      if (err.status === 400 || err.status === 422) errorType = 'validation';
      if (!navigator.onLine || err.message?.toLowerCase().includes('koneksi')) errorType = 'network';

      setError({
        message: err.message || 'Terjadi kesalahan saat mengunggah berkas. Silakan coba lagi.',
        type: errorType,
        retryable: errorType === 'server' || errorType === 'network',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setFile(null);
    setSelectedSigners([]);
    setError(null);
    onClose();
  };

  // Tentukan ikon yang tepat berdasarkan tipe error
  const getErrorIcon = (type) => {
    if (type === 'network') return <WifiOff size={16} className="shrink-0 mt-0.5" />;
    if (type === 'server') return <ServerCrash size={16} className="shrink-0 mt-0.5" />;
    return <AlertTriangle size={16} className="shrink-0 mt-0.5" />;
  };

  const willBeDraft = selectedSigners.length === 0;

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-900/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-zinc-200/50 dark:border-white/5 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* HEADER */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Upload size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Tambah Dokumen</h3>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Grup Workspace</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-10 h-10 rounded-xl border-none bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-400 dark:text-zinc-500 cursor-pointer transition-all">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
          
          {/* Status Info */}
          <div className={`flex items-start gap-4 p-5 rounded-3xl border transition-colors
            ${willBeDraft 
              ? 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400' 
              : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
            }`}
          >
            <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 shrink-0 shadow-sm">
              <Info size={16} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1">Status Dokumen</p>
              <p className="text-xs font-medium leading-relaxed">
                {willBeDraft 
                  ? 'Dokumen akan diupload sebagai DRAFT. Anda perlu menambahkan penandatangan nanti agar dokumen bisa diproses.' 
                  : `Dokumen akan langsung masuk status PENDING dan mengirimkan permintaan tanda tangan ke ${selectedSigners.length} anggota.`
                }
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Judul */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Nama Dokumen</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masukkan judul (contoh: Kontrak Kerja Tahunan)"
                className="w-full px-6 py-4 rounded-2xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/5 text-sm text-zinc-900 dark:text-white font-bold outline-none focus:border-emerald-500 transition-all shadow-inner"
              />
            </div>

            {/* File Upload Zone */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Arsip Berkas (PDF)</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={handleFileDrop}
                className={`group w-full rounded-[2rem] border-2 border-dashed p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300
                  ${isDraggingFile ? 'border-emerald-500 bg-emerald-500/10' : ''}
                  ${file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-200 dark:border-white/5 hover:border-emerald-500/30 hover:bg-zinc-50 dark:hover:bg-white/5'}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                />
                {file ? (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                      <FileText size={24} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-zinc-900 dark:text-white truncate max-w-xs">{file.name}</p>
                      <p className="text-[10px] font-black text-zinc-400 mt-1 uppercase tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] hover:underline">Ganti Berkas</span>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-300 group-hover:text-emerald-500 transition-colors">
                      <Upload size={24} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-tight">Tarik berkas PDF di sini</p>
                      <p className="text-[10px] font-black text-zinc-400 mt-2 uppercase tracking-widest">Atau klik untuk menelusuri folder</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Pilih Signer */}
            <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-emerald-500" />
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Penandatangan</label>
                </div>
                {members.length > 0 && (
                  <button onClick={toggleAll} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-transparent border-none cursor-pointer hover:underline">
                    {selectedSigners.length === members.length ? 'Hapus Semua' : 'Pilih Semua Anggota'}
                  </button>
                )}
              </div>

              {members.length === 0 ? (
                <div className="p-8 text-center bg-zinc-50 dark:bg-white/5 rounded-3xl">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Belum ada anggota tim</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {members.map((member) => {
                    const userId = member.userId || member.id;
                    const name = member.user?.name || member.name || 'User';
                    const email = member.user?.email || member.email || '';
                    const initials = name.trim().split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
                    const isSelected = selectedSigners.includes(userId);

                    return (
                      <div
                        key={userId}
                        onClick={() => toggleSigner(userId)}
                        className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border
                          ${isSelected 
                            ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20' 
                            : 'border-zinc-100 dark:border-white/5 hover:border-emerald-500/30'
                          }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                          ${isSelected ? 'bg-emerald-600 text-white' : 'bg-zinc-100 dark:bg-white/10 text-zinc-400'}
                        `}>
                          {isSelected ? <CheckSquare size={14} /> : <div className="text-[9px] font-black uppercase">{initials}</div>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-zinc-800 dark:text-white truncate uppercase tracking-tight">{name}</p>
                          <p className="text-[9px] font-bold text-zinc-400 truncate tracking-tight">{email}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl space-y-3">
              <div className="flex items-start gap-3 text-rose-600 dark:text-rose-400">
                {getErrorIcon(error.type)}
                <p className="text-xs font-bold leading-relaxed">{error.message}</p>
              </div>
              {error.retryable && (
                <button
                  onClick={handleSubmit}
                  disabled={isUploading}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-widest border-none cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  {isUploading ? <Loader2 size={12} className="animate-spin inline mr-2" /> : null}
                  Coba Lagi
                </button>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-8 py-8 border-t border-zinc-100 dark:border-white/5 flex items-center justify-end gap-4 shrink-0">
          <button onClick={handleClose} disabled={isUploading} className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-600 dark:hover:text-white bg-transparent border-none cursor-pointer transition-all">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUploading || !file}
            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 border-none transition-all
              ${isUploading || !file 
                ? 'bg-zinc-100 dark:bg-white/5 text-zinc-400 cursor-not-allowed' 
                : 'bg-zinc-900 dark:bg-emerald-600 hover:bg-zinc-800 dark:hover:bg-emerald-700 text-white cursor-pointer active:scale-95 shadow-xl shadow-emerald-500/20'
              }`}
          >
            {isUploading ? (
              <><Loader2 size={16} className="animate-spin" /> Sedang Diproses</>
            ) : (
              <><Upload size={16} /> Publikasikan Dokumen</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadGroupDocModal;
