import React, { useCallback, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useUser } from '../../../context/UserContext';
import { useOutboxDrain } from '../../../hooks/useOutboxDrain';
import { useGroupSigning } from './useGroupSigning';

const DEFAULT_SIG_WIDTH = 0.25;
const DEFAULT_SIG_HEIGHT = 0.1;

/**
 * @hook useGroupSigningPage
 * @description Orchestrator state untuk halaman penandatanganan dokumen grup.
 * Membungkus `useGroupSigning` + concerns level-page (theme, navigasi, sheet,
 * canvas-click handler, derivasi UI seperti finalize text & filter signature
 * milik user).
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
    isSubmitting,
    isFinalizing,
    iFinalized,
    pageNumber,
    pdfUrl,
    setIsCanvasOpen,
    setStatusModal,
    handleAddSignature,
    handleSaveMySignature,
    handleFinalizeDocument,
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
  const finalizeAction = isFinalizeMode ? handleFinalizeDocument : handleSaveMySignature;
  const finalizeText = isFinalizeMode ? 'Finalisasi Dokumen' : 'Simpan Tanda Tangan';
  const submittingAny = isSubmitting || isFinalizing;

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
        positionX: Math.max(0, Math.min(1 - DEFAULT_SIG_WIDTH, clickX - DEFAULT_SIG_WIDTH / 2)),
        positionY: Math.max(0, clickY - 0.05),
        width: DEFAULT_SIG_WIDTH,
        height: DEFAULT_SIG_HEIGHT,
      });
    },
    [canSign, currentSignature, mySignatures.length, pageNumber, handleAddSignature, setIsCanvasOpen, setStatusModal]
  );

  // ── Navigation ────────────────────────────────────────────────────────────
  const goBackToGroup = () => navigate(`/dashboard/groups/${groupId}`);
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
    },
  };
}
