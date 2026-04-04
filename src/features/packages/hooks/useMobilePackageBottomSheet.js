import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to manage the logic of the Mobile Package Bottom Sheet.
 * Handles gestures (swipe-to-close), tab management, and visual animations.
 */
export const useMobilePackageBottomSheet = (isOpen, onClose) => {
  const dragRef = useRef({ startY: 0, currentTranslate: 0, isDragging: false });
  const [translateY, setTranslateY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState('docs'); // 'docs' or 'tools'

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
    dragRef.current.startY = touch.clientY;
    dragRef.current.currentTranslate = translateY;
    dragRef.current.isDragging = true;
    setIsAnimating(false);
  }, [translateY]);

  const handleTouchMove = useCallback((e) => {
    if (!dragRef.current.isDragging) return;
    const touch = e.touches[0];
    const diff = touch.clientY - dragRef.current.startY;
    const newTranslate = Math.max(0, dragRef.current.currentTranslate + diff);
    setTranslateY(newTranslate);
  }, []);

  const handleTouchEnd = useCallback(() => {
    dragRef.current.isDragging = false;
    setIsAnimating(true);
    if (translateY > 120) {
      onClose();
    } else {
      setTranslateY(0);
    }
  }, [translateY, onClose]);

  // --- MOUSE GESTURES (DESKTOP SIMULATION) ---
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
    activeTab,
    setActiveTab,
    translateY,
    isAnimating,
    gestureHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown
    },
    // Derived style for the sheet container
    sheetStyle: {
      transform: `translateY(${translateY}px)`,
      transition: isAnimating ? 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
    }
  };
};
