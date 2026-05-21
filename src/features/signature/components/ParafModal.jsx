import React, { useState } from 'react';
import { X } from 'lucide-react';
import { renderInitialsToImage } from '../utils/renderToImage';
import { PARAF_COLORS } from '../constants/signatureColors';

/**
 * @component ParafModal
 * @description Modal untuk membuat paraf/inisial — fungsional.
 * Render inisial ke canvas → base64 → onSave(dataUrl).
 */
const STYLES = [
  { id: 'bold', label: 'IA', className: 'font-black text-3xl' },
  { id: 'dotted', label: 'I.A', className: 'font-bold text-2xl tracking-[0.3em]' },
  { id: 'italic', label: 'IA', className: 'font-semibold text-3xl italic' },
  { id: 'script', label: 'ia', className: 'text-3xl italic font-light' },
];

const COLORS = PARAF_COLORS;

const ParafModal = ({ isOpen, onClose, onSave, initials = 'IA' }) => {
  const [selectedStyle, setSelectedStyle] = useState('bold');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [customInitials, setCustomInitials] = useState(initials);

  if (!isOpen) return null;

  const getDisplayText = (styleId) => {
    const text = customInitials || 'IA';
    switch (styleId) {
      case 'dotted': return text.split('').join('.');
      case 'script': return text.toLowerCase();
      default: return text;
    }
  };

  const handleApply = () => {
    const text = getDisplayText(selectedStyle);
    const dataUrl = renderInitialsToImage(text, {
      color: selectedColor,
      fontStyle: selectedStyle,
      fontSize: 48,
    });
    onSave(dataUrl, { method: 'initial', metadata: { initials: customInitials } });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-zinc-800 dark:text-white">Pilih Paraf / Inisial</h3>
          <button onClick={onClose} className="p-2 rounded-xl border-none bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Input Inisial */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Inisial Anda</label>
            <input
              type="text"
              value={customInitials}
              onChange={(e) => setCustomInitials(e.target.value.toUpperCase().slice(0, 4))}
              maxLength={4}
              placeholder="IA"
              className="w-24 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-center text-lg font-bold text-zinc-800 dark:text-white outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Style Options */}
          <div className="grid grid-cols-4 gap-3">
            {STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`h-16 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer bg-transparent
                  ${selectedStyle === style.id 
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' 
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
              >
                <span className={style.className} style={{ color: selectedColor }}>
                  {getDisplayText(style.id)}
                </span>
              </button>
            ))}
          </div>

          {/* Color Picker */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Warna:</span>
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${selectedColor === color ? 'border-zinc-400 dark:border-white ring-2 ring-zinc-300/30' : 'border-transparent hover:scale-110'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            onClick={handleApply}
            disabled={!customInitials.trim()}
            className={`px-6 py-2.5 font-bold text-sm rounded-xl border-none cursor-pointer transition-all
              ${customInitials.trim()
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 shadow-md shadow-emerald-500/20'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
              }`}
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParafModal;
