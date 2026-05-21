import { useState, useCallback, useEffect, useRef } from 'react';
import { getPackageDetails } from '../api/packageService';
import { getDocumentFile } from '../../documents/api/docService';
import { apiFetch } from '../../../services/api';
import { PDF_MAX_RENDER_WIDTH_PX, PDF_MIN_RENDER_WIDTH_PX } from '../constants/layout';

/**
 * @hook usePackagePreview
 * @description Hook khusus untuk pratinjau playlist dokumen dalam paket (Read-only).
 * Mendukung toggle antara preview dokumen dan preview audit trail.
 */
export const usePackagePreview = (packageId) => {
  const containerRef = useRef(null);

  // --- State Data ---
  const [packageData, setPackageData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- State PDF (Per Dokumen Aktif) ---
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfLoading, setPdfLoading] = useState(true);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [isAuditTrailMode, setIsAuditTrailMode] = useState(false);

  // --- Current Active Document Helper ---
  const activeDoc = documents[currentIndex] || null;

  // --- Fetch Package Details ---
  const fetchPackage = useCallback(async () => {
    if (!packageId) return;
    setLoading(true);
    try {
      const res = await getPackageDetails(packageId);
      if (res.status === 'success') {
        const pkg = res.data;
        setPackageData(pkg);
        setDocuments(pkg.documents || []);
      } else {
        throw new Error('Gagal memuat detail paket.');
      }
    } catch (err) {
      setError(err.message || 'Error saat memuat paket.');
    } finally {
      setLoading(false);
    }
  }, [packageId]);

  useEffect(() => {
    fetchPackage();
  }, [fetchPackage]);

  // --- Fetch PDF URL for active document (or audit trail) ---
  useEffect(() => {
    const fetchActivePdf = async () => {
      if (!activeDoc || !activeDoc.docVersion?.document?.id) return;
      
      const documentId = activeDoc.docVersion.document.id;
      setPdfLoading(true);
      setPageNumber(1);
      setLoadError(null);
      
      try {
        if (isAuditTrailMode && activeDoc.docVersion?.auditTrailUrl) {
          // Mode audit trail: minta signed URL dari endpoint
          const res = await apiFetch(`/documents/${documentId}/audit-trail`);
          if (res?.status === 'success' && res.data?.url) {
            setPdfUrl(res.data.url);
          } else {
            throw new Error('Audit trail tidak tersedia.');
          }
        } else {
          // Mode normal: load dokumen
          const fileResponse = await getDocumentFile(documentId, 'view');
          if (fileResponse.status === 'success' && fileResponse.data?.url) {
            setPdfUrl(fileResponse.data.url);
          } else {
            throw new Error('Gagal mendapatkan akses file dokumen.');
          }
        }
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setPdfLoading(false);
      }
    };

    fetchActivePdf();
  }, [activeDoc, isAuditTrailMode]);

  // --- Dimension Calculation ---
  const measureContainer = useCallback(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const targetWidth = el.clientWidth;
    if (targetWidth > 0) {
      const paddingAreaHorizontal = 64;
      const availableWidth = targetWidth - paddingAreaHorizontal;
      let optimalWidth = Math.min(availableWidth, PDF_MAX_RENDER_WIDTH_PX);
      setContainerWidth(Math.floor(Math.max(PDF_MIN_RENDER_WIDTH_PX, optimalWidth)));
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    measureContainer();
    const resizeObserver = new ResizeObserver(() => {
      measureContainer();
    });
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    window.addEventListener('resize', measureContainer);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measureContainer);
    };
  }, [measureContainer, loading]); // REMOVED currentIndex

  // --- Navigation ---
  const nextDocument = () => {
    if (currentIndex < documents.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevDocument = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return {
    packageData,
    documents,
    currentIndex,
    activeDoc,
    loading,
    error,
    
    // PDF State
    pdfUrl,
    pdfLoading,
    numPages,
    pageNumber,
    setPageNumber,
    setNumPages,
    loadError,
    setLoadError,
    containerRef,
    containerWidth,
    isReady,
    isAuditTrailMode,

    // Actions
    nextDocument,
    prevDocument,
    goToDocument: (index) => setCurrentIndex(index),
    toggleAuditTrail: () => setIsAuditTrailMode(prev => !prev),
  };
};
