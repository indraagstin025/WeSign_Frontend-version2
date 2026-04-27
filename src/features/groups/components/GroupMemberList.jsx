import React from 'react';
import { Crown, UserMinus, Loader2, Shield } from 'lucide-react';

/**
 * @component GroupMemberList
 * @description List anggota grup dengan indikator admin.
 */
const GroupMemberList = ({ members, adminId, currentUserId, onKick, kickingId }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!members || members.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">No members yet</p>
      </div>
    );
  }

  const displayMembers = isExpanded ? members : members.slice(0, 6);
  const hasMore = members.length > 6;

  return (
    <div className="flex flex-col gap-1">
      <div className="space-y-1">
        {displayMembers.map((member) => {
          const isAdmin = String(member.userId) === String(adminId);
          const isMe = String(member.userId) === String(currentUserId);
          const name = member.user?.name || member.name || 'User';
          const email = member.user?.email || member.email || '';
          
          const initials = name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

          return (
            <div
              key={member.id || member.userId}
              className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-all duration-300 cursor-default"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border-2 relative
                  ${isAdmin 
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
                    : isMe 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-100 border-zinc-100 dark:border-white/5'
                  }
                `}>
                  {initials}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[12px] font-black text-zinc-900 dark:text-white truncate tracking-tight">
                      {name}
                    </p>
                    {isAdmin && (
                      <div className="flex items-center justify-center p-0.5 rounded-md bg-amber-500/10 text-amber-500" title="Admin">
                        <Crown size={10} />
                      </div>
                    )}
                    {isMe && (
                      <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter border border-emerald-500/20 px-1 rounded">YOU</span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-100 opacity-50 truncate tracking-tight">{email}</p>
                </div>
              </div>

              {/* Actions */}
              {onKick && isAdmin && !isMe && (
                <button
                  onClick={() => onKick(member.userId, name)}
                  disabled={kickingId === member.userId}
                  className="p-1.5 rounded-lg text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 opacity-0 group-hover:opacity-100 transition-all border-none bg-transparent cursor-pointer disabled:opacity-50"
                >
                  {kickingId === member.userId ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <UserMinus size={14} />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 w-full py-3 rounded-xl border border-dashed border-zinc-200 dark:border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-emerald-500 hover:border-emerald-500/30 transition-all cursor-pointer bg-transparent"
        >
          {isExpanded ? 'Show Less' : `See All Members (${members.length})`}
        </button>
      )}
    </div>
  );
};

export default GroupMemberList;
