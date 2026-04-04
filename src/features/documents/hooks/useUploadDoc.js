import { useState } from 'react';
import { uploadDocument } from '../api/docService';
import { pdfjs } from 'react-pdf';

// Global worker configuration for pdfjs (Vite Compatible)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

/**
 * Hook for managing the logic of Document Uploading.
 * Centralizes PDF validation, progress tracking, and API integration.
 */
export const useUploadDoc = (onSuccess, onClose) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('General');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  /**
   * Internal helper for local PDF validation
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
          if (err.name === 'PasswordException' || err.name === 'PasswordResponseException' || err.message?.toLowerCase().includes('password')) {
            resolve({ 
              valid: false, 
              error: 'File PDF terproteksi password. Silakan hapus proteksi sebelum mengunggah.' 
            });
          } else if (err.message?.includes('worker')) {
            // Fallback for environment issues
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
   * Main file processing logic
   */
  const processSelectedFile = async (selectedFile) => {
    setError(null);
    setFile(null);

    // 1. Basic format & size check
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Hanya diperbolehkan dokumen PDF.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Ukuran file melebihi batas maksimal 10MB.');
      return;
    }
    if (selectedFile.size === 0) {
      setError('File kosong (0 bytes) tidak diperbolehkan.');
      return;
    }

    // 2. Local PDF Content Validation
    setValidating(true);
    try {
      const validation = await validatePdfLocally(selectedFile);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }
      if (validation.valid && !validation.hasText && !validation.skipLocal) {
        setError('Dokumen terdeteksi hasil scan (hanya gambar). Sistem membutuhkan PDF digital dengan lapisan teks.');
        return;
      }

      // 3. Success -> Prepare for next step
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    } catch (err) {
      setError('Gagal memvalidasi konten PDF.');
    } finally {
      setValidating(false);
    }
  };

  /**
   * Submission handler
   */
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('documentFile', file);
    formData.append('title', title || file.name);
    formData.append('type', type);

    try {
      const response = await uploadDocument(formData, {
        onProgress: (percent) => setUploadProgress(percent)
      });
      
      if (response.status === 'success') {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Gagal mengunggah dokumen. Silakan periksa koneksi Anda.');
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset and close
   */
  const handleClose = () => {
    if (loading || validating) return;
    setFile(null);
    setTitle('');
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
    onClose();
  };

  return {
    state: {
      file,
      title,
      type,
      loading,
      validating,
      uploadProgress,
      error,
      success
    },
    actions: {
      setTitle,
      setType,
      setFile: (f) => f && processSelectedFile(f),
      handleSubmit,
      handleClose,
      handleDrop: (e) => {
        e.preventDefault();
        e.stopPropagation();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) processSelectedFile(droppedFile);
      }
    }
  };
};
