import React from 'react';
import { ChevronDown, X, Loader2 } from 'lucide-react';

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
  onClear?: (e: React.MouseEvent | React.KeyboardEvent) => void;
}

export const DropdownTrigger = React.forwardRef<HTMLButtonElement, DropdownTriggerProps>(({
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
}, ref) => {
  const baseClasses = `
    relative w-full min-w-0 max-w-full px-3 py-2.5 text-left bg-background border rounded-xl shadow-xs text-primary
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
      <span className={`block min-w-0 flex-1 truncate ${displayLabel.includes('Select') ? 'var(--color-text-placeholder)' : 'var(--color-text-primary)'
        }`}>
        {displayLabel}
      </span>

      <div className="flex shrink-0 items-center space-x-1 ml-2">
        {multiple && selectedCount > 0 && (
          <span className="inline-flex items-center justify-center p-3 h-4 w-4 rounded-full text-xs font-medium bg-[var(--color-bg-brand-primary)] text-black">
            {selectedCount}
          </span>
        )}

        {clearable && selectedCount > 0 && !loading && onClear && (
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onClear(e);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onClear(e);
              }
            }}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Clear selection"
          >
            <X className="w-3 h-3 text-gray-500" />
          </div>
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
