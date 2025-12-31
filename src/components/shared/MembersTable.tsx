import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import ReactDOM, { createPortal } from 'react-dom';
import { MoreVertical, ChevronsUpDown, Search, Edit, Trash2, Filter, Loader2 } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { AccessRoleSelector, AccessRole, RoleConfig } from './AccessRoleSelector';
import { useUserRolesAndAccess } from '../../hooks/useApi';

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
  workspaceId?: string; // Optional workspaceId to pass as scopeId for getUserRolesAndAccess
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
    member.roles.forEach(role => {
      // Map role names to display names based on scope_level
      if (role.scope_level === 'system') {
        // System-level roles (owner, co-owner)
        if (role.name === 'owner') {
          roles.push('Owner');
        } else if (role.name === 'co-owner') {
    roles.push('Co-owner');
        } else {
          // Capitalize first letter of role name
          roles.push(role.name.charAt(0).toUpperCase() + role.name.slice(1));
        }
      } else if (role.scope_level === 'workspace') {
        // Workspace-level roles
        if (role.name === 'maintainer') {
    roles.push('Workspace Maintainer');
        } else if (role.name === 'workspace-read' || role.name === 'workspace_read') {
          roles.push('Workspace Read Only');
        } else if (role.name === 'base-member' || role.name === 'base_member') {
          // When workspace access is empty but has bases, show base-level access
          roles.push('Base Member');
        } else if (role.name === 'base-read' || role.name === 'base_read') {
          // When workspace access is empty but has bases, show base-level access
          roles.push('Base Read Only');
        } else {
          // Capitalize first letter of role name
          roles.push(role.name.charAt(0).toUpperCase() + role.name.slice(1));
        }
      } else if (role.scope_level === 'base') {
        // Base-level roles (when workspace access is empty but bases exist)
        if (role.name === 'base-member' || role.name === 'base_member') {
          roles.push('Base Member');
        } else if (role.name === 'base-read' || role.name === 'base_read') {
          roles.push('Base Read Only');
        } else {
          // Capitalize first letter of role name
          roles.push(role.name.charAt(0).toUpperCase() + role.name.slice(1));
        }
      }
    });
  } else if (typeof member.roles === 'string') {
    // Legacy format support
    if (member.roles === 'owner') {
      roles.push('Owner');
    }
  }

  // Fallback: if no roles found, use access_level or role field
  if (roles.length === 0) {
    if (member.access_level === 'full_access') {
      roles.push('Co-owner');
    } else if (member.access_level === 'limited_access') {
      roles.push('Workspace Maintainer');
    } else if (member.role === 'owner') {
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
    return 'bg-gray-100 text-gray-700 border border';
  }
  return 'bg-gray-100 text-gray-700 border border';
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

  return (
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
        onClick={onExpand}
        className="text-xs text-primary hover:underline self-start"
      >
        {isExpanded ? 'Collapse ↑' : 'View in detail ↓'}
      </button>
    </div>
  );
};

// Expandable Row Component for Access Details
const AccessDetailsRow: React.FC<{
  userId: string;
  colSpan: number;
  workspaceId?: string;
}> = ({ userId, colSpan, workspaceId }) => {
  // Pass workspaceId as scopeId to filter workspace-related roles
  const { data: rolesAndAccess, isLoading, error } = useUserRolesAndAccess(userId, workspaceId);

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

  // Handle the getUserRolesAndAccess API response structure
  // The hook already extracts result?.data, so rolesAndAccess is the array directly
  // Response structure: [{ workspace_name, access, bases: [] }]
  const workspaces = Array.isArray(rolesAndAccess) ? rolesAndAccess : [];

  if (!workspaces || workspaces.length === 0) {
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

  // Helper function to format role display name
  const getRoleDisplayName = (access: string): string => {
    switch (access) {
      case 'maintainer':
        return 'Workspace Maintainer';
      case 'workspace-read':
        return 'Workspace Read Only';
      case 'base-member':
        return 'Base Member';
      case 'base-read':
        return 'Base Read Only';
      default:
        return access || 'User';
    }
  };

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
              {workspaces.map((ws: { workspace_id?: string; workspace_name: string; access: string; bases?: Array<{ base_id?: string; base_name?: string; access?: string }> }, wsIndex: number) => {
                const baseCount = ws.bases?.length || 0;
                const workspaceRole = ws.access || '';

                if (baseCount === 0) {
                  return (
                    <tr key={wsIndex} className="bg-background">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{ws.workspace_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">-</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRolePillStyle(getRoleDisplayName(workspaceRole))}`}>
                          {getRoleDisplayName(workspaceRole)}
                        </span>
                      </td>
                    </tr>
                  );
                }
                return ws.bases?.map((base: { base_id?: string; base_name?: string; access?: string }, baseIndex: number) => {
                  const baseRole = base.access || '';
                  const baseName = base.base_name || `Base ${base.base_id || baseIndex + 1}`;
                  return (
                    <tr key={`${wsIndex}-${baseIndex}`} className="bg-background">
                    {baseIndex === 0 && (
                      <td rowSpan={baseCount} className="px-4 py-3 text-sm text-gray-900 font-medium align-top border-r">
                          {ws.workspace_name}
                      </td>
                    )}
                      <td className="px-4 py-3 text-sm text-gray-700">{baseName}</td>
                    <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRolePillStyle(getRoleDisplayName(baseRole))}`}>
                          {getRoleDisplayName(baseRole)}
                      </span>
                    </td>
                  </tr>
                  );
                });
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
  headerActions,
  workspaceId
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
  const [roleFilterPosition, setRoleFilterPosition] = useState<{
    top?: number;
    bottom?: number;
    right?: number;
    left?: number;
    width: number;
    position: 'above' | 'below';
  } | null>(null);
  const itemsPerPage = 10;
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const actionButtonRefs = useRef<Record<string, HTMLButtonElement>>({});
  const roleFilterRef = useRef<HTMLDivElement>(null);
  const roleFilterButtonRef = useRef<HTMLButtonElement>(null);
  const roleFilterMenuRef = useRef<HTMLDivElement>(null);

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

  // Calculate role filter dropdown position
  const calculateRoleFilterPosition = useCallback(() => {
    if (!roleFilterButtonRef.current) return null;

    const rect = roleFilterButtonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dropdownMinHeight = 200;
    const dropdownWidth = 256; // w-64 = 256px

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Determine if we should open above or below
    let position: 'above' | 'below' = 'below';
    if (spaceBelow < dropdownMinHeight && spaceAbove > spaceBelow) {
      position = 'above';
    }

    // Calculate right position (align to right edge of trigger)
    let right = viewportWidth - rect.right;
    if (right < 10) {
      right = 10;
    }
    if (right + dropdownWidth > viewportWidth - 10) {
      right = viewportWidth - dropdownWidth - 10;
    }

    return {
      top: position === 'below' ? rect.bottom + 8 : undefined,
      bottom: position === 'above' ? viewportHeight - rect.top + 8 : undefined,
      right,
      width: dropdownWidth,
      position
    };
  }, []);

  // Update position when dropdown opens
  useEffect(() => {
    if (isRoleFilterOpen) {
      const position = calculateRoleFilterPosition();
      setRoleFilterPosition(position);
    } else {
      setRoleFilterPosition(null);
    }
  }, [isRoleFilterOpen, calculateRoleFilterPosition]);

  // Close role filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedElement = event.target as HTMLElement;

      // Don't close if clicking inside this dropdown's trigger or menu
      if (
        (roleFilterButtonRef.current && roleFilterButtonRef.current.contains(target)) ||
        (roleFilterMenuRef.current && roleFilterMenuRef.current.contains(target))
      ) {
        return;
      }

      // Don't close if clicking on another dropdown trigger or menu
      if (clickedElement) {
        const clickedTrigger = clickedElement.closest('[data-dropdown-trigger="role-filter"]');
        if (clickedTrigger && clickedTrigger !== roleFilterButtonRef.current) {
          return;
        }

        const clickedMenu = clickedElement.closest('[data-dropdown-menu="role-filter"]');
        if (clickedMenu && clickedMenu !== roleFilterMenuRef.current) {
          return;
        }
      }

      // Close this dropdown if clicking outside
      if (isRoleFilterOpen) {
        setIsRoleFilterOpen(false);
      }
    };

    if (isRoleFilterOpen) {
      const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      }, 0);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsRoleFilterOpen(!isRoleFilterOpen);
                    }}
                    className={`px-4 py-2 text-sm border rounded-xl flex items-center gap-2 transition-colors ${selectedRoleFilter
                        ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                        : 'border text-gray-700 hover:bg-gray-50'
                    }`}
                    data-dropdown-trigger="role-filter"
                  >
                    <Filter className="w-4 h-4" />
                    Filter
                    {/* {selectedRoleFilter && (
                      <span className="ml-1 px-1.5 py-0.5 bg-blue-200 text-blue-800 rounded text-xs">
                        {selectedRoleFilter}
                      </span>
                    )} */}
                  </button>

                  {/* Role Filter Dropdown - Portal to prevent cropping */}
                  {isRoleFilterOpen && roleFilterPosition && createPortal(
                    <div
                      ref={roleFilterMenuRef}
                      data-dropdown-menu="role-filter"
                      className="fixed z-[9999] bg-card border rounded-xl shadow-lg max-h-64 overflow-y-auto"
                      style={{
                        ...(roleFilterPosition.top !== undefined && { top: `${roleFilterPosition.top}px` }),
                        ...(roleFilterPosition.bottom !== undefined && { bottom: `${roleFilterPosition.bottom}px` }),
                        ...(roleFilterPosition.right !== undefined && { right: `${roleFilterPosition.right}px` }),
                        width: `${roleFilterPosition.width}px`
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-2 space-y-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRoleFilter(null);
                            setIsRoleFilterOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-xl hover:bg-gray-100 transition-colors ${!selectedRoleFilter ? 'bg-gray-100 font-medium' : ''
                          }`}
                        >
                          All Roles
                        </button>
                        {availableRoles.map((role) => (
                          <button
                            key={role}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRoleFilter(role);
                              setIsRoleFilterOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors ${selectedRoleFilter === role ? 'bg-gray-100 font-medium' : ''
                            }`}
                          >
                            {role}
                          </button>
                        ))}
                  </div>
                    </div>,
                    document.body
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
                  <td colSpan={4 + (onRemoveMember || onEditMember ? 1 : 0)} className="px-6 py-12 text-center">
                    {filteredMembers.length === 0 && members.length > 0 && selectedRoleFilter ? (
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-sm text-gray-500">No members found with the role</p>
                        <p className="text-sm font-medium text-gray-700">"{selectedRoleFilter}"</p>
                        <button
                          onClick={() => setSelectedRoleFilter(null)}
                          className="text-xs text-primary hover:underline mt-1"
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
                        <AccessDetailsRow
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
