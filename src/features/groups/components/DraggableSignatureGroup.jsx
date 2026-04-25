import React, { useEffect, useRef, useState, useMemo } from 'react';
import Draggable from 'react-draggable';
import { X, Lock } from 'lucide-react';
import { useDraggableSignature } from '../../signature/hooks/useDraggableSignature';
import { socketService } from '../../../services/socketService';

/**
 * @component DraggableSignatureGroup
 * @description Versi Group dari DraggableSignature.
 *
 * PENTING: Gunakan state.nodeRef dari useDraggableSignature untuk SEMUA referensi DOM.
 * Jangan buat nodeRef lokal terpisah — hook resize internal bergantung pada nodeRef yang sama.
 *
 * Perbedaan dari versi personal:
 * 1. Ownership check — hanya owner yang bisa drag/resize
 * 2. Status lock — jika status='final', tidak bisa digeser
 * 3. Remote sync — mendengarkan socket 'update_signature_position' dan update DOM langsung
 * 4. Visual badge — tampil nama pemilik TTD
 * 5. Remote active indicator — ring hijau saat user lain sedang drag
 */
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

const DraggableSignatureGroup = ({
  sig,
  onRemove,
  onUpdatePosition,
  onUpdateSize,
  containerWidth,
  containerHeight,
  currentUser,
  documentId,
  readOnly = false,
}) => {
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

  // ── Wrap onUpdatePosition untuk emit socket setelah drag stop ────────────
  const wrappedOnUpdatePosition = useMemo(
    () => (id, x, y) => {
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
    [onUpdatePosition, documentId, sig.width, sig.height, sig.pageNumber]
  );

  // ── Wrap onUpdateSize untuk emit socket saat resize ────────────────────
  const wrappedOnUpdateSize = useMemo(
    () => (id, w, h) => {
      onUpdateSize(id, w, h);
      // Emit resize ke socket agar user lain melihat perubahan ukuran realtime
      emitResizeThrottled(w, h);
    },
    [onUpdateSize, emitResizeThrottled]
  );

  // ── Callback realtime resize → emit socket setiap onMove ─────────────────
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

  // ── useDraggableSignature ──────────────────────────────────────────────────
  const { state, actions } = useDraggableSignature(
    sig,
    containerWidth,
    containerHeight,
    wrappedOnUpdatePosition,
    wrappedOnUpdateSize,
    onResizeMove   // ← callback realtime resize
  );

  // ── Socket: Realtime drag dari user lain ──────────────────────────────
  // DOM manipulation langsung = smooth realtime tanpa React re-render cycle
  useEffect(() => {
    const handleRemoteMove = (data) => {
      if (data.signatureId !== sig.id) return;
      if (isOwner) return; // Jangan override posisi milik sendiri

      const element = state.nodeRef.current;
      if (!element) return;

      // Konversi koordinat fraksi → pixel outer (dengan VISUAL_PADDING)
      const outerX = data.positionX * containerWidth - VISUAL_PADDING;
      const outerY = data.positionY * containerHeight - VISUAL_PADDING;

      // Update transform — Draggable pakai translate(x,y)
      element.style.transform = `translate(${Math.round(outerX)}px, ${Math.round(outerY)}px)`;

      // Update ukuran jika ada
      if (data.width !== undefined) {
        const outerW = data.width * containerWidth + TOTAL_PADDING;
        const outerH = data.height * containerHeight + TOTAL_PADDING;
        element.style.width = `${Math.round(outerW)}px`;
        element.style.height = `${Math.round(outerH)}px`;
      }

      // Visual indicator: ring hijau + lock sementara
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
  }, [sig.id, isOwner, containerWidth, containerHeight, state.nodeRef]);

  // ── Emit socket saat drag move ───────────────────────────────────────────
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

  // ── Visual Styles ────────────────────────────────────────────────────────
  const isVisible = state.isActive || state.isDragging;
  const handleBase =
    'absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full z-[60] pointer-events-auto shadow-sm active:scale-125 transition-all';

  let ringClass = '';
  if (isFinal && isOwner) ringClass = 'ring-2 ring-emerald-400';
  else if (isRemoteActive) ringClass = 'ring-2 ring-emerald-400 ring-offset-1';
  else if (state.isActive && canInteract) ringClass = 'ring-2 ring-blue-500';
  else if (!isOwner) ringClass = 'ring-1 ring-zinc-300/50';

  let outerBorderClass = '';
  if (state.isActive && canInteract) outerBorderClass = 'border border-blue-500 bg-white/40 shadow-sm';
  else outerBorderClass = 'border border-transparent';

  const displayName = sig.signerName || 'User';

  return (
    <Draggable
      nodeRef={state.nodeRef}  /* ← pakai state.nodeRef, bukan local ref */
      bounds="parent"
      disabled={!canInteract || isLockedByRemote}
      position={{
        x: Math.round(state.controlledPosition.x),
        y: Math.round(state.controlledPosition.y),
      }}
      cancel=".resize-handle, .delete-btn"
      onStart={actions.onDragStart}
      onDrag={handleDrag}
      onStop={actions.onDragStop}
    >
      <div
        ref={state.nodeRef}  /* ← pakai state.nodeRef, bukan local ref */
        onMouseDown={(e) => {
          if (!canInteract || isLockedByRemote) return;
          e.stopPropagation();
          actions.setIsActive(true);
        }}
        onTouchStart={(e) => {
          if (!canInteract || isLockedByRemote) return;
          e.stopPropagation();
          actions.setIsActive(true);
        }}
        onClick={(e) => e.stopPropagation()}
        className={`absolute group flex flex-col items-center justify-center box-border p-4 transition-opacity duration-300
          ${state.isReady ? 'opacity-100' : 'opacity-0'}
          ${outerBorderClass}
          ${ringClass}
          ${canInteract && !isLockedByRemote ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
        `}
        style={{
          width: state.localSize.width,
          height: state.localSize.height,
          left: 0,
          top: 0,
          touchAction: 'none',
          pointerEvents: (isFinal || isLockedByRemote) ? 'none' : 'auto',
          // Smooth transition untuk pergerakan realtime dari user lain
          // Disabled saat user sendiri drag (isDragging) agar tidak ada lag
          transition: (!isOwner && isRemoteActive)
            ? 'transform 80ms linear, width 80ms linear, height 80ms linear'
            : 'none',
        }}
      >
        {/* ── Nama pemilik TTD ── */}
        <div
          className={`absolute -top-7 left-0 flex items-center gap-1 transition-all duration-200
            ${isVisible || isRemoteActive ? 'opacity-100' : 'opacity-0'}`}
        >
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap
              ${isOwner ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-white'}
              ${isRemoteActive ? '!bg-emerald-500 animate-pulse' : ''}
              ${isFinal ? '!bg-emerald-600' : ''}
            `}
          >
            {isOwner ? 'Anda' : displayName}
            {isFinal && ' ✓'}
            {isRemoteActive && ' (mengedit...)'}
          </span>
        </div>

        {/* ── Tombol Hapus (hanya owner draft) ── */}
        {canInteract && (
          <div
            className={`absolute -top-10 left-1/2 -translate-x-1/2 pb-4 z-[70] transition-all duration-200
              ${isVisible ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
          >
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(sig.id); }}
              onMouseDown={(e) => e.stopPropagation()}
              className="delete-btn w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-rose-600 transition-all border-none active:scale-90 cursor-pointer"
            >
              <X size={16} strokeWidth={3} />
            </button>
          </div>
        )}

        {/* ── Resize handles (hanya owner draft) ── */}
        {canInteract && (
          <>
            <div ref={state.handleNWRef} className={`resize-handle ${handleBase} ${isVisible ? 'opacity-100' : 'opacity-0'} -top-1.5 -left-1.5 cursor-nwse-resize`} style={{ touchAction: 'none' }} />
            <div ref={state.handleNERef} className={`resize-handle ${handleBase} ${isVisible ? 'opacity-100' : 'opacity-0'} -top-1.5 -right-1.5 cursor-nesw-resize`} style={{ touchAction: 'none' }} />
            <div ref={state.handleSWRef} className={`resize-handle ${handleBase} ${isVisible ? 'opacity-100' : 'opacity-0'} -bottom-1.5 -left-1.5 cursor-nesw-resize`} style={{ touchAction: 'none' }} />
            <div ref={state.handleSERef} className={`resize-handle ${handleBase} ${isVisible ? 'opacity-100' : 'opacity-0'} -bottom-1.5 -right-1.5 cursor-nwse-resize`} style={{ touchAction: 'none' }} />
          </>
        )}

        {/* ── Lock icon untuk TTD final ── */}
        {isFinal && (
          <div className="absolute top-1 right-1 z-[60]">
            <Lock size={10} className="text-emerald-500 opacity-70" />
          </div>
        )}

        {/* ── Gambar tanda tangan ── */}
        <div
          className={`w-full h-full flex items-center justify-center box-border rounded-none
            ${state.isActive && canInteract ? 'border border-rose-400/50 bg-white/50' : 'border border-rose-400/20'}
            ${isFinal ? 'border-emerald-300/30' : ''}
          `}
        >
          <img
            src={sig.signatureImageUrl}
            alt={`Tanda tangan ${displayName}`}
            onLoad={actions.handleImageLoad}
            className="w-full h-full object-contain pointer-events-none select-none block"
            draggable={false}
            style={{ imageRendering: 'high-quality' }}
          />
        </div>
      </div>
    </Draggable>
  );
};

export default DraggableSignatureGroup;
