import { memo } from 'react';
import { X } from 'lucide-react';
import { useInteractSignatureGroup } from '../hooks/useInteractSignatureGroup';
import { CSS_PADDING } from '../utils/signatureBoxGeometry';

/**
 * @file InteractSignatureGroup.jsx
 * @description Komponen drag/resize signature pakai pattern interact.js +
 *   positionRef + direct DOM manipulation.
 *
 *   Pure presentation — semua stateful logic (ownership, refs, effects,
 *   interact.js setup, socket sync) ada di hook
 *   `useInteractSignatureGroup`.
 *
 *   Pattern ini berbeda dari `DraggableSignatureGroup.jsx` yang pakai
 *   `react-draggable` + React state. DraggableSignatureGroup dipertahankan
 *   sebagai fallback.
 *
 *   Keunggulan pattern ini:
 *   - Drag/resize TIDAK trigger React render (manipulasi DOM langsung).
 *   - Posisi disimpan di `positionRef` (mutable ref), bukan state.
 *   - Remote update via direct DOM, bypass React reconciliation.
 *   - Hasilnya: 60fps native compositor smooth tanpa overhead React.
 */

const InteractSignatureGroup = ({
  sig,
  onRemove,
  onUpdatePosition,
  onUpdateSize,
  // containerWidth + containerHeight di-receive untuk konsistensi API dengan
  // DraggableSignatureGroup, walau interact.js path baca parent rect runtime.
  // eslint-disable-next-line no-unused-vars
  containerWidth,
  // eslint-disable-next-line no-unused-vars
  containerHeight,
  currentUser,
  documentId,
  readOnly = false,
}) => {
  const {
    elementRef,
    isOwner,
    isFinal,
    canInteract,
    isActive,
    isDragging,
    isResizing,
    isRemoteActive,
    isLockedByRemote,
    setIsActive,
    handleImageLoad,
  } = useInteractSignatureGroup({
    sig,
    onUpdatePosition,
    onUpdateSize,
    currentUser,
    documentId,
    readOnly,
  });

  const displayName = sig.signerName || 'User';

  // Style classes
  let borderClass = 'border border-transparent';
  if (isActive && canInteract) borderClass = 'border border-blue-500';
  else if (isRemoteActive) borderClass = 'border border-emerald-500 ring-2 ring-emerald-200';
  else if (isFinal) borderClass = 'border border-emerald-500/40';
  else if (canInteract) borderClass = 'hover:border hover:border-blue-300 hover:border-dashed';

  const handleStyle =
    'resize-handle absolute z-[60] pointer-events-auto flex items-center justify-center w-7 h-7 sm:w-5 sm:h-5 touch-none';

  return (
    <div
      ref={elementRef}
      className={`placed-signature-item absolute select-none ${
        isDragging || isResizing ? 'touch-none' : ''
      } group flex flex-col ${
        isActive || isRemoteActive ? 'z-50' : 'z-10'
      }`}
      style={{
        left: 0,
        top: 0,
        // Init transform — useEffect calculatePosition akan replace.
        transform: `translate(0px, 0px)`,
        // Transition smooth saat REMOTE update; kosong saat owner drag/resize.
        transition: isDragging || isResizing ? 'none' : 'transform 0.1s linear',
        cursor: !canInteract ? 'default' : isDragging ? 'grabbing' : 'grab',
        pointerEvents: isLockedByRemote || isFinal ? 'none' : 'auto',
        touchAction: 'none',
        // [SMOOTH-RESIZE] Saat user aktif drag/resize/active atau peer
        // sedang ber-edit (animateRemoteBox aktif), hint browser untuk
        // pre-allocate compositor layer dengan dimensi. Tanpa ini, perubahan
        // width/height per frame trigger main thread reflow → stutter.
        // Saat idle balik ke 'transform' atau 'auto' supaya tidak waste GPU.
        willChange:
          (canInteract && (isDragging || isResizing || isActive)) || isRemoteActive
            ? 'transform, width, height'
            : canInteract
              ? 'transform'
              : 'auto',
      }}
      data-id={sig.id}
      onMouseDown={(e) => {
        if (canInteract && !isLockedByRemote) {
          e.stopPropagation();
          setIsActive(true);
        }
      }}
    >
      <div
        style={{ padding: `${CSS_PADDING}px` }}
        className={`relative w-full h-full ${
          // [SMOOTH-RESIZE] Disable transition saat owner drag/resize atau
          // peer remote-active. transition-all me-restart animation queue
          // tiap perubahan width/height parent → cumulative stutter.
          isDragging || isResizing || isRemoteActive ? '' : 'transition-all duration-200'
        } ${
          isActive || isRemoteActive ? 'bg-white/80 shadow-lg' : ''
        } ${borderClass}`}
      >
        {/* Toolbar (delete) */}
        {isActive && canInteract && !isLockedByRemote && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 z-[70] pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.(sig.id);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="delete-btn w-7 h-7 bg-rose-500 text-white rounded-md flex items-center justify-center shadow-md hover:bg-rose-600 transition-colors border-none cursor-pointer"
              title="Hapus tanda tangan"
            >
              <X size={14} strokeWidth={3} />
            </button>
          </div>
        )}

        {/* Resize handles — pakai class names supaya interact.js edges
            mapping bisa pinpoint corner mana yang di-grab.
            Cuma 4 corner (no edge tengah) supaya resize selalu 2-axis
            dengan aspect ratio lock. */}
        {isActive && canInteract && !isLockedByRemote && (
          <>
            <div className={`${handleStyle} resize-nw -top-3.5 -left-3.5 sm:-top-2.5 sm:-left-2.5 cursor-nw-resize`}>
              <span className="block w-3 h-3 rounded-full bg-white border-2 border-blue-500 shadow-sm pointer-events-none" />
            </div>
            <div className={`${handleStyle} resize-ne -top-3.5 -right-3.5 sm:-top-2.5 sm:-right-2.5 cursor-ne-resize`}>
              <span className="block w-3 h-3 rounded-full bg-white border-2 border-blue-500 shadow-sm pointer-events-none" />
            </div>
            <div className={`${handleStyle} resize-sw -bottom-3.5 -left-3.5 sm:-bottom-2.5 sm:-left-2.5 cursor-sw-resize`}>
              <span className="block w-3 h-3 rounded-full bg-white border-2 border-blue-500 shadow-sm pointer-events-none" />
            </div>
            <div className={`${handleStyle} resize-se -bottom-3.5 -right-3.5 sm:-bottom-2.5 sm:-right-2.5 cursor-se-resize`}>
              <span className="block w-3 h-3 rounded-full bg-white border-2 border-blue-500 shadow-sm pointer-events-none" />
            </div>
          </>
        )}

        {/* Remote-active label */}
        {isRemoteActive && (
          <div className="absolute -top-6 left-0 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded shadow-sm z-[60] whitespace-nowrap animate-pulse">
            {displayName} sedang mengedit...
          </div>
        )}

        {/* Owner label saat active */}
        {isActive && !isRemoteActive && isOwner && (
          <div className="absolute -top-7 left-0">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-sm whitespace-nowrap">
              Anda
            </span>
          </div>
        )}

        {/* Signature image */}
        <div className="w-full h-full p-1 box-border flex items-center justify-center">
          <div
            className={`w-full h-full overflow-hidden ${
              // [SMOOTH-RESIZE] Sama dengan parent — disable transition saat
              // user aktif atau peer remote-edit.
              isDragging || isResizing || isRemoteActive ? '' : 'transition-all duration-200'
            } ${
              isActive && canInteract ? 'bg-white/80 shadow-lg border-rose-400 border' : 'border-transparent'
            }`}
          >
            {sig.signatureImageUrl ? (
              <img
                src={sig.signatureImageUrl}
                alt={`Tanda tangan ${displayName}`}
                className="w-full h-full object-contain pointer-events-none select-none"
                draggable={false}
                onLoad={handleImageLoad}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-amber-50 border-2 border-dashed border-amber-400 text-amber-700 rounded">
                <span className="text-xs font-bold">Sign Here</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// React.memo dengan custom equality — skip re-render kalau data signature
// itu sendiri tidak berubah (mis. parent re-render karena state lain).
export default memo(InteractSignatureGroup, (prev, next) => {
  return (
    prev.sig.id === next.sig.id &&
    prev.sig.signerId === next.sig.signerId &&
    prev.sig.userId === next.sig.userId &&
    prev.sig.status === next.sig.status &&
    prev.sig.signatureImageUrl === next.sig.signatureImageUrl &&
    prev.sig.positionX === next.sig.positionX &&
    prev.sig.positionY === next.sig.positionY &&
    prev.sig.width === next.sig.width &&
    prev.sig.height === next.sig.height &&
    prev.sig.pageNumber === next.sig.pageNumber &&
    prev.sig._pending === next.sig._pending &&
    prev.containerWidth === next.containerWidth &&
    prev.containerHeight === next.containerHeight &&
    prev.readOnly === next.readOnly &&
    prev.documentId === next.documentId
  );
});
