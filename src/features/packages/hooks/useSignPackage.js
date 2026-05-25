import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import { getPackageDetails, signPackage, invalidatePackageCache } from '../api/packageService';
import { getDocumentFile } from '../../documents/api/docService';
import { createLogger } from '../../../utils/logger';
import {
  SIGNATURE_DEFAULT_WIDTH_RATIO,
  SIGNATURE_DEFAULT_HEIGHT_RATIO,
  PDF_MAX_RENDER_WIDTH_PX,
  PDF_MIN_RENDER_WIDTH_PX,
  REDIRECT_AFTER_TOAST_MS,
} from '../constants/layout';

const logger = createLogger('PackageDraft');

const isNetworkOrTimeoutError = (err) => {
  const message = err?.message || '';
  return (
    (typeof navigator !== 'undefined' && !navigator.onLine) ||
    message.includes('Koneksi internet') ||
    message.includes('Waktu tunggu') ||
    message.includes('Failed to fetch') ||
    message.includes('fetch failed') ||
    message.includes('NetworkError')
  );
};

const isCompletedStatus = (status) =>
  String(status || '').toLowerCase() === 'completed';

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
  const [currentMethod, setCurrentMethod] = useState('canvas');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Guard sinkron untuk klik ganda — lihat catatan di useGroupSignatureActions.
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

  // Audit Trail mode
  const [auditTrailMode, setAuditTrailMode] = useState("embedded");

  // --- Current Active Document Helper ---
  const activeDoc = documents[currentIndex] || null;
  const currentSignatures = activeDoc ? (signaturesMap[activeDoc.id] || []) : [];

  // [H-2] Stale-closure guard: handler-handler di bawah (removeSignature,
  // updateSignaturePosition, updateSignatureSize, handleCanvasClick) dipakai
  // di dalam `setSignaturesMap(prev => ...)` — kalau handler di-pass sebagai
  // prop ke DraggableSignature lalu user pindah dokumen sebelum drag berhenti,
  // closure handler bisa pegang `activeDoc.id` lama → mutasi map untuk
  // dokumen yang salah.
  //
  // Solusi: simpan id dokumen aktif di ref, baca dari ref saat dispatch.
  // Ref selalu sinkron dengan render terakhir, tidak terkena stale closure.
  const activeDocIdRef = useRef(null);
  useEffect(() => {
    activeDocIdRef.current = activeDoc?.id ?? null;
  }, [activeDoc]);

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
          // [CR-2] Sebelumnya: silent navigate tanpa info user. Akibatnya
          // user yang klik "Sign Package" untuk paket completed langsung
          // di-redirect ke list tanpa pesan apapun -> confused.
          // Sekarang: redirect ke preview page (lebih intuitif daripada list)
          // dengan toast info supaya user paham apa yang terjadi.
          toast.info('Paket ini sudah selesai. Mengarahkan ke pratinjau...', {
            autoClose: REDIRECT_AFTER_TOAST_MS,
          });
          setTimeout(() => {
            navigate(`/dashboard/packages/preview/${packageId}`, { replace: true });
          }, REDIRECT_AFTER_TOAST_MS);
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
      setContainerWidth(Math.floor(Math.max(PDF_MIN_RENDER_WIDTH_PX, Math.min(availableWidth, PDF_MAX_RENDER_WIDTH_PX))));
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

  const handleSaveCanvas = (dataUrl, method = 'canvas') => {
    setCurrentSignature(dataUrl);
    setCurrentMethod(method);
    setIsCanvasOpen(false);
  };

  const handleCanvasClick = (e) => {
    if (!currentSignature) {
      setIsCanvasOpen(true);
      return;
    }

    // [H-2] Snapshot id dokumen aktif saat klik (bukan saat updater jalan)
    const docId = activeDocIdRef.current;
    if (!docId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    const newSig = {
      // [CR-3] Pakai uuidv4() bukan Date.now() — Date.now() resolusi 1ms,
      // double-click cepat <1ms apart bisa generate ID sama -> collision
      // di signaturesMap[activeDoc.id]. Multi-document workflow makin
      // riskan kalau collision antar dokumen.
      id: uuidv4(),
      pageNumber,
      positionX: Math.max(0, Math.min(1 - SIGNATURE_DEFAULT_WIDTH_RATIO, clickX - (SIGNATURE_DEFAULT_WIDTH_RATIO / 2))),
      positionY: Math.max(0, clickY - 0.05),
      width: SIGNATURE_DEFAULT_WIDTH_RATIO,
      height: SIGNATURE_DEFAULT_HEIGHT_RATIO, // Placeholder, di-update otomatis oleh handleImageLoad di DraggableSignature
      signatureImageUrl: currentSignature,
      method: currentMethod || 'canvas'
    };

    setSignaturesMap(prev => ({
      ...prev,
      [docId]: [...(prev[docId] || []), newSig]
    }));
  };

  const removeSignature = (id) => {
    // [H-2] Snapshot docId saat aksi dipicu
    const docId = activeDocIdRef.current;
    if (!docId) return;
    setSignaturesMap(prev => ({
      ...prev,
      [docId]: (prev[docId] || []).filter(s => s.id !== id)
    }));
  };

  const updateSignaturePosition = (id, x, y) => {
    const docId = activeDocIdRef.current;
    if (!docId) return;
    setSignaturesMap(prev => ({
      ...prev,
      [docId]: (prev[docId] || []).map(sig => sig.id === id ? { ...sig, positionX: x, positionY: y } : sig)
    }));
  };

  const updateSignatureSize = (id, width, height) => {
    const docId = activeDocIdRef.current;
    if (!docId) return;
    setSignaturesMap(prev => ({
      ...prev,
      [docId]: (prev[docId] || []).map(sig => sig.id === id ? { ...sig, width, height } : sig)
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
            category: ['signature', 'canvas', 'initial', 'date'].includes(s.method) ? 'signing' : 'annotation',
            metadata: s.metadata || null,
            displayQrCode: true
          });
        });
      });

      const res = await signPackage(packageId, signaturesPayload, auditTrailMode);
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
      if (isNetworkOrTimeoutError(err)) {
        try {
          logger.warn('sign package network error, verifying package status:', err.message);
          invalidatePackageCache(packageId);
          const verifyResponse = await getPackageDetails(packageId);
          const latestPackage = verifyResponse?.data;

          if (isCompletedStatus(latestPackage?.status)) {
            clearDraft();
            setStatusModal({
              isOpen: true,
              type: 'success',
              title: 'Penandatanganan Berhasil',
              message: 'Koneksi sempat terputus, tetapi server sudah menyelesaikan penandatanganan paket.',
              onConfirm: () => navigate('/dashboard/packages'),
            });
            return;
          }

          setStatusModal({
            isOpen: true,
            type: 'warning',
            title: 'Status Belum Terkonfirmasi',
            message: 'Koneksi terputus saat mengonfirmasi hasil tanda tangan paket. Status paket belum selesai saat dicek ulang. Silakan coba lagi setelah koneksi stabil.',
          });
          return;
        } catch (verifyErr) {
          logger.warn('failed verify package signing status after network error:', verifyErr.message);
          setStatusModal({
            isOpen: true,
            type: 'warning',
            title: 'Status Belum Terkonfirmasi',
            message: 'Koneksi terputus dan status paket belum bisa diverifikasi. Muat ulang halaman setelah koneksi stabil sebelum mencoba lagi.',
          });
          return;
        }
      }

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
      auditTrailMode,
      setAuditTrailMode,
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
 *
 * [H-1] Draft paket berpotensi LEBIH BESAR dari personal signing karena:
 *  - Multi-document workflow → signaturesMap = { docId: [sig1, sig2,...] }
 *  - Tiap signature menyimpan `signatureImageUrl` base64 (bisa ratusan KB)
 *  - User bisa drop banyak signature di banyak dokumen sekaligus
 *
 * Quota localStorage browser umumnya 5-10 MB per origin. Tanpa try/catch,
 * `setItem` akan throw `QuotaExceededError` saat melebihi → save effect
 * crash silent dan user kehilangan progress saat refresh.
 *
 * Strategi:
 * 1. Wrap `setItem` dengan try/catch
 * 2. Saat quota exceeded → toast warning + drop draft (jangan biarkan
 *    state inconsistent antara memory dan storage)
 * 3. Wrap restore + remove juga (akses localStorage bisa dilarang
 *    oleh privacy mode di beberapa browser)
 */
const PKG_STORAGE_KEY_PREFIX = 'wesign_draft_pkg_';

const usePackageSignatureDraft = (packageId, signaturesMap, setSignaturesMap, currentSignature, setCurrentSignature) => {
  const isInitialMount = useRef(true);
  const quotaWarnedRef = useRef(false);

  // 1. Restore on Mount
  useEffect(() => {
    if (!packageId) return;
    let saved;
    try {
      saved = localStorage.getItem(`${PKG_STORAGE_KEY_PREFIX}${packageId}`);
    } catch (e) {
      logger.error('Gagal akses localStorage saat restore:', e);
      return;
    }
    if (saved) {
      try {
        const { map, current } = JSON.parse(saved);
        if (map && Object.keys(map).length > 0) setSignaturesMap(map);
        if (current) setCurrentSignature(current);
        logger.info('Berhasil memulihkan draft paket.');
      } catch (e) {
        logger.error('Gagal parse draft (data corrupt):', e);
      }
    }
  }, [packageId, setSignaturesMap, setCurrentSignature]);

  // 2. Save on Change (dengan quota handling)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!packageId) return;

    const hasSigs = Object.values(signaturesMap).some(sigs => sigs.length > 0);
    if (hasSigs || currentSignature) {
      try {
        const data = JSON.stringify({ map: signaturesMap, current: currentSignature });
        localStorage.setItem(`${PKG_STORAGE_KEY_PREFIX}${packageId}`, data);
      } catch (e) {
        // QuotaExceededError atau access denied (privacy mode)
        const isQuota = e?.name === 'QuotaExceededError' ||
          // Firefox throws different name
          e?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          // Safari fallback
          e?.code === 22;

        if (isQuota && !quotaWarnedRef.current) {
          quotaWarnedRef.current = true;
          toast.warning(
            'Penyimpanan browser penuh — draft paket tidak bisa di-backup. ' +
            'Selesaikan penandatanganan tanpa refresh halaman.',
            { autoClose: 6000 }
          );
          logger.warn('Quota localStorage exceeded, draft tidak tersimpan.');
        } else if (!isQuota) {
          logger.error('Gagal simpan draft paket:', e);
        }
      }
    } else {
      try {
        localStorage.removeItem(`${PKG_STORAGE_KEY_PREFIX}${packageId}`);
      } catch (e) {
        logger.error('Gagal hapus draft kosong:', e);
      }
    }
  }, [packageId, signaturesMap, currentSignature]);

  // 3. Clear Utility
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(`${PKG_STORAGE_KEY_PREFIX}${packageId}`);
    } catch (e) {
      logger.error('Gagal hapus draft pasca-submit:', e);
    }
  }, [packageId]);

  return { clearDraft };
};
