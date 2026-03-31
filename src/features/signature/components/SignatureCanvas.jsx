import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  RotateCcw, 
  Check, 
  Type, 
  PenTool, 
  Eraser,
  Trash2
} from 'lucide-react';

/**
 * @component SignatureCanvas
 * @description Komponen kanvas internal untuk membuat tanda tangan (hand-drawn).
 *              Mendukung: Menggambar, Menghapus, Ganti Warna, dan Preview.
 */
const SignatureCanvas = ({ isOpen, onClose, onSave }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset canvas if needed
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (isEmpty) return;
    
    // Trim canvas (opsional tapi bagus untuk premium feel)
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <PenTool size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Buat Tanda Tangan</h3>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Gambar pada area di bawah</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* TOOLS BAR */}
        <div className="px-6 py-3 bg-white dark:bg-slate-900 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50">
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setColor('#000000')}
                className={`w-8 h-8 rounded-full border-2 transition-all ${color === '#000000' ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-transparent bg-black opacity-60'}`}
                title="Hitam"
              />
              <button 
                onClick={() => setColor('#1E40AF')}
                className={`w-8 h-8 rounded-full border-2 transition-all ${color === '#1E40AF' ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-transparent bg-blue-800 opacity-60'}`}
                title="Biru Tua"
              />
           </div>

           <div className="flex items-center gap-2">
             <button 
               onClick={clear}
               className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all border-none bg-transparent cursor-pointer"
             >
               <RotateCcw size={14} /> Reset
             </button>
           </div>
        </div>

        {/* CANVAS AREA */}
        <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 p-6 flex items-center justify-center relative touch-none">
          <canvas 
            ref={canvasRef}
            width={600}
            height={300}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-inner border-2 border-dashed border-slate-200 dark:border-slate-800 cursor-crosshair w-full h-[250px] sm:h-[300px]"
          />
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 dark:opacity-10 select-none">
               <span className="text-2xl font-bold tracking-[0.2em] text-slate-400 uppercase italic">Tanda Tangan Di Sini</span>
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/30 dark:bg-slate-900/30">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border-none bg-transparent cursor-pointer"
          >
            Batal
          </button>
          <button 
            onClick={handleSave}
            disabled={isEmpty}
            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold transition-all border-none cursor-pointer shadow-lg
              ${isEmpty 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-primary text-white hover:bg-primary-dark shadow-primary/20'
              }
            `}
          >
            <Check size={18} /> Simpan Tanda Tangan
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureCanvas;
