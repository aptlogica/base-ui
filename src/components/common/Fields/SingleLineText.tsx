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
  allowEdit?: boolean;
  helperText?: string;
  icon?: string;
  updateOnType?: boolean;
  config?: {
    defaultValue?: string;
    maxLength?: number;
    placeholder?: string;
    [key: string]: any;
  };
}

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
  helperText,
  icon = "",
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

  const validate = (val: string) => {
    if (required && !val.trim()) return "This field is required";
    if (val.length > configMaxLength) return `Max ${configMaxLength} characters allowed`;
    return null;
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
      <div className={`relative ${className} ${isBorder && !isEditing ? "field-component-border" : ""}`} onClick={handleClick}>
        {isEditing ? (
          <input
            type="text"
            value={localValue}
            onChange={(e) => {
              const val = e.target.value;
              setLocalValue(val);
              setError(validate(val));
              if (updateOnType) {
                onChange(val);
                prevValueRef.current = val;
              }
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
            maxLength={configMaxLength}
            className={`field-component ${isBorder ? "field-component-focus" : ""} ${error ? "border-red-500 bg-red-50" : "border-gray-300"
              } ${disabled ? "cursor-not-allowed" : ""}`}
          />
        ) : (
          <div
            className={`field-component ${localValue ? "text-gray-800" : "text-gray-400"} ${disabled ? "text-gray-400 cursor-not-allowed" : ""}`}
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
