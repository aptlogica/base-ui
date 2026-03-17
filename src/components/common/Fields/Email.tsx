// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useEffect, useState } from "react";
import { useClickHandler } from "../../../utils/helpers";

interface EmailProps {
  label?: string;
  value: string;
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
    emailValid?: boolean;
    defaultValue?: string;
    [key: string]: any;
  };
}

export const Email: React.FC<EmailProps> = ({
  label,
  value,
  onChange,
  placeholder = "",
  required = false,
  disabled = false,
  isBorder = false,
  className = "",
  allowEdit = true,
  readOnly = false,
  helperText,
  config = {},
}) => {
  const { emailValid = true, defaultValue = "" } = config;

  const [localValue, setLocalValue] = useState(value || defaultValue || "");
  const [committedValue, setCommittedValue] = useState(value || defaultValue || "");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const displayValue = value || defaultValue || "";
    setLocalValue(displayValue);
    setCommittedValue(displayValue);
  }, [value, defaultValue]);

  // Exit edit mode if readOnly becomes true
  useEffect(() => {
    if (readOnly && isEditing) {
      setIsEditing(false);
    }
  }, [readOnly, isEditing]);

  // Safe email validation without ReDoS vulnerability
  // Limits input length and uses non-backtracking pattern

  const validateEmailLength = (email: string): boolean => {
    return email !== null && email !== undefined && email.length > 0 && email.length <= 320;
  };

  const validateLocalPart = (localPart: string): boolean => {
    if (!localPart || localPart.length === 0 || localPart.length > 64) return false;
    if (/\s/.test(localPart)) return false;
    return /^[a-zA-Z0-9._%+-]+$/.test(localPart);
  };

  const validateDomainSegments = (domainParts: string[]): boolean => {
    for (const segment of domainParts) {
      if (!segment || segment.length === 0) return false;
      if (!/^[a-zA-Z0-9-]+$/.test(segment)) return false;

      const isLastSegment = segment === domainParts.at(-1);
      if (isLastSegment && (segment.length < 2 || segment.startsWith('-'))) {
        return false;
      }
    }
    return true;
  };

  const validateDomainPart = (domainPart: string): boolean => {
    if (!domainPart || domainPart.length === 0 || domainPart.length > 255) return false;
    if (/\s/.test(domainPart)) return false;

    const domainParts = domainPart.split('.');
    if (domainParts.length < 2) return false;

    return validateDomainSegments(domainParts);
  };

  const validateEmail = (email: string): boolean => {
    if (!validateEmailLength(email)) return false;

    const parts = email.split('@');
    if (parts.length !== 2) return false;

    const [localPart, domainPart] = parts;
    if (!validateLocalPart(localPart)) return false;
    if (!validateDomainPart(domainPart)) return false;

    return true;
  };

  const validate = (val: string) => {
    if (required && !val.trim()) return "This field is required";
    if (val.trim() === "") return null;
    if (emailValid && !validateEmail(val))
      return "Please enter a valid email address";
    return null;
  };

  const handleBlur = () => {
    const validationError = validate(localValue);

    // Don't show error messages - instead clear invalid values
    if (validationError) {
      // If value is invalid, clear it without saving
      // Only clear if it's not a required field error (empty required field)
      if (validationError !== "This field is required") {
        setLocalValue("");
        setCommittedValue("");
        // Don't call onChange - this prevents saving invalid values
        setIsEditing(false);
        return;
      }
      // For required field errors, keep the value but don't save
      setIsEditing(false);
      return;
    }

    // Value is valid - save it
    if (localValue !== committedValue) {
      onChange(localValue);
      setCommittedValue(localValue);
    }

    setIsEditing(false);
  };

  // allowEdit controls single vs double-click behavior
  // readOnly completely prevents editing
  const handleClick = useClickHandler(
    () => !readOnly && allowEdit && !disabled && setIsEditing(true), // Single click when allowEdit=true
    () => !readOnly && !allowEdit && !disabled && setIsEditing(true) // Double click when allowEdit=false
  );

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
      <button
        type="button"
        className={`relative w-full ${className} ${isBorder ? "field-component-border" : ""}`}
        onClick={readOnly ? undefined : handleClick}
        style={readOnly ? { cursor: 'default' } : undefined}
      >
        {isEditing ? (
          <input
            type="email"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleBlur();
              }
              if (e.key === "Escape") {
                setLocalValue(value);
                setIsEditing(false);
              }
            }}
            autoFocus
            placeholder={placeholder}
            disabled={disabled || readOnly}
            className={`field-component ${isBorder && 'field-component-focus'} ${disabled || readOnly ? 'cursor-not-allowed' : ''}`}
          />
        ) : (
          <div className={`field-component ${localValue ? "text-grey-800" : "text-gray-400"} ${disabled || readOnly ? "text-gray-400 cursor-not-allowed" : ""} max-w-full overflow-hidden`}
            style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {localValue || placeholder}
          </div>
        )}

      </button>

      {/* Helper Text */}
      {helperText && allowEdit && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};
