import { useEffect, useRef, useState, useMemo, memo } from 'react';
import interact from 'interactjs';
import { X } from 'lucide-react';
import { socketService } from '../../../services/socketService';
import { SIGNATURE_SOCKET_THROTTLE_MS } from '../constants/groupSignatureLayout';

/**
 * @file InteractSignatureGroup.jsx
 * @description Komponen drag/resize signature pakai pattern lama (interact.js +
 *   positionRef + direct DOM manipulation).
 *
 * Pattern ini berbeda dari `DraggableSignatureGroup.jsx` (yang pakai
 * `react-draggable` + React state). Yang kita pertahankan supaya bisa
 * fallback kalau interact.js bermasalah.
 *
 * Keunggulan pattern interact.js:
 *   - Drag/resize TIDAK trigger React render (manipulasi DOM langsung via
 *     `element.style.transform`).
 *   - Posisi disimpan di `positionRef.current` (mutable ref), bukan state.
 *   - Remote update juga via direct DOM, bypass React.
 *
 * Hasilnya: drag yang smooth pada 60fps native browser tanpa overhead React
 * reconciliation per frame.
 *
 * COORD MODEL:
 * Backend store `positionX/Y/width/height` sebagai fraksi 0-1 dari halaman PDF.
 * Komponen ini convert fraksi ↔ pixel saat render dan emit.
 *
 * Padding visual untuk handle resize: 12px CSS padding + 1px border = 13px
 * per sisi (CONTENT_OFFSET). Total reduction: 26px (TOTAL_REDUCTION).
 * Inner image (yang disimpan di DB) = outer box - TOTAL_REDUCTION.
 */

const CSS_PADDING = 12;
const CSS_BORDER = 1;
const CONTENT_OFFSET = CSS_PADDING + CSS_BORDER;
const TOTAL_REDUCTION = CONTENT_OFFSET * 2;

// Throttle leading-only — sama dengan utils/throttle.js project lama yang
// terbukti work smooth.
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

const InteractSignatureGroup = ({
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
  const elementRef = useRef(null);

  // ── 1. OWNERSHIP CHECK ──────────────────────────────────────────────────
  const isOwner = useMemo(() => {
    if (!currentUser) return false;
    const ownerId = sig.userId || sig.signerId;
    return String(ownerId) === String(currentUser.id);
  }, [currentUser, sig.userId, sig.signerId]);

  const isFinal = sig.status === 'final';
  const canInteract = isOwner && !isFinal && !readOnly;

  // ── 2. POSITION REF (mutable, NOT React state) ──────────────────────────
  // Init dari sig.positionX/Y/width/height (fraksi) → pixel.
  const positionRef = useRef({
    x: 0, y: 0, w: 0, h: 0,
  });

  // [PERF] Cache parent rect saat drag/resize start. Hindari getBoundingClientRect()
  // di tiap move event (force layout reflow di browser, mahal saat 60fps).
  // Reset ke null di drag/resize end.
  const cachedParentRectRef = useRef(null);

  // ── 3. INTERACTION STATE ─────────────────────────────────────────────────
  const [isActive, setIsActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRemoteActive, setIsRemoteActive] = useState(false);
  const [isLockedByRemote, setIsLockedByRemote] = useState(false);

  // ── 4. SOCKET EMITTER (throttled) ───────────────────────────────────────
  const emitSocketDrag = useMemo(
    () =>
      throttle((data) => {
        if (documentId && socketService.emitSignatureUpdate) {
          socketService.emitSignatureUpdate(data);
        } else if (documentId) {
          // fallback ke alias lama
          socketService.emitDrag?.(data);
        }
      }, SIGNATURE_SOCKET_THROTTLE_MS),
    [documentId]
  );

  // ── 5. SOCKET LISTENER (REMOTE UPDATE) ──────────────────────────────────
  useEffect(() => {
    const handleRemoteMove = (data) => {
      if (data.signatureId !== sig.id) return;
      // Skip kalau owner sedang drag/resize sendiri (race protection)
      if (isDragging || isResizing) return;
      // Owner sendiri tidak perlu apply remote update untuk signature miliknya
      if (isOwner) return;

      const element = elementRef.current;
      const parent = element?.parentElement;
      if (!element || !parent) return;

      const parentRect = parent.getBoundingClientRect();
      if (parentRect.width < 50) return;

      // Konversi fraksi → pixel
      const calcX = data.positionX * parentRect.width - CONTENT_OFFSET;
      const calcY = data.positionY * parentRect.height - CONTENT_OFFSET;
      const calcW = data.width * parentRect.width + TOTAL_REDUCTION;
      const calcH = data.height * parentRect.height + TOTAL_REDUCTION;

      // Direct DOM update — bypass React render
      element.style.transform = `translate3d(${calcX}px, ${calcY}px, 0)`;
      element.style.width = `${calcW}px`;
      element.style.height = `${calcH}px`;

      positionRef.current = { x: calcX, y: calcY, w: calcW, h: calcH };

      // Visual feedback (toast "user X sedang edit")
      setIsRemoteActive(true);
      setIsLockedByRemote(true);

      // Reset feedback timer
      const timerKey = `__sig_remote_timer_${sig.id}`;
      if (window[timerKey]) clearTimeout(window[timerKey]);
      window[timerKey] = setTimeout(() => {
        setIsRemoteActive(false);
        setIsLockedByRemote(false);
      }, 500);
    };

    socketService.on('update_signature_position', handleRemoteMove);
    return () => {
      socketService.off('update_signature_position', handleRemoteMove);
    };
  }, [sig.id, isDragging, isResizing, isOwner]);

  // ── 6. INIT POSITION FROM SIG PROPS ─────────────────────────────────────
  // ResizeObserver supaya posisi reset saat container width berubah (mobile rotate, dll).
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !element.parentElement) return;

    const calculatePosition = () => {
      const parentRect = element.parentElement.getBoundingClientRect();
      if (parentRect.width < 50) return;

      // Skip update saat user sedang interact — biar tidak override drag/resize.
      if (canInteract && positionRef.current.w > 0 && (isDragging || isResizing || isActive)) {
        return;
      }

      if (sig.positionX != null && !isNaN(sig.positionX)) {
        const calcX = sig.positionX * parentRect.width - CONTENT_OFFSET;
        const calcY = sig.positionY * parentRect.height - CONTENT_OFFSET;
        const calcW = sig.width * parentRect.width + TOTAL_REDUCTION;
        const calcH = sig.height * parentRect.height + TOTAL_REDUCTION;

        positionRef.current = { x: calcX, y: calcY, w: calcW, h: calcH };
        element.style.transform = `translate3d(${calcX}px, ${calcY}px, 0)`;
        element.style.width = `${calcW}px`;
        element.style.height = `${calcH}px`;
      }
    };

    const ro = new ResizeObserver(() => calculatePosition());
    ro.observe(element.parentElement);
    calculatePosition();

    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig.positionX, sig.positionY, sig.width, sig.height, canInteract]);

  // ── 7. CLICK OUTSIDE → DESELECT ─────────────────────────────────────────
  useEffect(() => {
    if (!isActive) return;

    const handleClickOutside = (e) => {
      if (elementRef.current && !elementRef.current.contains(e.target)) {
        setIsActive(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isActive]);

  // ── 8. INTERACT.JS DRAG + RESIZE ────────────────────────────────────────
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !canInteract || isLockedByRemote) return;

    const interactable = interact(element)
      .draggable({
        listeners: {
          start() {
            setIsDragging(true);
            setIsActive(true);
            element.style.cursor = 'grabbing';
            // [PERF] Cache parentRect saat drag start.
            const parent = element.parentElement;
            cachedParentRectRef.current = parent ? parent.getBoundingClientRect() : null;
          },
          move(event) {
            positionRef.current.x += event.dx;
            positionRef.current.y += event.dy;
            element.style.transform = `translate3d(${positionRef.current.x}px, ${positionRef.current.y}px, 0)`;

            // Emit socket throttled
            if (documentId) {
              // [PERF] Pakai cached parentRect, bukan re-calc per move.
              const parentRect = cachedParentRectRef.current;
              if (parentRect) {
                const realW = positionRef.current.w - TOTAL_REDUCTION;
                const realH = positionRef.current.h - TOTAL_REDUCTION;
                const realX = positionRef.current.x + CONTENT_OFFSET;
                const realY = positionRef.current.y + CONTENT_OFFSET;

                emitSocketDrag({
                  documentId,
                  signatureId: sig.id,
                  positionX: realX / parentRect.width,
                  positionY: realY / parentRect.height,
                  width: realW / parentRect.width,
                  height: realH / parentRect.height,
                  pageNumber: sig.pageNumber,
                });
              }
            }
          },
          end() {
            setIsDragging(false);
            element.style.cursor = 'grab';

            // Persist final position via PATCH (parent handler)
            const parentRect = cachedParentRectRef.current;
            cachedParentRectRef.current = null;
            if (!parentRect) return;
            const realX = (positionRef.current.x + CONTENT_OFFSET) / parentRect.width;
            const realY = (positionRef.current.y + CONTENT_OFFSET) / parentRect.height;

            // Emit final position juga (bukan throttled) supaya peer dapat
            // posisi terakhir tepat saat drop, walau ada di throttle window.
            if (documentId) {
              const realW = (positionRef.current.w - TOTAL_REDUCTION) / parentRect.width;
              const realH = (positionRef.current.h - TOTAL_REDUCTION) / parentRect.height;
              socketService.emitSignatureUpdate?.({
                documentId,
                signatureId: sig.id,
                positionX: realX,
                positionY: realY,
                width: realW,
                height: realH,
                pageNumber: sig.pageNumber,
              });
            }

            onUpdatePosition?.(sig.id, realX, realY);
          },
        },
        inertia: false,
        modifiers: [
          interact.modifiers.restrictRect({ restriction: 'parent', endOnly: true }),
        ],
      })
      .resizable({
        edges: { left: true, right: true, bottom: true, top: true },
        listeners: {
          start() {
            setIsResizing(true);
            // [PERF] Cache parentRect saat resize start — hindari
            // getBoundingClientRect() per move event (force layout reflow
            // setiap call, expensive saat di tengah resize 60fps).
            const parent = element.parentElement;
            cachedParentRectRef.current = parent ? parent.getBoundingClientRect() : null;
          },
          move(event) {
            const { x: oldX, y: oldY, w: oldW, h: oldH } = positionRef.current;
            const { deltaRect, edges } = event;

            const newW = Math.max(oldW - (deltaRect.left || 0) + (deltaRect.right || 0), 80);
            const newH = Math.max(oldH - (deltaRect.top || 0) + (deltaRect.bottom || 0), 50);

            let x = oldX;
            let y = oldY;
            if (edges.left) x = oldX + oldW - newW;
            if (edges.top) y = oldY + oldH - newH;

            positionRef.current = { x, y, w: newW, h: newH };
            element.style.width = `${newW}px`;
            element.style.height = `${newH}px`;
            element.style.transform = `translate3d(${x}px, ${y}px, 0)`;

            if (documentId) {
              // [PERF] Pakai cached parentRect, bukan re-calc per move.
              const parentRect = cachedParentRectRef.current;
              if (parentRect) {
                emitSocketDrag({
                  documentId,
                  signatureId: sig.id,
                  positionX: (x + CONTENT_OFFSET) / parentRect.width,
                  positionY: (y + CONTENT_OFFSET) / parentRect.height,
                  width: (newW - TOTAL_REDUCTION) / parentRect.width,
                  height: (newH - TOTAL_REDUCTION) / parentRect.height,
                  pageNumber: sig.pageNumber,
                });
              }
            }
          },
          end() {
            setIsResizing(false);
            const parentRect = cachedParentRectRef.current;
            cachedParentRectRef.current = null;
            if (!parentRect) return;
            const { x, y, w, h } = positionRef.current;

            const realX = (x + CONTENT_OFFSET) / parentRect.width;
            const realY = (y + CONTENT_OFFSET) / parentRect.height;
            const realW = (w - TOTAL_REDUCTION) / parentRect.width;
            const realH = (h - TOTAL_REDUCTION) / parentRect.height;

            // Final emit + persist
            if (documentId) {
              socketService.emitSignatureUpdate?.({
                documentId,
                signatureId: sig.id,
                positionX: realX,
                positionY: realY,
                width: realW,
                height: realH,
                pageNumber: sig.pageNumber,
              });
            }

            // Backend update size + position (separate handlers di useGroupSignatureActions)
            onUpdatePosition?.(sig.id, realX, realY);
            onUpdateSize?.(sig.id, realW, realH);
          },
        },
        modifiers: [
          interact.modifiers.restrictSize({ min: { width: 80, height: 50 } }),
          interact.modifiers.restrictRect({ restriction: 'parent' }),
        ],
      });

    return () => interactable.unset();
  }, [canInteract, isLockedByRemote, documentId, sig.id, sig.pageNumber, emitSocketDrag, onUpdatePosition, onUpdateSize]);

  // ── 9. RENDER ────────────────────────────────────────────────────────────
  const displayName = sig.signerName || 'User';

  // Style classes
  let borderClass = 'border border-transparent';
  if (isActive && canInteract) borderClass = 'border border-blue-500';
  else if (isRemoteActive) borderClass = 'border border-emerald-500 ring-2 ring-emerald-200';
  else if (isFinal) borderClass = 'border border-emerald-500/40';
  else if (canInteract) borderClass = 'hover:border hover:border-blue-300 hover:border-dashed';

  const handleStyle =
    'absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full z-[60] pointer-events-auto';

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
        // [PERF] translateZ(0) promote ke GPU layer (composited), supaya
        // perubahan transform/width/height tidak trigger paint+layout di
        // CPU thread. Native compositor handle smooth dengan GPU.
        transform: `translate3d(0px, 0px, 0px)`,
        // Transition smooth saat REMOTE update; kosong saat owner drag/resize.
        transition: isDragging || isResizing ? 'none' : 'transform 0.1s linear',
        cursor: !canInteract ? 'default' : isDragging ? 'grabbing' : 'grab',
        pointerEvents: isLockedByRemote || isFinal ? 'none' : 'auto',
        touchAction: 'none',
        // [PERF] Tell browser kita akan animate transform + dimensions.
        // Browser akan optimize dengan layer compositing.
        willChange: canInteract ? 'transform' : 'auto',
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
        className={`relative w-full h-full transition-all duration-200 ${
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
              className="w-7 h-7 bg-rose-500 text-white rounded-md flex items-center justify-center shadow-md hover:bg-rose-600 transition-colors border-none cursor-pointer"
              title="Hapus tanda tangan"
            >
              <X size={14} strokeWidth={3} />
            </button>
          </div>
        )}

        {/* Resize handles */}
        {isActive && canInteract && !isLockedByRemote && (
          <>
            <div className={`${handleStyle} -top-1.5 -left-1.5 cursor-nw-resize`} />
            <div className={`${handleStyle} -top-1.5 -right-1.5 cursor-ne-resize`} />
            <div className={`${handleStyle} -bottom-1.5 -left-1.5 cursor-sw-resize`} />
            <div className={`${handleStyle} -bottom-1.5 -right-1.5 cursor-se-resize`} />
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
            className={`w-full h-full overflow-hidden transition-all duration-200 ${
              isActive && canInteract ? 'bg-white/80 shadow-lg border-rose-400 border' : 'border-transparent'
            }`}
          >
            {sig.signatureImageUrl ? (
              <img
                src={sig.signatureImageUrl}
                alt={`Tanda tangan ${displayName}`}
                className="w-full h-full object-contain pointer-events-none select-none"
                draggable={false}
                style={{
                  // [PERF] Promote ke GPU layer supaya resize tidak trigger
                  // CPU re-rasterize tiap frame. transform: translateZ(0) bikin
                  // browser cache image di GPU texture, scaling jadi murah.
                  transform: 'translateZ(0)',
                  // Saat user drag/resize, gunakan crisp pixel scaling supaya
                  // image tidak blur saat ukuran berubah cepat. Setelah idle,
                  // bisa kembali ke high-quality tapi untuk realtime pakai
                  // hint yang lebih cepat di GPU.
                  imageRendering: isResizing ? 'pixelated' : 'auto',
                  willChange: isDragging || isResizing ? 'transform, width, height' : 'auto',
                }}
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
