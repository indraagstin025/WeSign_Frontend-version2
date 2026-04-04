import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to manage the logic of the Mobile Bottom Sheet in Signature features.
 * Handles swipe-to-close gestures, scroll locking, and smooth transitions.
 */
export const useMobileBottomSheet = (isOpen, onClose) => {
  const dragRef = useRef({ startY: 0, currentTranslate: 0, isDragging: false });
  const [translateY, setTranslateY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Sync body scroll lock when open
  useEffect(() => {
    if (isOpen) {
      setTranslateY(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // --- TOUCH GESTURES (MOBILE) ---
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    dragRef.current.startY = touch.clientX; // Logic note: original code used clientY
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

    const onMouseUp = (upEvent) => {
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
