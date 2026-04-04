import { useState, useCallback } from 'react';
import { uploadPackageDocuments } from '../api/packageService';
import { pdfjs } from 'react-pdf';

// Konfigurasi worker pdfjs secara lokal (Vite Compatible)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

/**
 * Hook for managing the logic of creating a new package.
 * Separates file processing, validation, and submission from the UI.
 */
export const useCreatePackage = (onSuccess, onClose) => {
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  /**
   * Local validation for PDF files (check for password protection and images-only/scans)
   */
  const validatePdfLocally = async (selectedFile) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        try {
          const loadingTask = pdfjs.getDocument({ 
            data,
            disableWorker: false,
            password: '', 
            disableAutoFetch: true 
          });

          const pdf = await loadingTask.promise;
          const page = await pdf.getPage(1);
          const textContent = await page.getTextContent();
          const hasText = textContent.items.length > 0;
          
          resolve({ valid: true, hasText });
        } catch (err) {
          console.error("❌ [Validation Error Trace]:", err.name, err.message);
          
          if (err.name === 'PasswordException' || err.name === 'PasswordResponseException' || err.message?.toLowerCase().includes('password')) {
            resolve({ 
              valid: false, 
              error: 'File PDF terproteksi password. Silakan hapus proteksi sebelum mengunggah.' 
            });
          } else if (err.message?.includes('worker')) {
            resolve({ valid: true, skipLocal: true });
          } else {
            resolve({ 
              valid: false, 
              error: 'Konten PDF tidak terbaca atau rusak secara struktur.' 
            });
          }
        }
      };
      reader.onerror = () => resolve({ valid: false, error: 'Gagal membaca file dari penyimpanan lokal.' });
      reader.readAsArrayBuffer(selectedFile);
    });
  };

  /**
   * Process and validate a batch of newly selected/dropped files
   */
  const processNewFiles = useCallback(async (newFiles) => {
    setError(null);
    let validFiles = [];
    
    setLoading(true);
    for (let f of newFiles) {
      if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
        setError('Beberapa file ditolak. Hanya diperbolehkan dokumen PDF.');
        continue;
      }
      if (f.size > 50 * 1024 * 1024) {
        setError(`File ${f.name} melebihi kapasitas 50MB.`);
        continue;
      }

      const validation = await validatePdfLocally(f);
      if (!validation.valid) {
        setError(`${f.name}: ${validation.error}`);
        continue;
      }
      if (validation.valid && !validation.hasText && !validation.skipLocal) {
        setError(`${f.name}: Dokumen terdeteksi hasil scan (hanya gambar). Gunakan PDF digital.`);
        continue;
      }

      const isDuplicateInArray = files.some(ef => ef.name === f.name && ef.size === f.size);
      const isDuplicateInCurrentSelection = validFiles.some(vf => vf.name === f.name && vf.size === f.size);

      if (isDuplicateInArray || isDuplicateInCurrentSelection) {
        setError(`Dokumen ${f.name} sudah Anda pilih sebelumnya.`);
        continue;
      }

      validFiles.push(f);
    }
    setLoading(false);

    if (files.length + validFiles.length > 5) {
      setError('Maksimal 5 dokumen per paket tanda tangan.');
      validFiles = validFiles.slice(0, 5 - files.length);
    }

    if (validFiles.length > 0) {
      setFiles((prev) => {
        const updatedFiles = [...prev, ...validFiles];
        // Auto-set title if empty and this is the first batch
        if (!title && updatedFiles.length > 0) {
          setTitle(`Paket: ${updatedFiles[0].name.replace(/\.[^/.]+$/, "")}`);
        }
        return updatedFiles;
      });
    }
  }, [files, title]);

  const removeFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const clearFiles = () => {
    setFiles([]);
    setTitle('');
    setCategory('General');
    setError(null);
  };

  /**
   * Submit the package to the server
   */
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (files.length === 0) {
      setError('Silakan pilih setidaknya 1 dokumen.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('title', title || 'Paket Dokumen');
    formData.append('label', category);
    
    files.forEach((file) => {
      formData.append('documentFiles', file);
    });

    try {
      const response = await uploadPackageDocuments(formData);
      if (response?.status === 'success') {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          resetAndClose();
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Gagal mengunggah paket. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = useCallback(() => {
    if (loading) return;
    setFiles([]);
    setTitle('');
    setCategory('General');
    setError(null);
    setSuccess(false);
    onClose();
  }, [loading, onClose]);

  return {
    files,
    title,
    setTitle,
    category,
    setCategory,
    loading,
    error,
    setError,
    success,
    processNewFiles,
    removeFile,
    clearFiles,
    handleSubmit,
    handleClose: resetAndClose
  };
};
