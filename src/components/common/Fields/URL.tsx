import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { useClickHandler } from '../../../utils/helpers';

interface URLProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  isBorder?: boolean;
  className?: string;
  allowEdit?: boolean;
  helperText?: string;
  icon?: string;
  config?: {
    urlValid?: boolean;
    defaultValue?: string;
    description?: string;
    openInNewTab?: boolean;
    showIcon?: boolean;
    [key: string]: any;
  };
}

export const URL: React.FC<URLProps> = ({
  label,
  value,
  onChange,
  placeholder = "",
  required = false,
  disabled = false,
  isBorder = false,
  className = "",
  allowEdit = true,
  helperText,
  config = {}
}) => {
  const { urlValid = false, defaultValue = '', openInNewTab = true, showIcon = true } = config;

  const [localValue, setLocalValue] = useState(value || defaultValue || '');
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // store previous value to prevent duplicate onChange
  const prevValueRef = useRef<string>(value || defaultValue || '');

  useEffect(() => {
    const displayValue = value || defaultValue || '';
    setLocalValue(displayValue);
  }, [value, defaultValue]);


  const validateURL = (url: string) => {
    if (!url.trim()) return true;
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlPattern.test(url);
  };

  const validate = (val: string) => {
    if (required && !val.trim()) return 'This field is required';
    if (val.trim() === '') return null;
    if (urlValid && !validateURL(val)) return 'Please enter a valid URL';
    return null;
  };

  const normalizeURL = (url: string) => {
    if (!url) return url;
    if (!url.match(/^https?:\/\//)) {
      return `https://${url}`;
    }
    return url;
  };

  const triggerOnChange = (newValue: string) => {
    if (newValue !== prevValueRef.current) {
      prevValueRef.current = newValue;
      onChange(newValue);
    }
  };

  const handleBlur = () => {
    const validationError = validate(localValue);
    setError(validationError);

    if (!validationError) {
      const normalizedURL = normalizeURL(localValue);
      if (normalizedURL !== localValue) {
        setLocalValue(normalizedURL);
        triggerOnChange(normalizedURL);
      } else {
        triggerOnChange(localValue);
      }
    } else {
      setLocalValue(prevValueRef.current);
    }
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    const validationError = validate(newValue);
    setError(validationError);

    if (!validationError) {
      triggerOnChange(newValue);
    }
  };

  const handleURLClick = (e: React.MouseEvent) => {
    if (!isEditing && localValue && !error) {
      e.preventDefault();
      const url = normalizeURL(localValue);
      window.open(url, openInNewTab ? '_blank' : '_self', 'noopener,noreferrer');
    }
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
      <div
        className={`relative w-full min-w-0 ${className} ${isBorder ? "field-component-border" : ""}`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsEditing(true);
          }
        }}
      >

        {isEditing ? (
          <input
            type="text"
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            autoFocus
            placeholder={placeholder}
            disabled={disabled}
            className={`field-component pr-12 min-w-0
              ${localValue ? "text-gray-900" : "text-gray-400"}
              ${disabled ? "text-gray-400 cursor-not-allowed" : ""}`}
          />
        ) : (
          <div
            className={`field-component cursor-default pr-12 min-w-0 overflow-hidden
              ${localValue ? "!text-blue-600 underline hover:!text-blue-800" : "text-gray-400"}
              ${disabled ? "text-gray-400 cursor-not-allowed" : ""}`}
          >
            <span className="block w-full min-w-0 truncate whitespace-nowrap">
              {localValue || placeholder}
            </span>
          </div>
        )}

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {!error && localValue && showIcon && (
            <div className="absolute text-gray-400 right-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-card flex items-center justify-center rounded-lg border shadow-lg hover:bg-gray-200 transition-all z-0">
              <ExternalLink
                className="w-4 h-4 cursor-pointer"
                onClick={handleURLClick}
              />
            </div>
          )}
        </div>
      </div>
      {helperText && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};
