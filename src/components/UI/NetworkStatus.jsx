import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useNetwork } from '../../hooks/useNetwork';

/**
 * Komponen banner notifikasi status jaringan.
 * Akan muncul secara otomatis di atas layar saat pengguna sedang Offline.
 */
const NetworkStatus = () => {
  const isOnline = useNetwork();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] animate-[slideDown_0.3s_ease-out]">
      <div className="bg-rose-600 text-white px-4 py-2 flex items-center justify-center gap-3 shadow-lg">
        <WifiOff size={18} className="animate-pulse" />
        <p className="text-sm font-semibold tracking-tight">
          Anda sedang Offline. Beberapa fitur mungkin tidak berfungsi dengan baik.
        </p>
      </div>
    </div>
  );
};

export default NetworkStatus;
