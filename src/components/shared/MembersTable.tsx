import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { MoreVertical, ChevronsUpDown, Search, Edit, Trash2 } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { AccessRole } from './AccessRoleSelector';
import { useUserRolesAndAccess } from '../../hooks/useApi';
import { getInitials } from '../../utils/helpers';
import { formatCreatedDate, formatRelativeLastActive, getAvatarColor, getRolePillStyle } from './userTableUtils';
import { AccessDetailsRow } from './table/AccessDetailsRow';
import { TablePagination } from './table/TablePagination';
import { RoleFilterDropdown } from './table/RoleFilterDropdown';
import { getAccessRoleDisplayName, roleFilterOptions } from './table/roleDisplay';

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
  roles?: Array<{
    id: string;
    name: string;
    scope_level: string;
    scope_id?: string;
    scope_type?: string;
    access_member_id?: string;
    role_id?: string;
    description?: string;
    priority?: number;
  }> | string; // Can be array of role objects or legacy string format
}

type RoleScopeLevel = 'system' | 'workspace' | 'base';

interface Role {
  scope_level: RoleScopeLevel;
  name: string;
}

const roleDisplayNames: Record<RoleScopeLevel, Record<string, string>> = {
  system: {
    owner: 'Owner',
    'co-owner': 'Co-owner',
  },
  workspace: {
    maintainer: 'Workspace Maintainer',
    'workspace-read': 'Workspace Read Only',
    'workspace_read': 'Workspace Read Only',
    'base-member': 'Base Member',
    'base_member': 'Base Member',
    'base-read': 'Base Read Only',
    'base_read': 'Base Read Only',
  },
  base: {
    'base-member': 'Base Member',
    'base_member': 'Base Member',
    'base-read': 'Base Read Only',
    'base_read': 'Base Read Only',
  },
};

interface MembersTableProps {
  members: Member[];
  onRemoveMember?: (memberId: string) => void;
  onEditMember?: (memberId: string) => void;
  showSearch?: boolean;
  headerActions?: React.ReactNode;
  workspaceId?: string;
}

const formatCreatedTime = (createdTime?: string) => formatCreatedDate(createdTime);
const formatLastActive = (lastActiveAt?: string, lastLoginAt?: string) => formatRelativeLastActive(lastActiveAt, lastLoginAt);

// Helper function to extract roles from getUserRolesAndAccess API response
// Response structure: [{ workspace_name, access, bases: [{ base_name, access }] }]
const extractRolesFromAccessData = (workspaces: Array<{
  workspace_id?: string;
  workspace_name: string;
  access: string;
  bases?: Array<{
    base_id?: string;
    base_name?: string;
    access?: string;
  }>;
}>): string[] => {
  const roles: string[] = [];

  if (!Array.isArray(workspaces)) return roles;

  workspaces.forEach(ws => {
    // If workspace has access (e.g., "maintainer"), show workspace-level role
    if (ws.access && ws.access.trim() !== '') {
      if (ws.access === 'maintainer') {
        roles.push('Workspace Maintainer');
      } else if (ws.access === 'workspace-read') {
        roles.push('Workspace Read Only');
      } else {
        // Capitalize first letter
        roles.push(ws.access.charAt(0).toUpperCase() + ws.access.slice(1));
      }
    }

    // If workspace access is empty but has bases, show base-level access
    // OR if workspace has access but also has bases, show base-level access too
    if (ws.bases && ws.bases.length > 0) {
      ws.bases.forEach(base => {
        const baseAccess = base.access || '';
        if (baseAccess === 'base-member') {
          roles.push('Base Member');
        } else if (baseAccess === 'base-read') {
          roles.push('Base Read Only');
        } else if (baseAccess) {
          // Capitalize first letter
          roles.push(baseAccess.charAt(0).toUpperCase() + baseAccess.slice(1));
        }
      });
    }
  });

  return [...new Set(roles)]; // Remove duplicates
};

// Role calculation utility - same logic as UserTable
const getOverallRoles = (member: Member, rolesAndAccessData?: Array<{
  workspace_id?: string;
  workspace_name: string;
  access: string;
  bases?: Array<{
    base_id?: string;
    base_name?: string;
    access?: string;
  }>;
}>): string[] => {
  const roles: string[] = [];

  // PRIORITY 1: Extract from getUserRolesAndAccess API response if available
  if (rolesAndAccessData && Array.isArray(rolesAndAccessData)) {
    const extractedRoles = extractRolesFromAccessData(rolesAndAccessData);
    if (extractedRoles.length > 0) {
      return extractedRoles;
    }
  }

  // PRIORITY 2: Extract roles from roles array (same as UserTable logic)
  if (Array.isArray(member.roles)) {
    member.roles.forEach((role) => {
      const { scope_level, name } = role as Role;
      const displayName = roleDisplayNames[scope_level]?.[name];

      if (displayName) {
        roles.push(displayName);
      } else {
        // Capitalize first letter of role name if no specific display name is found
        roles.push(name.charAt(0).toUpperCase() + name.slice(1));
      }
    });
  } else if (typeof member.roles === 'string') {
    // Legacy format support
    if (member.roles === 'owner') {
      roles.push('Owner');
    }
  }


  // Fallback: if no roles found, use role field
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


// Component to fetch and display roles for a member
const MemberRoleCell: React.FC<{
  member: Member;
  onExpand: () => void;
  isExpanded: boolean;
  workspaceId?: string;
}> = ({ member, onExpand, isExpanded, workspaceId }) => {
  // Fetch rolesAndAccess data to extract roles from API response structure
  // Pass workspaceId as scopeId to filter workspace-related roles
  const { data: rolesAndAccessData } = useUserRolesAndAccess(member.userId, workspaceId);
  const roles = getOverallRoles(member, rolesAndAccessData);
  const isOwnerOrCoOwner = roles.some(role =>
    role.toLowerCase().includes('owner') || role.toLowerCase().includes('co-owner')
  );

  return (
    <div className="flex flex-col gap-1.5 min-w-48">
      <div className="flex flex-wrap gap-1.5">
        {roles.map((role, idx) => (
          <span
            key={role + idx}
            className={`inline-block px-2 py-0.5 rounded-xl text-xs font-medium ${getRolePillStyle(role)}`}
          >
            {role}
          </span>
        ))}
      </div>
      {!isOwnerOrCoOwner && (
        <button
          onClick={onExpand}
          className="text-xs text-primary hover:underline self-start"
        >
          {isExpanded ? 'Collapse ↑' : 'View in detail ↓'}
        </button>
      )}
    </div>
  );
};

// Expandable Row Component for Access Details
const AccessDetailsRowWrapper: React.FC<{
  userId: string;
  colSpan: number;
  workspaceId?: string;
}> = ({ userId, colSpan, workspaceId }) => {
  // Pass workspaceId as scopeId to filter workspace-related roles
  const { data: rolesAndAccess, isLoading, error } = useUserRolesAndAccess(userId, workspaceId);

  // Response structure: [{ workspace_name, access, bases: [] }]
  const workspaces = Array.isArray(rolesAndAccess) ? rolesAndAccess : [];

  return (
    <AccessDetailsRow
      colSpan={colSpan}
      isLoading={isLoading}
      error={error}
      workspaces={workspaces}
      errorText="Failed to load access details"
      emptyText="No workspace access"
      getRoleDisplayName={getAccessRoleDisplayName}
    />
  );
};

export const MembersTable: React.FC<MembersTableProps> = ({
  members,
  onRemoveMember,
  onEditMember,
  showSearch = true,
  headerActions,
  workspaceId
}) => {

  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<'name' | 'role' | 'date' | 'lastActive' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [openActionsMenu, setOpenActionsMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);
  const itemsPerPage = 10;
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const actionButtonRefs = useRef<Record<string, HTMLButtonElement>>({});

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

  // Available roles for filtering
  const availableRoles = roleFilterOptions;

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
                <RoleFilterDropdown
                  label="Filter"
                  selectedRole={selectedRoleFilter}
                  roles={availableRoles}
                  dropdownWidth={256}
                  onChange={setSelectedRoleFilter}
                />
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
                  <td colSpan={4 + (onRemoveMember || onEditMember ? 1 : 0)} className="px-6 py-12 text-center">
                    {filteredMembers.length === 0 && members.length > 0 && selectedRoleFilter ? (
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-sm text-gray-500">No members found with the role</p>
                        <p className="text-sm font-medium text-gray-700">"{selectedRoleFilter}"</p>
                        <button
                          onClick={() => setSelectedRoleFilter(null)}
                          className="text-gray-400 hover:underline mt-1"
                        >
                          Clear filter
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No members found</p>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => {
                  const avatarColor = getAvatarColor(member.userId);
                  const initials = getInitials(member.name);
                  const isExpanded = expandedMembers.has(member.id);

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
                              <div className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center text-white text-sm`}>
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
                          <MemberRoleCell
                            member={member}
                            onExpand={() => handleExpand(member.id)}
                            isExpanded={isExpanded}
                            workspaceId={workspaceId}
                          />
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
                        <AccessDetailsRowWrapper
                          userId={member.userId}
                          colSpan={4 + (onRemoveMember || onEditMember ? 1 : 0)}
                          workspaceId={workspaceId}
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
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

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
              Manage Role
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
