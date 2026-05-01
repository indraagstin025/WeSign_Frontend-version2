import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { pdfjs, Document, Page } from 'react-pdf';

// Konfigurasi Worker PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Komponen Group Signing
import { useGroupSigningPage } from '../hooks/useGroupSigningPage';
import DraggableSignatureGroup from '../components/DraggableSignatureGroup';
import GroupSignerProgress from '../components/GroupSignerProgress';

// Komponen Reusable dari Personal Signing
import SigningNavbar from '../../signature/components/SigningNavbar';
import SigningFooter from '../../signature/components/SigningFooter';
import SigningSidebar from '../../signature/components/SigningSidebar';
import SigningMobileBar from '../../signature/components/SigningMobileBar';
import SigningModals from '../../signature/components/SigningModals';
import SaveIndicator from '../../../components/UI/SaveIndicator';

/**
 * @page GroupSigningPage
 * @description Pure presentation — semua logic di `useGroupSigningPage`.
 */
const GroupSigningPage = () => {
  const { state, actions } = useGroupSigningPage();
  const {
    documentId,
    currentUser,
    theme,
    isSheetOpen,
    mySignatures,
    mySignatureCount,
    isCompleted,
    finalizeText,
    submittingAny,

    // Data
    groupData,
    signatures,
    pendingSigners,
    totalSigners,
    pdfUrl,
    documentTitle,

    // Status
    canSign,
    currentSignature,

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

    // Handlers (passed-through)
    handleSaveCanvas,
    handleUpdateSignature,
    handleUpdateSize,
    handleDeleteSignature,
    onDocumentLoadSuccess,
    handlePageLoadSuccess,
  } = state;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 bg-zinc-100 dark:bg-[#0b141a] flex flex-col items-center justify-center space-y-6">
        <div className="w-20 h-20 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300">Menyiapkan Ruang Kolaborasi...</p>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="fixed inset-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Gagal Memuat</h3>
        <p className="text-sm text-zinc-500 mt-2">{error}</p>
        <button onClick={actions.goBackToGroup} className="mt-6 px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer">Kembali</button>
      </div>
    );
  }

  // ── Completed ─────────────────────────────────────────────────────────────
  if (isCompleted) {
    return (
      <div className="fixed inset-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle size={48} className="text-emerald-500 mb-4" />
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Dokumen Telah Difinalisasi</h3>
        <p className="text-sm text-zinc-500 mt-2">Semua penandatangan telah selesai.</p>
        <div className="mt-6 flex gap-3">
          <button onClick={actions.openFinalPdf} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl">Lihat PDF Final</button>
          <button onClick={actions.goBackToGroup} className="px-6 py-2 bg-zinc-200 text-zinc-800 font-bold rounded-xl">Kembali ke Grup</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] bg-zinc-100 dark:bg-[#0b141a] flex flex-col overflow-hidden">

      {/* Indikator status simpan otomatis */}
      <SaveIndicator />

      {/* HEADER */}
      <SigningNavbar
        title={documentTitle}
        theme={theme}
        toggleTheme={actions.toggleTheme}
        onBack={actions.goBackToGroup}
      />

      {/* Banner Koneksi Socket */}
      {!socketStatus.connected && (
        <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold py-1.5 px-4 text-center border-b border-amber-500/20">
          Koneksi terputus. Mencoba menghubungkan kembali...
        </div>
      )}

      {/* PROGRESS BAR */}
      <GroupSignerProgress
        groupData={groupData}
        signatures={signatures}
        totalSigners={totalSigners}
        pendingSigners={pendingSigners}
        documentId={documentId}
        activeUsers={activeUsers}
      />

      {/* CONTENT AREA */}
      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden relative min-w-0">

        {/* SIDEBAR */}
        <SigningSidebar
          onOpenCanvas={actions.openCanvas}
          currentSignature={currentSignature}
          signatures={mySignatures}
          onRemoveSignature={handleDeleteSignature}
          onFinalize={actions.finalizeAction}
          isSubmitting={submittingAny}
          finalizeText={finalizeText}
        />

        {/* MAIN PDF AREA */}
        <main
          className="flex-1 overflow-y-scroll no-scrollbar p-4 sm:p-8 flex items-start justify-center relative select-none pb-28 sm:pb-8"
          ref={containerRef}
        >
          <div
            className="relative shadow-2xl bg-white dark:bg-zinc-900 min-h-[500px] flex items-center justify-center overflow-hidden mx-auto"
            style={{ width: containerWidth > 0 ? `${containerWidth}px` : '100%', maxWidth: '800px' }}
          >
            {isReady && pdfUrl ? (
              <Document
                file={pdfUrl}
                key={pdfUrl}
                onLoadStart={() => setIsRendering(true)}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={null}
              >
                <div className={`relative group transition-all duration-300 ${isRendering ? 'opacity-0 scale-95 blur-md' : 'opacity-100 scale-100 blur-0'} ${canSign ? 'cursor-crosshair' : 'cursor-default'}`}>
                  <Page
                    pageNumber={pageNumber}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    width={containerWidth}
                    onRenderSuccess={() => setIsRendering(false)}
                    onLoadSuccess={handlePageLoadSuccess}
                  />

                  {/* Layer Click untuk Drop */}
                  <div className="absolute inset-0 z-10" onClick={actions.handleCanvasClick} />

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
      </div>

      {/* FOOTER & MOBILE BAR */}
      <SigningFooter pageNumber={pageNumber} numPages={numPages} setPageNumber={setPageNumber} />

      {!isSheetOpen && (
        <SigningMobileBar
          pageNumber={pageNumber}
          numPages={numPages}
          setPageNumber={setPageNumber}
          onOpenSheet={actions.openSheet}
          onOpenCanvas={actions.openCanvas}
          onFinalize={actions.finalizeAction}
          signatureCount={mySignatureCount}
          isSubmitting={submittingAny}
        />
      )}

      {/* MODALS */}
      <SigningModals
        isCanvasOpen={isCanvasOpen}
        setIsCanvasOpen={setIsCanvasOpen}
        handleSaveCanvas={handleSaveCanvas}
        isSheetOpen={isSheetOpen}
        setIsSheetOpen={actions.setIsSheetOpen}
        currentSignature={currentSignature}
        signatures={mySignatures}
        removeSignature={handleDeleteSignature}
        handleFinalSign={actions.finalizeAction}
        isSubmitting={submittingAny}
        statusModal={statusModal}
        setStatusModal={setStatusModal}
      />
    </div>
  );
};

export default GroupSigningPage;
