import React, { useCallback, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useUser } from '../../../context/UserContext';
import { useOutboxDrain } from '../../../hooks/useOutboxDrain';
import { useGroupSigning } from './useGroupSigning';
import {
  DEFAULT_SIGNATURE_WIDTH,
  DEFAULT_SIGNATURE_HEIGHT,
} from '../constants/groupSignatureLayout';

/**
 * @hook useGroupSigningPage
 * @description Orchestrator state untuk halaman penandatanganan dokumen grup.
 * Membungkus `useGroupSigning` + concerns level-page:
 * - Theme toggle (light/dark)
 * - Mobile bottom-sheet open state
 * - Canvas click handler untuk drop signature dengan default size
 *   (`DEFAULT_SIGNATURE_WIDTH`, `DEFAULT_SIGNATURE_HEIGHT`)
 * - Derivasi UI: finalize text label, filter signature milik user,
 *   submit/finalize disable state
 * - Outbox drain integration (auto-replay HTTP mutation saat reconnect)
 *
 * Layered architecture:
 * - useGroupData    → fetch state grup + dokumen
 * - useGroupSocket  → koneksi socket + listeners realtime
 * - useGroupSignatureActions → CRUD signature (add/update/delete/sign/finalize)
 * - useGroupSigning → orchestrator yang menyatukan 3 di atas
 * - useGroupSigningPage → wrapper level-page (this hook)
 */
export function useGroupSigningPage() {
  const { groupId, documentId } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user: currentUser } = useUser();

  // Hook utama orchestrator (sudah ada)
  const signing = useGroupSigning({ groupId, documentId, currentUser });

  const {
    signatures,
    documentStatus,
    canSign,
    isAdmin,
    readyToFinalize,
    currentSignature,
    currentMethod,
    isSubmitting,
    isFinalizing,
    iFinalized,
    hasMyFinalSig,
    pageNumber,
    pdfUrl,
    setIsCanvasOpen,
    setStatusModal,
    handleAddSignature,
    handleSaveMySignature,
    handleFinalizeDocument,
    handleRejectDocument,
    refreshData,
  } = signing;

  // ── Sheet (mobile) state ──────────────────────────────────────────────────
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // ── Outbox drain — refetch saat optimistic update di-rollback ─────────────
  useOutboxDrain(
    useCallback(() => {
      if (refreshData) refreshData(true);
    }, [refreshData])
  );

  // ── Derivasi UI ───────────────────────────────────────────────────────────
  const mySignatures = useMemo(
    () =>
      signatures.filter(
        (s) => String(s.userId || s.signerId) === String(currentUser?.id)
      ),
    [signatures, currentUser?.id]
  );

  // Gating redirect "Dokumen Telah Difinalisasi": hanya user yang menekan
  // tombol finalisasi pada session ini (`iFinalized === true`) yang diarahkan
  // ke layar selesai. User lain tetap di halaman signing dengan notifikasi.
  const isCompleted = iFinalized && documentStatus?.toUpperCase() === 'COMPLETED';
  const isFinalizeMode = isAdmin && readyToFinalize;
  const [auditTrailMode, setAuditTrailMode] = useState("embedded");
  const finalizeAction = isFinalizeMode ? () => handleFinalizeDocument(auditTrailMode) : handleSaveMySignature;
  const finalizeText = isFinalizeMode ? 'Finalisasi Dokumen' : 'Simpan Tanda Tangan';
  const submittingAny = isSubmitting || isFinalizing;

  // [Bug fix back-button + duplicate signature] Saat user buka /sign tapi
  // document status sudah COMPLETED, auto-redirect ke halaman preview.
  //
  // 2 skenario yang ter-cover:
  //   A) User finalize dari card di GroupDetailPage → klik back → browser
  //      pop ke /sign yang ada di history. Tanpa redirect, signing UI render
  //      ulang dengan signature lama + draft local → signature dobel di PDF.
  //   B) User finalize dari signing page sendiri (`iFinalized=true`).
  //      Setelah completed screen ditutup atau back, redirect ke preview.
  //
  // Skenario yang TIDAK ter-cover (sengaja, untuk preserve UX):
  //   - User signer biasa (bukan finalizer) yang sedang aktif sign saat admin
  //     finalize lewat socket. Untuk mereka, `useGroupSocket.handleGroupDocUpdate`
  //     case 'finalized' yang menampilkan toast "Admin telah menyelesaikan".
  //     Mereka bisa baca toast dulu sebelum manual close / pindah halaman.
  //
  // Detection: pakai `documentStatusInitiallyCompleted` ref yang capture nilai
  // documentStatus saat first non-loading render. Bila dari awal mount sudah
  // COMPLETED (skenario A), redirect. Bila status berubah jadi COMPLETED
  // selama session (skenario B handled via iFinalized → completed screen),
  // skip redirect karena user perlu lihat completed screen dulu.
  const initialStatusRef = React.useRef(null);
  React.useEffect(() => {
    if (signing.loading) return;
    // First render setelah loading selesai — capture initial status.
    if (initialStatusRef.current === null) {
      initialStatusRef.current = documentStatus?.toUpperCase() || 'UNKNOWN';

      // Skenario A: user buka /sign tapi document sudah COMPLETED dari awal.
      if (initialStatusRef.current === 'COMPLETED') {
        navigate(
          `/dashboard/groups/${groupId}/documents/${documentId}/preview`,
          { replace: true },
        );
      }
    }
  }, [
    documentStatus,
    signing.loading,
    groupId,
    documentId,
    navigate,
  ]);

  // Gating tombol aksi (Simpan / Finalisasi):
  // - Mode finalisasi (admin + readyToFinalize): cukup blokir saat sedang
  //   finalisasi atau sudah selesai difinalisasi pada session ini. Tidak
  //   perlu mensyaratkan `mySignatures.length > 0` (admin yang bukan signer
  //   tetap boleh finalisasi).
  // - Mode simpan (signer biasa): blokir saat tombol sedang submit, sudah
  //   ada TTD final milik user (cegah double-submit setelah klik pertama),
  //   atau belum ada TTD yang ditempelkan ke PDF.
  const disableFinalizeAction = isFinalizeMode
    ? (isFinalizing || iFinalized)
    : (isSubmitting || hasMyFinalSig || mySignatures.length === 0);

  // ── Handler klik PDF (drop signature) ─────────────────────────────────────
  const handleCanvasClick = useCallback(
    (e) => {
      if (!canSign) return;
      if (!currentSignature) {
        setIsCanvasOpen(true);
        return;
      }

      // Sudah ada TTD (draft/final) → blokir.
      if (mySignatures.length > 0) {
        setStatusModal({
          isOpen: true,
          type: 'error',
          title: 'Batas Tercapai',
          message: 'Anda hanya dapat menambahkan satu tanda tangan.',
        });
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) / rect.width;
      const clickY = (e.clientY - rect.top) / rect.height;

      handleAddSignature({
        pageNumber,
        positionX: Math.max(0, Math.min(1 - DEFAULT_SIGNATURE_WIDTH, clickX - DEFAULT_SIGNATURE_WIDTH / 2)),
        positionY: Math.max(0, clickY - 0.05),
        width: DEFAULT_SIGNATURE_WIDTH,
        height: DEFAULT_SIGNATURE_HEIGHT,
        method: currentMethod || 'canvas',
        category: ['canvas', 'signature', 'initial', 'date'].includes(currentMethod) ? 'signing' : 'annotation',
      });
    },
    // [Lint fix] tambah `currentMethod` ke deps — sebelumnya inferred dependency
    // tidak match dengan source dependencies dan trigger
    // react-hooks/preserve-manual-memoization rule.
    [canSign, currentSignature, mySignatures.length, pageNumber, currentMethod, handleAddSignature, setIsCanvasOpen, setStatusModal]
  );

  // ── Navigation ────────────────────────────────────────────────────────────
  // [Bug fix back-button] Setelah finalize, kita sudah pakai `replaceState`
  // di useEffect di atas — URL aktif address bar adalah group detail. Saat
  // user klik tombol "Kembali ke Grup" di completed screen, navigate dengan
  // `replace: true` supaya React Router state ikut sinkron (tidak push entry
  // duplikat group detail).
  const goBackToGroup = () =>
    navigate(`/dashboard/groups/${groupId}`, { replace: true });
  const openFinalPdf = () => {
    if (pdfUrl) window.open(pdfUrl, '_blank');
  };

  return {
    state: {
      // identity
      groupId,
      documentId,
      currentUser,
      theme,
      // page-level
      isSheetOpen,
      mySignatures,
      mySignatureCount: mySignatures.length,
      isCompleted,
      isFinalizeMode,
      finalizeText,
      submittingAny,
      disableFinalizeAction,
      auditTrailMode,
      setAuditTrailMode,
      // pass-through dari useGroupSigning
      ...signing,
    },
    actions: {
      // theme
      toggleTheme,
      // sheet
      openSheet: () => setIsSheetOpen(true),
      closeSheet: () => setIsSheetOpen(false),
      setIsSheetOpen,
      // canvas
      openCanvas: () => setIsCanvasOpen(true),
      // navigation
      goBackToGroup,
      openFinalPdf,
      // composed actions
      handleCanvasClick,
      finalizeAction,
      handleRejectDocument,
    },
  };
}
