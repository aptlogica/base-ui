import React, { useState, useEffect, useRef } from 'react';
import { Percent as PercentageIcon } from 'lucide-react';
import { useClickHandler } from '../../../utils/helpers';

interface PercentConfig {
  displayAsProgress?: boolean;
  defaultValue?: string | number;
  progressColor?: string;
  [key: string]: any;
}

interface PercentProps {
  value: number | null;
  onChange: (value: number | null) => void;
  config?: PercentConfig;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  isBorder?: boolean;
  className?: string;
  allowEdit?: boolean;
  helperText?: string;
  icon?: string;
}

export const Percent: React.FC<PercentProps> = ({
  value,
  onChange,
  config = {},
  required = false,
  disabled = false,
  placeholder = '',
  isBorder = false,
  className = "",
  allowEdit = true,
  helperText,
  icon = "",
}) => {
  const { displayAsProgress = false, defaultValue, progressColor = 'blue' } = config;

  const getInitialValue = () => {
    if (value !== null && value !== undefined) return value.toString();
    if (defaultValue !== null && defaultValue !== undefined) {
      if (typeof defaultValue === 'number') {
        return defaultValue.toString();
      }
      if (typeof defaultValue === 'string' && defaultValue.trim()) {
        return defaultValue.trim();
      }
    }
    return '';
  };

  const [localValue, setLocalValue] = useState(getInitialValue());
  const [isEditing, setIsEditing] = useState(false);
  const [showError, setShowError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevValueRef = useRef<number | null>(null);

  useEffect(() => {
    const displayValue =
      value !== null && value !== undefined
        ? value.toString()
        : defaultValue !== null && defaultValue !== undefined
        ? defaultValue.toString()
        : '';
    setLocalValue(displayValue);

    const parsed = parseFloat(displayValue);
    prevValueRef.current = !isNaN(parsed) ? parsed : null;
  }, [value, defaultValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const validate = (val: string) => {
    if (required ) return 'This field is required';
    if (!val)return null;

    const numValue = parseFloat(val);
    if (isNaN(numValue)) return 'Please enter a valid percentage';
    if (numValue < 0 || numValue > 100) return 'Percentage must be between 0 and 100';

    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^0-9.-]/g, '');
    setLocalValue(newValue);
    const validationError = validate(newValue);
    setShowError(!!validationError);
  };

  const handleBlur = () => {
    setShowError(false);
    setIsEditing(false);

    if (localValue.trim() === '') {
      // Set to 0 when input is empty
      onChange(null);
      prevValueRef.current = 0;
      setLocalValue('');
      return;
    }

    const numValue = parseFloat(localValue);
    if (!isNaN(numValue)) {
      // Clear invalid values instead of showing error
      if (numValue < 0 || numValue > 100) {
        // Reset to previous valid value or 0
        const validValue = prevValueRef.current !== null ? prevValueRef.current : 0;
        onChange(validValue);
        setLocalValue(validValue.toString());
        return;
      }

      const rounded = parseFloat(numValue.toFixed(1));

      // ✅ Only trigger API call if numeric value actually changed
      if (prevValueRef.current !== rounded) {
        onChange(rounded);
        prevValueRef.current = rounded;
      } else {
        setLocalValue(prevValueRef.current?.toString() || '');
      }
    } else {
      // Clear invalid non-numeric values
      const validValue = prevValueRef.current !== null ? prevValueRef.current : 0;
      onChange(validValue);
      setLocalValue(validValue.toString());
    }
  };

  // 🟢 Special case: double-click only when showing progress bar
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (displayAsProgress && !disabled) {
      setIsEditing(true);
      e.stopPropagation();
    }
  };

  // 🟢 Otherwise, use generic click handler logic
  const handleClick = useClickHandler(
    () => allowEdit && !disabled && setIsEditing(true), // single click
    () => !allowEdit && !disabled && setIsEditing(true) // double click
  );

  const error = validate(localValue);

  const getPercentValue = () => {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (defaultValue !== null && defaultValue !== undefined) {
      if (typeof defaultValue === 'number') {
        return defaultValue;
      }
      if (typeof defaultValue === 'string' && defaultValue.trim()) {
        const parsed = parseFloat(defaultValue);
        if (!isNaN(parsed)) return parsed;
      }
    }
    return 0;
  };

  const percentValue = getPercentValue();
  const progress = Math.max(0, Math.min(100, percentValue));

  if (displayAsProgress) {
    return (
      <div
        className={`w-full relative ${isBorder ? "field-component-border" : ""}`}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: !isEditing && !disabled ? 'pointer' : undefined }}
      >
        {isEditing ? (
          <div className="relative group mb-2">
            <input
              ref={inputRef}
              type="text"
              value={localValue}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={placeholder}
              disabled={disabled}
              className={`field-component ${error && showError ? 'border-red-500 bg-red-50' : ''
                } ${disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900'}`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <PercentageIcon className="w-4 h-4 text-gray-500" />
            </div>
          </div>
        ) : (
          <div className="w-full flex align-center justify-center">
            <div className="w-[90%] h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-1 rounded-full ${progressColor === 'green'
                  ? 'bg-[var(--color-utility-brand-500)]'
                  : progressColor === 'blue'
                    ? 'bg-blue-500'
                    : progressColor === 'yellow'
                      ? 'bg-yellow-500'
                      : progressColor === 'orange'
                        ? 'bg-orange-500'
                        : progressColor === 'red'
                          ? 'bg-red-500'
                          : progressColor === 'purple'
                            ? 'bg-purple-500'
                            : progressColor === 'pink'
                              ? 'bg-pink-500'
                              : progressColor === 'indigo'
                                ? 'bg-indigo-500'
                                : progressColor === 'teal'
                                  ? 'bg-teal-500'
                                  : 'bg-[var(--color-utility-brand-500)]'
                  }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`w-full relative ${isBorder ? "field-component-border" : ""}`}
      onClick={handleClick}
    >
      {isEditing ? (

        <div className="relative group">
          <input
            ref={inputRef}
            type="text"
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder=""
            autoFocus
            disabled={disabled}
            className={`field-component ${error && showError ? 'border-red-500 bg-red-50' : ''
              } ${disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900'}`}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            <PercentageIcon className="w-4 h-4 text-gray-500" />
          </div>

        </div>
      ) : (
        <div
          className={`field-component ${localValue ? "text-gray-800" : "text-gray-400"
            } ${disabled ? "text-gray-400 cursor-not-allowed" : ""}`}
        >
          {localValue || placeholder}
        </div>
      )
      }

      {/* Error Text - Removed to clear invalid values instead */}

      {/* Helper Text */}
      {helperText && allowEdit && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};
