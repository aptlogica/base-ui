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
  allowEdit?: boolean; // single click (true) vs double click (false)
  helperText?: string;
  icon?: string;
}

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
  helperText,
  icon = "",
}) => {
  const { currencyType = "USD", currencyLocale = "en-US", precision = 2, defaultValue = "" } = config;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(currencyLocale, {
      style: "currency",
      currency: currencyType,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(amount);

  const getInitialValue = () => {
    if (value !== null && value !== undefined) return value.toString();
    if (defaultValue && String(defaultValue).trim()) return String(defaultValue);
    return "";
  };

  const [localValue, setLocalValue] = useState(getInitialValue());
  const [committedValue, setCommittedValue] = useState(getInitialValue());
  const [isEditing, setIsEditing] = useState(false);

  // Sync with external updates
  useEffect(() => {
    const displayValue =
      value !== null && value !== undefined
        ? value.toString()
        : defaultValue || "";
    setLocalValue(displayValue);
    setCommittedValue(displayValue);
  }, [value, defaultValue]);

  const validate = (val: string) => {
    if (required && !val.trim()) return "This field is required";
    if (val.trim() === "") return null;
    if (isNaN(parseFloat(val))) return "Please enter a valid amount";
    return null;
  };

  const handleBlur = () => {
    const validationError = validate(localValue);

    // Only save if valid, otherwise clear silently
    if (!validationError && localValue !== committedValue) {
      if (localValue.trim() === "") {
        onChange(null);
        setCommittedValue("");
      } else {
        const numValue = parseFloat(localValue);
        if (!isNaN(numValue)) {
          onChange(numValue);
          setCommittedValue(localValue);
        }
      }
    } else if (validationError) {
      // Invalid value - clear silently
      setLocalValue("");
      onChange(null);
      setCommittedValue("");
    }

    setIsEditing(false);
  };

  const handleClick = useClickHandler(
    () => allowEdit && !disabled && setIsEditing(true),
    () => !allowEdit && !disabled && setIsEditing(true)
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
      <div className={`relative ${className} ${isBorder ? "field-component-border" : ""}`} onClick={handleClick}>
        {/* Currency Type Display */}
        {/* <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
          {currencyType === "USD" ? "$" : currencyType}
        </div> */}

        {isEditing ? (
          <input
            type="text"
            autoFocus
            value={localValue}
            onChange={(e) =>
              setLocalValue(e.target.value.replace(/[^0-9.-]/g, ""))
            }
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleBlur();
              if (e.key === "Escape") {
                setLocalValue(committedValue);
                setIsEditing(false);
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={`field-component pl-8 ${isBorder ? "field-component-focus" : ""}`}
          />
        ) : (
          <div
            className={`field-component pl-8 ${localValue ? "text-gray-800" : "text-gray-400"} ${disabled ? "text-gray-400 cursor-not-allowed" : ""}`}
          >
            {localValue && !isNaN(parseFloat(localValue))
              ? formatCurrency(parseFloat(localValue))
              : placeholder}
          </div>
        )}

      </div>

      {/* Helper text */}
      {helperText && allowEdit && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );

};
