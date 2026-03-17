// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useClickOutside } from '../../../hooks/useClickOutside';
import { pad2 } from '../../../utils/timeFormatUtils';
import { useDropdownPosition } from '../../../hooks/useDropdownPosition';

interface TimeProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  isBorder?: boolean;
  className?: string;
  allowEdit?: boolean; // true = single click opens dropdown, false = double click for manual edit
  readOnly?: boolean; // true = completely prevent editing
  helperText?: string;
  config?: {
    hourFormat?: '12' | '24';
    timeFormat?: string;
    defaultValue?: string;
    [key: string]: any;
  };
}

const getPeriod = (hour: number): string => {
  if (hour >= 12) return 'PM';
  return 'AM';
};

const getDisplayHour12 = (hour: number): number => {
  if (hour === 0) return 12;
  if (hour > 12) return hour - 12;
  return hour;
};

const formatTime12Hour = (hour: number, minute: number): string => {
  const period = getPeriod(hour);
  const displayHour = getDisplayHour12(hour);
  return `${displayHour}:${pad2(minute)} ${period}`;
};

const formatTime24Hour = (hour: number, minute: number): string => {
  return `${pad2(hour)}:${pad2(minute)}`;
};

const generateTimeOptionsForHour = (hour: number, step: number, hourFormat: '12' | '24'): string[] => {
  const options: string[] = [];
  for (let m = 0; m < 60; m += step) {
    if (hourFormat === '12') {
      options.push(formatTime12Hour(hour, m));
    } else {
      options.push(formatTime24Hour(hour, m));
    }
  }
  return options;
};

function getTimeOptions(step = 30, hourFormat: '12' | '24' = '24') {
  // step in minutes
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    const hourOptions = generateTimeOptionsForHour(h, step, hourFormat);
    options.push(...hourOptions);
  }
  return options;
}

export const Time: React.FC<TimeProps> = ({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  isBorder = false,
  className = "",
  allowEdit = true,
  readOnly = false,
  helperText,
  config = {}
}) => {
  const {
    hourFormat = '24',
    } = config;

  const [localValue, setLocalValue] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const calculatedPosition = useDropdownPosition(
    buttonRef as React.RefObject<HTMLElement>,
    isOpen,
    { dropdownMinHeight: 200, offset: 8, sideMargin: 10 }
  );

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  // Close dropdown if readOnly becomes true
  useEffect(() => {
    if (readOnly) {
      setIsOpen(false);
    }
  }, [readOnly]);

  useClickOutside({
    isOpen,
    onClose: () => setIsOpen(false),
    excludeRefs: [buttonRef, popoverRef, dropdownRef]
  });

  const validate = (val: string) => {
    if (required && !val.trim()) {
      return 'This field is required';
    }
    // No further validation for time
    return null;
  };

  const handleSelect = (option: string) => {
    if (readOnly) return;
    // Convert 12-hour format to 24-hour format for storage
    let timeValue = option;
    if (hourFormat === '12' && option.includes(' ')) {
      const [time, period] = option.split(' ');
      const [hours, minutes] = time.split(':');
      let hour = Number.parseInt(hours);
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      timeValue = `${pad2(hour)}:${minutes}`;
    }

    setLocalValue(timeValue);
    setIsOpen(false);
    setError(null);
    onChange(timeValue);
  };

  const handleNow = () => {
    if (readOnly) return;
    const now = new Date();
    const option = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    handleSelect(option);
  };

  const errorMsg = validate(localValue);
  const placeholder = hourFormat === '12' ? 'hh:mm' : 'HH:mm';
  const timeOptions = getTimeOptions(30, hourFormat); // 30-min increments

  // Format display value
  const formatDisplayValue = (value: string, format: '12' | '24'): string => {
    if (!value) return '';
    if (format === '12') {
      const [hours, minutes] = value.split(':');
      const hour = Number.parseInt(hours);
      const period = getPeriod(hour);
      const displayHour = getDisplayHour12(hour);
      return `${displayHour}:${minutes} ${period}`;
    }
    return value;
  };

  const displayValue = formatDisplayValue(localValue, hourFormat);

  return (
    <div className={`relative ${className} ${isBorder ? "field-component-border" : ""}`} ref={popoverRef}>
      {/* Label */}
      {label && (
        <label className="field-component-label">
          {label}
          {required && <span className="field-component-required">*</span>}
        </label>
      )}

      <div className={`relative group`}>
        <button
          ref={buttonRef}
          type="button"
          className={`field-component flex items-center justify-between ${errorMsg ? 'border-red-500 bg-red-50' : ''
            } ${disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900'}`}
          onClick={() => !disabled && !readOnly && allowEdit && setIsOpen(v => !v)}
          disabled={disabled || readOnly}
        >
          <span>{displayValue || <span className="text-gray-400">{placeholder}</span>}</span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {/* Time Dropdown Portal */}
        {isOpen && calculatedPosition && createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] border bg-background rounded-xl shadow-lg max-h-80 animate-fade-in flex flex-col"
            style={{
              ...(calculatedPosition.top !== undefined && { top: `${calculatedPosition.top}px` }),
              ...(calculatedPosition.bottom !== undefined && { bottom: `${calculatedPosition.bottom}px` }),
              left: `${calculatedPosition.left}px`,
              width: `${calculatedPosition.width}px`
            }}
          >
            {/* Scrollable time options */}
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
              {timeOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  className={`w-full px-4 py-2 text-md text-left text-[var(--color-text-primary)] rounded-xl hover:bg-[var(--color-bg-brand-primary)] hover:text-black focus:bg-[var(--color-bg-brand-secondary)] transition-colors ${displayValue === option ? 'bg-[var(--color-bg-brand-secondary)] text-black font-bold' : ''}`}
                  onClick={() => !readOnly && handleSelect(option)}
                  disabled={readOnly}
                >
                  {option}
                </button>
              ))}
            </div>
            {/* Fixed footer with Now button */}
            <div className="border-t border-gray-100 px-2 py-2 flex justify-center bg-background flex-shrink-0 rounded-bl-lg rounded-br-lg">
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-[var(--color-bg-brand-primary)] text-black hover:bg-[var(--color-bg-brand-secondary)] text-sm font-medium transition-colors"
                onClick={() => !readOnly && handleNow()}
                disabled={readOnly}
              >
                Now
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* Error*/}
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

