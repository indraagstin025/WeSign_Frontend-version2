import { useState, useEffect, useRef, useCallback } from 'react';
import { socketService } from '../../../services/socketService';

/**
 * @hook useGroupSocket
 * @description Koneksi socket untuk Group Signing + Group Detail realtime.
 *
 * EVENT YANG DITERIMA DARI BACKEND:
 *
 * [Document Room]
 *   'add_signature_live'        → signature object langsung
 *   'remove_signature_live'     → signatureId string langsung
 *   'update_signature_position' → { signatureId, positionX, positionY, width, height }
 *   'signature_saved'           → { userId, userName, ... }
 *
 * [Group Room: group_document_update]
 *   action: 'new_document'   → dokumen baru diupload
 *   action: 'removed_document' → dokumen dihapus
 *   action: 'signer_update'  → kelola signer diupdate
 *   action: 'finalized'      → dokumen difinalisasi
 *
 * [Group Room: group_member_update]
 *   action: 'new_member'     → anggota baru bergabung
 *   action: 'kicked'         → anggota dikeluarkan
 *
 * [Group Room: group_info_update]
 *   action: 'update_info'    → info grup berubah
 */
export const useGroupSocket = ({
  documentId,
  groupId,
  currentUserId,
  ready,
  // Signing-specific state setters (opsional, hanya untuk GroupSigningPage)
  setSignatures,
  setPendingSigners,
  setReadyToFinalize,
  setDocumentStatus,
  setStatusModal,
  // Callback refresh data grup (untuk upload/delete/signer/member changes)
  onRefresh,
  // Signing-only refresh (hanya saat finalized — butuh URL PDF baru)
  onRefreshSigning,
  // Callback khusus jika user ini dikick
  onKicked,
}) => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [socketStatus, setSocketStatus] = useState({ connected: false });

  // Dedup guard: cegah double event dari backend broadcast ke 2 room
  const lastSavedRef = useRef(new Map());

  useEffect(() => {
    if (!groupId || !ready) return;

    socketService.connect();
    if (documentId) socketService.joinRoom(documentId);
    socketService.joinGroupRoom(groupId);

    // ── Status koneksi ────────────────────────────────────────────────────
    // Track previous connected state untuk deteksi transisi disconnect→connect
    // (reconnect). Saat reconnect, kita refetch data agar state lokal sinkron
    // dengan server — bisa saja selama disconnect ada perubahan signature,
    // member, atau finalisasi yang event-nya tidak kita terima.
    let wasConnected = socketService.isConnected();
    const unsubConn = socketService.onConnectionChange((status) => {
      setSocketStatus(status);
      if (status.connected && !wasConnected) {
        // Reconnect terdeteksi → reconcile state via silent refetch.
        // onRefresh menerima param `silent` (true = tanpa loading spinner).
        if (typeof onRefresh === 'function') onRefresh(true);
        if (typeof onRefreshSigning === 'function') onRefreshSigning(true);
      }
      wasConnected = !!status.connected;
    });

    // ── User online (document room) ───────────────────────────────────────
    const handleUserJoined = (data) => {
      setActiveUsers((prev) => {
        if (prev.find((u) => u.userId === data.userId)) return prev;
        return [...prev, data];
      });
    };
    const handleUserLeft = (data) => {
      setActiveUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    };
    const handleCurrentUsers = (users) => {
      setActiveUsers(users.filter((u) => String(u.userId) !== String(currentUserId)));
    };

    socketService.on('user_joined', handleUserJoined);
    socketService.on('user_left', handleUserLeft);
    socketService.on('current_room_users', handleCurrentUsers);

    // ── TTD baru dari user lain (signing-only) ────────────────────────────
    const handleAddSig = (signature) => {
      if (!signature?.id || !setSignatures) return;
      if (String(signature.userId) === String(currentUserId)) return;
      setSignatures((prev) => {
        if (prev.find((s) => s.id === signature.id)) return prev;
        return [...prev, signature];
      });
    };

    const handleRemoveSig = (signatureId) => {
      if (!signatureId || !setSignatures) return;
      setSignatures((prev) => prev.filter((s) => s.id !== signatureId));
    };

    socketService.on('add_signature_live', handleAddSig);
    socketService.on('remove_signature_live', handleRemoveSig);

    // ── Signature final dari user lain — NO REFRESH ───────────────────────
    const handleSigSaved = (data) => {
      if (!data?.userId) return;
      if (String(data.userId) === String(currentUserId)) return;

      // Dedup: tolak duplicate dalam 2 detik
      const key = String(data.userId);
      const now = Date.now();
      if (now - (lastSavedRef.current.get(key) || 0) < 2000) return;
      lastSavedRef.current.set(key, now);

      // Update state lokal jika di signing page
      if (setSignatures) {
        setSignatures((prev) =>
          prev.map((s) =>
            String(s.userId || s.signerId) === String(data.userId)
              ? { ...s, status: 'final', signerStatus: 'SIGNED' }
              : s
          )
        );
      }
      if (setPendingSigners) {
        setPendingSigners((prev) =>
          prev.filter((s) => String(s.userId) !== String(data.userId))
        );
      }

      setStatusModal?.({
        isOpen: true, type: 'info',
        title: 'Tanda Tangan Masuk',
        message: `${data.userName || 'Seseorang'} telah menandatangani dokumen.`,
        onConfirm: null,
      });
    };

    socketService.on('signature_saved', handleSigSaved);

    // ── Group Document Update (upload, delete, signer, finalized) ─────────
    const handleGroupDocUpdate = (data) => {
      if (!data?.action) return;

      switch (data.action) {
        case 'new_document':
        case 'removed_document':
        case 'signer_update':
          // Silent refresh — tidak ada loading spinner
          onRefresh?.(true);
          break;

        case 'finalized':
          setDocumentStatus?.('COMPLETED');
          setReadyToFinalize?.(false);
          setStatusModal?.({
            isOpen: true, type: 'success',
            title: 'Dokumen Difinalisasi!',
            message: 'Admin telah menyelesaikan dokumen. PDF final sudah tersedia.',
            onConfirm: null,
          });
          onRefreshSigning?.();
          onRefresh?.(true);
          break;

        default:
          onRefresh?.(true);
      }
    };

    socketService.onGroupDocumentUpdate(handleGroupDocUpdate);

    // ── Group Member Update (join, kick) ──────────────────────────────────
    const handleGroupMemberUpdate = (data) => {
      if (!data?.action) return;

      switch (data.action) {
        case 'new_member':
          onRefresh?.(true);
          break;

        case 'kicked':
          if (String(data.userId) === String(currentUserId)) {
            setStatusModal?.({
              isOpen: true, type: 'error',
              title: 'Anda Dikeluarkan',
              message: 'Admin telah mengeluarkan Anda dari grup ini.',
              onConfirm: () => {
                if (onKicked) onKicked();
              },
            });
          } else {
            onRefresh?.(true);
          }
          break;

        default:
          onRefresh?.(true);
      }
    };

    socketService.on('group_member_update', handleGroupMemberUpdate);

    // ── Group Info Update ─────────────────────────────────────────────────
    const handleGroupInfoUpdate = () => {
      onRefresh?.();
    };

    socketService.on('group_info_update', handleGroupInfoUpdate);

    return () => {
      if (documentId) socketService.leaveRoom(documentId);
      socketService.leaveGroupRoom(groupId);
      socketService.off('user_joined', handleUserJoined);
      socketService.off('user_left', handleUserLeft);
      socketService.off('current_room_users', handleCurrentUsers);
      socketService.off('add_signature_live', handleAddSig);
      socketService.off('remove_signature_live', handleRemoveSig);
      socketService.off('signature_saved', handleSigSaved);
      socketService.off('group_member_update', handleGroupMemberUpdate);
      socketService.off('group_info_update', handleGroupInfoUpdate);
      socketService.offGroupDocumentUpdate(handleGroupDocUpdate);
      if (typeof unsubConn === 'function') unsubConn();
    };
  }, [documentId, groupId, currentUserId, ready]);

  return { activeUsers, socketStatus };
};
