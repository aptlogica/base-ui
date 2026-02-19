import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Filter } from 'lucide-react';
import { calculateDropdownPosition } from '../../../utils/dropdownPosition';

interface RoleFilterDropdownProps {
  label: string;
  selectedRole: string | null;
  roles: string[];
  dropdownWidth: number;
  onChange: (role: string | null) => void;
  closeOnEscape?: boolean;
  menuRole?: string;
  menuTabIndex?: number;
}

export const RoleFilterDropdown: React.FC<RoleFilterDropdownProps> = ({
  label,
  selectedRole,
  roles,
  dropdownWidth,
  onChange,
  closeOnEscape = false,
  menuRole,
  menuTabIndex
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!buttonRef.current) return null;

    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownMinHeight = 200;
    return calculateDropdownPosition({
      rect,
      dropdownMinHeight,
      dropdownWidth,
      align: 'right',
      offset: 8,
      sideMargin: 10
    });
  }, [dropdownWidth]);

  useEffect(() => {
    if (isOpen) {
      setPosition(calculatePosition());
    } else {
      setPosition(null);
    }
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedElement = event.target as HTMLElement;

      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      if (clickedElement) {
        const clickedTrigger = clickedElement.closest('[data-dropdown-trigger="role-filter"]');
        if (clickedTrigger && clickedTrigger !== buttonRef.current) {
          return;
        }

        const clickedMenu = clickedElement.closest('[data-dropdown-menu="role-filter"]');
        if (clickedMenu && clickedMenu !== menuRef.current) {
          return;
        }
      }

      setIsOpen(false);
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`px-4 py-2 text-sm border rounded-xl flex items-center gap-2 transition-colors ${selectedRole
          ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
          : 'border text-gray-700 hover:bg-gray-50'
          }`}
        data-dropdown-trigger="role-filter"
        aria-expanded={isOpen}
      >
        <Filter className="w-4 h-4" />
        {label}
        {selectedRole && (
          <span className="ml-1 px-1.5 py-0.5 bg-blue-200 text-blue-800 rounded text-xs">
            {selectedRole}
          </span>
        )}
      </button>

      {isOpen && position && createPortal(
        <div //NOSONAR
          ref={menuRef}
          data-dropdown-menu="role-filter"
          role={menuRole}
          tabIndex={menuTabIndex}
          className="fixed z-[9999] bg-card border rounded-xl shadow-lg max-h-64 overflow-y-auto"
          style={{
            ...(position.top !== undefined && { top: `${position.top}px` }),
            ...(position.bottom !== undefined && { bottom: `${position.bottom}px` }),
            left: `${position.left}px`,
            width: `${position.width}px`
          }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (closeOnEscape && e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
        >
          <div className="p-2 space-y-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm text-primary rounded-xl hover:bg-gray-100 transition-colors ${selectedRole ? '' : 'bg-gray-100 font-medium'
                }`}
            >
              All Roles
            </button>
            {roles.map((role) => (
              <button
                key={role}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(role);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm text-primary rounded-lg hover:bg-gray-100 transition-colors ${selectedRole === role ? 'bg-gray-100 font-medium' : ''
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
  );
};
