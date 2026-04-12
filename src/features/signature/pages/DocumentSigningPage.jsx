import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { pdfjs, Document, Page } from 'react-pdf';

// Konfigurasi Worker PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import { useTheme } from '../../../hooks/useTheme';

// Import CSS react-pdf
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// --- COMPONENTS & HOOKS ---
import { useDocumentSigner } from '../hooks/useDocumentSigner';
import DraggableSignature from '../components/DraggableSignature';
import SigningSidebar from '../components/SigningSidebar';
import SigningNavbar from '../components/SigningNavbar';
import SigningFooter from '../components/SigningFooter';
import SigningMobileBar from '../components/SigningMobileBar';
import SigningModals from '../components/SigningModals';

/**
 * @page DocumentSigningPage
 * @description Halaman penandatanganan mandiri (Focused Mode).
 * High-Level Orchestrator: Seluruh logika dikelola oleh hook useDocumentSigner.
 * UI modular: Navbar, Sidebar, Footer, MobileBar, dan Modals dipisahkan.
 */
const DocumentSigningPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  // Semua logika & state diekstrak ke dalam Hook
  const {
    document: doc,
    pdfUrl,
    loading,
    error,
    loadError,
    isRendering,
    setIsRendering,
    isSubmitting,
    containerRef,
    containerWidth,
    isReady,
    numPages,
    pageNumber,
    setPageNumber,
    pageDimensions,
    signatures,
    currentSignature,
    removeSignature,
    updateSignaturePosition,
    updateSignatureSize,
    isCanvasOpen,
    setIsCanvasOpen,
    handleSaveCanvas,
    isSheetOpen,
    setIsSheetOpen,
    onDocumentLoadSuccess,
    onDocumentLoadError,
    handlePageLoadSuccess,
    handleCanvasClick,
    handleFinalSign,
    statusModal,
    setStatusModal
  } = useDocumentSigner(id);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-100 dark:bg-[#0b141a] flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin shadow-[0_0_30px_rgba(16,185,129,0.2)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-full animate-pulse blur-xl" />
          </div>
        </div>
        <div className="flex flex-col items-center space-y-2">
           <p className="text-[10px] font-black text-slate-400 dark:text-emerald-500/50 uppercase tracking-[0.4em] animate-pulse">Inisialisasi</p>
           <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Menyiapkan Ruang Tanda Tangan</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gagal Memuat</h3>
        <p className="text-sm text-slate-500 mt-2">{error}</p>
        <button onClick={() => navigate('/dashboard/documents')} className="mt-6 px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl border-none cursor-pointer">Kembali</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] bg-slate-100 dark:bg-[#0b141a] flex flex-col overflow-hidden selection:bg-emerald-500/20 selection:text-emerald-500">
      
      {/* 1. HEADER */}
      <SigningNavbar 
        title={doc?.title}
        theme={theme}
        toggleTheme={toggleTheme}
        onBack={null}
      />

      {/* 2. CONTENT */}
      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden relative min-w-0">
        <SigningSidebar 
          onOpenCanvas={() => setIsCanvasOpen(true)}
          currentSignature={currentSignature}
          signatures={signatures}
          onRemoveSignature={removeSignature}
          onFinalize={handleFinalSign}
          isSubmitting={isSubmitting}
        />

        <main 
          className="flex-1 overflow-y-scroll no-scrollbar bg-slate-100 dark:bg-[#0b141a] p-4 sm:p-8 flex items-start justify-center relative select-none pb-28 sm:pb-8 min-w-0" 
          ref={containerRef}
        >
          <div 
            className="relative shadow-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 transition-all duration-500 min-h-[500px] flex items-center justify-center overflow-hidden mx-auto"
            style={{ width: containerWidth > 0 ? `${containerWidth}px` : '100%', maxWidth: '800px' }}
          >
              {/* Aurora Loading Overlay */}
              <div className={`absolute inset-0 bg-white/90 dark:bg-[#0b141a]/95 backdrop-blur-[6px] z-[60] transition-all duration-700 ease-in-out ${ (loading || isRendering) ? 'opacity-100' : 'opacity-0 pointer-events-none' }`}>
                  <div className="sticky top-0 h-[60vh] flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
                    <p className="text-[10px] items-center font-black text-slate-500 dark:text-emerald-500 uppercase tracking-[0.3em] animate-pulse pr-2 text-center">Menyiapkan Dokumen...</p>
                  </div>
              </div>

              {isReady && pdfUrl ? (
                <Document 
                   file={pdfUrl} 
                   key={pdfUrl} 
                   onLoadStart={() => setIsRendering(true)}
                   onLoadSuccess={onDocumentLoadSuccess} 
                   onLoadError={onDocumentLoadError}
                   loading={null}
                >
                  <div className={`relative group cursor-crosshair transition-all duration-300 ${isRendering ? 'opacity-0 scale-95 blur-md' : 'opacity-100 scale-100 blur-0'}`}>
                    <Page 
                      pageNumber={pageNumber} 
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      width={containerWidth}
                      onRenderSuccess={() => setIsRendering(false)}
                      onLoadSuccess={handlePageLoadSuccess}
                    />
                    
                    {/* Layer interaksi untuk menempelkan tanda tangan */}
                    <div className="absolute inset-0 z-10" onClick={handleCanvasClick} />
                    
                    {/* Layer Tanda Tangan Bergerak */}
                    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden" style={{ touchAction: 'none' }}>
                      {signatures.filter(s => s.pageNumber === pageNumber).map(sig => {
                        const aspectRatio = pageDimensions.width > 0 ? pageDimensions.height / pageDimensions.width : 1.41;
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
              ) : null}

              {loadError && (
                <div className="absolute inset-0 bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center z-50">
                   <AlertCircle size={32} className="text-rose-500 mb-2" />
                   <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Gagal Memuat PDF</p>
                   <p className="text-xs text-slate-500 mt-1 max-w-sm">{loadError}</p>
                </div>
              )}
            </div>
        </main>
      </div>

      {/* 3. FOOTER NAVIGATION (Desktop Only) */}
      <SigningFooter 
        pageNumber={pageNumber}
        numPages={numPages}
        setPageNumber={setPageNumber}
      />

      {/* 4. MOBILE BOTTOM BAR (Baru & Modular) */}
      {!isSheetOpen && (
        <SigningMobileBar 
          pageNumber={pageNumber}
          numPages={numPages}
          setPageNumber={setPageNumber}
          onOpenSheet={() => setIsSheetOpen(true)}
          onOpenCanvas={() => setIsCanvasOpen(true)}
          onFinalize={handleFinalSign}
          signatureCount={signatures.length}
          isSubmitting={isSubmitting}
        />
      )}

      {/* 5. MODALS AREA (Global Signature Modals) */}
      <SigningModals 
        isCanvasOpen={isCanvasOpen}
        setIsCanvasOpen={setIsCanvasOpen}
        handleSaveCanvas={handleSaveCanvas}
        isSheetOpen={isSheetOpen}
        setIsSheetOpen={setIsSheetOpen}
        currentSignature={currentSignature}
        signatures={signatures}
        removeSignature={removeSignature}
        handleFinalSign={handleFinalSign}
        isSubmitting={isSubmitting}
        statusModal={statusModal}
        setStatusModal={setStatusModal}
      />

    </div>
  );
};

export default DocumentSigningPage;
