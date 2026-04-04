import React from 'react';
import { 
  X, 
  RotateCcw, 
  Check, 
  PenTool, 
} from 'lucide-react';
import { useSignatureCanvas } from '../hooks/useSignatureCanvas';

/**
 * @component SignatureCanvas
 * @description Komponen kanvas internal untuk membuat tanda tangan (hand-drawn).
 * Refaktorisasi: Logika kanvas & koordinat dipisahkan ke useSignatureCanvas hook.
 */
const SignatureCanvas = ({ isOpen, onClose, onSave }) => {
  const { state, actions } = useSignatureCanvas(isOpen, onSave, onClose);

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
            <div className="text-left">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Buat Tanda Tangan</h3>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Gunakan cursor atau jari Anda</p>
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
                onClick={() => actions.setColor('#000000')}
                className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${state.color === '#000000' ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-transparent bg-black hover:scale-105'}`}
                title="Hitam"
              />
              <button 
                onClick={() => actions.setColor('#1E40AF')}
                className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${state.color === '#1E40AF' ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-transparent bg-blue-800 hover:scale-105'}`}
                title="Biru Tua"
              />
           </div>

           <div className="flex items-center gap-2">
             <button 
                onClick={actions.clear}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all border-none bg-transparent cursor-pointer"
             >
               <RotateCcw size={14} /> Reset Kanvas
             </button>
           </div>
        </div>

        {/* CANVAS AREA */}
        <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 p-6 flex items-center justify-center relative min-h-[300px]" style={{ touchAction: 'none' }}>
          <canvas 
            ref={state.canvasRef}
            {...actions.mouseHandlers}
            className="bg-white rounded-2xl shadow-inner border-2 border-dashed border-slate-200 dark:border-slate-800 cursor-crosshair w-full h-full max-h-[400px]"
            style={{ touchAction: 'none' }}
          />
          {state.isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 select-none">
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
            onClick={actions.save}
            disabled={state.isEmpty}
            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold transition-all border-none cursor-pointer shadow-lg
              ${state.isEmpty 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-primary text-white hover:bg-primary-dark shadow-primary/20 active:scale-95'
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
