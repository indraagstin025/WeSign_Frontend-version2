import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Init PDF.js worker sebelum route/component manapun memakai react-pdf.
import './config/pdfWorker.js'
import './index.css'
import App from './App.jsx'

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

  // [DEPLOY-RESILIENCE] Handle stale chunk error setelah Vercel deploy.
  //
  // Skenario: user aktif di app, lalu kita push ke main → Vercel deploy
  // dengan hash JS chunk baru. Browser user masih cache hash lama. Saat
  // user navigate dan trigger dynamic import (lazy-loaded route/component),
  // browser request ke /assets/Foo-OLD_HASH.js → 404 dari CDN (chunk
  // lama sudah hilang).
  //
  // Tanpa handler: app bisa crash, tetiba blank, atau parah lagi
  // user kick ke login karena React error boundary salah handle.
  //
  // Dengan handler: deteksi error chunk + reload halaman supaya browser
  // ambil hash baru. Sekali reload, app stable kembali. UX: kelihatan
  // sebentar refresh setelah deploy, acceptable.
  //
  // Pattern detection: error message contain "Failed to fetch dynamically
  // imported module" atau "Loading chunk" atau "Loading CSS chunk".
  const isChunkLoadError = (reason) => {
    const msg = reason?.message || reason?.toString?.() || '';
    return (
      /failed to fetch dynamically imported module/i.test(msg) ||
      /loading chunk \d+ failed/i.test(msg) ||
      /loading css chunk/i.test(msg) ||
      /importing a module script failed/i.test(msg)
    );
  };

  let chunkReloadInProgress = false;
  const handleChunkError = (reason) => {
    if (chunkReloadInProgress) return;
    if (!isChunkLoadError(reason)) return;
    chunkReloadInProgress = true;
    console.warn('[chunk] Stale chunk detected after deploy, reloading...');
    // Hard reload supaya browser ambil hash JS terbaru
    window.location.reload();
  };

  window.addEventListener('unhandledrejection', (e) => {
    handleChunkError(e.reason);
  });

  window.addEventListener('error', (e) => {
    handleChunkError(e.error);
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
