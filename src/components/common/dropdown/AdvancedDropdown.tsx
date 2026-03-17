// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Info } from 'lucide-react';
import { DropdownTrigger } from './DropdownTrigger';
import { DropdownSearch } from './DropdownSearch';
import { DropdownOption } from './DropdownOption';
import { normalizeSelection, toggleSelection, isSelected as isSelectedValue, getDisplayValue } from './dropdownSelection';

interface AdvancedDropdownOption<T = string | number> {
  label: string;
  value: T;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
  rightLabel?: string;
}

interface AdvancedDropdownProps<T = string | number> {
  readonly options: readonly AdvancedDropdownOption<T>[];
  readonly value?: T | T[];
  readonly onChange: (value: T | T[]) => void;
  readonly multiple?: boolean;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly error?: string;
  readonly searchable?: boolean;
  readonly clearable?: boolean;
  readonly maxHeight?: number;
  readonly className?: string;
  readonly required?: boolean;
  readonly label?: string;
  readonly id?: string;
  readonly helpText?: string;
  readonly validate?: (value: T | T[] | undefined) => string | undefined;
}

export function AdvancedDropdown<T extends string | number>({
  options = [],
  value,
  onChange,
  multiple = false,
  placeholder = 'Select an option...',
  disabled = false,
  loading = false,
  error: externalError,
  searchable = false,
  clearable = false,
  maxHeight = 200,
  className = '',
  required = false,
  label,
  id,
  helpText,
  validate,
}: AdvancedDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState<'below' | 'above'>('below');

  // Validation error from validate function
  const validationError = useMemo(() => {
    if (validate) {
      return validate(value);
    }
    return undefined;
  }, [validate, value]);

  // Combine external error and validation error (validation takes precedence)
  const error = validationError || externalError;

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLUListElement>(null);

  // Normalize value to always be an array for consistent handling
  const currentValues = useMemo(
    () => normalizeSelection(value, isEmptySelectionValue),
    [value]
  );

  // Filter and sort options based on search query
  const filteredOptions = Array.from(
    searchable && searchQuery.trim()
      ? options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : options
  ).sort((a, b) => a.label.localeCompare(b.label));

  // Calculate dropdown position based on available space
  const calculateDropdownPosition = useCallback(() => {
    if (!triggerRef.current) return 'below';

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = Math.min(maxHeight + 60, 300); // Account for search and padding

    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    // If there's not enough space below but enough above, open upward
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      return 'above';
    }

    return 'below';
  }, [maxHeight]);

  // Get display label (rename to avoid clashing with helper below)
  const computeDisplayLabel = useCallback((): string => {
    const labels = currentValues
      .map(val => options.find(opt => opt.value === val)?.label)
      .filter(Boolean) as string[];
    return getDisplayValue(labels, placeholder, multiple);
  }, [currentValues, options, placeholder, multiple]);

  // Handle option selection
  const handleSelect = useCallback((optionValue: T) => {
    try {
      if (multiple) {
        const newValues = toggleSelection(currentValues, optionValue);
        onChange(newValues);
      } else {
        onChange(optionValue);
        setIsOpen(false);
        setSearchQuery('');
        setFocusedIndex(-1);
      }
    } catch (err) {
      console.error('Error selecting option:', err);
    }
  }, [multiple, currentValues, onChange]);

  // Check if option is selected
  const isSelected = useCallback((optionValue: T): boolean => {
    return isSelectedValue(currentValues, optionValue);
  }, [currentValues]);

  // Handle clear
  const handleClear = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onChange(multiple ? [] as T[] : undefined as any);
    setSearchQuery('');
    setFocusedIndex(-1);
  }, [multiple, onChange]);

  // Handle toggle
  const handleToggle = useCallback(() => {
    if (disabled || loading) return;

    setIsOpen(prev => {
      const newOpen = !prev;
      if (newOpen) {
        // Clear search query when opening to prevent stale state and autofill issues
        setSearchQuery('');
        // Calculate position when opening
        const position = calculateDropdownPosition();
        setDropdownPosition(position);
        setFocusedIndex(-1);
        setTimeout(() => {
          if (searchable && searchRef.current) {
            searchRef.current.focus();
          }
        }, 0);
      } else {
        setSearchQuery('');
        setFocusedIndex(-1);
      }
      return newOpen;
    });
  }, [disabled, loading, searchable, calculateDropdownPosition]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (disabled || loading) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          const option = filteredOptions[focusedIndex];
          if (!option.disabled) {
            handleSelect(option.value);
          }
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        setFocusedIndex(-1);
        triggerRef.current?.focus();
        break;

      case 'Tab':
        setIsOpen(false);
        setSearchQuery('');
        setFocusedIndex(-1);
        break;
    }
  }, [isOpen, focusedIndex, filteredOptions, handleSelect, handleToggle, disabled, loading]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', () => {
      if (isOpen) {
        const position = calculateDropdownPosition();
        setDropdownPosition(position);
      }
    });

    window.removeEventListener('resize', () => { });
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, isOpen, calculateDropdownPosition]);

  // Auto-scroll to focused option
  useEffect(() => {
    if (focusedIndex >= 0 && optionsRef.current) {
      const focusedElement = optionsRef.current.children[
        focusedIndex
      ] as HTMLElement;

      if (focusedElement) {
        focusedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [focusedIndex, searchable]);

  const displayLabel = computeDisplayLabel();
  const selectedCount = getSelectedCount(value);

  return (
    <div className={`relative w-full min-w-0 max-w-full ${className}`} ref={dropdownRef}>
      {/* Label with Help Text */}
      {label && (
        <div className="mb-2">
          <label
            htmlFor={id}
            className={`flex items-center gap-1.5 text-sm font-medium ${error ? 'text-red-700' : 'text-gray-700'
              }`}
          >
            {label}
            {required && <span className="field-component-required">*</span>}
            {helpText && (
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 px-2 py-1.5 text-xs text-primary bg-card rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity w-[250px]">
                  {helpText}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-[.border-primary]"></div>
                </div>
              </div>
            )}
          </label>
        </div>
      )}

      {/* Trigger Button */}
      <DropdownTrigger
        displayLabel={displayLabel}
        isOpen={isOpen}
        disabled={disabled}
        loading={loading}
        clearable={clearable && selectedCount > 0}
        multiple={multiple}
        selectedCount={selectedCount}
        error={error}
        onToggle={handleToggle}
        onClear={handleClear}
        ref={triggerRef}
      />

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-40 w-full bg-background border rounded-xl shadow-lg transition-all duration-200 ${dropdownPosition === 'above'
            ? 'bottom-full mb-1'
            : 'top-full mt-1'
            }`}
        >
          {/* Search Input */}
          {searchable && (
            <DropdownSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search options..."
              ref={searchRef}
              clearAutofillOnFocus={true}
            />
          )}

          {/* Options List */}
          <ul // NOSONAR
            ref={optionsRef}
            className="p-2 space-y-1.5 max-h-48 overflow-auto"
            style={{ maxHeight: `${maxHeight}px` }}
            aria-multiselectable={multiple}
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500 text-center">
                {searchQuery ? 'No results found' : 'No options available'}
              </li>
            ) : (
              filteredOptions.map((option, index) => (
                <DropdownOption
                  key={`${option.value}-${index}`}
                  option={option}
                  isSelected={isSelected(option.value)}
                  isFocused={index === focusedIndex}
                  multiple={multiple}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                />
              ))
            )}
          </ul>
        </div>
      )}

      {/* Help Text (shown when no error) */}
      {!error && helpText && !label && (
        <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
          <Info className="w-3 h-3" />
          {helpText}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
          <Info className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}

// Helper functions
function isEmptySelectionValue<T>(value: T | undefined | null): boolean {
  return value === undefined || value === null || value === '';
}

function getSelectedCount<T>(value: T | T[] | undefined | null): number {
  let normalizedValue: T[];
  if (value === undefined || value === null) {
    normalizedValue = [];
  } else if (Array.isArray(value)) {
    normalizedValue = value;
  } else {
    normalizedValue = [value];
  }
  return normalizedValue.filter(item => !isEmptySelectionValue(item)).length;
}

export default AdvancedDropdown;
