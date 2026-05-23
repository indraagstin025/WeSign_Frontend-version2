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

import { Document, Page, pdfjs } from 'react-pdf';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set eksplisit setiap wrapper ini di-import. Vite dev/HMR kadang membuat
// route chunk memakai default pdf.js worker (`pdf.worker.mjs`) sebelum entry
// point selesai dievaluasi. Dengan export Document/Page dari wrapper ini,
// semua page PDF melewati assignment yang sama.
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

export { Document, Page, pdfjs };
