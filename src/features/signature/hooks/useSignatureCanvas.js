import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage the logic of a Drawing Canvas for Signatures.
 * Handles DPR (Retina) scaling, mouse/touch drawing, and image generation.
 */
export const useSignatureCanvas = (isOpen, onSave, onClose) => {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2.5);
  const [isEmpty, setIsEmpty] = useState(true);
  const dprRef = useRef(window.devicePixelRatio || 1);

  // --- INTERNAL: Sync context styles ---
  const syncContextStyles = (ctx, dpr) => {
    if (!ctx) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth * dpr;
  };

  // --- INTERNAL: Resize & DPR Logic ---
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;
    const rect = canvas.getBoundingClientRect();
    
    // Set internal resolution
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Scale context for CSS pixel space
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    syncContextStyles(ctx, dpr);
    setIsEmpty(true);
  }, [color, lineWidth]);

  // Lifecycle for Resize & Scroll Lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(resizeCanvas, 100);
      window.addEventListener('resize', resizeCanvas);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', resizeCanvas);
      };
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isOpen, resizeCanvas]);

  // --- COORDINATE HELPER ---
  const getCoordinates = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches?.[0]?.clientX ?? 0);
    const clientY = e.clientY ?? (e.touches?.[0]?.clientY ?? 0);
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  // --- MOUSE DRAWING ---
  const startDrawingMouse = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
    setIsDrawing(true);
    setIsEmpty(false);
  }, [getCoordinates]);

  const drawMouse = useCallback((e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [getCoordinates]);

  const stopDrawing = useCallback(() => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      setIsDrawing(false);
    }
  }, []);

  // --- TOUCH DRAWING (Non-Passive) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isOpen) return;

    const handleTouchStart = (e) => {
      e.preventDefault();
      const { x, y } = getCoordinates(e);
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(x, y);
      isDrawingRef.current = true;
      setIsDrawing(true);
      setIsEmpty(false);
    };

    const handleTouchMove = (e) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      const { x, y } = getCoordinates(e);
      const ctx = canvas.getContext('2d');
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const handleTouchEnd = (e) => {
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        setIsDrawing(false);
      }
    };

    // Use passive: false to allow preventDefault()
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, getCoordinates]);

  // --- ACTIONS ---
  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (isEmpty || !canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  return {
    state: {
      canvasRef,
      isDrawing,
      isEmpty,
      color,
      lineWidth
    },
    actions: {
      setColor,
      setLineWidth,
      clear,
      save,
      mouseHandlers: {
        onMouseDown: startDrawingMouse,
        onMouseMove: drawMouse,
        onMouseUp: stopDrawing,
        onMouseOut: stopDrawing
      }
    }
  };
};
