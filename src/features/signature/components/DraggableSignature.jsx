import React from 'react';
import Draggable from 'react-draggable';
import { Trash2 } from 'lucide-react';
import { useDraggableSignature } from '../hooks/useDraggableSignature';

/**
 * @component DraggableSignature
 * @description Komponen tanda tangan interaktif — Ultra-Smooth Mobile Version.
 * Refaktorisasi: Logika koordinat & resize dipisahkan ke useDraggableSignature hook.
 */
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

  // Handle styles — 28px di mobile, 14px di desktop
  const handleBase = "absolute bg-white border-2 border-primary rounded-full z-[60] pointer-events-auto shadow-md";
  const handleSize = "w-[28px] h-[28px] sm:w-3.5 sm:h-3.5";

  return (
    <Draggable
      nodeRef={state.nodeRef}
      bounds="parent"
      position={state.controlledPosition}
      cancel=".resize-handle"
      onStart={actions.onDragStart}
      onStop={actions.onDragStop}
    >
      <div 
        ref={state.nodeRef}
        onClick={actions.handleOutsideInteraction}
        onMouseEnter={() => actions.handleHover(true)}
        onMouseLeave={() => actions.handleHover(false)}
        className={`absolute group cursor-grab active:cursor-grabbing pointer-events-auto flex flex-col items-center justify-center \
          ${state.isActive ? 'z-50 bg-white/80 shadow-lg border-2 border-primary' : 'z-20 border border-transparent hover:border-primary/40 hover:border-dashed'} \
          transition-colors duration-200\
        `}
        style={{
          width: state.localSize.width,
          height: state.localSize.height,
          left: 0,
          top: 0,
          touchAction: 'none',
        }}
      >
        {/* Floating Delete Button */}
        {state.isActive && (
          <div className="absolute -top-10 sm:-top-5 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 z-[70] pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(sig.id);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="resize-handle w-9 h-9 sm:w-6 sm:h-6 bg-white text-slate-500 rounded-lg sm:rounded-md flex items-center justify-center shadow-lg hover:bg-rose-500 hover:text-white transition-colors border border-slate-200 active:scale-90 border-none cursor-pointer"
              title="Hapus Tanda Tangan"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        {/* 4 Corner Resize Handles */}
        {state.isActive && (
          <>
            <div 
              ref={state.handleNWRef}
              className={`resize-handle ${handleBase} ${handleSize} -top-3.5 -left-3.5 sm:-top-1.5 sm:-left-1.5 cursor-nwse-resize`}
              style={{ touchAction: 'none' }}
            />
            <div 
              ref={state.handleNERef}
              className={`resize-handle ${handleBase} ${handleSize} -top-3.5 -right-3.5 sm:-top-1.5 sm:-right-1.5 cursor-nesw-resize`}
              style={{ touchAction: 'none' }}
            />
            <div 
              ref={state.handleSWRef}
              className={`resize-handle ${handleBase} ${handleSize} -bottom-3.5 -left-3.5 sm:-bottom-1.5 sm:-left-1.5 cursor-nesw-resize`}
              style={{ touchAction: 'none' }}
            />
            <div 
              ref={state.handleSERef}
              className={`resize-handle ${handleBase} ${handleSize} -bottom-3.5 -right-3.5 sm:-bottom-1.5 sm:-right-1.5 cursor-nwse-resize`}
              style={{ touchAction: 'none' }}
            />
          </>
        )}

        {/* Signature Image */}
        <div className="w-full h-full p-1 box-border flex items-center justify-center">
           <div className="w-full h-full overflow-hidden flex items-center justify-center">
            <img 
              src={sig.signatureImageUrl} 
              alt="Signature" 
              onLoad={actions.handleImageLoad}
              className="max-w-full max-h-full object-contain pointer-events-none select-none"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </Draggable>
  );
};

export default DraggableSignature;
