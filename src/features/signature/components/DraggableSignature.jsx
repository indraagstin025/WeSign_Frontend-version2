import React from 'react';
import Draggable from 'react-draggable';
import { X } from 'lucide-react'; 
import { useDraggableSignature } from '../hooks/useDraggableSignature';

const DraggableSignature = ({ 
  sig, 
  onRemove, 
  onUpdatePosition, 
  onUpdateSize,
  containerWidth,
  containerHeight
}) => {
  const { state, actions } = useDraggableSignature(
    sig, 
    containerWidth, 
    containerHeight, 
    onUpdatePosition, 
    onUpdateSize
  );

  const handleBase = "absolute w-3 h-3 bg-[#3b82f6] border-2 border-white rounded-full z-[60] pointer-events-auto shadow-sm active:scale-125 transition-all";
  
  // Sekarang visual sepenuhnya bergantung pada isActive (klik)
  const isVisible = state.isActive || state.isDragging;

  const handleVisibleClass = isVisible 
    ? "opacity-100 scale-100" 
    : "opacity-0 scale-75 transition-all"; // Hapus group-hover

  let outerBorderClass = state.isActive 
    ? "border border-blue-500 bg-white/40 shadow-sm z-50 p-4" 
    : "border border-transparent z-20 p-4"; // Hapus hover:border-blue

  return (
    <Draggable
      nodeRef={state.nodeRef}
      bounds="parent"
      position={{ 
        x: Math.round(state.controlledPosition.x), 
        y: Math.round(state.controlledPosition.y) 
      }}
      cancel=".resize-handle, .delete-btn"
      onStart={actions.onDragStart}
      onDrag={actions.onDrag}
      onStop={actions.onDragStop}
    >
      <div 
        ref={state.nodeRef}
        // Hanya trigger isActive saat klik
        onMouseDown={(e) => { e.stopPropagation(); actions.setIsActive(true); }}
        onTouchStart={(e) => { e.stopPropagation(); actions.setIsActive(true); }}
        onClick={(e) => { e.stopPropagation(); actions.setIsActive(true); }}
        // HAPUS onMouseEnter & onMouseLeave di sini
        className={`absolute group cursor-grab active:cursor-grabbing pointer-events-auto flex flex-col items-center justify-center transition-opacity duration-300 box-border ${state.isReady ? 'opacity-100' : 'opacity-0'} ${outerBorderClass}`}
        style={{
          width: state.localSize.width,
          height: state.localSize.height,
          left: 0,
          top: 0,
          touchAction: 'none',
        }}
      >
        <div className={`absolute -top-10 left-1/2 -translate-x-1/2 pb-4 z-[70] transition-all duration-200 ${isVisible ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(sig.id); }}
              onMouseDown={(e) => e.stopPropagation()}
              className="delete-btn w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-rose-600 transition-all border-none active:scale-90 cursor-pointer"
            >
              <X size={16} strokeWidth={3} />
            </button>
        </div>

        {/* Handles & Inner Image (Tetap Sama) */}
        <div ref={state.handleNWRef} className={`resize-handle ${handleBase} ${handleVisibleClass} -top-1.5 -left-1.5 cursor-nwse-resize`} style={{ touchAction: 'none' }} />
        <div ref={state.handleNERef} className={`resize-handle ${handleBase} ${handleVisibleClass} -top-1.5 -right-1.5 cursor-nesw-resize`} style={{ touchAction: 'none' }} />
        <div ref={state.handleSWRef} className={`resize-handle ${handleBase} ${handleVisibleClass} -bottom-1.5 -left-1.5 cursor-nesw-resize`} style={{ touchAction: 'none' }} />
        <div ref={state.handleSERef} className={`resize-handle ${handleBase} ${handleVisibleClass} -bottom-1.5 -right-1.5 cursor-nwse-resize`} style={{ touchAction: 'none' }} />

        <div className={`w-full h-full flex items-center justify-center transition-all duration-200 rounded-none box-border ${state.isActive ? "bg-white/50 border border-[#f87171]" : "border border-[#f87171]/40"}`}>
          <img 
            src={sig.signatureImageUrl} 
            alt="Signature" 
            onLoad={actions.handleImageLoad}
            className="w-full h-full object-contain pointer-events-none select-none block"
            draggable={false}
            style={{ imageRendering: 'high-quality' }}
          />
        </div>
      </div>
    </Draggable>
  );
};

export default DraggableSignature;