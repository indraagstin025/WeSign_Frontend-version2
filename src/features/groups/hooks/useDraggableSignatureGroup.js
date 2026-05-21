import { useEffect, useMemo, useRef, useState } from 'react';
import { useDraggableSignature } from '../../signature/hooks/useDraggableSignature';
import { socketService } from '../../../services/socketService';
import {
  SIGNATURE_VISUAL_PADDING,
  SIGNATURE_SOCKET_THROTTLE_MS,
} from '../constants/groupSignatureLayout';

// [L-2] Aliases lokal — agar diff perubahan minimal dan kode existing
// tidak perlu massive rename. Konsumer baru pakai konstanta dari import.
const VISUAL_PADDING = SIGNATURE_VISUAL_PADDING;
const TOTAL_PADDING = VISUAL_PADDING * 2;
const SOCKET_THROTTLE_MS = SIGNATURE_SOCKET_THROTTLE_MS;

// Throttle leading-only — sama dengan implementasi yang work smooth di
// repo lama (utils/throttle.js). Trailing call tidak diperlukan karena:
//   - Drag move emit setiap window (16ms) — natural granularity drag yang
//     diterima user lain
//   - Drop akhir di-emit lewat onDragStop (wrappedOnUpdatePosition) yang
//     langsung emit tanpa throttle, jadi posisi final TIDAK akan hilang.
//   - Tambah trailing call malah bisa double-emit di edge case (drag end
//     fire emit terakhir, lalu trailing fire emit sama lagi).
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * @hook useDraggableSignatureGroup
 * @description Logic kompleks untuk DraggableSignatureGroup:
 *  - Ownership check
 *  - Socket realtime sync (drag/resize remote)
 *  - Throttled emit
 *  - Wrapping update callbacks dengan ownership guard
 *  - Visual state derivation (rings, locks, classes)
 *
 * @param {object} args
 * @param {object} args.sig - Objek signature.
 * @param {number} args.containerWidth
 * @param {number} args.containerHeight
 * @param {object} args.currentUser
 * @param {string} args.documentId
 * @param {(id, x, y) => void} args.onUpdatePosition
 * @param {(id, w, h) => void} args.onUpdateSize
 * @param {boolean} [args.readOnly=false]
 */
export function useDraggableSignatureGroup({
  sig,
  containerWidth,
  containerHeight,
  currentUser,
  documentId,
  onUpdatePosition,
  onUpdateSize,
  readOnly = false,
}) {
  // ── Kepemilikan & Interaktivitas ─────────────────────────────────────────
  const isOwner = useMemo(() => {
    if (!currentUser) return false;
    const ownerId = sig.userId || sig.signerId;
    return String(ownerId) === String(currentUser.id);
  }, [currentUser, sig]);

  const isFinal = sig.status === 'final';
  const canInteract = isOwner && !isFinal && !readOnly;

  // ── Remote Sync State ────────────────────────────────────────────────────
  const [isRemoteActive, setIsRemoteActive] = useState(false);
  const [isLockedByRemote, setIsLockedByRemote] = useState(false);
  const remoteTimerRef = useRef(null);

  // ── Throttled Socket Drag Emit ───────────────────────────────────────────
  const emitDragThrottled = useMemo(
    () =>
      throttle((posData) => {
        if (documentId) socketService.emitSignatureUpdate({ documentId, signatureId: sig.id, ...posData });
      }, SOCKET_THROTTLE_MS),
    [documentId, sig.id]
  );

  // ── Throttled Socket Resize Emit ──────────────────────────────────────
  const emitResizeThrottled = useMemo(
    () =>
      throttle((w, h) => {
        if (documentId) {
          socketService.emitSignatureUpdate({
            documentId,
            signatureId: sig.id,
            positionX: sig.positionX,
            positionY: sig.positionY,
            width: w,
            height: h,
            pageNumber: sig.pageNumber,
          });
        }
      }, SOCKET_THROTTLE_MS),
    [documentId, sig.id, sig.positionX, sig.positionY, sig.pageNumber]
  );

  // Wrap onUpdatePosition dengan guard ownership + status.
  // [FIX] Guard `isFinal`: cegah PATCH otomatis dari `handleImageLoad` untuk
  // signature yang sudah final. Backend reject 400 (status guard
  // `updateDraftPosition`) → entry masuk outbox → "Antri offline".
  const wrappedOnUpdatePosition = useMemo(
    () => (id, x, y) => {
      if (!isOwner || isFinal) return;
      onUpdatePosition(id, x, y);
      if (documentId) {
        socketService.emitSignatureUpdate({
          documentId,
          signatureId: id,
          positionX: x,
          positionY: y,
          width: sig.width,
          height: sig.height,
          pageNumber: sig.pageNumber,
        });
      }
    },
    [onUpdatePosition, documentId, sig.width, sig.height, sig.pageNumber, isOwner, isFinal]
  );

  // Wrap onUpdateSize dengan guard ownership + status (sama alasan).
  const wrappedOnUpdateSize = useMemo(
    () => (id, w, h) => {
      if (!isOwner || isFinal) return;
      onUpdateSize(id, w, h);
      emitResizeThrottled(w, h);
    },
    [onUpdateSize, emitResizeThrottled, isOwner, isFinal]
  );

  // Realtime resize emit
  const onResizeMove = useMemo(
    () =>
      throttle((w, h, x, y) => {
        if (!documentId || !isOwner) return;
        socketService.emitSignatureUpdate({
          documentId,
          signatureId: sig.id,
          positionX: x,
          positionY: y,
          width: w,
          height: h,
          pageNumber: sig.pageNumber,
        });
      }, SOCKET_THROTTLE_MS),
    [documentId, sig.id, sig.pageNumber, isOwner]
  );

  // ── useDraggableSignature (lower-level) ───────────────────────────────────
  const { state, actions } = useDraggableSignature(
    sig,
    containerWidth,
    containerHeight,
    wrappedOnUpdatePosition,
    wrappedOnUpdateSize,
    onResizeMove
  );

  // Capture remote setters via ref agar useEffect socket di bawah tidak
  // re-subscribe setiap render.
  const setControlledPositionRef = useRef(actions.setControlledPosition);
  const setControlledSizeRef = useRef(actions.setControlledSize);
  useEffect(() => {
    setControlledPositionRef.current = actions.setControlledPosition;
    setControlledSizeRef.current = actions.setControlledSize;
  }, [actions.setControlledPosition, actions.setControlledSize]);

  // [REALTIME-PERF] Buffer remote update di ref + rAF-batched React commit.
  //
  // Pattern hybrid yang di-port dari project lama (PlacedSignatureGroup +
  // useSignatureManagerGroup) yang user konfirmasi smooth visual untuk
  // observer (peer yang lihat user lain drag).
  //
  // Strategi 2-layer:
  //   1. Direct DOM update (style.transform/width/height) di handler —
  //      bypass React render, native compositor handle 60fps smooth.
  //   2. React state commit di-batch via requestAnimationFrame — cegah
  //      parent rerender thrashing tiap event 30ms throttle. rAF natural
  //      dedup ke 60fps (16ms): kalau ada update baru sebelum frame next,
  //      pakai data terbaru saja saat commit.
  //
  //      rAF preferred dibanding setTimeout 100ms karena:
  //      - Kalau parent rerender karena state lain, react-draggable akan
  //        apply controlledPosition prop yang masih lama (state belum
  //        commit) → flick balik ke posisi lama. rAF commit dalam 1 frame
  //        cegah window race ini.
  //      - Browser optimize rAF callback dengan paint cycle, lebih smooth
  //        secara visual.
  const pendingRemoteRef = useRef(null);
  const remoteRafRef = useRef(null);

  // ── Socket: Realtime drag dari user lain ──────────────────────────────
  useEffect(() => {
    const handleRemoteMove = (data) => {
      if (data.signatureId !== sig.id) return;
      if (isOwner) return; // Jangan override posisi milik sendiri

      const outerX = Math.round(data.positionX * containerWidth - VISUAL_PADDING);
      const outerY = Math.round(data.positionY * containerHeight - VISUAL_PADDING);

      // === LAYER 1: Direct DOM update (bypass React) ===
      const node = state.nodeRef?.current;
      if (node) {
        node.style.transform = `translate(${outerX}px, ${outerY}px)`;
        if (data.width !== undefined && data.height !== undefined) {
          const outerW = Math.round(data.width * containerWidth + TOTAL_PADDING);
          const outerH = Math.round(data.height * containerHeight + TOTAL_PADDING);
          node.style.width = `${outerW}px`;
          node.style.height = `${outerH}px`;
        }
      }

      // === LAYER 2: rAF-batched React state commit (latest-wins) ===
      pendingRemoteRef.current = data;

      if (remoteRafRef.current === null) {
        remoteRafRef.current = requestAnimationFrame(() => {
          remoteRafRef.current = null;
          const latest = pendingRemoteRef.current;
          if (!latest) return;
          pendingRemoteRef.current = null;

          const finalX = Math.round(latest.positionX * containerWidth - VISUAL_PADDING);
          const finalY = Math.round(latest.positionY * containerHeight - VISUAL_PADDING);

          setControlledPositionRef.current({ x: finalX, y: finalY });

          if (latest.width !== undefined && latest.height !== undefined) {
            const finalW = Math.round(latest.width * containerWidth + TOTAL_PADDING);
            const finalH = Math.round(latest.height * containerHeight + TOTAL_PADDING);
            setControlledSizeRef.current({ width: finalW, height: finalH });
          }
        });
      }

      // Visual feedback (toast/ring) — pakai state karena cuma flag boolean
      setIsRemoteActive(true);
      setIsLockedByRemote(true);
      if (remoteTimerRef.current) clearTimeout(remoteTimerRef.current);
      remoteTimerRef.current = setTimeout(() => {
        setIsRemoteActive(false);
        setIsLockedByRemote(false);
      }, 800);
    };

    socketService.on('update_signature_position', handleRemoteMove);
    return () => {
      socketService.off('update_signature_position', handleRemoteMove);
      if (remoteTimerRef.current) clearTimeout(remoteTimerRef.current);
      if (remoteRafRef.current !== null) {
        cancelAnimationFrame(remoteRafRef.current);
        remoteRafRef.current = null;
      }
      pendingRemoteRef.current = null;
    };
  }, [sig.id, isOwner, containerWidth, containerHeight, state.nodeRef]);

  // ── Drag handler (emit throttled) ────────────────────────────────────────
  const handleDrag = (e, data) => {
    actions.onDrag(e, data);
    const innerX = (data.x + VISUAL_PADDING) / containerWidth;
    const innerY = (data.y + VISUAL_PADDING) / containerHeight;
    emitDragThrottled({
      positionX: innerX,
      positionY: innerY,
      width: sig.width,
      height: sig.height,
      pageNumber: sig.pageNumber,
    });
  };

  // ── Visual classes ───────────────────────────────────────────────────────
  const isVisible = state.isActive || state.isDragging;

  let ringClass = '';
  if (isFinal && isOwner) ringClass = 'ring-2 ring-emerald-400';
  else if (isRemoteActive) ringClass = 'ring-2 ring-emerald-400 ring-offset-1';
  else if (state.isActive && canInteract) ringClass = 'ring-2 ring-blue-500';
  else if (!isOwner) ringClass = 'ring-1 ring-zinc-300/50';

  const outerBorderClass =
    state.isActive && canInteract
      ? 'border border-blue-500 bg-white/40 shadow-sm'
      : 'border border-transparent';

  // Pattern transition sama dengan repo lama:
  //   - Saat owner drag/resize sendiri: NO transition (lihat
  //     DraggableSignatureGroup.jsx, react-draggable handle native)
  //   - Saat remote update: 100ms linear → smooth interpolation antar
  //     event throttled 30ms. Cukup pendek untuk responsive, cukup
  //     panjang untuk visual blend antar emit.
  const transitionStyle =
    !isOwner && isRemoteActive
      ? 'transform 100ms linear, width 100ms linear, height 100ms linear'
      : 'none';

  return {
    state: {
      ...state,
      isOwner,
      isFinal,
      canInteract,
      isRemoteActive,
      isLockedByRemote,
      isVisible,
      ringClass,
      outerBorderClass,
      transitionStyle,
      displayName: sig.signerName || 'User',
    },
    actions: {
      ...actions,
      handleDrag,
    },
  };
}
