import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  AlertCircle,
  Layers,
  PenTool,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { pdfjs, Document, Page } from 'react-pdf';

// Konfigurasi Worker PDF.js — bundle lokal via Vite
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

import { useTheme } from '../../../hooks/useTheme';
import { useSignPackage } from '../hooks/useSignPackage';
import { useSignatureAssets } from '../../signature/hooks/useSignatureAssets';

// Styles
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Components
import SigningNavbar from '../../signature/components/SigningNavbar';
import SigningSidebar from '../../signature/components/SigningSidebar';
import SigningFooterBar from '../../signature/components/SigningFooterBar';
import DocumentSettingsPanel from '../../signature/components/DocumentSettingsPanel';
import SignatureCanvas from '../../signature/components/SignatureCanvas';
import DraggableSignature from '../../signature/components/DraggableSignature';
import ParafModal from '../../signature/components/ParafModal';
import StampModal from '../../signature/components/StampModal';
import TextAnnotationModal from '../../signature/components/TextAnnotationModal';
import DateFieldModal from '../../signature/components/DateFieldModal';
import PackageDocSidebar from '../components/PackageDocSidebar';
import StatusModal from '../../../components/ui/StatusModal';
import MobilePackageBottomSheet from '../components/MobilePackageBottomSheet';

/**
 * @page SignPackagePage
 * @description Halaman utama untuk proses batch signing (banyak dokumen).
 * Redesigned: Navbar baru + PdfToolbar (tanpa footer).
 */
const SignPackagePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [interactionMode, setInteractionMode] = useState('cursor');
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [isParafOpen, setIsParafOpen] = useState(false);
  const [isStampOpen, setIsStampOpen] = useState(false);
  const [isTextOpen, setIsTextOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [activeElement, setActiveElement] = useState(null);
  // Session-only saved assets for paraf/stamp/text/date (not persisted to backend)
  const [sessionAssets, setSessionAssets] = useState({});

  // Saved signature assets (persistent)
  const { assets, upload: uploadAsset, remove: removeAsset, getDefault } = useSignatureAssets();
  
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

  // Auto-load default signature dari saved assets
  useEffect(() => {
    if (!signingStates.currentSignature && assets.length > 0) {
      const defaultSig = getDefault('signature');
      if (defaultSig) {
        actions.handleSaveCanvas(defaultSig.imageUrl, 'signature');
        setActiveElement({ type: 'signature', imageUrl: defaultSig.imageUrl });
      }
    }
  }, [assets]);

  // Sinkronkan activeElement dari currentSignature hook (agar preview sidebar tetap muncul saat pindah dokumen)
  useEffect(() => {
    if (signingStates.currentSignature && !activeElement) {
      setActiveElement({ type: 'signature', imageUrl: signingStates.currentSignature });
    }
  }, [signingStates.currentSignature]);

  const isLastDoc = currentIndex === documents.length - 1;

  const handlePdfClick = (e) => {
    if (interactionMode === 'cursor') {
      actions.handleCanvasClick(e);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 border-[3px] border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] animate-pulse">Memuat Paket...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={40} className="text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Kesalahan Paket</h3>
        <p className="text-sm text-zinc-500 mt-2 max-w-sm">{error}</p>
        <button 
          onClick={() => navigate('/dashboard/packages')} 
          className="mt-6 px-5 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl border-none cursor-pointer hover:bg-emerald-600 transition-colors"
        >
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] bg-zinc-50 dark:bg-zinc-950 flex overflow-hidden">
      
      {/* 1. LEFT SIDEBAR (Tanda Tangan) */}
      <SigningSidebar 
        onOpenCanvas={() => {
          const saved = getDefault('signature');
          if (saved) {
            actions.handleSaveCanvas(saved.imageUrl, 'signature');
            setActiveElement({ type: 'signature', imageUrl: saved.imageUrl });
          } else {
            signingStates.setIsCanvasOpen(true);
          }
        }}
        onForceOpenCanvas={() => signingStates.setIsCanvasOpen(true)}
        onOpenParaf={() => {
          if (sessionAssets.initial && activeElement?.type !== 'initial') {
            // Switch ke session asset
            actions.handleSaveCanvas(sessionAssets.initial, 'initial');
            setActiveElement({ type: 'initial', imageUrl: sessionAssets.initial });
          } else {
            // Sudah aktif (edit) atau belum pernah buat → buka modal
            setIsParafOpen(true);
          }
        }}
        onOpenStamp={() => {
          if (sessionAssets.stamp && activeElement?.type !== 'stamp') {
            actions.handleSaveCanvas(sessionAssets.stamp, 'stamp');
            setActiveElement({ type: 'stamp', imageUrl: sessionAssets.stamp });
          } else {
            setIsStampOpen(true);
          }
        }}
        onOpenText={() => {
          if (sessionAssets.text && activeElement?.type !== 'text') {
            actions.handleSaveCanvas(sessionAssets.text, 'text');
            setActiveElement({ type: 'text', imageUrl: sessionAssets.text });
          } else {
            setIsTextOpen(true);
          }
        }}
        onOpenDate={() => {
          if (sessionAssets.date && activeElement?.type !== 'date') {
            actions.handleSaveCanvas(sessionAssets.date, 'date');
            setActiveElement({ type: 'date', imageUrl: sessionAssets.date });
          } else {
            setIsDateOpen(true);
          }
        }}
        currentSignature={signingStates.currentSignature}
        activeElement={activeElement}
        signatures={signingStates.signatures}
        onRemoveSignature={actions.removeSignature}
        onFinalize={isLastDoc ? actions.handleSubmit : actions.nextDocument}
        finalizeText={isLastDoc ? "Simpan & Selesai" : "Dokumen Berikutnya"}
        isSubmitting={signingStates.isSubmitting}
      >
      </SigningSidebar>

      {/* 2. CENTER AREA (Navbar + Toolbar + PDF) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Navbar */}
        <SigningNavbar 
          title={`Paket: ${packageData?.title || 'Paket'} / ${activeDoc?.docVersion?.document?.title || 'Dokumen'}`}
          onBack={() => navigate('/dashboard/packages')}
          onOpenSettings={() => setSettingsOpen(true)}
          status={signingStates.isSubmitting ? 'saving' : 'unsigned'}
        />

        {/* PDF Viewer */}
        <main 
          className={`flex-1 overflow-y-auto no-scrollbar bg-zinc-100 dark:bg-zinc-950 p-4 sm:p-8 flex items-start justify-center relative select-none pb-28 sm:pb-8 min-w-0
            ${interactionMode === 'cursor' ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}
          `}
          ref={pdfStates.containerRef}
        >
          <div 
            className="relative shadow-2xl bg-white dark:bg-zinc-900 ring-1 ring-zinc-200 dark:ring-zinc-800 transition-all duration-500 min-h-[500px] flex items-center justify-center overflow-hidden mx-auto"
            style={{ width: pdfStates.containerWidth > 0 ? `${pdfStates.containerWidth}px` : '100%', maxWidth: '800px' }}
          >
            
              {/* Loading Overlay */}
              <div className={`absolute inset-0 bg-white/90 dark:bg-zinc-950/95 backdrop-blur-sm z-[60] transition-all duration-500 ease-out ${ (pdfStates.loading || pdfStates.isRendering) ? 'opacity-100' : 'opacity-0 pointer-events-none' }`}>
                  <div className="sticky top-0 h-[60vh] flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-[3px] border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3" />
                    <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] animate-pulse text-center">Menyiapkan Dokumen...</p>
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
                <div className={`relative group transition-all duration-300 ${pdfStates.isRendering ? 'opacity-0 scale-[0.97] blur-md' : 'opacity-100 scale-100 blur-0'}`}>
                  <Page 
                    pageNumber={pdfStates.pageNumber} 
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    width={pdfStates.containerWidth}
                    onRenderSuccess={() => pdfStates.setIsRendering(false)}
                    onLoadSuccess={(page) => pdfStates.setPageDimensions({ width: page.originalWidth, height: page.originalHeight })}
                  />
                  
                  {/* Layer Interaction — hanya aktif di mode cursor */}
                  {!pdfStates.loading && (
                    <div 
                      className="absolute inset-0 z-10" 
                      onClick={handlePdfClick}
                      style={{ pointerEvents: interactionMode === 'cursor' ? 'auto' : 'none' }}
                    />
                  )}
                  
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
              <div className="absolute inset-0 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-6 text-center z-[70]">
                 <AlertCircle size={28} className="text-rose-500 mb-2" />
                 <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">Gagal Memuat PDF</p>
                 <p className="text-xs text-zinc-500 mt-1 max-w-sm">{pdfStates.loadError}</p>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <SigningFooterBar
          pageNumber={pdfStates.pageNumber}
          numPages={pdfStates.numPages}
          setPageNumber={pdfStates.setPageNumber}
        />
      </div>

      {/* 3. RIGHT SIDEBAR (Isi Paket / Playlist) */}
      <PackageDocSidebar 
        documents={documents}
        currentIndex={currentIndex}
        onSelect={actions.goToDocument}
        signaturesMap={signingStates.signaturesMap}
      />

      {/* 4. RIGHT PANEL: Pengaturan Dokumen */}
      <DocumentSettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        auditTrailMode={signingStates.auditTrailMode}
        onAuditTrailChange={signingStates.setAuditTrailMode}
      />

      {/* MOBILE BOTTOM BAR */}
      {!signingStates.isSheetOpen && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-100 dark:border-zinc-800 z-[130] flex items-center justify-center px-4 py-3 gap-3"
          style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
        >
          <button 
            onClick={() => signingStates.setIsSheetOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-none cursor-pointer active:scale-90 transition-all"
            title="Buka Playlist"
          >
            <Layers size={18} />
          </button>

          <button 
            onClick={() => signingStates.setIsCanvasOpen(true)}
            className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-white border-none font-bold text-[11px] uppercase tracking-wider cursor-pointer active:scale-95 transition-all shadow-md shadow-emerald-500/20"
          >
            <PenTool size={14} />
            <span>Tambah TTD</span>
          </button>

          <button 
            onClick={isLastDoc ? actions.handleSubmit : actions.nextDocument}
            disabled={signingStates.isSubmitting}
            className={`w-10 h-10 flex items-center justify-center rounded-xl border-none cursor-pointer active:scale-90 transition-all
              ${(isLastDoc && signingStates.signatures.length === 0) || signingStates.isSubmitting
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' 
                : 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              }
            `}
            title={isLastDoc ? "Selesaikan" : "Dokumen Berikutnya"}
          >
            {signingStates.isSubmitting ? (
               <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              isLastDoc ? <CheckCircle2 size={18} /> : <ChevronRight size={20} />
            )}
          </button>
        </div>
      )}

      {/* MODALS */}
      <SignatureCanvas 
        isOpen={signingStates.isCanvasOpen}
        onClose={() => signingStates.setIsCanvasOpen(false)}
        onSave={(dataUrl) => {
          actions.handleSaveCanvas(dataUrl, 'signature');
          setActiveElement({ type: 'signature', imageUrl: dataUrl });
          uploadAsset(dataUrl, 'signature', 'Signature');
        }}
        savedAssets={assets.filter(a => a.type === 'signature')}
        onDeleteAsset={(id) => removeAsset(id)}
        onSelectAsset={(asset) => {
          actions.handleSaveCanvas(asset.imageUrl, 'signature');
          setActiveElement({ type: 'signature', imageUrl: asset.imageUrl });
        }}
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

      {/* Tool Modals */}
      <ParafModal isOpen={isParafOpen} onClose={() => setIsParafOpen(false)} onSave={(dataUrl) => { actions.handleSaveCanvas(dataUrl, 'initial'); setActiveElement({ type: 'initial', imageUrl: dataUrl }); setSessionAssets(prev => ({ ...prev, initial: dataUrl })); setIsParafOpen(false); }} />
      <StampModal isOpen={isStampOpen} onClose={() => setIsStampOpen(false)} onSave={(dataUrl) => { actions.handleSaveCanvas(dataUrl, 'stamp'); setActiveElement({ type: 'stamp', imageUrl: dataUrl }); setSessionAssets(prev => ({ ...prev, stamp: dataUrl })); setIsStampOpen(false); }} />
      <TextAnnotationModal isOpen={isTextOpen} onClose={() => setIsTextOpen(false)} onSave={(dataUrl) => { actions.handleSaveCanvas(dataUrl, 'text'); setActiveElement({ type: 'text', imageUrl: dataUrl }); setSessionAssets(prev => ({ ...prev, text: dataUrl })); setIsTextOpen(false); }} />
      <DateFieldModal isOpen={isDateOpen} onClose={() => setIsDateOpen(false)} onSave={(dataUrl) => { actions.handleSaveCanvas(dataUrl, 'date'); setActiveElement({ type: 'date', imageUrl: dataUrl }); setSessionAssets(prev => ({ ...prev, date: dataUrl })); setIsDateOpen(false); }} />
    </div>
  );
};

export default SignPackagePage;
