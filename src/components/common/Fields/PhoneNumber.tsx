import React, { useState, useEffect, useRef } from "react";
import { Info } from "lucide-react";
import { useClickHandler } from "../../../utils/helpers";

interface PhoneNumberProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  countryCode?: string;
  required?: boolean;
  disabled?: boolean;
  isBorder?: boolean;
  className?: string;
  allowEdit?: boolean;
  helperText?: string;
  icon?: string;
  config?: {
    phoneValid?: boolean;
    defaultValue?: string;
    description?: string;
    countryCode?: string;
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
  countryCode = "+1",
  required = false,
  disabled = false,
  isBorder = false,
  className = "",
  allowEdit = true,
  helperText,
  icon = "",
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

  const validatePhone = (phone: string) => {
    const phoneStr = String(phone ?? "");
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phoneStr.replace(/[\s\-\(\)]/g, ""));
  };

  // keep only digits when numeric-only is desired
  const sanitizeInput = (val: string) => val.replace(/\D/g, "");

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
    }else{
      setLocalValue(prevValueRef.current);
    }

    setIsEditing(false);
  };

  const formatPhoneNumber = (phone: string) => {
    const phoneStr = String(phone ?? "");
    const cleaned = phoneStr.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) return `(${match[1]}) ${match[2]}-${match[3]}`;
    return phoneStr;
  };

  const handleClick = useClickHandler(
    () => allowEdit && !disabled && setIsEditing(true),
    () => !allowEdit && !disabled && setIsEditing(true)
  );

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
        onClick={handleClick}
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
              const text = (e.clipboardData || (window as any).clipboardData)?.getData("text") ?? "";
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
            disabled={disabled}
            className={`field-component ${isBorder ? "field-component-focus" : ""} ${
              error ? "border-red-500 bg-red-50" : "border-gray-300"
            } ${disabled ? "cursor-not-allowed" : ""}`}
          />
        ) : (
          <div
            className={`field-component ${
              localValue ? "text-gray-800" : "text-gray-400"
            } ${disabled ? "text-gray-400 cursor-not-allowed" : ""} max-w-full overflow-hidden`}
            style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {formatDisplay ? formatPhoneNumber(localValue) : localValue || configPlaceholder}
          </div>
        )}

        {/* Error Icon */}
        {/* {error && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <Info className="w-4 h-4 text-red-400" />
          </div>
        )} */}
      </div>

      {/* Error Text */}
      {/* {error && allowEdit && <div className="mt-1.5 text-red-500 cursor-default">{error}</div>} */}

      {/* Helper Text */}
      {helperText && allowEdit && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};
