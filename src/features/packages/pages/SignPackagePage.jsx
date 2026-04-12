import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  AlertCircle,
  Layers,
  PenTool,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { pdfjs, Document, Page } from 'react-pdf';

// Konfigurasi Worker PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import { useTheme } from '../../../hooks/useTheme';
import { useSignPackage } from '../hooks/useSignPackage';

// Styles
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Components
import SigningNavbar from '../../signature/components/SigningNavbar';
import SigningSidebar from '../../signature/components/SigningSidebar';
import SigningFooter from '../../signature/components/SigningFooter';
import SignatureCanvas from '../../signature/components/SignatureCanvas';
import DraggableSignature from '../../signature/components/DraggableSignature';
import PackageDocSidebar from '../components/PackageDocSidebar';
import StatusModal from '../../../components/UI/StatusModal';
import MobilePackageBottomSheet from '../components/MobilePackageBottomSheet';

/**
 * @page SignPackagePage
 * @description Halaman utama untuk proses batch signing (banyak dokumen).
 */
const SignPackagePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  const {
    packageData,
    documents,
    currentIndex,
    activeDoc,
    loading,
    error,
    pdfStates,
    signingStates,
    actions
  } = useSignPackage(id);

  // Logic for UI feedback
  const isLastDoc = currentIndex === documents.length - 1;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Memuat Paket...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Kesalahan Paket</h3>
        <p className="text-sm text-slate-500 mt-2">{error}</p>
        <button 
          onClick={() => navigate('/dashboard/packages')} 
          className="mt-6 px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl border-none cursor-pointer"
        >
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] bg-slate-100 dark:bg-[#0b141a] flex flex-col overflow-hidden">
      
      {/* 1. TOP NAVBAR */}
      <SigningNavbar 
        title={`${packageData?.title || 'Paket'} / ${activeDoc?.docVersion?.document?.title || 'Dokumen'}`}
        theme={theme}
        toggleTheme={toggleTheme}
        onBack={() => navigate('/dashboard/packages')}
      />

      <div className="flex-1 flex overflow-hidden relative min-h-0">
        
        {/* 2. LEFT SIDEBAR (Playlist) */}
        <PackageDocSidebar 
          documents={documents}
          currentIndex={currentIndex}
          onSelect={actions.goToDocument}
          signaturesMap={signingStates.signaturesMap}
        />

        {/* 3. CENTER PDF VIEWPORT */}
        <main 
          className="flex-1 overflow-y-scroll no-scrollbar bg-slate-100 dark:bg-[#0b141a] p-4 sm:p-8 flex items-start justify-center relative select-none pb-8 min-w-0" 
          ref={pdfStates.containerRef}
        >
          <div 
            className="relative shadow-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 transition-all duration-500 min-h-[500px] flex items-center justify-center overflow-hidden mx-auto"
            style={{ width: pdfStates.containerWidth > 0 ? `${pdfStates.containerWidth}px` : '100%', maxWidth: '800px' }}
          >
            
              {/* Aurora Loading Overlay */}
              <div className={`absolute inset-0 bg-white/90 dark:bg-[#0b141a]/95 backdrop-blur-[6px] z-[60] transition-all duration-700 ease-in-out ${ (pdfStates.loading || pdfStates.isRendering) ? 'opacity-100' : 'opacity-0 pointer-events-none' }`}>
                  <div className="sticky top-0 h-[60vh] flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
                    <p className="text-[10px] items-center font-black text-slate-500 dark:text-emerald-500 uppercase tracking-[0.3em] animate-pulse pr-2 text-center">Menyiapkan Dokumen...</p>
                  </div>
              </div>

            {pdfStates.isReady && pdfStates.url ? (
              <Document 
                 file={pdfStates.url} 
                 onLoadStart={() => pdfStates.setIsRendering(true)}
                 onLoadSuccess={({ numPages }) => pdfStates.setNumPages(numPages)} 
                 onLoadError={(err) => pdfStates.setLoadError(err.message)}
                 loading={null}
              >
                <div className={`relative group cursor-crosshair transition-all duration-300 ${pdfStates.isRendering ? 'opacity-0 scale-95 blur-md' : 'opacity-100 scale-100 blur-0'}`}>
                  <Page 
                    pageNumber={pdfStates.pageNumber} 
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    width={pdfStates.containerWidth}
                    onRenderSuccess={() => pdfStates.setIsRendering(false)}
                    onLoadSuccess={(page) => pdfStates.setPageDimensions({ width: page.originalWidth, height: page.originalHeight })}
                  />
                  
                  {/* Layer Interaction */}
                  {!pdfStates.loading && <div className="absolute inset-0 z-10" onClick={actions.handleCanvasClick} />}
                  
                  {/* Draggable Signatures Layer */}
                  <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden" style={{ touchAction: 'none' }}>
                    {!pdfStates.loading && signingStates.signatures.filter(s => s.pageNumber === pdfStates.pageNumber).map(sig => {
                      const aspectRatio = pdfStates.pageDimensions.width > 0 
                        ? pdfStates.pageDimensions.height / pdfStates.pageDimensions.width 
                        : 1.41;
                      const dynamicHeight = pdfStates.containerWidth * aspectRatio;

                      return (
                        <DraggableSignature
                          key={sig.id}
                          sig={sig}
                          onRemove={actions.removeSignature}
                          onUpdatePosition={actions.updateSignaturePosition}
                          onUpdateSize={actions.updateSignatureSize}
                          containerWidth={pdfStates.containerWidth}
                          containerHeight={dynamicHeight}
                        />
                      );
                    })}
                  </div>
                </div>
              </Document>
            ) : null}

            {pdfStates.loadError && (
              <div className="absolute inset-0 bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center z-[70]">
                 <AlertCircle size={32} className="text-rose-500 mb-2" />
                 <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Gagal Memuat PDF</p>
                 <p className="text-xs text-slate-500 mt-1 max-w-sm">{pdfStates.loadError}</p>
              </div>
            )}
          </div>
        </main>

        {/* 4. RIGHT SIDEBAR (Tools per Doc) */}
        <SigningSidebar 
          onOpenCanvas={() => signingStates.setIsCanvasOpen(true)}
          currentSignature={signingStates.currentSignature}
          signatures={signingStates.signatures}
          onRemoveSignature={actions.removeSignature}
          onFinalize={isLastDoc ? actions.handleSubmit : actions.nextDocument}
          finalizeText={isLastDoc ? "Simpan & Selesai" : "Dokumen Berikutnya"}
          isSubmitting={signingStates.isSubmitting}
        />
      </div>

      {/* 5. FOOTER (Pagination & Mobile Actions) */}
      <div className="bg-white dark:bg-[#111b21] border-t border-slate-200 dark:border-white/10 z-[110] flex flex-col shrink-0">
          {/* Action Bar Mobile (Simplified) */}
          {!signingStates.isSheetOpen && (
            <div className="lg:hidden flex items-center justify-center px-6 py-3 gap-4">
                <button 
                  onClick={() => signingStates.setIsSheetOpen(true)}
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-none cursor-pointer active:scale-90 transition-all"
                  title="Buka Playlist"
                >
                  <Layers size={20} />
                </button>

                <button 
                  onClick={() => signingStates.setIsCanvasOpen(true)}
                  className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white border-none font-bold text-xs uppercase tracking-widest cursor-pointer active:scale-95 transition-all shadow-md shadow-emerald-600/20"
                >
                  <PenTool size={16} />
                  <span>Tambah Tanda Tangan</span>
                </button>
            </div>
          )}

          <SigningFooter 
            pageNumber={pdfStates.pageNumber}
            numPages={pdfStates.numPages}
            setPageNumber={pdfStates.setPageNumber}
            rightContent={(
              <button 
                onClick={isLastDoc ? actions.handleSubmit : actions.nextDocument}
                disabled={signingStates.isSubmitting}
                className={`p-2.5 rounded-xl text-white border-none cursor-pointer shadow-lg active:scale-90 transition-all flex items-center justify-center
                  ${(isLastDoc && signingStates.signatures.length === 0) || signingStates.isSubmitting
                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 shadow-none cursor-not-allowed' 
                    : 'bg-emerald-600 shadow-emerald-600/20'
                  }
                `}
                title={isLastDoc ? "Selesaikan" : "Dokumen Berikutnya"}
              >
                {signingStates.isSubmitting ? (
                   <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  isLastDoc ? <CheckCircle2 size={24} /> : <ChevronRight size={28} />
                )}
              </button>
            )}
          />
      </div>

      <SignatureCanvas 
        isOpen={signingStates.isCanvasOpen}
        onClose={() => signingStates.setIsCanvasOpen(false)}
        onSave={actions.handleSaveCanvas}
      />

      <StatusModal 
        {...signingStates.statusModal} 
        onClose={actions.handleCloseStatusModal} 
      />

      <MobilePackageBottomSheet 
        isOpen={signingStates.isSheetOpen}
        onClose={() => signingStates.setIsSheetOpen(false)}
        onOpenCanvas={() => signingStates.setIsCanvasOpen(true)}
        currentSignature={signingStates.currentSignature}
        signatures={signingStates.signatures}
        onRemoveSignature={actions.removeSignature}
        onFinalize={isLastDoc ? actions.handleSubmit : actions.nextDocument}
        isSubmitting={signingStates.isSubmitting}
        documents={documents}
        currentIndex={currentIndex}
        onSelectDocument={actions.goToDocument}
        signaturesMap={signingStates.signaturesMap}
      />

    </div>
  );
};

export default SignPackagePage;
