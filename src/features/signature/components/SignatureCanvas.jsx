import React from 'react';
import { 
  X, 
  RotateCcw, 
  Check, 
  PenTool, 
  Type,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { useSignatureModal } from '../hooks/useSignatureModal';

/**
 * @component SignatureCanvas
 * @description Komponen kanvas internal untuk membuat tanda tangan (hand-drawn).
 * Refaktorisasi: Logika kanvas & koordinat dipisahkan ke useSignatureCanvas hook.
 */
const SignatureCanvas = ({ isOpen, onClose, onSave }) => {
  const { state, actions } = useSignatureModal(isOpen, onSave, onClose);
  const { canvasState, activeTab } = state;

  if (!isOpen) return null;

  const fonts = [
    { name: 'Dancing Script', id: 'font-dancing', family: 'dancing' },
    { name: 'Caveat', id: 'font-caveat', family: 'caveat' },
    { name: 'Sacramento', id: 'font-sacramento', family: 'sacramento' },
    { name: 'Inter', id: 'font-inter', family: 'inter' },
  ];

  return (
    <div
      className="fixed inset-0 z-[200] bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      
      <div
        className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[95dvh] sm:max-h-[90dvh] transition-colors duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-zinc-800 dark:text-white">Tentukan tanda tangan Anda</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl border-none bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* TOP TABS NAVIGATION */}
        <div className="flex px-2 sm:px-6 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 overflow-x-auto no-scrollbar">
           <button className="px-3 sm:px-6 py-2.5 sm:py-3 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold border-b-2 border-rose-500 text-zinc-900 dark:text-white bg-transparent cursor-pointer transition-all whitespace-nowrap">
             <PenTool size={14} className="text-sky-600 sm:w-4 sm:h-4" /> Tanda tangan
           </button>
           <button className="px-3 sm:px-6 py-2.5 sm:py-3 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold border-b-2 border-transparent text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 bg-transparent cursor-pointer transition-all whitespace-nowrap">
             <span className="text-sky-600 font-bold border border-sky-600 rounded px-1 text-[9px]">AC</span> Inisial
           </button>
           <button className="px-3 sm:px-6 py-2.5 sm:py-3 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold border-b-2 border-transparent text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 bg-transparent cursor-pointer transition-all whitespace-nowrap">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-sky-600"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Stempel
           </button>
        </div>

        {/* MAIN BODY WITH SIDEBAR */}
        <div className="flex-1 flex overflow-hidden min-h-[320px] sm:min-h-[380px]">
          
          {/* LEFT SIDEBAR (METHODS) */}
          <div className="w-12 sm:w-16 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-100 dark:border-zinc-800 flex flex-col items-center py-4 sm:py-6 gap-3 sm:gap-6 transition-colors shrink-0">
             <button 
               onClick={() => actions.setActiveTab('type')}
               className={`p-2 sm:p-3 rounded-xl transition-all cursor-pointer ${activeTab === 'type' ? 'bg-white dark:bg-zinc-800 text-rose-500 shadow-md border border-zinc-100 dark:border-zinc-700' : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400'}`}
               title="Ketik"
             >
               <Type size={18} className="sm:w-5 sm:h-5" />
             </button>
             <button 
               onClick={() => actions.setActiveTab('draw')}
               className={`p-2 sm:p-3 rounded-xl transition-all cursor-pointer ${activeTab === 'draw' ? 'bg-white dark:bg-zinc-800 text-rose-500 shadow-md border border-zinc-100 dark:border-zinc-700' : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400'}`}
               title="Gambar"
             >
               <PenTool size={18} className="sm:w-5 sm:h-5" />
             </button>
             <button 
               onClick={() => actions.setActiveTab('upload')}
               className={`p-2 sm:p-3 rounded-xl transition-all cursor-pointer ${activeTab === 'upload' ? 'bg-white dark:bg-zinc-800 text-rose-500 shadow-md border border-zinc-100 dark:border-zinc-700' : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400'}`}
               title="Unggah"
             >
               <Upload size={18} className="sm:w-5 sm:h-5" />
             </button>
          </div>

          {/* CONTENT AREA */}
          <div className="flex-1 min-w-0 bg-white dark:bg-zinc-900 p-4 sm:p-8 overflow-y-auto transition-colors">
            
            {/* 1. TYPE MODE (List of variation) */}
            {activeTab === 'type' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                {/* USER INFO INPUTS (CONDITIONAL IN TYPE MODE) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 mb-6 sm:mb-8 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <div className="w-12 h-12 rounded-full border-2 border-rose-500 flex items-center justify-center text-rose-500 shrink-0 self-start">
                     <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center">
                       <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08c-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                     </div>
                  </div>

                  <div className="flex-1 flex flex-col sm:flex-row gap-3 sm:gap-6 min-w-0">
                     <div className="flex-1 space-y-1.5 min-w-0">
                       <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Nama lengkap:</label>
                       <input 
                         type="text" 
                         value={state.fullName}
                         onChange={(e) => {
                            actions.setFullName(e.target.value);
                            actions.setTypedName(e.target.value); 
                         }}
                         placeholder="Nama Anda"
                         className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-rose-500 dark:focus:border-rose-500 dark:text-white transition-all shadow-sm"
                       />
                     </div>
                     <div className="w-full sm:w-1/4 space-y-1.5">
                       <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Inisial:</label>
                       <input 
                         type="text" 
                         value={state.initials}
                         onChange={(e) => actions.setInitials(e.target.value)}
                         placeholder="AA"
                         className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-rose-500 dark:focus:border-rose-500 dark:text-white transition-all shadow-sm"
                       />
                     </div>
                  </div>
                </div>

                <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-50 dark:divide-zinc-800 shadow-sm transition-colors">
                  {fonts.map((font) => (
                    <div 
                      key={font.id} 
                      className={`flex items-center gap-4 px-6 py-5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer ${state.selectedFont === font.id ? 'bg-zinc-50 dark:bg-zinc-800' : ''}`}
                      onClick={() => actions.setSelectedFont(font.id)}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${state.selectedFont === font.id ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-zinc-200 dark:border-zinc-700'}`}>
                        {state.selectedFont === font.id && <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />}
                      </div>
                      <div className={`text-4xl text-zinc-800 dark:text-zinc-100 ${font.family} flex-1 truncate`}>
                        {state.fullName || 'Tanda tangan'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* COLOR SELECTOR */}
                <div className="flex items-center gap-3 pt-4">
                  <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Pilih Warna:</span>
                  {['#334155', '#e11d48', '#2563eb', '#16a34a'].map((color) => (
                    <button 
                      key={color}
                      onClick={() => actions.canvasActions.setColor(color)}
                      className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${canvasState.color === color ? 'border-zinc-400 dark:border-white ring-2 ring-zinc-400/20' : 'border-transparent hover:scale-110'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 2. DRAW MODE (Canvas + QR) */}
            {activeTab === 'draw' && (
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 h-full animate-in fade-in duration-300">
                <div className="flex-1 flex flex-col gap-4 min-h-[240px] sm:min-h-0">
                  <div className="relative flex-1 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden" style={{ touchAction: 'none' }}>
                    <canvas 
                      ref={canvasState.canvasRef}
                      {...actions.canvasActions.mouseHandlers}
                      className="w-full h-full cursor-crosshair"
                    />
                    {canvasState.isEmpty && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-400 dark:text-zinc-600 font-medium select-none">
                        Gunakan kursor atau jari Anda untuk menggambar
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-zinc-400 uppercase">Warna:</span>
                      {['#334155', '#e11d48', '#2563eb', '#16a34a'].map((color) => (
                        <button 
                          key={color}
                          onClick={() => actions.canvasActions.setColor(color)}
                          className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${canvasState.color === color ? 'border-zinc-400 dark:border-white ring-2 ring-zinc-400/20' : 'border-transparent hover:scale-110'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <button onClick={actions.clear} className="text-rose-500 text-sm font-bold hover:underline bg-transparent border-none cursor-pointer">Hapus</button>
                  </div>
                </div>

                {/* QR CODE SECTION — di mobile (di bawah kanvas) sembunyikan untuk
                    hemat ruang; gambar kanvas via jari sudah cukup */}
                <div className="hidden sm:flex w-[180px] flex-col items-center justify-center border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 bg-white dark:bg-zinc-950 shadow-sm transition-colors">
                  <div className="w-full aspect-square bg-zinc-50 dark:bg-zinc-900 rounded-xl flex items-center justify-center relative overflow-hidden group">
                     <div className="absolute inset-0 p-4 opacity-5 dark:opacity-20 text-zinc-900 dark:text-white">
                        <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full"><path d="M0 0h40v40H0zm10 10v20h20V10zm50-10h40v40H60zm10 10v20h20V10zM0 60h40v40H0zm10 70v20h20V70zm50 0h10v10H60zm10 10h10v10H70zm10-10h10v10H80zm10 10h10v10H90zm-10-10v-10h10v10H80z"/></svg>
                     </div>
                     <div className="relative text-center p-3">
                        <p className="text-[10px] font-bold text-rose-500 underline leading-tight cursor-pointer hover:text-rose-600 transition-colors">Gambar dari perangkat seluler Anda</p>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. UPLOAD MODE */}
            {activeTab === 'upload' && (
              <div className="h-full flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div className={`w-full max-w-2xl aspect-[2/1] bg-zinc-50/50 dark:bg-zinc-950/20 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all ${state.uploadedImage ? 'border-zinc-200 dark:border-zinc-700' : 'border-zinc-200 dark:border-zinc-800 hover:border-rose-500 dark:hover:border-rose-500 hover:bg-rose-50/30 dark:hover:bg-rose-900/10'}`}>
                  {state.uploadedImage ? (
                    <div className="relative group p-8 w-full h-full flex items-center justify-center">
                      <img src={state.uploadedImage} alt="Preview" className="max-h-full object-contain" />
                      <button onClick={() => actions.clear()} className="absolute top-4 right-4 p-2 bg-rose-500 text-white rounded-full shadow-lg hover:scale-110 transition-all border-none cursor-pointer"><RotateCcw size={16} /></button>
                    </div>
                  ) : (
                    <>
                      <label className="px-8 py-3 bg-white dark:bg-zinc-800 border border-rose-500 text-rose-500 rounded-xl font-bold text-sm cursor-pointer hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                        Unggah tanda tangan
                        <input type="file" className="hidden" accept="image/*" onChange={actions.handleFileUpload} />
                      </label>
                      <p className="text-zinc-400 dark:text-zinc-500 font-medium">atau jatuhkan file di sini</p>
                      <p className="text-[10px] text-zinc-300 dark:text-zinc-600 font-bold uppercase tracking-widest mt-2 text-center">Format yang diterima: <span className="text-zinc-400 dark:text-zinc-500">PNG, JPG dan SVG</span></p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-8 py-5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end bg-white dark:bg-zinc-900 transition-colors">
          <button 
            onClick={actions.save}
            disabled={state.isSaveDisabled}
            className={`px-10 py-3 rounded-xl font-bold text-sm transition-all border-none cursor-pointer
              ${state.isSaveDisabled 
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed' 
                : 'bg-rose-500 text-white hover:bg-rose-600 active:scale-95 shadow-lg shadow-rose-500/20'
              }
            `}
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureCanvas;
