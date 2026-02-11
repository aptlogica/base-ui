import React, { useState, useEffect, useRef } from "react";
import { Info } from "lucide-react";
import { useClickHandler } from "../../../utils/helpers";

interface SingleLineTextProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  disabled?: boolean;
  isBorder?: boolean;
  className?: string;
  allowEdit?: boolean; // true = single click, false = double click
  readOnly?: boolean; // true = completely prevent editing
  helperText?: string;
  updateOnType?: boolean;
  config?: {
    defaultValue?: string;
    maxLength?: number;
    placeholder?: string;
    [key: string]: any;
  };
}

// Helper functions to reduce cognitive complexity
const getContainerClassName = (className: string, isBorder: boolean, isEditing: boolean): string => {
  const borderClass = isBorder && !isEditing ? "field-component-border" : "";
  return `relative ${className} ${borderClass}`;
};

const getInputClassName = (isBorder: boolean, error: string | null, disabled: boolean, readOnly: boolean): string => {
  const focusClass = isBorder ? "field-component-focus" : "";
  const errorClass = error ? "border-red-500 bg-red-50" : "border-gray-300";
  const disabledClass = disabled || readOnly ? "cursor-not-allowed" : "";
  return `field-component ${focusClass} ${errorClass} ${disabledClass}`;
};

const getDisplayClassName = (localValue: string, disabled: boolean, readOnly: boolean): string => {
  const textClass = localValue ? "text-gray-800" : "text-gray-400";
  const interactionClass = disabled || readOnly ? "text-gray-400 cursor-not-allowed" : "";
  return `field-component ${textClass} ${interactionClass}`;
};

export const SingleLineText: React.FC<SingleLineTextProps> = ({
  label,
  value,
  onChange,
  placeholder = "",
  maxLength = 255,
  required = false,
  disabled = false,
  isBorder = false,
  className = "",
  allowEdit = true,
  readOnly = false,
  helperText,
  updateOnType = false,
  config = {},
}) => {
  const {
    defaultValue = "",
    maxLength: configMaxLength = maxLength,
    placeholder: configPlaceholder = placeholder,
  } = config;

  const [localValue, setLocalValue] = useState<string>(value ?? defaultValue ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const prevValueRef = useRef<string>(localValue);

  useEffect(() => {
    if (value !== undefined && value !== prevValueRef.current) {
      setLocalValue(value);
      prevValueRef.current = value;
    }
  }, [value]);

  // Exit edit mode if readOnly becomes true
  useEffect(() => {
    if (readOnly && isEditing) {
      setIsEditing(false);
    }
  }, [readOnly, isEditing]);

  const validate = (val: string) => {
    if (required && !val.trim()) return "This field is required";
    if (val.length > configMaxLength) return `Max ${configMaxLength} characters allowed`;
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    setError(validate(val));
    
    if (updateOnType) {
      onChange(val);
      prevValueRef.current = val;
    }
  };

  const handleBlur = () => {
    const validationError = validate(localValue);
    setError(validationError);

    if (!validationError && prevValueRef.current !== localValue) {
      onChange(localValue);
      prevValueRef.current = localValue;
    }
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleBlur();
    if (e.key === "Escape") {
      setLocalValue(prevValueRef.current);
      setIsEditing(false);
    }
  };

  // allowEdit controls single vs double-click behavior
  // readOnly completely prevents editing
  const handleClick = useClickHandler(
    () => !readOnly && allowEdit && !disabled && setIsEditing(true), // Single click when allowEdit=true
    () => !readOnly && !allowEdit && !disabled && setIsEditing(true) // Double click when allowEdit=false
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (readOnly || disabled) return;
    // Only handle key for the div itself, not when input is focused
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsEditing(true);
    }
    // Don't handle space here - let it be typed normally
  };

  return (
    <div className="w-full relative">
      {/* Label */}
      {label && (
        <label className="field-component-label">
          {label}
          {required && <span className="field-component-required">*</span>}
        </label>
      )}

      {/* Input or Display */}
      <div
        className={getContainerClassName(className, isBorder, isEditing)}
        onClick={readOnly ? undefined : handleClick}
        onKeyDown={readOnly || isEditing ? undefined : handleKeyDown}
        role={readOnly ? undefined : "button"}
        tabIndex={readOnly || disabled ? -1 : 0}
        aria-label={readOnly ? undefined : "Edit text"}
        style={readOnly ? { cursor: 'default' } : undefined}
      >
        {isEditing ? (
          <input
            type="text"
            value={localValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onKeyDown={handleInputKeyDown}
            autoFocus
            placeholder={configPlaceholder}
            disabled={disabled || readOnly}
            maxLength={configMaxLength}
            className={getInputClassName(isBorder, error, disabled, readOnly)}
          />
        ) : (
          <div
            className={getDisplayClassName(localValue, disabled, readOnly)}
            title={localValue || configPlaceholder}
          >
            <span
              className="block overflow-hidden text-ellipsis whitespace-nowrap w-full min-w-0"
            >
              {localValue || configPlaceholder}
            </span>
          </div>
        )}

        {/* Error Icon */}
        {error && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <Info className="w-4 h-4 text-red-400" />
          </div>
        )}
      </div>

      {/* Error Text */}
      {error && allowEdit && (
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
