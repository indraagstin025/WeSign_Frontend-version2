import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getDocumentDetail, 
  getDocumentFile 
} from '../../documents/api/docService';
import { addPersonalSignature } from '../api/signatureService';

/**
 * @hook useDocumentSigner
 * @description State manager untuk proses penandatanganan dokumen.
 * Menangani fetch data, penempatan tanda tangan, kalkulasi dimensi PDF, dan UI Feedback.
 */
export const useDocumentSigner = (documentId) => {
  const navigate = useNavigate();
  
  // --- Refs ---
  const containerRef = useRef(null);

  // --- State Data ---
  const [document, setDocument] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadError, setLoadError] = useState(null);
  
  // --- State PDF UI ---
  const [isRendering, setIsRendering] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);

  // --- State Signing ---
  const [signatures, setSignatures] = useState([]); 
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [currentSignature, setCurrentSignature] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- State Feedback (Modals) ---
  const [statusModal, setStatusModal] = useState({ 
    isOpen: false, 
    type: 'success', 
    title: '', 
    message: '',
    onConfirm: null 
  });

  // --- Fetch Data ---
  const fetchDocument = useCallback(async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      const docResponse = await getDocumentDetail(documentId);
      if (docResponse.status === 'success') {
        const docData = docResponse.data;

        if (docData.status?.toLowerCase() === 'completed') {
          alert('Dokumen ini sudah ditandatangani dan tidak dapat ditandatangani ulang.');
          navigate('/dashboard/documents', { replace: true });
          return;
        }

        setDocument(docData);
        const fileResponse = await getDocumentFile(documentId, 'view');
        if (fileResponse.success && fileResponse.url) {
          setPdfUrl(fileResponse.url);
        } else {
          throw new Error('Gagal mendapatkan akses file.');
        }
      } else {
        throw new Error('Gagal memuat dokumen.');
      }
    } catch (err) {
      setError(err.message || 'Error saat memuat dokumen.');
    } finally {
      setLoading(false);
    }
  }, [documentId, navigate]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  // --- Dimension Calculation Logic ---
  const measureContainer = useCallback(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const targetWidth = el.clientWidth;
    const availableWidth = targetWidth - 64; // Padding
    const finalWidth = Math.floor(Math.max(100, Math.min(availableWidth, 800)));
    setContainerWidth(finalWidth); 
    setIsReady(true);
  }, []);

  useEffect(() => {
    measureContainer();
    const resizeObserver = new ResizeObserver(() => measureContainer());
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    window.addEventListener('resize', measureContainer);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measureContainer);
    };
  }, [measureContainer, loading]);

  // --- PDF Handlers ---
  const onDocumentLoadSuccess = ({ numPages }) => {
    setLoadError(null);
    setNumPages(numPages);
  };
  const onDocumentLoadError = (err) => setLoadError(err.message || 'Error memuat PDF');
  const handlePageLoadSuccess = (page) => setPageDimensions({ width: page.originalWidth, height: page.originalHeight });

  // --- Signing Handlers ---
  const handleSaveCanvas = (dataUrl) => {
    setCurrentSignature(dataUrl);
    setIsCanvasOpen(false);
  };

  const handleCanvasClick = (e) => {
    if (!currentSignature) { setIsCanvasOpen(true); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    const TARGET_WIDTH_PX = 120;
    const ASPECT_RATIO = 2; // 2:1
    const aspectRatio = pageDimensions.width > 0 ? pageDimensions.height / pageDimensions.width : 1.41;
    const currentContainerHeight = containerWidth * aspectRatio;

    const defaultWidth = Math.min(0.35, Math.max(0.1, TARGET_WIDTH_PX / containerWidth));
    const defaultHeight = Math.min(0.2, Math.max(0.05, (TARGET_WIDTH_PX / ASPECT_RATIO) / currentContainerHeight));

    setSignatures([...signatures, {
      id: Date.now(),
      pageNumber,
      positionX: Math.max(0, Math.min(1 - defaultWidth, clickX - (defaultWidth / 2))),
      positionY: Math.max(0, Math.min(1 - defaultHeight, clickY - (defaultHeight / 2))),
      width: defaultWidth,
      height: defaultHeight,
      signatureImageUrl: currentSignature,
      method: 'canvas'
    }]);
  };

  const removeSignature = (id) => setSignatures(signatures.filter(s => s.id !== id));
  const updateSignaturePosition = (id, x, y) => setSignatures(signatures.map(sig => sig.id === id ? { ...sig, positionX: x, positionY: y } : sig));
  const updateSignatureSize = (id, width, height) => setSignatures(signatures.map(sig => sig.id === id ? { ...sig, width, height } : sig));

  // --- Submission with Feedback ---
  const handleFinalSign = async () => {
    if (signatures.length === 0) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Belum Ada Tanda Tangan', message: 'Silakan tempatkan tanda tangan Anda pada dokumen terlebih dahulu.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const signaturesToSubmit = signatures.map(sig => ({
        documentVersionId: document.currentVersionId,
        pageNumber: sig.pageNumber,
        positionX: sig.positionX,
        positionY: sig.positionY,
        width: sig.width || 0.15,
        height: sig.height || 0.08,
        signatureImageUrl: sig.signatureImageUrl,
        method: sig.method || 'canvas',
        displayQrCode: true
      }));

      const res = await addPersonalSignature({ signatures: signaturesToSubmit });
      if (res.status === 'success' || res.data) {
        setStatusModal({
          isOpen: true,
          type: 'success',
          title: 'Berhasil!',
          message: 'Dokumen Anda telah berhasil ditandatangani.',
          onConfirm: () => navigate('/dashboard/documents')
        });
      } else {
        throw new Error(res.message || 'Respons backend tidak valid.');
      }
    } catch (err) {
      console.error('Signing Error:', err);
      setStatusModal({ isOpen: true, type: 'error', title: 'Gagal Menyimpan', message: err.message || 'Terjadi kesalahan saat menyimpan tanda tangan.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    document, pdfUrl, loading, error, loadError,
    isRendering, setIsRendering,
    isSubmitting, containerRef, containerWidth, isReady,
    numPages, pageNumber, setPageNumber, pageDimensions,
    signatures, currentSignature, setCurrentSignature, removeSignature,
    updateSignaturePosition, updateSignatureSize,
    isCanvasOpen, setIsCanvasOpen, handleSaveCanvas,
    isSheetOpen, setIsSheetOpen,
    onDocumentLoadSuccess, onDocumentLoadError, handlePageLoadSuccess,
    handleCanvasClick, handleFinalSign,
    statusModal, setStatusModal
  };
};
