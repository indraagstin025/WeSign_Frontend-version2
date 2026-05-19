/**
 * @module packages/constants/packageStatus
 *
 * [M-6] Konstanta tampilan untuk badge status & label paket.
 * Sebelumnya didefinisikan inline di PackageTable.jsx — kalau muncul
 * di komponen lain (mis. PackageInfoModal, MobileBottomSheet) perlu
 * duplicate copy-paste. Centralize di sini supaya konsisten dan
 * single-source-of-truth.
 */

/**
 * Mapping status paket ke badge label + Tailwind class.
 * Status backend di-lowercase sebelum lookup.
 */
export const STATUS_BADGE = {
  draft: {
    label: 'Draft',
    cls: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
  },
  pending: {
    label: 'Menunggu',
    cls: 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  },
  completed: {
    label: 'Selesai',
    cls: 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  },
  archived: {
    label: 'Arsip',
    cls: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
  },
};

/**
 * Helper: ambil badge dengan fallback ke 'draft'.
 */
export const getPackageStatusBadge = (status) => {
  const key = (status || '').toLowerCase();
  return STATUS_BADGE[key] || STATUS_BADGE.draft;
};

/**
 * Mapping kategori (label) paket ke Tailwind class.
 */
export const LABEL_BADGE = {
  General: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Legal: 'bg-blue-50 text-blue-700 border border-blue-200',
  HR: 'bg-purple-50 text-purple-700 border border-purple-200',
  Finance: 'bg-orange-50 text-orange-700 border border-orange-200',
};

/**
 * Helper: ambil label class dengan fallback netral.
 */
export const getPackageLabelClass = (label) =>
  LABEL_BADGE[label] || 'bg-zinc-50 text-zinc-500 border border-zinc-200';
