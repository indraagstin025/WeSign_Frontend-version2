import { useEffect } from 'react';
import { drainOutbox, onOutboxDropped } from '../services/outboxDrain';

/**
 * @hook useOutboxDrain
 * @description Mount-time hook untuk men-drain outbox secara otomatis.
 *
 * Trigger drain:
 *   - Saat hook ini mount (mis. user buka halaman signing setelah refresh)
 *   - Saat window 'online' event (user dari offline → online)
 *   - Manual via socket reconnect callback (digabung di useGroupSocket)
 *
 * @param {function} onDropped - Callback saat entry outbox di-drop karena
 *   gagal terus-menerus (mencapai MAX_DRAIN_ATTEMPTS). Gunakan untuk trigger
 *   refetch state agar UI sinkron dengan server-truth.
 */
export const useOutboxDrain = (onDropped) => {
  useEffect(() => {
    // Drain saat mount
    drainOutbox();

    const handleOnline = () => {
      drainOutbox();
    };
    window.addEventListener('online', handleOnline);

    const unsubDropped = onDropped ? onOutboxDropped(onDropped) : null;

    return () => {
      window.removeEventListener('online', handleOnline);
      if (typeof unsubDropped === 'function') unsubDropped();
    };
  }, [onDropped]);
};
