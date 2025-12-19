import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { MoreVertical, Search, ArrowUpDown, Info, UserX, UserCheck, Trash2 } from 'lucide-react';
import { useUserRole } from '../../hooks/useUserRole';
import { UserAccessDetailsModal } from '../modals/UserAccessDetailsModal';
import { formatCompactNumber } from '../../utils/helpers';

export interface TenantUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  avatar?: string;
  status: string;
  email_verified: boolean;
  timezone: string;
  locale: string;
  last_login_at?: string;
  created_at?: string;
  created_time?: string;
}

interface UserTableProps {
  users: TenantUser[];
  onRemoveUser?: (userId: string) => void;
  onEditUser?: (user: TenantUser) => void;
  onActivateUser?: (userId: string) => void;
  onDeactivateUser?: (userId: string) => void;
  showSearch?: boolean;
  headerActions?: React.ReactNode;
}

const getStatusBadge = (status: string, emailVerified: boolean) => {
  if (!emailVerified) {
    return { text: 'Pending', color: 'bg-orange-100 text-orange-700' };
  }

  switch (status?.toLowerCase()) {
    case 'active':
      return { text: 'Active', color: 'bg-green-100 text-green-700' };
    case 'pending':
      return { text: 'Pending', color: 'bg-orange-100 text-orange-700' };
    case 'inactive':
      return { text: 'Inactive', color: 'bg-gray-100 text-gray-700' };
    case 'deactivated':
      return { text: 'Deactivated', color: 'bg-red-500 text-white' };
    default:
      return { text: status || 'Active', color: 'bg-blue-100 text-blue-700' };
  }
};
const getTimezoneName = (timezone: string) => {
  if (!timezone || timezone.trim() === '') {
    return '-';
  }
  return timezone;
};

const formatCreatedTime = (createdTime?: string) => {
  if (!createdTime) return '-';

  try {
    const date = new Date(createdTime);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return '-';
  }
};

const formatLastActive = (lastActiveAt?: string) => {
  if (!lastActiveAt || lastActiveAt === '0001-01-01T00:00:00Z') {
    return '-';
  }

  try {
    const date = new Date(lastActiveAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  } catch {
    return '-';
  }
};

const getAvatarInitials = (firstName: string, lastName: string) => {
  const first = (firstName?.[0] || '').toUpperCase();
  const last = (lastName?.[0] || '').toUpperCase();
  return first + last || 'U';
};

const getAvatarColor = (userId: string) => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-cyan-500'
  ];

  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export const UserTable: React.FC<UserTableProps> = ({
  users,
  onRemoveUser,
  onEditUser,
  onActivateUser,
  onDeactivateUser,
  showSearch = true,
  headerActions
}) => {
  const { isAdmin } = useUserRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<'name' | 'status' | 'lastActive' | 'timezone' | 'createdTime' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [accessDetailsUserId, setAccessDetailsUserId] = useState<string | null>(null);
  const actionButtonRefs = useRef<Record<string, HTMLButtonElement>>({});
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = users.filter(user =>
        user.display_name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.first_name?.toLowerCase().includes(term) ||
        user.last_name?.toLowerCase().includes(term)
      );
    }

    // Sort users
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aVal: any, bVal: any;
        switch (sortColumn) {
          case 'name':
            aVal = (a.display_name || `${a.first_name} ${a.last_name}`).toLowerCase();
            bVal = (b.display_name || `${b.first_name} ${b.last_name}`).toLowerCase();
            break;
          case 'status':
            aVal = a.status?.toLowerCase() || '';
            bVal = b.status?.toLowerCase() || '';
            break;
          case 'lastActive':
            aVal = a.last_login_at ? new Date(a.last_login_at).getTime() : 0;
            bVal = b.last_login_at ? new Date(b.last_login_at).getTime() : 0;
            break;
          case 'timezone':
            aVal = a.timezone?.toLowerCase() || '';
            bVal = b.timezone?.toLowerCase() || '';
            break;
          case 'createdTime':
            aVal = (a.created_time || a.created_at) ? new Date(a.created_time || a.created_at || '').getTime() : 0;
            bVal = (b.created_time || b.created_at) ? new Date(b.created_time || b.created_at || '').getTime() : 0;
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
  }, [users, searchTerm, sortColumn, sortDirection]);

  const handleSort = (column: 'name' | 'status' | 'lastActive' | 'timezone' | 'createdTime') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Calculate menu position when opening
  useEffect(() => {
    if (openActionMenu && actionButtonRefs.current[openActionMenu]) {
      const button = actionButtonRefs.current[openActionMenu];
      const rect = button.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      // Get menu width (estimate or actual if rendered)
      const menuWidth = menuRef.current?.offsetWidth || 192; // w-48 = 12rem = 192px

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
      const estimatedHeight = menuRef.current?.offsetHeight || 100;

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
  }, [openActionMenu]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openActionMenu && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        const button = actionButtonRefs.current[openActionMenu];
        if (button && !button.contains(event.target as Node)) {
          setOpenActionMenu(null);
        }
      }
    };

    if (openActionMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openActionMenu]);

  if (users.length === 0) {
    return (
      <div className="bg-card rounded-xl border p-8">
        <div className="text-center">
          <p className="text-gray-600 mb-2">No users found</p>
          <p className="text-sm text-gray-500 mb-4">Add new users to get started</p>
          {headerActions && (
            <div className="flex justify-center">
              {headerActions}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      {/* Search Bar with Actions */}
      {showSearch && (
        <div className="p-4 border-b">
          <div className="flex items-center justify-between gap-3">
            <div className="relative min-w-96">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search User"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 h-11 border flex items-center rounded-[var(--radius-lg)] text-[var(--color-text-primary)] focus:border-[--color-brand-600] placeholder:text-[var(--color-text-placeholder)] bg-[--color-alpha-white] truncate overflow-ellipsis whitespace-nowrap outline-none cursor-pointer transition-all duration-200"
              />
            </div>
            {headerActions && (
              <div className="flex-shrink-0">
                {headerActions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="max-h-[calc(100vh-190px)] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-2 text-xs text-gray-700 font-semibold hover:text-gray-900"
                  >
                    User
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-2 text-xs text-gray-700 font-semibold hover:text-gray-900"
                  >
                    Status
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('lastActive')}
                    className="flex items-center gap-2 text-xs text-gray-700 font-semibold hover:text-gray-900"
                  >
                    Last Active
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('timezone')}
                    className="flex items-center gap-2 text-xs text-gray-700 font-semibold hover:text-gray-900"
                  >
                    Timezone
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('createdTime')}
                    className="flex items-center gap-2 text-xs text-gray-700 font-semibold hover:text-gray-900"
                  >
                    Created Time
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                {(onRemoveUser || onEditUser || onActivateUser || onDeactivateUser) && (
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs text-gray-700 font-semibold">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const statusBadge = getStatusBadge(user.status, user.email_verified);
                const avatarColor = getAvatarColor(user.id);
                const avatarInitials = getAvatarInitials(user.first_name, user.last_name);

                return (
                  <tr key={user.id} className="bg-card hover:bg-[var(--color-hover-bg)] transition-colors">
                    {/* User Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                            <img
                              src={user.avatar}
                              alt={user.display_name || `${user.first_name} ${user.last_name}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center text-white text-sm font-semibold`}>
                            {avatarInitials}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.display_name || `${user.first_name} ${user.last_name}`}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-block  px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                        {statusBadge.text}
                      </span>
                    </td>

                    {/* Last Active */}
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{formatLastActive(user.last_login_at)}</p>
                    </td>

                    {/* Timezone */}
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{getTimezoneName(user.timezone)}</p>
                    </td>

                    {/* Created Time */}
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{formatCreatedTime(user.created_time || user.created_at)}</p>
                    </td>

                    {/* Actions */}
                    {(onRemoveUser || onEditUser || onActivateUser || onDeactivateUser) && (
                      <td className="px-6 py-4">
                        <button
                          ref={(el) => {
                            if (el) actionButtonRefs.current[user.id] = el;
                          }}
                          onClick={() => setOpenActionMenu(openActionMenu === user.id ? null : user.id)}
                          className="p-1 rounded hover:bg-gray-200 transition-colors"
                          aria-label="More actions"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dropdown Menu - Rendered via Portal outside table */}
      {openActionMenu && menuPosition && ReactDOM.createPortal(
        <div
          ref={menuRef}
          className="fixed w-60 bg-card border rounded-xl shadow-lg z-50 p-1.5"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
        >
          {/* View Access Details */}
          {(() => {
            const user = filteredUsers.find(u => u.id === openActionMenu);
            if (!user) return null;
            return (
              <button
                onClick={() => {
                  setAccessDetailsUserId(openActionMenu);
                  setOpenActionMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl flex items-center gap-2"
              >
                <Info className="w-4 h-4" />
                View Access Details
              </button>
            );
          })()}
          {/* Activate/Deactivate user - Admin only */}
          {isAdmin() && (() => {
            const user = filteredUsers.find(u => u.id === openActionMenu);
            if (!user) return null;

            const isActive = user.status?.toLowerCase() === 'active' && user.email_verified;
            const isActivated = user.status?.toLowerCase() === 'deactivated' && user.email_verified;
            if (isActive && onDeactivateUser) {
              return (
                <button
                  onClick={() => {
                    onDeactivateUser(openActionMenu);
                    setOpenActionMenu(null);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl flex items-center gap-2"
                >
                  <UserX className="w-4 h-4" />
                  Deactivate User
                </button>
              );
            } else if (isActivated && onActivateUser) {
              return (
                <button
                  onClick={() => {
                    onActivateUser(openActionMenu);
                    setOpenActionMenu(null);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Activate User
                </button>
              );
            }
            return null;
          })()}
          {/* Edit user */}
          {/* {onEditUser && filteredUsers.find(u => u.id === openActionMenu) && (
                              <button
                                onClick={() => {
                const user = filteredUsers.find(u => u.id === openActionMenu);
                if (user) onEditUser(user);
                                  setOpenActionMenu(null);
                                }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Edit User
                              </button>
                            )} */}
          {/* Delete user */}
          {onRemoveUser && (
            <button
              onClick={() => {
                onRemoveUser(openActionMenu);
                setOpenActionMenu(null);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Remove User
            </button>
          )}
        </div>,
        document.body
      )}

      {/* Footer Info */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <p className="text-xs text-gray-500">
          Showing <span className="font-medium">{formatCompactNumber(filteredUsers.length)}</span> of <span className="font-medium">{formatCompactNumber(users.length)}</span> users
        </p>
      </div>

      {/* Access Details Modal */}
      {accessDetailsUserId && (() => {
        const user = filteredUsers.find(u => u.id === accessDetailsUserId) || users.find(u => u.id === accessDetailsUserId);
        if (!user) return null;
        return ReactDOM.createPortal(
          <UserAccessDetailsModal
            isOpen={!!accessDetailsUserId}
            onClose={() => setAccessDetailsUserId(null)}
            userId={accessDetailsUserId}
            userName={user.display_name || `${user.first_name} ${user.last_name}` || user.email}
          />,
          document.body
        );
      })()}
    </div>
  );
};
