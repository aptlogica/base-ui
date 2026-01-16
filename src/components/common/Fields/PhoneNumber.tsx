import React, { useState, useEffect, useRef } from "react";
import { useClickHandler } from "../../../utils/helpers";

interface PhoneNumberProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  isBorder?: boolean;
  className?: string;
  allowEdit?: boolean; // true = single click, false = double click
  readOnly?: boolean; // true = completely prevent editing
  helperText?: string;
  config?: {
    phoneValid?: boolean;
    defaultValue?: string;
    description?: string;
    formatDisplay?: boolean;
    placeholder?: string;
    [key: string]: any;
  };
}

export const PhoneNumber: React.FC<PhoneNumberProps> = ({
  label,
  value,
  onChange,
  placeholder = "Enter phone number...",
  required = false,
  disabled = false,
  isBorder = false,
  className = "",
  allowEdit = true,
  readOnly = false,
  helperText,
  config = {},
}) => {
  const {
    phoneValid = true,
    defaultValue = "",
    formatDisplay = true,
    placeholder: configPlaceholder = placeholder,
  } = config;

  const [localValue, setLocalValue] = useState<string>(value ?? defaultValue ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // store last committed value to prevent unnecessary API calls
  const prevValueRef = useRef<string>(localValue);

  // sync props → local state
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

  const validatePhone = (phone: string) => {
    const phoneStr = String(phone ?? "");
    const phoneRegex = /^\+?[1-9]\d{0,15}$/;
    return phoneRegex.test(phoneStr.replaceAll(/[\s\-()]/g, ""));
  };

  // keep only digits when numeric-only is desired
  const sanitizeInput = (val: string) => val.replaceAll(/\D/g, "");

  const validate = (val: string) => {
    if (required && !val.trim()) return "This field is required";
    if (val.trim() === "") return null;
    if (phoneValid && !validatePhone(val)) return "Please enter a valid phone number";
    return null;
  };

  const handleBlur = () => {
    const validationError = validate(localValue);
    setError(validationError);

    if (!validationError && prevValueRef.current !== localValue) {
      onChange(localValue);
      prevValueRef.current = localValue;
    } else {
      setLocalValue(prevValueRef.current);
    }

    setIsEditing(false);
  };

  const formatPhoneNumber = (phone: string) => {
    const phoneStr = String(phone ?? "");
    const cleaned = phoneStr.replaceAll(/\D/g, "");
    const phoneRegex = /^(\d{3})(\d{3})(\d{4})$/;
    const match = phoneRegex.exec(cleaned);
    if (match) return `(${match[1]}) ${match[2]}-${match[3]}`;
    return phoneStr;
  };

  // allowEdit controls single vs double-click behavior
  // readOnly completely prevents editing
  const handleClick = useClickHandler(
    () => !readOnly && allowEdit && !disabled && setIsEditing(true), // Single click when allowEdit=true
    () => !readOnly && !allowEdit && !disabled && setIsEditing(true), // Double click when allowEdit=false
    1
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (readOnly || disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsEditing(true);
    }
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
        className={`relative ${className} ${isBorder ? "field-component-border" : ""}`}
        onClick={readOnly ? undefined : handleClick}
        onKeyDown={readOnly ? undefined : handleKeyDown}
        role={readOnly ? undefined : "button"}
        tabIndex={readOnly || disabled ? -1 : 0}
        aria-label={readOnly ? undefined : "Edit phone number"}
        style={readOnly ? { cursor: 'default' } : undefined}
      >
        {isEditing ? (
          <input
            type="tel"
            value={localValue}
            onChange={(e) => {
              const incoming = e.target.value;
              setLocalValue(phoneValid ? sanitizeInput(incoming) : incoming);
            }}
            onPaste={(e) => {
              if (!phoneValid) return;
              e.preventDefault();
              const text = (e.clipboardData || (globalThis as any).clipboardData)?.getData("text") ?? "";
              setLocalValue(sanitizeInput(text));
            }}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleBlur();
              if (e.key === "Escape") {
                setLocalValue(prevValueRef.current);
                setIsEditing(false);
              }
            }}
            autoFocus
            placeholder={configPlaceholder}
            disabled={disabled || readOnly}
            className={`field-component ${isBorder ? "field-component-focus" : ""} ${error ? "border-red-500 bg-red-50" : "border-gray-300"
              } ${disabled || readOnly ? "cursor-not-allowed" : ""}`}
          />
        ) : (
          <div
            className={`field-component ${localValue ? "text-gray-800" : "text-gray-400"
              } ${disabled || readOnly ? "text-gray-400 cursor-not-allowed" : ""} max-w-full overflow-hidden`}
            style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {localValue ? (formatDisplay ? formatPhoneNumber(localValue) : localValue) : configPlaceholder}
          </div>
        )}
      </div>

      {/* Helper Text */}
      {helperText && allowEdit && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};
