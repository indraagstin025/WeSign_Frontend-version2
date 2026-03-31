import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  FileText, 
  PenTool, 
  Check, 
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { pdfjs, Document, Page } from 'react-pdf';

// Import CSS react-pdf
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Konfigurasi Worker PDF.js menggunakan standar eksplisit Vite URL import
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

// --- COMPONENTS & HOOKS ---
import { useDocumentSigner } from '../hooks/useDocumentSigner';
import SignatureCanvas from '../components/SignatureCanvas';
import DraggableSignature from '../components/DraggableSignature';

/**
 * @page DocumentSigningPage
 * @description Halaman penandatanganan mandiri (Focused Mode).
 */
const DocumentSigningPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const {
    document: doc,
    pdfUrl,
    loading,
    error,
    isSubmitting,
    signatures,
    currentSignature,
    placeSignature,
    removeSignature,
    updateSignaturePosition,
    updateSignatureSize,
    isCanvasOpen,
    setIsCanvasOpen,
    handleSaveCanvas,
    handleSubmit
  } = useDocumentSigner(id);

  // Dinamis Container Width
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });
  const [loadError, setLoadError] = useState(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setLoadError(null);
    setNumPages(numPages);
  };

  const onDocumentLoadError = (err) => {
    console.error('PDF Load Error:', err);
    setLoadError(err.message || 'Error memuat PDF');
  };

  const handlePageLoadSuccess = (page) => {
    // Tangkap dimensi asli halaman untuk kalkulasi aspek rasio yang presisi
    setPageDimensions({ 
      width: page.originalWidth, 
      height: page.originalHeight 
    });
  };

  const [debugDims, setDebugDims] = useState('');

  useEffect(() => {
    console.log('🔄 DocumentSigningPage mounted. containerRef:', containerRef.current);
    if (!containerRef.current) return;
    
    const measure = () => {
      const el = containerRef.current;
      if (!el) return;

      const targetWidth = el.clientWidth;
      const targetHeight = el.clientHeight;
      
      console.log(`📏 [MEASURE] el.clientWidth: ${targetWidth}, el.clientHeight: ${targetHeight}`);
      setDebugDims(`tw:${targetWidth} th:${targetHeight}`);

      if (targetWidth > 0 && targetHeight > 0) {
        // Padding p-4 di mobile (16px), p-8 di desktop (32px). Rate padding x2 = 64px
        const paddingAreaHorizontal = 64;
        const availableWidth = targetWidth - paddingAreaHorizontal;

        // Set batas maksimum lebar dokumen agar tidak raksasa di layar ultrawide
        const MAX_PDF_WIDTH = 800;
        let optimalWidth = Math.min(availableWidth, MAX_PDF_WIDTH);

        const finalWidth = Math.floor(Math.max(100, optimalWidth));
        console.log(`✅ [MEASURE] Lebar optimal: ${finalWidth}px (kapasitas: ${availableWidth}px)`);
        
        setContainerWidth(finalWidth); 
        setIsReady(true);
      } else {
        console.warn('⚠️ [MEASURE] width atau height bernilai 0, isReady tidak diset true.');
      }
    };

    // Panggil seketika saat komponen dimuat (fallback jika ResizeObserver telat/gagal)
    measure();

    const resizeObserver = new ResizeObserver(() => {
      console.log('👁️ [ResizeObserver] Triggered!'); 
      measure();
    });
    resizeObserver.observe(containerRef.current);
    window.addEventListener('resize', measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [pageDimensions, loading]);

  const handleCanvasClick = (e) => {
    // Gunakan bounding client rect untuk akurasi klik
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    placeSignature(pageNumber, x, y);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Menyiapkan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gagal Memuat</h3>
        <p className="text-sm text-slate-500 mt-2">{error}</p>
        <button onClick={() => navigate('/dashboard/documents')} className="mt-6 px-6 py-2 bg-primary text-white font-bold rounded-xl border-none cursor-pointer">Kembali</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] bg-slate-100 dark:bg-slate-950 flex flex-col overflow-hidden selection:bg-primary/20 selection:text-primary">
      
      {/* 1. HEADER */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 sm:px-6 shadow-sm shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <button 
            onClick={() => navigate('/dashboard/documents')}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-all border-none bg-transparent cursor-pointer flex items-center gap-1.5"
          >
            <ChevronLeft size={20} />
            <span className="hidden md:inline font-bold text-sm">Keluar</span>
          </button>
          
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 ml-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-500/20">
              <FileText size={18} />
            </div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px] md:max-w-md">
              {doc?.title}
            </h1>
          </div>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={signatures.length === 0 || isSubmitting}
          className={`hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border-none cursor-pointer shadow-lg
            ${signatures.length === 0 || isSubmitting
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
              : 'bg-primary text-white hover:bg-primary-dark shadow-primary/20'
            }
          `}
        >
          {isSubmitting ? 'Memproses...' : 'Selesaikan Dokumen'}
        </button>
      </header>

      {/* 2. CONTENT */}
      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden relative min-w-0">
        <aside className="hidden sm:flex w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col shrink-0 z-10 overflow-y-auto p-5 space-y-6">
           <button 
             onClick={() => setIsCanvasOpen(true)}
             className="w-full h-11 flex items-center justify-center gap-3 rounded-xl bg-primary text-white border-none font-bold text-sm shadow-lg shadow-primary/20 cursor-pointer active:scale-95 transition-transform"
           >
             <Plus size={20} />
             <span>Tambah Tanda Tangan</span>
           </button>

           {currentSignature && (
              <div className="w-full aspect-[2.5/1] bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-primary/40 flex items-center justify-center p-4">
                 <img src={currentSignature} alt="Signature" className="max-w-full max-h-full object-contain" />
              </div>
           )}

           {signatures.length > 0 && (
             <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ditempatkan ({signatures.length})</p>
                {signatures.map((sig, idx) => (
                  <div key={sig.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 group">
                    <span className="w-6 h-6 rounded bg-white dark:bg-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-400">{idx + 1}</span>
                    <span className="flex-1 text-xs font-bold text-slate-700 dark:text-slate-200">Halaman {sig.pageNumber}</span>
                    <button onClick={() => removeSignature(sig.id)} className="p-1 text-slate-300 hover:text-rose-500 border-none bg-transparent cursor-pointer"><Trash2 size={14} /></button>
                  </div>
                ))}
             </div>
           )}
        </aside>

        <main className="flex-1 overflow-auto bg-slate-200/50 dark:bg-slate-950/80 p-4 sm:p-8 flex items-start justify-center relative select-none pb-24 sm:pb-8 min-w-0" ref={containerRef}>
          {/* A small debug overlay to help diagnose */}
          <div className="absolute top-0 left-0 z-50 bg-blue-500/80 text-white text-[10px] p-2 pointer-events-none">
            Ready: {isReady ? 'Yes' : 'No'} | Width: {containerWidth}px | URL: {pdfUrl ? 'Yes' : 'No'} | {debugDims}
          </div>

          <div className="relative shadow-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 transition-all duration-500 min-h-[500px] flex items-center justify-center overflow-hidden mx-auto">
              {isReady && pdfUrl ? (
                <Document 
                   file={pdfUrl} 
                   onLoadSuccess={onDocumentLoadSuccess} 
                   onLoadError={onDocumentLoadError}
                   loading={
                     <div className="flex flex-col items-center gap-3 p-10">
                       <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                       <p className="text-[10px] items-center text-slate-400">Loading Document PDF...</p>
                     </div>
                   }
                >
                  <div className="relative group cursor-crosshair">
                  <Page 
                    pageNumber={pageNumber} 
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    width={containerWidth}
                    onLoadSuccess={handlePageLoadSuccess}
                  />
                  <div className="absolute inset-0 z-10" onClick={handleCanvasClick} />
                  <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                    {signatures.filter(s => s.pageNumber === pageNumber).map(sig => {
                      // Hitung rasio aspek dinamis (Default 1.41 jika belum dimuat)
                      const aspectRatio = pageDimensions.width > 0 
                        ? pageDimensions.height / pageDimensions.width 
                        : 1.41;
                      const dynamicHeight = containerWidth * aspectRatio;

                      return (
                        <DraggableSignature
                          key={sig.id}
                          sig={sig}
                          onRemove={removeSignature}
                          onUpdatePosition={updateSignaturePosition}
                          onUpdateSize={updateSignatureSize}
                          containerWidth={containerWidth}
                          containerHeight={dynamicHeight}
                        />
                      );
                    })}
                  </div>
                </div>
                </Document>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memuat Area Kerja...</p>
                </div>
              )}

              {loadError && (
                <div className="absolute inset-0 bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center z-50">
                   <AlertCircle size={32} className="text-rose-500 mb-2" />
                   <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Gagal Memuat PDF</p>
                   <p className="text-xs text-slate-500 mt-1 max-w-sm">{loadError}</p>
                </div>
              )}

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-5 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 z-20">
                 <button disabled={pageNumber <= 1} onClick={() => setPageNumber(p => Math.max(p - 1, 1))} className="p-1 hover:bg-slate-100 rounded-lg border-none bg-transparent cursor-pointer"><ArrowLeft size={18} /></button>
                 <span className="text-xs font-bold text-slate-600 dark:text-slate-200">Hal {pageNumber} / {numPages || '?'}</span>
                 <button disabled={pageNumber >= numPages} onClick={() => setPageNumber(p => Math.min(p + 1, numPages))} className="p-1 hover:bg-slate-100 rounded-lg border-none bg-transparent cursor-pointer"><ArrowRight size={18} /></button>
              </div>
            </div>
        </main>
      </div>

      {/* 3. MOBILE BAR */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 h-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between z-30 shadow-[0_-8px_30px_rgba(0,0,0,0.1)]">
        <button 
          onClick={() => setIsCanvasOpen(true)}
          className="flex-1 max-w-[200px] h-12 flex items-center justify-center gap-2 bg-primary text-white rounded-xl font-bold text-sm shadow-lg border-none cursor-pointer active:scale-95 transition-transform"
        >
          <Plus size={18} />
          <span>Tanda Tangan</span>
        </button>
        <button 
          onClick={handleSubmit}
          disabled={signatures.length === 0 || isSubmitting}
          className={`ml-3 w-12 h-12 flex items-center justify-center rounded-xl shadow-lg transition-all border-none
            ${signatures.length === 0 || isSubmitting ? 'bg-slate-100 text-slate-400' : 'bg-emerald-500 text-white shadow-emerald-500/20 cursor-pointer'}
          `}
        >
          {isSubmitting ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Check size={24} />}
        </button>
      </div>

      <SignatureCanvas 
        isOpen={isCanvasOpen}
        onClose={() => setIsCanvasOpen(false)}
        onSave={handleSaveCanvas}
      />

    </div>
  );
};

export default DocumentSigningPage;
