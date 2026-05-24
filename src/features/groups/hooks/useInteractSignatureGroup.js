import { useEffect, useMemo, useRef, useState } from 'react';
import interact from 'interactjs';
import { socketService } from '../../../services/socketService';
import {
  DEFAULT_SIGNATURE_HEIGHT,
  DEFAULT_SIGNATURE_WIDTH,
  SIGNATURE_SOCKET_THROTTLE_MS,
} from '../constants/groupSignatureLayout';
import {
  CONTENT_OFFSET,
  TOTAL_REDUCTION,
  fractionToOuterBox,
  innerRatioFromBox,
  lerp,
  outerBoxToFraction,
  outerHeightFromOuterWidth,
  throttle,
  writeBoxToDom,
} from '../utils/signatureBoxGeometry';

/**
 * @file useInteractSignatureGroup.js
 * @description Stateful logic untuk drag/resize signature di group signing.
 *
 *   Hook ini handle:
 *   - Ownership check
 *   - Position ref (mutable, bypass React render saat drag/resize)
 *   - Aspect ratio anchor (dari onLoad image natural ratio)
 *   - Socket emit drag throttled + listen remote update
 *   - interact.js draggable + resizable setup
 *   - Click outside → deselect
 *   - Auto-resize box ke natural canvas ratio saat drop pertama
 *   - Smooth animation untuk remote preview (lerp + rAF)
 *
 *   Komponen `InteractSignatureGroup.jsx` cuma render JSX dan delegate
 *   semua logic ke hook ini.
 */
export function useInteractSignatureGroup({
  sig,
  onUpdatePosition,
  onUpdateSize,
  currentUser,
  documentId,
  readOnly = false,
}) {
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
  const positionRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // [PERF] Cache parent rect saat drag/resize start. Hindari getBoundingClientRect()
  // di tiap move event (force layout reflow di browser, mahal saat 60fps).
  const cachedParentRectRef = useRef(null);
  const resizingFromHandleRef = useRef(false);
  const remoteFrameRef = useRef(null);
  const pendingRemoteBoxRef = useRef(null);
  const remoteVisibleBoxRef = useRef(null);

  // [RESIZE-PRECISION] Aspect ratio dari image natural — supaya resize lock
  // ratio (signature tidak distorsi). Default null sebelum image load,
  // di-update saat onLoad fire.
  const aspectRatioRef = useRef(null);

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

  // ── 5. ANIMATE REMOTE BOX (lerp ke target via rAF) ──────────────────────
  // Smooth transition antar throttled socket events di peer side. Tanpa
  // animation, peer akan lihat jump/teleport tiap socket frame.
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

    // [REMOTE-SMOOTH] Snap HANYA kalau sudah cukup dekat (hindari oscillating
    // sub-pixel). Sebelumnya juga snap kalau maxDelta > 180 untuk handle
    // jump/teleport, tapi resize legitimate sering melebihi 180px (mis.
    // user lain drag corner cepat) → preview terlihat patah/teleport.
    // Lebih baik tetap interpolate — kalau emang teleport, lerp 0.25 cukup
    // cepat ke target dalam ~3-4 frame dan visual feel-nya tetap natural.
    if (maxDelta < 0.4) {
      remoteVisibleBoxRef.current = target;
      writeBoxToDom(element, target);
      remoteFrameRef.current = null;
      return;
    }

    // [REMOTE-SMOOTH] Lerp factor diturunkan dari 0.42 → 0.25. Sebelumnya
    // 0.42 = 42% jarak per frame, jadi target tercapai dalam ~3 frame
    // tapi overshoot di awal terlihat "menyentak". 0.25 = 25% per frame =
    // ~6 frame ease-out yang lebih halus. Combined dengan throttle
    // trailing (yang fire posisi terbaru di akhir window), preview peer
    // akan smooth match owner movement.
    const next = {
      x: lerp(current.x, target.x, 0.25),
      y: lerp(current.y, target.y, 0.25),
      w: lerp(current.w, target.w, 0.25),
      h: lerp(current.h, target.h, 0.25),
    };
    remoteVisibleBoxRef.current = next;
    writeBoxToDom(element, next);
    remoteFrameRef.current = requestAnimationFrame(() => animateRemoteBox(element));
  };

  // ── 6. SOCKET LISTENER (REMOTE UPDATE) ──────────────────────────────────
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

      const target = fractionToOuterBox(data, parentRect);
      pendingRemoteBoxRef.current = target;

      if (!remoteVisibleBoxRef.current) {
        remoteVisibleBoxRef.current = positionRef.current.w > 0
          ? { ...positionRef.current }
          : { ...target };
      }

      if (!remoteFrameRef.current) {
        remoteFrameRef.current = requestAnimationFrame(() => animateRemoteBox(element));
      }

      positionRef.current = { ...target };
      aspectRatioRef.current = innerRatioFromBox(target.w, target.h);

      // Visual feedback (toast "user X sedang edit")
      setIsRemoteActive(true);
      setIsLockedByRemote(true);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig.id, isDragging, isResizing, isOwner]);

  // ── 7. INIT POSITION FROM SIG PROPS ─────────────────────────────────────
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
        const box = fractionToOuterBox(sig, parentRect);
        positionRef.current = box;
        aspectRatioRef.current = innerRatioFromBox(box.w, box.h);
        writeBoxToDom(element, box);
      }
    };

    const ro = new ResizeObserver(() => calculatePosition());
    ro.observe(element.parentElement);
    calculatePosition();

    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig.positionX, sig.positionY, sig.width, sig.height, canInteract]);

  // ── 8. CLICK OUTSIDE → DESELECT ─────────────────────────────────────────
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

  // ── 9. INTERACT.JS DRAG + RESIZE ────────────────────────────────────────
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
            const parent = element.parentElement;
            cachedParentRectRef.current = parent ? parent.getBoundingClientRect() : null;
          },
          move(event) {
            positionRef.current.x += event.dx;
            positionRef.current.y += event.dy;
            element.style.transform = `translate(${positionRef.current.x}px, ${positionRef.current.y}px)`;

            if (documentId) {
              const parentRect = cachedParentRectRef.current;
              if (parentRect) {
                const frac = outerBoxToFraction(positionRef.current, parentRect);
                emitSocketDrag({
                  documentId,
                  signatureId: sig.id,
                  ...frac,
                  pageNumber: sig.pageNumber,
                });
              }
            }
          },
          end() {
            setIsDragging(false);
            element.style.cursor = 'grab';

            const parentRect = cachedParentRectRef.current;
            cachedParentRectRef.current = null;
            if (!parentRect) return;
            const frac = outerBoxToFraction(positionRef.current, parentRect);

            if (documentId) {
              socketService.emitSignatureUpdate?.({
                documentId,
                signatureId: sig.id,
                ...frac,
                pageNumber: sig.pageNumber,
              });
            }

            onUpdatePosition?.(sig.id, frac.positionX, frac.positionY);
          },
        },
        inertia: false,
        modifiers: [
          interact.modifiers.restrictRect({ restriction: 'parent', endOnly: true }),
        ],
      })
      .resizable({
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
            aspectRatioRef.current = innerRatioFromBox(positionRef.current.w, positionRef.current.h);
            const parent = element.parentElement;
            cachedParentRectRef.current = parent ? parent.getBoundingClientRect() : null;
          },
          move(event) {
            const { x: oldX, y: oldY } = positionRef.current;
            const { deltaRect, rect } = event;

            // Aspect ratio lock dihitung oleh interact.js modifier. Pakai
            // rect + deltaRect hasil modifier agar semua corner punya pivot
            // dan arah resize yang konsisten.
            let newW = Math.max(rect.width, 80);

            let newH = Math.max(rect.height, 50);

            let x = oldX + (deltaRect.left || 0);
            let y = oldY + (deltaRect.top || 0);

            // Boundary clamp manual agar signature tetap di dalam halaman PDF.
            const parentRect = cachedParentRectRef.current;
            if (parentRect) {
              x = Math.max(0, Math.min(parentRect.width - newW, x));
              y = Math.max(0, Math.min(parentRect.height - newH, y));
            }

            // [SMOOTH-RESIZE] Sub-pixel nilai TANPA Math.round. Pixel
            // rounding nyata bikin micro-jitter saat mouse bergerak slow
            // (pos visual "snap" tiap kali floor angka berubah). GPU layer
            // sudah handle sub-pixel rendering smooth via transform 3D.
            const finalBox = { x, y, w: newW, h: newH };

            // [SMOOTH-RESIZE] Direct DOM write, BUKAN rAF schedule. Drag
            // path juga sync — kita match polanya supaya resize feel
            // sama smooth. rAF coalesce-nya add 1 frame latency yang
            // perceptible terutama di display 120Hz+.
            positionRef.current = finalBox;
            writeBoxToDom(element, finalBox);

            if (documentId && parentRect) {
              const frac = outerBoxToFraction(finalBox, parentRect);
              emitSocketDrag({
                documentId,
                signatureId: sig.id,
                ...frac,
                pageNumber: sig.pageNumber,
              });
            }
          },
          end() {
            resizingFromHandleRef.current = false;
            setIsResizing(false);
            const parentRect = cachedParentRectRef.current;
            cachedParentRectRef.current = null;
            if (!parentRect) return;

            const box = positionRef.current;
            writeBoxToDom(element, box);
            const frac = outerBoxToFraction(box, parentRect);

            if (documentId) {
              socketService.emitSignatureUpdate?.({
                documentId,
                signatureId: sig.id,
                ...frac,
                pageNumber: sig.pageNumber,
              });
            }

            onUpdatePosition?.(sig.id, frac.positionX, frac.positionY);
            onUpdateSize?.(sig.id, frac.width, frac.height);
          },
        },
        modifiers: [
          interact.modifiers.aspectRatio({
            ratio: 'preserve',
            modifiers: [
              interact.modifiers.restrictSize({ min: { width: 80, height: 50 } }),
            ],
          }),
        ],
      });

    return () => {
      interactable.unset();
    };
  }, [canInteract, isLockedByRemote, documentId, sig.id, sig.pageNumber, emitSocketDrag, onUpdatePosition, onUpdateSize]);

  // 10. IMAGE LOAD HANDLER (auto-apply natural ratio saat drop pertama) ──
  // Saat user drop signature pertama kali, tinggi default masih 0.1 page.
  // Untuk signature dengan ratio jelas bukan 1:1, sesuaikan box ke natural
  // ratio gambar agar tidak terlihat kotak-tipis. Skip kalau ratio dekat 1:1
  // (avoid bug push-square saat resize).
  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth <= 0 || naturalHeight <= 0) return;

    const naturalRatio = naturalWidth / naturalHeight;
    const current = positionRef.current;

    const isDefaultDropSize =
      Math.abs((sig.width || 0) - DEFAULT_SIGNATURE_WIDTH) < 0.001 &&
      Math.abs((sig.height || 0) - DEFAULT_SIGNATURE_HEIGHT) < 0.001;

    const shouldApplyNaturalRatio =
      !naturalSizeAppliedRef.current &&
      canInteract &&
      isDefaultDropSize &&
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
      aspectRatioRef.current = innerRatioFromBox(current.w, current.h);
    }
  };

  return {
    // Refs untuk render JSX
    elementRef,

    // Derived state
    isOwner,
    isFinal,
    canInteract,

    // Interaction state
    isActive,
    isDragging,
    isResizing,
    isRemoteActive,
    isLockedByRemote,

    // Setters yang dibutuhkan handler render
    setIsActive,

    // Image onLoad handler
    handleImageLoad,
  };
}
