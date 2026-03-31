import React, { useRef, useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { Trash2, MoveDiagonal } from 'lucide-react';

/**
 * @component DraggableSignature
 * @description Komponen tanda tangan interaktif yang mendukung Drag-and-Drop dan Resizing.
 * Menggunakan nodeRef untuk menghindari error findDOMNode di React 18.
 */
const DraggableSignature = ({ 
  sig, 
  onRemove, 
  onUpdatePosition, 
  onUpdateSize,
  containerWidth,
  containerHeight
}) => {
  const nodeRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const initialWidth = sig.width * containerWidth;
  const initialHeight = sig.height && sig.height !== 0.075 
    ? sig.height * containerHeight 
    : initialWidth * 0.5;

  const [localSize, setLocalSize] = useState({
    width: initialWidth,
    height: initialHeight
  });

  // Update local size secara instan jika ada props luar yang berubah drastis 
  // (misalnya setelah auto-detect aspect ratio diset dari API/parent)
  useEffect(() => {
    setLocalSize({
      width: sig.width * containerWidth,
      height: sig.height * containerHeight
    });
  }, [sig.width, sig.height, containerWidth, containerHeight]);

  // Gunakan langsung perhitungan koordinat pojok kiri atas (Top-Left) ke pixel karena state telah diformat sesuai API
  const controlledPosition = {
    x: sig.positionX * containerWidth,
    y: sig.positionY * containerHeight
  };

  const handleImageLoad = (e) => {
    const naturalW = e.target.naturalWidth;
    const naturalH = e.target.naturalHeight;
    if (naturalW > 0 && naturalH > 0) {
      const actualRatio = naturalW / naturalH;
      const currentRatio = sig.width / sig.height;
      
      // Jika beda tipis atau belum pernah disesuaikan, koreksi tinggi proporsionalnya
      if (Math.abs(actualRatio - currentRatio) > 0.1) {
        // realHeight_in_px = width_in_px / actualRatio
        // height_pct = realHeight_in_px / containerHeight
        const realHeightPx = (sig.width * containerWidth) / actualRatio;
        const newHeightPct = realHeightPx / containerHeight;
        
        onUpdateSize(sig.id, sig.width, newHeightPct);
      }
    }
  };

  // Handler untuk Resizing (Manual drag pada handle)
  const handleResizeStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    const startX = e.clientX;
    const startWidth = localSize.width;
    // Tangkap rasio asli saat drag mulai agar kotak tidak pipih jadi 2:1!
    const currentRatio = localSize.width / localSize.height;

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(50, Math.min(containerWidth * 0.5, startWidth + deltaX));
      // Gunakan currentRatio yang valid, hindari paksaan 0.5
      const newHeight = newWidth / currentRatio;
      
      setLocalSize({ width: newWidth, height: newHeight });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      // Pastikan ketika mouse up, kita membidik state UI secara tepat 
      // menggunakan referensi state localSize terbaru melalui setter agar tak terjadi stale closure.
      setLocalSize(finalLocalSize => {
         onUpdateSize(sig.id, finalLocalSize.width / containerWidth, finalLocalSize.height / containerHeight);
         return finalLocalSize;
      });
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      bounds="parent"
      position={controlledPosition}
      onStart={(e) => {
        // [FIX] Stop propagation sejak awal drag agar tidak memicu Click-to-Place di background
        e.stopPropagation();
        setIsDragging(true);
        setIsActive(true);
      }}
      onDrag={(e, data) => {
        // Laporkan posisi langsung (pojok kiri atas/Top-Left) ke parent
        onUpdatePosition(sig.id, data.x / containerWidth, data.y / containerHeight);
      }}
      onStop={(e, data) => {
        setIsDragging(false);
        onUpdatePosition(sig.id, data.x / containerWidth, data.y / containerHeight);
      }}
    >
      <div 
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
          if (!isDragging) setIsActive(!isActive);
        }}
        onMouseEnter={() => !isDragging && setIsActive(true)}
        onMouseLeave={() => !isDragging && setIsActive(false)}
        className={`absolute group/sig cursor-grab active:cursor-grabbing transition-shadow pointer-events-auto
          ${isActive ? 'z-30 ring-2 ring-primary ring-offset-2 ring-offset-transparent shadow-xl' : 'z-20 hover:ring-1 hover:ring-primary/40 shadow-sm'}
          bg-white/10 backdrop-blur-[1px] rounded-lg
        `}
        style={{
          width: localSize.width,
          height: localSize.height,
          left: 0,
          top: 0,
        }}
      >
        {/* Gambar Tanda Tangan (Murni 100% dari Box agar akurat dengan Backend) */}
        <div className="w-full h-full flex items-center justify-center select-none overflow-hidden rounded-md">
          <img 
            src={sig.signatureImageUrl} 
            alt="Signature" 
            onLoad={handleImageLoad}
            className="max-w-full max-h-full object-contain pointer-events-none"
          />
        </div>

        {/* TOOLBAR CONTROLS */}
        {isActive && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(sig.id);
              }}
              className="absolute -top-3 -right-3 sm:-top-3 sm:-right-3 w-8 h-8 sm:w-7 sm:h-7 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg border-none hover:bg-rose-600 transition-colors cursor-pointer z-40 animate-in zoom-in duration-200"
              title="Hapus"
            >
              <Trash2 size={16} className="sm:w-3.5 sm:h-3.5" />
            </button>

            <div
              onMouseDown={handleResizeStart}
              onTouchStart={handleResizeStart}
              className="absolute -bottom-2 -right-2 sm:-bottom-1.5 sm:-right-1.5 w-8 h-8 sm:w-6 sm:h-6 bg-primary text-white rounded-lg sm:rounded-md flex items-center justify-center cursor-nwse-resize shadow-md hover:scale-110 active:scale-95 transition-transform z-40 animate-in zoom-in duration-200"
              title="Ubah Ukuran"
            >
              <MoveDiagonal size={16} className="sm:w-3.5 sm:h-3.5" />
            </div>
          </>
        )}
      </div>
    </Draggable>
  );
};

export default DraggableSignature;
