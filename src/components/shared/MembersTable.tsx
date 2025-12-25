import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { MoreVertical, ChevronsUpDown, Search, Edit, Trash2, Filter, Loader2 } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { AccessRoleSelector, AccessRole, RoleConfig } from './AccessRoleSelector';
import { useUserAccessDetails } from '../../hooks/useApi';

export interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: AccessRole;
  dateJoined: string;
  avatar?: string;
  access_level?: string; // Raw access_level from API
  last_active_at?: string;
  last_login_at?: string;
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

const getAvatarColor = (userId: string): string => {
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

const formatLastActive = (lastActiveAt?: string, lastLoginAt?: string) => {
  const dateStr = lastActiveAt || lastLoginAt;
  if (!dateStr || dateStr === '0001-01-01T00:00:00Z') {
    return '-';
  }

  try {
    const date = new Date(dateStr);
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

// Role calculation utility
const getOverallRoles = (member: Member): string[] => {
  const roles: string[] = [];

  if (member.access_level === 'full_access') {
    roles.push('Co-owner');
  } else if (member.access_level === 'limited_access') {
    roles.push('Workspace Maintainer');
  }

  // Fallback to role if no access_level
  if (roles.length === 0) {
    if (member.role === 'owner') {
      roles.push('Owner');
    } else if (member.role === 'editor') {
      roles.push('Workspace Member');
    } else {
      roles.push('Workspace Read Only');
    }
  }

  return [...new Set(roles)]; // Remove duplicates
};

// Role pill styling
const getRolePillStyle = (role: string) => {
  const roleLower = role.toLowerCase();
  if (roleLower.includes('owner')) {
    return 'bg-green-100 text-green-700 border border-green-200';
  } else if (roleLower.includes('co-owner')) {
    return 'bg-green-50 text-green-600 border border-green-200';
  } else if (roleLower.includes('workspace maintainer')) {
    return 'bg-purple-100 text-purple-700 border border-purple-200';
  } else if (roleLower.includes('workspace read only')) {
    return 'bg-orange-100 text-orange-700 border border-orange-200';
  } else if (roleLower.includes('base member')) {
    return 'bg-red-100 text-red-700 border border-red-200';
  } else if (roleLower.includes('base read only')) {
    return 'bg-gray-100 text-gray-700 border border-gray-200';
  }
  return 'bg-gray-100 text-gray-700 border border-gray-200';
};

// Infer base role from workspace access level (TEMPORARY)
const inferBaseRole = (workspaceAccessLevel: string): string => {
  // TEMPORARY: Infer base role from workspace access level
  // TODO: Replace when API provides actual base roles
  if (workspaceAccessLevel === 'full_access') {
    return 'Base Member';
  }
  return 'Base Read Only';
};

// Expandable Row Component for Access Details
const AccessDetailsRow: React.FC<{
  userId: string;
  colSpan: number;
}> = ({ userId, colSpan }) => {
  const { data: accessDetails, isLoading, error } = useUserAccessDetails(userId);

  if (isLoading) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-6 py-8 bg-gray-50">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            <span className="text-sm text-gray-500">Loading access details...</span>
          </div>
        </td>
      </tr>
    );
  }

  if (error) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-6 py-8 bg-gray-50">
          <div className="text-center">
            <p className="text-sm text-red-600">Failed to load access details</p>
          </div>
        </td>
      </tr>
    );
  }

  if (!accessDetails?.workspaces || accessDetails.workspaces.length === 0) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-6 py-8 bg-gray-50">
          <div className="text-center">
            <p className="text-sm text-gray-500">No workspace access</p>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-4 bg-gray-50">
        <div className="border rounded-lg overflow-hidden bg-background">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700">Workspace(s) Access</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700">Base(s) Access</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {accessDetails.workspaces.map((ws: { id: string; title: string; access_level: string; bases?: Array<{ id: string; title: string }> }) => {
                const baseCount = ws.bases?.length || 0;
                if (baseCount === 0) {
                  return (
                    <tr key={ws.id} className="bg-background">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{ws.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">-</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRolePillStyle(inferBaseRole(ws.access_level))}`}>
                          {inferBaseRole(ws.access_level)}
                        </span>
                      </td>
                    </tr>
                  );
                }
                return ws.bases?.map((base: { id: string; title: string }, baseIndex: number) => (
                  <tr key={`${ws.id}-${base.id}`} className="bg-background">
                    {baseIndex === 0 && (
                      <td rowSpan={baseCount} className="px-4 py-3 text-sm text-gray-900 font-medium align-top border-r border-gray-200">
                        {ws.title}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-gray-700">{base.title}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRolePillStyle(inferBaseRole(ws.access_level))}`}>
                        {inferBaseRole(ws.access_level)}
                      </span>
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );
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
  const [sortColumn, setSortColumn] = useState<'name' | 'role' | 'date' | 'lastActive' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [openActionsMenu, setOpenActionsMenu] = useState<string | null>(null);
  const [memberRoleDropdowns, setMemberRoleDropdowns] = useState<Record<string, AccessRole>>({});
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);
  const [isRoleFilterOpen, setIsRoleFilterOpen] = useState(false);
  const itemsPerPage = 10;
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const actionButtonRefs = useRef<Record<string, HTMLButtonElement>>({});
  const roleFilterRef = useRef<HTMLDivElement>(null);
  const roleFilterButtonRef = useRef<HTMLButtonElement>(null);

  // Filter members based on search
  const filteredMembers = useMemo(() => {
    let filtered = members.filter(member =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter by role
    if (selectedRoleFilter) {
      filtered = filtered.filter(member => {
        const roles = getOverallRoles(member);
        return roles.some(role => role.toLowerCase() === selectedRoleFilter.toLowerCase());
      });
    }

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
            aVal = a.access_level || a.role;
            bVal = b.access_level || b.role;
            break;
          case 'date':
            aVal = a.dateJoined ? new Date(a.dateJoined).getTime() : 0;
            bVal = b.dateJoined ? new Date(b.dateJoined).getTime() : 0;
            break;
          case 'lastActive':
            aVal = (a.last_active_at || a.last_login_at) ? new Date(a.last_active_at || a.last_login_at || '').getTime() : 0;
            bVal = (b.last_active_at || b.last_login_at) ? new Date(b.last_active_at || b.last_login_at || '').getTime() : 0;
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
  }, [members, searchQuery, selectedRoleFilter, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredMembers.slice(start, end);
  }, [filteredMembers, currentPage]);

  const handleSort = (column: 'name' | 'role' | 'date' | 'lastActive') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleExpand = (memberId: string) => {
    setExpandedMembers(prev => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
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

      const menuWidth = actionsMenuRef.current?.offsetWidth || 192;

      let left = rect.right + scrollX - menuWidth;
      const margin = 10;
      if (left < margin) {
        left = rect.left + scrollX;
      } else if (left + menuWidth > viewportWidth - margin) {
        left = viewportWidth - menuWidth - margin;
      }

      let top = rect.bottom + scrollY + 4;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const estimatedHeight = actionsMenuRef.current?.offsetHeight || 100;

      if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
        top = rect.top + scrollY - estimatedHeight - 4;
      }

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

  // Close role filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isRoleFilterOpen && roleFilterRef.current && !roleFilterRef.current.contains(event.target as Node) &&
          roleFilterButtonRef.current && !roleFilterButtonRef.current.contains(event.target as Node)) {
        setIsRoleFilterOpen(false);
      }
    };

    if (isRoleFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isRoleFilterOpen]);

  // Available roles for filtering
  const availableRoles = ['Owner', 'Co-owner', 'Workspace Maintainer', 'Workspace Read Only', 'Base Member', 'Base Read Only'];

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRoleFilter, searchQuery]);

  return (
      <div className="bg-card rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-primary">Workspace Members</h2>
          <div className="flex items-center gap-3">
              {showSearch && (
              <>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-4 py-2 h-10 border rounded-lg text-primary focus:border-primary placeholder:text-gray-400 bg-background outline-none transition-all"
                  />
                </div>
                <div className="relative" ref={roleFilterRef}>
                  <button
                    ref={roleFilterButtonRef}
                    onClick={() => setIsRoleFilterOpen(!isRoleFilterOpen)}
                    className={`px-4 py-2 text-sm border rounded-xl flex items-center gap-2 transition-colors ${
                      selectedRoleFilter
                        ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                        : 'border text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    Filter
                    {selectedRoleFilter && (
                      <span className="ml-1 px-1.5 py-0.5 bg-blue-200 text-blue-800 rounded text-xs">
                        {selectedRoleFilter}
                      </span>
                    )}
                  </button>

                  {/* Role Filter Dropdown */}
                  {isRoleFilterOpen && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-card border rounded-lg shadow-lg z-[9999] max-h-64 overflow-y-auto">
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setSelectedRoleFilter(null);
                            setIsRoleFilterOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors ${
                            !selectedRoleFilter ? 'bg-gray-100 font-medium' : ''
                          }`}
                        >
                          All Roles
                        </button>
                        {availableRoles.map((role) => (
                          <button
                            key={role}
                            onClick={() => {
                              setSelectedRoleFilter(role);
                              setIsRoleFilterOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors ${
                              selectedRoleFilter === role ? 'bg-gray-100 font-medium' : ''
                            }`}
                          >
                            {role}
                          </button>
                        ))}
                  </div>
                  </div>
                )}
                </div>
              </>
            )}
            {headerActions}
              </div>
            </div>
          </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="max-h-[calc(100vh-230px)] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-2 text-xs text-gray-700 font-semibold hover:text-gray-900"
                  >
                    User
                    <ChevronsUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('role')}
                    className="flex items-center gap-2 text-xs text-gray-700 font-semibold hover:text-gray-900"
                  >
                    Role
                    <ChevronsUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-2 text-xs text-gray-700 font-semibold hover:text-gray-900"
                  >
                    Joined Date
                    <ChevronsUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('lastActive')}
                    className="flex items-center gap-2 text-xs text-gray-700 font-semibold hover:text-gray-900"
                  >
                    Last Active
                    <ChevronsUpDown className="w-3 h-3" />
                  </button>
                </th>
                {(onRemoveMember || onEditMember) && (
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs text-gray-700 font-semibold">Actions</span>
                </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={4 + (onRemoveMember || onEditMember ? 1 : 0)} className="px-6 py-12 text-center text-gray-500">
                    No members found
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => {
                  const avatarColor = getAvatarColor(member.userId);
                  const initials = getInitials(member.name);
                  const isExpanded = expandedMembers.has(member.id);
                  const roles = getOverallRoles(member);

                  return (
                    <React.Fragment key={member.id}>
                      <tr className="bg-card hover:bg-gray-50 transition-colors">
                        {/* User Info */}
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
                              <div className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center text-white text-sm font-semibold`}>
                              {initials}
                            </div>
                          )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{member.name}</p>
                              <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 min-w-48">
                          <div className="flex flex-wrap gap-1.5">
                            {roles.map((role, idx) => (
                              <span
                                key={idx}
                                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getRolePillStyle(role)}`}
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                          <button
                            onClick={() => handleExpand(member.id)}
                            className="text-xs text-primary hover:underline self-start"
                          >
                            {isExpanded ? 'Collapse ↑' : 'View in detail ↓'}
                          </button>
                          </div>
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 min-w-48">{formatCreatedTime(member.dateJoined)}</p>
                      </td>

                      {/* Last Active */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 min-w-48">{formatLastActive(member.last_active_at, member.last_login_at)}</p>
                      </td>

                      {/* Actions */}
                      {(onRemoveMember || onEditMember) && (
                        <td className="px-6 py-4">
                          <button
                            ref={(el) => {
                              if (el) actionButtonRefs.current[member.id] = el;
                            }}
                            onClick={() => setOpenActionsMenu(openActionsMenu === member.id ? null : member.id)}
                            className="p-1 rounded hover:bg-gray-200 transition-colors"
                            aria-label="More actions"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-600" />
                          </button>
                      </td>
                      )}
                    </tr>

                      {/* Expanded Access Details Row */}
                      {isExpanded && (
                        <AccessDetailsRow
                          userId={member.userId}
                          colSpan={4 + (onRemoveMember || onEditMember ? 1 : 0)}
                        />
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer with Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-center">
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
              if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm rounded-lg ${currentPage === page
                      ? 'bg-gray-200 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="px-2 text-sm text-gray-500">...</span>;
              }
              return null;
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border rounded-lg text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Next →
            </button>
      </div>
      </div>
      )}

      {/* Actions Menu Portal */}
      {openActionsMenu && menuPosition && ReactDOM.createPortal(
          <div
            ref={actionsMenuRef}
          className="fixed w-60 bg-card border rounded-xl shadow-lg z-50 p-1.5"
            style={{
              top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
        >
            {onEditMember && (
              <button
                onClick={() => handleEditMember(openActionsMenu)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
              Edit Details
              </button>
            )}
            {onRemoveMember && (
              <button
                onClick={() => handleRemoveMember(openActionsMenu)}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
              Remove Member
              </button>
            )}
          </div>,
          document.body
      )}
    </div>
  );
};
