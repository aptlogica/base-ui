import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

interface RoleDropdownOption {
  label: string;
  value: string;
}

interface RoleDropdownProps {
  value: string;
  options: RoleDropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RoleDropdown: React.FC<RoleDropdownProps> = ({
  value,
  options,
  onChange,
  placeholder = 'Select a role',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ 
    top?: number; 
    bottom?: number; 
    left: number; 
    width: number;
    position: 'above' | 'below';
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Calculate dropdown position with smart positioning (above/below)
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return null;

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dropdownMinHeight = 200; // Minimum height estimate for dropdown
    const dropdownWidth = Math.max(rect.width, 220); // Use trigger width or minimum 220px

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Determine if we should open above or below
    let position: 'above' | 'below' = 'below';
    if (spaceBelow < dropdownMinHeight && spaceAbove > spaceBelow) {
      position = 'above';
    }

    // Calculate left position (align to right edge of trigger for right-aligned dropdowns)
    let left = rect.right - dropdownWidth;
    if (left < 10) {
      left = 10; // 10px margin from left edge
    }
    if (left + dropdownWidth > viewportWidth - 10) {
      left = viewportWidth - dropdownWidth - 10; // 10px margin from right edge
    }

    return {
      top: position === 'below' ? rect.bottom + 4 : undefined,
      bottom: position === 'above' ? viewportHeight - rect.top + 4 : undefined,
      left,
      width: dropdownWidth,
      position
    };
  }, []);

  // Update position when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const position = calculatePosition();
      setDropdownPosition(position);
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedElement = event.target as HTMLElement;

      // Don't close if clicking inside this dropdown's trigger or menu
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      // Don't close if clicking on another dropdown trigger or menu
      if (clickedElement) {
        // Check if clicking on any dropdown trigger
        const clickedTrigger = clickedElement.closest('[data-dropdown-trigger="true"]');
        if (clickedTrigger && clickedTrigger !== triggerRef.current) {
          return; // Don't close - clicking on another dropdown trigger
        }

        // Check if clicking inside another dropdown menu
        const clickedMenu = clickedElement.closest('[data-dropdown-menu="true"]');
        if (clickedMenu && clickedMenu !== menuRef.current) {
          return; // Don't close - clicking on another dropdown menu
        }
      }

      // Close this dropdown if clicking outside
      setIsOpen(false);
    };

    if (isOpen) {
      // Use setTimeout to avoid immediate closure when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, optionValue?: string) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'Enter' && optionValue) {
      e.preventDefault();
      handleSelect(optionValue);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const currentIndex = optionValue 
        ? options.findIndex(opt => opt.value === optionValue)
        : -1;
      const nextIndex = e.key === 'ArrowDown' 
        ? (currentIndex + 1) % options.length
        : (currentIndex - 1 + options.length) % options.length;
      const nextOption = options[nextIndex];
      if (nextOption) {
        onChange(nextOption.value);
      }
    }
  };

  return (
    <>
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          ref={triggerRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen(!isOpen);
            } else if (e.key === 'ArrowDown' && !isOpen) {
              e.preventDefault();
              setIsOpen(true);
            }
          }}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className="w-full text-xs px-3 py-2.5 border rounded-xl gap-1 bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-gray-700 flex items-center justify-between transition-all min-w-0"
          data-dropdown-trigger="true"
        >
          <span className="truncate flex-1 min-w-0 text-left" title={selectedOption ? selectedOption.label : placeholder}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Portal dropdown menu to prevent cropping */}
      {isOpen && dropdownPosition && createPortal(
        <div
          ref={menuRef}
          data-dropdown-menu="true"
          role="menu"
          tabIndex={-1}
          onKeyDown={(e) => handleKeyDown(e)}
          className="fixed z-[9999] bg-card border rounded-xl shadow-lg overflow-hidden focus:outline-none"
          style={{
            ...(dropdownPosition.top !== undefined && { top: `${dropdownPosition.top}px` }),
            ...(dropdownPosition.bottom !== undefined && { bottom: `${dropdownPosition.bottom}px` }),
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`
          }}
          onClick={(e) => e.stopPropagation()}
          aria-label="Role selection menu"
        >
          <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
            {options.map((option) => {
              const isSelected = value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(option.value);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, option.value)}
                  className={`w-full text-left px-3 py-2 text-xs cursor-pointer transition-colors rounded-xl flex items-center justify-between ${isSelected
                    ? 'bg-gray-200 text-primary'
                    : 'text-primary hover:bg-gray-200'
                    }`}
                  aria-checked={isSelected}
                  role="menuitemradio"
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

