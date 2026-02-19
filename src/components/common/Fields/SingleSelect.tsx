import React, { useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';
import { useClickOutside } from '../../../hooks/useClickOutside';
import { useDropdownPosition } from '../../../hooks/useDropdownPosition';
import { getOptionColorClass, getReadableTextColor } from '../../../utils/optionColorUtils';
import { normalizeSelectOptions, SelectOption } from './selectOptions';
import { SelectOptionsMenu } from './SelectOptionsMenu';

interface SingleSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<string | SelectOption>;
  placeholder?: string;
  required?: boolean;
  allowCustom?: boolean;
  disabled?: boolean;
  isBorder?: boolean;
  className?: string;
  allowEdit?: boolean; // true = single click opens dropdown, false = double click for manual edit
  readOnly?: boolean; // true = completely prevent editing
  helperText?: string;
  config?: {
    defaultValue?: string;
    options?: Array<string | SelectOption>;
    allowCustom?: boolean;
    [key: string]: any;
  };
}

export const SingleSelect: React.FC<SingleSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select option...",
  required = false,
  disabled = false,
  allowCustom = false,
  isBorder = false,
  className = "",
  allowEdit = true,
  readOnly = false,
  helperText,
  config = {}
}) => {
  const { defaultValue = '', options: configOptions = options, allowCustom: configAllowCustom = allowCustom } = config;
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const clearButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const calculatedPosition = useDropdownPosition(buttonRef as React.RefObject<HTMLElement>, isOpen);

  // Note: We allow dropdown to open in read-only mode, but prevent selections

  useClickOutside({
    isOpen,
    onClose: () => setIsOpen(false),
    excludeRefs: [buttonRef, clearButtonRef, selectRef, dropdownRef]
  });

  const displayValue = (value !== null && value !== undefined && value !== '') ? value : (defaultValue || '');

  const normalizedOptions = useMemo(
    () => normalizeSelectOptions<SelectOption>(configOptions || []),
    [configOptions]
  );

  const selectedOption = useMemo(() => normalizedOptions.find(o => o.option === displayValue) || null, [normalizedOptions, displayValue]);


  const validate = (val: string) => {
    if (required && !val.trim()) {
      return 'This field is required';
    }

    if (val && !configAllowCustom && !normalizedOptions.some(o => o.option === val)) {
      return 'Please select a valid option';
    }

    return null;
  };

  const handleSelect = (option: string) => {
    if (readOnly) return;
    onChange(option);
    setIsOpen(false);

    const validationError = validate(option);
    setError(validationError);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;
    onChange('');
    setError(null);
  };


  return (
    <div className={`w-full relative ${className} ${isBorder ? "field-component-border" : ""}`} ref={selectRef}>

      {label && (
        <label className="field-component-label">
          {label}
          {required && <span className="field-component-required">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => !disabled && allowEdit && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`field-component ${error ? 'border-red-500 bg-red-50' : ''
            } ${disabled || readOnly ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900 cursor-pointer'}`}
        >
          <div className="flex items-center flex-1 truncate overflow-hidden whitespace-nowrap">
            {displayValue ? (
              <div
                className={`min-w-8 h-6 max-w-full inline-flex items-center justify-center gap-0.5 p-1 px-2 rounded-xl truncate overflow-hidden whitespace-nowrap ${selectedOption?.color ? '' : getOptionColorClass(normalizedOptions.findIndex(o => o.option === displayValue))}`}
                style={selectedOption?.color ? { backgroundColor: selectedOption.color, color: getReadableTextColor(selectedOption.color) } : undefined}
                title={displayValue}
              >
                <span className="truncate">{displayValue}</span>
              </div>
            ) : (
              <span className="text-gray-500 text-sm text-left truncate overflow-hidden whitespace-nowrap flex-1">{placeholder}</span>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {displayValue && !disabled && !readOnly && (
          <button
            ref={clearButtonRef}
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded flex-shrink-0"
            tabIndex={-1}
            style={{ zIndex: 2 }}
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Dropdown Portal */}
        {isOpen && calculatedPosition && createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] p-1.5 space-y-1.5 border bg-background rounded-xl shadow-lg max-h-48 overflow-y-auto"
            style={{
              ...(calculatedPosition.top !== undefined && { top: `${calculatedPosition.top}px` }),
              ...(calculatedPosition.bottom !== undefined && { bottom: `${calculatedPosition.bottom}px` }),
              left: `${calculatedPosition.left}px`,
              width: `${calculatedPosition.width}px`
            }}
          >
            {normalizedOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No options available</div>
            ) : (
              <SelectOptionsMenu
                options={normalizedOptions}
                readOnly={readOnly}
                isSelected={(opt) => value === opt.option}
                onSelect={(opt) => handleSelect(opt.option)}
                emptyMessage="No options available"
                optionClassName={(_, __, isDisabled) =>
                  `w-full text-left text-sm rounded-xl focus:bg-[var(--color-bg-brand-secondary)] transition-colors flex items-center justify-between ${isDisabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'cursor-pointer'}`
                }
              />
            )}
          </div>,
          document.body
        )}
      </div>

      {/* Error*/}
      {error && (
        <div className="mt-1.5 text-red-500 cursor-default">
          {error}
        </div>
      )}

      {/* Helper Text */}
      {helperText && allowEdit && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};
