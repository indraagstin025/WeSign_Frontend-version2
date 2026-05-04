import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPackageDetails, signPackage } from '../api/packageService';
import { getDocumentFile } from '../../documents/api/docService';

/**
 * @hook useSignPackage
 * @description State manager for the batch signing process (multi-document).
 *              Centralizes PDF handling, signature placement, and UI state.
 */
export const useSignPackage = (packageId) => {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // --- STATE: Data Paket ---
  const [packageData, setPackageData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- STATE: PDF (Per Dokumen Aktif) ---
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfLoading, setPdfLoading] = useState(true);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [isRendering, setIsRendering] = useState(false);

  // --- STATE: Signing (Batch) ---
  // Format: { [documentId]: [signature1, signature2, ...] }
  const [signaturesMap, setSignaturesMap] = useState({});
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [currentSignature, setCurrentSignature] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Guard sinkron untuk mencegah klik ganda saat submit batch
  const submitInFlightRef = useRef(false);

  // --- STATE: UI (Page Level) ---
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [statusModal, setStatusModal] = useState({ 
    isOpen: false, 
    type: 'success', 
    title: '', 
    message: '',
    onConfirm: null 
  });

  // --- Current Active Document Helper ---
  const activeDoc = documents[currentIndex] || null;
  const currentSignatures = activeDoc ? (signaturesMap[activeDoc.id] || []) : [];

  /**
   * Fetch package details
   */
  const fetchPackage = useCallback(async () => {
    if (!packageId) return;
    setLoading(true);
    try {
      const res = await getPackageDetails(packageId);
      if (res.status === 'success') {
        const pkg = res.data;
        if (pkg.status?.toLowerCase() === 'completed') {
          navigate('/dashboard/packages', { replace: true });
          return;
        }
        setPackageData(pkg);
        setDocuments(pkg.documents || []);
      }
    } catch (err) {
      setError(err.message || 'Error saat memuat paket.');
    } finally {
      setLoading(false);
    }
  }, [packageId, navigate]);

  useEffect(() => {
    fetchPackage();
  }, [fetchPackage]);

  /**
   * Fetch PDF URL for active document
   */
  useEffect(() => {
    const fetchActivePdf = async () => {
      if (!activeDoc || !activeDoc.docVersion?.document?.id) return;
      
      const documentId = activeDoc.docVersion.document.id;
      setPdfLoading(true);
      setPageNumber(1);
      setLoadError(null);
      
      try {
        const fileResponse = await getDocumentFile(documentId, 'view');
        if (fileResponse.status === 'success' && fileResponse.data?.url) {
          setPdfUrl(fileResponse.data.url);
        } else {
          throw new Error('Gagal mendapatkan akses file dokumen.');
        }
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setPdfLoading(false);
      }
    };

    fetchActivePdf();
  }, [activeDoc]);

  /**
   * Dimension Calculation
   */
  const measureContainer = useCallback(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const style = window.getComputedStyle(el);
    const paddingX = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
    const targetWidth = el.clientWidth;
    if (targetWidth > 0) {
      const availableWidth = targetWidth - paddingX;
      setContainerWidth(Math.floor(Math.max(100, Math.min(availableWidth, 800))));
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    measureContainer();
    const resizeObserver = new ResizeObserver(measureContainer);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    window.addEventListener('resize', measureContainer);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measureContainer);
    };
  }, [measureContainer, loading]);

  // --- Event Handlers ---

  const handleSaveCanvas = (dataUrl) => {
    setCurrentSignature(dataUrl);
    setIsCanvasOpen(false);
  };

  const handleCanvasClick = (e) => {
    if (!currentSignature) {
      setIsCanvasOpen(true);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    // Default 25% lebar container — sama dengan personal signing
    const defaultWidth = 0.25;

    const newSig = {
      id: Date.now(),
      pageNumber,
      positionX: Math.max(0, Math.min(1 - defaultWidth, clickX - (defaultWidth / 2))),
      positionY: Math.max(0, clickY - 0.05),
      width: defaultWidth,
      height: 0.1, // Placeholder, di-update otomatis oleh handleImageLoad di DraggableSignature
      signatureImageUrl: currentSignature,
      method: 'canvas'
    };

    setSignaturesMap(prev => ({
      ...prev,
      [activeDoc.id]: [...(prev[activeDoc.id] || []), newSig]
    }));
  };

  const removeSignature = (id) => {
    setSignaturesMap(prev => ({
      ...prev,
      [activeDoc.id]: prev[activeDoc.id].filter(s => s.id !== id)
    }));
  };

  const updateSignaturePosition = (id, x, y) => {
    setSignaturesMap(prev => ({
      ...prev,
      [activeDoc.id]: prev[activeDoc.id].map(sig => sig.id === id ? { ...sig, positionX: x, positionY: y } : sig)
    }));
  };

  const updateSignatureSize = (id, width, height) => {
    setSignaturesMap(prev => ({
      ...prev,
      [activeDoc.id]: prev[activeDoc.id].map(sig => sig.id === id ? { ...sig, width, height } : sig)
    }));
  };

    // --- Auto-Save Persistence (Draft) ---
    const { clearDraft } = usePackageSignatureDraft(
      packageId,
      signaturesMap,
      setSignaturesMap,
      currentSignature,
      setCurrentSignature
    );

    // --- Submission ---

    const handleSubmit = async () => {
    if (submitInFlightRef.current) return;
    const allDocIds = Object.keys(signaturesMap);
    if (allDocIds.length === 0) {
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Batal Kirim',
        message: 'Anda belum memberikan tanda tangan di dokumen manapun.'
      });
      return;
    }

    submitInFlightRef.current = true;
    setIsSubmitting(true);
    try {
      const signaturesPayload = [];
      allDocIds.forEach(pDocId => {
        signaturesMap[pDocId].forEach(s => {
          signaturesPayload.push({
            packageDocId: pDocId, 
            pageNumber: Number(s.pageNumber),
            positionX: parseFloat(s.positionX),
            positionY: parseFloat(s.positionY),
            width: parseFloat(s.width),
            height: parseFloat(s.height),
            signatureImageUrl: s.signatureImageUrl,
            method: s.method || 'canvas',
            displayQrCode: true
          });
        });
      });

      const res = await signPackage(packageId, signaturesPayload);
      if (res.status === 'success') {
        // Clear draft on success
        clearDraft();

        setStatusModal({
          isOpen: true,
          type: 'success',
          title: 'Penandatanganan Berhasil',
          message: 'Semua dokumen telah berhasil ditandatangani.',
          onConfirm: () => navigate('/dashboard/packages')
        });
      }
    } catch (err) {
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Proses Gagal',
        message: err.message || 'Terjadi kesalahan saat memproses tanda tangan.'
      });
    } finally {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  return {
    packageData,
    documents,
    currentIndex,
    activeDoc,
    loading,
    error,
    pdfStates: {
      url: pdfUrl,
      loading: pdfLoading,
      numPages,
      pageNumber,
      setPageNumber,
      setNumPages,
      loadError,
      setLoadError,
      isRendering,
      setIsRendering,
      containerRef,
      containerWidth,
      isReady,
      pageDimensions,
      setPageDimensions,
    },
    signingStates: {
      signatures: currentSignatures,
      signaturesMap,
      currentSignature,
      setCurrentSignature,
      isCanvasOpen,
      setIsCanvasOpen,
      isSubmitting,
      isSheetOpen,
      setIsSheetOpen,
      statusModal,
      setStatusModal,
    },
    actions: {
      handleSaveCanvas,
      handleCanvasClick,
      removeSignature,
      updateSignaturePosition,
      updateSignatureSize,
      nextDocument: () => {
         if (currentIndex < documents.length - 1) setCurrentIndex(prev => prev + 1);
         else handleSubmit();
      },
      prevDocument: () => {
         if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
      },
      goToDocument: (index) => {
        setCurrentIndex(index);
        setIsSheetOpen(false);
      },
      handleSubmit,
      handleCloseStatusModal: () => setStatusModal(prev => ({ ...prev, isOpen: false }))
    }
  };
};

/**
 * LOGIKA PERSISTENSI DRAFT BATCH (Anti-Refresh)
 */
const PKG_STORAGE_KEY_PREFIX = 'wesign_draft_pkg_';

const usePackageSignatureDraft = (packageId, signaturesMap, setSignaturesMap, currentSignature, setCurrentSignature) => {
  const isInitialMount = useRef(true);

  // 1. Restore on Mount
  useEffect(() => {
    if (!packageId) return;
    const saved = localStorage.getItem(`${PKG_STORAGE_KEY_PREFIX}${packageId}`);
    if (saved) {
      try {
        const { map, current } = JSON.parse(saved);
        if (map && Object.keys(map).length > 0) setSignaturesMap(map);
        if (current) setCurrentSignature(current);
        console.log('[Draft Pkg] Berhasil memulihkan draft paket.');
      } catch (e) {
        console.error('[Draft Pkg] Gagal memulihkan draft:', e);
      }
    }
  }, [packageId, setSignaturesMap, setCurrentSignature]);

  // 2. Save on Change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!packageId) return;

    const hasSigs = Object.values(signaturesMap).some(sigs => sigs.length > 0);
    if (hasSigs || currentSignature) {
      const data = JSON.stringify({ map: signaturesMap, current: currentSignature });
      localStorage.setItem(`${PKG_STORAGE_KEY_PREFIX}${packageId}`, data);
    } else {
      localStorage.removeItem(`${PKG_STORAGE_KEY_PREFIX}${packageId}`);
    }
  }, [packageId, signaturesMap, currentSignature]);

  // 3. Clear Utility
  const clearDraft = useCallback(() => {
    localStorage.removeItem(`${PKG_STORAGE_KEY_PREFIX}${packageId}`);
  }, [packageId]);

  return { clearDraft };
};
