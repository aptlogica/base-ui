import React, { useState, useEffect } from "react";
import { useClickHandler } from "../../../utils/helpers";

interface NumberConfig {
  defaultValue?: number | string;
  showThousands?: boolean;
  [key: string]: any;
}

interface NumberFieldProps {
  label?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  config?: NumberConfig;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  isBorder?: boolean;
  className?: string;
  allowEdit?: boolean; // true = single click, false = double click
  readOnly?: boolean; // true = completely prevent editing
  helperText?: string;
}

export const NumberField: React.FC<NumberFieldProps> = ({
  label,
  value,
  onChange,
  config = {},
  placeholder = "",
  required = false,
  disabled = false,
  isBorder = false,
  className = "",
  allowEdit = true,
  readOnly = false,
  helperText,
}) => {
  const { defaultValue = null, showThousands = false } = config;

  const MAX_DIGITS = 10; // Maximum 10 digits allowed

  const getInitialValue = () => {
    if (value !== null && value !== undefined && value !== "") return value;
    if (defaultValue !== null && defaultValue !== undefined) {
      return defaultValue.toString();
    }
    return "";
  };

  const [localValue, setLocalValue] = useState(getInitialValue());
  const [isEditing, setIsEditing] = useState(false);

  // keep local value in sync if prop changes
  useEffect(() => {
    let displayValue = "";
    if (value !== null && value !== undefined && value !== "") {
      displayValue = value;
    } else if (defaultValue !== null && defaultValue !== undefined) {
      displayValue = defaultValue.toString();
    }
    setLocalValue(displayValue);
  }, [value, defaultValue, showThousands]);

  // Exit edit mode if readOnly becomes true
  useEffect(() => {
    if (readOnly && isEditing) {
      setIsEditing(false);
    }
  }, [readOnly, isEditing]);

  // Safe numeric validation without regex backtracking vulnerability
  const isValidNumericFormat = (str: string): boolean => {
    if (!str) return false;
    
    let hasDecimal = false;
    let hasDigit = false;
    let startIndex = 0;
    
    // Check for optional minus sign at start
    if (str.startsWith('-')) {
      startIndex = 1;
      if (str.length === 1) return false; // Just a minus sign is invalid
    }
    
    // Validate each character
    for (let i = startIndex; i < str.length; i++) {
      const char = str[i];
      if (char === '.') {
        if (hasDecimal) return false; // Multiple decimal points
        hasDecimal = true;
      } else if (char >= '0' && char <= '9') {
        hasDigit = true;
      } else {
        return false; // Invalid character
      }
    }
    
    // Must have at least one digit
    return hasDigit;
  };

  const validate = (val: string) => {
    if (required && !val.trim()) return "This field is required";
    if (val.trim() === "") return null;

    const cleanVal = val.replaceAll(",", "");
    if (!isValidNumericFormat(cleanVal)) return "Invalid number";

    // Check total digits (excluding decimal point and minus sign)
    const digitsOnly = cleanVal.split('').filter(char => char >= '0' && char <= '9').join('');
    if (digitsOnly.length > MAX_DIGITS) {
      return `Number too large (max ${MAX_DIGITS} digits)`;
    }

    return null;
  };

  // Safe function to add thousands separators without regex backtracking vulnerability
  const addThousandsSeparator = (integerPart: string): string => {
    if (integerPart.length <= 3) return integerPart;
    
    // Process from right to left, adding commas every 3 digits
    let result = "";
    let count = 0;
    for (let i = integerPart.length - 1; i >= 0; i--) {
      if (count > 0 && count % 3 === 0) {
        result = "," + result;
      }
      result = integerPart[i] + result;
      count++;
    }
    return result;
  };

  const formatNumberWithThousands = (value: string): string => {
    if (!value) return "";
    const cleanValue = value.toString().replaceAll(",", "");
    if (!showThousands) return cleanValue;

    const parts = cleanValue.split(".");
    const integerPart = parts[0];
    const decimalPart = parts[1];
    const formattedInteger = addThousandsSeparator(integerPart);
    return decimalPart
      ? `${formattedInteger}.${decimalPart}`
      : formattedInteger;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Remove commas for validation but keep original input
    const cleanValue = newValue.replaceAll(",", "");

    // Check digit limit during input
    const digitsOnly = cleanValue.split('').filter(char => char >= '0' && char <= '9').join('');
    if (digitsOnly.length <= MAX_DIGITS) {
      setLocalValue(newValue);
    }
  };

  const handleBlur = () => {
    const cleanValue = localValue.replaceAll(",", "");

    const validationError = validate(cleanValue);

    // Only save if valid, otherwise clear the value silently
    if (validationError === null) {
      const finalValue = cleanValue.trim() === "" ? null : cleanValue;

      if (finalValue !== (value ?? null)) {
        onChange(finalValue);
      }
    } else {
      // Invalid value - clear it silently
      setLocalValue("");
      onChange(null);
    }

    setIsEditing(false);
  };


  // allowEdit controls single vs double-click behavior
  // readOnly completely prevents editing
  const handleClick = useClickHandler(
    () => !readOnly && allowEdit && !disabled && setIsEditing(true), // Single click when allowEdit=true
    () => !readOnly && !allowEdit && !disabled && setIsEditing(true) // Double click when allowEdit=false
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (readOnly || disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsEditing(true);
    }
  };

  // Get display value with thousands separator if enabled
  const getDisplayValue = () => {
    if (!localValue) return "";
    return formatNumberWithThousands(localValue);
  };

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label className="field-component-label">
          {label}
          {required && <span className="field-component-required">*</span>}
        </label>
      )}

      {/* Input or Display */}
      <div
        className={`relative ${className} ${isBorder ? "field-component-border" : ""
          }`}
        onClick={readOnly ? undefined : handleClick}
        onKeyDown={readOnly ? undefined : handleKeyDown}
        role={readOnly ? undefined : "button"}
        tabIndex={readOnly || disabled ? undefined : 0}
        style={readOnly ? { cursor: 'default' } : undefined}
      >
        {isEditing ? (
          <input
            type="text"
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            autoFocus
            placeholder={placeholder}
            disabled={disabled || readOnly}
            className={`field-component ${disabled || readOnly ? "text-gray-400 cursor-not-allowed" : "text-gray-900"}`}
          />
        ) : (
          <div
            className={`field-component ${localValue ? "text-gray-800" : "text-gray-400"
              } ${disabled || readOnly ? "text-gray-400 cursor-not-allowed" : ""}`}
          >
            {getDisplayValue() || placeholder}
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
