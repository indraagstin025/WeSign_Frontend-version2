import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getDocumentDetail, 
  getDocumentFile 
} from '../../documents/api/docService';
import { addPersonalSignature } from '../api/signatureService';

export const useDocumentSigner = (documentId) => {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [document, setDocument] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadError, setLoadError] = useState(null);
  
  const [isRendering, setIsRendering] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);

  const [signatures, setSignatures] = useState([]); 
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [currentSignature, setCurrentSignature] = useState(null);
  // activeElement menyimpan info tool yang sedang aktif: { type, imageUrl }
  // type: 'signature' | 'initial' | 'stamp' | 'text'
  const [activeElement, setActiveElement] = useState(null);
  // Simpan asset terakhir per tipe agar bisa di-switch tanpa buat ulang
  const [savedAssets, setSavedAssets] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Guard sinkron untuk klik ganda — lihat catatan di useGroupSignatureActions.
  const submitInFlightRef = useRef(false);

  const [statusModal, setStatusModal] = useState({ 
    isOpen: false, type: 'success', title: '', message: '', onConfirm: null 
  });

  // Audit Trail mode: "embedded" | "separate" | "none"
  const [auditTrailMode, setAuditTrailMode] = useState("embedded");

  const fetchDocument = useCallback(async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      const docResponse = await getDocumentDetail(documentId);
      if (docResponse.status === 'success') {
        const docData = docResponse.data;
        if (docData.status?.toLowerCase() === 'completed') {
          alert('Dokumen ini sudah ditandatangani.');
          navigate('/dashboard/documents', { replace: true });
          return;
        }
        setDocument(docData);
        const fileResponse = await getDocumentFile(documentId, 'view');
        if (fileResponse.status === 'success' && fileResponse.data?.url) {
          setPdfUrl(fileResponse.data.url);
        }
      }
    } catch (err) {
      setError(err.message || 'Error saat memuat dokumen.');
    } finally {
      setLoading(false);
    }
  }, [documentId, navigate]);

  useEffect(() => { fetchDocument(); }, [fetchDocument]);

  const measureContainer = useCallback(() => {
    if (!containerRef.current) return;
    const style = window.getComputedStyle(containerRef.current);
    const paddingX = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
    const finalWidth = Math.max(100, Math.min(containerRef.current.clientWidth - paddingX, 800));
    setContainerWidth(finalWidth); 
    setIsReady(true);
  }, []);

  useEffect(() => {
    measureContainer();
    window.addEventListener('resize', measureContainer);
    return () => window.removeEventListener('resize', measureContainer);
  }, [measureContainer, loading]);

  const onDocumentLoadSuccess = ({ numPages }) => { setNumPages(numPages); setLoadError(null); };
  const onDocumentLoadError = (err) => setLoadError(err.message || 'Error memuat PDF');
  const handlePageLoadSuccess = (page) => setPageDimensions({ width: page.originalWidth, height: page.originalHeight });

  const handleSaveCanvas = (dataUrl) => { 
    setCurrentSignature(dataUrl); 
    setActiveElement({ type: 'signature', imageUrl: dataUrl });
    setSavedAssets(prev => ({ ...prev, signature: dataUrl }));
    setIsCanvasOpen(false); 
  };

  /**
   * Menyimpan elemen dari tool (paraf/stamp/text/date) sebagai elemen aktif.
   * @param {string} dataUrl - base64 image
   * @param {string} type - 'initial' | 'stamp' | 'text' | 'date'
   * @param {object} metadata - metadata tambahan (optional)
   */
  const handleSaveToolElement = (dataUrl, type, metadata = null) => {
    setCurrentSignature(dataUrl);
    setActiveElement({ type, imageUrl: dataUrl, metadata });
    setSavedAssets(prev => ({ ...prev, [type]: dataUrl }));
  };

  /**
   * Switch ke tool tertentu tanpa buka modal (jika asset sudah pernah dibuat).
   * @param {string} type - 'signature' | 'initial' | 'stamp' | 'text'
   * @returns {boolean} true jika berhasil switch, false jika perlu buka modal
   */
  const switchToTool = (type) => {
    const saved = savedAssets[type];
    if (saved) {
      setCurrentSignature(saved);
      setActiveElement({ type, imageUrl: saved });
      return true;
    }
    return false;
  };

  const handleCanvasClick = (e) => {
    if (!currentSignature) { setIsCanvasOpen(true); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    // Default 25% lebar container
    const defaultWidth = 0.25; 
    setSignatures([...signatures, {
      id: Date.now(),
      pageNumber,
      positionX: Math.max(0, Math.min(1 - defaultWidth, clickX - (defaultWidth / 2))),
      positionY: Math.max(0, clickY - 0.05),
      width: defaultWidth,
      height: 0.1,
      signatureImageUrl: currentSignature,
      method: activeElement?.type || 'canvas',
      metadata: activeElement?.metadata || null,
    }]);
  };

  const removeSignature = (id) => setSignatures(signatures.filter(s => s.id !== id));
  const updateSignaturePosition = (id, x, y) => setSignatures(signatures.map(sig => sig.id === id ? { ...sig, positionX: x, positionY: y } : sig));
  const updateSignatureSize = (id, width, height) => setSignatures(signatures.map(sig => sig.id === id ? { ...sig, width, height } : sig));

  // --- SUBMIT KOORDINAT KE BACKEND ---
  // State signatures[] sudah menyimpan koordinat INNER IMAGE (area gambar saja)
  // sebagai fraksi (0-1) dari dimensi halaman PDF.
  // Tidak perlu lagi mengurangi padding — koordinat sudah bersih.

  const handleFinalSign = async () => {
    if (submitInFlightRef.current) return;
    if (signatures.length === 0) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Belum Ada Tanda Tangan', message: 'Silakan tempatkan tanda tangan Anda.' });
      return;
    }

    submitInFlightRef.current = true;
    setIsSubmitting(true);
    try {
      const signaturesToSubmit = signatures.map(sig => ({
        documentVersionId: document.currentVersionId,
        pageNumber: Number(sig.pageNumber),
        positionX: sig.positionX,
        positionY: sig.positionY,
        width: sig.width,
        height: sig.height,
        signatureImageUrl: sig.signatureImageUrl,
        method: sig.method || 'canvas',
        category: ['signature', 'initial', 'date'].includes(sig.method) ? 'signing' : 'annotation',
        metadata: sig.metadata || null,
        displayQrCode: true
      }));

      const res = await addPersonalSignature({ signatures: signaturesToSubmit, auditTrailMode });
      if (res.status === 'success') {
        clearDraft();
        setStatusModal({
          isOpen: true, type: 'success', title: 'Berhasil!', message: 'Dokumen telah ditandatangani.',
          onConfirm: () => navigate('/dashboard/documents')
        });
      }
    } catch (err) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Gagal', message: err.message });
    } finally {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  const { clearDraft } = useSignatureDraft(documentId, signatures, setSignatures, currentSignature, setCurrentSignature);

  return {
    document, pdfUrl, loading, error, loadError, isRendering, setIsRendering, isSubmitting, containerRef, containerWidth, isReady,
    numPages, pageNumber, setPageNumber, pageDimensions, signatures, currentSignature, setCurrentSignature, activeElement, removeSignature,
    updateSignaturePosition, updateSignatureSize, isCanvasOpen, setIsCanvasOpen, handleSaveCanvas, handleSaveToolElement, switchToTool, isSheetOpen, setIsSheetOpen,
    onDocumentLoadSuccess, onDocumentLoadError, handlePageLoadSuccess, handleCanvasClick, handleFinalSign, statusModal, setStatusModal,
    auditTrailMode, setAuditTrailMode
  };
};

const STORAGE_KEY_PREFIX = 'wesign_draft_sig_';
const useSignatureDraft = (documentId, signatures, setSignatures, currentSignature, setCurrentSignature) => {
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (!documentId) return;
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${documentId}`);
    if (saved) {
      const { sigs, current } = JSON.parse(saved);
      if (sigs) setSignatures(sigs);
      if (current) setCurrentSignature(current);
    }
  }, [documentId, setSignatures, setCurrentSignature]);

  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    if (documentId) {
      const data = JSON.stringify({ sigs: signatures, current: currentSignature });
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${documentId}`, data);
    }
  }, [documentId, signatures, currentSignature]);

  const clearDraft = useCallback(() => localStorage.removeItem(`${STORAGE_KEY_PREFIX}${documentId}`), [documentId]);
  return { clearDraft };
};
