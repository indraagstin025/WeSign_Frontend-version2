import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { pdfjs, Document, Page } from 'react-pdf';

// Konfigurasi Worker PDF.js — bundle lokal via Vite
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

import { useTheme } from '../../../hooks/useTheme';

// Import CSS react-pdf
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// --- COMPONENTS & HOOKS ---
import { useDocumentSigner } from '../hooks/useDocumentSigner';
import { useSignatureAssets } from '../hooks/useSignatureAssets';
import DraggableSignature from '../components/DraggableSignature';
import SigningSidebar from '../components/SigningSidebar';
import SigningNavbar from '../components/SigningNavbar';
import SigningFooterBar from '../components/SigningFooterBar';
import DocumentSettingsPanel from '../components/DocumentSettingsPanel';
import SigningMobileBar from '../components/SigningMobileBar';
import SigningModals from '../components/SigningModals';
import ParafModal from '../components/ParafModal';
import StampModal from '../components/StampModal';
import TextAnnotationModal from '../components/TextAnnotationModal';
import DateFieldModal from '../components/DateFieldModal';

/**
 * @page DocumentSigningPage
 * @description Halaman penandatanganan mandiri (Focused Mode) — Redesigned.
 * 
 * Layout mengikuti pola DashboardLayout:
 * - Sidebar full-height (kiri) dengan logo di atas
 * - Navbar hanya di atas area konten (kanan)
 * - PdfToolbar floating menggantikan footer
 * - Interaction mode: cursor (tempel TTD) vs hand (scroll/pan)
 */
const DocumentSigningPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  // Interaction mode: cursor (place signature) vs hand (pan/scroll)
  const [interactionMode, setInteractionMode] = useState('cursor');
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [isParafOpen, setIsParafOpen] = useState(false);
  const [isStampOpen, setIsStampOpen] = useState(false);
  const [isTextOpen, setIsTextOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);

  // Saved signature assets (persistent)
  const { assets, upload: uploadAsset, remove: removeAsset, getDefault } = useSignatureAssets();

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
    activeElement,
    removeSignature,
    updateSignaturePosition,
    updateSignatureSize,
    isCanvasOpen,
    setIsCanvasOpen,
    handleSaveCanvas,
    handleSaveToolElement,
    switchToTool,
    isSheetOpen,
    setIsSheetOpen,
    onDocumentLoadSuccess,
    onDocumentLoadError,
    handlePageLoadSuccess,
    handleCanvasClick,
    handleFinalSign,
    statusModal,
    setStatusModal,
    auditTrailMode,
    setAuditTrailMode
  } = useDocumentSigner(id);

  // Handler klik pada PDF — hanya tempel TTD jika mode cursor
  const handlePdfClick = (e) => {
    if (interactionMode === 'cursor') {
      handleCanvasClick(e);
    }
  };

  const handleToggleMode = (mode) => {
    setInteractionMode(mode);
  };

  // Auto-load default signature dari saved assets saat pertama kali
  useEffect(() => {
    if (!currentSignature && assets.length > 0) {
      const defaultSig = getDefault('signature');
      if (defaultSig) {
        handleSaveToolElement(defaultSig.imageUrl, 'signature');
      }
    }
  }, [assets]);

  // Wrapper handleSaveCanvas yang juga upload ke backend
  const handleSaveCanvasAndUpload = (dataUrl) => {
    handleSaveCanvas(dataUrl);
    uploadAsset(dataUrl, 'signature', 'Signature');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center space-y-5">
        <div className="relative">
          <div className="w-14 h-14 border-[3px] border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
        </div>
        <div className="flex flex-col items-center space-y-1.5">
           <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] animate-pulse">Memuat</p>
           <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Menyiapkan ruang tanda tangan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={40} className="text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Gagal Memuat</h3>
        <p className="text-sm text-zinc-500 mt-2 max-w-sm">{error}</p>
        <button 
          onClick={() => navigate('/dashboard/documents')} 
          className="mt-6 px-5 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl border-none cursor-pointer hover:bg-emerald-600 transition-colors"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] bg-zinc-50 dark:bg-zinc-950 flex overflow-hidden selection:bg-emerald-500/20 selection:text-emerald-500">
      
      {/* 1. SIDEBAR (Full-Height, dengan Logo) */}
      <SigningSidebar 
        onOpenCanvas={() => {
          const saved = getDefault('signature');
          if (saved) {
            handleSaveToolElement(saved.imageUrl, 'signature');
          } else if (!switchToTool('signature')) {
            setIsCanvasOpen(true);
          }
        }}
        onForceOpenCanvas={() => setIsCanvasOpen(true)}
        onOpenParaf={() => {
          const saved = getDefault('initial');
          if (saved) {
            handleSaveToolElement(saved.imageUrl, 'initial');
          } else if (!switchToTool('initial')) {
            setIsParafOpen(true);
          }
        }}
        onOpenStamp={() => {
          const saved = getDefault('stamp');
          if (saved) {
            handleSaveToolElement(saved.imageUrl, 'stamp');
          } else if (!switchToTool('stamp')) {
            setIsStampOpen(true);
          }
        }}
        onOpenText={() => {
          const saved = getDefault('text');
          if (saved) {
            handleSaveToolElement(saved.imageUrl, 'text');
          } else if (!switchToTool('text')) {
            setIsTextOpen(true);
          }
        }}
        onOpenDate={() => {
          const saved = getDefault('date');
          if (saved) {
            handleSaveToolElement(saved.imageUrl, 'date');
          } else if (!switchToTool('date')) {
            setIsDateOpen(true);
          }
        }}
        currentSignature={currentSignature}
        activeElement={activeElement}
        signatures={signatures}
        onRemoveSignature={removeSignature}
        onFinalize={handleFinalSign}
        isSubmitting={isSubmitting}
      >
      </SigningSidebar>

      {/* 2. CONTENT AREA (Navbar + PDF) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Navbar */}
        <SigningNavbar 
          title={doc?.title}
          onBack={null}
          onOpenSettings={() => setSettingsOpen(true)}
          status={isSubmitting ? 'saving' : 'unsigned'}
        />

        {/* PDF Viewer Area */}
        <main 
          className={`flex-1 overflow-y-auto no-scrollbar bg-zinc-100 dark:bg-zinc-950 p-4 sm:p-8 flex items-start justify-center relative select-none pb-28 sm:pb-8 min-w-0
            ${interactionMode === 'cursor' ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}
          `}
          ref={containerRef}
        >
          {/* PDF Container */}
          <div 
            className="relative shadow-2xl bg-white dark:bg-zinc-900 ring-1 ring-zinc-200 dark:ring-zinc-800 transition-all duration-500 min-h-[500px] flex items-center justify-center overflow-hidden mx-auto"
            style={{ width: containerWidth > 0 ? `${containerWidth}px` : '100%', maxWidth: '800px' }}
          >
              {/* Loading Overlay */}
              <div className={`absolute inset-0 bg-white/90 dark:bg-zinc-950/95 backdrop-blur-sm z-[60] transition-all duration-500 ease-out ${ (loading || isRendering) ? 'opacity-100' : 'opacity-0 pointer-events-none' }`}>
                  <div className="sticky top-0 h-[60vh] flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-[3px] border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3" />
                    <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] animate-pulse text-center">Menyiapkan Dokumen...</p>
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
                  <div className={`relative group transition-all duration-300 ${isRendering ? 'opacity-0 scale-[0.97] blur-md' : 'opacity-100 scale-100 blur-0'}`}>
                    <Page 
                      pageNumber={pageNumber} 
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      width={containerWidth}
                      onRenderSuccess={() => setIsRendering(false)}
                      onLoadSuccess={handlePageLoadSuccess}
                    />
                    
                    {/* Layer interaksi — hanya aktif di mode cursor */}
                    <div 
                      className="absolute inset-0 z-10" 
                      onClick={handlePdfClick}
                      style={{ pointerEvents: interactionMode === 'cursor' ? 'auto' : 'none' }}
                    />
                    
                    {/* Layer Tanda Tangan */}
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
                <div className="absolute inset-0 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-6 text-center z-50">
                   <AlertCircle size={28} className="text-rose-500 mb-2" />
                   <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">Gagal Memuat PDF</p>
                   <p className="text-xs text-zinc-500 mt-1 max-w-sm">{loadError}</p>
                </div>
              )}
            </div>
        </main>

        {/* Footer */}
        <SigningFooterBar
          pageNumber={pageNumber}
          numPages={numPages}
          setPageNumber={setPageNumber}
        />
      </div>

      {/* 3. RIGHT PANEL: Pengaturan Dokumen */}
      <DocumentSettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        auditTrailMode={auditTrailMode}
        onAuditTrailChange={setAuditTrailMode}
      />

      {/* 4. MOBILE BOTTOM BAR */}
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

      {/* 5. MODALS */}
      <SigningModals 
        isCanvasOpen={isCanvasOpen}
        setIsCanvasOpen={setIsCanvasOpen}
        handleSaveCanvas={handleSaveCanvasAndUpload}
        isSheetOpen={isSheetOpen}
        setIsSheetOpen={setIsSheetOpen}
        currentSignature={currentSignature}
        signatures={signatures}
        removeSignature={removeSignature}
        handleFinalSign={handleFinalSign}
        isSubmitting={isSubmitting}
        statusModal={statusModal}
        setStatusModal={setStatusModal}
        savedAssets={assets.filter(a => a.type === 'signature')}
        onDeleteAsset={(id) => removeAsset(id)}
        onSelectAsset={(asset) => { handleSaveToolElement(asset.imageUrl, 'signature'); }}
      />

      {/* Tool Modals */}
      <ParafModal isOpen={isParafOpen} onClose={() => setIsParafOpen(false)} onSave={(dataUrl, meta) => { handleSaveToolElement(dataUrl, 'initial', meta?.metadata); setIsParafOpen(false); }} />
      <StampModal isOpen={isStampOpen} onClose={() => setIsStampOpen(false)} onSave={(dataUrl, meta) => { handleSaveToolElement(dataUrl, 'stamp', meta?.metadata); setIsStampOpen(false); }} />
      <TextAnnotationModal isOpen={isTextOpen} onClose={() => setIsTextOpen(false)} onSave={(dataUrl, meta) => { handleSaveToolElement(dataUrl, 'text', meta?.metadata); setIsTextOpen(false); }} />
      <DateFieldModal isOpen={isDateOpen} onClose={() => setIsDateOpen(false)} onSave={(dataUrl, meta) => { handleSaveToolElement(dataUrl, 'date', meta?.metadata); setIsDateOpen(false); }} />
    </div>
  );
};

export default DocumentSigningPage;
