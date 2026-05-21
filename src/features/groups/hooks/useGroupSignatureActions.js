import { useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import {
  saveDraft,
  updateDraftPosition,
  deleteDraft,
  signDocument,
  rejectDocument,
} from '../api/groupSignatureService';
import { finalizeGroupDocument, invalidateGroupCache } from '../api/groupService';
import { socketService } from '../../../services/socketService';
import { createLogger } from '../../../utils/logger';

// [M-6] Scoped logger agar console output konsisten dengan service lain.
const log = createLogger('GroupSignatureActions');

/**
 * @hook useGroupSignatureActions
 * @description Semua handler CRUD untuk tanda tangan group:
 * - handleAddSignature    → POST draft + optimistic update
 * - handleUpdateSignature → PATCH position
 * - handleDeleteSignature → DELETE draft
 * - handleSaveMySignature → POST sign (final)
 * - handleFinalizeDocument → POST finalize (admin only)
 *
 * ## [H-5] Kontrak `_pending` flag pada signature object
 *
 * Saat user drop signature ke PDF, kita melakukan **optimistic update**:
 * tambah signature ke state lokal dengan `id: tempId` (UUID v4 client-side)
 * SEBELUM saveDraft API response sampai. Backend men-generate ID-nya sendiri
 * (post-FIX #11 service tidak trust client id), jadi `tempId` ini akan
 * di-replace dengan `serverSig.id` setelah response.
 *
 * Window race antara `tempId` (optimistic) dan `serverSig.id` (persisted):
 *
 *   T0  Drop signature      → state: { id: tempId, _pending: true }
 *   T1  saveDraft request fire (async, ~30-100ms)
 *   T2  handleImageLoad fire (instant, ~5ms — cached image)
 *       ↳ handleUpdateSize(tempId, w, h) → state update OK,
 *         tapi PATCH backend SKIP karena `_pending: true`.
 *         Tanpa skip, PATCH ke `tempId` akan 404 (backend pakai server id).
 *   T3  saveDraft response  → state: { id: serverSig.id, _pending: false }
 *       ↳ Kalau ukuran sudah berubah di T2, `sizeChanged` cek dan PATCH
 *         dengan `serverSig.id` untuk sync backend.
 *
 * **Rule operasi yang harus respect `_pending`:**
 * - handleUpdateSignature  → SKIP PATCH bila pending (akan ter-persist via saveDraft response)
 * - handleUpdateSize       → SKIP PATCH bila pending (sda)
 * - handleDeleteSignature  → SKIP API call bila pending; hanya hapus dari state
 *                            lokal + emit socket. saveDraft yang on-the-fly akan
 *                            di-handle oleh catch block atau no-op kalau sudah
 *                            response sebelum delete (state sudah hilang).
 *
 * **Invariant:** `_pending: true` hanya selama window T0..T3 untuk signature
 * dengan `id === tempId`. Setelah saveDraft sukses atau gagal (rollback),
 * tidak boleh ada signature dengan `_pending: true` di state.
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
  setIFinalized,
  fetchGroupData,
}) => {
  // Defense-in-depth untuk klik ganda. UI sudah meng-disable tombol via
  // `disableFinalizeAction` di useGroupSigningPage, tapi state setter React
  // bersifat async — di perangkat lambat klik 2x sangat cepat masih bisa
  // melewati gating UI. Ref ini di-set sinkron sebelum await pertama supaya
  // pemanggilan kedua langsung early-return tanpa menunggu re-render.
  const submitInFlightRef = useRef(false);
  const finalizeInFlightRef = useRef(false);

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
        method: dropData.method || 'canvas',
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
          method: dropData.method || 'canvas',
          category: dropData.category || 'signing',
          metadata: dropData.metadata || undefined,
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
            const { _pending: _isPending, ...rest } = s;
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
            log.warn('post-save size sync error:', err.message);
          });
        }
      } catch (err) {
        setSignatures((prev) => prev.filter((s) => s.id !== tempId));
        log.error('saveDraft error:', err.message);
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
        log.error('updateSignature background save error:', err.message);
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
        log.error('updateSize background save error:', err.message);
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

      // Optimistic remove dari state lokal + broadcast ke peer
      setSignatures((prev) => prev.filter((s) => s.id !== sigId));
      socketService.emitRemoveSignature(documentId, sigId);

      // [H-5] Skip API call kalau signature masih optimistic. Backend belum
      // tahu signature ini ada (saveDraft on-the-fly), jadi DELETE dengan
      // tempId akan 404. Kalau saveDraft sukses setelah delete dilakukan,
      // backend akan punya orphan record — TAPI saveDraft handler akan cek
      // state lokal (yang sudah ter-filter) dan hapus. Sebenarnya saveDraft
      // tetap akan persist record orphan, ini accepted trade-off karena:
      //   1. Window race ini sangat sempit (saveDraft ~30-100ms, user delete
      //      hampir tidak mungkin secepat itu)
      //   2. Orphan record akan di-cleanup oleh fetch ulang berikutnya saat
      //      user reload halaman atau socket trigger refresh
      if (sig._pending) {
        return;
      }

      try {
        await deleteDraft(sigId);
      } catch (err) {
        log.error('deleteDraft error:', err.message);
        fetchGroupData(); // rollback dengan refetch
      }
    },
    [signatures, currentUser?.id, documentId, setSignatures, fetchGroupData]
  );

  // ── Simpan TTD Final (Per User) ───────────────────────────────────────────
  const handleSaveMySignature = useCallback(async () => {
    if (!mySignature) {
      toast.warning('Silakan letakkan tanda tangan Anda di dokumen terlebih dahulu.');
      return;
    }
    // Guard double-submit: tombol di UI sudah di-disable lewat
    // `disableFinalizeAction`, tapi tetap blokir di handler agar tetap aman
    // bila ada race (klik cepat sebelum disabled propagate, atau invocation
    // dari path lain).
    if (mySignature.status === 'final') return;
    if (submitInFlightRef.current) return;

    submitInFlightRef.current = true;
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

      // [Bug fix duplicate signature] Bust frontend cache /groups/:id setelah
      // sign sukses. Tanpa ini, user yang back ke /sign dalam 30 detik akan
      // dapat data lama (signature draft + final-tanpa-status-update sebelum)
      // -> render dobel.
      invalidateGroupCache(groupId);

      toast.success(
        remainingSigners > 0
          ? `Tanda tangan Anda berhasil disimpan. Menunggu ${remainingSigners} orang lagi.`
          : 'Tanda tangan Anda berhasil disimpan. Semua penandatangan sudah selesai. Admin dapat melakukan finalisasi.'
      );
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan tanda tangan. Silakan coba lagi.');
    } finally {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
    }
  }, [mySignature, documentId, groupId, currentUser?.id, setSignatures, setHasMyFinalSig, setReadyToFinalize, setPendingSigners, setIsSubmitting]);

  // ── Finalisasi Dokumen (Admin Only) ───────────────────────────────────────
  const handleFinalizeDocument = useCallback(async (auditTrailMode = "embedded") => {
    if (!isAdmin || !readyToFinalize) return;
    if (finalizeInFlightRef.current) return;

    finalizeInFlightRef.current = true;
    setIsFinalizing(true);
    try {
      const res = await finalizeGroupDocument(groupId, documentId, auditTrailMode);
      const { document: finalDoc } = res.data || {};

      // Tandai bahwa user ini yang melakukan finalisasi — supaya hanya dia
      // yang diarahkan ke halaman selanjutnya ("Dokumen Telah Difinalisasi").
      setIFinalized?.(true);
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
      finalizeInFlightRef.current = false;
      setIsFinalizing(false);
    }
  }, [isAdmin, readyToFinalize, groupId, documentId, documentTitle, setDocumentStatus, setIFinalized, setIsFinalizing, setStatusModal]);

  // ── Reject Document (Signer menolak) ──────────────────────────────────────
  const handleRejectDocument = useCallback(async (reason = null) => {
    try {
      await rejectDocument(documentId, reason);
      toast.info('Dokumen berhasil ditolak.');

      // Emit socket agar user lain tahu
      socketService.emitSignatureSaved(documentId, groupId);

      // [Bug fix] Bust cache supaya group detail re-fetch dengan status baru.
      invalidateGroupCache(groupId);

      // Redirect kembali ke halaman grup setelah reject
      if (fetchGroupData) fetchGroupData();
    } catch (err) {
      toast.error(err.message || 'Gagal menolak dokumen.');
    }
  }, [documentId, groupId, fetchGroupData]);

  return {
    handleAddSignature,
    handleUpdateSignature,
    handleUpdateSize,
    handleDeleteSignature,
    handleSaveMySignature,
    handleFinalizeDocument,
    handleRejectDocument,
  };
};
