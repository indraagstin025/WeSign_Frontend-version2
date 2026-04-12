import { useState, useRef, useCallback } from 'react';

/**
 * @hook useAvatarUpload
 * @description State manager for avatar upload process, including validation,
 *              preview generation, and image compression.
 * @param {Function} onUpload - Callback when file is ready to be uploaded.
 * @param {Function} onClose - Callback to close the modal.
 */
export const useAvatarUpload = (onUpload, onClose) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [localError, setLocalError] = useState(null);
  const fileInputRef = useRef(null);

  /**
   * Internal validator and preview generator
   */
  const validateAndSelectFile = useCallback((file) => {
    setLocalError(null);
    if (!file) return;

    // 1. Validasi Tipe File
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setLocalError('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.');
      return;
    }

    // 2. Validasi Ukuran (5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setLocalError('Ukuran file terlalu besar. Maksimal 5 MB.');
      return;
    }

    setSelectedFile(file);
    
    // Create Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  /**
   * Event Handlers
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    validateAndSelectFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    validateAndSelectFile(file);
  };

  /**
   * Image Compression Utility
   */
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_DIM = 800;

          if (width > height) {
            if (width > MAX_DIM) {
              height *= MAX_DIM / width;
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width *= MAX_DIM / height;
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Gagal melakukan kompresi foto.'));
            }
          }, 'image/jpeg', 0.82); 
        };
        img.onerror = () => reject(new Error('Gagal memuat gambar untuk kompresi.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Gagal membaca file.'));
      reader.readAsDataURL(file);
    });
  };

  /**
   * Submission and Cleanup
   */
  const handleSubmit = async () => {
    if (selectedFile && onUpload) {
      try {
        const fileToUpload = await compressImage(selectedFile);
        onUpload(fileToUpload);
      } catch (err) {
        setLocalError('Gagal memproses foto: ' + err.message);
      }
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetAndClose = () => {
    clearSelection();
    setLocalError(null);
    onClose();
  };

  return {
    states: {
      selectedFile,
      previewUrl,
      localError,
      fileInputRef,
    },
    handlers: {
      handleFileChange,
      handleDragOver,
      handleDrop,
      handleSubmit,
      clearSelection,
      resetAndClose,
    }
  };
};
