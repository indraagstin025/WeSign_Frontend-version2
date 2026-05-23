import { useEffect, useRef, useState, useMemo, memo } from 'react';
import interact from 'interactjs';
import { X } from 'lucide-react';
import { socketService } from '../../../services/socketService';
import {
  DEFAULT_SIGNATURE_HEIGHT,
  DEFAULT_SIGNATURE_WIDTH,
  SIGNATURE_SOCKET_THROTTLE_MS,
} from '../constants/groupSignatureLayout';

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
  const naturalSizeAppliedRef = useRef(false);

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
  const resizingFromHandleRef = useRef(false);
  const resizeFrameRef = useRef(null);
  const remoteFrameRef = useRef(null);
  const pendingResizeBoxRef = useRef(null);
  const pendingRemoteBoxRef = useRef(null);
  const remoteVisibleBoxRef = useRef(null);

  // [RESIZE-PRECISION] Aspect ratio dari image natural — supaya resize lock
  // ratio (signature tidak distorsi) sama seperti DraggableSignature pattern.
  // Default 2:1 sebelum image load, akan di-update saat image natural ratio
  // ke-detect via onLoad handler.
  const aspectRatioRef = useRef(null);

  const updateAspectRatioFromBox = (outerW, outerH) => {
    const innerW = Math.max(1, outerW - TOTAL_REDUCTION);
    const innerH = Math.max(1, outerH - TOTAL_REDUCTION);
    aspectRatioRef.current = innerW / innerH;
  };

  const outerHeightFromOuterWidth = (outerW, ratio) => {
    const innerW = Math.max(1, outerW - TOTAL_REDUCTION);
    const innerH = innerW / (ratio || 1);
    return Math.max(1, innerH + TOTAL_REDUCTION);
  };

  const isDefaultDropSize = () =>
    Math.abs((sig.width || 0) - DEFAULT_SIGNATURE_WIDTH) < 0.001 &&
    Math.abs((sig.height || 0) - DEFAULT_SIGNATURE_HEIGHT) < 0.001;

  const writeBoxToDom = (element, box) => {
    element.style.width = `${box.w}px`;
    element.style.height = `${box.h}px`;
    element.style.transform = `translate(${box.x}px, ${box.y}px)`;
  };

  const scheduleBoxWrite = (frameRef, pendingRef, element, box) => {
    pendingRef.current = box;
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const nextBox = pendingRef.current;
      pendingRef.current = null;
      if (nextBox) writeBoxToDom(element, nextBox);
    });
  };

  const lerp = (from, to, amount) => from + (to - from) * amount;

  const animateRemoteBox = (element) => {
    const target = pendingRemoteBoxRef.current;
    if (!target) {
      remoteFrameRef.current = null;
      return;
    }

    const current = remoteVisibleBoxRef.current || positionRef.current || target;
    const maxDelta = Math.max(
      Math.abs(target.x - current.x),
      Math.abs(target.y - current.y),
      Math.abs(target.w - current.w),
      Math.abs(target.h - current.h)
    );

    if (maxDelta > 180) {
      remoteVisibleBoxRef.current = target;
      writeBoxToDom(element, target);
      remoteFrameRef.current = null;
      return;
    }

    if (maxDelta < 0.4) {
      remoteVisibleBoxRef.current = target;
      writeBoxToDom(element, target);
      remoteFrameRef.current = null;
      return;
    }

    const next = {
      x: lerp(current.x, target.x, 0.42),
      y: lerp(current.y, target.y, 0.42),
      w: lerp(current.w, target.w, 0.42),
      h: lerp(current.h, target.h, 0.42),
    };

    remoteVisibleBoxRef.current = next;
    writeBoxToDom(element, next);
    remoteFrameRef.current = requestAnimationFrame(() => animateRemoteBox(element));
  };

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
          socketService.emitSignatureUpdate(data, { volatile: true });
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

      pendingRemoteBoxRef.current = {
        x: calcX,
        y: calcY,
        w: calcW,
        h: calcH,
      };

      if (!remoteVisibleBoxRef.current) {
        remoteVisibleBoxRef.current = positionRef.current.w > 0
          ? { ...positionRef.current }
          : { ...pendingRemoteBoxRef.current };
      }

      if (!remoteFrameRef.current) {
        remoteFrameRef.current = requestAnimationFrame(() => animateRemoteBox(element));
      }

      positionRef.current = { x: calcX, y: calcY, w: calcW, h: calcH };
      updateAspectRatioFromBox(calcW, calcH);

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
      if (remoteFrameRef.current) {
        cancelAnimationFrame(remoteFrameRef.current);
        remoteFrameRef.current = null;
      }
      pendingRemoteBoxRef.current = null;
      remoteVisibleBoxRef.current = null;
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
        updateAspectRatioFromBox(calcW, calcH);
        element.style.transform = `translate(${calcX}px, ${calcY}px)`;
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
        ignoreFrom: '.resize-handle, .delete-btn',
        listeners: {
          start() {
            if (resizingFromHandleRef.current) return false;
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
            element.style.transform = `translate(${positionRef.current.x}px, ${positionRef.current.y}px)`;

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
        // [RESIZE-PRECISION] Boolean true semua — kita handle aspect ratio
        // lock di move handler, bukan via edges class mapping. Lebih reliable.
        edges: {
          left: '.resize-nw, .resize-sw',
          right: '.resize-ne, .resize-se',
          top: '.resize-nw, .resize-ne',
          bottom: '.resize-sw, .resize-se',
        },
        listeners: {
          start() {
            resizingFromHandleRef.current = true;
            setIsResizing(true);
            setIsActive(true);
            updateAspectRatioFromBox(positionRef.current.w, positionRef.current.h);
            // [PERF] Cache parentRect saat resize start — hindari
            // getBoundingClientRect() per move event (force layout reflow
            // setiap call, expensive saat di tengah resize 60fps).
            const parent = element.parentElement;
            cachedParentRectRef.current = parent ? parent.getBoundingClientRect() : null;
          },
          move(event) {
            const { x: oldX, y: oldY, w: oldW, h: oldH } = positionRef.current;
            const { deltaRect, edges } = event;

            // [RESIZE-PRECISION] Pattern aspect-ratio lock dari useDraggableSignature
            // (versi react-draggable yang user bilang lebih smooth/presisi):
            //   1. Hitung newW dari delta WIDTH saja
            //   2. Hitung newH = newW / ratio (lock aspect)
            //   3. Adjust posisi x/y kalau resize dari edge kiri/atas
            //   4. Math.round() semua nilai pixel — hindari subpixel blur
            const ratio = aspectRatioRef.current ||
              (Math.max(1, oldW - TOTAL_REDUCTION) / Math.max(1, oldH - TOTAL_REDUCTION));

            // Hitung perubahan ukuran dari horizontal ATAU vertical movement.
            // Sebelumnya hanya pakai delta horizontal, jadi saat resize dari
            // NW/NE/SW dengan gerakan dominan vertikal, peer terlihat tidak
            // terkunci aspect ratio. Delta vertical dikonversi ke width
            // equivalent agar semua corner terasa sama.
            const dWFromX = (deltaRect.right || 0) - (deltaRect.left || 0);
            const dHFromY = (deltaRect.bottom || 0) - (deltaRect.top || 0);
            const dWFromY = dHFromY * ratio;
            const dW = Math.abs(dWFromX) >= Math.abs(dWFromY) ? dWFromX : dWFromY;
            let newW = Math.max(oldW + dW, 80);
            // Lock height ke ratio inner signature. Outer box punya padding,
            // jadi width perlu dikurangi TOTAL_REDUCTION dulu, lalu height
            // ditambah lagi. Kalau langsung `newW / ratio`, padding ikut
            // masuk rasio dan box bisa memanjang/geser saat resize.
            let newH = Math.max(outerHeightFromOuterWidth(newW, ratio), 50);
            if (outerHeightFromOuterWidth(newW, ratio) < 50) {
              newH = 50;
              newW = ((newH - TOTAL_REDUCTION) * ratio) + TOTAL_REDUCTION;
            }

            // Adjust posisi: kalau resize dari edge kiri (NW/SW), pivot di kanan;
            // kalau dari edge atas (NW/NE), pivot di bawah.
            let x = oldX;
            let y = oldY;
            if (edges.left) x = oldX + oldW - newW;
            if (edges.top) y = oldY + oldH - newH;

            // [RESIZE-PRECISION] Boundary clamp manual (lebih reliable dari
            // interact.modifiers.restrictRect saat ratio-lock).
            const parentRect = cachedParentRectRef.current;
            if (parentRect) {
              x = Math.max(0, Math.min(parentRect.width - newW, x));
              y = Math.max(0, Math.min(parentRect.height - newH, y));
            }

            // [RESIZE-PRECISION] Round ke integer pixel — hindari subpixel
            // rendering blur saat resize cepat. Ini yang bikin react-draggable
            // versi lebih "presisi" feel-nya.
            const finalW = Math.round(newW);
            const finalH = Math.round(newH);
            const finalX = Math.round(x);
            const finalY = Math.round(y);

            positionRef.current = { x: finalX, y: finalY, w: finalW, h: finalH };
            scheduleBoxWrite(resizeFrameRef, pendingResizeBoxRef, element, {
              x: finalX,
              y: finalY,
              w: finalW,
              h: finalH,
            });

            if (documentId) {
              // [PERF] Pakai cached parentRect, bukan re-calc per move.
              if (parentRect) {
                emitSocketDrag({
                  documentId,
                  signatureId: sig.id,
                  positionX: (finalX + CONTENT_OFFSET) / parentRect.width,
                  positionY: (finalY + CONTENT_OFFSET) / parentRect.height,
                  width: (finalW - TOTAL_REDUCTION) / parentRect.width,
                  height: (finalH - TOTAL_REDUCTION) / parentRect.height,
                  pageNumber: sig.pageNumber,
                });
              }
            }
          },
          end() {
            resizingFromHandleRef.current = false;
            setIsResizing(false);
            if (resizeFrameRef.current) {
              cancelAnimationFrame(resizeFrameRef.current);
              resizeFrameRef.current = null;
            }
            pendingResizeBoxRef.current = null;
            const parentRect = cachedParentRectRef.current;
            cachedParentRectRef.current = null;
            if (!parentRect) return;
            const { x, y, w, h } = positionRef.current;
            writeBoxToDom(element, { x, y, w, h });

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
        // Min size — match dengan logic di move handler (W >= 80, H >= 50).
        modifiers: [
          interact.modifiers.restrictSize({ min: { width: 80, height: 50 } }),
        ],
      });

    return () => {
      if (resizeFrameRef.current) {
        cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = null;
      }
      pendingResizeBoxRef.current = null;
      interactable.unset();
    };
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
              className="delete-btn w-7 h-7 bg-rose-500 text-white rounded-md flex items-center justify-center shadow-md hover:bg-rose-600 transition-colors border-none cursor-pointer"
              title="Hapus tanda tangan"
            >
              <X size={14} strokeWidth={3} />
            </button>
          </div>
        )}

        {/* Resize handles — pakai class names supaya interact.js edges
            mapping bisa pinpoint corner mana yang di-grab.
            [RESIZE-PRECISION] Cuma 4 corner (no edge tengah) supaya resize
            selalu 2-axis dengan aspect ratio lock. */}
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
                onLoad={(e) => {
                  const { naturalWidth, naturalHeight } = e.target;
                  if (naturalWidth <= 0 || naturalHeight <= 0) return;

                  const naturalRatio = naturalWidth / naturalHeight;
                  const current = positionRef.current;

                  // Saat pertama drop, tinggi awal masih default (0.1 page).
                  // Untuk signature yang rasionya jelas bukan 1:1, sesuaikan
                  // box ke rasio gambar asli agar tidak tampak terlalu
                  // persegi panjang. Kalau gambar/canvas terbaca 1:1, jangan
                  // paksa square karena itu bug yang sebelumnya muncul saat
                  // resize.
                  const shouldApplyNaturalRatio =
                    !naturalSizeAppliedRef.current &&
                    canInteract &&
                    isDefaultDropSize() &&
                    current.w > TOTAL_REDUCTION &&
                    current.h > TOTAL_REDUCTION &&
                    (naturalRatio > 1.2 || naturalRatio < 0.85);

                  if (shouldApplyNaturalRatio) {
                    const parent = elementRef.current?.parentElement;
                    const parentRect = parent?.getBoundingClientRect();
                    if (!parentRect?.width || !parentRect?.height) return;

                    const nextH = Math.round(outerHeightFromOuterWidth(current.w, naturalRatio));
                    const nextY = Math.max(0, Math.min(parentRect.height - nextH, current.y));
                    positionRef.current = { ...current, y: nextY, h: nextH };
                    elementRef.current.style.height = `${nextH}px`;
                    elementRef.current.style.transform = `translate(${current.x}px, ${nextY}px)`;
                    aspectRatioRef.current = naturalRatio;
                    naturalSizeAppliedRef.current = true;

                    const innerH = Math.max(0, nextH - TOTAL_REDUCTION) / parentRect.height;
                    const innerY = (nextY + CONTENT_OFFSET) / parentRect.height;
                    onUpdateSize?.(sig.id, sig.width, innerH);
                    onUpdatePosition?.(sig.id, sig.positionX, innerY);

                    if (documentId) {
                      socketService.emitSignatureUpdate?.({
                        documentId,
                        signatureId: sig.id,
                        positionX: sig.positionX,
                        positionY: innerY,
                        width: sig.width,
                        height: innerH,
                        pageNumber: sig.pageNumber,
                      });
                    }
                    return;
                  }

                  if (!aspectRatioRef.current && current.w > TOTAL_REDUCTION && current.h > TOTAL_REDUCTION) {
                    updateAspectRatioFromBox(current.w, current.h);
                  }
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
