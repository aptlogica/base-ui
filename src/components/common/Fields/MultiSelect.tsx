// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';
import { useClickOutside } from '../../../hooks/useClickOutside';
import { getOptionColorClass, getReadableTextColor } from '../../../utils/optionColorUtils';
import { useDropdownPosition } from '../../../hooks/useDropdownPosition';
import { normalizeSelectOptions, SelectOption } from './selectOptions';
import { SelectOptionsMenu } from './SelectOptionsMenu';

interface MultiSelectProps {
  label?: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: Array<string | SelectOption>;
  placeholder?: string;
  maxSelections?: number;
  required?: boolean;
  disabled?: boolean;
  isBorder?: boolean;
  className?: string;
  allowEdit?: boolean; // true = single click opens dropdown, false = double click for manual edit
  readOnly?: boolean; // true = completely prevent editing
  helperText?: string;
  config?: {
    defaultValue?: string[];
    options?: Array<string | SelectOption>;
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
  config = {}
}) => {
  const { defaultValue = [], options: configOptions = options, maxSelections: configMaxSelections = maxSelections } = config;
  const normalizedOptions = useMemo(
    () => normalizeSelectOptions<SelectOption>(configOptions || []),
    [configOptions]
  );
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const calculatedPosition = useDropdownPosition(buttonRef as React.RefObject<HTMLElement>, isOpen);

  // Note: We allow dropdown to open in read-only mode, but prevent selections

  // Use default value if value is empty/undefined/null and default value is provided
  let resolvedValue: string[] = [];
  if (value !== null && value !== undefined && Array.isArray(value) && value.length > 0) {
    resolvedValue = value;
  } else if (Array.isArray(defaultValue) && defaultValue.length > 0) {
    resolvedValue = defaultValue;
  }
  const [localValue, setLocalValue] = useState<string[]>(resolvedValue);
  const [isDirty, setIsDirty] = useState(false);
  const pendingCommitRef = useRef<string[] | null>(null);

  const areValuesEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  };

  const commitSelection = (nextValue: string[]) => {
    pendingCommitRef.current = nextValue;
    onChange(nextValue);
    const validationError = validate(nextValue);
    setError(validationError);
    setIsDirty(true);
  };

  useEffect(() => {
    const pendingCommit = pendingCommitRef.current;
    if (pendingCommit && areValuesEqual(resolvedValue, pendingCommit)) {
      pendingCommitRef.current = null;
      setLocalValue(resolvedValue);
      setIsDirty(false);
      return;
    }
    if (!isDirty && !pendingCommit && !areValuesEqual(localValue, resolvedValue)) {
      setLocalValue(resolvedValue);
    }
  }, [value, defaultValue, isDirty, localValue, resolvedValue]);

  useClickOutside({
    isOpen,
    onClose: () => {
      setIsOpen(false);
      if (isDirty) {
        commitSelection(localValue);
      }
    },
    excludeRefs: [buttonRef, containerRef, dropdownRef]
  });

  const selectedValuesSet = useMemo(() => new Set(localValue), [localValue]);
  const optionIndexMap = useMemo(
    () => new Map(normalizedOptions.map((opt, index) => [opt.option, index])),
    [normalizedOptions]
  );
  const optionMap = useMemo(
    () => new Map(normalizedOptions.map((opt) => [opt.option, opt])),
    [normalizedOptions]
  );

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

    if (selectedValuesSet.has(option)) {
      newValue = localValue.filter(v => v !== option);
    } else {
      if (configMaxSelections && localValue.length >= configMaxSelections) {
        setError(`Maximum ${configMaxSelections} selections allowed`);
        return;
      }
      newValue = [...localValue, option];
    }

    setLocalValue(newValue);
    setIsDirty(true);
  };

  const handleRemoveOption = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;
    const newValue = localValue.filter(v => v !== option);
    setLocalValue(newValue);
    if (isOpen) {
      setIsDirty(true);
    } else {
      commitSelection(newValue);
    }
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
          onClick={() => {
            if (disabled || !allowEdit) return;
            if (isOpen && isDirty) {
              commitSelection(localValue);
            }
            setIsOpen(!isOpen);
          }}
          disabled={disabled}
          className={`field-component ${error ? 'border-red-500 bg-red-50' : ''
            } ${disabled || readOnly ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900 cursor-pointer'}`}
        >
          <div className="w-full flex items-center justify-between min-w-0">
            <div className="flex gap-1 min-w-0 flex-1 overflow-hidden max-h-20 overflow-y-auto">
              {localValue.length === 0 ? (
                <span className="text-gray-500 text-sm text-left truncate overflow-hidden whitespace-nowrap flex-1">{placeholder}</span>
              ) : (
                localValue.map((item, index) => {
                  const optIndex = optionIndexMap.get(item);
                  const opt = optionMap.get(item) || { option: item, color: undefined };
                  const style = opt.color ? { backgroundColor: opt.color, color: getReadableTextColor(opt.color) } : undefined;
                  const colorIndex = optIndex ?? index;
                  const cls = opt.color ? '' : getOptionColorClass(colorIndex);
                  return (
                    <div
                      key={`${index}-${item}`}
                      className={`min-w-8 h-6 max-w-32 inline-flex items-center justify-center gap-0.5 p-1 px-2 rounded-xl truncate overflow-hidden whitespace-nowrap flex-shrink-0 ${cls}`}
                      style={style}
                      title={item}
                    >
                      <span className="truncate">{item}</span>
                      {!disabled && !readOnly && (
                        <span //NOSONAR
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
              <SelectOptionsMenu
                options={normalizedOptions}
                readOnly={readOnly || disabled}
                isSelected={(opt) => selectedValuesSet.has(opt.option)}
                isDisabled={(opt) => {
                  const isSelected = selectedValuesSet.has(opt.option);
                  return !!(configMaxSelections && !isSelected && localValue.length >= configMaxSelections);
                }}
                onSelect={(opt) => handleToggleOption(opt.option)}
                emptyMessage="No options available"
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
