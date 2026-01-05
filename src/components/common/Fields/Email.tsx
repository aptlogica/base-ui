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
  icon?: string;
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
  icon = "",
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

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
      <div 
        className={`relative ${className} ${isBorder ? "field-component-border" : ""}`}
        onClick={!readOnly ? handleClick : undefined}
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

      </div>

      {/* Helper Text */}
      {helperText && allowEdit && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};
