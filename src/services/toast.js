/**
 * @file toast.js
 * @description Lightweight toast notification store. Pub/sub pattern, no extra
 * dependency. UI rendered oleh ToastContainer.jsx yang subscribe ke store ini.
 *
 * Tujuan: gantikan StatusModal yang mengganggu (blocking, butuh klik tutup)
 * dengan toast banner yang auto-dismiss. Setara dengan UX Canva/Google Docs.
 *
 * Usage:
 *   toast.success('Berhasil disimpan');
 *   toast.error('Gagal: koneksi terputus');
 *   toast.info('Tip ringan');
 *   toast.show({ type: 'success', title: 'Final', message: '...', action: { label: 'Buka', onClick: ... }, duration: 6000 });
 */

let nextId = 1;
let toasts = [];
const subscribers = new Set();

const DEFAULT_DURATION = {
  success: 3500,
  info: 3500,
  warn: 5000,
  error: 6000,
};

function notify() {
  const snapshot = [...toasts];
  subscribers.forEach((cb) => {
    try { cb(snapshot); } catch (e) { console.error('[toast] subscriber error:', e); }
  });
}

function dismiss(id) {
  const before = toasts.length;
  toasts = toasts.filter((t) => t.id !== id);
  if (toasts.length !== before) notify();
}

function show(opts) {
  const id = nextId++;
  const t = {
    id,
    type: opts.type || 'info',
    title: opts.title || '',
    message: opts.message || '',
    action: opts.action || null,
    duration:
      typeof opts.duration === 'number'
        ? opts.duration
        : DEFAULT_DURATION[opts.type] ?? 3500,
    createdAt: Date.now(),
  };
  toasts = [...toasts, t];
  notify();
  if (t.duration > 0) {
    setTimeout(() => dismiss(id), t.duration);
  }
  return id;
}

export const toast = {
  show,
  dismiss,
  success: (message, opts = {}) => show({ ...opts, type: 'success', message }),
  error: (message, opts = {}) => show({ ...opts, type: 'error', message }),
  info: (message, opts = {}) => show({ ...opts, type: 'info', message }),
  warn: (message, opts = {}) => show({ ...opts, type: 'warn', message }),
  subscribe(cb) {
    subscribers.add(cb);
    cb([...toasts]);
    return () => subscribers.delete(cb);
  },
  clear() {
    toasts = [];
    notify();
  },
};
