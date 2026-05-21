import { useState, useMemo } from 'react';

/**
 * @hook useGroupMemberListView
 * @description Mengelola state expand/collapse dan derivasi tampilan member list.
 *
 * @param {object} args
 * @param {Array} args.members
 * @param {number} [args.initialPageSize=6]
 */
export function useGroupMemberListView({ members, initialPageSize = 6 }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { displayMembers, hasMore } = useMemo(() => {
    if (!members) return { displayMembers: [], hasMore: false };
    return {
      displayMembers: isExpanded ? members : members.slice(0, initialPageSize),
      hasMore: members.length > initialPageSize,
    };
  }, [members, isExpanded, initialPageSize]);

  const toggleExpand = () => setIsExpanded((prev) => !prev);

  return {
    state: { isExpanded, displayMembers, hasMore },
    actions: { toggleExpand },
  };
}
