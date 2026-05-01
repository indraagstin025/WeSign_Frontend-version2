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
  setPendingSigners,
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
        // [FIX] Flag optimistic — handleUpdateSize/Position akan skip PATCH
        // selama flag ini true. Mencegah race condition dengan handleImageLoad
        // yang fire INSTANT sebelum saveDraft response (yang bawa server-generated
        // UUID) sampai. Tanpa ini, PATCH ke `tempId` akan 404 karena backend
        // (post-FIX #11) tidak trust client id.
        _pending: true,
      };

      // Optimistic update
      setSignatures((prev) => [...prev, newSig]);

      try {
        const res = await saveDraft(documentId, {
          // Catatan: backend mengabaikan `id` dari client (FIX #11 service),
          // tapi tetap dikirim untuk backward compat bila ada caller lama.
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
            // eslint-disable-next-line no-unused-vars
            const { _pending, ...rest } = s;
            return {
              ...rest,
              ...serverSig,
              userId: currentUser.id,
              width: s.width,
              height: s.height,
              // [FIX] Hapus flag — signature kini ter-persist, PATCH boleh.
              _pending: false,
            };
          })
        );

        socketService.emitAddSignature(documentId, {
          ...newSig,
          ...(localSnapshot ? { width: localSnapshot.width, height: localSnapshot.height } : {}),
          id: serverSig?.id || tempId,
          _pending: false,
        });

        // [FIX] Bila handleImageLoad sudah update width/height ke nilai
        // AR-correct (state lokal berbeda dari payload yang dikirim ke saveDraft),
        // sync ke backend dengan PATCH terpisah pakai server-generated ID.
        // Tanpa ini, DB punya height placeholder (mis. 0.1) padahal frontend
        // sudah render dengan height yang benar.
        const persistedId = serverSig?.id;
        const sizeChanged =
          localSnapshot &&
          persistedId &&
          (localSnapshot.width !== dropData.width ||
            localSnapshot.height !== dropData.height);
        if (sizeChanged) {
          updateDraftPosition(persistedId, {
            width: localSnapshot.width,
            height: localSnapshot.height,
          }).catch((err) => {
            if (err?.name === 'AbortError') return;
            console.warn('[useGroupSignatureActions] post-save size sync error:', err.message);
          });
        }
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

      // [FIX] Skip PATCH bila signature masih optimistic (`_pending`).
      // Backend belum punya record dengan tempId → akan 404. Posisi akan
      // di-persist via saveDraft response (yang sudah berisi posisi terbaru
      // dari state lokal).
      if (sig._pending) return;

      // 2. Persist ke backend di background (non-blocking, dengan retry+coalesce)
      updateDraftPosition(id, { positionX: x, positionY: y }).catch((err) => {
        if (err?.name === 'AbortError') return; // coalesced, ada PATCH yang lebih baru
        console.error('[updateSignature] background save error:', err.message);
      });
    },
    [setSignatures, signatures, currentUser?.id]
  );

  // ── Update Ukuran TTD (Resize End) ───────────────────────────────
  // Fire-and-forget: sama seperti updateSignature, dengan guard ownership + pending.
  const handleUpdateSize = useCallback(
    (id, w, h) => {
      const sig = signatures.find((s) => s.id === id);
      if (!sig) return;
      if (String(sig.userId) !== String(currentUser?.id)) return;

      setSignatures((prev) =>
        prev.map((s) => s.id === id ? { ...s, width: w, height: h } : s)
      );

      // [FIX] Skip PATCH untuk optimistic signature (lihat handleUpdateSignature).
      if (sig._pending) return;

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

      // Hapus diri dari pendingSigners agar progress bar lokal langsung
      // bertambah tanpa menunggu refetch. Server tidak broadcast event
      // signature_saved kembali ke sender, jadi update harus dilakukan
      // langsung di sini.
      if (setPendingSigners && currentUser?.id) {
        setPendingSigners((prev) =>
          prev.filter((s) => String(s.userId) !== String(currentUser.id))
        );
      }

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
  }, [mySignature, documentId, groupId, currentUser?.id, setSignatures, setHasMyFinalSig, setReadyToFinalize, setPendingSigners, setIsSubmitting, setStatusModal]);

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
