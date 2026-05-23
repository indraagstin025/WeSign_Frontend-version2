import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { socketService } from '../../../services/socketService';
import { drainOutbox } from '../../../services/outboxDrain';

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
  const incomingPositionUpdatesRef = useRef(new Map());
  const flushPositionTimerRef = useRef(null);

  // Dedup guard: cegah double alert/state-update dari backend broadcast
  // `signature_saved` ke 2 room (document room + group room). Sekali user X
  // sudah memicu handler, lewati event berikutnya untuk user yang sama —
  // pakai Set, bukan timestamp, supaya alert (yang blocking) tidak menyebabkan
  // window dedup expire saat user lambat menutup alert.
  const alertedSignersRef = useRef(new Set());

  // [H-3] Ref untuk callback agar socket handler selalu pakai versi terbaru.
  //
  // Sebelumnya callback (onRefresh, onRefreshSigning, onKicked) di-closure
  // di useEffect dengan deps `[documentId, groupId, currentUserId, ready]`
  // saja. Setiap parent component re-render, callback baru tidak masuk —
  // socket handler tetap pakai versi pertama. Dampak: kalau parent state
  // berubah (mis. baru di-fetch fresh data), socket-triggered refresh akan
  // pakai callback yang masih reference ke state lama → stale data.
  //
  // Solusi: simpan callback di ref, update di useEffect tanpa deps trick.
  // Handler tinggal panggil `cbRefs.current.onRefresh?.(...)` — selalu
  // versi terbaru tanpa perlu re-bind socket listener.
  const cbRefs = useRef({ onRefresh, onRefreshSigning, onKicked });
  useEffect(() => {
    cbRefs.current = { onRefresh, onRefreshSigning, onKicked };
  }, [onRefresh, onRefreshSigning, onKicked]);

  useEffect(() => {
    if (!groupId || !ready) return;

    // [CR-2] Reset dedup tracker saat join document/group baru. Sebelumnya
    // alertedSignersRef adalah useRef(new Set()) yang di-init SEKALI per
    // hook instance — kalau user navigasi document A → B, Set dari A masih
    // ada → signer Bob yang sudah trigger alert di A akan ke-skip di B.
    alertedSignersRef.current = new Set();

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
        // [H-3] Pakai cbRefs.current agar selalu versi callback terbaru
        // (lihat dokumentasi cbRefs di atas).
        cbRefs.current.onRefresh?.(true);
        cbRefs.current.onRefreshSigning?.(true);
        // Tier 2: drain outbox (mutation HTTP yang gagal saat offline)
        drainOutbox();
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
        // [REALTIME-PERF] Kalau ini final emit (post-saveDraft) yang
        // membawa `oldId` (tempId optimistic), REPLACE row dengan ID lama
        // alih-alih ADD baru. Tanpa ini, peer akan punya 2 signature
        // (optimistic + final) yang bikin visual cloning saat drag/drop
        // sebelum saveDraft response.
        if (signature.oldId) {
          const idx = prev.findIndex((s) => s.id === signature.oldId);
          if (idx !== -1) {
            // Replace — preserve posisi/size yang mungkin sudah di-update
            // via update_signature_position event antara optimistic dan final.
            const next = [...prev];
            const existing = next[idx];
            const { oldId: _oldId, ...rest } = signature;
            next[idx] = {
              ...existing,
              ...rest,
              // Posisi/size dari state lokal lebih trustworthy (sudah di-sync
              // via update_signature_position events). Final emit dari
              // sender bisa stale beberapa frame.
              positionX: existing.positionX ?? rest.positionX,
              positionY: existing.positionY ?? rest.positionY,
              width: existing.width ?? rest.width,
              height: existing.height ?? rest.height,
              _clientKey: existing._clientKey || existing.id,
            };
            return next;
          }
          // oldId tidak ketemu (user join setelah optimistic emit) — fall through
          // ke add baru di bawah.
        }
        // Add: skip kalau ID sudah ada (idempotent).
        if (prev.find((s) => s.id === signature.id)) return prev;
        const { oldId: _oldId, ...clean } = signature;
        return [...prev, clean];
      });
    };

    const handleRemoveSig = (signatureId) => {
      if (!signatureId || !setSignatures) return;
      setSignatures((prev) => prev.filter((s) => s.id !== signatureId));
    };

    socketService.on('add_signature_live', handleAddSig);
    socketService.on('remove_signature_live', handleRemoveSig);

    const flushPositionUpdatesToState = () => {
      if (!setSignatures || incomingPositionUpdatesRef.current.size === 0) return;

      setSignatures((prev) => {
        let hasChanges = false;
        const next = prev.map((sig) => {
          const data = incomingPositionUpdatesRef.current.get(sig.id);
          if (!data) return sig;

          if (String(sig.userId || sig.signerId) === String(currentUserId)) {
            return sig;
          }

          hasChanges = true;
          return {
            ...sig,
            positionX: data.positionX ?? sig.positionX,
            positionY: data.positionY ?? sig.positionY,
            width: data.width ?? sig.width,
            height: data.height ?? sig.height,
            pageNumber: data.pageNumber ?? sig.pageNumber,
          };
        });

        return hasChanges ? next : prev;
      });

      incomingPositionUpdatesRef.current.clear();
    };

    const handlePositionUpdate = (data) => {
      if (!data?.signatureId || !setSignatures) return;
      incomingPositionUpdatesRef.current.set(data.signatureId, data);

      if (flushPositionTimerRef.current) {
        clearTimeout(flushPositionTimerRef.current);
      }

      flushPositionTimerRef.current = setTimeout(() => {
        flushPositionTimerRef.current = null;
        flushPositionUpdatesToState();
      }, 500);
    };

    socketService.on('update_signature_position', handlePositionUpdate);

    // ── Signature final dari user lain — NO REFRESH ───────────────────────
    const handleSigSaved = (data) => {
      if (!data?.userId) return;
      if (String(data.userId) === String(currentUserId)) return;

      const key = String(data.userId);
      // Dedup berbasis Set: backend broadcast `signature_saved` ke 2 room
      // (document + group), jadi event ini fire 2x. Cek dulu SEBELUM update
      // state & alert. `alert` blocking, kalau pakai timestamp window pendek,
      // event ke-2 yang queued di balik alert bisa lolos saat user lambat
      // menutup alert pertama. Set di-mutate sync sebelum alert → event ke-2
      // pasti ter-skip.
      if (alertedSignersRef.current.has(key)) return;
      alertedSignersRef.current.add(key);

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
        setPendingSigners((prev) => {
          const next = prev.filter((s) => String(s.userId) !== String(data.userId));
          // Sinkronkan readyToFinalize secara realtime: kalau ini signer
          // terakhir (next.length === 0), admin harus bisa langsung
          // melihat tombol "Finalisasi Dokumen" tanpa refresh halaman.
          // Tanpa ini, admin yang tidak ikut menandatangani akan terjebak
          // di mode 'sign' sampai dia refresh manual.
          if (next.length === 0 && setReadyToFinalize) {
            setReadyToFinalize(true);
          }
          return next;
        });
      }

      // Tampilkan notifikasi TTD masuk via toast (non-blocking)
      toast.info(`${data.userName || 'Seseorang'} telah menandatangani dokumen.`);
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
          // [H-3] cbRefs.current pakai callback terbaru.
          cbRefs.current.onRefresh?.(true);
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
          cbRefs.current.onRefreshSigning?.();
          cbRefs.current.onRefresh?.(true);
          break;

        default:
          cbRefs.current.onRefresh?.(true);
      }
    };

    socketService.onGroupDocumentUpdate(handleGroupDocUpdate);

    // ── Group Member Update (join, kick) ──────────────────────────────────
    const handleGroupMemberUpdate = (data) => {
      if (!data?.action) return;

      switch (data.action) {
        case 'new_member':
          // [H-3] cbRefs.current pakai callback terbaru.
          cbRefs.current.onRefresh?.(true);
          break;

        case 'kicked':
          if (String(data.userId) === String(currentUserId)) {
            setStatusModal?.({
              isOpen: true, type: 'error',
              title: 'Anda Dikeluarkan',
              message: 'Admin telah mengeluarkan Anda dari grup ini.',
              onConfirm: () => {
                cbRefs.current.onKicked?.();
              },
            });
          } else {
            cbRefs.current.onRefresh?.(true);
          }
          break;

        default:
          cbRefs.current.onRefresh?.(true);
      }
    };

    socketService.on('group_member_update', handleGroupMemberUpdate);

    // ── Group Info Update ─────────────────────────────────────────────────
    const handleGroupInfoUpdate = () => {
      // [H-3] cbRefs.current pakai callback terbaru.
      cbRefs.current.onRefresh?.();
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
      socketService.off('update_signature_position', handlePositionUpdate);
      socketService.off('signature_saved', handleSigSaved);
      socketService.off('group_member_update', handleGroupMemberUpdate);
      socketService.off('group_info_update', handleGroupInfoUpdate);
      socketService.offGroupDocumentUpdate(handleGroupDocUpdate);
      if (typeof unsubConn === 'function') unsubConn();
      if (flushPositionTimerRef.current) {
        clearTimeout(flushPositionTimerRef.current);
        flushPositionTimerRef.current = null;
      }
      incomingPositionUpdatesRef.current.clear();
      // [CR-2] Defense-in-depth: clear Set di cleanup juga, supaya next
      // mount dimulai dengan tracker bersih (selain reset di setup).
      alertedSignersRef.current.clear();
    };
    // [Lint] State setters (setSignatures, setPendingSigners, setReadyToFinalize,
    // setDocumentStatus, setStatusModal) adalah hasil dari useState di parent
    // komponen — mereka guaranteed stable identity oleh React (tidak berubah
    // antar render). Memasukkan ke deps array akan trigger re-bind socket
    // listener yang tidak perlu (mahal — disconnect/reconnect). Effect ini
    // intentionally hanya re-bind saat documentId/groupId/currentUserId/ready
    // berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, groupId, currentUserId, ready]);

  return { activeUsers, socketStatus };
};
