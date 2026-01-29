import React, { useState, useEffect, useRef } from "react";
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
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function pad3(n: number) {
  return n.toString().padStart(3, "0");
}

function formatDaysHoursMinutes(days: number, hours: number, mins: number): string {
  return days > 0 ? `${days}:${pad(hours)}:${pad(mins)}` : `${pad(hours)}:${pad(mins)}`;
}

function formatHoursMinutesSeconds(
  hours: number,
  mins: number,
  secs: number,
  fractionalSeconds: number,
  precision: number
): string {
  const fractionalPart = Math.floor(fractionalSeconds * precision);
  let fractionalStr: string;
  if (precision === 1000) {
    fractionalStr = pad3(fractionalPart);
  } else if (precision === 100) {
    fractionalStr = pad(fractionalPart);
  } else {
    fractionalStr = fractionalPart.toString();
  }
  return `${pad(hours)}:${pad(mins)}:${pad(secs)}.${fractionalStr}`;
}

function formatHoursMinutes(hours: number, mins: number, secs: number): string {
  const roundedMins = secs > 0 ? mins + 1 : mins;
  return `${pad(hours)}:${pad(roundedMins)}`;
}

function formatDuration(minutes: number | null | undefined, durationFormat: string): string {
  if (minutes === null || minutes === undefined) return "";
  
  const totalSeconds = Math.abs(minutes * 60);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  const fractionalSeconds = totalSeconds - Math.floor(totalSeconds);

  switch (durationFormat) {
    case "d:h:mm":
      return formatDaysHoursMinutes(days, hours, mins);
    case "h:mm:ss.sss":
      return formatHoursMinutesSeconds(hours, mins, secs, fractionalSeconds, 1000);
    case "h:mm:ss.ss":
      return formatHoursMinutesSeconds(hours, mins, secs, fractionalSeconds, 100);
    case "h:mm:ss.s":
      return formatHoursMinutesSeconds(hours, mins, secs, fractionalSeconds, 10);
    case "h:mm:ss":
      return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
    case "h:mm":
    default:
      return formatHoursMinutes(hours, mins, secs);
  }
}

function parseNumericInput(input: string): number {
  const trimmed = input.trim();
  const minutes = Number.parseInt(trimmed, 10);
  return Number.isNaN(minutes) ? 0 : minutes;
}

function parseDaysHoursMinutes(parts: string[]): number {
  if (parts.length === 3) {
    const days = Number.parseInt(parts[0]) || 0;
    const hours = Number.parseInt(parts[1]) || 0;
    const minutes = Number.parseInt(parts[2]) || 0;
    return days * 1440 + hours * 60 + minutes;
  }
  if (parts.length === 2) {
    const hours = Number.parseInt(parts[0]) || 0;
    const minutes = Number.parseInt(parts[1]) || 0;
    return hours * 60 + minutes;
  }
  return 0;
}

function parseHoursMinutesSeconds(parts: string[]): number {
  if (parts.length === 3) {
    const hours = Number.parseInt(parts[0]) || 0;
    const minutes = Number.parseInt(parts[1]) || 0;
    const secondsPart = parts[2];
    const seconds = Number.parseFloat(secondsPart) || 0;
    return hours * 60 + minutes + seconds / 60;
  }
  if (parts.length === 2) {
    const hours = Number.parseInt(parts[0]) || 0;
    const minutes = Number.parseInt(parts[1]) || 0;
    return hours * 60 + minutes;
  }
  return 0;
}

function parseHoursMinutes(parts: string[]): number {
  if (parts.length === 2) {
    const hours = Number.parseInt(parts[0]) || 0;
    const minutes = Number.parseInt(parts[1]) || 0;
    return hours * 60 + minutes;
  }
  if (parts.length === 1) {
    const hours = Number.parseInt(parts[0]) || 0;
    return hours * 60;
  }
  return 0;
}

function parseDuration(input: string | number, durationFormat: string): number {
  if (typeof input === 'number') return input;
  if (!input?.trim()) return 0;
  
  if (/^\d+$/.test(input.trim())) {
    return parseNumericInput(input);
  }
  
  const parts = input.split(":");
  
  switch (durationFormat) {
    case "d:h:mm":
      return parseDaysHoursMinutes(parts);
    case "h:mm:ss.sss":
    case "h:mm:ss.ss":
    case "h:mm:ss.s":
    case "h:mm:ss":
      return parseHoursMinutesSeconds(parts);
    case "h:mm":
    default:
      return parseHoursMinutes(parts);
  }
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
}) => {
  const { durationFormat = "h:mm", defaultValue } = config;

  const getInitialValue = () => {
    // If value is explicitly null/undefined, check for default
    if (value === null || value === undefined) {
      return defaultValue ? parseDuration(defaultValue, durationFormat) : null;
    }
    // If value is a number, use it directly
    if (typeof value === 'number') return value;
    return null;
  };

  const [localValue, setLocalValue] = useState<number | null>(getInitialValue());
  const [inputValue, setInputValue] = useState<string>(() => {
    const initVal = getInitialValue();
    return initVal !== null && initVal !== undefined ? formatDuration(initVal, durationFormat) : "";
  });
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const prevValueRef = useRef<number | null>(localValue);

  useEffect(() => {
    const normalizedValue = value ?? null;
    if (normalizedValue !== prevValueRef.current) {
      setLocalValue(normalizedValue);
      setInputValue(formatDuration(normalizedValue ?? null, durationFormat) ?? "");
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
    if (val.trim() && parseDuration(val, durationFormat) === 0 && val.trim() !== "0") {
      return "Please enter a valid duration";
    }
    return null;
  };

  const resetToPreviousValue = () => {
    const resetValue = localValue ?? null;
    setInputValue(resetValue === null ? "" : formatDuration(resetValue, durationFormat));
    setLocalValue(resetValue);
    setError(null);
    setIsEditing(false);
  };

  const handleEmptyInput = () => {
    const wasEmpty = prevValueRef.current === null || prevValueRef.current === undefined;
    if (wasEmpty) {
      setInputValue("");
      setLocalValue(null);
      setIsEditing(false);
      return;
    }
    if (prevValueRef.current !== null) {
      onChange(null);
      prevValueRef.current = null;
    }
    setLocalValue(null);
    setInputValue("");
    setError(null);
    setIsEditing(false);
  };

  const handleValidInput = (minutes: number) => {
    if (prevValueRef.current !== minutes) {
      onChange(minutes);
      prevValueRef.current = minutes;
    }
    setLocalValue(minutes);
    setInputValue(formatDuration(minutes, durationFormat));
    setError(null);
    setIsEditing(false);
  };

  const handleBlur = () => {
    const validationError = validate(inputValue);
    if (validationError) {
      resetToPreviousValue();
      return;
    }

    const isEmptyInput = !inputValue || inputValue.trim() === "";
    if (isEmptyInput) {
      handleEmptyInput();
      return;
    }

    const minutes = parseDuration(inputValue, durationFormat);
    handleValidInput(minutes);
  };

  // allowEdit controls single vs double-click behavior
  // readOnly completely prevents editing
  const handleClick = useClickHandler(
    () => !readOnly && allowEdit && !disabled && setIsEditing(true), // Single click when allowEdit=true
    () => !readOnly && !allowEdit && !disabled && setIsEditing(true) // Double click when allowEdit=false
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setInputValue(formatDuration(prevValueRef.current, durationFormat));
      setIsEditing(false);
    }
  };

  const getInputClassName = () => {
    const baseClass = "field-component";
    const focusClass = isBorder ? "field-component-focus" : "";
    const errorClass = error ? "border-red-500 bg-red-50" : "border-gray-300";
    const disabledClass = (disabled || readOnly) ? "cursor-not-allowed" : "";
    return `${baseClass} ${focusClass} ${errorClass} ${disabledClass}`.trim();
  };

  const getDisplayClassName = () => {
    const baseClass = "field-component";
    const valueClass = (localValue !== null && localValue !== undefined) ? "text-gray-800" : "";
    const disabledClass = (disabled || readOnly) ? "text-gray-400 cursor-not-allowed" : "";
    return `${baseClass} ${valueClass} ${disabledClass}`.trim();
  };

  const displayContent = localValue !== null && localValue !== undefined
    ? formatDuration(localValue, durationFormat)
    : <span className="text-gray-400">{durationFormat}</span>;

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
      <button
        type="button"
        className={`relative w-full ${className} ${isBorder ? "field-component-border" : ""}`}
        onClick={readOnly ? undefined : handleClick}
        style={readOnly ? { cursor: 'default' } : undefined}
      >
        {isEditing ? (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            placeholder={durationFormat}
            disabled={disabled || readOnly}
            className={getInputClassName()}
          />
        ) : (
          <div className={getDisplayClassName()}>
            {displayContent}
          </div>
        )}
      </button>

      {/* Error Text */}
      {error && allowEdit && <div className="mt-1.5 text-red-500 cursor-default">{error}</div>}

      {/* Helper Text */}
      {helperText && allowEdit && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};
