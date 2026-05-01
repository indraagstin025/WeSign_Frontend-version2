import { useEffect, useMemo, useRef, useState } from 'react';
import { useDraggableSignature } from '../../signature/hooks/useDraggableSignature';
import { socketService } from '../../../services/socketService';

const VISUAL_PADDING = 18;
const TOTAL_PADDING = VISUAL_PADDING * 2;

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
        if (documentId) socketService.emitDrag({ documentId, signatureId: sig.id, ...posData });
      }, 30),
    [documentId, sig.id]
  );

  // ── Throttled Socket Resize Emit ──────────────────────────────────────
  const emitResizeThrottled = useMemo(
    () =>
      throttle((w, h) => {
        if (documentId) {
          socketService.emitDrag({
            documentId,
            signatureId: sig.id,
            positionX: sig.positionX,
            positionY: sig.positionY,
            width: w,
            height: h,
            pageNumber: sig.pageNumber,
          });
        }
      }, 30),
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
        socketService.emitDrag({
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
        socketService.emitDrag({
          documentId,
          signatureId: sig.id,
          positionX: x,
          positionY: y,
          width: w,
          height: h,
          pageNumber: sig.pageNumber,
        });
      }, 30),
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
  });

  // ── Socket: Realtime drag dari user lain ──────────────────────────────
  useEffect(() => {
    const handleRemoteMove = (data) => {
      if (data.signatureId !== sig.id) return;
      if (isOwner) return; // Jangan override posisi milik sendiri

      const outerX = data.positionX * containerWidth - VISUAL_PADDING;
      const outerY = data.positionY * containerHeight - VISUAL_PADDING;

      setControlledPositionRef.current({
        x: Math.round(outerX),
        y: Math.round(outerY),
      });

      if (data.width !== undefined && data.height !== undefined) {
        const outerW = data.width * containerWidth + TOTAL_PADDING;
        const outerH = data.height * containerHeight + TOTAL_PADDING;
        setControlledSizeRef.current({
          width: Math.round(outerW),
          height: Math.round(outerH),
        });
      }

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
    };
  }, [sig.id, isOwner, containerWidth, containerHeight]);

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

  const transitionStyle =
    !isOwner && isRemoteActive
      ? 'transform 80ms linear, width 80ms linear, height 80ms linear'
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
