import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X, Check, Info } from 'lucide-react';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface MultiSelectOption {
  option: string;
  color?: string;
}

interface MultiSelectProps {
  label?: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: Array<string | MultiSelectOption>;
  placeholder?: string;
  maxSelections?: number;
  required?: boolean;
  disabled?: boolean;
  isBorder?: boolean;
  className?: string;
  allowEdit?: boolean; // true = single click opens dropdown, false = double click for manual edit
  readOnly?: boolean; // true = completely prevent editing
  helperText?: string;
  icon?: string;
  config?: {
    defaultValue?: string[];
    options?: Array<string | MultiSelectOption>;
    maxSelections?: number;
    [key: string]: any;
  };
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select options...",
  maxSelections,
  required = false,
  disabled = false,
  isBorder = false,
  className = "",
  allowEdit = true,
  readOnly = false,
  helperText,
  icon = "",
  config = {}
}) => {
  const { defaultValue = [], options: configOptions = options, maxSelections: configMaxSelections = maxSelections } = config;
  const normalizedOptions: MultiSelectOption[] = (configOptions || []).map((o: string | MultiSelectOption) =>
    typeof o === 'string' ? { option: o, color: undefined } : { option: o.option, color: o.color }
  );
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'below' | 'above'>('below');
  const [calculatedPosition, setCalculatedPosition] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
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
    excludeRefs: [buttonRef, containerRef, dropdownRef]
  });

  // Use default value if value is empty/undefined/null and default value is provided
  const displayValue = (value !== null && value !== undefined && Array.isArray(value) && value.length > 0) ? value : (Array.isArray(defaultValue) && defaultValue.length > 0 ? defaultValue : []);

  const validate = (val: string[]) => {
    if (required && val.length === 0) {
      return 'Please select at least one option';
    }

    if (configMaxSelections && val.length > configMaxSelections) {
      return `Maximum ${configMaxSelections} selections allowed`;
    }

    return null;
  };

  const handleToggleOption = (option: string) => {
    let newValue: string[];

    if (displayValue.includes(option)) {
      newValue = displayValue.filter(v => v !== option);
    } else {
      if (configMaxSelections && displayValue.length >= configMaxSelections) {
        setError(`Maximum ${configMaxSelections} selections allowed`);
        return;
      }
      newValue = [...displayValue, option];
    }

    onChange(newValue);

    const validationError = validate(newValue);
    setError(validationError);
  };

  const handleRemoveOption = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;
    const newValue = displayValue.filter(v => v !== option);
    onChange(newValue);

    const validationError = validate(newValue);
    setError(validationError);
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

  return (
    <div className={`w-full relative ${className} ${isBorder ? "field-component-border" : ""}`} ref={containerRef}>
      {/* Label */}
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
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`field-component ${error ? 'border-red-500 bg-red-50' : ''
            } ${disabled || readOnly ? 'text-gray-400' : 'text-gray-900'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="w-full flex items-center justify-between min-w-0">
            <div className="flex gap-1 min-w-0 flex-1 overflow-hidden max-h-20 overflow-y-auto">
              {displayValue.length === 0 ? (
                <span className="text-gray-500 text-sm text-left truncate overflow-hidden whitespace-nowrap flex-1">{placeholder}</span>
              ) : (
                displayValue.map((item, index) => {
                  const optIndex = normalizedOptions.findIndex(o => o.option === item);
                  const opt = optIndex >= 0 ? normalizedOptions[optIndex] : { option: item, color: undefined };
                  const style = opt.color ? { backgroundColor: opt.color, color: getReadableTextColor(opt.color) } : undefined;
                  const cls = opt.color ? '' : getOptionColor(item, optIndex >= 0 ? optIndex : index);
                  return (
                    <div
                      key={item}
                      className={`min-w-8 h-6 max-w-32 inline-flex items-center justify-center gap-0.5 p-1 px-2 rounded-xl truncate overflow-hidden whitespace-nowrap flex-shrink-0 ${cls}`}
                      style={style}
                      title={item}
                    >
                      <span className="truncate">{item}</span>
                      {!disabled && !readOnly && (
                        <span
                          onClick={(e) => handleRemoveOption(item, e)}
                          className="transition-colors p-0.5 cursor-pointer flex-shrink-0"
                          style={{ lineHeight: 1, color: opt.color ? getReadableTextColor(opt.color) : undefined }}
                        >
                          <X className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ml-2 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Dropdown Portal */}
        {isOpen && calculatedPosition && createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] p-1.5 space-y-1.5 border bg-background rounded-xl shadow-lg max-h-56 overflow-y-auto"
            style={{
              ...(calculatedPosition.top !== undefined && { top: `${calculatedPosition.top}px` }),
              ...(calculatedPosition.bottom !== undefined && { bottom: `${calculatedPosition.bottom}px` }),
              left: `${calculatedPosition.left}px`,
              width: `${calculatedPosition.width}px`
            }}
          >
            {normalizedOptions.length === 0 ? (
              <div className="px-3 py-2 text-gray-500">No options available</div>
            ) : (
              normalizedOptions.map((opt, index) => {
                const label = opt.option;
                const isSelected = displayValue.includes(label);
                const isDisabled = configMaxSelections && !isSelected && displayValue.length >= configMaxSelections;

                return (
                  <button
                    type="button"
                    key={`${label}-${index}`}
                    onClick={() => !isDisabled && !readOnly && handleToggleOption(label)}
                    disabled={disabled || readOnly}
                    className={`w-full text-left text-sm rounded-xl flex items-center justify-between ${isDisabled || readOnly
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'cursor-pointer'
                      } ${isSelected ? 'bg-[var(--color-bg-brand-secondary)] text-black font-bold' : ''}`}
                  >
                    <div
                      className={`inline-flex justify-between items-center w-full p-1 px-2 rounded-full text-xs min-w-0 ${opt.color ? '' : getOptionColor(label, index)} ${isDisabled ? 'opacity-50' : ''}`}
                      style={opt.color ? { backgroundColor: opt.color, color: getReadableTextColor(opt.color) } : undefined}
                    >
                      <span className="truncate" title={label}>{label}</span>
                      {isSelected && <Check className="w-4 h-4 flex-shrink-0 ml-1" style={{ color: opt.color ? getReadableTextColor(opt.color) : '#000000' }} />}
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