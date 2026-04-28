import React, { useEffect, useState } from 'react';
import { CloudUpload, Check, AlertTriangle } from 'lucide-react';
import { saveStatus } from '../../services/saveStatus';

/**
 * @component SaveIndicator
 * @description Banner status simpan otomatis ala Canva/Google Docs.
 * Subscribe ke saveStatus store dan render badge sesuai state:
 *   - idle    : tidak ditampilkan (atau "Tersimpan otomatis" lembut)
 *   - saving  : "Menyimpan..." dengan animasi pulse
 *   - saved   : "Tersimpan" hijau (auto-fade ke idle setelah 2.5s)
 *   - error   : "Gagal menyimpan — {pesan}" merah
 *
 * Posisi: fixed top-right (mobile-friendly). Z-index di bawah modal.
 */
const SaveIndicator = () => {
  const [state, setState] = useState(saveStatus.get());

  useEffect(() => saveStatus.subscribe(setState), []);

  if (state.status === 'idle') return null;

  const config = {
    saving: {
      bg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-300',
      icon: <CloudUpload size={16} className="animate-pulse" />,
      label: 'Menyimpan...',
    },
    saved: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-700 dark:text-emerald-300',
      icon: <Check size={16} />,
      label: 'Tersimpan',
    },
    error: {
      bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
      text: 'text-rose-700 dark:text-rose-300',
      icon: <AlertTriangle size={16} />,
      label: state.lastErrorMessage
        ? `Gagal menyimpan: ${state.lastErrorMessage}`
        : 'Gagal menyimpan',
    },
  }[state.status];

  if (!config) return null;

  return (
    <div
      className={`fixed top-20 right-4 z-[80] max-w-xs flex items-center gap-2 px-3 py-2 rounded-lg border shadow-sm text-sm font-medium ${config.bg} ${config.text} animate-[slideDown_0.2s_ease-out]`}
      role="status"
      aria-live="polite"
    >
      {config.icon}
      <span className="truncate">{config.label}</span>
    </div>
  );
};

export default SaveIndicator;
