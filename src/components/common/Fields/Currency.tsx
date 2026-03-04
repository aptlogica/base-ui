import React, { useState, useEffect } from "react";
import { useClickHandler } from "../../../utils/helpers";

interface CurrencyConfig {
  currencyType?: string;
  precision?: number;
  defaultValue?: string;
  [key: string]: any;
}

interface CurrencyProps {
  label?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  config?: CurrencyConfig;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  isBorder?: boolean;
  className?: string;
  allowEdit?: boolean;
  readOnly?: boolean;
  helperText?: string;
}

const getInitialValue = (value: number | null, defaultValue: string): string => {
  if (value !== null && value !== undefined) return value.toString();
  if (defaultValue && String(defaultValue).trim()) return String(defaultValue);
  return "";
};

const validateValue = (val: string, required: boolean): string | null => {
  if (required && !val.trim()) return "This field is required";
  if (val.trim() === "") return null;
  if (Number.isNaN(Number.parseFloat(val))) return "Please enter a valid amount";
  return null;
};

const useCurrencyState = (
  value: number | null,
  defaultValue: string,
  onChange: (value: number | null) => void,
  required: boolean,
  readOnly: boolean
) => {
  const initialValue = getInitialValue(value, defaultValue);
  const [localValue, setLocalValue] = useState(initialValue);
  const [committedValue, setCommittedValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const displayValue = value !== null && value !== undefined
      ? value.toString()
      : defaultValue || "";
    setLocalValue(displayValue);
    setCommittedValue(displayValue);
  }, [value, defaultValue]);

  useEffect(() => {
    if (readOnly && isEditing) {
      setIsEditing(false);
    }
  }, [readOnly, isEditing]);

  const saveValidValue = (val: string) => {
    if (val.trim() === "") {
      onChange(null);
      setCommittedValue("");
      return;
    }
    const numValue = Number.parseFloat(val);
    if (!Number.isNaN(numValue)) {
      onChange(numValue);
      setCommittedValue(val);
    }
  };

  const clearInvalidValue = () => {
    setLocalValue("");
    onChange(null);
    setCommittedValue("");
  };

  const handleBlur = () => {
    const validationError = validateValue(localValue, required);
    const hasChanged = localValue !== committedValue;

    if (!validationError && hasChanged) {
      saveValidValue(localValue);
    } else if (validationError) {
      clearInvalidValue();
    }

    setIsEditing(false);
  };

  const cancelEdit = () => {
    setLocalValue(committedValue);
    setIsEditing(false);
  };

  return {
    localValue,
    setLocalValue,
    committedValue,
    isEditing,
    setIsEditing,
    handleBlur,
    cancelEdit,
  };
};

const formatCurrency = (amount: number, locale: string, currency: string, precision: number) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(amount);

const getDisplayValue = (localValue: string, placeholder: string, locale: string, currency: string, precision: number) => {
  if (!localValue) return placeholder;
  const numValue = Number.parseFloat(localValue);
  if (Number.isNaN(numValue)) return placeholder;
  return formatCurrency(numValue, locale, currency, precision);
};

const getLocaleSeparators = (locale: string) => {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  const group = parts.find((part) => part.type === "group")?.value ?? ",";
  const decimal = parts.find((part) => part.type === "decimal")?.value ?? ".";
  return { group, decimal };
};

const filterCurrencyInput = (input: string, precision: number = 2, locale: string = "en-US"): string => {
  const { group, decimal } = getLocaleSeparators(locale);
  let normalized = input;

  if (group) {
    normalized = normalized.replaceAll(group, "");
  }
  if (decimal && decimal !== ".") {
    normalized = normalized.replaceAll(decimal, ".");
  }

  // Remove non-numeric characters except for one minus sign at start and one decimal point
  let filtered = normalized.replaceAll(/[^0-9.-]/g, "");
  
  // Handle minus sign - only allow at the start
  const hasMinus = filtered.startsWith('-');
  filtered = filtered.replaceAll('-', '');
  if (hasMinus) {
    filtered = '-' + filtered;
  }
  
  // Handle decimal point - only allow one
  const parts = filtered.replaceAll('-', '').split('.');
  if (parts.length > 2) {
    filtered = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit decimal places
  const decimalIndex = filtered.indexOf('.');
  if (decimalIndex !== -1) {
    const integerPart = filtered.substring(0, decimalIndex);
    const decimalPart = filtered.substring(decimalIndex + 1, decimalIndex + 1 + precision);
    filtered = integerPart + '.' + decimalPart;
  }
  
  return filtered;
};

export const Currency: React.FC<CurrencyProps> = ({
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
  const { currencyType = "USD", currencyLocale = "en-US", precision = 2, defaultValue = "" } = config;

  const {
    localValue,
    setLocalValue,
    isEditing,
    setIsEditing,
    handleBlur,
    cancelEdit,
  } = useCurrencyState(value, defaultValue, onChange, required, readOnly);

  const canEdit = !readOnly && !disabled;
  const handleSingleClick = () => canEdit && allowEdit && setIsEditing(true);
  const handleDoubleClick = () => canEdit && !allowEdit && setIsEditing(true);
  const handleClick = useClickHandler(handleSingleClick, handleDoubleClick);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      handleClick();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(filterCurrencyInput(e.target.value, precision, currencyLocale));
  };

  const displayValue = getDisplayValue(localValue, placeholder, currencyLocale, currencyType, precision);
  const displayClassName = `field-component pl-8 w-full overflow-hidden ${localValue ? "text-gray-800" : "text-gray-400"} ${disabled || readOnly ? "text-gray-400 cursor-not-allowed" : ""}`.trim();
  const inputClassName = `field-component pl-8 ${isBorder ? "field-component-focus" : ""} ${disabled || readOnly ? "cursor-not-allowed" : ""}`.trim();
  const containerClassName = `relative min-w-0 truncate ${className} ${isBorder ? "field-component-border" : ""}`.trim();
  const showHelperText = helperText && allowEdit;

  const containerProps = readOnly
    ? { className: containerClassName, tabIndex: -1, style: { cursor: 'default' } as React.CSSProperties }
    : { className: containerClassName, onClick: handleClick, onKeyDown: handleKeyDown, tabIndex: 0, role: "button" as const };

  return (
    <div className="w-full">
      {label && (
        <label className="field-component-label">
          {label}
          {required && <span className="field-component-required">*</span>}
        </label>
      )}

      <div {...containerProps}>
        {isEditing ? (
          <input
            type="text"
            autoFocus
            value={localValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder}
            disabled={disabled || readOnly}
            className={inputClassName}
          />
        ) : (
          <div className={displayClassName}>
            <span className="min-w-0 truncate">{displayValue}</span>
          </div>
        )}
      </div>

      {showHelperText && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );

};
