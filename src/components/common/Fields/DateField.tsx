// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { useClickOutside } from '../../../hooks/useClickOutside';
import { useDropdownPosition } from '../../../hooks/useDropdownPosition';
import { getTodayISO } from '../../../utils/timeFormatUtils';
import { formatISODate, matchesDateFormat, SUPPORTED_DATE_FORMATS } from '../../../utils/dateFormatUtils';
import { CalendarPanel } from './CalendarPanel';

interface DateProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  format?: string;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  isBorder?: boolean;
  className?: string;
  allowEdit?: boolean; // true = single click opens dropdown, false = double click for manual edit
  readOnly?: boolean; // true = completely prevent editing
  helperText?: string;
  config?: {
    defaultValue?: string;
    dateFormat?: string;
    min?: string;
    max?: string;
    hideTodayButton?: boolean;
    [key: string]: any;
  };
}

// Convert from various formats to ISO (YYYY-MM-DD)
function convertToISO(date: string, fromFormat: string): string {
  if (!date) return '';

  // Normalize known ISO datetime variants like 2025-09-26T00:00:00Z or with offset
  if (fromFormat === 'ISO' || /\d{4}-\d{2}-\d{2}T/.test(date)) {
    return date.substring(0, 10);
  }

  if (fromFormat === 'YYYY-MM-DD') {
    return date;
  }

  if (fromFormat === 'YYYY/MM/DD') {
    return date.replaceAll('/', '-');
  }

  const parseDateParts = (dateStr: string, separator: string, order: 'DD-MM-YYYY' | 'MM-DD-YYYY'): string => {
    const parts = dateStr.split(separator);
    if (parts.length !== 3) return '';
    const [first, second, third] = parts;
    return order === 'DD-MM-YYYY'
      ? `${third}-${second}-${first}`
      : `${third}-${first}-${second}`;
  };

  if (fromFormat === 'DD-MM-YYYY') {
    return parseDateParts(date, '-', 'DD-MM-YYYY');
  }

  if (fromFormat === 'MM-DD-YYYY') {
    return parseDateParts(date, '-', 'MM-DD-YYYY');
  }

  if (fromFormat === 'DD/MM/YYYY') {
    return parseDateParts(date, '/', 'DD-MM-YYYY');
  }

  if (fromFormat === 'MM/DD/YYYY') {
    return parseDateParts(date, '/', 'MM-DD-YYYY');
  }

  if (fromFormat === 'DD MM YYYY') {
    return parseDateParts(date, ' ', 'DD-MM-YYYY');
  }

  return '';
}

// Convert date from one format to another
function convertDateFormat(date: string, fromFormat: string, toFormat: string): string {
  if (!date) return '';

  const isoDate = convertToISO(date, fromFormat);
  if (!isoDate) return date;

  return formatISODate(isoDate, toFormat);
}

// Validate if input matches the expected format pattern
function validateFormat(input: string, format: string): boolean {
  if (!input.trim()) return false;

  // Unknown formats are checked as YYYY-MM-DD
  return matchesDateFormat(input, SUPPORTED_DATE_FORMATS.includes(format) ? format : 'YYYY-MM-DD');
}

// Detect the format of a date string with better logic for ambiguous formats
function detectDateFormat(dateStr: string): string {
  if (dateStr?.trim() === '') return 'YYYY-MM-DD';

  // ISO datetime (UTC or with offset), e.g., 2025-09-26T00:00:00Z or 2025-09-26T00:00:00+00:00
  if (/^\d{4}-\d{2}-\d{2}T/.test(dateStr)) {
    return 'ISO';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return 'YYYY-MM-DD';
  } else if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateStr)) {
    return 'YYYY/MM/DD';
  } else if (/^\d{2} \d{2} \d{4}$/.test(dateStr)) {
    return 'DD MM YYYY';
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    // For DD-MM-YYYY vs MM-DD-YYYY, check if first number could be a valid month
    const parts = dateStr.split('-');
    const firstNum = Number.parseInt(parts[0]);
    const secondNum = Number.parseInt(parts[1]);

    // If first number is > 12, it's likely DD-MM-YYYY
    // If second number is > 12, it's likely MM-DD-YYYY
    if (firstNum > 12) {
      return 'DD-MM-YYYY';
    } else if (secondNum > 12) {
      return 'MM-DD-YYYY';
    } else {
      // Ambiguous case - assume DD-MM-YYYY (more common internationally)
      return 'DD-MM-YYYY';
    }
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    // For DD/MM/YYYY vs MM/DD/YYYY, check if first number could be a valid month
    const parts = dateStr.split('/');
    const firstNum = Number.parseInt(parts[0]);
    const secondNum = Number.parseInt(parts[1]);

    // If first number is > 12, it's likely DD/MM/YYYY
    // If second number is > 12, it's likely MM/DD/YYYY
    if (firstNum > 12) {
      return 'DD/MM/YYYY';
    } else if (secondNum > 12) {
      return 'MM/DD/YYYY';
    } else {
      // Ambiguous case - assume DD/MM/YYYY (more common internationally)
      return 'DD/MM/YYYY';
    }
  }

  return 'YYYY-MM-DD';
}

// Get placeholder based on format
function getPlaceholder(format: string): string {
  return SUPPORTED_DATE_FORMATS.includes(format) ? format : 'YYYY-MM-DD';
}

export const DateField: React.FC<DateProps> = ({
  label,
  value,
  onChange,
  format = 'YYYY-MM-DD',
  min,
  max,
  required = false,
  disabled = false,
  isBorder = false,
  className = "",
  allowEdit = true,
  readOnly = false,
  helperText,
  config = {}
}) => {
  const { dateFormat = format, min: configMin = min, max: configMax = max, hideTodayButton = false } = config;
  const [date, setDate] = useState(value || '');
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const calculatedPosition = useDropdownPosition(
    buttonRef as React.RefObject<HTMLElement>,
    isOpen,
    { dropdownMinHeight: 400, dropdownWidthMax: 320, offset: 8, sideMargin: 10 }
  );
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    if (value) {
      const currentFormat = detectDateFormat(value);
      const isoDate = convertDateFormat(value, currentFormat, 'YYYY-MM-DD');
      const [y, m] = isoDate.split('-');
      return new Date(Number(y), Number(m) - 1, 1);
    }
    return new Date();
  });
  // Track previous value to prevent unnecessary updates
  const prevValueRef = useRef<string | undefined>(undefined);
  const prevDateFormatRef = useRef<string | undefined>(undefined);
  const dateRef = useRef<string>(date);

  // Keep ref in sync with state
  useEffect(() => {
    dateRef.current = date;
  }, [date]);

  const getDisplayValue = (val: string | null | undefined): string => {
    return (val !== null && val !== undefined && val !== '') ? val : '';
  };

  const handleNonEmptyValue = (
    displayVal: string,
    currentVal: string,
    format: string,
    setDateFn: (d: string) => void,
    setCalendarMonthFn: (d: Date) => void,
    onChangeFn: (iso: string) => void
  ) => {
    const currentFormat = detectDateFormat(displayVal);
    const convertedValue = convertDateFormat(displayVal, currentFormat, format);

    if (convertedValue !== dateRef.current) {
      setDateFn(convertedValue);
    }

    const newIso = convertDateFormat(convertedValue, format, 'YYYY-MM-DD');
    if (displayVal !== currentVal && newIso) {
      onChangeFn(newIso);
    }

    if (newIso) {
      const [y, m] = newIso.split('-');
      setCalendarMonthFn(new Date(Number(y), Number(m) - 1, 1));
    }
  };

  const handleEmptyValue = (
    displayVal: string,
    currentVal: string | null | undefined,
    setDateFn: (d: string) => void,
    onChangeFn: (iso: string) => void
  ) => {
    setDateFn(displayVal);
    const isClearingValue = displayVal === '' && currentVal !== null && currentVal !== undefined && currentVal !== '';
    if (isClearingValue) {
      onChangeFn('');
    }
  };

  useEffect(() => {
    if (value === prevValueRef.current && dateFormat === prevDateFormatRef.current) {
      return;
    }

    prevValueRef.current = value;
    prevDateFormatRef.current = dateFormat;

    const displayValue = getDisplayValue(value);

    if (displayValue?.trim()) {
      handleNonEmptyValue(displayValue, value, dateFormat, setDate, setCalendarMonth, onChange);
    } else {
      handleEmptyValue(displayValue, value, setDate, onChange);
    }
  }, [value, dateFormat, format, onChange]);

  // Update position when dropdown opens
  useEffect(() => {
    if (isOpen) {
      // Reset calendarMonth to the current date's year/month when opening
      let baseDate = date;
      if (!baseDate?.trim()) {
        baseDate = getTodayISO();
      }
      const currentFormat = detectDateFormat(baseDate);
      const isoDate = convertDateFormat(baseDate, currentFormat, 'YYYY-MM-DD');
      const [y, m] = isoDate.split('-');
      setCalendarMonth(new Date(Number(y), Number(m) - 1, 1));

    }
  }, [isOpen, date]);

  const closeAllDropdowns = () => {
    setIsOpen(false);
  };

  useClickOutside({
    isOpen,
    onClose: closeAllDropdowns,
    excludeRefs: [buttonRef, inputRef, popoverRef, dropdownRef]
  });

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const validateDateValue = (isoDate: string, minVal: string | undefined, maxVal: string | undefined, minFormat: string, maxFormat: string): string | null => {
    const dateValue = new Date(isoDate);
    if (Number.isNaN(dateValue.getTime())) return 'Please enter a valid date';
    if (minVal) {
      const minISO = convertDateFormat(minVal, minFormat, 'YYYY-MM-DD');
      if (isoDate < minISO) return `Date must be after ${minVal}`;
    }
    if (maxVal) {
      const maxISO = convertDateFormat(maxVal, maxFormat, 'YYYY-MM-DD');
      if (isoDate > maxISO) return `Date must be before ${maxVal}`;
    }
    return null;
  };

  const validate = (d: string) => {
    if (required && !d) return 'This field is required';
    if (!d) return null;
    const isoDate = convertDateFormat(d, dateFormat, 'YYYY-MM-DD');
    return validateDateValue(isoDate, configMin, configMax, dateFormat, dateFormat);
  };

  const handleDateSelect = (selected: string) => {
    if (readOnly) return;
    const formattedDate = convertDateFormat(selected, 'YYYY-MM-DD', dateFormat);
    setDate(formattedDate);
    closeAllDropdowns();
    setError(validate(formattedDate));
    onChange(selected);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDate(newValue);

    const validationError = validate(newValue);
    setError(validationError);
  };

  const clearDateValue = () => {
    setDate('');
    onChange('');
  };

  const saveValidDate = (dateValue: string) => {
    const isoDate = convertDateFormat(dateValue, dateFormat, 'YYYY-MM-DD');
    const formattedDate = convertDateFormat(isoDate, 'YYYY-MM-DD', dateFormat);
    setDate(formattedDate);
    onChange(isoDate);
  };

  const handleInputBlur = () => {
    setError(null);
    setIsEditing(false);

    if (!date.trim()) {
      clearDateValue();
      return;
    }

    if (!validateFormat(date, dateFormat)) {
      clearDateValue();
      return;
    }

    const validationError = validate(date);
    if (validationError) {
      clearDateValue();
    } else {
      saveValidDate(date);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!disabled && !readOnly) {
      setIsEditing(true);
      e.stopPropagation();
    }
  };

  const minISO = min ? convertDateFormat(min, dateFormat, 'YYYY-MM-DD') : '';
  const maxISO = max ? convertDateFormat(max, dateFormat, 'YYYY-MM-DD') : '';

  return (
    <div className={`relative ${className} ${isBorder ? "field-component-border" : ""}`} ref={popoverRef}>

      {label && (
        <label className="field-component-label">
          {label}
          {required && <span className="field-component-required">*</span>}
        </label>
      )}

      {/* Input field (shown when editing) */}
      {isEditing && (
        <div className="relative group">
          <input
            ref={inputRef}
            type="text"
            value={date}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            autoFocus
            placeholder={getPlaceholder(dateFormat)}
            disabled={disabled || readOnly}
            className={`field-component ${error ? 'border-red-500 bg-red-50' : ''
              } ${disabled || readOnly ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900'}`}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {error && (
              <div className="group relative">
                <Info className="w-4 h-4 text-red-500 cursor-pointer" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dropdown display (when not editing) */}
      {!isEditing && (
        <button
          ref={buttonRef}
          onDoubleClick={readOnly ? undefined : handleDoubleClick}
          type="button"
          className={`field-component ${error ? 'border-red-500 bg-red-50' : ''
            } ${disabled || readOnly ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900'}`}
          onClick={() => !disabled && !readOnly && allowEdit && setIsOpen(v => !v)}
          disabled={disabled || readOnly}
        >
          {date || <span className="text-gray-400">{getPlaceholder(dateFormat)}</span>}
        </button>
      )}

      {/* Calendar Dropdown Portal */}
      {isOpen && calculatedPosition && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-9999 border rounded-xl shadow-lg w-80 animate-fade-in bg-background"
          style={{
            ...(calculatedPosition.top !== undefined && { top: `${calculatedPosition.top}px` }),
            ...(calculatedPosition.bottom !== undefined && { bottom: `${calculatedPosition.bottom}px` }),
            left: `${calculatedPosition.left}px`,
          }}
        >
          <CalendarPanel
            calendarMonth={calendarMonth}
            onCalendarMonthChange={setCalendarMonth}
            selectedISO={convertDateFormat(date, dateFormat, 'YYYY-MM-DD')}
            onSelect={handleDateSelect}
            readOnly={readOnly}
            hideTodayButton={hideTodayButton}
            isDayDisabled={(day) => (!!minISO && day < minISO) || (!!maxISO && day > maxISO)}
          />
        </div>,
        document.body
      )}

      {error && allowEdit && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 px-2 py-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded shadow-sm">
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
