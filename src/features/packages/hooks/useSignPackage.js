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
        if (fileResponse.success && fileResponse.url) {
          setPdfUrl(fileResponse.url);
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
    const targetWidth = el.clientWidth;
    if (targetWidth > 0) {
      const availableWidth = targetWidth - 64; // Padding
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

    const aspectRatio = pageDimensions.width > 0 ? pageDimensions.height / pageDimensions.width : 1.41;
    const currentHeight = containerWidth * aspectRatio;

    const defWidth = Math.min(0.35, Math.max(0.1, 120 / containerWidth));
    const defHeight = Math.min(0.2, Math.max(0.05, 60 / currentHeight));

    const newSig = {
      id: Date.now(),
      pageNumber,
      positionX: Math.max(0, Math.min(1 - defWidth, clickX - (defWidth / 2))),
      positionY: Math.max(0, Math.min(1 - defHeight, clickY - (defHeight / 2))),
      width: defWidth,
      height: defHeight,
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

  // --- Submission ---

  const handleSubmit = async () => {
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

    setIsSubmitting(true);
    try {
      const signaturesPayload = [];
      allDocIds.forEach(pDocId => {
        signaturesMap[pDocId].forEach(s => {
          signaturesPayload.push({
            packageDocId: pDocId, 
            pageNumber: s.pageNumber,
            positionX: s.positionX,
            positionY: s.positionY,
            width: s.width,
            height: s.height,
            signatureImageUrl: s.signatureImageUrl,
            method: s.method,
            displayQrCode: true
          });
        });
      });

      const res = await signPackage(packageId, signaturesPayload);
      if (res.status === 'success') {
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
