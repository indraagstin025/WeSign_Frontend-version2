import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { toast } from '../../services/toast';

/**
 * @component ToastContainer
 * @description Container global untuk toast notifications. Pasang sekali di
 * App.jsx (top-level), subscribe ke `toast` store, render stack toast aktif.
 *
 * Posisi: fixed top-center (hindari nutupin SaveIndicator yang di top-right).
 * Z-index: 9000 (di atas konten, di bawah modal kritikal seperti
 * konfirmasi delete).
 */
const TYPE_CONFIG = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-900 dark:text-emerald-100',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    Icon: CheckCircle2,
  },
  error: {
    bg: 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800',
    text: 'text-rose-900 dark:text-rose-100',
    iconColor: 'text-rose-600 dark:text-rose-400',
    Icon: XCircle,
  },
  warn: {
    bg: 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800',
    text: 'text-amber-900 dark:text-amber-100',
    iconColor: 'text-amber-600 dark:text-amber-400',
    Icon: AlertTriangle,
  },
  info: {
    bg: 'bg-sky-50 dark:bg-sky-950/80 border-sky-200 dark:border-sky-800',
    text: 'text-sky-900 dark:text-sky-100',
    iconColor: 'text-sky-600 dark:text-sky-400',
    Icon: Info,
  },
};

const ToastItem = ({ t }) => {
  const cfg = TYPE_CONFIG[t.type] || TYPE_CONFIG.info;
  const { Icon } = cfg;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto w-full max-w-md flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg ${cfg.bg} ${cfg.text} animate-[slideDown_0.2s_ease-out]`}
    >
      <Icon size={20} className={`shrink-0 mt-0.5 ${cfg.iconColor}`} />
      <div className="flex-1 min-w-0">
        {t.title && <p className="font-semibold text-sm leading-snug">{t.title}</p>}
        {t.message && (
          <p className={`text-sm leading-snug ${t.title ? 'mt-0.5 opacity-90' : ''} break-words`}>
            {t.message}
          </p>
        )}
        {t.action && (
          <button
            type="button"
            onClick={() => {
              try { t.action.onClick?.(); } finally { toast.dismiss(t.id); }
            }}
            className="mt-2 text-sm font-medium underline underline-offset-2 hover:opacity-80"
          >
            {t.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => toast.dismiss(t.id)}
        aria-label="Tutup"
        className={`shrink-0 -m-1 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 ${cfg.iconColor}`}
      >
        <X size={16} />
      </button>
    </div>
  );
};

const ToastContainer = () => {
  const [list, setList] = useState([]);

  useEffect(() => toast.subscribe(setList), []);

  if (list.length === 0) return null;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9000] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-md pointer-events-none"
      aria-label="Notifications"
    >
      {list.map((t) => (
        <ToastItem key={t.id} t={t} />
      ))}
    </div>
  );
};

export default ToastContainer;
