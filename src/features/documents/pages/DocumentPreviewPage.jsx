import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  FileText, 
  Download, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { getDocumentFile, getDocumentDetail } from '../api/docService';

/**
 * @page DocumentPreviewPage
 * @description Halaman pratinjau dokumen internal (White-Label).
 * Memuat file PDF di dalam iframe untuk menyembunyikan URL Supabase.
 */
const DocumentPreviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [doc, setDoc] = useState(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        setLoading(true);
        const docResponse = await getDocumentDetail(id);
        if (docResponse.status === 'success') {
          setDoc(docResponse.data);
        }

        const urlResponse = await getDocumentFile(id, 'view');
        if (urlResponse.success && urlResponse.url) {
          setUrl(urlResponse.url);
        } else {
          throw new Error('Gagal mendapatkan akses ke file dokumen.');
        }
      } catch (err) {
        console.error('Preview error:', err);
        setError(err.message || 'Terjadi kesalahan saat memuat pratinjau dokumen.');
      } finally {
        setLoading(false);
      }
    };

    if (id) loadPreview();
  }, [id]);

  const handleDownload = async () => {
    try {
      const response = await getDocumentFile(id, 'download');
      if (response.success && response.url) {
        window.location.assign(response.url);
      }
    } catch (err) {
      alert('Gagal mengunduh dokumen.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden animate-in fade-in duration-300">
      
      {/* HEADER NAVIGASI */}
      <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shadow-sm shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <button 
            onClick={() => navigate('/dashboard/documents')}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all border-none bg-transparent cursor-pointer flex items-center gap-1 group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline font-bold text-sm">Kembali</span>
          </button>
          
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
          
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
              <FileText size={18} />
            </div>
            <div className="truncate">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
                {doc ? doc.title : 'Memuat Dokumen...'}
              </h1>
              {doc && (
                <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest">{doc.type || 'General Document'}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleDownload}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border-none bg-transparent cursor-pointer"
          >
            <Download size={16} /> Unduh
          </button>
          <button 
             onClick={() => window.open(url, '_blank')}
             className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all border-none bg-transparent cursor-pointer"
             title="Buka di Tab Baru"
          >
            <ExternalLink size={20} />
          </button>
        </div>
      </div>

      {/* VIEWER AREA */}
      <div className="flex-1 relative bg-slate-200 dark:bg-slate-900/50 overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
            <div className="relative">
               <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
               <FileText size={24} className="absolute inset-0 m-auto text-primary animate-pulse" />
            </div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest animate-pulse">Menyiapkan Pratinjau...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-3xl flex items-center justify-center text-rose-500 mb-2 border border-dashed border-rose-200 dark:border-rose-900/30">
              <AlertCircle size={32} />
            </div>
            <div className="max-w-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gagal Memuat Pratinjau</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{error}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/25 border-none cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <iframe 
            src={`${url}#toolbar=0&navpanes=0`} 
            className="w-full h-full border-none shadow-inner"
            title="PDF Preview"
          />
        )}
      </div>

    </div>
  );
};

export default DocumentPreviewPage;
