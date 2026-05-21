import React from 'react';
import { Crown, UserMinus, Loader2 } from 'lucide-react';
import { useGroupMemberListView } from '../hooks/useGroupMemberListView';

/**
 * @component GroupMemberList
 * @description List anggota grup — compact row style sesuai mockup.
 */
const GroupMemberList = ({ members, adminId, currentUserId, onKick, kickingId }) => {
  const { state, actions } = useGroupMemberListView({ members });
  const { isExpanded, displayMembers, hasMore } = state;

  if (!members || members.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Belum ada anggota</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {displayMembers.map((member) => {
        const isAdminMember = String(member.userId) === String(adminId);
        const isMe = String(member.userId) === String(currentUserId);
        const name = member.user?.name || member.name || 'User';
        const email = member.user?.email || member.email || '';
        const avatarUrl = member.user?.profilePictureUrl;
        const initials = name.trim().split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

        return (
          <div
            key={member.id || member.userId}
            className="group flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-all cursor-default"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar */}
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black
                    ${isAdminMember
                      ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600'
                      : isMe
                        ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300'}
                  `}>
                    {initials}
                  </div>
                )}
                {/* Online dot */}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
              </div>

              {/* Info */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[12px] font-bold text-zinc-900 dark:text-white truncate max-w-[120px]">
                    {name}
                  </p>
                  {isAdminMember && (
                    <Crown size={10} className="text-amber-500 shrink-0" />
                  )}
                  {isMe && (
                    <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                      YOU
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 truncate max-w-[140px]">{email}</p>
              </div>
            </div>

            {/* Kick button — admin only, not self */}
            {onKick && !isAdminMember && !isMe && (
              <button
                onClick={() => onKick(member.userId, name)}
                disabled={kickingId === member.userId}
                className="p-1.5 rounded-lg text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 opacity-0 group-hover:opacity-100 transition-all border-none bg-transparent cursor-pointer disabled:opacity-50 shrink-0"
                title="Keluarkan anggota"
              >
                {kickingId === member.userId ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <UserMinus size={13} />
                )}
              </button>
            )}
          </div>
        );
      })}

      {hasMore && (
        <button
          onClick={actions.toggleExpand}
          className="w-full mt-1 py-2 rounded-xl text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition-all cursor-pointer bg-transparent border-none"
        >
          {isExpanded ? 'Tampilkan lebih sedikit' : `Lihat semua (${members.length})`}
        </button>
      )}
    </div>
  );
};

export default GroupMemberList;
