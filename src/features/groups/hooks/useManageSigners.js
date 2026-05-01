import { useState, useEffect, useMemo } from 'react';
import { updateDocumentSigners } from '../api/groupService';

/**
 * @hook useManageSigners
 * @description State & action untuk modal kelola penandatangan dokumen grup.
 *
 * @param {object} args
 * @param {boolean} args.isOpen
 * @param {object} args.doc - Dokumen yang dikelola.
 * @param {number|string} args.groupId
 * @param {Array} [args.members=[]]
 * @param {() => void} [args.onSuccess]
 * @param {() => void} [args.onClose]
 */
export function useManageSigners({ isOpen, doc, groupId, members = [], onSuccess, onClose }) {
  const [selectedSigners, setSelectedSigners] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Pre-fill signer yang sudah dipilih sebelumnya
  useEffect(() => {
    if (!isOpen || !doc) return;
    const existing = doc.signerRequests?.map((sr) => sr.userId) || [];
    setSelectedSigners(existing);
    setError(null);
  }, [isOpen, doc]);

  const toggleSigner = (userId) => {
    setSelectedSigners((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleAll = () => {
    const allIds = members.map((m) => m.userId || m.id);
    setSelectedSigners((prev) => (prev.length === allIds.length ? [] : allIds));
  };

  const isUserSigned = (userId) => {
    const record = doc?.signerRequests?.find((sr) => sr.userId === userId);
    return record?.status === 'SIGNED';
  };

  const handleSave = async () => {
    if (!doc) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await updateDocumentSigners(groupId, doc.id, selectedSigners);
      if (res.status === 'success') {
        onSuccess?.();
        onClose?.();
      }
    } catch (err) {
      setError(err.message || 'Gagal mengubah penandatangan.');
    } finally {
      setIsSaving(false);
    }
  };

  const willBeDraft = selectedSigners.length === 0;
  const allSelected = useMemo(
    () => members.length > 0 && selectedSigners.length === members.length,
    [members.length, selectedSigners.length]
  );

  return {
    state: {
      selectedSigners,
      isSaving,
      error,
      willBeDraft,
      allSelected,
    },
    actions: {
      toggleSigner,
      toggleAll,
      handleSave,
      isUserSigned,
    },
  };
}
