import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  X,
  FileText,
  Download,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { pdfjs, Document, Page } from 'react-pdf';

// Konfigurasi Worker PDF.js — bundle lokal via Vite (lepas dependency unpkg CDN)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

import { useTheme } from '../../../hooks/useTheme';
import { usePackagePreview } from '../hooks/usePackagePreview';
import { getDocumentFile } from '../../documents/api/docService';

// Styles
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Components
import SigningFooter from '../../signature/components/SigningFooter';
import PackageDocSidebar from '../components/PackageDocSidebar';
import MobilePackageBottomSheet from '../components/MobilePackageBottomSheet';

/**
 * @page PackagePreviewPage
 * @description Halaman pratinjau playlist untuk dokumen dalam paket.
 */
const PackagePreviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  // Rendering State (Anti-Glitch)
  const [isRendering, setIsRendering] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const {
    packageData,
    documents,
    currentIndex,
    activeDoc,
    loading,
    error,
    
    // PDF State
    pdfUrl,
    pdfLoading,
    numPages,
    pageNumber,
    setPageNumber,
    setNumPages,
    loadError,
    containerRef,
    containerWidth,
    isReady,

    // Actions
    nextDocument,
    prevDocument,
    goToDocument
  } = usePackagePreview(id);

  // Logic for buttons
  const isLastDoc = currentIndex === documents.length - 1;
  const isFirstDoc = currentIndex === 0;

  const handleDownload = async () => {
    if (!activeDoc?.docVersion?.document?.id) return;
    try {
      const response = await getDocumentFile(activeDoc.docVersion.document.id, 'download');
      if (response.success && response.url) {
        window.location.assign(response.url);
      }
    } catch (err) {
      alert('Gagal mengunduh dokumen.');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center space-y-4 z-[100]">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest animate-pulse">Memuat Pratinjau Paket...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center z-[100]">
        <AlertCircle size={48} className="text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Gagal Memuat Paket</h3>
        <p className="text-sm text-zinc-500 mt-2">{error}</p>
        <button 
          onClick={() => navigate('/dashboard/packages')} 
          className="mt-6 px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-2xl border-none cursor-pointer"
        >
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] bg-zinc-100 dark:bg-[#0b141a] flex flex-col overflow-hidden animate-in fade-in duration-300">
      
      {/* 1. TOP NAVBAR (Simplified for Preview) */}
      <div className="h-20 bg-white dark:bg-[#111b21] border-b border-zinc-200 dark:border-white/5 flex items-center justify-between px-6 shrink-0 z-50">
          <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/dashboard/packages')}
                className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors border-none bg-transparent cursor-pointer"
              >
                  <X size={20} />
              </button>
              <div className="h-6 w-px bg-zinc-200 dark:bg-white/10" />
              <div>
                  <h1 className="text-sm font-black text-zinc-900 dark:text-white leading-none mb-1 uppercase tracking-tight">
                    {packageData?.title || 'Pratinjau Paket'}
                  </h1>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                    {activeDoc?.docVersion?.document?.title || 'Memuat Filename...'}
                  </p>
              </div>
          </div>

          <div className="flex items-center gap-3">
              <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all border-none cursor-pointer"
              >
                  <Download size={16} />
                  <span className="hidden sm:inline">Unduh Dokumen</span>
              </button>
              <div className="h-6 w-px bg-zinc-200 dark:bg-white/10 hidden sm:block" />
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                  <FileText size={20} />
              </div>
          </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative min-h-0">
        
        {/* 2. LEFT SIDEBAR (Playlist) */}
        <PackageDocSidebar 
          documents={documents}
          currentIndex={currentIndex}
          onSelect={goToDocument}
          signaturesMap={{}}
          isReadOnly={true}
        />

        {/* 3. CENTER PDF VIEWPORT */}
        <main className="flex-1 overflow-y-scroll no-scrollbar bg-zinc-100 dark:bg-[#0b141a] p-4 sm:p-8 flex items-start justify-center relative select-none pb-8 min-w-0" ref={containerRef}>
          <div 
            className="relative shadow-2xl bg-white dark:bg-zinc-900 ring-1 ring-zinc-200 dark:ring-zinc-800 transition-all duration-500 min-h-[500px] flex items-center justify-center overflow-hidden mx-auto"
            style={{ width: containerWidth > 0 ? `${containerWidth}px` : '100%', maxWidth: '800px' }}
          >
            
            {/* Loading Overlay (Cross-Fade sync with actual Canvas Render) */}
            <div className={`absolute inset-0 bg-white/90 dark:bg-[#0b141a]/95 backdrop-blur-[6px] z-[60] transition-all duration-700 ease-in-out ${ (pdfLoading || isRendering) ? 'opacity-100' : 'opacity-0 pointer-events-none' }`}>
                <div className="sticky top-0 h-[60vh] flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
                  <p className="text-[10px] items-center font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.3em] animate-pulse pr-2 text-center">Menyiapkan Dokumen...</p>
                </div>
            </div>

            {isReady && pdfUrl ? (
              <Document 
                 file={pdfUrl} 
                 onLoadStart={() => setIsRendering(true)}
                 onLoadSuccess={({ numPages }) => setNumPages(numPages)} 
                 onLoadError={(err) => setLoadError(err.message)}
                 loading={null}
              >
                <div className={`relative transition-all duration-300 ${isRendering ? 'opacity-0 scale-95 blur-md' : 'opacity-100 scale-100 blur-0'}`}>
                  <Page 
                    pageNumber={pageNumber} 
                    renderTextLayer={false} 
                    renderAnnotationLayer={false}
                    width={containerWidth}
                    onRenderSuccess={() => setIsRendering(false)}
                  />
                </div>
              </Document>
            ) : null}

            {loadError && (
              <div className="absolute inset-0 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-6 text-center z-[70]">
                 <AlertCircle size={32} className="text-rose-500 mb-2" />
                 <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">Gagal Memuat PDF</p>
                 <p className="text-xs text-zinc-500 mt-1 max-w-sm">{loadError}</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 4. FOOTER (Pagination & Mobile Actions) */}
      <div className="bg-white dark:bg-[#111b21] border-t border-zinc-200 dark:border-white/10 z-[110] flex flex-col shrink-0">
          {/* Action Bar Mobile */}
          <div className="lg:hidden flex items-center justify-between px-6 py-4 gap-4">
              {/* Tombol Panel / Playlist */}
              <button 
                onClick={() => setIsSheetOpen(true)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-none cursor-pointer active:scale-90 transition-all shadow-sm"
                title="Buka Panel Playlist"
              >
                <Layers size={22} />
              </button>

              {/* Tombol Unduh (Shortcut) */}
              <button 
                onClick={handleDownload}
                className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary border-none font-black text-[11px] uppercase tracking-widest cursor-pointer active:scale-95 transition-all"
              >
                <Download size={18} />
                <span>Unduh</span>
              </button>

              {/* Tombol Lanjut */}
              <button 
                onClick={isLastDoc ? () => setIsSheetOpen(true) : nextDocument}
                disabled={pdfLoading || isRendering}
                className={`w-12 h-12 flex items-center justify-center rounded-2xl text-white border-none cursor-pointer shadow-lg active:scale-90 transition-all
                  ${(isLastDoc)
                    ? 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500 shadow-none' 
                    : 'bg-emerald-600 shadow-emerald-600/20'
                  }
                `}
              >
                {pdfLoading || isRendering ? (
                   <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  isLastDoc ? <CheckCircle2 size={22} /> : <ChevronRight size={26} />
                )}
              </button>
          </div>

          <SigningFooter 
            pageNumber={pageNumber}
            numPages={numPages}
            setPageNumber={setPageNumber}
            isReadOnly={true}
          />
      </div>

      <MobilePackageBottomSheet 
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onOpenCanvas={() => {}} // No canvas in preview
        currentSignature={null}
        signatures={[]}
        onRemoveSignature={() => {}}
        onFinalize={nextDocument}
        isSubmitting={false}
        documents={documents}
        currentIndex={currentIndex}
        onSelectDocument={(idx) => {
          goToDocument(idx);
          setIsSheetOpen(false);
        }}
        signaturesMap={{}}
        isReadOnly={true}
      />

    </div>
  );
};

export default PackagePreviewPage;
