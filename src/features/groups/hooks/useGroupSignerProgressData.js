import { useMemo } from 'react';
import { useUser } from '../../../context/UserContext';

/**
 * @hook useGroupSignerProgressData
 * @description Derivasi progres dokumen + filter signer yang sedang online.
 *
 * @param {object} args
 * @param {object} args.groupData
 * @param {number} args.totalSigners
 * @param {Array} args.pendingSigners
 * @param {string} args.documentId
 * @param {Array} [args.activeUsers=[]]
 */
export function useGroupSignerProgressData({
  groupData,
  totalSigners,
  pendingSigners,
  documentId,
  activeUsers = [],
}) {
  const { user: currentUser } = useUser();

  return useMemo(() => {
    if (!groupData || totalSigners === 0) {
      return { isVisible: false, currentUser };
    }

    const signedCount = totalSigners - (pendingSigners?.length || 0);
    const percent = totalSigners > 0 ? Math.round((signedCount / totalSigners) * 100) : 0;

    const doc = groupData.documents?.find((d) => d.id === documentId);
    const allSigners = doc?.signerRequests || [];

    const onlineSigners = allSigners.filter((sr) => {
      const isMe = String(sr.userId) === String(currentUser?.id);
      const isOnline = activeUsers.some((u) => String(u.userId) === String(sr.userId));
      return isMe || isOnline;
    });

    return {
      isVisible: true,
      currentUser,
      signedCount,
      percent,
      onlineSigners,
    };
  }, [groupData, totalSigners, pendingSigners, documentId, activeUsers, currentUser]);
}
