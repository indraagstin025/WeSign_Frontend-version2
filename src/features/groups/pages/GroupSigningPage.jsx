import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { pdfjs, Document, Page } from 'react-pdf';

// Konfigurasi Worker PDF.js — bundle lokal via Vite
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Komponen Group Signing
import { useGroupSigningPage } from '../hooks/useGroupSigningPage';
import { useSignatureAssets } from '../../signature/hooks/useSignatureAssets';
import { useInteractionMode } from '../../signature/hooks/useInteractionMode';
import DraggableSignatureGroup from '../components/DraggableSignatureGroup';
import GroupSignerProgress from '../components/GroupSignerProgress';
import GroupInfoMobileCard from '../components/GroupInfoMobileCard';
import RejectReasonModal from '../components/RejectReasonModal';

// Komponen Reusable dari Personal Signing
import SigningNavbar from '../../signature/components/SigningNavbar';
import SigningSidebar from '../../signature/components/SigningSidebar';
import SigningFooterBar from '../../signature/components/SigningFooterBar';
import DocumentSettingsPanel from '../../signature/components/DocumentSettingsPanel';
import SigningMobileBar from '../../signature/components/SigningMobileBar';
import SigningModals from '../../signature/components/SigningModals';
import ActiveSignatureMobileCard from '../../signature/components/ActiveSignatureMobileCard';
import MobilePageIndicator from '../../signature/components/MobilePageIndicator';
import ParafModal from '../../signature/components/ParafModal';
import StampModal from '../../signature/components/StampModal';
import TextAnnotationModal from '../../signature/components/TextAnnotationModal';
import DateFieldModal from '../../signature/components/DateFieldModal';
import { saveStatus } from '../../../services/saveStatus';

/**
 * @page GroupSigningPage
 * @description Halaman penandatanganan grup — Redesigned.
 * Layout: Sidebar (kiri, full-height + progress) + Content Area (1 navbar gabungan + PDF)
 * Navbar gabungan: judul + tools + pagination + theme (1 baris saja)
 */
const GroupSigningPage = () => {
  const { state, actions } = useGroupSigningPage();
  // [L-1] Shared hook useInteractionMode (sebelumnya state duplikat di
  // 3 signing pages: Document, Group, Package).
  const { mode: interactionMode } = useInteractionMode('cursor');
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [saveState, setSaveState] = useState(saveStatus.get());
  const [isParafOpen, setIsParafOpen] = useState(false);
  const [isStampOpen, setIsStampOpen] = useState(false);
  const [isTextOpen, setIsTextOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [activeElement, setActiveElement] = useState(null);
  // [H-4] State untuk RejectReasonModal — replace blocking window.prompt.
  const [rejectOpen, setRejectOpen] = useState(false);

  // Saved signature assets (persistent — only signature type for group)
  const { assets, upload: uploadAsset, remove: removeAsset, getDefault } = useSignatureAssets();

  // [CR-1] Destructure DULU sebelum useEffect yang menggunakannya, supaya
  // tidak melanggar no-use-before-define dan exhaustive-deps lint rules.
  const {
    documentId,
    currentUser,
    isSheetOpen,
    mySignatures,
    mySignatureCount,
    isCompleted,
    isFinalizeMode,
    finalizeText,
    submittingAny,
    disableFinalizeAction,
    auditTrailMode,
    setAuditTrailMode,

    // Data
    groupData,
    signatures,
    pendingSigners,
    totalSigners,
    pdfUrl,
    documentTitle,

    // Status
    canSign,
    hasMyFinalSig,
    currentSignature,
    isAdmin,

    // PDF state
    containerRef,
    containerWidth,
    pageDimensions,
    numPages,
    pageNumber,
    setPageNumber,
    isRendering,
    setIsRendering,
    isReady,

    // UI
    loading,
    error,
    isCanvasOpen,
    setIsCanvasOpen,
    statusModal,
    setStatusModal,
    socketStatus,
    activeUsers,

    // Handlers
    handleSaveCanvas,
    handleUpdateSignature,
    handleUpdateSize,
    handleDeleteSignature,
    onDocumentLoadSuccess,
    handlePageLoadSuccess,
  } = state;

  useEffect(() => saveStatus.subscribe(setSaveState), []);

  // Auto-load default signature dari saved assets.
  // Deps `[assets, currentSignature]` lengkap supaya:
  // - Kalau user delete signature aktif (currentSignature -> null), default
  //   signature ter-load otomatis lagi tanpa perlu manual refresh.
  // - getDefault dan handleSaveCanvas adalah stable function refs dari hook,
  //   tidak perlu masuk deps (mengikuti konvensi yang sama dengan
  //   DocumentSigningPage).
  useEffect(() => {
    if (!currentSignature && assets.length > 0) {
      const defaultSig = getDefault('signature');
      if (defaultSig) {
        handleSaveCanvas(defaultSig.imageUrl, 'signature');
        setActiveElement({ type: 'signature', imageUrl: defaultSig.imageUrl });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, currentSignature]);

  // Handler klik PDF — hanya aktif di mode cursor
  const handlePdfClick = (e) => {
    if (interactionMode === 'cursor') {
      actions.handleCanvasClick(e);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center space-y-5">
        <div className="w-14 h-14 border-[3px] border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
        <div className="flex flex-col items-center space-y-1.5">
          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] animate-pulse">Memuat</p>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Menyiapkan Ruang Kolaborasi...</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="fixed inset-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={40} className="text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Gagal Memuat</h3>
        <p className="text-sm text-zinc-500 mt-2 max-w-sm">{error}</p>
        <button onClick={actions.goBackToGroup} className="mt-6 px-5 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl border-none cursor-pointer hover:bg-emerald-600 transition-colors">Kembali</button>
      </div>
    );
  }

  // ── Completed ─────────────────────────────────────────────────────────────
  if (isCompleted) {
    return (
      <div className="fixed inset-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle size={44} className="text-emerald-500 mb-4" />
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Dokumen Telah Difinalisasi</h3>
        <p className="text-sm text-zinc-500 mt-2">Semua penandatangan telah selesai.</p>
        <div className="mt-6 flex gap-3">
          <button onClick={actions.openFinalPdf} className="px-5 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl border-none cursor-pointer hover:bg-emerald-600 transition-colors">Lihat PDF Final</button>
          <button onClick={actions.goBackToGroup} className="px-5 py-2.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-sm font-bold rounded-xl border-none cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">Kembali ke Grup</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] bg-zinc-50 dark:bg-zinc-950 flex overflow-hidden">

      {/* 1. SIDEBAR (Full-Height, dengan Logo + Progress Kolaborator) */}
      <SigningSidebar
        onOpenCanvas={() => {
          const saved = getDefault('signature');
          if (saved) {
            handleSaveCanvas(saved.imageUrl, 'signature');
            setActiveElement({ type: 'signature', imageUrl: saved.imageUrl });
          } else {
            actions.openCanvas();
          }
        }}
        onForceOpenCanvas={actions.openCanvas}
        onOpenParaf={isAdmin ? () => setIsParafOpen(true) : undefined}
        onOpenStamp={isAdmin ? () => setIsStampOpen(true) : undefined}
        onOpenText={isAdmin ? () => setIsTextOpen(true) : undefined}
        onOpenDate={isAdmin ? () => setIsDateOpen(true) : undefined}
        currentSignature={currentSignature}
        activeElement={activeElement}
        signatures={mySignatures}
        onRemoveSignature={handleDeleteSignature}
        onFinalize={actions.finalizeAction}
        isSubmitting={submittingAny}
        finalizeText={finalizeText}
        disabled={disableFinalizeAction}
      >
        {/* Progress Kolaborator */}
        <GroupSignerProgress
          groupData={groupData}
          signatures={signatures}
          totalSigners={totalSigners}
          pendingSigners={pendingSigners}
          documentId={documentId}
          activeUsers={activeUsers}
        />

        {/* Tombol Tolak Dokumen — hanya tampil untuk admin */}
        {isAdmin && !isFinalizeMode && !hasMyFinalSig && canSign && (
          <button
            type="button"
            onClick={() => {
              // [H-4] Buka modal alih-alih window.prompt yang blocking
              setRejectOpen(true);
            }}
            className="w-full mt-2 px-3 py-2 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all cursor-pointer"
          >
            Tolak Dokumen
          </button>
        )}
      </SigningSidebar>

      {/* 2. CONTENT AREA (1 Navbar + PDF) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Navbar */}
        <SigningNavbar
          title={documentTitle}
          onBack={actions.goBackToGroup}
          onOpenSettings={isAdmin ? () => setSettingsOpen(true) : undefined}
          status={
            saveState.status === 'saving' ? 'saving' 
            : saveState.status === 'saved' ? 'saved'
            : pendingSigners === 0 ? 'locked' 
            : null
          }
        />

        {/* Banner Koneksi Socket */}
        {!socketStatus.connected && (
          <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold py-1 px-4 text-center border-b border-amber-500/20">
            Koneksi terputus. Mencoba menghubungkan kembali...
          </div>
        )}

        {/* [MOBILE] Group info card — tampil di atas PDF, di bawah navbar */}
        <GroupInfoMobileCard
          groupData={groupData}
          activeUsers={activeUsers}
          signerRequests={
            groupData?.documents?.find((d) => String(d.id) === String(documentId))
              ?.signerRequests || []
          }
          currentUserId={currentUser?.id}
        />

        {/* PDF Viewer */}
        <main
          className={`flex-1 overflow-y-auto no-scrollbar bg-zinc-100 dark:bg-zinc-950 p-4 sm:p-8 flex items-start justify-center relative select-none pb-52 sm:pb-8 min-w-0
            ${interactionMode === 'cursor' && canSign ? 'cursor-crosshair' : interactionMode === 'hand' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
          `}
          ref={containerRef}
        >
          <div
            className="relative shadow-2xl bg-white dark:bg-zinc-900 ring-1 ring-zinc-200 dark:ring-zinc-800 transition-all duration-500 min-h-[500px] flex items-center justify-center overflow-hidden mx-auto"
            style={{ width: containerWidth > 0 ? `${containerWidth}px` : '100%', maxWidth: '800px' }}
          >
            {/* Loading Overlay */}
            <div className={`absolute inset-0 bg-white/90 dark:bg-zinc-950/95 backdrop-blur-sm z-[60] transition-all duration-500 ease-out ${isRendering ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
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

                  {/* Layer Click — hanya aktif di mode cursor */}
                  <div
                    className="absolute inset-0 z-10"
                    onClick={handlePdfClick}
                    style={{ pointerEvents: interactionMode === 'cursor' ? 'auto' : 'none' }}
                  />

                  {/* Layer Tanda Tangan */}
                  <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden" style={{ touchAction: 'none' }}>
                    {signatures.filter((s) => s.pageNumber === pageNumber).map((sig) => {
                      const aspectRatio = pageDimensions.width > 0 ? pageDimensions.height / pageDimensions.width : 1.41;
                      const dynamicHeight = containerWidth * aspectRatio;

                      return (
                        <DraggableSignatureGroup
                          key={sig.id}
                          sig={sig}
                          onRemove={handleDeleteSignature}
                          onUpdatePosition={handleUpdateSignature}
                          onUpdateSize={handleUpdateSize}
                          containerWidth={containerWidth}
                          containerHeight={dynamicHeight}
                          currentUser={currentUser}
                          documentId={documentId}
                          readOnly={!canSign}
                        />
                      );
                    })}
                  </div>
                </div>
              </Document>
            ) : null}
          </div>
        </main>
        {/* [MOBILE] Page indicator pill — tampil floating tepat di bawah PDF.
            Tidak ada zoom control sesuai instruksi user. */}
        <MobilePageIndicator
          pageNumber={pageNumber}
          numPages={numPages}
          setPageNumber={setPageNumber}
        />
        {/* [MOBILE] Active signature card — tampil setelah PDF, di atas footer/action bar */}
        <ActiveSignatureMobileCard
          currentSignature={currentSignature}
          signatures={mySignatures}
          onRemoveSignature={handleDeleteSignature}
        />
        {/* Footer */}
        <SigningFooterBar
          pageNumber={pageNumber}
          numPages={numPages}
          setPageNumber={setPageNumber}
        />
      </div>

      {/* 3. RIGHT PANEL: Pengaturan Dokumen (hanya admin) */}
      {isAdmin && (
        <DocumentSettingsPanel
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          auditTrailMode={auditTrailMode}
          onAuditTrailChange={setAuditTrailMode}
        />
      )}

      {/* 4. MOBILE BOTTOM BAR — selalu visible (juga saat sheet open).
          Sebelumnya ada guard `!isSheetOpen` yang sembunyikan action bar
          saat sheet terbuka, tapi mockup user mau action bar tetap visible
          di paling bawah supaya user bisa langsung Tanda Tangan / Finalisasi
          tanpa close sheet dulu. Z-index ActionBar (130) > Sheet (101), jadi
          tetap muncul di atas backdrop. */}
      <SigningMobileBar
        pageNumber={pageNumber}
        numPages={numPages}
        setPageNumber={setPageNumber}
        onOpenSheet={actions.openSheet}
        onOpenCanvas={actions.openCanvas}
        onFinalize={actions.finalizeAction}
        signatureCount={mySignatureCount}
        isSubmitting={submittingAny}
        isFinalizeMode={isFinalizeMode}
        finalizeText={finalizeText}
        disabled={disableFinalizeAction}
      />

      {/* 5. MODALS */}
      <SigningModals
        isCanvasOpen={isCanvasOpen}
        setIsCanvasOpen={setIsCanvasOpen}
        handleSaveCanvas={(dataUrl) => {
          handleSaveCanvas(dataUrl, 'signature');
          setActiveElement({ type: 'signature', imageUrl: dataUrl });
          uploadAsset(dataUrl, 'signature', 'Signature');
        }}
        isSheetOpen={isSheetOpen}
        setIsSheetOpen={actions.setIsSheetOpen}
        currentSignature={currentSignature}
        signatures={mySignatures}
        removeSignature={handleDeleteSignature}
        handleFinalSign={actions.finalizeAction}
        isSubmitting={submittingAny}
        statusModal={statusModal}
        setStatusModal={setStatusModal}
        finalizeText={finalizeText}
        disableFinalize={disableFinalizeAction}
        savedAssets={assets.filter(a => a.type === 'signature')}
        onDeleteAsset={(id) => removeAsset(id)}
        onSelectAsset={(asset) => { handleSaveCanvas(asset.imageUrl, 'signature'); setActiveElement({ type: 'signature', imageUrl: asset.imageUrl }); }}
        // [Mobile picker] Tambah Element handler — admin only
        onOpenParaf={isAdmin ? () => setIsParafOpen(true) : undefined}
        onOpenStamp={isAdmin ? () => setIsStampOpen(true) : undefined}
        onOpenText={isAdmin ? () => setIsTextOpen(true) : undefined}
        onOpenDate={isAdmin ? () => setIsDateOpen(true) : undefined}
        activeElement={activeElement?.type || 'signature'}
      />

      {/* Tool Modals */}
      <ParafModal isOpen={isParafOpen} onClose={() => setIsParafOpen(false)} onSave={(dataUrl) => { handleSaveCanvas(dataUrl, 'initial'); setActiveElement({ type: 'initial', imageUrl: dataUrl }); setIsParafOpen(false); }} />
      <StampModal isOpen={isStampOpen} onClose={() => setIsStampOpen(false)} onSave={(dataUrl) => { handleSaveCanvas(dataUrl, 'stamp'); setActiveElement({ type: 'stamp', imageUrl: dataUrl }); setIsStampOpen(false); }} />
      <TextAnnotationModal isOpen={isTextOpen} onClose={() => setIsTextOpen(false)} onSave={(dataUrl) => { handleSaveCanvas(dataUrl, 'text'); setActiveElement({ type: 'text', imageUrl: dataUrl }); setIsTextOpen(false); }} />
      <DateFieldModal isOpen={isDateOpen} onClose={() => setIsDateOpen(false)} onSave={(dataUrl) => { handleSaveCanvas(dataUrl, 'date'); setActiveElement({ type: 'date', imageUrl: dataUrl }); setIsDateOpen(false); }} />

      {/* [H-4] Reject reason modal — replace window.prompt */}
      <RejectReasonModal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onSubmit={(reason) => {
          setRejectOpen(false);
          actions.handleRejectDocument(reason || null);
        }}
        documentTitle={documentTitle}
      />
    </div>
  );
};

export default GroupSigningPage;
