import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useClickOutside } from '../../../hooks/useClickOutside';

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
  icon?: string;
  config?: {
    hourFormat?: '12' | '24';
    timeFormat?: string;
    defaultValue?: string;
    [key: string]: any;
  };
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function getTimeOptions(step = 30, hourFormat: '12' | '24' = '24') {
  // step in minutes
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += step) {
      if (hourFormat === '12') {
        const period = h >= 12 ? 'PM' : 'AM';
        const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
        options.push(`${displayHour}:${pad(m)} ${period}`);
      } else {
        options.push(`${pad(h)}:${pad(m)}`);
      }
    }
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
  icon = "",
  config = {}
}) => {
  const {
    hourFormat = '24',
    timeFormat = 'HH:mm',
    defaultValue = ''
  } = config;

  const [localValue, setLocalValue] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'below' | 'above'>('below');
  const [calculatedPosition, setCalculatedPosition] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  // Close dropdown if readOnly becomes true
  useEffect(() => {
    if (readOnly) {
      setIsOpen(false);
    }
  }, [readOnly]);

  // Calculate dropdown position for portal rendering
  const calculateDropdownPosition = useCallback(() => {
    const trigger = buttonRef.current;
    if (!trigger) return null;

    const rect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dropdownMinHeight = 200;
    const dropdownWidth = rect.width; // Use button width

        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        
    // Determine if we should open above or below
    let position: 'below' | 'above' = 'below';
    if (spaceBelow < dropdownMinHeight && spaceAbove > spaceBelow) {
      position = 'above';
    }
    setDropdownPosition(position);

    // Calculate left position (align to left edge of trigger)
    let left = rect.left;
    if (left < 10) {
      left = 10; // 10px margin from left edge
    }
    if (left + dropdownWidth > viewportWidth - 10) {
      left = viewportWidth - dropdownWidth - 10; // 10px margin from right edge
    }

    // Calculate top/bottom position
    if (position === 'below') {
      return {
        top: rect.bottom + 8,
        left,
        width: dropdownWidth
      };
    } else {
      return {
        bottom: viewportHeight - rect.top + 8,
        left,
        width: dropdownWidth
      };
    }
  }, []);

  // Update position when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const position = calculateDropdownPosition();
      setCalculatedPosition(position);
    } else {
      setCalculatedPosition(null);
    }
  }, [isOpen, calculateDropdownPosition]);

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
      let hour = parseInt(hours);
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      timeValue = `${pad(hour)}:${minutes}`;
    }

    setLocalValue(timeValue);
    setIsOpen(false);
    setError(null);
    onChange(timeValue);
  };

  const handleNow = () => {
    if (readOnly) return;
    const now = new Date();
    const option = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    handleSelect(option);
  };

  const errorMsg = validate(localValue);
  const placeholder = hourFormat === '12' ? 'hh:mm' : 'HH:mm';
  const timeOptions = getTimeOptions(30, hourFormat); // 30-min increments

  // Format display value
  const displayValue = localValue ? (hourFormat === '12' ?
    (() => {
      const [hours, minutes] = localValue.split(':');
      const hour = parseInt(hours);
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${period}`;
    })() : localValue) : '';

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
                className="px-4 py-2 rounded-xl bg-[var(--color-bg-brand-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-brand-secondary)] text-sm font-medium transition-colors"
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