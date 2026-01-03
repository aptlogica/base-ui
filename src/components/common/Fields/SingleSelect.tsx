import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, X } from 'lucide-react';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface SingleSelectOption {
  option: string;
  color?: string;
}

interface SingleSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<string | SingleSelectOption>;
  placeholder?: string;
  required?: boolean;
  allowCustom?: boolean;
  disabled?: boolean;
  isBorder?: boolean;
  className?: string;
  allowEdit?: boolean; // true = single click opens dropdown, false = double click for manual edit
  readOnly?: boolean; // true = completely prevent editing
  helperText?: string;
  icon?: string;
  config?: {
    defaultValue?: string;
    options?: Array<string | SingleSelectOption>;
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
  icon = "",
  config = {}
}) => {
  const { defaultValue = '', options: configOptions = options, allowCustom: configAllowCustom = allowCustom } = config;
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'below' | 'above'>('below');
  const [calculatedPosition, setCalculatedPosition] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);
  const selectRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const clearButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate dropdown position for portal rendering
  const calculateDropdownPosition = useCallback(() => {
    const trigger = buttonRef.current;
    if (!trigger) return null;

    const rect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dropdownMinHeight = 200;
    const dropdownWidth = Math.min(384, rect.width); // Use button width or max 384px

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Determine if we should open above or below
    let position: 'above' | 'below' = 'below';
    if (spaceBelow < dropdownMinHeight && spaceAbove > spaceBelow) {
      position = 'above';
    }
    setDropdownPosition(position);

    // Calculate left position (align to left edge of trigger)
    let left = rect.left;
    if (left < 10) {
      left = 10; // 10px margin from left edge
    }
    if (left + dropdownWidth > viewportWidth - 10) {
      left = viewportWidth - dropdownWidth - 10; // 10px margin from right edge
    }

    // Calculate top/bottom position
    if (position === 'below') {
      return {
        top: rect.bottom + 6,
        left,
        width: dropdownWidth
      };
    } else {
      return {
        bottom: viewportHeight - rect.top + 6,
        left,
        width: dropdownWidth
      };
    }
  }, []);

  // Update position when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const position = calculateDropdownPosition();
      setCalculatedPosition(position);
    } else {
      setCalculatedPosition(null);
    }
  }, [isOpen, calculateDropdownPosition]);

  // Note: We allow dropdown to open in read-only mode, but prevent selections

  useClickOutside({
    isOpen,
    onClose: () => setIsOpen(false),
    excludeRefs: [buttonRef, clearButtonRef, selectRef, dropdownRef]
  });

  const displayValue = (value !== null && value !== undefined && value !== '') ? value : (defaultValue || '');

  const normalizedOptions: SingleSelectOption[] = useMemo(() => {
    return (configOptions || []).map((o: string | SingleSelectOption) =>
      typeof o === 'string' ? { option: o, color: undefined } : { option: o.option, color: o.color }
    );
  }, [configOptions]);

  const selectedOption = useMemo(() => normalizedOptions.find(o => o.option === displayValue) || null, [normalizedOptions, displayValue]);

  const getReadableTextColor = (hex?: string) => {
    if (!hex) return '#1f2937';
    const c = hex.replace('#', '');
    if (c.length !== 6) return '#1f2937';
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 160 ? '#111827' : '#ffffff';
  };

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

  const getOptionColor = (option: string, index: number) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-cyan-100 text-cyan-800',
      'bg-red-100 text-red-800',
      'bg-yellow-100 text-yellow-800',
      'bg-teal-100 text-teal-800'
    ];
    return colors[index % colors.length];
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
                className={`min-w-8 h-6 max-w-full inline-flex items-center justify-center gap-0.5 p-1 px-2 rounded-xl truncate overflow-hidden whitespace-nowrap ${selectedOption?.color ? '' : getOptionColor(displayValue, normalizedOptions.findIndex(o => o.option === displayValue))}`}
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
              normalizedOptions.map((opt, index) => {
                const label = opt.option;
                return (
                <button
                  key={`${label}-${index}`}
                  onClick={() => handleSelect(label)}
                  disabled={readOnly}
                  className={`w-full text-left text-sm rounded-xl focus:bg-[var(--color-bg-brand-secondary)] transition-colors flex items-center justify-between ${readOnly ? 'cursor-default opacity-75' : 'cursor-pointer'}`}
                >
                  <div
                    className={`inline-flex justify-between items-center w-full p-1 px-2 rounded-full text-xs min-w-0 ${opt.color ? '' : getOptionColor(label, index)}`}
                    style={opt.color ? { backgroundColor: opt.color, color: getReadableTextColor(opt.color) } : undefined}
                  >
                    <span className="truncate" title={label}>{label}</span>
                    {value === label && <Check className="w-4 h-4 flex-shrink-0 ml-1" style={{ color: opt.color ? getReadableTextColor(opt.color) : '#000000' }} />}
                  </div>
                </button>
                );
              })
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