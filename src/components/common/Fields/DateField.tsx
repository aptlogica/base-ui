import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { useClickOutside } from '../../../hooks/useClickOutside';
import { useDropdownPosition } from '../../../hooks/useDropdownPosition';
import { getTodayISO } from '../../../utils/timeFormatUtils';
import { buildCalendarWeeks, MONTH_LABELS } from '../../../utils/calendarUtils';

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

// Convert from ISO (YYYY-MM-DD) to target format
function convertFromISO(isoDate: string, toFormat: string): string {
  const [year, month, day] = isoDate.split('-');

  switch (toFormat) {
    case 'YYYY-MM-DD':
      return isoDate;
    case 'YYYY/MM/DD':
      return `${year}/${month}/${day}`;
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`;
    case 'MM-DD-YYYY':
      return `${month}-${day}-${year}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'DD MM YYYY':
      return `${day} ${month} ${year}`;
    default:
      return isoDate;
  }
}

// Convert date from one format to another
function convertDateFormat(date: string, fromFormat: string, toFormat: string): string {
  if (!date) return '';

  const isoDate = convertToISO(date, fromFormat);
  if (!isoDate) return date;

  return convertFromISO(isoDate, toFormat);
}

// Validate if input matches the expected format pattern
function validateFormat(input: string, format: string): boolean {
  if (!input.trim()) return false;

  switch (format) {
    case 'YYYY-MM-DD':
      return /^\d{4}-\d{2}-\d{2}$/.test(input);
    case 'YYYY/MM/DD':
      return /^\d{4}\/\d{2}\/\d{2}$/.test(input);
    case 'DD-MM-YYYY':
      return /^\d{2}-\d{2}-\d{4}$/.test(input);
    case 'MM-DD-YYYY':
      return /^\d{2}-\d{2}-\d{4}$/.test(input);
    case 'DD/MM/YYYY':
      return /^\d{2}\/\d{2}\/\d{4}$/.test(input);
    case 'MM/DD/YYYY':
      return /^\d{2}\/\d{2}\/\d{4}$/.test(input);
    case 'DD MM YYYY':
      return /^\d{2} \d{2} \d{4}$/.test(input);
    default:
      return /^\d{4}-\d{2}-\d{2}$/.test(input);
  }
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
  switch (format) {
    case 'YYYY-MM-DD':
      return 'YYYY-MM-DD';
    case 'YYYY/MM/DD':
      return 'YYYY/MM/DD';
    case 'DD-MM-YYYY':
      return 'DD-MM-YYYY';
    case 'MM-DD-YYYY':
      return 'MM-DD-YYYY';
    case 'DD/MM/YYYY':
      return 'DD/MM/YYYY';
    case 'MM/DD/YYYY':
      return 'MM/DD/YYYY';
    case 'DD MM YYYY':
      return 'DD MM YYYY';
    default:
      return 'YYYY-MM-DD';
  }
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
  const { defaultValue = '', dateFormat = format, min: configMin = min, max: configMax = max, hideTodayButton = false } = config;
  const [date, setDate] = useState(value || '');
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showQuickSelect, setShowQuickSelect] = useState(false);
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

  const getDisplayValue = (val: string | null | undefined, defaultVal: string): string => {
    return (val !== null && val !== undefined && val !== '') ? val : (defaultVal || '');
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

    const displayValue = getDisplayValue(value, defaultValue);

    if (displayValue?.trim()) {
      handleNonEmptyValue(displayValue, value, dateFormat, setDate, setCalendarMonth, onChange);
    } else {
      handleEmptyValue(displayValue, value, setDate, onChange);
    }
  }, [value, dateFormat, format, onChange, defaultValue]);

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
    setShowYearPicker(false);
    setShowMonthPicker(false);
    setShowQuickSelect(false);
  };

  useClickOutside({
    isOpen,
    onClose: closeAllDropdowns,
    excludeRefs: [buttonRef, inputRef, popoverRef, dropdownRef]
  });

  // Add separate effect for year/month dropdowns
  useEffect(() => {
    if (!showYearPicker && !showMonthPicker && !showQuickSelect) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const yearPicker = document.querySelector('[data-year-picker]');
      const monthPicker = document.querySelector('[data-month-picker]');
      const quickSelect = document.querySelector('[data-quick-select]');

      // Check if click is outside all dropdowns
      const isOutsideYear = !yearPicker?.contains(target);
      const isOutsideMonth = !monthPicker?.contains(target);
      const isOutsideQuick = !quickSelect?.contains(target);

      if (showYearPicker && isOutsideYear) {
        setShowYearPicker(false);
      }
      if (showMonthPicker && isOutsideMonth) {
        setShowMonthPicker(false);
      }
      if (showQuickSelect && isOutsideQuick) {
        setShowQuickSelect(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showYearPicker, showMonthPicker, showQuickSelect]);

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

  const handleYearSelect = (year: number) => {
    const newDate = new Date(calendarMonth);
    newDate.setFullYear(year);
    setCalendarMonth(newDate);
    setShowYearPicker(false);
  };

  const handleMonthSelect = (month: number) => {
    const newDate = new Date(calendarMonth);
    newDate.setMonth(month);
    setCalendarMonth(newDate);
    setShowMonthPicker(false);
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

  // Calendar logic
  const getSafeCalendarMonth = (month: Date): Date => {
    return Number.isNaN(month.getTime()) ? new Date() : month;
  };

  const safeCalendarMonth = getSafeCalendarMonth(calendarMonth);
  const year = safeCalendarMonth.getFullYear();
  const month = safeCalendarMonth.getMonth();
  const todayISO = getTodayISO();
  const weeks = buildCalendarWeeks(year, month, true);

  const currentYear = new Date().getFullYear();
  const [startYear, setStartYear] = React.useState(currentYear); // page starts at selected/current year
  const years = React.useMemo(() => Array.from({ length: 12 }, (_, i) => startYear + i), [startYear]);
  // Generate month options for dropdown
  const months = MONTH_LABELS;

  // For year dropdown
  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStartYear((y) => y - 12);
  };
  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStartYear((y) => y + 12);
  };

  // For month dropdown: change year of calendarMonth
  const goPrevMonthYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCalendarMonth((prev) => new Date(prev.getFullYear() - 1, prev.getMonth(), 1));
  };
  const goNextMonthYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCalendarMonth((prev) => new Date(prev.getFullYear() + 1, prev.getMonth(), 1));
  };

  const renderCalendar = () => (
    <div className="p-2 bg-background rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
          >
            <ChevronLeft className="w-4 h-4 text-[var(--color-text-primary)]" />
          </button>

          <div className="flex items-center gap-1">
            {/* Month dropdown */}
            <div className="relative" data-month-picker>
              <button
                type="button"
                className="px-3 py-1 text-sm font-medium hover:bg-gray-100 text-[var(--color-text-primary)] rounded-md transition-colors flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMonthPicker(!showMonthPicker);
                  setShowYearPicker(false);
                  setShowQuickSelect(false);
                }}
              >
                {months[month]}
                <ChevronLeft className={`w-3 h-3 text-[var(--color-text-primary)] transition-transform ${showMonthPicker ? 'rotate-90' : '-rotate-90'}`} />
              </button>
              {showMonthPicker && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-64 rounded-xl border bg-background shadow-lg z-50">
                  <div className="flex items-center justify-between p-2 border-b">
                    <button
                      type="button"
                      onClick={goPrevMonthYear}
                      className="h-8 w-8 grid place-items-center rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-[var(--color-text-primary)]" />
                    </button>
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">
                      {calendarMonth.getFullYear()}
                    </div>
                    <button
                      type="button"
                      onClick={goNextMonthYear}
                      className="h-8 w-8 grid place-items-center rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-[var(--color-text-primary)]" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2">
                    {months.map((monthName, index) => (
                      <button
                        key={monthName}
                        className={[
                          "w-full py-2 rounded-xl text-sm text-center transition-colors",
                          "text-[var(--color-text-primary)] hover:bg-[var(--color-bg-brand-primary)] hover:text-black",
                          index === month
                            ? "bg-[var(--color-bg-brand-secondary)] text-black font-semibold"
                            : ""
                        ].join(" ")}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMonthSelect(index);
                        }}
                      >
                        {monthName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Year dropdown */}
            <div className="relative" data-year-picker>
              <button
                type="button"
                className="px-3 py-1 text-sm font-medium hover:bg-gray-100 text-[var(--color-text-primary)] rounded-md transition-colors flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowYearPicker(!showYearPicker);
                  setShowMonthPicker(false);
                  setShowQuickSelect(false);
                }}
              >
                {year}
                <ChevronLeft className={`w-3 h-3 text-[var(--color-text-primary)] transition-transform ${showYearPicker ? 'rotate-90' : '-rotate-90'}`} />
              </button>
              {showYearPicker && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-64 rounded-xl border bg-background shadow-lg z-50">
                  <div className="flex items-center justify-between p-2 border-b">
                    <button
                      type="button"
                      onClick={goPrev}
                      className="h-8 w-8 grid place-items-center rounded-xl hover:bg-gray-100"
                    >
                      <ChevronLeft className="w-4 h-4 text-[var(--color-text-primary)]" />
                    </button>
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">
                      {currentYear}
                    </div>
                    <button
                      type="button"
                      onClick={goNext}
                      className="h-8 w-8 grid place-items-center rounded-xl hover:bg-gray-100"
                    >
                      <ChevronRight className="w-4 h-4 text-[var(--color-text-primary)]" />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2 p-2">
                    {years.map((yearOption) => (
                      <button
                        type="button"
                        key={yearOption}
                        className={[
                          "w-full py-2 rounded-md text-sm text-center transition-colors",
                          "text-[var(--color-text-primary)] hover:bg-[var(--color-bg-brand-secondary)] hover:text-black",
                          yearOption === year
                            ? "bg-[var(--color-bg-brand-secondary)] text-black font-semibold"
                            : ""
                        ].join(" ")}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleYearSelect(yearOption);
                        }}
                      >
                        {yearOption}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            className="p-2 rounded-xl hover:bg-gray-100 text-[var(--color-text-brand-tertiary)] transition-colors"
            onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
          >
            <ChevronRight className="w-4 h-4 text-[var(--color-text-primary)]" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-2">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
          <div key={d} className="text-center font-medium">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((day, idx) => {
          let dayClasses = '';
          if (day === convertDateFormat(date, dateFormat, 'YYYY-MM-DD')) {
            dayClasses = 'bg-[var(--color-bg-brand-primary)] text-black font-bold';
          } else if (day === todayISO) {
            dayClasses = 'text-[var(--color-bg-brand-primary)]';
          } else {
            dayClasses = 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-brand-primary)]';
          }

          return (
            <button
              type="button"
              key={day || `empty-${idx}`}
              className={`w-8 h-8 rounded-xl text-center text-sm font-medium hover:bg-[var(--color-bg-brand-primary)] hover:text-black transition-colors ${dayClasses} ${day ? '' : 'opacity-0 pointer-events-none'}`}
              onClick={() => day && !readOnly && handleDateSelect(day)}
              disabled={!!(!day || readOnly || (min && day < convertDateFormat(min, dateFormat, 'YYYY-MM-DD')) || (max && day > convertDateFormat(max, dateFormat, 'YYYY-MM-DD')))}
            >
              {day ? Number(day.split('-')[2]) : ''}
            </button>
          );
        })}
      </div>

      {/* Footer with Today button */}
      {!hideTodayButton && (
        <div className="flex justify-center mt-4 pt-3 border-t">
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-[var(--color-bg-brand-primary)] text-black hover:bg-[var(--color-bg-brand-secondary)] text-sm font-medium transition-colors"
            onClick={() => !readOnly && handleDateSelect(todayISO)}
            disabled={readOnly}
          >
            Today
          </button>
        </div>
      )}
    </div>
  );

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
          className="fixed z-[9999] border rounded-xl shadow-lg w-80 animate-fade-in bg-background"
          style={{
            ...(calculatedPosition.top !== undefined && { top: `${calculatedPosition.top}px` }),
            ...(calculatedPosition.bottom !== undefined && { bottom: `${calculatedPosition.bottom}px` }),
            left: `${calculatedPosition.left}px`,
          }}
        >
          {renderCalendar()}
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
