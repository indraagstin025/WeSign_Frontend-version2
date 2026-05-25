import { useRef, useState } from 'react';
import { pdfjs } from 'react-pdf';
import { uploadDocument } from '../api/docService';
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from '../constants/uploadLimits';
import { createLogger } from '../../../utils/logger';

// PDF.js worker singleton — sudah di-init di main.jsx via config/pdfWorker.js.
// pdfjs masih di-import di sini untuk akses pdfjs.getDocument() (parse PDF
// untuk count halaman saat upload, tidak butuh react-pdf rendering).

// [L-7] Scoped logger agar console output konsisten dengan service lain.
const log = createLogger('UploadDoc');

/**
 * @hook useUploadDoc
 * @description Hook untuk mengelola form upload dokumen PDF.
 * Centralize: validasi PDF lokal, progress tracking, dan integrasi API.
 *
 * @param {() => void} onSuccess - Callback saat upload sukses
 * @param {() => void} onClose - Callback saat modal ditutup
 */
export const useUploadDoc = (onSuccess, onClose) => {
  const uploadIdempotencyKeyRef = useRef(null);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('General');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  /**
   * Validasi PDF lokal sebelum upload.
   *
   * [H-3] Pakai File.arrayBuffer() native Promise API alih-alih FileReader.
   * Sebelumnya FileReader.onload callback-based — handler validation
   * jalan sinkron di main thread saat callback fire. Untuk file PDF
   * besar (mendekati cap), parsing ke Uint8Array + pdfjs.getDocument()
   * bisa block UI 200-500ms (jank).
   *
   * file.arrayBuffer() modern (Chrome 76+, Firefox 69+, Safari 14+) native
   * return Promise. Browser bisa schedule read di background thread. pdfjs
   * juga sudah handle worker offload saat disableWorker:false.
   */
  const validatePdfLocally = async (selectedFile) => {
    let data;
    try {
      const buffer = await selectedFile.arrayBuffer();
      data = new Uint8Array(buffer);
    } catch {
      return { valid: false, error: 'Gagal membaca file dari penyimpanan lokal.' };
    }

    try {
      const loadingTask = pdfjs.getDocument({
        data,
        disableWorker: false,
        password: '',
        disableAutoFetch: true,
      });

      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const textContent = await page.getTextContent();
      const hasText = textContent.items.length > 0;

      return { valid: true, hasText };
    } catch (err) {
      if (
        err.name === 'PasswordException' ||
        err.name === 'PasswordResponseException' ||
        err.message?.toLowerCase().includes('password')
      ) {
        return {
          valid: false,
          error: 'File PDF terproteksi password. Silakan hapus proteksi sebelum mengunggah.',
        };
      }
      if (err.message?.includes('worker')) {
        // Fallback untuk masalah environment (mis. worker tidak load)
        return { valid: true, skipLocal: true };
      }
      return {
        valid: false,
        error: 'Konten PDF tidak terbaca atau rusak secara struktur.',
      };
    }
  };

  /**
   * Logic utama untuk proses file yang dipilih user.
   */
  const processSelectedFile = async (selectedFile) => {
    setError(null);
    setFile(null);

    // 1. Cek format & ukuran file dasar
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Hanya diperbolehkan dokumen PDF.');
      return;
    }
    if (selectedFile.size > MAX_UPLOAD_BYTES) {
      setError(`Ukuran file melebihi batas maksimal ${MAX_UPLOAD_LABEL}.`);
      return;
    }
    if (selectedFile.size === 0) {
      setError('File kosong (0 bytes) tidak diperbolehkan.');
      return;
    }

    // 2. Validasi konten PDF lokal
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

      // 3. Sukses → siapkan untuk submit
      uploadIdempotencyKeyRef.current = null;
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err) {
      // [Bonus #3] Sebelumnya `err` di-catch tapi tidak dipakai (lint
      // no-unused-vars). Sekarang log untuk debugging dengan prefix scope.
      log.error('PDF validation unexpected error:', err?.message || err);
      setError('Gagal memvalidasi konten PDF.');
    } finally {
      setValidating(false);
    }
  };

  /**
   * Handler submit form upload.
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
        onProgress: (percent) => setUploadProgress(percent),
        idempotencyKey:
          uploadIdempotencyKeyRef.current ||
          (uploadIdempotencyKeyRef.current = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`),
      });

      if (response.status === 'success') {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1500);
      }
    } catch (err) {
      log.error('Upload error:', err.message);
      setError(err.message || 'Gagal mengunggah dokumen. Silakan periksa koneksi Anda.');
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset state dan tutup modal.
   */
  const handleClose = () => {
    if (loading || validating) return;
    setFile(null);
    uploadIdempotencyKeyRef.current = null;
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
      success,
    },
    actions: {
      setTitle,
      setType,
      setFile: (f) => {
        if (f === null) {
          setFile(null);
          setError(null);
        } else if (f) {
          processSelectedFile(f);
        }
      },
      handleSubmit,
      handleClose,
      handleDrop: (e) => {
        e.preventDefault();
        e.stopPropagation();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) processSelectedFile(droppedFile);
      },
    },
  };
};
