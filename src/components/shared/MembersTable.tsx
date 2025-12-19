import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Crown, MoreVertical, ArrowUpDown, Copy, Trash2, Search, Shield, Edit } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { AccessRoleSelector, AccessRole, RoleConfig } from './AccessRoleSelector';

export interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: AccessRole;
  dateJoined: string;
  avatar?: string;
  access_level?: string; // Raw access_level from API
}

interface MembersTableProps {
  members: Member[];
  roleConfig: Record<AccessRole, RoleConfig>;
  onRoleChange?: (memberId: string, newRole: AccessRole) => void;
  onCopyUserId?: (userId: string) => void;
  onRemoveMember?: (memberId: string) => void;
  onEditMember?: (memberId: string) => void;
  showSearch?: boolean;
  editorSeats?: number;
  className?: string;
  headerActions?: React.ReactNode;
}

const getInitials = (name: string): string => {
  const parts = name.split(/[.\s]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getAvatarColor = (name: string): string => {
  const colors = [
    'bg-orange-500',
    'bg-purple-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-yellow-500'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const formatAccessLevel = (accessLevel: string): string => {
  // Convert "full_access" to "Full Access", "limited_access" to "Limited Access", etc.
  return accessLevel
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const MembersTable: React.FC<MembersTableProps> = ({
  members,
  roleConfig,
  onRoleChange,
  onCopyUserId,
  onRemoveMember,
  onEditMember,
  showSearch = true,
  editorSeats,
  className = '',
  headerActions
}) => {
 
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<'name' | 'role' | 'date' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [openActionsMenu, setOpenActionsMenu] = useState<string | null>(null);
  const [memberRoleDropdowns, setMemberRoleDropdowns] = useState<Record<string, AccessRole>>({});
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const actionButtonRefs = useRef<Record<string, HTMLButtonElement>>({});

  // Filter members based on search
  const filteredMembers = useMemo(() => {
    let filtered = members.filter(member =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort members
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aVal: any, bVal: any;
        switch (sortColumn) {
          case 'name':
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
            break;
          case 'role':
            aVal = a.role;
            bVal = b.role;
            break;
          case 'date':
            aVal = parseInt(a.dateJoined) || 0;
            bVal = parseInt(b.dateJoined) || 0;
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [members, searchQuery, sortColumn, sortDirection]);

  const handleSort = (column: 'name' | 'role' | 'date') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleRoleChange = (memberId: string, newRole: AccessRole) => {
    setMemberRoleDropdowns(prev => ({ ...prev, [memberId]: newRole }));
    onRoleChange?.(memberId, newRole);
  };

  const handleCopyUserId = (userId: string) => {
    navigator.clipboard.writeText(userId);
    setOpenActionsMenu(null);
    onCopyUserId?.(userId);
  };

  const handleRemoveMember = (memberId: string) => {
    setOpenActionsMenu(null);
    setMenuPosition(null);
    onRemoveMember?.(memberId);
  };

  const handleEditMember = (memberId: string) => {
    setOpenActionsMenu(null);
    setMenuPosition(null);
    if (onEditMember) {
      onEditMember(memberId);
    } else {
      console.warn('onEditMember handler is not provided', { onEditMember, memberId });
    }
  };

  // Calculate menu position when opening
  useEffect(() => {
    if (openActionsMenu && actionButtonRefs.current[openActionsMenu]) {
      const button = actionButtonRefs.current[openActionsMenu];
      const rect = button.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      // Get menu width (estimate or actual if rendered)
      const menuWidth = actionsMenuRef.current?.offsetWidth || 200; // min-w-[200px]

      // Calculate left position - align to right edge of button
      let left = rect.right + scrollX - menuWidth;

      // Adjust if menu would go off-screen
      const margin = 10;
      if (left < margin) {
        left = rect.left + scrollX; // Fallback to left edge
      } else if (left + menuWidth > viewportWidth - margin) {
        left = viewportWidth - menuWidth - margin;
      }

      // Calculate top position
      let top = rect.bottom + scrollY + 4;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const estimatedHeight = actionsMenuRef.current?.offsetHeight || 100;

      // If not enough space below, open above
      if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
        top = rect.top + scrollY - estimatedHeight - 4;
      }

      // Adjust vertical position for viewport boundaries
      if (top < scrollY + margin) {
        top = scrollY + margin;
      } else if (top + estimatedHeight > scrollY + viewportHeight - margin) {
        top = scrollY + viewportHeight - estimatedHeight - margin;
      }

      setMenuPosition({ top, left });
    } else {
      setMenuPosition(null);
    }
  }, [openActionsMenu]);

  useClickOutside({
    isOpen: openActionsMenu !== null,
    onClose: () => {
      setOpenActionsMenu(null);
      setMenuPosition(null);
    },
    excludeRefs: [actionsMenuRef]
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Members Table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        {/* Header with Search and Actions */}
        {(showSearch || editorSeats !== undefined || headerActions) && (
          <div className="p-3">
            <div className="flex items-center justify-between gap-3">
              {/* Search Bar */}
              {showSearch && (
                <div className="relative min-w-96">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search members"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-4 py-2 h-11 border flex items-center rounded-[var(--radius-lg)] text-[var(--color-text-primary)] focus:border-[--color-brand-600] placeholder:text-[var(--color-text-placeholder)] bg-[--color-alpha-white] truncate overflow-ellipsis whitespace-nowrap outline-none cursor-pointer transition-all duration-200"
                  />
                </div>
              )}

              <div className="flex items-center gap-4">
                {/* Editor Seats */}
                {editorSeats !== undefined && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">{editorSeats} Editor seats</span>
                  </div>
                )}

                {/* Header Actions (e.g., Add Member button) */}
                {headerActions && (
                  <div className="flex-shrink-0">
                    {headerActions}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Members Table */}
        <div className="bg-white border-t border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-300px)] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                {/* Members Column */}
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-2 text-xs text-gray-700 font-semibold hover:text-gray-900"
                  >
                    Members
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>

                {/* Access Column */}
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('role')}
                    className="flex items-center gap-2 text-xs text-gray-700 font-semibold hover:text-gray-900"
                  >
                    Access
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>

                {/* Date Joined Column */}
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-2 text-xs text-gray-700 font-semibold hover:text-gray-900"
                  >
                    Date Joined
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>

                {/* Actions Column */}
                <th className="px-6 py-3 text-right">
                  <span className="text-xs text-gray-700 font-semibold hover:text-gray-900">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-gray-200">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No members found
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const initials = getInitials(member.name);
                  const avatarColor = getAvatarColor(member.name);
                  const currentRole = memberRoleDropdowns[member.id] || member.role;

                  return (
                    <tr key={member.id} className="bg-card hover:bg-[var(--color-hover-bg)] transition-colors">
                      {/* Member Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {member.avatar ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                              <img
                                src={member.avatar}
                                alt={member.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-semibold text-sm`}>
                              {initials}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 truncate">{member.name}</span>
                              {member.role === 'owner' && <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
                            </div>
                            <div className="text-sm text-gray-500 truncate">{member.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Access/Role */}
                      <td className="px-6 py-4">
                        {member.access_level ? (
                          // Display formatted access_level from API
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-purple-100 text-purple-700 border-purple-200">
                            <Shield className="w-3 h-3" />
                            {formatAccessLevel(member.access_level)}
                          </div>
                        ) : onRoleChange ? (
                          <AccessRoleSelector
                            value={currentRole}
                            onChange={(newRole) => handleRoleChange(member.id, newRole)}
                            roleConfig={roleConfig}
                            className="w-auto"
                          />
                        ) : (
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${roleConfig[member.role].color}`}>
                            {React.createElement(roleConfig[member.role].icon, { className: 'w-3 h-3' })}
                            {roleConfig[member.role].label}
                          </div>
                        )}
                      </td>

                      {/* Date Joined */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{member.dateJoined}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block">
                          <button
                            ref={(el) => {
                              if (el) actionButtonRefs.current[member.id] = el;
                            }}
                            onClick={() => setOpenActionsMenu(openActionsMenu === member.id ? null : member.id)}
                            className="p-1.5 rounded-xl hover:bg-[var(--color-hover-bg)] transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 icons-bg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Actions Menu Portal */}
      {openActionsMenu && menuPosition && (() => {
        const member = filteredMembers.find(m => m.id === openActionsMenu);
        if (!member) return null;

        return createPortal(
          <div
            ref={actionsMenuRef}
            className="fixed bg-card border shadow-sm rounded-xl z-50 min-w-[200px] p-1.5"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left - 20}px`
            }}
          >
            {/* {onCopyUserId && (
              <button
                onClick={() => handleCopyUserId(member.userId)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-primary rounded-xl"
              >
                <Copy className="w-4 h-4" />
                <span>USER ID: {member.userId}</span>
              </button>
            )} */}
            {onEditMember && (
              <button
                onClick={() => handleEditMember(openActionsMenu)}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-gray-50 ${!onCopyUserId ? 'rounded-xl' : ''} rounded-xl`}
              >
                <Edit className="w-4 h-4" />
                Edit member
              </button>
            )}
            {onRemoveMember && (
              <button
                onClick={() => handleRemoveMember(openActionsMenu)}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 ${!onCopyUserId ? 'rounded-xl' : ''} rounded-xl`}
              >
                <Trash2 className="w-4 h-4" />
                Remove member
              </button>
            )}
          </div>,
          document.body
        );
      })()}
    </div>
  );
};

