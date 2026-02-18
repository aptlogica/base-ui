import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { calculateDropdownPosition } from '../../utils/dropdownPosition';

export type AccessRole = 'owner' | 'editor' | 'viewer' | 'no-access' | 'creator' | 'commenter';

export interface RoleConfig {
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  iconColor?: string; // Optional specific icon color
}

interface AccessRoleSelectorProps {
  value: AccessRole;
  onChange: (role: AccessRole) => void;
  roleConfig: Record<AccessRole, RoleConfig>;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export const AccessRoleSelector: React.FC<AccessRoleSelectorProps> = ({
  value,
  onChange,
  roleConfig,
  className = '',
  disabled = false,
  placeholder = 'Select access level'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<{ top?: number; bottom?: number; left: number; width: number; position: 'above' | 'below' } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculate dropdown position with smart positioning (above/below)
  const getDropdownPosition = useCallback(() => {
    if (!buttonRef.current) return null;

    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownMinHeight = 200; // Min height estimate
    const dropdownWidth = rect.width;

    return calculateDropdownPosition({
      rect,
      dropdownMinHeight,
      dropdownWidth,
      offset: 4,
      sideMargin: 10
    });
  }, []);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const position = getDropdownPosition();
      setDropdownPosition(position);
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen, getDropdownPosition]);

  useClickOutside({
    isOpen,
    onClose: () => {
      setIsOpen(false);
      setSearchQuery('');
      setDropdownPosition(null);
    },
    excludeRefs: [dropdownRef, buttonRef]
  });

  const currentRole = roleConfig[value];
  const CurrentIcon = currentRole.icon;

  // Filter roles based on search query
  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) {
      return Object.entries(roleConfig) as [AccessRole, RoleConfig][];
    }

    const query = searchQuery.toLowerCase();
    return (Object.entries(roleConfig) as [AccessRole, RoleConfig][]).filter(
      ([_role, config]) =>
        config.label.toLowerCase().includes(query) ||
        config.description.toLowerCase().includes(query)
    );
  }, [searchQuery, roleConfig]);

  const handleRoleSelect = (role: AccessRole) => {
    onChange(role);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Get icon color class based on role
  const getIconColorClass = (role: AccessRole): string => {
    const colorMap: Record<AccessRole, string> = {
      'owner': 'text-purple-600',
      'creator': 'text-indigo-600',
      'editor': 'text-green-600',
      'commenter': 'text-orange-600',
      'viewer': 'text-green-600',
      'no-access': 'text-red-600'
    };
    return colorMap[role] || 'text-gray-600';
  };

  return (
    <>
      <div className={`relative ${className}`}>
        {/* Trigger Button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full flex items-center justify-between px-4 py-2 border rounded-xl text-sm font-medium transition-colors ${currentRole.color
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
        >
          <div className="flex items-center gap-2">
            <CurrentIcon className={`w-4 h-4 ${getIconColorClass(value)}`} />
            {currentRole.label}
          </div>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Dropdown Menu Portal */}
      {isOpen && !disabled && dropdownPosition && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-card border rounded-xl shadow-lg z-50 max-h-96 overflow-hidden"
          style={{
            ...(dropdownPosition.top !== undefined && { top: `${dropdownPosition.top}px` }),
            ...(dropdownPosition.bottom !== undefined && { bottom: `${dropdownPosition.bottom}px` }),
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`
          }}
        >
          {/* Search Bar */}
          <div className="p-2 border-b border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)] text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Role Options */}
          <div className="overflow-y-auto max-h-80">
            {filteredRoles.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No roles found
              </div>
            ) : (
              filteredRoles.map(([role, config]) => {
                const Icon = config.icon;
                const isSelected = value === role;
                const iconColorClass = getIconColorClass(role);

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                    className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-green-50' : ''
                      }`}
                  >
                    <Icon className={`w-5 h-5 ${iconColorClass} mt-0.5 flex-shrink-0`} />
                    <div className="flex-1 text-left min-w-0">
                      <div
                        className={`font-medium ${isSelected ? 'text-green-900' : 'text-gray-900'
                          }`}
                      >
                        {config.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{config.description}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

