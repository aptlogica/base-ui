import React, { useState, useEffect, useRef } from 'react';
import { useClickHandler } from '../../../utils/helpers';

// Safe URL validation helpers (no ReDoS vulnerabilities)
const removeProtocol = (url: string): string => {
  if (url.startsWith('https://')) return url.substring(8);
  if (url.startsWith('http://')) return url.substring(7);
  return url;
};

const isValidDomainChar = (char: string): boolean => {
  const code = char.codePointAt(0) ?? 0;
  return (code >= 48 && code <= 57) || // 0-9
    (code >= 97 && code <= 122) || // a-z
    char === '-' || char === '.';
};

const isValidTLDChar = (char: string): boolean => {
  const code = char.codePointAt(0) ?? 0;
  return (code >= 97 && code <= 122) || char === '.'; // a-z or .
};

const isValidPathChar = (char: string): boolean => {
  const code = char.codePointAt(0) ?? 0;
  return (code >= 48 && code <= 57) || // 0-9
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) || // a-z
    char === '/' || char === ' ' || char === '.' || char === '-' || char === '_';
};

const validateDomain = (domain: string): boolean => {
  if (!domain || domain.length === 0) return false;
  for (const char of domain) {
    if (!isValidDomainChar(char)) return false;
  }
  return true;
};

const validateTLD = (tld: string): boolean => {
  if (!tld || tld.length < 2 || tld.length > 6) return false;
  for (const char of tld) {
    if (!isValidTLDChar(char)) return false;
  }
  return true;
};

const validatePath = (path: string): boolean => {
  if (!path) return true; // Path is optional
  for (const char of path) {
    if (!isValidPathChar(char)) return false;
  }
  return true;
};

const validateURLSafe = (url: string): boolean => {
  if (!url.trim()) return true;

  const urlWithoutProtocol = removeProtocol(url.trim());
  const parts = urlWithoutProtocol.split('.');
  if (parts.length < 2) return false;

  const domainName = parts[0];
  if (!validateDomain(domainName)) return false;

  const lastPartWithPath = parts.at(-1) ?? '';
  const slashIndex = lastPartWithPath.indexOf('/');
  const tld = slashIndex >= 0 ? lastPartWithPath.substring(0, slashIndex) : lastPartWithPath;
  if (!validateTLD(tld)) return false;

  const pathStartIndex = urlWithoutProtocol.indexOf('/');
  if (pathStartIndex >= 0) {
    const path = urlWithoutProtocol.substring(pathStartIndex + 1);
    if (!validatePath(path)) return false;
  }

  return true;
};

const normalizeURL = (url: string): string => {
  if (!url) return url;
  const protocolRegex = /^https?:\/\//;
  if (!protocolRegex.exec(url)) {
    return `https://${url}`;
  }
  return url;
};

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
  const { urlValid = false, defaultValue = '', openInNewTab = true } = config;

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
    return validateURLSafe(url);
  };

  const validate = (val: string) => {
    if (required && !val.trim()) return 'This field is required';
    if (val.trim() === '') return null;
    if (urlValid && !validateURL(val)) return 'Please enter a valid URL';
    return null;
  };

  const triggerOnChange = (newValue: string) => {
    if (newValue !== prevValueRef.current) {
      prevValueRef.current = newValue;
      onChange(newValue);
    }
  };

  const handleValidationError = () => {
    setLocalValue(prevValueRef.current);
  };

  const handleValidInput = () => {
    const normalizedURL = normalizeURL(localValue);
    if (normalizedURL === localValue) {
      triggerOnChange(localValue);
    } else {
      setLocalValue(normalizedURL);
      triggerOnChange(normalizedURL);
    }
  };

  const handleBlur = () => {
    const validationError = validate(localValue);
    setError(validationError);

    if (validationError) {
      handleValidationError();
    } else {
      handleValidInput();
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

  // readOnly completely prevents editing
  const handleClick = useClickHandler(
    () => !readOnly && allowEdit && !disabled && setIsEditing(true),
    () => !readOnly && !allowEdit && !disabled && setIsEditing(true)
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsEditing(true);
    }
  };

  const renderInputView = () => (
    <input
      type="text"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      autoFocus
      placeholder={placeholder}
      disabled={disabled || readOnly}
      className={`field-component w-full min-w-0
        ${localValue ? "text-gray-900" : "text-gray-400"}
        ${disabled || readOnly ? "text-gray-400 cursor-not-allowed" : ""}`}
    />
  );

  const renderDisplayView = () => {
    if (!localValue || error) {
      return (
        <div
          className={`field-component overflow-hidden
            ${localValue && !error ? "cursor-pointer" : "cursor-default"}
            ${localValue ? "!text-blue-600 underline hover:!text-blue-800" : "text-gray-400"}
            ${disabled || readOnly ? "text-gray-400 cursor-not-allowed" : ""}`}
        >
          <span className="block w-full min-w-0 truncate whitespace-nowrap">
            {localValue || placeholder}
          </span>
        </div>
      );
    }

    // Use a regular anchor tag for reliable rendering
    return (
      <div
        className={`field-component overflow-hidden
          ${localValue && !error ? "cursor-pointer" : "cursor-default"}
          ${localValue ? "!text-blue-600 underline hover:!text-blue-800" : "text-gray-400"}
          ${disabled || readOnly ? "text-gray-400 cursor-not-allowed" : ""}`}
      >
        <span className="block w-full min-w-0 truncate whitespace-nowrap">
          <a 
            href={normalizeURL(localValue)} 
            target={openInNewTab ? '_blank' : '_self'} 
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              if (openInNewTab) {
                window.open(normalizeURL(localValue), '_blank', 'noopener,noreferrer');
              } else {
                globalThis.location.href = normalizeURL(localValue);
              }
            }}
          >
            {localValue}
          </a>
        </span>
      </div>
    );
  };

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
        onKeyDown={readOnly ? undefined : handleKeyDown}
        style={readOnly ? { cursor: 'default' } : undefined}
      >
        {isEditing ? renderInputView() : renderDisplayView()}
      </div>
      {helperText && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};
