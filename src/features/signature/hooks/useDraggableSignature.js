import { useRef, useState, useEffect } from 'react';

/**
 * @hook useDraggableSignature
 * 
 * KOORDINAT MODEL:
 * - State (sig.positionX/Y, sig.width/height) menyimpan koordinat INNER IMAGE
 *   sebagai fraksi (0-1) dari dimensi halaman PDF.
 * - Hook ini menambahkan VISUAL_PADDING untuk display UI (border, handle resize).
 * - Saat drag/resize selesai, hook mengkonversi kembali ke koordinat INNER
 *   sebelum melaporkan ke parent via onUpdatePosition/onUpdateSize.
 * 
 * PADDING BREAKDOWN (per sisi):
 *   1px (outer border) + 16px (CSS p-4 padding) + 1px (inner border) = 18px
 *   Total per axis = 36px
 */
export const useDraggableSignature = (sig, containerWidth, containerHeight, onUpdatePosition, onUpdateSize, onResizeMove) => {
  const nodeRef = useRef(null);
  const handleNWRef = useRef(null);
  const handleNERef = useRef(null);
  const handleSWRef = useRef(null);
  const handleSERef = useRef(null);
  
  const [isActive, setIsActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isResizingRef = useRef(false);
  const isReadyRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const aspectRatioRef = useRef(null);

  // ============================================================
  // PADDING CALCULATION:
  // Outer div: border (1px) + padding p-4 (16px) = 17px
  // Inner div: border (1px) = 1px
  // Total per side: 18px. Total per axis: 36px.
  // ============================================================
  const VISUAL_PADDING = 18;
  const TOTAL_PADDING = VISUAL_PADDING * 2; // 36px total per axis

  /**
   * Menghitung OUTER height dari OUTER width, mempertahankan aspect ratio gambar.
   */
  const outerHeightFromOuterWidth = (outerWidth, ratio) => {
    const innerW = Math.max(10, outerWidth - TOTAL_PADDING);
    const innerH = innerW / (ratio || 1);
    return Math.round(innerH + TOTAL_PADDING);
  };

  // Display size (OUTER = inner + padding + borders)
  // Inisialisasi tinggi dari sig.height kalau ada — jangan hardcode 60 supaya
  // signature di sisi receiver tidak "lonjong tipis" sebelum image load.
  const [localSize, setLocalSize] = useState(() => {
    const innerW = sig.width * containerWidth;
    const innerH = (sig.height || 0) * containerHeight;
    return {
      width: Math.round(innerW + TOTAL_PADDING) || 160,
      height: innerH > 0 ? Math.round(innerH + TOTAL_PADDING) : 60,
    };
  });

  // Display position (OUTER = inner position - padding offset)
  const [dragPos, setDragPos] = useState(() => ({
    x: Math.max(0, sig.positionX * containerWidth - VISUAL_PADDING),
    y: Math.max(0, sig.positionY * containerHeight - VISUAL_PADDING)
  }));

  const sigRef = useRef(sig);
  const containerWidthRef = useRef(containerWidth);
  const containerHeightRef = useRef(containerHeight);
  
  useEffect(() => { sigRef.current = sig; }, [sig]);
  useEffect(() => { containerWidthRef.current = containerWidth; }, [containerWidth]);
  useEffect(() => { containerHeightRef.current = containerHeight; }, [containerHeight]);

  // --- CLICK OUTSIDE (DESELECT) ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (nodeRef.current && !nodeRef.current.contains(event.target)) {
        setIsActive(false);
      }
    };
    if (isActive) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isActive]);

  /**
   * Saat gambar tanda tangan dimuat, hitung ukuran yang tepat
   * berdasarkan aspect ratio natural. Tanpa inflate.
   */
  const handleImageLoad = (e) => {
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
      
      setTimeout(() => {
        setLocalSize({ width: outerW, height: outerH });
        onUpdateSize(sigRef.current.id, innerW / cw, innerH / ch);
        isReadyRef.current = true;
        setIsReady(true);
      }, 0);
    }
  };

  // --- RESIZE LOGIC ---
  useEffect(() => {
    if (!isActive) return;
    const handles = [
      { ref: handleNWRef, dir: 'nw' }, { ref: handleNERef, dir: 'ne' },
      { ref: handleSWRef, dir: 'sw' }, { ref: handleSERef, dir: 'se' },
    ];
    const cleanups = [];
    handles.forEach(({ ref, dir }) => {
      const el = ref.current;
      if (!el) return;
      const onStart = (e) => {
        e.stopPropagation(); e.preventDefault();
        isResizingRef.current = true;
        const rect = nodeRef.current.getBoundingClientRect();
        const startW = rect.width;
        const style = window.getComputedStyle(nodeRef.current);
        const matrix = new DOMMatrix(style.transform);
        const startPosX = matrix.m41;
        const startPosY = matrix.m42;
        const startX = e.touches ? e.touches[0].clientX : e.clientX;
        const ratio = aspectRatioRef.current || (startW / rect.height);
        let finalW = startW, finalH = outerHeightFromOuterWidth(startW, ratio), finalX = startPosX, finalY = startPosY;

        const onMove = (moveEvent) => {
          const currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
          const dx = currentX - startX;
          let newW = dir.includes('w') ? startW - dx : startW + dx;
          newW = Math.max(60, newW);
          const newH = outerHeightFromOuterWidth(newW, ratio);
          let newPosX = dir.includes('w') ? startPosX - (newW - startW) : startPosX;
          let newPosY = dir.includes('n') ? startPosY - (newH - outerHeightFromOuterWidth(startW, ratio)) : startPosY;
          const cw = containerWidthRef.current;
          const ch = containerHeightRef.current;
          newPosX = Math.max(0, Math.min(cw - newW, newPosX));
          newPosY = Math.max(0, Math.min(ch - newH, newPosY));
          finalW = newW; finalH = newH; finalX = newPosX; finalY = newPosY;
          if (nodeRef.current) {
            nodeRef.current.style.width = `${Math.round(newW)}px`;
            nodeRef.current.style.height = `${Math.round(newH)}px`;
            nodeRef.current.style.transform = `translate(${Math.round(newPosX)}px, ${Math.round(newPosY)}px)`;
          }
          // Emit realtime resize ke socket (throttled dari parent)
          if (onResizeMove) {
            const cw = containerWidthRef.current;
            const ch = containerHeightRef.current;
            const innerW = Math.max(0, newW - TOTAL_PADDING) / cw;
            const innerH = Math.max(0, newH - TOTAL_PADDING) / ch;
            const innerX = (newPosX + VISUAL_PADDING) / cw;
            const innerY = (newPosY + VISUAL_PADDING) / ch;
            onResizeMove(innerW, innerH, innerX, innerY);
          }
        };

        const onEnd = () => {
          isResizingRef.current = false;
          setLocalSize({ width: finalW, height: finalH });
          setDragPos({ x: finalX, y: finalY });
          
          const cw = containerWidthRef.current;
          const ch = containerHeightRef.current;
          const innerX = (finalX + VISUAL_PADDING) / cw;
          const innerY = (finalY + VISUAL_PADDING) / ch;
          const innerW = Math.max(0, finalW - TOTAL_PADDING) / cw;
          const innerH = Math.max(0, finalH - TOTAL_PADDING) / ch;
          onUpdatePosition(sigRef.current.id, innerX, innerY);
          onUpdateSize(sigRef.current.id, innerW, innerH);
          
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
      cleanups.push(() => { el.removeEventListener('mousedown', onStart); el.removeEventListener('touchstart', onStart); });
    });
    return () => cleanups.forEach(fn => fn());
  }, [isActive, onUpdatePosition, onUpdateSize, onResizeMove]);

  return {
    state: { nodeRef, handleNWRef, handleNERef, handleSWRef, handleSERef, isActive, isDragging, isResizing: isResizingRef.current, localSize, controlledPosition: dragPos, isReady },
    actions: {
      setIsActive, setIsDragging, handleImageLoad,
      // Setter untuk update posisi/size dari sumber eksternal (mis. event socket
      // dari user lain). Pakai ini supaya React render jadi sumber kebenaran
      // tunggal — tidak ada konflik dengan DOM manipulation.
      setControlledPosition: setDragPos,
      setControlledSize: setLocalSize,
      onDragStart: (e) => { if (isResizingRef.current) return false; e.stopPropagation(); setIsDragging(true); setIsActive(true); },
      onDrag: (e, data) => setDragPos({ x: data.x, y: data.y }),
      onDragStop: (e, data) => {
        setIsDragging(false);
        setDragPos({ x: data.x, y: data.y });
        const innerX = (data.x + VISUAL_PADDING) / containerWidth;
        const innerY = (data.y + VISUAL_PADDING) / containerHeight;
        onUpdatePosition(sig.id, innerX, innerY);
      },
      handleOutsideInteraction: (e) => { e.stopPropagation(); setIsActive(true); }
    }
  };
};
