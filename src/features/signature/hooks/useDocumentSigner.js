import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import { 
  getDocumentDetail, 
  getDocumentFile 
} from '../../documents/api/docService';
import { addPersonalSignature } from '../api/signatureService';
import {
  DEFAULT_SIGNATURE_WIDTH,
  DEFAULT_SIGNATURE_HEIGHT,
} from '../constants/signatureLayout';

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
          // [CR-2] Replace blocking alert + immediate navigate dengan
          // toast info + delayed navigate. UX lebih halus, tidak block
          // event loop, dan tidak race antara alert close + navigate.
          toast.info('Dokumen ini sudah ditandatangani. Mengarahkan ke daftar...', {
            autoClose: 2000,
          });
          setTimeout(() => navigate('/dashboard/documents', { replace: true }), 2000);
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

    // [M-6] Default size dari constants/signatureLayout.js
    // [CR-3] Pakai uuidv4() bukan Date.now() — Date.now() resolusi 1ms,
    // double-click cepat <1ms apart bisa generate ID sama → React key
    // collision + removeSignature(id) filter hapus 2 entry sekaligus.
    setSignatures(prev => [...prev, {
      id: uuidv4(),
      pageNumber,
      positionX: Math.max(0, Math.min(1 - DEFAULT_SIGNATURE_WIDTH, clickX - (DEFAULT_SIGNATURE_WIDTH / 2))),
      positionY: Math.max(0, clickY - 0.05),
      width: DEFAULT_SIGNATURE_WIDTH,
      height: DEFAULT_SIGNATURE_HEIGHT,
      signatureImageUrl: currentSignature,
      method: activeElement?.type || 'canvas',
      metadata: activeElement?.metadata || null,
    }]);
  };

  // Pakai functional update di mana-mana — race-safe (sebelumnya pakai
  // closure `signatures` yang bisa stale kalau handler di-define dengan
  // closure value lama).
  const removeSignature = (id) =>
    setSignatures(prev => prev.filter(s => s.id !== id));
  const updateSignaturePosition = (id, x, y) =>
    setSignatures(prev => prev.map(sig => sig.id === id ? { ...sig, positionX: x, positionY: y } : sig));
  const updateSignatureSize = (id, width, height) =>
    setSignatures(prev => prev.map(sig => sig.id === id ? { ...sig, width, height } : sig));

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

/**
 * @hook useSignatureDraft
 * @description Persist + restore draft signature (state lokal) ke/dari
 * localStorage. Otomatis clear setelah submit final sukses.
 *
 * [H-2] Safety guarantees:
 * 1. **Read path** — JSON.parse di-wrap try/catch. Kalau localStorage
 *    di-tamper atau format berubah antar versi, draft di-skip (tidak
 *    crash). Toast warning ke user opsional supaya tidak surprise.
 * 2. **Write path** — setItem di-wrap try/catch. QuotaExceededError fire
 *    saat localStorage penuh (~5-10MB tergantung browser). Signature
 *    base64 PNG bisa 1-3MB → mudah lewat quota kalau user save banyak
 *    draft di banyak dokumen tanpa pernah submit. Strategy:
 *    - Catch error → toast warning ke user
 *    - HAPUS draft current (bukan crash) supaya UI tetap jalan
 *    - User bisa lanjut tanpa autosave (akan kehilangan draft kalau
 *      reload, tapi itu lebih baik daripada UI freeze)
 * 3. **Cleanup** — `clearDraft` removeItem juga di-wrap (defense in depth,
 *    sebenarnya removeItem tidak throw).
 */
const useSignatureDraft = (documentId, signatures, setSignatures, currentSignature, setCurrentSignature) => {
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!documentId) return;
    const key = `${STORAGE_KEY_PREFIX}${documentId}`;
    let saved;
    try {
      saved = localStorage.getItem(key);
    } catch {
      // localStorage di-disable (mis. private mode Safari di iOS lama)
      return;
    }
    if (!saved) return;

    try {
      const { sigs, current } = JSON.parse(saved);
      if (sigs) setSignatures(sigs);
      if (current) setCurrentSignature(current);
    } catch (err) {
      // Format draft berubah / corrupted → drop & ignore
      console.warn('[useSignatureDraft] failed parse draft, dropping:', err.message);
      try { localStorage.removeItem(key); } catch { /* noop */ }
    }
  }, [documentId, setSignatures, setCurrentSignature]);

  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    if (!documentId) return;
    const key = `${STORAGE_KEY_PREFIX}${documentId}`;
    try {
      const data = JSON.stringify({ sigs: signatures, current: currentSignature });
      localStorage.setItem(key, data);
    } catch (err) {
      // QuotaExceededError atau localStorage disabled.
      // Strategy: hapus draft current supaya UI tetap jalan + user di-warn.
      // Tanpa hapus, error akan fire setiap state change → toast spam.
      const isQuota = err?.name === 'QuotaExceededError' ||
        err?.code === 22 || err?.code === 1014; // Firefox
      if (isQuota) {
        toast.warning(
          'Draft tanda tangan tidak bisa disimpan otomatis (storage penuh). ' +
          'Lanjutkan signing — pastikan submit sebelum tutup tab.'
        );
        try { localStorage.removeItem(key); } catch { /* noop */ }
      } else {
        console.warn('[useSignatureDraft] failed save draft:', err.message);
      }
    }
  }, [documentId, signatures, currentSignature]);

  const clearDraft = useCallback(() => {
    if (!documentId) return;
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${documentId}`);
    } catch {
      /* noop */
    }
  }, [documentId]);

  return { clearDraft };
};
