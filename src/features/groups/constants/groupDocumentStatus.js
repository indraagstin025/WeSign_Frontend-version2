/**
 * @file groupDocumentStatus.js
 * @description Single source of truth untuk semua status dokumen Group.
 *
 * [H-1] Sebelumnya 3 lokasi punya STATUS_CONFIG / STATUS_BADGE sendiri
 * dengan label dan style yang inkonsisten:
 * - hooks/useGroupDocumentCardState.js (DRAFT/PENDING/COMPLETED/PROCESSING)
 * - hooks/useGroupDocumentPreviewPage.js (PENDING/SIGNED/COMPLETED, label "Finalized")
 * - components/GroupDocumentCard.jsx (DRAFT/PENDING/COMPLETED/REJECTED)
 *
 * Sekarang semua import dari sini. Tiap konsumer pakai field yang
 * relevan saja (mis. preview page tidak butuh `cls`, card pakai `cls`).
 *
 * Status keys (uppercase, sesuai backend):
 * - DRAFT      — dokumen draft, belum di-publish ke signer
 * - PENDING    — sedang menunggu tanda tangan
 * - SIGNED     — user ini sudah tanda tangan (per-signer status)
 * - PROCESSING — sebagian signer sudah TTD, masih nunggu sisanya (per-document)
 * - COMPLETED  — semua signer sudah TTD + admin sudah finalize
 * - REJECTED   — ada signer yang menolak dokumen
 */

import { Clock, CheckCircle2, Lock, FileEdit, Loader2, XCircle } from 'lucide-react';

/**
 * @typedef {Object} GroupDocumentStatusConfig
 * @property {string} label  - Label user-facing (Bahasa Indonesia)
 * @property {string} cls    - Tailwind class (badge style untuk Card)
 * @property {string} color  - Tailwind text color (untuk preview page)
 * @property {string} bg     - Tailwind bg color (untuk preview page)
 * @property {string} accent - Tailwind bg untuk accent bar (left side card)
 * @property {import('lucide-react').LucideIcon} icon - Lucide icon
 */

/**
 * @type {Record<string, GroupDocumentStatusConfig>}
 */
export const GROUP_DOCUMENT_STATUS = {
  DRAFT: {
    label: 'Draft',
    cls: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
    color: 'text-zinc-600',
    bg: 'bg-zinc-500/10',
    accent: 'bg-zinc-300 dark:bg-zinc-600',
    icon: FileEdit,
  },
  PENDING: {
    label: 'Menunggu',
    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500',
    color: 'text-amber-600',
    bg: 'bg-amber-500/10',
    accent: 'bg-amber-400',
    icon: Clock,
  },
  PROCESSING: {
    label: 'Diproses',
    cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500',
    color: 'text-blue-600',
    bg: 'bg-blue-500/10',
    accent: 'bg-blue-400',
    icon: Loader2,
  },
  SIGNED: {
    label: 'Ditandatangani',
    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500',
    color: 'text-emerald-600',
    bg: 'bg-emerald-500/10',
    accent: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: 'Selesai',
    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500',
    color: 'text-blue-600',
    bg: 'bg-blue-500/10',
    accent: 'bg-emerald-500',
    icon: Lock,
  },
  REJECTED: {
    label: 'Ditolak',
    cls: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
    color: 'text-rose-600',
    bg: 'bg-rose-500/10',
    accent: 'bg-rose-500',
    icon: XCircle,
  },
};

/**
 * Lookup dengan fallback ke DRAFT.
 * @param {string} status - Status key (case-insensitive ok, akan di-uppercase)
 * @returns {GroupDocumentStatusConfig}
 */
export function getGroupDocumentStatus(status) {
  if (!status) return GROUP_DOCUMENT_STATUS.DRAFT;
  const key = String(status).toUpperCase();
  return GROUP_DOCUMENT_STATUS[key] || GROUP_DOCUMENT_STATUS.DRAFT;
}
