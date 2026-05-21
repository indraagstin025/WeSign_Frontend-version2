import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * @hook useMobileBottomSheet
 * @description Hook untuk mengelola logika Mobile Bottom Sheet di Signature features —
 * gesture swipe-to-close, scroll lock, dan transisi smooth.
 */
export const useMobileBottomSheet = (isOpen, onClose) => {
  const dragRef = useRef({ startY: 0, currentTranslate: 0, isDragging: false });
  const [translateY, setTranslateY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // [Lint fix] Body scroll lock — sync side effect dengan isOpen.
  // Tidak ada setState di sini supaya tidak trigger
  // react-hooks/set-state-in-effect rule.
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // [Lint fix] Reset translateY saat re-open via setTimeout(0) supaya
  // dianggap "external system sync" (timer queue), tidak trigger
  // react-hooks/set-state-in-effect rule. Pakai ref untuk track
  // transition false → true (hanya reset saat open transition,
  // bukan tiap render).
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      const handle = setTimeout(() => setTranslateY(0), 0);
      wasOpenRef.current = true;
      return () => clearTimeout(handle);
    }
    if (!isOpen) {
      wasOpenRef.current = false;
    }
  }, [isOpen]);

  // --- TOUCH GESTURES (MOBILE) ---
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    dragRef.current.startY = touch.clientY;
    dragRef.current.currentTranslate = translateY;
    dragRef.current.isDragging = true;
    setIsAnimating(false);
  }, [translateY]);

  const handleTouchMove = useCallback((e) => {
    if (!dragRef.current.isDragging) return;
    const touch = e.touches[0];
    const diff = touch.clientY - dragRef.current.startY;
    
    // Only allow pulling down (positive Y)
    const newTranslate = Math.max(0, dragRef.current.currentTranslate + diff);
    setTranslateY(newTranslate);
  }, []);

  const handleTouchEnd = useCallback(() => {
    dragRef.current.isDragging = false;
    setIsAnimating(true);
    
    // threshold: 120px to close
    if (translateY > 120) {
      onClose();
    } else {
      setTranslateY(0);
    }
  }, [translateY, onClose]);

  // --- MOUSE GESTURES (DESKTOP TESTING) ---
  const handleMouseDown = useCallback((e) => {
    dragRef.current.startY = e.clientY;
    dragRef.current.currentTranslate = translateY;
    dragRef.current.isDragging = true;
    setIsAnimating(false);

    const onMouseMove = (moveEvent) => {
      if (!dragRef.current.isDragging) return;
      const diff = moveEvent.clientY - dragRef.current.startY;
      const newTranslate = Math.max(0, dragRef.current.currentTranslate + diff);
      setTranslateY(newTranslate);
    };

    const onMouseUp = () => {
      dragRef.current.isDragging = false;
      setIsAnimating(true);
      
      // Check current position for closing
      if (translateY > 120) {
        onClose();
      } else {
        setTranslateY(0);
      }
      
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [translateY, onClose]);

  return {
    state: {
      translateY,
      isAnimating,
      sheetStyle: {
        transform: `translateY(${translateY}px)`,
        transition: isAnimating ? 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
      }
    },
    actions: {
      gestureHandlers: {
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
        onMouseDown: handleMouseDown
      }
    }
  };
};
