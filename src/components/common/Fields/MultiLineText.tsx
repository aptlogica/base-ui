// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState, useEffect, useRef } from "react";
import { Info } from "lucide-react";

interface MultiLineTextProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  placeholderElement?: React.ReactNode;
  maxLength?: number;
  required?: boolean;
  disabled?: boolean;
  isBorder?: boolean;
  className?: string;
  allowEdit?: boolean;
  rows?: number;
  helperText?: string;
  gradientBorder?: boolean;
}

export const MultiLineText: React.FC<MultiLineTextProps> = ({
  label,
  value,
  onChange,
  placeholder = "",
  placeholderElement,
  maxLength = 500,
  required = false,
  disabled = false,
  isBorder = false,
  className = "",
  allowEdit = true,
  helperText,
  rows = 3, // default
  gradientBorder = false,
}) => {
  const [localValue, setLocalValue] = useState<string>(value ?? "");
  const [error, setError] = useState<string | null>(null);
  const prevValueRef = useRef<string>(localValue);

  useEffect(() => {
    const normalizedValue = value ?? "";
    if (normalizedValue !== prevValueRef.current) {
      setLocalValue(normalizedValue);
      prevValueRef.current = normalizedValue;
    }
  }, [value]);

  const validate = (val: string) => {
    if (required && !val.trim()) return "This field is required";
    if (val.length > maxLength) return `Max ${maxLength} characters allowed`;
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Call onChange immediately for real-time updates
    onChange(newValue);
    
    // Clear any previous error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleBlur = () => {
    const validationError = validate(localValue);
    setError(validationError);

    // Update prevValueRef for comparison
    prevValueRef.current = localValue;
  };

  // Fixed consistent height
  const lineHeightRem = 1.5;
  const fixedHeight = `${rows * lineHeightRem}rem`;

  return (
    <div className="w-full relative">
      {/* Label */}
      {label && (
        <label className="field-component-label !text-primary">
          {label}
          {required && <span className="field-component-required">*</span>}
        </label>
      )}

      {/* Single textarea */}
      {gradientBorder ? (
        <div className="relative rounded-xl">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400 to-indigo-700 -z-10"></div>
          <div className="absolute inset-[2px] rounded-xl bg-white -z-10"></div>
          <textarea
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholderElement ? "" : placeholder}
            disabled={disabled}
            readOnly={!allowEdit}
            maxLength={maxLength}
            rows={rows}
            className={`w-full text-[var(--color-text-primary)] p-3 rounded-lg bg-transparent text-sm leading-normal border-none ${className}
              resize-none overflow-y-auto overflow-x-hidden
              whitespace-pre-wrap break-words
              transition-all duration-200 outline-none
              ${error ? "bg-red-50" : ""}
              ${disabled ? "cursor-not-allowed text-gray-400" : "cursor-text"}
            `}
            style={{ height: fixedHeight }}
          />
          {/* Custom placeholder overlay for gradient border */}
          {placeholderElement && !localValue && (
            <div className="absolute top-4 left-4 pointer-events-none text-gray-400 text-sm flex items-center gap-2">
              {placeholderElement}
            </div>
          )}
        </div>
      ) : (
          <textarea
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholderElement ? "" : placeholder}
            disabled={disabled}
            readOnly={!allowEdit}
            maxLength={maxLength}
            rows={rows}
            className={`w-full text-[var(--color-text-primary)] p-3 rounded-[var(--radius-lg)] text-sm leading-normal ${className}
              resize-none overflow-y-auto overflow-x-hidden
              whitespace-pre-wrap break-words
              transition-all duration-200 outline-none
              ${isBorder ? "field-component-border field-component-focus" : ""}
              ${error ? "border-red-500 bg-red-50" : "border"}
              ${disabled ? "cursor-not-allowed text-gray-400" : "cursor-text"}
            `}
            style={{ height: fixedHeight }}
          />

      )}

      {/* Error Icon */}
      {error && (
        <div className="absolute right-2 top-2">
          <Info className="w-4 h-4 text-red-400" />
        </div>
      )}

      {/* Error Text */}
      {error && allowEdit && (
        <div className="mt-1.5 text-red-500 cursor-default">{error}</div>
      )}

      {/* Helper Text */}
      {helperText && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};
