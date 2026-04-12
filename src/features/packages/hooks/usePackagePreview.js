import { useState, useCallback, useEffect, useRef } from 'react';
import { getPackageDetails } from '../api/packageService';
import { getDocumentFile } from '../../documents/api/docService';

/**
 * @hook usePackagePreview
 * @description Hook khusus untuk pratinjau playlist dokumen dalam paket (Read-only).
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

  // --- Fetch PDF URL for active document ---
  useEffect(() => {
    const fetchActivePdf = async () => {
      if (!activeDoc || !activeDoc.docVersion?.document?.id) return;
      
      const documentId = activeDoc.docVersion.document.id;
      setPdfLoading(true);
      // setPdfUrl(''); // REMOVED: Do not clear URL to prevent unmounting & glitch
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

  // --- Dimension Calculation ---
  const measureContainer = useCallback(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const targetWidth = el.clientWidth;
    if (targetWidth > 0) {
      const paddingAreaHorizontal = 64;
      const availableWidth = targetWidth - paddingAreaHorizontal;
      const MAX_PDF_WIDTH = 800;
      let optimalWidth = Math.min(availableWidth, MAX_PDF_WIDTH);
      setContainerWidth(Math.floor(Math.max(100, optimalWidth)));
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
    containerRef,
    containerWidth,
    isReady,

    // Actions
    nextDocument,
    prevDocument,
    goToDocument: (index) => setCurrentIndex(index)
  };
};
