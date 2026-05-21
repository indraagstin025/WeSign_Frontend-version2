/**
 * @file pdfWorker.js
 * @description Konfigurasi singleton untuk PDF.js worker.
 *
 * SEBELUMNYA: workerSrc di-set di 6 file berbeda (DocumentSigningPage,
 * GroupSigningPage, SignPackagePage, PackagePreviewPage, useCreatePackage,
 * useUploadDoc). Setiap import komponen tersebut, workerSrc di-reset.
 *
 * Bug: kalau user buka satu page yang lagi loading PDF, lalu navigate
 * cepat ke page lain yang juga import pdfjs config, workerSrc di-set
 * ulang dengan URL yang sama → pdfjs internal terminate worker yang
 * masih loading → error:
 *   - "Worker was terminated"
 *   - "BodyStreamBuffer was aborted"
 *
 * Sekarang: import file ini SEKALI di entry point (main.jsx). Komponen
 * yang pakai react-pdf cukup `import { Document } from 'react-pdf'`
 * tanpa setup worker lagi — sudah di-init di startup.
 *
 * Vite import.meta.url + new URL akan resolve ke bundle lokal
 * (`pdfjs-dist/build/pdf.worker.min.mjs`) — tidak depend pada CDN unpkg.
 */

import { pdfjs } from 'react-pdf';

// Idempotent: kalau workerSrc sudah di-set (mis. hot-reload di dev),
// jangan re-assign supaya worker tidak ke-terminate.
if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
}

export { pdfjs };
