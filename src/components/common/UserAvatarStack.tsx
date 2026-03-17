// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState, useRef, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  avatar?: string | null;
  email?: string;
}

interface UserAvatarStackProps {
  users: User[];
  maxVisible?: number; // Default: 3
  size?: 'sm' | 'md' | 'lg'; // Avatar size
  showCount?: boolean; // Show "+N" badge if more users
  onClick?: () => void; // Optional click handler (e.g., to open modal) - if provided, dropdown won't show
  className?: string;
  showDropdown?: boolean; // Enable dropdown functioanality (default: true if no onClick)
}

export const UserAvatarStack: React.FC<UserAvatarStackProps> = ({
  users,
  maxVisible = 3,
  size = 'md',
  showCount = true,
  onClick,
  className = '',
  showDropdown = true,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Size mappings
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  // Get visible users and remaining count
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  // Helper to get initials
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts.at(-1)?.[0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Helper to get avatar color (consistent with existing pattern)
  const getAvatarColor = (userId: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-yellow-500', 'bg-red-500', 'bg-indigo-500', 'bg-cyan-500'
    ];
    const hash = userId.split('').reduce((acc, char) => {
      const codePoint = char.codePointAt(0) ?? 0;
      return acc + codePoint;
    }, 0);
    return colors[hash % colors.length];
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Position dropdown
  useEffect(() => {
    if (!isDropdownOpen || !containerRef.current || !dropdownRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const dropdown = dropdownRef.current;

    // Position dropdown below the stack, aligned to the right
    dropdown.style.top = `${containerRect.bottom + 8}px`;
    dropdown.style.left = `${containerRect.right - 210}px`; // 288px is dropdown width (w-72 = 18rem = 288px)
  }, [isDropdownOpen]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (showDropdown && users.length > 0) {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  if (users.length === 0) return null;

  const shouldShowDropdown = showDropdown && !onClick;

  return (
    <>
      <div // NOSONAR
        ref={containerRef}
        className={`flex items-center ${shouldShowDropdown || onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={handleClick}
      >
        <div className="flex -space-x-2">
          {visibleUsers.map((user, index) => (
            <div
              key={user.id}
              className={`${sizeClasses[size]} rounded-full border-2 flex items-center justify-center flex-shrink-0 relative`}
              style={{ zIndex: maxVisible - index }}
              title={user.name}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className={`w-full h-full ${getAvatarColor(user.id)} rounded-full flex items-center justify-center text-white font-semibold`}>
                  {getInitials(user.name)}
                </div>
              )}
            </div>
          ))}

          {remainingCount > 0 && showCount && (
            <div
              className={`${sizeClasses[size]} rounded-full border-2 bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-700 font-medium`}
              title={`${remainingCount} more ${remainingCount === 1 ? 'member' : 'members'}`}
              style={{ zIndex: 0 }}
            >
              +{remainingCount}
            </div>
          )}
        </div>
      </div>
      <div className="h-6 w-px bg-gray-300"></div>

      {/* Dropdown */}
      {shouldShowDropdown && isDropdownOpen && (
        <div
          ref={dropdownRef}
          className="fixed z-50 w-72 bg-card border rounded-xl shadow-lg overflow-hidden"
          style={{ maxHeight: '400px' }}
        >
          <div className="p-3 pb-1 text-xs font-semibold text-gray-500 tracking-wide">
            Members ({users.length})
          </div>
          <div className="max-h-80 p-2 pt-0 overflow-y-auto">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className={`${sizeClasses[size]} rounded-full border-2 flex items-center justify-center flex-shrink-0`}>
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full ${getAvatarColor(user.id)} rounded-full flex items-center justify-center text-white font-semibold`}>
                      {getInitials(user.name)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </div>
                  {user.email && (
                    <div className="text-xs text-gray-500 truncate">
                      {user.email}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

