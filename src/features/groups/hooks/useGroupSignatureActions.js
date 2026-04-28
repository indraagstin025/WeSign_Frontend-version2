import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  saveDraft,
  updateDraftPosition,
  deleteDraft,
  signDocument,
} from '../api/groupSignatureService';
import { finalizeGroupDocument } from '../api/groupService';
import { socketService } from '../../../services/socketService';

/**
 * @hook useGroupSignatureActions
 * @description Semua handler CRUD untuk tanda tangan group:
 * - handleAddSignature    → POST draft + optimistic update
 * - handleUpdateSignature → PATCH position
 * - handleDeleteSignature → DELETE draft
 * - handleSaveMySignature → POST sign (final)
 * - handleFinalizeDocument → POST finalize (admin only)
 */
export const useGroupSignatureActions = ({
  documentId,
  groupId,
  documentTitle,
  currentUser,
  canSign,
  myDraftExists,
  mySignature,
  isAdmin,
  readyToFinalize,
  currentSignature,
  signatures,
  setSignatures,
  setHasMyFinalSig,
  setReadyToFinalize,
  setDocumentStatus,
  setIsSubmitting,
  setIsFinalizing,
  setStatusModal,
  fetchGroupData,
}) => {
  // ── Tambah TTD (Drop/Klik di PDF) ─────────────────────────────────────────
  const handleAddSignature = useCallback(
    async (dropData) => {
      if (!canSign || !currentSignature) return;
      if (myDraftExists) return; // 1 user = 1 TTD

      const tempId = uuidv4();
      const newSig = {
        id: tempId,
        userId: currentUser.id,
        signerName: currentUser.name,
        signerStatus: 'PENDING',
        status: 'draft',
        signatureImageUrl: currentSignature,
        pageNumber: dropData.pageNumber,
        positionX: dropData.positionX,
        positionY: dropData.positionY,
        width: dropData.width,
        height: dropData.height,
        method: 'canvas',
      };

      // Optimistic update
      setSignatures((prev) => [...prev, newSig]);

      try {
        const res = await saveDraft(documentId, {
          id: tempId,
          signatureImageUrl: currentSignature,
          pageNumber: dropData.pageNumber,
          positionX: dropData.positionX,
          positionY: dropData.positionY,
          width: dropData.width,
          height: dropData.height,
          method: 'canvas',
        });

        const serverSig = res.data;
        setSignatures((prev) =>
          prev.map((s) =>
            s.id === tempId ? { ...newSig, ...serverSig, userId: currentUser.id } : s
          )
        );

        socketService.emitAddSignature(documentId, {
          ...newSig,
          id: serverSig?.id || tempId,
        });
      } catch (err) {
        setSignatures((prev) => prev.filter((s) => s.id !== tempId));
        console.error('[useGroupSignatureActions] saveDraft error:', err.message);
      }
    },
    [canSign, currentSignature, myDraftExists, documentId, currentUser, setSignatures]
  );

  // ── Update Posisi TTD (Drag End) ─────────────────────────────────
  // Fire-and-forget: update state dulu (smooth UI), API call di background
  const handleUpdateSignature = useCallback(
    (id, x, y) => {
      // 1. Update state langsung — tidak ada await agar drag smooth
      setSignatures((prev) =>
        prev.map((s) => s.id === id ? { ...s, positionX: x, positionY: y } : s)
      );
      // 2. Persist ke backend di background (non-blocking, dengan retry+coalesce)
      updateDraftPosition(id, { positionX: x, positionY: y }).catch((err) => {
        if (err?.name === 'AbortError') return; // coalesced, ada PATCH yang lebih baru
        console.error('[updateSignature] background save error:', err.message);
      });
    },
    [setSignatures]
  );

  // ── Update Ukuran TTD (Resize End) ───────────────────────────────
  // Fire-and-forget: sama seperti updateSignature
  const handleUpdateSize = useCallback(
    (id, w, h) => {
      setSignatures((prev) =>
        prev.map((s) => s.id === id ? { ...s, width: w, height: h } : s)
      );
      updateDraftPosition(id, { width: w, height: h }).catch((err) => {
        if (err?.name === 'AbortError') return; // coalesced, ada PATCH yang lebih baru
        console.error('[updateSize] background save error:', err.message);
      });
    },
    [setSignatures]
  );

  // ── Hapus TTD (Hanya Draft Milik Sendiri) ─────────────────────────────────
  const handleDeleteSignature = useCallback(
    async (sigId) => {
      const sig = signatures.find((s) => s.id === sigId);
      if (!sig || sig.status === 'final') return;
      if (String(sig.userId) !== String(currentUser?.id)) return;

      setSignatures((prev) => prev.filter((s) => s.id !== sigId));
      socketService.emitRemoveSignature(documentId, sigId);

      try {
        await deleteDraft(sigId);
      } catch (err) {
        console.error('[useGroupSignatureActions] deleteDraft error:', err.message);
        fetchGroupData(); // rollback dengan refetch
      }
    },
    [signatures, currentUser?.id, documentId, setSignatures, fetchGroupData]
  );

  // ── Simpan TTD Final (Per User) ───────────────────────────────────────────
  const handleSaveMySignature = useCallback(async () => {
    if (!mySignature) {
      setStatusModal({
        isOpen: true, type: 'error',
        title: 'Belum Ada Tanda Tangan',
        message: 'Silakan letakkan tanda tangan Anda di dokumen terlebih dahulu.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signDocument(documentId, {
        id: mySignature.id,
        signatureImageUrl: mySignature.signatureImageUrl,
        pageNumber: mySignature.pageNumber,
        positionX: mySignature.positionX,
        positionY: mySignature.positionY,
        width: mySignature.width,
        height: mySignature.height,
        method: mySignature.method || 'canvas',
      });

      setSignatures((prev) =>
        prev.map((s) => (s.id === mySignature.id ? { ...s, status: 'final' } : s))
      );
      setHasMyFinalSig(true);

      const { readyToFinalize: rdy, remainingSigners } = res.data || {};
      if (rdy || remainingSigners === 0) setReadyToFinalize(true);

      socketService.emitSignatureSaved(documentId, groupId);

      setStatusModal({
        isOpen: true, type: 'success',
        title: 'Tanda Tangan Tersimpan!',
        message:
          remainingSigners > 0
            ? `Tanda tangan Anda berhasil disimpan. Menunggu ${remainingSigners} orang lagi.`
            : 'Semua penandatangan sudah selesai. Admin dapat melakukan finalisasi.',
      });
    } catch (err) {
      setStatusModal({
        isOpen: true, type: 'error',
        title: 'Gagal Menyimpan',
        message: err.message || 'Terjadi kesalahan. Silakan coba lagi.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [mySignature, documentId, groupId, setSignatures, setHasMyFinalSig, setReadyToFinalize, setIsSubmitting, setStatusModal]);

  // ── Finalisasi Dokumen (Admin Only) ───────────────────────────────────────
  const handleFinalizeDocument = useCallback(async () => {
    if (!isAdmin || !readyToFinalize) return;

    setIsFinalizing(true);
    try {
      const res = await finalizeGroupDocument(groupId, documentId);
      const { document: finalDoc } = res.data || {};

      setDocumentStatus('COMPLETED');
      socketService.emitDocumentFinalized(groupId, documentId, documentTitle);

      setStatusModal({
        isOpen: true, type: 'success',
        title: 'Dokumen Difinalisasi!',
        message: `PDF final berhasil dibuat. Access code: ${finalDoc?.accessCode || '-'}`,
        onConfirm: () => {
          window.open(finalDoc?.currentVersion?.url || finalDoc?.pdfUrl, '_blank');
        },
      });
    } catch (err) {
      setStatusModal({
        isOpen: true, type: 'error',
        title: 'Gagal Finalisasi',
        message: err.message || 'Terjadi kesalahan saat finalisasi.',
      });
    } finally {
      setIsFinalizing(false);
    }
  }, [isAdmin, readyToFinalize, groupId, documentId, documentTitle, setDocumentStatus, setIsFinalizing, setStatusModal]);

  return {
    handleAddSignature,
    handleUpdateSignature,
    handleUpdateSize,
    handleDeleteSignature,
    handleSaveMySignature,
    handleFinalizeDocument,
  };
};
