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
  allowEdit?: boolean;
  readOnly?: boolean;
  helperText?: string;
}

// Utility functions
const getInitialValue = (value: number | null, defaultValue?: string | number): string => {
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

const getDisplayValue = (val: number | null, defaultVal: string | number | undefined): string => {
  if (val !== null && val !== undefined) {
    return val.toString();
  }
  if (defaultVal !== null && defaultVal !== undefined) {
    return defaultVal.toString();
  }
  return '';
};

const getPercentValue = (value: number | null, defaultValue?: string | number): number => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (defaultValue !== null && defaultValue !== undefined) {
    if (typeof defaultValue === 'number') {
      return defaultValue;
    }
    if (typeof defaultValue === 'string' && defaultValue.trim()) {
      const parsed = Number.parseFloat(defaultValue);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return 0;
};

const getProgressColorClass = (color: string): string => {
  const colorMap: Record<string, string> = {
    green: 'bg-[var(--color-utility-brand-500)]',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    indigo: 'bg-indigo-500',
    teal: 'bg-teal-500',
  };
  return colorMap[color] || 'bg-[var(--color-utility-brand-500)]';
};

const validatePercent = (val: string, required: boolean): string | null => {
  if (required) return 'This field is required';
  if (!val) return null;

  const numValue = Number.parseFloat(val);
  if (Number.isNaN(numValue)) return 'Please enter a valid percentage';
  if (numValue < 0 || numValue > 100) return 'Percentage must be between 0 and 100';

  return null;
};

const getInputClassName = (error: string | null, showError: boolean, disabled: boolean, readOnly: boolean): string => {
  const baseClass = 'field-component';
  const errorClass = error && showError ? 'border-red-500 bg-red-50' : '';
  const disabledClass = disabled || readOnly ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900';
  return `${baseClass} ${errorClass} ${disabledClass}`;
};

const getDisplayClassName = (localValue: string, disabled: boolean, readOnly: boolean): string => {
  const baseClass = 'field-component';
  const valueClass = localValue ? 'text-gray-800' : 'text-gray-400';
  const disabledClass = disabled || readOnly ? 'text-gray-400 cursor-not-allowed' : '';
  return `${baseClass} ${valueClass} ${disabledClass}`;
};

interface UsePercentStateProps {
  value: number | null;
  defaultValue?: string | number;
  onChange: (value: number | null) => void;
  required: boolean;
  disabled: boolean;
  allowEdit: boolean;
  readOnly: boolean;
}

const usePercentState = ({
  value,
  defaultValue,
  onChange,
  required,
  disabled,
  allowEdit,
  readOnly,
}: UsePercentStateProps) => {
  const [localValue, setLocalValue] = useState(() => getInitialValue(value, defaultValue));
  const [isEditing, setIsEditing] = useState(false);
  const [showError, setShowError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevValueRef = useRef<number | null>(null);

  useEffect(() => {
    const displayValue = getDisplayValue(value, defaultValue);
    setLocalValue(displayValue);

    const parsed = Number.parseFloat(displayValue);
    prevValueRef.current = Number.isNaN(parsed) ? null : parsed;
  }, [value, defaultValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (readOnly && isEditing) {
      setIsEditing(false);
    }
  }, [readOnly, isEditing]);

  const handleEmptyInput = () => {
    onChange(null);
    prevValueRef.current = 0;
    setLocalValue('');
  };

  const resetToPreviousValue = () => {
    const validValue = prevValueRef.current ?? 0;
    onChange(validValue);
    setLocalValue(validValue.toString());
  };

  const handleValidInput = (numValue: number) => {
    const rounded = Number.parseFloat(numValue.toFixed(1));
    if (prevValueRef.current === rounded) {
      setLocalValue(prevValueRef.current?.toString() || '');
    } else {
      onChange(rounded);
      prevValueRef.current = rounded;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replaceAll(/[^0-9.-]/g, '');
    setLocalValue(newValue);
    const validationError = validatePercent(newValue, required);
    setShowError(!!validationError);
  };

  const handleBlur = () => {
    setShowError(false);
    setIsEditing(false);

    if (localValue.trim() === '') {
      handleEmptyInput();
      return;
    }

    const numValue = Number.parseFloat(localValue);
    if (Number.isFinite(numValue)) {
      if (numValue < 0 || numValue > 100) {
        resetToPreviousValue();
        return;
      }
      handleValidInput(numValue);
    } else {
      resetToPreviousValue();
    }
  };

  const handleClick = useClickHandler(
    () => !readOnly && allowEdit && !disabled && setIsEditing(true),
    () => !readOnly && !allowEdit && !disabled && setIsEditing(true)
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (readOnly || disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsEditing(true);
    }
  };

  const error = validatePercent(localValue, required);

  return {
    localValue,
    isEditing,
    setIsEditing,
    showError,
    inputRef,
    error,
    handleChange,
    handleBlur,
    handleClick,
    handleKeyDown,
  };
};

export const Percent: React.FC<PercentProps> = ({
  value,
  onChange,
  config = {},
  required = false,
  disabled = false,
  placeholder = '',
  isBorder = false,
  allowEdit = true,
  readOnly = false,
  helperText,
}) => {
  const { displayAsProgress = false, defaultValue, progressColor = 'blue' } = config;

  const {
    localValue,
    isEditing,
    setIsEditing,
    showError,
    inputRef,
    error,
    handleChange,
    handleBlur,
    handleClick,
    handleKeyDown,
  } = usePercentState({
    value,
    defaultValue,
    onChange,
    required,
    disabled,
    allowEdit,
    readOnly,
  });

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (displayAsProgress && !disabled && !readOnly) {
      setIsEditing(true);
      e.stopPropagation();
    }
  };

  const percentValue = getPercentValue(value, defaultValue);
  const progress = Math.max(0, Math.min(100, percentValue));
  const inputClassName = getInputClassName(error, showError, disabled, readOnly);
  const displayClassName = getDisplayClassName(localValue, disabled, readOnly);
  const borderClassName = isBorder ? "field-component-border-" : "";
  const baseClassName = `w-full relative ${borderClassName}`;

  if (displayAsProgress) {
    const progressBar = (
      <div className="w-full p-3 flex align-center justify-center">
        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-1 rounded-full ${getProgressColorClass(progressColor)}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );

    const progressInput = (
      <div className="mb-2">
        <div className="relative group">
          <input
            ref={inputRef}
            type="text"
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled || readOnly}
            className={inputClassName}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            <PercentageIcon className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      </div>
    );

    const cursorStyle = !isEditing && !disabled && !readOnly ? 'pointer' : 'default';
    return (
      <div
        className={baseClassName}
        onDoubleClick={readOnly ? undefined : handleDoubleClick}
        style={{ cursor: cursorStyle }}
      >
        {isEditing ? progressInput : progressBar}
      </div>
    );
  }

  const standardInput = (
    <div className="relative group">
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder=""
        autoFocus
        disabled={disabled || readOnly}
        className={inputClassName}
      />
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
        <PercentageIcon className="w-4 h-4 text-gray-500" />
      </div>
    </div>
  );

  const standardDisplay = (
    <div className={displayClassName}>
      {localValue || placeholder}
    </div>
  );

  return (
    <div
      className={baseClassName}
      onClick={readOnly ? undefined : handleClick}
      onKeyDown={readOnly ? undefined : handleKeyDown}
      role={readOnly ? undefined : "button"}
      tabIndex={readOnly || disabled ? -1 : 0}
      aria-label={readOnly ? undefined : "Edit percent value"}
      style={readOnly ? { cursor: 'default' } : undefined}
    >
      {isEditing ? standardInput : standardDisplay}
      {helperText && allowEdit && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};
