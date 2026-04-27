import { useState, useRef, useCallback, useEffect } from 'react';
import { useGroupData } from './useGroupData';
import { useGroupSocket } from './useGroupSocket';
import { useGroupSignatureActions } from './useGroupSignatureActions';

/**
 * @hook useGroupSigning
 * @description Orchestrator tipis yang menyatukan 3 hook spesifik:
 * - useGroupData          → fetch data grup + dokumen
 * - useGroupSocket        → koneksi socket + listeners real-time
 * - useGroupSignatureActions → CRUD tanda tangan
 *
 * + Mengelola state UI lokal: PDF viewer, canvas, status modal, dll.
 */
export const useGroupSigning = ({ groupId, documentId, currentUser }) => {
  // ── UI State ──────────────────────────────────────────────────────────────
  const [currentSignature, setCurrentSignature] = useState(null);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [statusModal, setStatusModal] = useState({
    isOpen: false, type: 'success', title: '', message: '', onConfirm: null,
  });

  // ── PDF Viewer State ──────────────────────────────────────────────────────
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isRendering, setIsRendering] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // ── Hook: Data Grup ───────────────────────────────────────────────────────
  const groupDataHook = useGroupData({
    groupId,
    documentId,
    currentUserId: currentUser?.id,
  });

  const {
    groupData,
    signatures, setSignatures,
    pendingSigners, setPendingSigners,
    totalSigners,
    pdfUrl,
    documentTitle,
    documentVersionId,
    documentStatus, setDocumentStatus,
    hasMyFinalSig, setHasMyFinalSig,
    readyToFinalize, setReadyToFinalize,
    loading,
    error,
    fetchGroupData,
  } = groupDataHook;

  // ── Computed: Status User ─────────────────────────────────────────────────
  const isAdmin = groupData?.adminId != null && currentUser?.id != null &&
    String(groupData.adminId) === String(currentUser.id);

  // Ambil signerRequests dari dokumen yang sedang ditandatangani (bukan dari root group)
  const currentDoc = groupData?.documents?.find((d) => String(d.id) === String(documentId));
  const docSignerRequests = currentDoc?.signerRequests || [];

  const mySignature = signatures.find(
    (s) => String(s.userId || s.signerId) === String(currentUser?.id)
  );
  const myDraftExists = !!mySignature && mySignature.status !== 'final';

  const isSigner = docSignerRequests.some(
    (sr) => String(sr.userId) === String(currentUser?.id)
  );
  const mySignerRecord = docSignerRequests.find(
    (sr) => String(sr.userId) === String(currentUser?.id)
  );
  // Normalisasi status ke uppercase (backend bisa kirim lowercase)
  const canSign = isSigner &&
    mySignerRecord?.status?.toUpperCase() === 'PENDING' &&
    !hasMyFinalSig;

  // ── Hook: Socket ──────────────────────────────────────────────────────────
  const { activeUsers, socketStatus } = useGroupSocket({
    documentId,
    groupId,
    currentUserId: currentUser?.id,
    ready: !loading,
    setSignatures,
    setPendingSigners,
    setReadyToFinalize,
    setDocumentStatus,
    setStatusModal,
    // onRefreshSigning: dipakai hanya saat finalized (butuh URL PDF baru)
    onRefreshSigning: fetchGroupData,
    // onRefresh: untuk group-level changes (tidak diperlukan di signing page)
    onRefresh: null,
  });

  // ── Hook: Signature Actions ───────────────────────────────────────────────
  const {
    handleAddSignature,
    handleUpdateSignature,
    handleUpdateSize,
    handleDeleteSignature,
    handleSaveMySignature,
    handleFinalizeDocument,
  } = useGroupSignatureActions({
    documentId,
    groupId,
    documentTitle,
    currentUser,
    canSign,
    myDraftExists,
    mySignature,
    isAdmin,
    readyToFinalize,
    currentSignature,
    signatures,
    setSignatures,
    setHasMyFinalSig,
    setReadyToFinalize,
    setDocumentStatus,
    setIsSubmitting,
    setIsFinalizing,
    setStatusModal,
    fetchGroupData,
  });

  // ── Container Width Measurement ───────────────────────────────────────────
  const measureContainer = useCallback(() => {
    if (!containerRef.current) return;
    const style = window.getComputedStyle(containerRef.current);
    const paddingX =
      (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
    const width = Math.max(100, Math.min(containerRef.current.clientWidth - paddingX, 800));
    setContainerWidth(width);
    setIsReady(true);
  }, []);

  useEffect(() => {
    measureContainer();
    window.addEventListener('resize', measureContainer);
    return () => window.removeEventListener('resize', measureContainer);
  }, [measureContainer, loading]);

  // ── PDF Handlers ──────────────────────────────────────────────────────────
  const onDocumentLoadSuccess = ({ numPages: n }) => setNumPages(n);
  const handlePageLoadSuccess = (page) =>
    setPageDimensions({ width: page.originalWidth, height: page.originalHeight });

  // ── Canvas Handler ────────────────────────────────────────────────────────
  const handleSaveCanvas = (dataUrl) => {
    setCurrentSignature(dataUrl);
    setIsCanvasOpen(false);
  };

  // ── Return ────────────────────────────────────────────────────────────────
  return {
    // Data
    groupData, signatures, pendingSigners, totalSigners,
    pdfUrl, documentTitle, documentVersionId, documentStatus,

    // User state
    currentUser, isAdmin, isSigner, canSign,
    hasMyFinalSig, mySignature, readyToFinalize, currentSignature,
    setCurrentSignature,  // diperlukan jika halaman perlu reset signature

    // PDF state
    containerRef, containerWidth, pageDimensions,
    numPages, pageNumber, setPageNumber,
    isRendering, setIsRendering, isReady,

    // Socket state
    activeUsers, socketStatus,

    // UI state
    loading, error,
    isCanvasOpen, setIsCanvasOpen,
    isSubmitting, isFinalizing,
    statusModal, setStatusModal,

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
    refreshData: fetchGroupData,
  };
};
