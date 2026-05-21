import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { renderTextToImage } from '../utils/renderToImage';
import { DATE_FIELD_COLORS } from '../constants/signatureColors';

/**
 * @component DateFieldModal
 * @description Modal untuk menambahkan kolom tanggal ke dokumen.
 * User pilih tanggal + format → render ke canvas → base64.
 */
const FORMATS = [
  { id: 'long', label: 'DD MMMM YYYY', example: '17 Mei 2026' },
  { id: 'short', label: 'DD/MM/YYYY', example: '17/05/2026' },
  { id: 'iso', label: 'YYYY-MM-DD', example: '2026-05-17' },
  { id: 'medium', label: 'DD MMM YYYY', example: '17 Mei 2026' },
];

const COLORS = DATE_FIELD_COLORS;

function formatDateValue(date, formatId) {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();

  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  switch (formatId) {
    case 'long': return `${day} ${monthNames[month]} ${year}`;
    case 'short': return `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
    case 'iso': return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    case 'medium': return `${day} ${monthShort[month]} ${year}`;
    default: return `${day} ${monthNames[month]} ${year}`;
  }
}

const DateFieldModal = ({ isOpen, onClose, onSave }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFormat, setSelectedFormat] = useState('long');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  if (!isOpen) return null;

  const formattedDate = formatDateValue(selectedDate, selectedFormat);

  const handleApply = () => {
    const dataUrl = renderTextToImage(formattedDate, {
      color: selectedColor,
      fontSize: 14,
      fontFamily: 'Inter',
      bold: false,
      italic: false,
      underline: false,
    });
    onSave(dataUrl, { method: 'date', metadata: { dateValue: selectedDate, format: selectedFormat } });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-emerald-500" />
            <h3 className="text-base font-bold text-zinc-800 dark:text-white">Tambah Tanggal</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl border-none bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Pilih Tanggal</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-800 dark:text-zinc-200 outline-none focus:border-emerald-500 transition-all cursor-pointer"
            />
          </div>

          {/* Format Options */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Format</label>
            <div className="space-y-1.5">
              {FORMATS.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all cursor-pointer bg-transparent
                    ${selectedFormat === fmt.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                >
                  <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">{fmt.label}</span>
                  <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-100">{formatDateValue(selectedDate, fmt.id)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center justify-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <span className="text-lg font-semibold" style={{ color: selectedColor }}>
              {formattedDate}
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

export default DateFieldModal;
