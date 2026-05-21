import React from 'react';
import Draggable from 'react-draggable';
import { X, Lock } from 'lucide-react';
import { useDraggableSignatureGroup } from '../hooks/useDraggableSignatureGroup';

/**
 * @component DraggableSignatureGroup
 * @description Versi Group dari DraggableSignature.
 * Pure presentation — semua logic (ownership, throttle, socket sync, refs)
 * berada di hook `useDraggableSignatureGroup`.
 */
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
  const { state, actions } = useDraggableSignatureGroup({
    sig,
    containerWidth,
    containerHeight,
    currentUser,
    documentId,
    onUpdatePosition,
    onUpdateSize,
    readOnly,
  });

  const {
    isOwner,
    isFinal,
    canInteract,
    isRemoteActive,
    isLockedByRemote,
    isVisible,
    isReady,
    isActive,
    nodeRef,
    handleNWRef,
    handleNERef,
    handleSWRef,
    handleSERef,
    controlledPosition,
    localSize,
    ringClass,
    outerBorderClass,
    transitionStyle,
    displayName,
  } = state;

  // Hit area lebih besar di mobile (28px) untuk jari, visual dot tetap 12px.
  // Negative offset disesuaikan agar pusat handle tetap di pojok signature.
  // Mobile: -top-3.5 -left-3.5 = -14px (separuh 28). Desktop: -top-1.5 = -6px (separuh 12).
  const handleHitArea =
    'resize-handle absolute z-[60] flex items-center justify-center pointer-events-auto shadow-sm transition-all w-7 h-7 sm:w-3 sm:h-3';
  const handleVisual =
    'block w-3 h-3 bg-blue-500 border-2 border-white rounded-full active:scale-125 transition-transform pointer-events-none';

  return (
    <Draggable
      nodeRef={nodeRef}
      bounds="parent"
      disabled={!canInteract || isLockedByRemote}
      position={{
        x: Math.round(controlledPosition.x),
        y: Math.round(controlledPosition.y),
      }}
      cancel=".resize-handle, .delete-btn"
      onStart={actions.onDragStart}
      onDrag={actions.handleDrag}
      onStop={actions.onDragStop}
    >
      <div
        ref={nodeRef}
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
          ${isReady ? 'opacity-100' : 'opacity-0'}
          ${outerBorderClass}
          ${ringClass}
          ${canInteract && !isLockedByRemote ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
        `}
        style={{
          width: localSize.width,
          height: localSize.height,
          left: 0,
          top: 0,
          touchAction: 'none',
          pointerEvents: (isFinal || isLockedByRemote) ? 'none' : 'auto',
          transition: transitionStyle,
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
            <div ref={handleNWRef} className={`${handleHitArea} ${isVisible ? 'opacity-100' : 'opacity-0'} -top-3.5 sm:-top-1.5 -left-3.5 sm:-left-1.5 cursor-nwse-resize`} style={{ touchAction: 'none' }}>
              <span className={handleVisual} />
            </div>
            <div ref={handleNERef} className={`${handleHitArea} ${isVisible ? 'opacity-100' : 'opacity-0'} -top-3.5 sm:-top-1.5 -right-3.5 sm:-right-1.5 cursor-nesw-resize`} style={{ touchAction: 'none' }}>
              <span className={handleVisual} />
            </div>
            <div ref={handleSWRef} className={`${handleHitArea} ${isVisible ? 'opacity-100' : 'opacity-0'} -bottom-3.5 sm:-bottom-1.5 -left-3.5 sm:-left-1.5 cursor-nesw-resize`} style={{ touchAction: 'none' }}>
              <span className={handleVisual} />
            </div>
            <div ref={handleSERef} className={`${handleHitArea} ${isVisible ? 'opacity-100' : 'opacity-0'} -bottom-3.5 sm:-bottom-1.5 -right-3.5 sm:-right-1.5 cursor-nwse-resize`} style={{ touchAction: 'none' }}>
              <span className={handleVisual} />
            </div>
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
            ${isActive && canInteract ? 'border border-rose-400/50 bg-white/50' : 'border border-rose-400/20'}
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
