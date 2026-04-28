import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { pdfjs, Document, Page } from 'react-pdf';

// Konfigurasi Worker PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { useTheme } from '../../../hooks/useTheme';
import { useUser } from '../../../context/UserContext';

// Komponen Group Signing
import { useGroupSigning } from '../hooks/useGroupSigning';
import DraggableSignatureGroup from '../components/DraggableSignatureGroup';
import GroupSignerProgress from '../components/GroupSignerProgress';

// Komponen Reusable dari Personal Signing
import SigningNavbar from '../../signature/components/SigningNavbar';
import SigningFooter from '../../signature/components/SigningFooter';
import SigningSidebar from '../../signature/components/SigningSidebar';
import SigningMobileBar from '../../signature/components/SigningMobileBar';
import SigningModals from '../../signature/components/SigningModals';
import SaveIndicator from '../../../components/UI/SaveIndicator';
import { useOutboxDrain } from '../../../hooks/useOutboxDrain';

/**
 * @page GroupSigningPage
 * @description Halaman khusus untuk menandatangani dokumen grup secara kolaboratif.
 */
const GroupSigningPage = () => {
  const { groupId, documentId } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user: currentUser } = useUser();

  // Hook utama orchestrator
  const {
    // Data
    groupData,
    signatures,
    pendingSigners,
    totalSigners,
    pdfUrl,
    documentTitle,
    documentStatus,

    // Status User
    isAdmin,
    isSigner,
    canSign,
    hasMyFinalSig,
    readyToFinalize,
    currentSignature,
    setCurrentSignature,

    // PDF State
    containerRef,
    containerWidth,
    pageDimensions,
    numPages,
    pageNumber,
    setPageNumber,
    isRendering,
    setIsRendering,
    isReady,

    // UI State
    loading,
    error,
    isCanvasOpen,
    setIsCanvasOpen,
    isSubmitting,
    isFinalizing,
    statusModal,
    setStatusModal,
    socketStatus,
    activeUsers,

    // Handlers
    handleSaveCanvas,
    handleAddSignature,
    handleUpdateSignature,
    handleUpdateSize,
    handleDeleteSignature,
    handleSaveMySignature,
    handleFinalizeDocument,
    onDocumentLoadSuccess,
    handlePageLoadSuccess,
    refreshData,
  } = useGroupSigning({ groupId, documentId, currentUser });

  // Tier 2: drain outbox saat mount + saat 'online' event. Kalau ada entry
  // yang gagal terus (mencapai MAX_DRAIN_ATTEMPTS), refetch state agar UI
  // sinkron dengan server-truth (rollback optimistic update).
  useOutboxDrain(React.useCallback(() => {
    console.warn('[GroupSigningPage] outbox entry dropped → refetch state');
    if (refreshData) refreshData(true);
  }, [refreshData]));

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  // Debug: verifikasi canSign setelah fix
  React.useEffect(() => {
    if (loading) return;
    console.log('[GroupSigningPage] canSign:', canSign, '| isSigner:', isSigner,
      '| documentStatus:', documentStatus, '| currentUser:', currentUser?.id);
  }, [canSign, isSigner, documentStatus, loading]); // eslint-disable-line

  // ── Handler Klik PDF ──────────────────────────────────────────────────────
  const handleCanvasClick = (e) => {
    if (!canSign) return;
    if (!currentSignature) {
      setIsCanvasOpen(true);
      return;
    }
    
    // Cek jika sudah ada TTD (draft atau final), tidak bisa nambah lagi
    const mySig = signatures.find(s => String(s.userId || s.signerId) === String(currentUser?.id));
    if (mySig) {
       setStatusModal({
         isOpen: true, type: 'error', title: 'Batas Tercapai', 
         message: 'Anda hanya dapat menambahkan satu tanda tangan.'
       });
       return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;
    const defaultWidth = 0.25; // 25% lebar halaman

    handleAddSignature({
      pageNumber,
      positionX: Math.max(0, Math.min(1 - defaultWidth, clickX - defaultWidth / 2)),
      positionY: Math.max(0, clickY - 0.05),
      width: defaultWidth,
      height: 0.1, // Akan di-update oleh handleImageLoad
    });
  };

  // ── Loading & Error States ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 bg-zinc-100 dark:bg-[#0b141a] flex flex-col items-center justify-center space-y-6">
        <div className="w-20 h-20 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300">Menyiapkan Ruang Kolaborasi...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Gagal Memuat</h3>
        <p className="text-sm text-zinc-500 mt-2">{error}</p>
        <button onClick={() => navigate(`/dashboard/groups/${groupId}`)} className="mt-6 px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer">Kembali</button>
      </div>
    );
  }

  // Cek apakah dokumen sudah final (normalisasi lowercase dari backend)
  if (documentStatus?.toUpperCase() === 'COMPLETED') {
    return (
      <div className="fixed inset-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle size={48} className="text-emerald-500 mb-4" />
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Dokumen Telah Difinalisasi</h3>
        <p className="text-sm text-zinc-500 mt-2">Semua penandatangan telah selesai.</p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => window.open(pdfUrl, '_blank')} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl">Lihat PDF Final</button>
          <button onClick={() => navigate(`/dashboard/groups/${groupId}`)} className="px-6 py-2 bg-zinc-200 text-zinc-800 font-bold rounded-xl">Kembali ke Grup</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] bg-zinc-100 dark:bg-[#0b141a] flex flex-col overflow-hidden">

      {/* Indikator status simpan otomatis (Canva-style) */}
      <SaveIndicator />

      {/* 1. HEADER (Reuse + Status Koneksi) */}
      <SigningNavbar 
        title={documentTitle}
        theme={theme}
        toggleTheme={toggleTheme}
        onBack={() => navigate(`/dashboard/groups/${groupId}`)}
      />
      
      {/* Banner Koneksi Socket */}
      {!socketStatus.connected && (
        <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold py-1.5 px-4 text-center border-b border-amber-500/20">
          Koneksi terputus. Mencoba menghubungkan kembali...
        </div>
      )}

      {/* 2. PROGRESS BAR (Khusus Group) */}
      <GroupSignerProgress 
        groupData={groupData}
        signatures={signatures}
        totalSigners={totalSigners}
        pendingSigners={pendingSigners}
        documentId={documentId}
        activeUsers={activeUsers}
      />

      {/* 3. CONTENT AREA */}
      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden relative min-w-0">
        
        {/* SIDEBAR (Reuse) */}
        <SigningSidebar 
          onOpenCanvas={() => setIsCanvasOpen(true)}
          currentSignature={currentSignature}
          // Filter hanya TTD milik user untuk ditampilkan di sidebar
          signatures={signatures.filter(s => String(s.userId || s.signerId) === String(currentUser?.id))}
          onRemoveSignature={handleDeleteSignature}
          // Tombol finalisasi berubah fungsi tergantung role
          onFinalize={isAdmin && readyToFinalize ? handleFinalizeDocument : handleSaveMySignature}
          isSubmitting={isSubmitting || isFinalizing}
          finalizeText={isAdmin && readyToFinalize ? "Finalisasi Dokumen" : "Simpan Tanda Tangan"}
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
                    <div className="absolute inset-0 z-10" onClick={handleCanvasClick} />
                    
                    {/* Layer Tanda Tangan (Loop semua user) — touchAction:none wajib untuk drag */}
                    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden" style={{ touchAction: 'none' }}>
                      {signatures.filter(s => s.pageNumber === pageNumber).map(sig => {
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

      {/* 4. FOOTER & MOBILE BAR */}
      <SigningFooter pageNumber={pageNumber} numPages={numPages} setPageNumber={setPageNumber} />

      {!isSheetOpen && (
        <SigningMobileBar 
          pageNumber={pageNumber}
          numPages={numPages}
          setPageNumber={setPageNumber}
          onOpenSheet={() => setIsSheetOpen(true)}
          onOpenCanvas={() => setIsCanvasOpen(true)}
          onFinalize={isAdmin && readyToFinalize ? handleFinalizeDocument : handleSaveMySignature}
          signatureCount={signatures.filter(s => String(s.userId || s.signerId) === String(currentUser?.id)).length}
          isSubmitting={isSubmitting || isFinalizing}
        />
      )}

      {/* 5. MODALS */}
      <SigningModals 
        isCanvasOpen={isCanvasOpen}
        setIsCanvasOpen={setIsCanvasOpen}
        handleSaveCanvas={handleSaveCanvas}
        isSheetOpen={isSheetOpen}
        setIsSheetOpen={setIsSheetOpen}
        currentSignature={currentSignature}
        signatures={signatures.filter(s => String(s.userId || s.signerId) === String(currentUser?.id))}
        removeSignature={handleDeleteSignature}
        handleFinalSign={isAdmin && readyToFinalize ? handleFinalizeDocument : handleSaveMySignature}
        isSubmitting={isSubmitting || isFinalizing}
        statusModal={statusModal}
        setStatusModal={setStatusModal}
      />
    </div>
  );
};

export default GroupSigningPage;
