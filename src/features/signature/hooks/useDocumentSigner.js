import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getDocumentDetail, 
  getDocumentFile 
} from '../../documents/api/docService';
import { addPersonalSignature } from '../api/signatureService';

/**
 * @hook useDocumentSigner
 * @description Mengelola logika interaktif penempatan tanda tangan pada PDF.
 * Menangani state koordinat, penambahan tanda tangan baru, dan pengiriman ke backend.
 */
export const useDocumentSigner = (documentId) => {
  const navigate = useNavigate();
  
  // --- STATE DATA ---
  const [document, setDocument] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- STATE SIGNING ---
  const [signatures, setSignatures] = useState([]); // List tanda tangan yang ditempatkan { x, y, page, type, imageUrl }
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [currentSignature, setCurrentSignature] = useState(null); // Tanda tangan aktif yang sedang "dipegang" kursor
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- FETCH DATA ---
  const fetchDocument = useCallback(async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      const docResponse = await getDocumentDetail(documentId);
      if (docResponse.status === 'success') {
        setDocument(docResponse.data);
        
        // --- FETCH SIGNED URL ---
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  // --- HANDLERS ---
  
  // Menambahkan tanda tangan yang sudah digambar ke "palet" atau menempatkannya langsung
  const handleSaveCanvas = (dataUrl) => {
    setCurrentSignature(dataUrl);
    setIsCanvasOpen(false);
  };

  // Menempatkan tanda tangan pada koordinat tertentu
  const placeSignature = (pageNumber, clickX, clickY, defaultWidth = 0.15, defaultHeight = 0.075) => {
    if (!currentSignature) {
      setIsCanvasOpen(true);
      return;
    }

    // clickX dan clickY adalah titik tengah dari tempat kursor user mengklik layar.
    // Karena Backend menggambar signature menggunakan koordinat Pojok Kiri Atas (Top-Left),
    // Kita translasikan sentral klik dengan mengurangi setengah lebar & setengah tinggi.
    const topLeftX = Math.max(0, clickX - (defaultWidth / 2));
    const topLeftY = Math.max(0, clickY - (defaultHeight / 2));

    const newSig = {
      id: Date.now(),
      pageNumber,
      positionX: topLeftX, // Skala 0-1 (Top-Left)
      positionY: topLeftY, // Skala 0-1 (Top-Left)
      width: defaultWidth,
      height: defaultHeight,
      signatureImageUrl: currentSignature,
      method: 'canvas'
    };

    setSignatures([...signatures, newSig]);
  };

  const removeSignature = (id) => {
    setSignatures(signatures.filter(s => s.id !== id));
  };

  const updateSignaturePosition = (id, x, y) => {
    setSignatures(signatures.map(sig => 
      sig.id === id ? { ...sig, positionX: x, positionY: y } : sig
    ));
  };

  const updateSignatureSize = (id, width, height) => {
    setSignatures(signatures.map(sig => 
      sig.id === id ? { ...sig, width, height } : sig
    ));
  };

  const handleSubmit = async () => {
    if (signatures.length === 0) {
      alert('Anda belum menempatkan tanda tangan apapun.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Siapkan payload untuk backend (array tanda tangan dalam field 'signatures')
      const signaturesToSubmit = signatures.map(({ pageNumber, positionX, positionY, width, height, signatureImageUrl, method }) => ({
        documentVersionId: document.currentVersionId,
        pageNumber,
        positionX,
        positionY,
        width: width || 0.15,
        height: height || 0.08,
        signatureImageUrl,
        method: method || 'canvas',
        displayQrCode: true
      }));

      // 2. Kirim ke API Signature (URL yang benar: /api/signatures/personal)
      const res = await addPersonalSignature({
        signatures: signaturesToSubmit
      });

      if (res.status === 'success' || res.data) {
        alert('Dokumen Berhasil Ditandatangani!');
        navigate('/dashboard/documents');
      } else {
        throw new Error('Respons backend tidak valid.');
      }
    } catch (err) {
      console.error('Signing Error:', err);
      alert(`Gagal menyelesaikan penandatanganan: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    document,
    pdfUrl,
    loading,
    error,
    isSubmitting,
    
    // Signature States
    signatures,
    currentSignature,
    setCurrentSignature,
    placeSignature,
    removeSignature,
    updateSignaturePosition,
    updateSignatureSize,
    
    // Canvas States
    isCanvasOpen,
    setIsCanvasOpen,
    handleSaveCanvas,
    
    // Actions
    handleSubmit
  };
};
