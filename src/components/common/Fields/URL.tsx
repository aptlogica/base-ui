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
  allowEdit?: boolean; // true = single click, false = double click
  readOnly?: boolean; // true = completely prevent editing
  helperText?: string;
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
  readOnly = false,
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

  // Exit edit mode if readOnly becomes true
  useEffect(() => {
    if (readOnly && isEditing) {
      setIsEditing(false);
    }
  }, [readOnly, isEditing]);


  const validateURL = (url: string) => {
    if (!url.trim()) return true;
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]+)?\/?$/;
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
    const protocolRegex = /^https?:\/\//;
    if (!protocolRegex.exec(url)) {
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

    if (validationError) {
      setLocalValue(prevValueRef.current);
    } else {
      const normalizedURL = normalizeURL(localValue);
      if (normalizedURL === localValue) {
        triggerOnChange(localValue);
      } else {
        setLocalValue(normalizedURL);
        triggerOnChange(normalizedURL);
      }
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
      <div
        className={`w-full min-w-0 ${className} ${isBorder ? "field-component-border" : ""}`}
        role={readOnly ? undefined : "button"}
        tabIndex={disabled || readOnly ? -1 : 0}
        aria-disabled={disabled || readOnly}
        onClick={readOnly ? undefined : handleClick}
        onKeyDown={readOnly ? undefined : (e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsEditing(true);
          }
        }}
        style={readOnly ? { cursor: 'default' } : undefined}
      >
        {isEditing ? (
          <div className="flex items-center gap-2 min-w-0">
            <input
              type="text"
              value={localValue}
              onChange={handleChange}
              onBlur={handleBlur}
              autoFocus
              placeholder={placeholder}
              disabled={disabled || readOnly}
              className={`field-component flex-1 min-w-0
                ${localValue ? "text-gray-900" : "text-gray-400"}
                ${disabled || readOnly ? "text-gray-400 cursor-not-allowed" : ""}`}
            />
            {!error && localValue && showIcon && (
              <div className="flex-shrink-0 w-7 h-7 bg-card flex items-center justify-center rounded-lg border shadow-lg hover:bg-gray-200 transition-all">
                <ExternalLink
                  className="w-4 h-4 cursor-pointer text-gray-400"
                  onClick={handleURLClick}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center min-w-0">
            <div
              className={`field-component flex-1 min-w-0 overflow-hidden cursor-default
                ${localValue ? "!text-blue-600 underline hover:!text-blue-800" : "text-gray-400"}
                ${disabled || readOnly ? "text-gray-400 cursor-not-allowed" : ""}`}
            >
              <span className="block w-full min-w-0 truncate whitespace-nowrap">
                {localValue || placeholder}
              </span>
            </div>
            {!error && localValue && showIcon && (
              <div className="flex-shrink-0 w-7 h-7 bg-card mr-3 flex items-center justify-center rounded-lg border shadow-lg hover:bg-gray-200 transition-all">
                <ExternalLink
                  className="w-4 h-4 cursor-pointer text-gray-400"
                  onClick={handleURLClick}
                />
              </div>
            )}
          </div>
        )}
      </div>
      {helperText && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};
