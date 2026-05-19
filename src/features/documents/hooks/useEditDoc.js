import { useState } from 'react';

/**
 * @hook useEditDoc
 * @description Hook untuk mengelola form edit metadata dokumen.
 * Centralize: form state, validasi, dan submission logic.
 *
 * [Bonus #2] Sebelumnya pakai `useEffect` dengan `setState` synchronous
 * untuk sync prop `document` ke state form — pattern ini di-flag oleh
 * lint rule react-hooks/set-state-in-effect.
 *
 * Solusi: parent (DocumentModals) pass `key={document.id}` ke
 * `<EditDocModal>` → React re-mount component setiap dokumen berbeda
 * → state init langsung dari prop saat mount, no effect needed.
 *
 * Pattern ini lebih bersih: state derived dari prop saat mount, lalu
 * diowned hook setelah itu (user bisa edit title/type tanpa interferensi
 * dari prop document yang mungkin re-fetched parent).
 *
 * Refs: https://react.dev/learn/you-might-not-need-an-effect#resetting-all-state-when-a-prop-changes
 *
 * @param {object|null} document - Dokumen yang sedang di-edit
 * @param {(id: string, data: object) => void} onUpdate
 * @param {() => void} onClose
 */
export const useEditDoc = (document, onUpdate, onClose) => {
  // Init state langsung dari prop. Saat parent re-mount component dengan
  // key berbeda, hook akan initialize ulang dengan dokumen baru.
  const [title, setTitle] = useState(document?.title || '');
  const [type, setType] = useState(document?.type || 'General');
  const [error, setError] = useState('');

  /**
   * Handler submit dengan validasi internal.
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Validasi
    const cleanedTitle = title.trim();
    if (!cleanedTitle) {
      setError('Judul dokumen tidak boleh kosong.');
      return;
    }

    // 2. Cek perubahan (optimization — tidak fire API kalau tidak ada change)
    if (cleanedTitle === document.title && type === document.type) {
      onClose();
      return;
    }

    // 3. Trigger update action ke parent
    onUpdate(document.id, {
      title: cleanedTitle,
      type: type,
    });
  };

  /**
   * Handler input title (auto-clear error).
   */
  const handleTitleChange = (val) => {
    setTitle(val);
    if (error) setError('');
  };

  return {
    state: {
      title,
      type,
      error,
    },
    actions: {
      setTitle: handleTitleChange,
      setType,
      handleSubmit,
    },
  };
};
