import { useRef, useState, useEffect } from 'react';

/**
 * Hook for managing the logic of Draggable & Resizable Signature.
 * Optimized for performance using direct DOM manipulation for resizing.
 */
export const useDraggableSignature = (sig, containerWidth, containerHeight, onUpdatePosition, onUpdateSize) => {
  const nodeRef = useRef(null);
  const handleNWRef = useRef(null);
  const handleNERef = useRef(null);
  const handleSWRef = useRef(null);
  const handleSERef = useRef(null);
  
  const [isActive, setIsActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isResizingRef = useRef(false);

  // Initial calculation
  const getInitialSize = () => {
    const w = sig.width * containerWidth;
    const h = sig.height && sig.height !== 0.075 
      ? sig.height * containerHeight 
      : w * 0.5;
    return { width: w, height: h };
  };

  const [localSize, setLocalSize] = useState(getInitialSize());

  // Sync state with props
  useEffect(() => {
    if (!isResizingRef.current) {
      setLocalSize({
        width: sig.width * containerWidth,
        height: sig.height * containerHeight
      });
    }
  }, [sig.width, sig.height, containerWidth, containerHeight]);

  // Click outside detection
  useEffect(() => {
    if (!isActive) return;
    const handleOutsideClick = (e) => {
      if (isResizingRef.current) return;
      if (nodeRef.current && !nodeRef.current.contains(e.target)) {
        setIsActive(false);
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handleOutsideClick);
    }, 150);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, [isActive]);

  // Stable refs for event listeners
  const sigRef = useRef(sig);
  const localSizeRef = useRef(localSize);
  const containerWidthRef = useRef(containerWidth);
  const containerHeightRef = useRef(containerHeight);
  
  useEffect(() => { sigRef.current = sig; }, [sig]);
  useEffect(() => { localSizeRef.current = localSize; }, [localSize]);
  useEffect(() => { containerWidthRef.current = containerWidth; }, [containerWidth]);
  useEffect(() => { containerHeightRef.current = containerHeight; }, [containerHeight]);

  // Direct DOM Resize Logic
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
        
        const cw = containerWidthRef.current;
        const ch = containerHeightRef.current;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        
        const currentSig = sigRef.current;
        const currentSize = localSizeRef.current;
        const startMouseX = clientX;
        const startW = currentSize.width;
        const startH = currentSize.height;
        const startPosX = currentSig.positionX * cw;
        const startPosY = currentSig.positionY * ch;
        const aspectRatio = startW / startH;

        let finalW = startW, finalH = startH;
        let finalPosX = startPosX, finalPosY = startPosY;

        const onMove = (moveEvent) => {
          moveEvent.preventDefault();
          moveEvent.stopPropagation();
          
          const cwNow = containerWidthRef.current;
          const currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
          const dx = currentX - startMouseX;
          
          let newW = dir.includes('w') ? startW - dx : startW + dx;
          newW = Math.max(40, Math.min(cwNow * 0.8, newW));
          const newH = newW / aspectRatio;
          
          const deltaW = newW - startW;
          const deltaH = newH - startH;

          let newPosX = startPosX;
          if (dir.includes('w')) newPosX -= deltaW;
          let newPosY = startPosY;
          if (dir.includes('n')) newPosY -= deltaH;

          finalW = newW; finalH = newH;
          finalPosX = newPosX; finalPosY = newPosY;

          // ⚡ DIRECT DOM MANIPULATION
          const domNode = nodeRef.current;
          if (domNode) {
            domNode.style.width = `${newW}px`;
            domNode.style.height = `${newH}px`;
            domNode.style.transform = `translate(${newPosX}px, ${newPosY}px)`;
          }
        };

        const onEnd = () => {
          isResizingRef.current = false;
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onEnd);
          document.removeEventListener('touchmove', onMove);
          document.removeEventListener('touchend', onEnd);
          document.removeEventListener('touchcancel', onEnd);
          
          setLocalSize({ width: finalW, height: finalH });
          localSizeRef.current = { width: finalW, height: finalH };
          
          onUpdatePosition(sigRef.current.id, finalPosX / containerWidthRef.current, finalPosY / containerHeightRef.current);
          onUpdateSize(sigRef.current.id, finalW / containerWidthRef.current, finalH / containerHeightRef.current);
        };

        document.addEventListener('mousemove', onMove, { passive: false });
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
        document.addEventListener('touchcancel', onEnd);
      };

      el.addEventListener('mousedown', onStart, { passive: false });
      el.addEventListener('touchstart', onStart, { passive: false });
      cleanups.push(() => {
        el.removeEventListener('mousedown', onStart);
        el.removeEventListener('touchstart', onStart);
      });
    });

    return () => cleanups.forEach(fn => fn());
  }, [isActive, onUpdatePosition, onUpdateSize]);

  // Image load & Aspect ratio fix
  const handleImageLoad = (e) => {
    const naturalW = e.target.naturalWidth;
    const naturalH = e.target.naturalHeight;
    if (naturalW > 0 && naturalH > 0) {
      const actualRatio = naturalW / naturalH;
      const currentRatio = sig.width / sig.height;
      if (Math.abs(actualRatio - currentRatio) > 0.1) {
        const realHeightPx = (sig.width * containerWidth) / actualRatio;
        onUpdateSize(sig.id, sig.width, realHeightPx / containerHeight);
      }
    }
  };

  return {
    state: {
      nodeRef,
      handleNWRef,
      handleNERef,
      handleSWRef,
      handleSERef,
      isActive,
      isDragging,
      isResizing: isResizingRef.current,
      localSize,
      controlledPosition: {
        x: sig.positionX * containerWidth,
        y: sig.positionY * containerHeight
      }
    },
    actions: {
      setIsActive,
      setIsDragging,
      handleImageLoad,
      onDragStart: (e) => {
        if (isResizingRef.current) return false;
        e.stopPropagation();
        setIsDragging(true);
        setIsActive(true);
      },
      onDragStop: (e, data) => {
        setIsDragging(false);
        onUpdatePosition(sig.id, data.x / containerWidth, data.y / containerHeight);
      },
      handleOutsideInteraction: (e) => {
        e.stopPropagation();
        if (!isDragging && !isResizingRef.current) {
          setIsActive(prev => !prev);
        }
      },
      handleHover: (active) => {
        if (!isDragging && window.innerWidth >= 640) setIsActive(active);
      }
    }
  };
};
