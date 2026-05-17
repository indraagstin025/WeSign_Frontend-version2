import React from 'react';
import { FileText, FileMinus, FileOutput } from 'lucide-react';

const OPTIONS = [
  { value: 'embedded', label: 'Sertakan di dokumen', icon: FileText, desc: 'Audit trail di halaman terakhir PDF' },
  { value: 'separate', label: 'File terpisah', icon: FileOutput, desc: 'Audit trail sebagai PDF terpisah' },
  { value: 'none', label: 'Tanpa audit trail', icon: FileMinus, desc: 'Dokumen tanpa halaman audit' },
];

/**
 * @component AuditTrailToggle
 * @description Radio toggle untuk memilih mode audit trail saat signing.
 */
const AuditTrailToggle = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">
        Audit Trail
      </p>
      <div className="space-y-1.5">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer bg-transparent
                ${isActive
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                  : 'border-zinc-100 dark:border-white/5 hover:border-zinc-200 dark:hover:border-white/10'
                }`}
            >
              <Icon size={14} className={isActive ? 'text-emerald-600' : 'text-zinc-400'} />
              <div className="min-w-0">
                <p className={`text-[11px] font-bold ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-300'}`}>
                  {opt.label}
                </p>
                <p className="text-[9px] text-zinc-400 dark:text-zinc-500">{opt.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AuditTrailToggle;
