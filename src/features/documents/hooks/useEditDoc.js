import { useState, useEffect } from 'react';

/**
 * Hook for managing the logic of Edit Document Metadata Modal.
 * Centralizes form state, validation, and submission logic.
 */
export const useEditDoc = (document, onUpdate, onClose) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('General');
  const [error, setError] = useState('');

  // Sync initial data when document changes (Modal opens)
  useEffect(() => {
    if (document) {
      setTitle(document.title || '');
      setType(document.type || 'General');
      setError('');
    }
  }, [document]);

  /**
   * Handle form submission with internal validation
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 1. Validation
    const cleanedTitle = title.trim();
    if (!cleanedTitle) {
      setError('Judul dokumen tidak boleh kosong.');
      return;
    }

    // 2. Check for changes (optimization)
    if (cleanedTitle === document.title && type === document.type) {
      onClose();
      return;
    }

    // 3. Trigger update action
    onUpdate(document.id, { 
      title: cleanedTitle,
      type: type 
    });
  };

  /**
   * Handle text input change (clears error automatically)
   */
  const handleTitleChange = (val) => {
    setTitle(val);
    if (error) setError('');
  };

  return {
    state: {
      title,
      type,
      error
    },
    actions: {
      setTitle: handleTitleChange,
      setType,
      handleSubmit
    }
  };
};
