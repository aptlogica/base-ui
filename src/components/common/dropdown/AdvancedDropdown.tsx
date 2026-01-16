import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, X, Check, Search, Loader2, Info } from 'lucide-react';

interface DropdownOption<T = string | number> {
  label: string;
  value: T;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
  rightLabel?: string;
}

interface AdvancedDropdownProps<T = string | number> {
  readonly options: readonly DropdownOption<T>[];
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
  readonly showValueOnRight?: boolean;
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
  showValueOnRight = false,
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
  const normalizeValue = useCallback((val: T | T[] | undefined): T[] => {
    if (val === undefined || val === null) return [];
    return Array.isArray(val) ? val : [val];
  }, []);

  // Get current values as array
  const currentValues = normalizeValue(value);

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
    if (currentValues.length === 0) return placeholder;

    const labels = currentValues
      .map(val => options.find(opt => opt.value === val)?.label)
      .filter(Boolean) as string[];

    if (labels.length === 0) return placeholder;

    if (multiple) {
      if (labels.length > 2) {
        return `${labels.length} items selected`;
      }
      return labels.join(', ');
    }

    return labels[0] || placeholder;
  }, [currentValues, options, placeholder, multiple]);

  // Handle option selection
  const handleSelect = useCallback((optionValue: T) => {
    try {
      if (multiple) {
        const newValues = currentValues.includes(optionValue)
          ? currentValues.filter(v => v !== optionValue)
          : [...currentValues, optionValue];
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
    return currentValues.includes(optionValue);
  }, [currentValues]);

  // Handle clear
  const handleClear = useCallback((e: React.MouseEvent) => {
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
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* Label with Help Text */}
      {label && (
        <div className="mb-2">
          <label
            htmlFor={id}
            className={`flex items-center gap-1.5 text-sm font-medium ${error ? 'text-red-700' : 'text-gray-700'
              }`}
          >
            {label}
            {required && <span className="text-red-500">*</span>}
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
            />
          )}

          {/* Options List */}
          <ul
            ref={optionsRef}
            className="p-2 space-y-1.5 max-h-48 overflow-auto"
            style={{ maxHeight: `${maxHeight}px` }}
            role="listbox"
            aria-multiselectable={multiple}
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500 text-center">
                {searchQuery ? 'No results found' : 'No options available'}
              </li>
            ) : (
              filteredOptions.map((option, index) => (
                <DropdownOptionItem
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

// Dropdown Trigger Component
const DropdownTrigger = React.forwardRef<HTMLButtonElement, {
  displayLabel: string;
  isOpen: boolean;
  disabled?: boolean;
  loading?: boolean;
  clearable?: boolean;
  multiple?: boolean;
  selectedCount?: number;
  error?: string;
  onToggle: () => void;
  onClear?: (e: React.MouseEvent) => void;
  dropdownPosition?: 'below' | 'above';
}>(({
  displayLabel,
  isOpen,
  disabled,
  loading,
  clearable,
  multiple,
  selectedCount = 0,
  error,
  onToggle,
  onClear,
  dropdownPosition,
}, ref) => {

  const baseClasses = `
    relative w-full px-3 py-2.5 text-left bg-background border rounded-xl shadow-xs text-primary
    cursor-pointer transition-all duration-200 ease-in-out
    focus:outline-none focus:border-[--color-brand-600]
    flex items-center justify-between
  `;

  const stateClasses = `
    ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'hover:border'}
    ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border'}
    ${isOpen ? 'border-[var(--color-brand-600)] ring-1 ring-[var(--color-focus-ring)] ring-opacity-20' : ''}
  `;

  return (
    <button
      ref={ref}
      type="button"
      className={`${baseClasses} ${stateClasses}`}
      onClick={onToggle}
      disabled={disabled || loading}
      aria-expanded={isOpen}
      aria-haspopup="listbox"
    >
      <span className={`block truncate ${displayLabel.includes('Select') ? 'var(--color-text-placeholder)' : 'var(--color-text-primary)'
        }`}>
        {displayLabel}
      </span>

      <div className="flex items-center space-x-1 ml-2">
        {multiple && selectedCount > 0 && (
          <span className="inline-flex items-center justify-center p-3 h-4 w-4 rounded-full text-xs font-medium bg-[var(--color-bg-brand-primary)] text-black">
            {selectedCount}
          </span>
        )}

        {clearable && selectedCount > 0 && !loading && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Clear selection"
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
        )}

        {loading ? (
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        ) : (
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''
            }`} />
        )}
      </div>
    </button>
  );
});

// Dropdown Search Component
const DropdownSearch = React.forwardRef<HTMLInputElement, {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}>(({ value, onChange, placeholder = 'Search options...' }, ref) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Combine refs using useImperativeHandle
  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  // Detect and clear email autofill on focus
  const handleFocus = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.target;
    // If input value looks like an email but our state is empty, browser autofilled it
    // Clear it immediately to prevent autofill issues
    if (input.value && /@/.test(input.value) && !value) {
      input.value = '';
      onChange('');
    }
  }, [value, onChange]);

  return (
    <div className="p-3 border-b border">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] bg-[--color-alpha-white] transition-colors duration-200"
          autoComplete="new-password"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          data-lpignore="true"
          data-form-type="other"
        />
      </div>
    </div>
  );
});

// Dropdown Option Item Component
function DropdownOptionItem<T>({
  option,
  isSelected,
  isFocused,
  multiple,
  onClick,
}: Readonly<{
  option: DropdownOption<T>;
  isSelected: boolean;
  isFocused: boolean;
  multiple: boolean;
  onClick: () => void;
}>) {
  const baseClasses = `
    flex items-center justify-between px-3 py-2.5 cursor-pointer
    transition-all duration-150 ease-in-out relative
  `;

  const stateClasses = `
    ${isFocused ? 'bg-[var(--color-bg-brand-primary)] border-l-4 border-l-gray-400' : ''}
    ${isSelected && !multiple ? 'bg-[var(--color-bg-brand-primary)] text-black' : 'text-[var(--color-text-primary)]'}
    ${isSelected && multiple ? 'bg-[var(--color-bg-brand-primary)] text-black' : 'text-[var(--color-text-primary)]'}
    ${!isSelected && !isFocused ? 'hover:bg-[var(--color-bg-brand-primary)] hover:text-black' : ''}
    ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  return (
    <li
      className={`${baseClasses} ${stateClasses} rounded-xl`}
      onClick={option.disabled ? undefined : onClick}
      role="option"
      aria-selected={isSelected}
      aria-disabled={option.disabled}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {option.icon && (
          <div className="flex-shrink-0 w-4 h-4 text-gray-500">
            {option.icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className={`font-medium ${isSelected && !multiple ? 'text-black' : ''}`}>
            {option.label}
          </div>
          {option.description && (
            <div
              className={`text-sm mt-0.5 ${isSelected && !multiple ? 'var(--color-text-secondary)' : 'var(--color-text-placeholder)'} overflow-hidden`}
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: '1.4',
                maxHeight: '2.8em'
              }}
              title={option.description}
            >
              {option.description}
            </div>
          )}
        </div>
      </div>

      {/* Only show rightLabel if explicitly provided (e.g., for currency fields) */}
      {option.rightLabel && (
        <div className="flex-shrink-0 ml-2 text-sm text-gray-500">
          {option.rightLabel}
        </div>
      )}

      {isSelected && (
        <div className="flex-shrink-0 ml-2">
          {multiple ? (
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${isSelected
              ? 'bg-[var(--color-bg-brand-primary)] border-[var(--color-bg-brand-primary)]'
              : 'border bg-black'
              }`}>
              <Check className="w-3 h-3 text-black" />
            </div>
          ) : (
            <Check className="w-4 h-4 text-[var(--color-bg-brand-primary)]" />
          )}
        </div>
      )}
    </li>
  );
}

// Helper functions
function getSelectedCount<T>(value: T | T[] | undefined | null): number {
  let normalizedValue: T[];
  if (value === undefined || value === null) {
    normalizedValue = [];
  } else if (Array.isArray(value)) {
    normalizedValue = value;
  } else {
    normalizedValue = [value];
  }
  return normalizedValue.length;
}

export default AdvancedDropdown;