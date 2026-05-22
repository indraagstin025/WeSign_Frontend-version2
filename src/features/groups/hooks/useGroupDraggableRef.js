import { useRef, useState, useEffect, useCallback } from 'react';
import { VISUAL_PADDING, TOTAL_PADDING, MIN_INNER_WIDTH } from '../../signature/constants/signatureLayout';
import {
  REMOTE_SIGNATURE_INTERPOLATION_MS,
  REMOTE_SIGNATURE_SNAP_DISTANCE_PX,
} from '../constants/groupSignatureLayout';

/**
 * @file useGroupDraggableRef.js
 * @description Variant useDraggableSignature khusus group signing yang
 *   menyimpan posisi/ukuran di `useRef` (mutable), BUKAN `useState`.
 *
 *   Tujuan: drag/resize/remote-update TIDAK trigger React render. Manipulasi
 *   DOM langsung via `nodeRef.current.style.transform`. Pattern yang sama
 *   dengan project lama (`PlacedSignatureGroup.jsx`) yang user konfirmasi
 *   smooth visual untuk observer.
 *
 *   Personal signing (`DocumentSigningPage`) TETAP pakai `useDraggableSignature`
 *   yang lama (state-based) supaya tidak ke-impact perubahan ini.
 *
 * KOORDINAT MODEL (sama dengan useDraggableSignature):
 *   - `sig.positionX/Y` + `sig.width/height` = INNER fraction (0-1)
 *   - Komponen ini track OUTER pixel di positionRef
 *   - Konversi inner ↔ outer pakai VISUAL_PADDING + TOTAL_PADDING
 *
 * INTERAKSI DENGAN react-draggable:
 *   - Pakai **uncontrolled mode** (`defaultPosition` saja, bukan `position`).
 *     react-draggable internal pegang state, kita TIDAK perlu tracking di React.
 *   - `onDrag` callback update positionRef + DOM langsung.
 *   - `onStop` persist ke backend via callback.
 *   - Saat remote update masuk (dari peer), kita panggil
 *     `forceUpdatePosition(x, y)` yang manipulate DOM via nodeRef +
 *     update positionRef. react-draggable internal state akan eventually
 *     sync via getBoundingClientRect saat next drag start.
 */
export const useGroupDraggableRef = (
  sig,
  containerWidth,
  containerHeight,
  onUpdatePosition,
  onUpdateSize,
  onResizeMove,
  onResizeEnd
) => {
  // ── DOM REFS ────────────────────────────────────────────────────────────
  const nodeRef = useRef(null);
  const handleNWRef = useRef(null);
  const handleNERef = useRef(null);
  const handleSWRef = useRef(null);
  const handleSERef = useRef(null);

  // ── STATE (cuma untuk flag boolean, BUKAN posisi) ───────────────────────
  const [isActive, setIsActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // ── REFS (mutable, NO re-render) ────────────────────────────────────────
  const isResizingRef = useRef(false);
  const isReadyRef = useRef(false);
  const aspectRatioRef = useRef(null);
  const resizeFrameRef = useRef(null);
  const remoteFrameRef = useRef(null);
  const remoteTargetRef = useRef(null);
  const remoteLastFrameAtRef = useRef(0);

  // Position + size di REF — sumber kebenaran tunggal yang tidak trigger
  // React render saat berubah.
  // OUTER pixel format (sudah include VISUAL_PADDING).
  const positionRef = useRef({
    x: Math.max(0, sig.positionX * containerWidth - VISUAL_PADDING),
    y: Math.max(0, sig.positionY * containerHeight - VISUAL_PADDING),
    w: Math.round((sig.width * containerWidth) + TOTAL_PADDING) || 160,
    h: (sig.height || 0) > 0
      ? Math.round((sig.height * containerHeight) + TOTAL_PADDING)
      : 60,
  });

  const sigRef = useRef(sig);
  const containerWidthRef = useRef(containerWidth);
  const containerHeightRef = useRef(containerHeight);

  useEffect(() => { sigRef.current = sig; }, [sig]);
  useEffect(() => { containerWidthRef.current = containerWidth; }, [containerWidth]);
  useEffect(() => { containerHeightRef.current = containerHeight; }, [containerHeight]);

  // ── Helper: aspek ratio computation ──────────────────────────────────────
  const outerHeightFromOuterWidth = (outerWidth, ratio) => {
    const innerW = Math.max(MIN_INNER_WIDTH, outerWidth - TOTAL_PADDING);
    const innerH = innerW / (ratio || 1);
    return Math.round(innerH + TOTAL_PADDING);
  };

  // ── Helper: write positionRef ke DOM ─────────────────────────────────────
  // Single source of write — supaya consistency.
  const applyPositionToDom = useCallback(() => {
    const node = nodeRef.current;
    if (!node) return;
    const { x, y, w, h } = positionRef.current;
    node.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    node.style.width = `${Math.round(w)}px`;
    node.style.height = `${Math.round(h)}px`;
  }, []);

  const stopRemoteAnimation = useCallback(() => {
    if (remoteFrameRef.current) {
      cancelAnimationFrame(remoteFrameRef.current);
      remoteFrameRef.current = null;
    }
    remoteLastFrameAtRef.current = 0;
  }, []);

  useEffect(() => stopRemoteAnimation, [stopRemoteAnimation]);

  const animateRemoteToTarget = useCallback((now) => {
    const target = remoteTargetRef.current;
    if (!target) {
      stopRemoteAnimation();
      return;
    }

    const current = positionRef.current;
    const previousAt = remoteLastFrameAtRef.current || now;
    const dt = Math.max(8, now - previousAt);
    remoteLastFrameAtRef.current = now;

    const dx = target.x - current.x;
    const dy = target.y - current.y;
    const dw = target.w - current.w;
    const dh = target.h - current.h;
    const distance = Math.hypot(dx, dy);
    const sizeDelta = Math.max(Math.abs(dw), Math.abs(dh));

    if (
      target.immediate ||
      distance > REMOTE_SIGNATURE_SNAP_DISTANCE_PX ||
      (distance < 0.5 && sizeDelta < 0.5)
    ) {
      positionRef.current = {
        x: target.x,
        y: target.y,
        w: target.w,
        h: target.h,
      };
      applyPositionToDom();
      remoteTargetRef.current = null;
      stopRemoteAnimation();
      return;
    }

    const alpha = 1 - Math.exp(-dt / REMOTE_SIGNATURE_INTERPOLATION_MS);
    positionRef.current = {
      x: current.x + dx * alpha,
      y: current.y + dy * alpha,
      w: current.w + dw * alpha,
      h: current.h + dh * alpha,
    };
    applyPositionToDom();
    remoteFrameRef.current = requestAnimationFrame(animateRemoteToTarget);
  }, [applyPositionToDom, stopRemoteAnimation]);

  // ── Initial DOM setup + sync saat sig prop berubah eksternal ─────────────
  // (mis. ResizeObserver di parent atau parent re-fetch data dari backend)
  useEffect(() => {
    // Skip kalau user sedang interact — biar tidak override drag/resize.
    if (isDragging || isResizingRef.current || isActive) return;

    const innerW = sig.width * containerWidth;
    const innerH = (sig.height || 0) * containerHeight;
    positionRef.current = {
      x: Math.max(0, sig.positionX * containerWidth - VISUAL_PADDING),
      y: Math.max(0, sig.positionY * containerHeight - VISUAL_PADDING),
      w: Math.round(innerW + TOTAL_PADDING) || 160,
      h: innerH > 0 ? Math.round(innerH + TOTAL_PADDING) : positionRef.current.h,
    };
    applyPositionToDom();
  }, [sig.positionX, sig.positionY, sig.width, sig.height, containerWidth, containerHeight, isDragging, isActive, applyPositionToDom]);

  // ── CLICK OUTSIDE (DESELECT) ─────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) return;

    const handlePointerDown = (event) => {
      const node = nodeRef.current;
      if (!node) return;
      const path = typeof event.composedPath === 'function' ? event.composedPath() : null;
      const isInside = path ? path.includes(node) : node.contains(event.target);
      if (!isInside) {
        setIsActive(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isActive]);

  // ── IMAGE LOAD: hitung aspect ratio dari natural size ────────────────────
  const handleImageLoad = useCallback((e) => {
    if (isReadyRef.current) return;
    const { naturalWidth, naturalHeight } = e.target;
    const cw = containerWidthRef.current;
    const ch = containerHeightRef.current;
    if (naturalWidth && naturalHeight && cw > 0) {
      const ratio = naturalWidth / naturalHeight;
      aspectRatioRef.current = ratio;

      const innerW = sigRef.current.width * cw;
      const innerH = innerW / ratio;
      const outerW = Math.round(innerW + TOTAL_PADDING);
      const outerH = Math.round(innerH + TOTAL_PADDING);

      // Update positionRef + DOM langsung — no setState
      positionRef.current = {
        ...positionRef.current,
        w: outerW,
        h: outerH,
      };
      applyPositionToDom();

      // Persist size ke backend (callback parent)
      onUpdateSize(sigRef.current.id, innerW / cw, innerH / ch);

      isReadyRef.current = true;
      setIsReady(true);
    }
  }, [applyPositionToDom, onUpdateSize]);

  // Cached-image fallback
  useEffect(() => {
    if (isReadyRef.current) return;
    const node = nodeRef.current;
    if (!node) return;
    const img = node.querySelector('img');
    if (img && img.complete && img.naturalWidth > 0) {
      handleImageLoad({ target: img });
    }
  }, [containerWidth, containerHeight, handleImageLoad]);

  // ── RESIZE LOGIC ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) return;
    const handles = [
      { ref: handleNWRef, dir: 'nw' },
      { ref: handleNERef, dir: 'ne' },
      { ref: handleSWRef, dir: 'sw' },
      { ref: handleSERef, dir: 'se' },
    ];
    const cleanups = [];
    handles.forEach(({ ref, dir }) => {
      const el = ref.current;
      if (!el) return;
      const onStart = (e) => {
        e.stopPropagation();
        e.preventDefault();
        isResizingRef.current = true;
        const startW = positionRef.current.w;
        const startH = positionRef.current.h;
        const startX = positionRef.current.x;
        const startY = positionRef.current.y;
        const startPointerX = e.touches ? e.touches[0].clientX : e.clientX;
        const ratio = aspectRatioRef.current || (startW / startH);

        const onMove = (moveEvent) => {
          const currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
          const dx = currentX - startPointerX;
          let newW = dir.includes('w') ? startW - dx : startW + dx;
          newW = Math.max(60, newW);
          const newH = outerHeightFromOuterWidth(newW, ratio);
          let newPosX = dir.includes('w') ? startX - (newW - startW) : startX;
          let newPosY = dir.includes('n') ? startY - (newH - outerHeightFromOuterWidth(startW, ratio)) : startY;
          const cw = containerWidthRef.current;
          const ch = containerHeightRef.current;
          newPosX = Math.max(0, Math.min(cw - newW, newPosX));
          newPosY = Math.max(0, Math.min(ch - newH, newPosY));

          // Update REF setiap event agar posisi final akurat, tapi DOM write
          // dibatasi ke frame browser supaya resize tidak stutter.
          positionRef.current = { x: newPosX, y: newPosY, w: newW, h: newH };
          if (!resizeFrameRef.current) {
            resizeFrameRef.current = requestAnimationFrame(() => {
              resizeFrameRef.current = null;
              applyPositionToDom();
            });
          }

          // Emit realtime resize ke socket (throttled dari parent)
          if (onResizeMove) {
            const innerW = Math.max(0, newW - TOTAL_PADDING) / cw;
            const innerH = Math.max(0, newH - TOTAL_PADDING) / ch;
            const innerX = (newPosX + VISUAL_PADDING) / cw;
            const innerY = (newPosY + VISUAL_PADDING) / ch;
            onResizeMove(innerW, innerH, innerX, innerY);
          }
        };

        const onEnd = () => {
          isResizingRef.current = false;
          if (resizeFrameRef.current) {
            cancelAnimationFrame(resizeFrameRef.current);
            resizeFrameRef.current = null;
          }
          applyPositionToDom();
          const { x, y, w, h } = positionRef.current;
          const cw = containerWidthRef.current;
          const ch = containerHeightRef.current;
          const innerX = (x + VISUAL_PADDING) / cw;
          const innerY = (y + VISUAL_PADDING) / ch;
          const innerW = Math.max(0, w - TOTAL_PADDING) / cw;
          const innerH = Math.max(0, h - TOTAL_PADDING) / ch;
          onUpdatePosition(sigRef.current.id, innerX, innerY);
          onUpdateSize(sigRef.current.id, innerW, innerH);
          if (onResizeEnd) {
            onResizeEnd(innerW, innerH, innerX, innerY);
          }

          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onEnd);
          document.removeEventListener('touchmove', onMove);
          document.removeEventListener('touchend', onEnd);
        };

        document.addEventListener('mousemove', onMove, { passive: false });
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
      };
      el.addEventListener('mousedown', onStart);
      el.addEventListener('touchstart', onStart, { passive: false });
      cleanups.push(() => {
        el.removeEventListener('mousedown', onStart);
        el.removeEventListener('touchstart', onStart);
      });
    });
    return () => {
      if (resizeFrameRef.current) {
        cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = null;
      }
      stopRemoteAnimation();
      cleanups.forEach((fn) => fn());
    };
  }, [isActive, onUpdatePosition, onUpdateSize, onResizeMove, onResizeEnd, applyPositionToDom, stopRemoteAnimation]);

  // ── External setter: update posisi dari socket remote ────────────────────
  // Dipanggil oleh useGroupDraggable handler saat dapat event
  // 'update_signature_position' dari peer.
  const setPositionFromRemote = useCallback((outerX, outerY, outerW, outerH, options = {}) => {
    remoteTargetRef.current = {
      x: outerX,
      y: outerY,
      w: outerW !== undefined ? outerW : positionRef.current.w,
      h: outerH !== undefined ? outerH : positionRef.current.h,
      immediate: !!options.immediate,
    };

    if (!remoteFrameRef.current) {
      remoteFrameRef.current = requestAnimationFrame(animateRemoteToTarget);
    }
  }, [animateRemoteToTarget]);

  return {
    state: {
      nodeRef,
      handleNWRef,
      handleNERef,
      handleSWRef,
      handleSERef,
      isActive,
      isDragging,
      isReady,
      // Initial values untuk render JSX (Draggable.defaultPosition)
      initialPosition: {
        x: positionRef.current.x,
        y: positionRef.current.y,
      },
      initialSize: {
        width: positionRef.current.w,
        height: positionRef.current.h,
      },
      // Expose ref untuk hook konsumen yang butuh akses langsung
      positionRef,
      isResizingRef,
    },
    actions: {
      setIsActive,
      setIsDragging,
      handleImageLoad,
      setPositionFromRemote,
      // Drag handlers untuk react-draggable uncontrolled mode
      onDragStart: (e) => {
        if (isResizingRef.current) return false;
        e.stopPropagation();
        setIsDragging(true);
        setIsActive(true);
      },
      onDrag: (_e, data) => {
        // Update REF + DOM langsung. react-draggable sudah update DOM
        // sendiri via internal state, tapi kita track positionRef untuk
        // socket emit + persist.
        positionRef.current = {
          ...positionRef.current,
          x: data.x,
          y: data.y,
        };
        // NO setState — visual handled by react-draggable internal.
      },
      onDragStop: (_e, data) => {
        setIsDragging(false);
        positionRef.current = {
          ...positionRef.current,
          x: data.x,
          y: data.y,
        };
        const cw = containerWidthRef.current;
        const ch = containerHeightRef.current;
        const innerX = (data.x + VISUAL_PADDING) / cw;
        const innerY = (data.y + VISUAL_PADDING) / ch;
        onUpdatePosition(sigRef.current.id, innerX, innerY);
      },
    },
  };
};
