import React, { useState } from 'react';
import { X, Bold, Italic, Underline } from 'lucide-react';
import { renderTextToImage } from '../utils/renderToImage';

/**
 * @component TextAnnotationModal
 * @description Modal untuk menambahkan teks/anotasi — fungsional.
 * Render teks ke canvas → base64 → onSave(dataUrl).
 */
const FONTS = [
  { id: 'Inter', label: 'Inter' },
  { id: 'Dancing Script', label: 'Dancing Script' },
  { id: 'Caveat', label: 'Caveat' },
  { id: 'Sacramento', label: 'Sacramento' },
];

const TextAnnotationModal = ({ isOpen, onClose, onSave }) => {
  const [text, setText] = useState('');
  const [font, setFont] = useState('Inter');
  const [fontSize, setFontSize] = useState(14);
  const [color, setColor] = useState('#334155');
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);

  if (!isOpen) return null;

  const handleApply = () => {
    if (!text.trim()) return;
    const dataUrl = renderTextToImage(text, {
      color,
      fontSize,
      fontFamily: font,
      bold,
      italic,
      underline,
    });
    onSave(dataUrl, { method: 'text', metadata: { textContent: text, fontSize } });
    setText('');
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
          <h3 className="text-base font-bold text-zinc-800 dark:text-white">Tambah Teks</h3>
          <button onClick={onClose} className="p-2 rounded-xl border-none bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Text Input */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ketik teks di sini..."
            className="w-full h-24 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-800 dark:text-zinc-200 resize-none outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            style={{ 
              fontFamily: font, 
              fontWeight: bold ? 'bold' : 'normal',
              fontStyle: italic ? 'italic' : 'normal',
              textDecoration: underline ? 'underline' : 'none',
              color,
            }}
          />

          {/* Font + Size + Color */}
          <div className="flex items-center gap-3">
            <select
              value={font}
              onChange={(e) => setFont(e.target.value)}
              className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer"
            >
              {FONTS.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>

            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-20 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer"
            >
              {[10, 12, 14, 16, 18, 20, 24, 28, 32].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer p-0"
            />
          </div>

          {/* Formatting Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setBold(!bold)}
              className={`p-2 rounded-lg border-none cursor-pointer transition-all ${bold ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-white' : 'bg-transparent text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              title="Bold"
            >
              <Bold size={14} />
            </button>
            <button
              onClick={() => setItalic(!italic)}
              className={`p-2 rounded-lg border-none cursor-pointer transition-all ${italic ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-white' : 'bg-transparent text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              title="Italic"
            >
              <Italic size={14} />
            </button>
            <button
              onClick={() => setUnderline(!underline)}
              className={`p-2 rounded-lg border-none cursor-pointer transition-all ${underline ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-white' : 'bg-transparent text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              title="Underline"
            >
              <Underline size={14} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            onClick={handleApply}
            disabled={!text.trim()}
            className={`px-6 py-2.5 font-bold text-sm rounded-xl border-none cursor-pointer transition-all
              ${text.trim() 
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

export default TextAnnotationModal;
