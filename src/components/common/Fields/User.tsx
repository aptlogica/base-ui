// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { useClickOutside } from '../../../hooks/useClickOutside';
import { useGetTenantUsers } from '../../../hooks/useApi';
import { calculateDropdownPosition } from '../../../utils/dropdownPosition';

interface UserOption {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

interface UserConfig {
  allowMultiple?: boolean;
  defaultUser?: string;
  defaultValue?: string;
  [key: string]: any;
}

type UserValue = string | string[] | null;

// Helper functions
const isArrayValue = (val: any): val is string[] => Array.isArray(val);

const normalizeToArray = (value: string | string[] | null): string[] => {
  if (!value) return [];
  if (isArrayValue(value)) return value;
  return [value];
};

const parseCommaSeparatedValue = (value: string): string[] | null => {
  const parsed = value.split(',').map(id => id.trim()).filter(id => id.length > 0);
  return parsed.length > 0 ? parsed : null;
};

const processValueForMultiple = (value: UserValue, allowMultiple: boolean): UserValue => {
  if (!allowMultiple || typeof value !== 'string' || !value.trim()) {
    return value;
  }
  return parseCommaSeparatedValue(value);
};

interface UserProps {
  value: UserValue; // Support single user ID or array of user IDs
  onChange: (value: UserValue) => void;
  config?: UserConfig;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean; // true = completely prevent editing
  isBorder?: boolean;
}

export const User: React.FC<UserProps> = ({
  value,
  onChange,
  config = {},
  placeholder = 'Select user...',
  disabled = false,
  readOnly = false,
  isBorder = false
}) => {
  const { allowMultiple = false, defaultUser, defaultValue } = config;

  // Initialize with value, then defaultValue, then defaultUser, then null
  const getInitialValue = () => {
    if (value !== null && value !== undefined) {
      return value;
    }
    if (defaultValue?.trim()) {
      return defaultValue;
    }
    if (defaultUser?.trim()) {
      return defaultUser;
    }
    return null;
  };


  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [calculatedPosition, setCalculatedPosition] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);
  const [selectedValue, setSelectedValue] = useState<UserValue>(getInitialValue());

  // Helper to get selected user IDs as array (memoized)
  const selectedUserIds = useMemo((): string[] => {
    if (!selectedValue) return [];
    if (isArrayValue(selectedValue)) return selectedValue;
    return [selectedValue];
  }, [selectedValue]);
  const [focusedUserIndex, setFocusedUserIndex] = useState<number>(-1);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement | HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const usersListRef = useRef<HTMLDivElement>(null);

  // Fetch all tenant users
  const { data: tenantUsers = [], isLoading: loading, error } = useGetTenantUsers();

  // Calculate dropdown position for portal rendering
  const getDropdownPosition = useCallback(() => {
    const trigger = buttonRef.current;
    if (!trigger) return null;

    const rect = trigger.getBoundingClientRect();
    const dropdownMinHeight = 200;
    const dropdownWidth = rect.width; // Use button width
    return calculateDropdownPosition({
      rect,
      dropdownMinHeight,
      dropdownWidth,
      offset: 8,
      sideMargin: 10
    });
  }, []);

  // Update position when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const position = getDropdownPosition();
      setCalculatedPosition(position);
    } else {
      setCalculatedPosition(null);
    }
  }, [isOpen, getDropdownPosition]);

  useClickOutside({
    isOpen,
    onClose: () => {
      setIsOpen(false);
      setSearchTerm('');
      setFocusedUserIndex(-1);
    },
    excludeRefs: [buttonRef, userDropdownRef, dropdownRef, searchRef]
  });

  // Close dropdown if readOnly becomes true
  useEffect(() => {
    if (readOnly && isOpen) {
      setIsOpen(false);
      setSearchTerm('');
      setFocusedUserIndex(-1);
    }
  }, [readOnly, isOpen]);

  // Update selected value when value or defaultValue changes
  // Handle both array format and comma-separated string format (for allowMultiple)
  useEffect(() => {
    let processedValue: UserValue = null;

    if (value !== null && value !== undefined) {
      processedValue = processValueForMultiple(value, allowMultiple);
    } else if (defaultValue?.trim()) {
      processedValue = processValueForMultiple(defaultValue, allowMultiple);
    } else if (defaultUser?.trim()) {
      processedValue = defaultUser;
    }

    setSelectedValue(processedValue);
  }, [value, defaultValue, defaultUser, allowMultiple]);

  // Transform ALL tenant users to UserOption format (for displaying selected users, including deactivated)
  const allUsers: UserOption[] = useMemo(() => {
    return (tenantUsers).map((user: any) => {
      const displayName = user.display_name ||
        `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
        user.email ||
        'Unknown User';

      return {
        id: user.id,
        name: displayName,
        email: user.email || undefined,
        avatarUrl: user.avatar || undefined
      };
    });
  }, [tenantUsers]);

  // Transform only ACTIVE tenant users to UserOption format (for dropdown selection)
  const activeUsers: UserOption[] = useMemo(() => {
    return (tenantUsers)
      .filter((user: any) => {
        // Only include active users (status === 'active' && email_verified === true)
        return user.status?.toLowerCase() === 'active' && user.email_verified === true;
      })
      .map((user: any) => {
        const displayName = user.display_name ||
          `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
          user.email ||
          'Unknown User';

        return {
          id: user.id,
          name: displayName,
          email: user.email || undefined,
          avatarUrl: user.avatar || undefined
        };
      });
  }, [tenantUsers]);

  // Filter active users based on search term (for dropdown)
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return activeUsers;
    const lowerSearch = searchTerm.toLowerCase();
    return activeUsers.filter(user =>
      user.name.toLowerCase().includes(lowerSearch) ||
      user.id.toLowerCase().includes(lowerSearch)
    );
  }, [activeUsers, searchTerm]);

  const handleSelect = useCallback((user: UserOption) => {
    if (readOnly) return;
    if (allowMultiple) {
      setSelectedValue(prev => {
        const currentSelected = normalizeToArray(prev);
        const newSelected = currentSelected.includes(user.id)
          ? currentSelected.filter(id => id !== user.id)
          : [...currentSelected, user.id];
        // Ensure we always pass an array for multiple selection
        const finalValue = newSelected.length > 0 ? newSelected : null;
        onChange(finalValue);
        return finalValue;
      });
    } else {
      // For single selection, toggle: if already selected, deselect; otherwise select
      const isCurrentlySelected = selectedUserIds.includes(user.id);
      if (isCurrentlySelected) {
        setSelectedValue(null);
        onChange(null);
      } else {
        setSelectedValue(user.id);
        onChange(user.id);
      }
      setIsOpen(false);
      setSearchTerm('');
      setFocusedUserIndex(-1);
    }
  }, [allowMultiple, onChange, selectedUserIds, readOnly]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedUserIndex(-1);
      } else if (e.key === 'Enter' && focusedUserIndex >= 0 && filteredUsers[focusedUserIndex]) {
        e.preventDefault();
        handleSelect(filteredUsers[focusedUserIndex]);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedUserIndex(prev =>
          prev < filteredUsers.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedUserIndex(prev => prev > 0 ? prev - 1 : -1);
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedUserIndex, filteredUsers, handleSelect]);

  // Scroll focused user into view
  useEffect(() => {
    if (focusedUserIndex >= 0 && usersListRef.current) {
      const userElement = usersListRef.current.children[focusedUserIndex] as HTMLElement;
      if (userElement) {
        userElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [focusedUserIndex]);

  // Helper to get user initials
  const getUserInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts.at(-1)![0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleRemoveUser = useCallback((userId: string) => {
    if (readOnly) return;
    if (allowMultiple) {
      setSelectedValue(prev => {
        const currentSelected = normalizeToArray(prev);
        const newSelected = currentSelected.filter(id => id !== userId);
        const finalValue = newSelected.length > 0 ? newSelected : null;
        onChange(finalValue);
        return finalValue;
      });
    }
  }, [allowMultiple, onChange, readOnly]);

  // Memoize selected users from ALL users (so deactivated users can still be displayed)
  const selectedUsers = useMemo(() => {
    return allUsers.filter(user => selectedUserIds.includes(user.id));
  }, [allUsers, selectedUserIds]);

  return (
    <div className={`w-full relative ${isBorder ? "field-component-border" : ""}`} ref={userDropdownRef}>
      {selectedUsers.length > 0 ? (
        <div //NOSONAR
          ref={buttonRef as unknown as React.RefObject<HTMLDivElement>}
          role="button"
          tabIndex={disabled || readOnly || loading ? -1 : 0}
          className={`w-full field-component ${disabled || readOnly ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900 cursor-pointer'}`}
          onClick={() => !disabled && !readOnly && setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (disabled || readOnly || loading) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
          aria-disabled={disabled || readOnly || loading}
        >
          <div className="flex items-center gap-1 min-w-0">
            <div className="flex items-center gap-1 overflow-hidden">
              {selectedUsers.slice(0, 3).map(user => (
                <span key={user.id} className="inline-flex items-center gap-1 bg-gray-100 text-[var(--color-text-primary)] px-2 py-1 rounded-full text-xs whitespace-nowrap flex-shrink-0 border">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                      {getUserInitials(user.name)}
                    </div>
                  )}
                  <span className="truncate">{user.name}</span>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (allowMultiple) {
                          handleRemoveUser(user.id);
                        } else {
                          setSelectedValue(null);
                          onChange(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                        }
                      }}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5 flex-shrink-0 border-0 bg-transparent cursor-pointer"
                      aria-label={`Remove ${user.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
              {selectedUsers.length > 3 && (
                <span className="inline-flex items-center bg-[var(--color-bg-brand-primary)] text-black px-2 py-1 rounded-full text-xs whitespace-nowrap flex-shrink-0 border">
                  +{selectedUsers.length - 3}
                </span>
              )}
            </div>
            {allowMultiple && selectedUsers?.length > 1 && (
              <span className="text-gray-500 text-xs flex-shrink-0 ml-1">
                ({selectedUsers.length})
              </span>
            )}
          </div>
        </div>
      ) : (
        <button
          ref={buttonRef as unknown as React.RefObject<HTMLButtonElement>}
          type="button"
          className={`w-full field-component ${disabled || readOnly ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900 cursor-pointer'}`}
          onClick={() => !disabled && !readOnly && setIsOpen(!isOpen)}
          disabled={disabled || readOnly || loading}
        >
          <span className="text-sm text-gray-500">{loading ? 'Loading users...' : placeholder}</span>
        </button>
      )}
      {/* User Dropdown Portal */}
      {!readOnly && isOpen && calculatedPosition && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] border bg-card rounded-xl shadow-xl max-h-64 w-80 overflow-hidden flex flex-col"
          style={{
            ...(calculatedPosition.top !== undefined && { top: `${calculatedPosition.top}px` }),
            ...(calculatedPosition.bottom !== undefined && { bottom: `${calculatedPosition.bottom}px` }),
            left: `${calculatedPosition.left}px`,
            width: `${calculatedPosition.width}px`
          }}
        >
          {/* Header with Search */}
          <div className="p-2 border-b bg-gray-50 flex-shrink-0">
            {/* Clear Selection Button (when users are selected) */}
            {selectedUsers.length > 0 && (
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-gray-600">
                  {selectedUsers.length} user{selectedUsers.length === 1 ? '' : 's'} selected
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    if (readOnly) return;
                    e.stopPropagation();
                    setSelectedValue(null);
                    onChange(null);
                    if (!allowMultiple) {
                      setIsOpen(false);
                    }
                  }}
                  disabled={readOnly}
                  className="text-xs text-red-600 hover:text-red-800 hover:underline"
                >
                  Clear
                </button>
              </div>
            )}
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Select user..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setFocusedUserIndex(-1);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setFocusedUserIndex(0);
                  }
                }}
                aria-label="Search users"
                className="w-full pl-8 pr-8 py-1.5 text-sm text-[var(--color-text-primary)] border rounded-xl focus:border outline-none focus:border-[--color-brand-600] bg-background"
              />
              {searchTerm && (
                <button
                  type='button'
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Users List */}
          <div
            ref={usersListRef}
            aria-label="Available users"
            className="flex-1 overflow-y-auto min-h-0"
          >
            {(() => {
              if (loading) {
                return (
                  <output className="p-3 text-center text-sm text-gray-500 block" aria-live="polite">
                    Loading users...
                  </output>
                );
              }
              if (error) {
                return (
                  <output className="p-3 text-center text-sm text-red-500 block" aria-live="polite">
                    {String(error)}
                  </output>
                );
              }
              if (filteredUsers.length === 0) {
                const message = searchTerm ? 'No users found' : 'No users available';
                return (
                  <output className="p-3 text-center text-sm text-gray-500 font-bold block" aria-live="polite">
                    {message}
                  </output>
                );
              }
              return null;
            })()}
            {!loading && !error && filteredUsers.length > 0 && (
              <>
                {filteredUsers.length > 100 && (
                  <div className="p-2 text-center text-xs text-gray-400 border-b">
                    Showing first 100 of {filteredUsers.length} users. Refine your search.
                  </div>
                )}
                {filteredUsers.slice(0, 100).map((user, index) => {
                  const isSelected = selectedUserIds.includes(user.id);
                  const isFocused = index === focusedUserIndex;

                  return (
                    <button
                      key={user.id}
                      type="button"
                      disabled={readOnly}
                      className={`w-full text-left px-3 py-2 border-b border-0 bg-transparent ${readOnly ? 'cursor-default' : 'hover:bg-gray-50 cursor-pointer'} bg-card transition-colors ${isSelected ? 'bg-blue-50 border-l-2 border-l-green-500' : ''
                        } ${isFocused ? 'bg-[var(--color-bg-brand-secondary)] text-black' : ''
                        }`}
                      onClick={() => {
                        if (readOnly) return;
                        setFocusedUserIndex(index);
                        handleSelect(user);
                      }}
                      onKeyDown={(e) => {
                        if (readOnly) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setFocusedUserIndex(index);
                          handleSelect(user);
                        }
                      }}
                      onMouseEnter={() => setFocusedUserIndex(index)}
                      aria-label={user.email ? `Select ${user.name} (${user.email})` : `Select ${user.name}`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                            {getUserInitials(user.name)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900 truncate font-medium">
                            {user.name}
                          </div>
                          {user.email && (
                            <div className="text-xs text-gray-500 truncate">
                              {user.email}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div className="flex-shrink-0 w-1.5 h-1.5 bg-[var(--color-bg-brand-primary)] rounded-full"></div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
