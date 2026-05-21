import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// [REALTIME-PERF] Init PDF.js worker singleton di entry point.
// Konfigurasi terpusat supaya tidak ada race re-assign workerSrc dari
// multiple page komponen yang dulunya tiap-tiap set sendiri (bikin
// "Worker was terminated" error saat user navigate cepat antar page).
import './config/pdfWorker.js'

// [FIX] Suppress harmless dev-only "Worker was terminated" rejection dari PDF.js.
// React StrictMode mount → unmount → remount menyebabkan loadDocument promise
// dari react-pdf di-cancel dengan cara terminate worker — pesan error tidak bisa
// di-catch via component prop (`onLoadError`). Filter di sini untuk bersihkan
// console; production build tanpa StrictMode tidak akan trigger.
if (typeof window !== 'undefined') {
  const isPdfWorkerTerminated = (reason) => {
    const msg = reason?.message || reason?.toString?.() || '';
    return /worker (was )?terminated/i.test(msg);
  };

  window.addEventListener('unhandledrejection', (e) => {
    if (isPdfWorkerTerminated(e.reason)) {
      e.preventDefault();
    }
  });

  // Fallback: beberapa browser/build melempar via 'error' event juga.
  window.addEventListener('error', (e) => {
    if (isPdfWorkerTerminated(e.error)) {
      e.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
