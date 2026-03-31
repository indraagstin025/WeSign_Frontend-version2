import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  FileBox,
  ShieldAlert
} from 'lucide-react';
import { uploadDocument } from '../api/docService';
import { pdfjs } from 'react-pdf';

// Konfigurasi worker pdfjs secara lokal (Vite Compatible)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const UploadDocModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('General');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const validatePdfLocally = async (selectedFile) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        try {
          // Buat instance loading task
          const loadingTask = pdfjs.getDocument({ 
            data,
            // Matikan worker eksternal jika ada masalah loading
            disableWorker: false 
          });
          
          const pdf = await loadingTask.promise;
          
          // Cek apakah image-only secara kasar di halaman pertama
          const page = await pdf.getPage(1);
          const textContent = await page.getTextContent();
          const hasText = textContent.items.length > 0;
          
          resolve({ valid: true, hasText });
        } catch (err) {
          console.error("❌ [PDF Validation Error]:", err);
          
          if (err.name === 'PasswordException') {
            resolve({ valid: false, error: 'File PDF terproteksi password. Silakan hapus proteksi sebelum mengunggah.' });
          } else if (err.message?.includes('worker')) {
            // Jika worker gagal, jangan blokir user, biarkan validasi di sisi server (backend) yang bekerja
            console.warn("⚠️ PDF Worker gagal dimuat, melewati validasi client-side.");
            resolve({ valid: true, skipLocal: true });
          } else {
            resolve({ valid: false, error: 'Konten PDF tidak terbaca atau rusak secara struktur.' });
          }
        }
      };
      reader.onerror = () => resolve({ valid: false, error: 'Gagal membaca file dari penyimpanan lokal.' });
      reader.readAsArrayBuffer(selectedFile);
    });
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setError(null);
      
      // 1. Validasi Ekstensi/MIME
      if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
        setError('Hanya file PDF yang diperbolehkan.');
        return;
      }

      // 2. Validasi Ukuran (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('Ukuran file maksimal adalah 10MB.');
        return;
      }

      // 3. Validasi 0-Byte
      if (selectedFile.size === 0) {
        setError('File kosong (0 bytes) tidak diperbolehkan.');
        return;
      }

      setLoading(true);
      const validation = await validatePdfLocally(selectedFile);
      setLoading(false);

      if (!validation.valid) {
        setError(validation.error);
        return;
      }

      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Silakan pilih file PDF terlebih dahulu.');
      return;
    }

    setLoading(true);
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('documentFile', file);
    formData.append('title', title || file.name);
    formData.append('type', type);

    try {
      const response = await uploadDocument(formData, {
        onProgress: (percent) => setUploadProgress(percent)
      });
      
      if (response.status === 'success') {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Gagal mengunggah dokumen. Silakan periksa koneksi Anda.');
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setFile(null);
    setTitle('');
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 drop-shadow-2xl animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Upload size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading tracking-tight text-left">Unggah Dokumen</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-left">PDF Digital • Maks 10MB • Aman & Terenkripsi</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {success ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-90 duration-300">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-500">
                <CheckCircle2 size={48} className="animate-bounce" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Berhasil Diunggah</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Dokumen Anda sedang diproses ke Brankas.</p>
              </div>
            </div>
          ) : (
            <>
              {!file ? (
                <div 
                  onClick={() => !loading && fileInputRef.current?.click()}
                  className={`group relative border-2 border-dashed ${error ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 dark:border-slate-700'} rounded-2xl p-10 flex flex-col items-center justify-center gap-3 hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer`}
                >
                  <div className={`w-16 h-16 ${error ? 'bg-rose-100 text-rose-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'} rounded-full flex items-center justify-center group-hover:text-primary group-hover:scale-110 transition-all shadow-inner`}>
                    {loading ? <Loader2 size={32} className="animate-spin text-primary" /> : <FileBox size={32} />}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Klik untuk memilih file PDF</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-1 uppercase tracking-wider font-semibold">Tipe File: PDF (Tanpa Password)</p>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
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
                    <div className="flex-1 truncate">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate text-left">{file.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 text-left">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    {!loading && (
                      <button 
                        type="button"
                        onClick={() => setFile(null)}
                        className="p-1.5 px-3 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                      >
                        Ganti
                      </button>
                    )}
                  </div>

                  {/* PROGRESS BAR */}
                  {loading && uploadProgress > 0 && (
                    <div className="space-y-2 px-1">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                        <span className="text-primary animate-pulse">Sedang mengunggah...</span>
                        <span className="text-slate-500">{uploadProgress}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1 text-left">Judul Dokumen</label>
                  <input 
                    type="text"
                    required
                    disabled={loading}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Surat Perjanjian Kerjasama"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white placeholder:text-slate-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1 text-left">Kategori / Tipe</label>
                  <select 
                    disabled={loading}
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all cursor-pointer"
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

              <div className="pt-2 flex gap-3">
                <button 
                  type="submit"
                  disabled={loading || !file}
                  className="flex-[2] flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-primary/30 transition-all disabled:opacity-50 border-none cursor-pointer"
                >
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin" /> {uploadProgress > 0 ? 'Mengamankan File...' : 'Menghubungi Server...'}</>
                  ) : (
                    <>Mulai Unggah</>
                  )}
                </button>
                <button 
                  type="button"
                  disabled={loading}
                  onClick={handleClose}
                  className="flex-1 px-4 py-3.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all border-none bg-transparent cursor-pointer"
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
