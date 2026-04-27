import React from 'react';
import { CheckCircle, Users, Radio } from 'lucide-react';
import { useUser } from '../../../context/UserContext';

/**
 * @component GroupSignerProgress
 * @description Menampilkan progres dokumen dan daftar anggota yang sedang ONLINE.
 */
const GroupSignerProgress = ({ 
  groupData, 
  signatures, 
  totalSigners, 
  pendingSigners, 
  documentId,
  activeUsers = [] 
}) => {
  const { user: currentUser } = useUser();
  if (!groupData || totalSigners === 0) return null;

  const signedCount = totalSigners - pendingSigners.length;
  const percent = totalSigners > 0 ? Math.round((signedCount / totalSigners) * 100) : 0;

  // Ambil semua signer asli dari dokumen
  const doc = groupData?.documents?.find((d) => d.id === documentId);
  const allSigners = doc?.signerRequests || [];

  // Filter: Hanya tampilkan signer yang sedang ONLINE (ada di activeUsers atau diri sendiri)
  const onlineSigners = allSigners.filter((sr) => {
    const isMe = String(sr.userId) === String(currentUser?.id);
    const isOnline = activeUsers.some((u) => String(u.userId) === String(sr.userId));
    return isMe || isOnline;
  });

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-white/5 px-6 py-4">
      <div className="max-w-full flex flex-col lg:flex-row lg:items-center gap-8">
        
        {/* STATS & PROGRESS (Tetap muncul untuk konteks dokumen) */}
        <div className="w-full lg:w-72 space-y-2 shrink-0 border-r border-zinc-100 dark:border-white/5 pr-8">
           <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Penyelesaian</p>
              </div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{signedCount}/{totalSigners} Selesai</span>
           </div>
           <div className="w-full h-2 bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                style={{ width: `${percent}%` }}
              />
           </div>
        </div>

        {/* ONLINE COLLABORATORS (Hanya muncul jika online) */}
        <div className="flex-1 flex flex-col space-y-3">
           <div className="flex items-center justify-between sm:justify-start gap-4">
              <div className="flex items-center gap-2">
                 <Radio size={12} className="text-emerald-500 animate-pulse" />
                 <p className="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.2em]">Kolaborator Online</p>
              </div>
              <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">
                 {onlineSigners.length} Aktif
              </div>
           </div>

           <div className="flex items-center gap-3 flex-wrap">
            {onlineSigners.length > 0 ? (
              onlineSigners.map((sr) => {
                const isSigned = sr.status === 'SIGNED';
                const isMe = String(sr.userId) === String(currentUser?.id);
                const name = sr.user?.name || 'User';
                const initials = name.trim().split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

                return (
                  <div
                    key={sr.userId}
                    className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl border transition-all animate-in zoom-in-90 duration-300
                      ${isMe 
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' 
                        : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-white/5 shadow-sm'}
                    `}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 relative
                      ${isMe ? 'bg-white/20 text-white' : (isSigned ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-400')}`}
                    >
                      {initials}
                      {/* Green dot online */}
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full shadow-sm" />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <p className={`text-[10px] font-black uppercase tracking-tight leading-none truncate max-w-[80px]
                        ${isMe ? 'text-white' : 'text-zinc-800 dark:text-white'}`}
                      >
                        {isMe ? 'Anda' : name.split(' ')[0]}
                      </p>
                      <p className={`text-[8px] font-bold uppercase tracking-widest leading-none mt-1
                        ${isMe ? 'text-white/70' : (isSigned ? 'text-emerald-500' : 'text-zinc-400')}`}
                      >
                        {isSigned ? 'Signed' : 'Editing'}
                      </p>
                    </div>
                    {isSigned && !isMe && <CheckCircle size={12} className="text-emerald-500 ml-1" />}
                  </div>
                );
              })
            ) : (
              <p className="text-[10px] font-bold text-zinc-400 italic">Hanya Anda di dokumen ini</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default GroupSignerProgress;
