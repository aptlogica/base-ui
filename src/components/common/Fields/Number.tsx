import React, { useState, useEffect } from "react";
import { useClickHandler } from "../../../utils/helpers";

interface NumberConfig {
  defaultValue?: number | string;
  showThousands?: boolean;
  [key: string]: any;
}

interface NumberProps {
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
  icon?: string;
}

export const Number: React.FC<NumberProps> = ({
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
  icon = "",
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

    // if (showThousands && displayValue) {
    //   setLocalValue(formatNumberWithThousands(displayValue));
    // } else {
      setLocalValue(displayValue);
    // }
  }, [value, defaultValue, showThousands]);

  // Exit edit mode if readOnly becomes true
  useEffect(() => {
    if (readOnly && isEditing) {
      setIsEditing(false);
    }
  }, [readOnly, isEditing]);

  const validate = (val: string) => {
    if (required && !val.trim()) return "This field is required";
    if (val.trim() === "") return null;

    const cleanVal = val.replace(/,/g, "");
    const numericRegex = /^-?\d*\.?\d*$/;
    if (!numericRegex.test(cleanVal)) return "Invalid number";

    // Check total digits (excluding decimal point and minus sign)
    const digitsOnly = cleanVal.replace(/[.-]/g, "");
    if (digitsOnly.length > MAX_DIGITS) {
      return `Number too large (max ${MAX_DIGITS} digits)`;
    }

    return null;
  };

 const formatNumberWithThousands = (value: string): string => {
    if (!value) return "";
    const cleanValue = value.toString().replace(/,/g, "");
    if (!showThousands) return cleanValue;
    
    const parts = cleanValue.split(".");
    const integerPart = parts[0];
    const decimalPart = parts[1];
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return decimalPart
      ? `${formattedInteger}.${decimalPart}`
      : formattedInteger;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Remove commas for validation but keep original input
    const cleanValue = newValue.replace(/,/g, "");
    
    // Check digit limit during input
    const digitsOnly = cleanValue.replace(/[.-]/g, "");
    if (digitsOnly.length <= MAX_DIGITS) {
      setLocalValue(newValue);
    }
  };

  const handleBlur = () => {
    const cleanValue = localValue.replace(/,/g, "");

    const validationError = validate(cleanValue);

    // Only save if valid, otherwise clear the value silently
    if (!validationError) {
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
        className={`relative ${className} ${
          isBorder ? "field-component-border" : ""
        }`}
        onClick={!readOnly ? handleClick : undefined}
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
            className={`field-component ${
              localValue ? "text-gray-800" : "text-gray-400"
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
