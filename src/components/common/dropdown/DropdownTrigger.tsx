import React from 'react';
import { ChevronDown, ChevronUp, X, Loader2 } from 'lucide-react';

interface DropdownTriggerProps {
  displayLabel: string;
  isOpen: boolean;
  disabled?: boolean;
  loading?: boolean;
  clearable?: boolean;
  multiple?: boolean;
  selectedCount?: number;
  error?: string;
  onToggle: () => void;
  onClear?: () => void;
  className?: string;
  dropdownPosition?: 'above' | 'below';
}

export function DropdownTrigger({
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
  className = '',
  dropdownPosition = 'below',
}: Readonly<DropdownTriggerProps>) {
  const baseClasses = `
    relative w-full px-3 py-2.5 text-left bg-card border rounded-xl shadow-sm
    cursor-pointer transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)] focus:border-[var(--color-brand-600)]
  `;

  const stateClasses = `
    ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'hover:border'}
    ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border'}
    ${isOpen ? 'border-[var(--color-brand-600)] ring-1 ring-[var(--color-focus-ring)] ring-opacity-20' : ''}
  `;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear?.();
  };

  return (
    <button
      type="button"
      className={`${baseClasses} ${stateClasses} ${className}`}
      onClick={onToggle}
      disabled={disabled || loading}
      aria-expanded={isOpen}
      aria-haspopup="listbox"
    >
      <div className="flex items-center justify-between">
        <span className={`block truncate ${displayLabel.includes('Select') ? 'text-gray-500' : 'text-gray-900'
          }`}>
          {displayLabel}
        </span>

        <div className="flex items-center space-x-1">
          {multiple && selectedCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {selectedCount}
            </span>
          )}

          {clearable && selectedCount > 0 && !loading && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              type="button"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
          )}

          {loading ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          ) : (
            <>
              {dropdownPosition === 'above' && isOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen && dropdownPosition === 'below' ? 'transform rotate-180' : ''
                  }`} />
              )}
            </>
          )}
        </div>
    </div>
      </button>
  );
}