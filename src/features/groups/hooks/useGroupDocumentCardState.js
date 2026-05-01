import { useMemo } from 'react';

const STATUS_CONFIG = {
  DRAFT:      { label: 'Draft',    cls: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' },
  PENDING:    { label: 'Menunggu', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500' },
  COMPLETED:  { label: 'Selesai',  cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500' },
  PROCESSING: { label: 'Diproses', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500' },
};

/**
 * @hook useGroupDocumentCardState
 * @description Derivasi semua nilai state UI untuk `GroupDocumentCard`.
 * Memisahkan business derivation dari rendering JSX agar komponen pure.
 *
 * @param {object} args
 * @param {object} args.doc
 * @param {boolean} [args.isAdmin=false]
 * @param {string} [args.myStatus]
 * @param {string} [args.currentUserId] - Dipakai untuk derivasi `isUploader` (izin delete).
 */
export function useGroupDocumentCardState({ doc, isAdmin = false, myStatus, currentUserId }) {
  return useMemo(() => {
    const docStatus = doc?.status?.toUpperCase();
    const signedCount = doc?.signerRequests?.filter((s) => s.status?.toUpperCase() === 'SIGNED').length || 0;
    const totalSigners = doc?.signerRequests?.length || 0;
    const allSigned = totalSigners > 0 && signedCount === totalSigners;
    const isCompleted = docStatus === 'COMPLETED';

    // Otorisasi delete: uploader dokumen ATAU admin grup. Tidak terikat status
    // dokumen — admin/uploader tetap dapat menghapus dokumen final bila perlu
    // (contoh: dokumen salah, perlu di-takedown). Backend sudah enforce ini.
    const isUploader =
      doc?.userId != null &&
      currentUserId != null &&
      String(doc.userId) === String(currentUserId);

    const canFinalize = isAdmin && allSigned && !isCompleted;
    const canSignNow = myStatus === 'PENDING' && docStatus === 'PENDING';
    const canDownload = isCompleted;
    const canManageSigners = isAdmin && !isCompleted;
    const canDelete = isAdmin || isUploader;
    const status = STATUS_CONFIG[docStatus] || STATUS_CONFIG.PENDING;

    return {
      docStatus,
      signedCount,
      totalSigners,
      allSigned,
      isCompleted,
      isUploader,
      canFinalize,
      canSignNow,
      canDownload,
      canManageSigners,
      canDelete,
      status,
    };
  }, [doc, isAdmin, myStatus, currentUserId]);
}
