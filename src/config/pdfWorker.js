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
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const currentWorkerSrc = pdfjs.GlobalWorkerOptions.workerSrc || '';
const isDefaultWorkerSrc =
  !currentWorkerSrc ||
  currentWorkerSrc === 'pdf.worker.mjs' ||
  currentWorkerSrc.endsWith('/pdf.worker.mjs');

// PDF.js bisa memasang default "pdf.worker.mjs" lebih dulu di dev. URL itu
// tidak ada di Vite, jadi harus dioverride ke asset hasil resolve `?url`.
// Tetap idempotent: jangan re-assign kalau sudah pakai URL yang benar.
if (isDefaultWorkerSrc || currentWorkerSrc !== pdfWorkerUrl) {
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export { pdfjs };
