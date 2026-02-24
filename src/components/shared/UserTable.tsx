import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { MoreVertical, Search, ChevronsUpDown, UserX, UserCheck, Trash2, Edit } from 'lucide-react';
import { useUserRole } from '../../hooks/useUserRole';
import { useUserRolesAndAccess } from '../../hooks/useApi';
import { formatCreatedDate, formatRelativeLastActive, getAvatarColor, getRolePillStyle } from './userTableUtils';
import { AccessDetailsRow } from './table/AccessDetailsRow';
import { TablePagination } from './table/TablePagination';
import { RoleFilterDropdown } from './table/RoleFilterDropdown';
import { getAccessRoleDisplayName, roleFilterOptions } from './table/roleDisplay';
import { timeZoneOptions } from '../../types/constants';

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
  last_active_at?: string;
  created_at?: string;
  created_time?: string;
  roles: Array<{
    id: string;
    name: string;
    scope_level: string;
    access_member_id?: string;
    role_id?: string;
    description?: string;
    priority?: number;
  }> | string; // Can be array of role objects or legacy string format
  activity_data?: {
    last_updated_at?: string;
    last_workspace_id?: string;
    last_base_id?: string;
    login_sessions?: Array<{
      browser: string;
      browser_version?: string;
      device_memory?: number;
      device_type?: string;
      language: string;
      login_at: string;
      os?: string;
      timezone: string;
    }>;
  };
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
      return { text: 'Deactivated', color: 'bg-red-500 text-primary' };
    default:
      return { text: status || 'Active', color: 'bg-blue-100 text-blue-700' };
  }
};


const formatTimeZoneLabel = (tz: { label: string; country: string }, includeCountry: boolean) => {
  if (!includeCountry) return tz.label;
  return tz.country ? `${tz.label} (${tz.country})` : tz.label;
};

const getLocaleCountryName = (locale?: string) => {
  if (!locale) return '';
  const parts = locale.split(/[-_]/);
  if (parts.length < 2) return '';
  const region = parts[1]?.toUpperCase();
  if (!region) return '';

  try {
    if (typeof Intl !== 'undefined' && 'DisplayNames' in Intl) {
      // Use English display name to match timeZoneOptions country names.
      const display = new Intl.DisplayNames(['en'], { type: 'region' });
      return display.of(region) || '';
    }
  } catch {
    return '';
  }

  return '';
};

const getTimezoneName = (timezone: string, activityData?: TenantUser['activity_data'], locale?: string): string => {
  if (!timezone || timezone.trim() === '') {
    return '-';
  }

  // If timezone is already an IANA label, prefer exact label match.
  if (timezone.includes('/')) {
    const tzByLabel = timeZoneOptions.find(tz => tz.label === timezone);
    return tzByLabel ? tzByLabel.label : timezone;
  }

  const matches = timeZoneOptions.filter(tz => tz.value === timezone);
  if (matches.length === 1) {
    return matches[0].label;
  }

  const loginTimeZone = activityData?.login_sessions?.[0]?.timezone;
  if (loginTimeZone) {
    const tzByLogin = matches.find(tz => tz.label === loginTimeZone);
    if (tzByLogin) return formatTimeZoneLabel(tzByLogin, true);
  }

  const localeCountry = getLocaleCountryName(locale);
  if (localeCountry) {
    const tzByCountry = matches.find(tz => tz.country.toLowerCase() === localeCountry.toLowerCase());
    if (tzByCountry) return formatTimeZoneLabel(tzByCountry, true);
  }

  return matches.length > 0 ? formatTimeZoneLabel(matches[0], true) : timezone;
};

const formatCreatedTime = (createdTime?: string) => formatCreatedDate(createdTime);

const formatLastActive = (lastActiveAt?: string, lastLoginAt?: string, activityData?: TenantUser['activity_data']) => {
  return formatRelativeLastActive(lastActiveAt, lastLoginAt, activityData?.last_updated_at);
};

const getAvatarInitials = (firstName: string, lastName: string) => {
  const first = (firstName?.[0] || '').toUpperCase();
  const last = (lastName?.[0] || '').toUpperCase();
  return first + last || 'U';
};

// Language mapping utility
const localeToLanguage: Record<string, string> = {
  'en': 'English',
  'ja': 'Japanese',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'zh': 'Chinese',
  'en-IN': 'English',
  'en-US': 'English',
  'en-GB': 'English',
};

const getLanguageDisplay = (locale: string, activityData?: TenantUser['activity_data']): string => {
  // First try to get language from login_sessions
  if (activityData?.login_sessions && activityData.login_sessions.length > 0) {
    const language = activityData.login_sessions[0].language;
    if (language) {
      // Extract language code (e.g., "en-IN" -> "en")
      const langCode = language.split('-')[0];
      return localeToLanguage[langCode] || localeToLanguage[language] || language || '-';
    }
  }

  // Fallback to locale
  if (!locale) return '-';
  return localeToLanguage[locale] || locale || '-';
};

const matchesSearchTerm = (user: TenantUser, term: string) => {
  const lowered = term.toLowerCase();
  return (
    user.display_name?.toLowerCase().includes(lowered) ||
    user.email?.toLowerCase().includes(lowered) ||
    user.first_name?.toLowerCase().includes(lowered) ||
    user.last_name?.toLowerCase().includes(lowered)
  );
};

const matchesRoleFilter = (user: TenantUser, roleFilter: string) => {
  const roles = getOverallRoles(user);
  return roles.some(role => role.toLowerCase() === roleFilter.toLowerCase());
};

const getSortValue = (user: TenantUser, sortColumn: 'name' | 'role' | 'status' | 'joinedDate' | 'lastActive' | 'language' | 'timezone') => {
  switch (sortColumn) {
    case 'name':
      return (user.display_name || `${user.first_name} ${user.last_name}`).toLowerCase();
    case 'role':
      if (Array.isArray(user.roles) && user.roles.length > 0) {
        return user.roles[0].name?.toLowerCase() || '';
      }
      return (typeof user.roles === 'string' ? user.roles : '').toLowerCase();
    case 'status':
      return user.status?.toLowerCase() || '';
    case 'joinedDate':
      return (user.created_time || user.created_at) ? new Date(user.created_time || user.created_at || '').getTime() : 0;
    case 'lastActive':
      return (user.last_active_at || user.last_login_at) ? new Date(user.last_active_at || user.last_login_at || '').getTime() : 0;
    case 'language':
      return getLanguageDisplay(user.locale, user.activity_data).toLowerCase();
    case 'timezone':
      return getTimezoneName(user.timezone, user.activity_data, user.locale)?.toLowerCase() || '';
    default:
      return '';
  }
};

// Role calculation utility
const getOverallRoles = (user: TenantUser): string[] => {
  const roles: string[] = [];

  const capitalize = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);
  const normalizeRole = (name: string) => name.replace('_', '-');

  const SYSTEM_ROLE_MAP: Record<string, string> = {
    owner: 'Owner',
    'co-owner': 'Co-owner',
  };
  const WORKSPACE_ROLE_MAP: Record<string, string> = {
    maintainer: 'Workspace Maintainer',
    'workspace-read': 'Workspace Read Only',
    'base-member': 'Base Member',
    'base-read': 'Base Read Only',
  };
  const BASE_ROLE_MAP: Record<string, string> = {
    'base-member': 'Base Member',
    'base-read': 'Base Read Only',
  };

  const ROLE_MAP_BY_SCOPE: Record<string, Record<string, string>> = {
    system: SYSTEM_ROLE_MAP,
    workspace: WORKSPACE_ROLE_MAP,
    base: BASE_ROLE_MAP,
  };

  const getDisplayRole = (scope: string, name: string) => {
    const normalized = normalizeRole(name);
    const mapping = ROLE_MAP_BY_SCOPE[scope];
    if (!mapping) return '';
    return mapping[normalized] || capitalize(name);
  };

  // Extract roles from roles array (same logic as MembersTable)
  if (Array.isArray(user.roles)) {
    user.roles.forEach(role => {
      const displayRole = getDisplayRole(role.scope_level, role.name);
      if (displayRole) {
        roles.push(displayRole);
      }
    });
  } else if (typeof user.roles === 'string') {
    // Legacy format support
    if (user.roles === 'owner') {
      roles.push('Owner');
    }
  }

  // Fallback: if no roles found, use tenant role
  if (roles.length === 0) {
    if (Array.isArray(user.roles) && user.roles.length > 0) {
      const firstRole = user.roles[0];
      roles.push(firstRole.name === 'owner' ? 'Owner' : capitalize(firstRole.name));
    } else {
      roles.push(user.roles === 'owner' ? 'Owner' : 'User');
    }
  }

  return [...new Set(roles)]; // Remove duplicates
};

// Expandable Row Component for Access Details
const AccessDetailsRowWrapper: React.FC<{
  userId: string;
  colSpan: number;
}> = ({ userId, colSpan }) => {
  const { data: rolesAndAccess, isLoading, error } = useUserRolesAndAccess(userId);

  // Handle the getUserRolesAndAccess API response structure
  const workspaces = Array.isArray(rolesAndAccess) ? rolesAndAccess : [];

  return (
    <AccessDetailsRow
      colSpan={colSpan}
      isLoading={isLoading}
      error={error}
      workspaces={workspaces}
      errorText="Access details not available"
      emptyText="No workspace access"
      getRoleDisplayName={getAccessRoleDisplayName}
    />
  );
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
  const { isAdmin, isOwner, isCoOwner } = useUserRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<'name' | 'role' | 'status' | 'joinedDate' | 'lastActive' | 'language' | 'timezone' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);
  const itemsPerPage = 10;
  const actionButtonRefs = useRef<Record<string, HTMLButtonElement>>({});
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = users.filter(user => matchesSearchTerm(user, searchTerm));
    }

    if (selectedRoleFilter) {
      filtered = filtered.filter(user => matchesRoleFilter(user, selectedRoleFilter));
    }

    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = getSortValue(a, sortColumn);
        const bVal = getSortValue(b, sortColumn);

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [users, searchTerm, selectedRoleFilter, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, currentPage]);

  const handleSort = (column: 'name' | 'role' | 'status' | 'joinedDate' | 'lastActive' | 'language' | 'timezone') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleExpand = (userId: string) => {
    setExpandedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
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

      const menuWidth = menuRef.current?.offsetWidth || 192;

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
      const estimatedHeight = menuRef.current?.offsetHeight || 100;

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

  // Available roles for filtering
  const availableRoles = roleFilterOptions;

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRoleFilter, searchTerm]);

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
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-primary">Users</h2>
          <div className="flex items-center gap-3">
            {showSearch && (
              <>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-xs pl-9 pr-4 py-2 h-10 border rounded-xl text-primary focus:border-primary placeholder:text-gray-400 bg-background outline-none transition-all"
                  />
                </div>
                <RoleFilterDropdown
                  label="Filter by Role"
                  selectedRole={selectedRoleFilter}
                  roles={availableRoles}
                  dropdownWidth={220}
                  closeOnEscape={true}
                  menuRole="menu"
                  menuTabIndex={-1}
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
        <div className="max-h-[calc(100vh-170px)] overflow-y-auto">
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
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-2 text-xs text-gray-700 font-semibold hover:text-gray-900"
                  >
                    Status
                    <ChevronsUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('joinedDate')}
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
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('language')}
                    className="flex items-center gap-2 text-xs text-gray-700 font-semibold hover:text-gray-900"
                  >
                    Language
                    <ChevronsUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('timezone')}
                    className="flex items-center gap-2 text-xs text-gray-700 font-semibold hover:text-gray-900"
                  >
                    Timezone
                    <ChevronsUpDown className="w-3 h-3" />
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
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6 + (onRemoveUser || onEditUser || onActivateUser || onDeactivateUser ? 1 : 0)} className="px-6 py-12 text-center">
                    {filteredUsers.length === 0 && users.length > 0 && selectedRoleFilter ? (
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-sm text-gray-500">No users found with the role</p>
                        <p className="text-sm font-medium text-gray-700">"{selectedRoleFilter}"</p>
                        <button
                          onClick={() => setSelectedRoleFilter(null)}
                          className="text-xs text-primary hover:underline mt-1"
                        >
                          Clear filter
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No users found</p>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const statusBadge = getStatusBadge(user.status, user.email_verified);
                  const avatarColor = getAvatarColor(user.id);
                  const avatarInitials = getAvatarInitials(user.first_name, user.last_name);
                  const isExpanded = expandedUsers.has(user.id);
                  // Get roles - for now use tenant role, will be enhanced with access details
                  const roles = getOverallRoles(user);
                  // Check if user is owner or co-owner - hide "View in detail" for these roles
                  const isOwnerOrCoOwner = roles.some(role =>
                    role.toLowerCase().includes('owner') || role.toLowerCase().includes('co-owner')
                  );

                  return (
                    <React.Fragment key={user.id}>
                      <tr className="bg-card hover:bg-gray-50 transition-colors">
                        {/* User Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {user.avatar ? (
                              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                                <img
                                  src={user.avatar}
                                  alt={`${user.first_name} ${user.last_name}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center text-white text-sm font-semibold`}>
                                {avatarInitials}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{`${user.first_name} ${user.last_name}`}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5 min-w-48">
                            <div className="flex flex-wrap gap-1.5">
                              {roles.map((role) => (
                                <span
                                  key={`${user.id}-${role}`}
                                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getRolePillStyle(role)}`}
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                            {!isOwnerOrCoOwner && (
                              <button
                                onClick={() => handleExpand(user.id)}
                                className="text-xs text-primary hover:underline self-start"
                              >
                                {isExpanded ? 'Collapse ↑' : 'View in detail ↓'}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                            {statusBadge.text}
                          </span>
                        </td>

                        {/* Joined Date */}
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 min-w-48">{formatCreatedTime(user.created_time || user.created_at)}</p>
                        </td>

                        {/* Last Active */}
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 min-w-48">{formatLastActive(user.last_active_at, user.last_login_at, user.activity_data)}</p>
                        </td>

                        {/* Language */}
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 min-w-48">{getLanguageDisplay(user.locale, user.activity_data)}</p>
                        </td>

                        {/* Timezone */}
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 min-w-48">{getTimezoneName(user.timezone, user.activity_data, user.locale)}</p>
                        </td>

                        {/* Actions */}
                        {(() => {
                          // Check if user is Owner or Co-owner
                          const roles = getOverallRoles(user);
                          const userIsOwner = roles.some(role =>
                            role.toLowerCase() === 'owner'
                          );
                          const userIsCoOwner = roles.some(role =>
                            role.toLowerCase() === 'co-owner'
                          );

                          // Co-owner cannot see action button for Owner users or other Co-owners
                          if (isCoOwner() && (userIsOwner || userIsCoOwner)) {
                            return null;
                          }

                          // Show action button if there are any actions available
                          if (onRemoveUser || onEditUser || onActivateUser || onDeactivateUser) {
                            return (
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
                            );
                          }
                          return null;
                        })()}
                      </tr>

                      {/* Expanded Access Details Row */}
                      {isExpanded && (
                        <AccessDetailsRowWrapper
                          userId={user.id}
                          colSpan={7 + (onRemoveUser || onEditUser || onActivateUser || onDeactivateUser ? 1 : 0)}
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
          {/* Edit Details */}
          {onEditUser && (
            <button
              onClick={() => {
                const user = paginatedUsers.find(u => u.id === openActionMenu);
                if (user) onEditUser(user);
                setOpenActionMenu(null);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl flex items-center gap-2"
            >
              <Edit className="w-4 h-4 text-gray-500" />
              Edit
            </button>
          )}
          {/* Activate/Deactivate user - Admin only, but not for Owner or Co-owner */}
          {isAdmin() && (() => {
            const user = paginatedUsers.find(u => u.id === openActionMenu);
            if (!user) return null;


            // Determine target user's roles
            const roles = getOverallRoles(user);
            const targetIsOwner = roles.some(role => role.toLowerCase() === 'owner');
            const targetIsCoOwner = roles.some(role => role.toLowerCase() === 'co-owner');

            // Only Owner can deactivate Co-owner; nobody can deactivate Owner
            if (targetIsOwner) {
              return null;
            }
            // Co-owner cannot deactivate another co-owner
            if (targetIsCoOwner && !isOwner()) {
              return null;
            }

            const status = user.status?.toLowerCase();
            const isActive = status === 'active' && user.email_verified;
            const isDeactivated = status === 'deactivated';

            if (isActive && onDeactivateUser) {
              return (
                <button
                  onClick={() => {
                    onDeactivateUser(openActionMenu);
                    setOpenActionMenu(null);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2"
                >
                  <UserX className="w-4 h-4" />
                  Deactivate User
                </button>
              );
            } else if (isDeactivated && onActivateUser) {
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
          {/* Remove Member - Only show when status is pending, and Co-owner can't delete Owner */}
          {onRemoveUser && (() => {
            const user = paginatedUsers.find(u => u.id === openActionMenu);
            if (!user) return null;

            const isPending = user.status?.toLowerCase() === 'pending';
            if (!isPending) return null;

            // Check if current user is Co-owner and target user is Owner
            const userRoles = getOverallRoles(user);
            const targetUserIsOwner = userRoles.some(role => role.toLowerCase() === 'owner');

            // Co-owner cannot delete Owner (but Owner can delete anyone)
            if (!isOwner() && targetUserIsOwner) {
              return null;
            }

            return (
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
            );
          })()}
        </div>,
        document.body
      )}

    </div>
  );
};
