import React from 'react';
import { Crown, UserMinus, Loader2, Shield } from 'lucide-react';

/**
 * @component GroupMemberList
 * @description List anggota grup dengan indikator admin.
 */
const GroupMemberList = ({ members, adminId, currentUserId, onKick, kickingId }) => {
  if (!members || members.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Tidak ada anggota</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {members.map((member) => {
        const isAdmin = String(member.userId) === String(adminId);
        const isMe = String(member.userId) === String(currentUserId);
        const name = member.user?.name || member.name || 'User';
        const email = member.user?.email || member.email || '';
        
        // Buat inisial untuk avatar jika tidak ada foto
        const initials = name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase();

        return (
          <div
            key={member.id || member.userId}
            className="group flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-all duration-300"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border-2
                ${isAdmin 
                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
                  : isMe 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-100 dark:border-white/5'
                }
              `}>
                {initials}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-black text-zinc-800 dark:text-white truncate">
                    {name}
                  </p>
                  {isAdmin && (
                    <div className="text-amber-500" title="Admin">
                      <Shield size={10} fill="currentColor" fillOpacity={0.2} />
                    </div>
                  )}
                  {isMe && <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-tighter">(Anda)</span>}
                </div>
                <p className="text-[10px] font-bold text-zinc-400 truncate tracking-tight">{email}</p>
              </div>
            </div>

            {/* Actions: Kick (hanya muncul jika admin & bukan diri sendiri) */}
            {onKick && isAdmin && !isMe && (
              <button
                onClick={() => onKick(member.userId, name)}
                disabled={kickingId === member.userId}
                className="p-2 rounded-lg text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 opacity-0 group-hover:opacity-100 transition-all border-none bg-transparent cursor-pointer disabled:opacity-50"
                title="Keluarkan dari grup"
              >
                {kickingId === member.userId ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <UserMinus size={14} />
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GroupMemberList;
