import React from 'react';
import { CheckCircle, Radio } from 'lucide-react';
import { useGroupSignerProgressData } from '../hooks/useGroupSignerProgressData';

/**
 * @component GroupSignerProgress
 * @description Progress kolaborator — versi compact untuk sidebar.
 * Menampilkan progress bar + daftar kolaborator online.
 */
const GroupSignerProgress = ({
  groupData,
  totalSigners,
  pendingSigners,
  documentId,
  activeUsers = [],
}) => {
  const { isVisible, currentUser, signedCount, percent, onlineSigners } = useGroupSignerProgressData({
    groupData,
    totalSigners,
    pendingSigners,
    documentId,
    activeUsers,
  });

  if (!isVisible) return null;

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Kemajuan</p>
          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">{signedCount}/{totalSigners}</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Online Collaborators */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Radio size={10} className="text-emerald-500 animate-pulse" />
            <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Online</p>
          </div>
          <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
            {onlineSigners.length} aktif
          </span>
        </div>

        <div className="space-y-1">
          {onlineSigners.length > 0 ? (
            onlineSigners.map((sr) => {
              const isSigned = sr.status === 'SIGNED';
              const isRejected = sr.status === 'REJECTED';
              const isMe = String(sr.userId) === String(currentUser?.id);
              const name = sr.user?.name || 'User';
              const initials = name.trim().split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

              return (
                <div
                  key={sr.userId}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all
                    ${isMe
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20'
                      : isRejected
                        ? 'bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800'
                        : 'bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800'}
                  `}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[8px] font-bold shrink-0 relative
                    ${isMe ? 'bg-emerald-500 text-white' : (isSigned ? 'bg-emerald-500 text-white' : isRejected ? 'bg-rose-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400')}`}
                  >
                    {initials}
                    {!isRejected && (
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-white dark:border-zinc-900 rounded-full" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-bold leading-none truncate
                      ${isMe ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-200'}`}
                    >
                      {isMe ? 'Anda' : name.split(' ')[0]}
                    </p>
                    <p className={`text-[8px] font-medium leading-none mt-0.5
                      ${isSigned ? 'text-emerald-500' : isRejected ? 'text-rose-500' : 'text-zinc-400 dark:text-zinc-500'}`}
                    >
                      {isSigned ? 'Signed' : isRejected ? 'Rejected' : 'Editing'}
                    </p>
                  </div>

                  {isSigned && !isMe && <CheckCircle size={10} className="text-emerald-500 shrink-0" />}
                </div>
              );
            })
          ) : (
            <p className="text-[9px] text-zinc-400 dark:text-zinc-500 italic">Hanya Anda di dokumen ini</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupSignerProgress;
