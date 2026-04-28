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
import { toast } from '../../../services/toast';

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
        // PENTING: preserve s.width/s.height dari state lokal — handleImageLoad
        // di useDraggableSignature mungkin sudah update width/height ke nilai
        // AR-correct sebelum response saveDraft sampai (saveDraft ~40ms,
        // image cached load ~5ms). Tanpa ini, ...serverSig akan menimpa nilai
        // AR-correct dengan placeholder (mis. height: 0.1) yang kita kirim
        // ke backend saat drop.
        let localSnapshot = null;
        setSignatures((prev) =>
          prev.map((s) => {
            if (s.id !== tempId) return s;
            localSnapshot = s;
            return {
              ...newSig,
              ...serverSig,
              userId: currentUser.id,
              width: s.width,
              height: s.height,
            };
          })
        );

        socketService.emitAddSignature(documentId, {
          ...newSig,
          ...(localSnapshot ? { width: localSnapshot.width, height: localSnapshot.height } : {}),
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
  // Fire-and-forget: update state dulu (smooth UI), API call di background.
  // Guard ownership: hanya boleh PATCH signature milik user sendiri — kalau bukan,
  // backend akan tolak 403 (lihat handleDeleteSignature untuk pola yang sama).
  const handleUpdateSignature = useCallback(
    (id, x, y) => {
      const sig = signatures.find((s) => s.id === id);
      if (!sig) return;
      if (String(sig.userId) !== String(currentUser?.id)) return;

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
    [setSignatures, signatures, currentUser?.id]
  );

  // ── Update Ukuran TTD (Resize End) ───────────────────────────────
  // Fire-and-forget: sama seperti updateSignature, dengan guard ownership.
  const handleUpdateSize = useCallback(
    (id, w, h) => {
      const sig = signatures.find((s) => s.id === id);
      if (!sig) return;
      if (String(sig.userId) !== String(currentUser?.id)) return;

      setSignatures((prev) =>
        prev.map((s) => s.id === id ? { ...s, width: w, height: h } : s)
      );
      updateDraftPosition(id, { width: w, height: h }).catch((err) => {
        if (err?.name === 'AbortError') return; // coalesced, ada PATCH yang lebih baru
        console.error('[updateSize] background save error:', err.message);
      });
    },
    [setSignatures, signatures, currentUser?.id]
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
      toast.warn('Silakan letakkan tanda tangan Anda di dokumen terlebih dahulu.', {
        title: 'Belum Ada Tanda Tangan',
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

      toast.success(
        remainingSigners > 0
          ? `Tanda tangan Anda berhasil disimpan. Menunggu ${remainingSigners} orang lagi.`
          : 'Semua penandatangan sudah selesai. Admin dapat melakukan finalisasi.',
        { title: 'Tanda Tangan Tersimpan' }
      );
    } catch (err) {
      toast.error(err.message || 'Terjadi kesalahan. Silakan coba lagi.', {
        title: 'Gagal Menyimpan',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [mySignature, documentId, groupId, setSignatures, setHasMyFinalSig, setReadyToFinalize, setIsSubmitting]);

  // ── Finalisasi Dokumen (Admin Only) ───────────────────────────────────────
  const handleFinalizeDocument = useCallback(async () => {
    if (!isAdmin || !readyToFinalize) return;

    setIsFinalizing(true);
    try {
      const res = await finalizeGroupDocument(groupId, documentId);
      const { document: finalDoc } = res.data || {};

      setDocumentStatus('COMPLETED');
      socketService.emitDocumentFinalized(groupId, documentId, documentTitle);

      const pdfUrl = finalDoc?.currentVersion?.url || finalDoc?.pdfUrl;
      toast.show({
        type: 'success',
        title: 'Dokumen Difinalisasi',
        message: `PDF final berhasil dibuat. Access code: ${finalDoc?.accessCode || '-'}`,
        duration: 8000,
        action: pdfUrl
          ? { label: 'Buka PDF', onClick: () => window.open(pdfUrl, '_blank') }
          : null,
      });
    } catch (err) {
      toast.error(err.message || 'Terjadi kesalahan saat finalisasi.', {
        title: 'Gagal Finalisasi',
      });
    } finally {
      setIsFinalizing(false);
    }
  }, [isAdmin, readyToFinalize, groupId, documentId, documentTitle, setDocumentStatus, setIsFinalizing]);

  return {
    handleAddSignature,
    handleUpdateSignature,
    handleUpdateSize,
    handleDeleteSignature,
    handleSaveMySignature,
    handleFinalizeDocument,
  };
};
