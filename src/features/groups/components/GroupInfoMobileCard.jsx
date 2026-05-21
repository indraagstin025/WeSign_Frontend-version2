import React from 'react';
import { Users } from 'lucide-react';

/**
 * @component GroupInfoMobileCard
 * @description Card info group + active collaborator avatars khusus mobile.
 *   Tampil di atas PDF viewer di GroupSigningPage.
 *
 * Layout (sesuai mockup):
 *   [👥]  Group Signing      [• N aktif]   [Avatar1][Avatar2][+more]
 *         N anggota
 *
 * @param {object} props
 * @param {object} props.groupData
 * @param {Array} [props.activeUsers]
 * @param {Array} [props.signerRequests] - Daftar signer di dokumen aktif
 * @param {string} [props.currentUserId]
 */
const GroupInfoMobileCard = ({
  groupData,
  activeUsers = [],
  signerRequests = [],
  currentUserId,
}) => {
  if (!groupData) return null;

  const memberCount = groupData.members_count ?? groupData._count?.members ?? groupData.members?.length ?? 0;

  // Avatar bubbles: ambil unique signer dari signerRequests, max 2 + "+more".
  const uniqueSigners = [];
  const seenIds = new Set();
  for (const sr of signerRequests) {
    const u = sr.user;
    if (!u || seenIds.has(u.id)) continue;
    seenIds.add(u.id);
    uniqueSigners.push(u);
    if (uniqueSigners.length >= 3) break;
  }
  const visibleAvatars = uniqueSigners.slice(0, 2);
  const remaining = Math.max(0, signerRequests.length - 2);

  // Set untuk cek apakah user lagi online
  const onlineUserIds = new Set(activeUsers.map((au) => String(au.userId || au.id)));

  const getInitials = (name = '') =>
    name.trim().split(/\s+/).map((n) => n[0]).join('').substring(0, 2).toUpperCase() || '??';

  return (
    <div className="sm:hidden bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-700/60 rounded-2xl p-3 mx-4 mt-2 mb-3 flex items-center gap-3 shadow-sm">
      {/* Group icon */}
      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
        <Users size={18} className="text-emerald-600 dark:text-emerald-400" />
      </div>

      {/* Title + member count */}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-zinc-900 dark:text-white truncate">Group Signing</p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{memberCount} anggota</p>
      </div>

      {/* Active badge */}
      {activeUsers.length > 0 && (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {activeUsers.length} aktif
        </span>
      )}

      {/* Avatar bubbles */}
      <div className="flex items-center -space-x-2 shrink-0">
        {visibleAvatars.map((u) => {
          const isOnline = onlineUserIds.has(String(u.id));
          const isMe = String(u.id) === String(currentUserId);
          return (
            <div
              key={u.id}
              className={`w-8 h-8 rounded-full ring-2 ring-white dark:ring-zinc-800 flex items-center justify-center text-[10px] font-bold relative
                ${isMe
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}`}
              title={u.name}
            >
              {getInitials(u.name)}
              {isOnline && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-800" />
              )}
            </div>
          );
        })}
        {/* "+more" bubble — atau dashed circle "+" untuk add */}
        <div
          className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-[14px] font-medium"
          title={remaining > 0 ? `+${remaining} signer lain` : 'Tidak ada signer lain'}
        >
          {remaining > 0 ? `+${remaining}` : '+'}
        </div>
      </div>
    </div>
  );
};

export default GroupInfoMobileCard;
