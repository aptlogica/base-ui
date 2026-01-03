import React, { useState, useEffect, useRef } from "react";
import { Info } from "lucide-react";
import { useClickHandler } from "../../../utils/helpers";

interface DurationConfig {
  durationFormat?: "h:mm" | "h:mm:ss" | "h:mm:ss.s" | "h:mm:ss.ss" | "h:mm:ss.sss" | "d:h:mm";
  defaultValue?: string;
  [key: string]: any;
}

interface DurationProps {
  label?: string;
  value?: number | null; 
  onChange: (value: number | null) => void;
  config?: DurationConfig;
  required?: boolean;
  disabled?: boolean;
  isBorder?: boolean;
  className?: string;
  allowEdit?: boolean; // true = single click, false = double click
  readOnly?: boolean; // true = completely prevent editing
  helperText?: string;
  icon?: string;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function pad3(n: number) {
  return n.toString().padStart(3, "0");
}

export const Duration: React.FC<DurationProps> = ({
  label,
  value,
  onChange,
  config = {},
  required = false,
  disabled = false,
  isBorder = false,
  className = "",
  allowEdit = true,
  readOnly = false,
  helperText,
  icon = "",
}) => {
  const { durationFormat = "h:mm", defaultValue } = config;

  const formatDuration = (minutes: number | null | undefined): string => {
    if (minutes === null || minutes === undefined) return "";
    
    // Convert minutes to total seconds (including fractional part)
    const totalSeconds = Math.abs(minutes * 60);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);
    const fractionalSeconds = totalSeconds - Math.floor(totalSeconds);

    switch (durationFormat) {
      case "d:h:mm":
        return days > 0 ? `${days}:${pad(hours)}:${pad(mins)}` : `${pad(hours)}:${pad(mins)}`;
      case "h:mm:ss.sss":
        return `${pad(hours)}:${pad(mins)}:${pad(secs)}.${pad3(Math.floor(fractionalSeconds * 1000))}`;
      case "h:mm:ss.ss":
        return `${pad(hours)}:${pad(mins)}:${pad(secs)}.${pad(Math.floor(fractionalSeconds * 100))}`;
      case "h:mm:ss.s":
        return `${pad(hours)}:${pad(mins)}:${pad(secs)}.${Math.floor(fractionalSeconds * 10)}`;
      case "h:mm:ss":
        return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
      case "h:mm":
      default:
        // For h:mm format, round up to next minute if there are any seconds
        const roundedMins = secs > 0 ? mins + 1 : mins;
        return `${pad(hours)}:${pad(roundedMins)}`;
    }
  };

  const parseNumericInput = (input: string): number => {
    // Handle pure numeric input as MINUTES (e.g., "120" -> 120 minutes)
    // We intentionally do not auto-convert to seconds here.
    const trimmed = input.trim();
    const minutes = parseInt(trimmed, 10);
    return isNaN(minutes) ? 0 : minutes;
  };

  const parseDuration = (input: string | number): number => {
    if (typeof input === 'number') return input;
    if (!input || !input.trim()) return 0;
    
    if (/^\d+$/.test(input.trim())) {
      return parseNumericInput(input);
    }
    
    const parts = input.split(":");
    
    switch (durationFormat) {
      case "d:h:mm": {
        if (parts.length === 3) {
          const days = parseInt(parts[0]) || 0;
          const hours = parseInt(parts[1]) || 0;
          const minutes = parseInt(parts[2]) || 0;
          return days * 1440 + hours * 60 + minutes;
        } else if (parts.length === 2) {
          const hours = parseInt(parts[0]) || 0;
          const minutes = parseInt(parts[1]) || 0;
          return hours * 60 + minutes;
        }
        break;
      }
      case "h:mm:ss.sss":
      case "h:mm:ss.ss":
      case "h:mm:ss.s":
      case "h:mm:ss": {
        if (parts.length === 3) {
          const hours = parseInt(parts[0]) || 0;
          const minutes = parseInt(parts[1]) || 0;
          const secondsPart = parts[2];
          const seconds = parseFloat(secondsPart) || 0;
          return hours * 60 + minutes + seconds / 60;
        } else if (parts.length === 2) {
          const hours = parseInt(parts[0]) || 0;
          const minutes = parseInt(parts[1]) || 0;
          return hours * 60 + minutes;
        }
        break;
      }
      case "h:mm":
      default: {        
        if (parts.length === 2) {
          const hours = parseInt(parts[0]) || 0;
          const minutes = parseInt(parts[1]) || 0;          
          return hours * 60 + minutes;
        } else if (parts.length === 1) {
          const hours = parseInt(parts[0]) || 0;
          return hours * 60;
        }
        break;
      }
    }
    
    return 0;
  };

  const getInitialValue = () => {
    // Treat empty string as null (no value) - this ensures format string is shown
    // This handles cases where form is cleared and getFieldDefaultValue returns ''
    if (value === '' || value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    // Only use defaultValue from config if value is explicitly provided (not from getFieldDefaultValue fallback)
    // This prevents showing "00:00:00" when form is cleared
    if (defaultValue && value !== undefined) return parseDuration(defaultValue);
    return null; // Return null when no value is provided
  };

  const [localValue, setLocalValue] = useState<number | null>(getInitialValue());
  const [inputValue, setInputValue] = useState<string>(() => {
    const initVal = getInitialValue();
    return initVal !== null && initVal !== undefined ? formatDuration(initVal) : "";
  });
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const prevValueRef = useRef<number | null>(localValue);

  useEffect(() => {
    // Handle both null/undefined/empty string and numeric values
    // Treat empty string as null (no value) - this ensures format string is shown instead of "00:00:00"
    // Also handle null explicitly to ensure clearing works properly
    const normalizedValue = (value === '' || value === null || value === undefined) ? null : value;
    if (normalizedValue !== prevValueRef.current) {
      setLocalValue(normalizedValue);
      setInputValue(normalizedValue !== null && normalizedValue !== undefined ? formatDuration(normalizedValue) : "");
      prevValueRef.current = normalizedValue;
    }
  }, [value, durationFormat]);

  // Exit edit mode if readOnly becomes true
  useEffect(() => {
    if (readOnly && isEditing) {
      setIsEditing(false);
    }
  }, [readOnly, isEditing]);

  const validate = (val: string) => {
    if (required && !val.trim()) return "This field is required";
    if (val.trim() && parseDuration(val) === 0 && val.trim() !== "0") {
      return "Please enter a valid duration";
    }
    return null;
  };

  const handleBlur = () => {
    const validationError = validate(inputValue);
    
    // Don't show error - just reset if invalid
    if (validationError) {
      // Reset to previous valid value, or null if no previous value
      const resetValue = localValue !== undefined && localValue !== null ? localValue : null;
      setInputValue(resetValue !== null ? formatDuration(resetValue) : "");
      setLocalValue(resetValue);
      setError(null); // Don't show error
      setIsEditing(false);
      return;
    }

    // No error - proceed with update
    // If input is empty, treat as null (send null to backend)
    const isEmptyInput = !inputValue || inputValue.trim() === "";
    const wasEmpty = prevValueRef.current === null || prevValueRef.current === undefined;

    if (isEmptyInput) {
      if (wasEmpty) {
        // No change from previous null/undefined
        setInputValue("");
        setLocalValue(null);
        setIsEditing(false);
        return;
      }
      // Value changed to empty -> send null
      if (prevValueRef.current !== null) {
        onChange(null);
        prevValueRef.current = null;
      }
      setLocalValue(null);
      setInputValue("");
      setError(null);
      setIsEditing(false);
      return;
    }

    // Non-empty input: parse and update
    const minutes = parseDuration(inputValue);
    if (prevValueRef.current !== minutes) {
      onChange(minutes);
      prevValueRef.current = minutes;
    }
    setLocalValue(minutes);
    setInputValue(formatDuration(minutes));
    setError(null);
    setIsEditing(false);
  };

  // allowEdit controls single vs double-click behavior
  // readOnly completely prevents editing
  const handleClick = useClickHandler(
    () => !readOnly && allowEdit && !disabled && setIsEditing(true), // Single click when allowEdit=true
    () => !readOnly && !allowEdit && !disabled && setIsEditing(true) // Double click when allowEdit=false
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
        onClick={!readOnly ? handleClick : undefined}
        style={readOnly ? { cursor: 'default' } : undefined}
      >
        {isEditing ? (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleBlur();
              if (e.key === "Escape") {
                setInputValue(formatDuration(prevValueRef.current));
                setIsEditing(false);
              }
            }}
            autoFocus
            placeholder={durationFormat}
            disabled={disabled || readOnly}
            className={`field-component ${isBorder ? "field-component-focus" : ""} ${error ? "border-red-500 bg-red-50" : "border-gray-300"
              } ${disabled || readOnly ? "cursor-not-allowed" : ""}`}
          />
        ) : (
          <div
            className={`field-component ${localValue !== null && localValue !== undefined ? "text-gray-800" : ""
              } ${disabled || readOnly ? "text-gray-400 cursor-not-allowed" : ""}`}
          >
            {localValue !== null && localValue !== undefined
              ? formatDuration(localValue)
              : <span className="text-gray-400">{durationFormat}</span>}
          </div>
        )}
      </div>

      {/* Error Text */}
      {error && allowEdit && <div className="mt-1.5 text-red-500 cursor-default">{error}</div>}

      {/* Helper Text */}
      {helperText && allowEdit && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};
