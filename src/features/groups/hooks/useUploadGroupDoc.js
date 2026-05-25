import { useState, useRef } from 'react';
import { uploadGroupDocument } from '../api/groupService';
import {
  DOC_TITLE_MAX,
  validateDocTitle,
  validatePdfFile,
} from '../utils/groupValidation';

const inferErrorType = (err) => {
  if (err.status === 400 || err.status === 422) return 'validation';
  if (!navigator.onLine || err.message?.toLowerCase().includes('koneksi')) return 'network';
  return 'server';
};

/**
 * @hook useUploadGroupDoc
 * @description Mengelola seluruh state & handler untuk modal upload dokumen grup.
 * Komponen UI tinggal merender state dan memanggil action.
 *
 * ## [L-6] Kontrak `selectedSigners` & `willBeDraft`
 *
 * State `selectedSigners: string[]` menentukan flow status dokumen baru
 * setelah upload sukses:
 *
 * - `selectedSigners.length === 0` (`willBeDraft: true`) → status `DRAFT`
 *   - Backend tidak buat signerRequests
 *   - Dokumen hanya bisa di-edit/finalize oleh admin via Manage Signers
 *   - Cocok untuk: upload duluan, tentukan signer kemudian
 *
 * - `selectedSigners.length > 0` (`willBeDraft: false`) → status `PENDING`
 *   - Backend buat 1 SignerRequest per userId di array
 *   - Email notification dispatch ke setiap signer
 *   - Dokumen langsung masuk fase signing
 *
 * Backend payload: kalau `willBeDraft: true`, frontend SKIP append
 * `signerUserIds` ke FormData (lihat handleUpload). Backend infer DRAFT
 * dari ketiadaan field ini.
 *
 * @param {object} args
 * @param {number|string} args.groupId
 * @param {Array} [args.members=[]]
 * @param {boolean} args.isOpen
 * @param {() => void} [args.onSuccess]
 * @param {() => void} [args.onClose]
 */
export function useUploadGroupDoc({ groupId, members = [], isOpen, onSuccess, onClose }) {
  const uploadIdempotencyKeyRef = useRef(null);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [selectedSigners, setSelectedSigners] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef(null);

  const resetState = () => {
    uploadIdempotencyKeyRef.current = null;
    setTitle('');
    setFile(null);
    setSelectedSigners([]);
    setError(null);
    setIsDraggingFile(false);
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    const validationError = validatePdfFile(selectedFile);
    if (validationError) {
      setError({ message: validationError, type: 'validation' });
      return;
    }
    uploadIdempotencyKeyRef.current = null;
    setFile(selectedFile);
    setError(null);
    if (!title) {
      // Auto-fill judul dari nama file (max DOC_TITLE_MAX char).
      const baseName = selectedFile.name.replace(/\.pdf$/i, '').slice(0, DOC_TITLE_MAX);
      setTitle(baseName);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleFileDragOver = (e) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleFileDragLeave = () => setIsDraggingFile(false);

  const openFilePicker = () => fileInputRef.current?.click();

  const toggleSigner = (userId) => {
    setSelectedSigners((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleAll = () => {
    setSelectedSigners((prev) =>
      prev.length === members.length ? [] : members.map((m) => m.userId || m.id)
    );
  };

  const handleClose = () => {
    resetState();
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    // [VALIDATION] Sinkron dengan backend.
    const fileError = validatePdfFile(file);
    if (fileError) {
      setError({ message: fileError, type: 'validation' });
      return;
    }
    const titleError = validateDocTitle(title);
    if (titleError) {
      setError({ message: titleError, type: 'validation' });
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      if (selectedSigners.length > 0) {
        formData.append('signerUserIds', JSON.stringify(selectedSigners));
      }

      const res = await uploadGroupDocument(groupId, formData, {
        idempotencyKey:
          uploadIdempotencyKeyRef.current ||
          (uploadIdempotencyKeyRef.current = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`),
      });
      if (res.status === 'success') {
        onSuccess?.();
        handleClose();
      }
    } catch (err) {
      const errorType = inferErrorType(err);
      setError({
        message: err.message || 'Terjadi kesalahan saat mengunggah berkas. Silakan coba lagi.',
        type: errorType,
        retryable: errorType === 'server' || errorType === 'network',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const willBeDraft = selectedSigners.length === 0;

  return {
    state: {
      title,
      file,
      selectedSigners,
      isUploading,
      error,
      isDraggingFile,
      willBeDraft,
      isOpen,
      fileInputRef,
      titleMaxLength: DOC_TITLE_MAX,
    },
    actions: {
      setTitle,
      handleFileSelect,
      handleFileDrop,
      handleFileDragOver,
      handleFileDragLeave,
      openFilePicker,
      toggleSigner,
      toggleAll,
      handleSubmit,
      handleClose,
    },
  };
}
