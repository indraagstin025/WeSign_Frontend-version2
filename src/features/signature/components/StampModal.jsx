import React, { useState } from 'react';
import { X } from 'lucide-react';
import { renderStampToImage } from '../utils/renderToImage';

/**
 * @component StampModal
 * @description Modal untuk memilih dan membuat stamp — fungsional.
 * Render stamp ke canvas → base64 → onSave(dataUrl).
 */
const STAMPS = [
  { id: 'approved', label: 'APPROVED' },
  { id: 'confidential', label: 'CONFIDENTIAL' },
  { id: 'draft', label: 'DRAFT' },
  { id: 'received', label: 'RECEIVED' },
  { id: 'completed', label: 'COMPLETED' },
  { id: 'paid', label: 'PAID' },
];

const COLORS = ['#16a34a', '#e11d48', '#2563eb', '#334155', '#7c3aed', '#d97706'];

const StampModal = ({ isOpen, onClose, onSave }) => {
  const [selectedStamp, setSelectedStamp] = useState('approved');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  if (!isOpen) return null;

  const currentLabel = STAMPS.find(s => s.id === selectedStamp)?.label || 'APPROVED';

  const handleApply = () => {
    const dataUrl = renderStampToImage(currentLabel, { color: selectedColor });
    onSave(dataUrl, { method: 'stamp', metadata: { stampName: currentLabel } });
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
          <h3 className="text-base font-bold text-zinc-800 dark:text-white">Pilih Stamp</h3>
          <button onClick={onClose} className="p-2 rounded-xl border-none bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Stamp Options */}
          <div className="grid grid-cols-3 gap-3">
            {STAMPS.map((stamp) => (
              <button
                key={stamp.id}
                onClick={() => setSelectedStamp(stamp.id)}
                className={`h-12 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer bg-transparent
                  ${selectedStamp === stamp.id 
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' 
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
              >
                <span 
                  className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded border-2"
                  style={{ 
                    color: selectedStamp === stamp.id ? selectedColor : '#71717a',
                    borderColor: selectedStamp === stamp.id ? selectedColor : '#d4d4d8',
                  }}
                >
                  {stamp.label}
                </span>
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <span 
              className="text-lg font-black uppercase tracking-wider px-4 py-2 rounded-md border-[3px]"
              style={{ color: selectedColor, borderColor: selectedColor }}
            >
              {currentLabel}
            </span>
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
            className="px-6 py-2.5 bg-emerald-500 text-white font-bold text-sm rounded-xl border-none cursor-pointer hover:bg-emerald-600 active:scale-95 transition-all shadow-md shadow-emerald-500/20"
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
};

export default StampModal;
