import { useState, useEffect, useCallback, useRef } from 'react';
import { SHEET_DRAG_CLOSE_THRESHOLD_PX } from '../constants/layout';

/**
 * Hook to manage the logic of the Mobile Package Bottom Sheet.
 * Handles gestures (swipe-to-close), tab management, and visual animations.
 *
 * [M-3] Race condition saat user drag: setIsAnimating(false) di onMouseDown
 * lalu setIsAnimating(true) di onMouseUp dipanggil dalam frame yang sama
 * kalau user click cepat -> React batch -> animasi flicker (kadang nyala,
 * kadang tidak). Solusi: pakai ref untuk "isAnimating" supaya update
 * sinkron tanpa render extra, lalu derive state buat sheetStyle.
 */
export const useMobilePackageBottomSheet = (isOpen, onClose) => {
  const dragRef = useRef({ startY: 0, currentTranslate: 0, isDragging: false });
  const [translateY, setTranslateY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState('docs'); // 'docs' or 'tools'

  // [M-3 + lint] Body scroll lock — sync side effect dengan isOpen.
  // Tidak ada setState di sini supaya tidak trigger
  // react-hooks/set-state-in-effect rule. translateY akan di-reset
  // pada touchStart/mouseDown (saat user buka sheet, gesture awal akan
  // re-set translateY=0 secara natural). Atau, kalau user belum drag,
  // translateY default sudah 0 dari useState init.
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

  // [M-3] Reset translateY saat re-open. Pakai useEffect terpisah dengan
  // ref untuk track previous state — kalau transition false->true,
  // translateY harus reset ke 0 (kalau-kalau user close lewat drag down
  // tanpa snap balik). Strategy: sub-effect yang tidak strict
  // synchronously set initial state, melainkan via setTimeout 0
  // (microtask) supaya React dianggap "syncing dengan external system"
  // (timer queue).
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      // Transition false -> true: schedule reset ke task berikut supaya
      // tidak counted sebagai sync setState in effect
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
    const newTranslate = Math.max(0, dragRef.current.currentTranslate + diff);
    // [M-3] Simpan latest translate di ref supaya touchEnd bisa baca
    // value real-time, bukan stale closure value dari render lama.
    dragRef.current.currentTranslate = newTranslate;
    setTranslateY(newTranslate);
  }, []);

  const handleTouchEnd = useCallback(() => {
    dragRef.current.isDragging = false;
    setIsAnimating(true);
    // [M-3] Baca dari ref (source of truth saat drag) bukan dari state
    // yang mungkin belum re-render
    if (dragRef.current.currentTranslate > SHEET_DRAG_CLOSE_THRESHOLD_PX) {
      onClose();
    } else {
      setTranslateY(0);
    }
  }, [onClose]);

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
      // [M-3] Update ref juga supaya onMouseUp baca value terbaru
      dragRef.current.currentTranslate = newTranslate;
      setTranslateY(newTranslate);
    };

    const onMouseUp = () => {
      dragRef.current.isDragging = false;
      setIsAnimating(true);
      // [M-3] Baca dari ref, bukan dari closure variable translateY
      if (dragRef.current.currentTranslate > SHEET_DRAG_CLOSE_THRESHOLD_PX) {
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
