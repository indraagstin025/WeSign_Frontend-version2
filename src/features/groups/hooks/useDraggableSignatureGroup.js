import { useEffect, useMemo, useRef, useState } from 'react';
import { useGroupDraggableRef } from './useGroupDraggableRef';
import { socketService } from '../../../services/socketService';
import {
  SIGNATURE_DRAG_SOCKET_THROTTLE_MS,
  SIGNATURE_VISUAL_PADDING,
  SIGNATURE_SOCKET_THROTTLE_MS,
} from '../constants/groupSignatureLayout';

// [L-2] Aliases lokal — agar diff perubahan minimal dan kode existing
// tidak perlu massive rename. Konsumer baru pakai konstanta dari import.
const VISUAL_PADDING = SIGNATURE_VISUAL_PADDING;
const TOTAL_PADDING = VISUAL_PADDING * 2;
const DRAG_SOCKET_THROTTLE_MS = SIGNATURE_DRAG_SOCKET_THROTTLE_MS;
const RESIZE_SOCKET_THROTTLE_MS = SIGNATURE_SOCKET_THROTTLE_MS;

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

function adaptiveThrottle(func, getLimit) {
  let lastRun = 0;
  return function (...args) {
    const now = Date.now();
    const limit = getLimit();
    if (now - lastRun >= limit) {
      lastRun = now;
      func.apply(this, args);
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
  const remoteActiveRef = useRef(false);
  const remoteResizeTimerRef = useRef(null);
  const [, setIsRemoteResizing] = useState(false);
  const socketSeqRef = useRef(0);
  const lastRemoteSeqRef = useRef(0);
  const remoteDiagnosticsRef = useRef({
    count: 0,
    lastAt: 0,
    totalInterval: 0,
    totalLatency: 0,
    lastLogAt: 0,
  });

  const createSocketPayload = useMemo(
    () => (kind, payload) => ({
      documentId,
      signatureId: sig.id,
      ...payload,
      kind,
      seq: ++socketSeqRef.current,
      sentAt: Date.now(),
    }),
    [documentId, sig.id]
  );

  // ── Throttled Socket Drag Emit ───────────────────────────────────────────
  const emitDragThrottled = useMemo(
    () =>
      adaptiveThrottle((posData) => {
        if (documentId) {
          socketService.emitSignatureUpdate(
            createSocketPayload('drag', posData),
            { volatile: true }
          );
        }
      }, () => {
        const transport = socketService.getTransport?.();
        return transport === 'websocket' ? DRAG_SOCKET_THROTTLE_MS : RESIZE_SOCKET_THROTTLE_MS;
      }),
    [documentId, createSocketPayload]
  );

  // ── Throttled Socket Resize Emit ──────────────────────────────────────
  const emitResizeThrottled = useMemo(
    () =>
      throttle((w, h) => {
        if (documentId) {
          socketService.emitSignatureUpdate(
            createSocketPayload('resize', {
              positionX: sig.positionX,
              positionY: sig.positionY,
              width: w,
              height: h,
              pageNumber: sig.pageNumber,
            }),
            { volatile: true }
          );
        }
      }, RESIZE_SOCKET_THROTTLE_MS),
    [documentId, sig.positionX, sig.positionY, sig.pageNumber, createSocketPayload]
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
        socketService.emitSignatureUpdate(createSocketPayload('drag-end', {
          signatureId: id,
          positionX: x,
          positionY: y,
          width: sig.width,
          height: sig.height,
          pageNumber: sig.pageNumber,
        }));
      }
    },
    [onUpdatePosition, documentId, sig.width, sig.height, sig.pageNumber, isOwner, isFinal, createSocketPayload]
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
        socketService.emitSignatureUpdate(
          createSocketPayload('resize', {
            positionX: x,
            positionY: y,
            width: w,
            height: h,
            pageNumber: sig.pageNumber,
          }),
          { volatile: true }
        );
      }, RESIZE_SOCKET_THROTTLE_MS),
    [documentId, sig.pageNumber, isOwner, createSocketPayload]
  );

  const onResizeEnd = useMemo(
    () => (w, h, x, y) => {
      if (!documentId || !isOwner) return;
      socketService.emitSignatureUpdate(
        createSocketPayload('resize-end', {
          positionX: x,
          positionY: y,
          width: w,
          height: h,
          pageNumber: sig.pageNumber,
        })
      );
    },
    [documentId, sig.pageNumber, isOwner, createSocketPayload]
  );

  // ── useGroupDraggableRef (lower-level, ref-based, no setState per drag) ──
  const { state, actions } = useGroupDraggableRef(
    sig,
    containerWidth,
    containerHeight,
    wrappedOnUpdatePosition,
    wrappedOnUpdateSize,
    onResizeMove,
    onResizeEnd
  );

  // Capture remote setter via ref agar useEffect socket di bawah tidak
  // re-subscribe setiap render.
  const setPositionFromRemoteRef = useRef(actions.setPositionFromRemote);
  useEffect(() => {
    setPositionFromRemoteRef.current = actions.setPositionFromRemote;
  }, [actions.setPositionFromRemote]);

  // [REALTIME-PERF] Pattern direct DOM update untuk remote drag — sama
  // dengan project lama (PlacedSignatureGroup) yang user konfirmasi smooth.
  //
  // useGroupDraggableRef pegang position di useRef (bukan useState), jadi
  // setPositionFromRemote = manipulasi DOM langsung tanpa React reconciliation.
  // Tidak ada state thrashing, tidak ada race antara controlled prop vs DOM.

  // ── Socket: Realtime drag dari user lain ──────────────────────────────
  useEffect(() => {
    const handleRemoteMove = (data) => {
      if (data.signatureId !== sig.id) return;
      if (isOwner) return; // Jangan override posisi milik sendiri
      if (typeof data.seq === 'number' && data.seq <= lastRemoteSeqRef.current) return;
      if (typeof data.seq === 'number') lastRemoteSeqRef.current = data.seq;

      const outerX = data.positionX * containerWidth - VISUAL_PADDING;
      const outerY = data.positionY * containerHeight - VISUAL_PADDING;
      let outerW, outerH;
      let hasRemoteSize = false;
      if (data.width !== undefined && data.height !== undefined) {
        outerW = Math.round(data.width * containerWidth + TOTAL_PADDING);
        outerH = Math.round(data.height * containerHeight + TOTAL_PADDING);
        hasRemoteSize =
          Math.abs(outerW - state.positionRef.current.w) > 1 ||
          Math.abs(outerH - state.positionRef.current.h) > 1;
      }

      // Direct DOM update — bypass React render. Native compositor handle
      // smooth 60fps di GPU thread.
      setPositionFromRemoteRef.current(
        outerX,
        outerY,
        hasRemoteSize ? outerW : undefined,
        hasRemoteSize ? outerH : undefined,
        { immediate: data.kind === 'drag-end' || data.kind === 'resize-end' }
      );

      const now = Date.now();
      const diag = remoteDiagnosticsRef.current;
      if (diag.lastAt) diag.totalInterval += now - diag.lastAt;
      if (typeof data.sentAt === 'number') diag.totalLatency += Math.max(0, now - data.sentAt);
      diag.lastAt = now;
      diag.count += 1;
      if (diag.count >= 30 && now - diag.lastLogAt > 5000) {
        const avgInterval = diag.totalInterval / Math.max(1, diag.count - 1);
        const avgLatency = diag.totalLatency / diag.count;
        console.debug(
          `[GroupSignatureRemote] ${sig.id} interval=${avgInterval.toFixed(1)}ms latency=${avgLatency.toFixed(1)}ms transport=${socketService.getTransport?.() || 'unknown'}`
        );
        remoteDiagnosticsRef.current = {
          count: 0,
          lastAt: now,
          totalInterval: 0,
          totalLatency: 0,
          lastLogAt: now,
        };
      }

      // Visual feedback cukup toggle saat idle -> aktif. Jangan setState di
      // setiap socket frame karena itu membuat observer re-render terus.
      if (!remoteActiveRef.current) {
        remoteActiveRef.current = true;
        setIsRemoteActive(true);
        setIsLockedByRemote(true);
      }
      if (remoteTimerRef.current) clearTimeout(remoteTimerRef.current);
      remoteTimerRef.current = setTimeout(() => {
        remoteActiveRef.current = false;
        setIsRemoteActive(false);
        setIsLockedByRemote(false);
      }, 800);

      if (hasRemoteSize) {
        setIsRemoteResizing(true);
        if (remoteResizeTimerRef.current) clearTimeout(remoteResizeTimerRef.current);
        remoteResizeTimerRef.current = setTimeout(() => {
          setIsRemoteResizing(false);
        }, 160);
      }
    };

    socketService.on('update_signature_position', handleRemoteMove);
    return () => {
      socketService.off('update_signature_position', handleRemoteMove);
      if (remoteTimerRef.current) clearTimeout(remoteTimerRef.current);
      if (remoteResizeTimerRef.current) clearTimeout(remoteResizeTimerRef.current);
    };
  }, [sig.id, isOwner, containerWidth, containerHeight, state.positionRef]);

  // ── Drag handler (emit throttled) ────────────────────────────────────────
  const handleDrag = (e, data) => {
    actions.onDrag(e, data);
    const innerX = (data.x + VISUAL_PADDING) / containerWidth;
    const innerY = (data.y + VISUAL_PADDING) / containerHeight;
    emitDragThrottled({
      positionX: innerX,
      positionY: innerY,
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

  // Pattern transition sama dengan project lama:
  //   - Saat owner drag/resize sendiri: NO transition (lihat
  //     DraggableSignatureGroup.jsx, react-draggable handle native)
  //   - Saat remote update: 100ms linear → smooth interpolation antar
  //     event throttled 30ms. Cukup pendek untuk responsive, cukup
  //     panjang untuk visual blend antar emit.
  // Browser compositor menghaluskan preview observer di antara socket frame.
  const transitionStyle = 'none';

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
