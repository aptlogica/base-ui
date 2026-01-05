import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useClickHandler } from "../../../utils/helpers";

interface DecimalProps {
  label?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  required?: boolean;
  decimals?: number;
  showThousands?: boolean;
  disabled?: boolean;
  isBorder?: boolean;
  className?: string;
  allowEdit?: boolean; // true = single click, false = double click
  readOnly?: boolean; // true = completely prevent editing
  helperText?: string;
  icon?: string;
  config?: {
    defaultValue?: number | string;
    precision?: number;
    showThousands?: boolean;
    description?: string;
    [key: string]: any;
  };
}

export const Decimal: React.FC<DecimalProps> = ({
  label,
  value,
  onChange,
  placeholder = "",
  required = false,
  decimals = 2,
  showThousands = false,
  disabled = false,
  isBorder = false,
  className = "",
  allowEdit = true,
  readOnly = false,
  helperText,
  icon = "",
  config = {},
}) => {
  const {
    defaultValue = null,
    precision = decimals,
    showThousands: configShowThousands = showThousands,
  } = config;

  const [localValue, setLocalValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const isUpdatingRef = useRef(false); // Track if we're updating to prevent render cycle

  // --- Utils ---
  // Memoize formatValue to prevent recreation on every render
  const formatValue = useCallback((val: number | null) => {
    if (val === null || val === undefined) return "";
    if (typeof val !== "number" || isNaN(val)) return "";

    const formatted = val.toFixed(precision);

    if (configShowThousands) {
      const [integer, decimal] = formatted.split(".");
      const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return decimal !== undefined ? `${formattedInteger}.${decimal}` : formattedInteger;
    }

    return formatted;
  }, [precision, configShowThousands]);

  const parseNumber = (val: string): number | null => {
    if (!val.trim()) return null;
    const clean = val.replace(/,/g, "");
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
  };

  const validate = (val: string): string | null => {
    if (required && !val.trim()) return "This field is required";
    if (!val.trim()) return null;
    return parseNumber(val) === null ? "Please enter a valid decimal" : null;
  };

  // --- Init / sync ---
  useEffect(() => {
    // Skip if we're in the middle of updating (prevents render cycle)
    if (isUpdatingRef.current) {
      isUpdatingRef.current = false;
      return;
    }
    
    if (!isEditing) {
      // Handle value display: use value if it exists, otherwise use defaultValue
      let displayValue: number | null = value;
      // Only use defaultValue if value is explicitly null/undefined (not 0)
      if ((value === null || value === undefined) && defaultValue != null) {
        displayValue =
          typeof defaultValue === "string"
            ? parseFloat(defaultValue) || null
            : Number(defaultValue);
      }
      setLocalValue(formatValue(displayValue));
    }
  }, [value, defaultValue, formatValue, isEditing]);

  // Exit edit mode if readOnly becomes true
  useEffect(() => {
    if (readOnly && isEditing) {
      setIsEditing(false);
    }
  }, [readOnly, isEditing]);

  // --- Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Only update local value during typing, don't save yet
    setLocalValue(raw);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const clean = localValue.replace(/,/g, "");
    const num = parseNumber(clean);
    
    // Only save on blur, not during typing
    if (num !== null) {
      // Valid number - round to precision and format
      // Use Math.round for better precision handling than toFixed + parseFloat
      const multiplier = Math.pow(10, precision);
      const roundedValue = Math.round(num * multiplier) / multiplier;
      
      // Format and update local value immediately (before onChange)
      const formatted = formatValue(roundedValue);
      setLocalValue(formatted);
      
      // Mark that we're updating to prevent useEffect from running
      isUpdatingRef.current = true;
      
      // Only call onChange if value actually changed
      if (roundedValue !== (value ?? null)) {
        onChange(roundedValue);
      }
    } else {
      // Empty or invalid - clear silently and save as null (not 0)
      setLocalValue("");
      
      // Mark that we're updating to prevent useEffect from running
      isUpdatingRef.current = true;
      
      // Only call onChange if value actually changed (wasn't already null)
      if (value !== null && value !== undefined) {
        onChange(null);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setLocalValue(formatValue(value));
    }
  };

  // allowEdit controls single vs double-click behavior
  // readOnly completely prevents editing
  const handleClick = useClickHandler(
    () => !readOnly && allowEdit && !disabled && setIsEditing(true), // Single click when allowEdit=true
    () => !readOnly && !allowEdit && !disabled && setIsEditing(true) // Double click when allowEdit=false
  );

  return (
    <div className="w-full relative">
      {label && (
        <label className="field-component-label">
          {label}
          {required && <span className="field-component-required">*</span>}
        </label>
      )}

      <div 
        className={`relative ${className} ${isBorder ? "field-component-border" : ""}`} 
        onClick={!readOnly ? handleClick : undefined}
        style={readOnly ? { cursor: 'default' } : undefined}
      >
        {isEditing ? (
          <div className="relative">
            <input
              type="text"
              value={localValue}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              placeholder={placeholder}
              disabled={disabled || readOnly}
              className={`field-component ${disabled || readOnly ? "text-gray-400 cursor-not-allowed" : "text-gray-900"}`}
            />
          </div>
        ) : (
          <div
            className={`field-component
            ${disabled || readOnly ? "text-gray-400 cursor-not-allowed" : "text-gray-900"}`}
          >
            {localValue || <div className="text-gray-400">{placeholder}</div>}
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
