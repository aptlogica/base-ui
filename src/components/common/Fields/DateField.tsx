import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { useClickOutside } from '../../../hooks/useClickOutside';

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
  icon?: string;
  config?: {
    defaultValue?: string;
    dateFormat?: string;
    min?: string;
    max?: string;
    description?: string;
    hideTodayButton?: boolean;
    [key: string]: any;
  };
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function getTodayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// Convert date from one format to another
function convertDateFormat(date: string, fromFormat: string, toFormat: string): string {
  if (!date) return '';
  let isoDate = '';

  // Normalize known ISO datetime variants like 2025-09-26T00:00:00Z or with offset
  if (fromFormat === 'ISO' || /\d{4}-\d{2}-\d{2}T/.test(date)) {
    isoDate = date.substring(0, 10);
  } else if (fromFormat === 'YYYY-MM-DD') {
    isoDate = date;
  } else if (fromFormat === 'YYYY/MM/DD') {
    isoDate = date.replace(/\//g, '-');
  } else if (fromFormat === 'DD-MM-YYYY') {
    const parts = date.split('-');
    if (parts.length === 3) {
      isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  } else if (fromFormat === 'MM-DD-YYYY') {
    const parts = date.split('-');
    if (parts.length === 3) {
      isoDate = `${parts[2]}-${parts[0]}-${parts[1]}`;
    }
  } else if (fromFormat === 'DD/MM/YYYY') {
    const parts = date.split('/');
    if (parts.length === 3) {
      isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  } else if (fromFormat === 'MM/DD/YYYY') {
    const parts = date.split('/');
    if (parts.length === 3) {
      isoDate = `${parts[2]}-${parts[0]}-${parts[1]}`;
    }
  } else if (fromFormat === 'DD MM YYYY') {
    const parts = date.split(' ');
    if (parts.length === 3) {
      isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  // Now convert from ISO to target format
  if (!isoDate) return date;

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
  if (!dateStr || !dateStr.trim()) return 'YYYY-MM-DD';

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
    const firstNum = parseInt(parts[0]);
    const secondNum = parseInt(parts[1]);

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
    const firstNum = parseInt(parts[0]);
    const secondNum = parseInt(parts[1]);

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
  icon = "",
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
  const [dropdownPosition, setDropdownPosition] = useState<'below' | 'above'>('below');
  const [calculatedPosition, setCalculatedPosition] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    // Skip if values haven't changed
    if (value === prevValueRef.current && dateFormat === prevDateFormatRef.current) {
      return;
    }

    // Update refs
    prevValueRef.current = value;
    prevDateFormatRef.current = dateFormat;

    // Use default value if value is empty/undefined/null and default value is provided
    const displayValue = (value !== null && value !== undefined && value !== '') ? value : (defaultValue || '');

    // If we have a value, convert it to the new display format
    if (displayValue && displayValue.trim()) {
      const currentFormat = detectDateFormat(displayValue);
      const convertedValue = convertDateFormat(displayValue, currentFormat, dateFormat);

      // Only update if the converted value is different from current date
      if (convertedValue !== date) {
        setDate(convertedValue);
      }

      // For initialization: if we're applying a defaultValue (value is empty), emit ISO once
      const newIso = convertDateFormat(convertedValue, dateFormat, 'YYYY-MM-DD');
      if (displayValue !== value && newIso) {
        onChange(newIso);
      }

      // Update calendar month if the date is valid
      if (newIso) {
        const [y, m] = newIso.split('-');
        setCalendarMonth(new Date(Number(y), Number(m) - 1, 1));
      }
    } else {
      setDate(displayValue);
      // Only call onChange('') if we're actually clearing a value (changing FROM something TO empty)
      // If value is already null/undefined/'', don't call onChange - no change occurred
      // This prevents unnecessary onChange calls during initialization when value is already empty
      if (displayValue === '' && value !== null && value !== undefined && value !== '') {
        onChange('');
      }
      // If displayValue === '' AND value was already null/undefined/'', skip onChange
      // (No change from empty → empty)
    }
  }, [value, dateFormat, format, onChange, defaultValue]);

  // Calculate dropdown position for portal rendering
  const calculateDropdownPosition = useCallback(() => {
    const trigger = buttonRef.current || inputRef.current;
    if (!trigger) return null;

    const rect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dropdownMinHeight = 400;
    const dropdownWidth = 320; // w-80 = 320px

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Determine if we should open above or below
    let position: 'below' | 'above' = 'below';
    if (spaceBelow < dropdownMinHeight && spaceAbove > spaceBelow) {
      position = 'above';
    }
    setDropdownPosition(position);

    // Calculate left position (align with button)
    let left = rect.left;
    if (left + dropdownWidth > viewportWidth - 10) {
      left = viewportWidth - dropdownWidth - 10; // 10px margin from right edge
    }
    if (left < 10) {
      left = 10; // 10px margin from left edge
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
      // Reset calendarMonth to the current date's year/month when opening
      let baseDate = date;
      if (!baseDate || !baseDate.trim()) {
        baseDate = getTodayISO();
      }
      const currentFormat = detectDateFormat(baseDate);
      const isoDate = convertDateFormat(baseDate, currentFormat, 'YYYY-MM-DD');
      const [y, m] = isoDate.split('-');
      setCalendarMonth(new Date(Number(y), Number(m) - 1, 1));

      const position = calculateDropdownPosition();
      setCalculatedPosition(position);
    } else {
      setCalculatedPosition(null);
    }
  }, [isOpen, date, calculateDropdownPosition]);

  useClickOutside({
    isOpen,
    onClose: () => {
      setIsOpen(false);
      setShowYearPicker(false);
      setShowMonthPicker(false);
      setShowQuickSelect(false);
    },
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
      const isOutsideYear = !yearPicker || !yearPicker.contains(target);
      const isOutsideMonth = !monthPicker || !monthPicker.contains(target);
      const isOutsideQuick = !quickSelect || !quickSelect.contains(target);

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

  const validate = (d: string) => {
    if (required && !d) return 'This field is required';
    if (d) {
      // Convert to ISO for validation
      const isoDate = convertDateFormat(d, dateFormat, 'YYYY-MM-DD');
      const dateValue = new Date(isoDate);
      if (isNaN(dateValue.getTime())) return 'Please enter a valid date';
      if (configMin) {
        const minISO = convertDateFormat(configMin, dateFormat, 'YYYY-MM-DD');
        if (isoDate < minISO) return `Date must be after ${configMin}`;
      }
      if (configMax) {
        const maxISO = convertDateFormat(configMax, dateFormat, 'YYYY-MM-DD');
        if (isoDate > maxISO) return `Date must be before ${configMax}`;
      }
    }
    return null;
  };

  const handleDateSelect = (selected: string) => {
    if (readOnly) return;
    const formattedDate = convertDateFormat(selected, 'YYYY-MM-DD', dateFormat);
    setDate(formattedDate);
    setIsOpen(false);
    setShowYearPicker(false);
    setShowMonthPicker(false);
    setShowQuickSelect(false);
    setError(validate(formattedDate));
    // Save ISO to parent
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

  const handleQuickSelect = (daysOffset: number) => {
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysOffset);
    const isoDate = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}`;
    handleDateSelect(isoDate);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDate(newValue);

    const validationError = validate(newValue);
    setError(validationError);
  };

  const handleInputBlur = () => {
    setError(null);
    setIsEditing(false);

    if (date.trim()) {
      if (!validateFormat(date, dateFormat)) {
        setDate('');
        onChange('');
        return;
      }

      // Then check if it's a valid date
      const validationError = validate(date);
      if (!validationError) {
        // Input is valid and matches format - save it
        const isoDate = convertDateFormat(date, dateFormat, 'YYYY-MM-DD');
        const formattedDate = convertDateFormat(isoDate, 'YYYY-MM-DD', dateFormat);
        setDate(formattedDate);
        // Save ISO to parent
        onChange(isoDate);
      } else {
        // Validation failed - clear the input
        setDate('');
        onChange('');
      }
    } else {
      // Empty input - clear the value
      setDate('');
      onChange('');
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!disabled && !readOnly) {
      setIsEditing(true);
      e.stopPropagation();
    }
  };

  // Calendar logic
  // Defensive: ensure calendarMonth is valid
  let safeCalendarMonth = calendarMonth;
  if (isNaN(safeCalendarMonth.getTime())) {
    safeCalendarMonth = new Date();
  }
  const year = safeCalendarMonth.getFullYear();
  const month = safeCalendarMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  // Monday as first day of week
  let startDay = firstDay.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1;
  if (isNaN(startDay) || startDay < 0) startDay = 0;
  const todayISO = getTodayISO();
  const weeks: (string | null)[][] = [];
  let week: (string | null)[] = Array(startDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dayISO = `${year}-${pad(month + 1)}-${pad(d)}`;
    week.push(dayISO);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const currentYear = new Date().getFullYear();
  const [startYear, setStartYear] = React.useState(currentYear); // page starts at selected/current year
  const years = React.useMemo(() => Array.from({ length: 12 }, (_, i) => startYear + i), [startYear]);
  // const years = Array.from({ length: 201 }, (_, i) => currentYear - 100 + i);

  // Generate month options for dropdown
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

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
                        key={index}
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
                          // Optionally: setStartYear(yearOption); // to re-page on select
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
        {weeks.flat().map((day, idx) => (
          <button
            type="button"
            key={idx}
            className={`w-9 h-9 rounded-full text-center text-sm font-medium hover:bg-[var(--color-bg-brand-primary)] hover:text-black transition-colors ${day === convertDateFormat(date, dateFormat, 'YYYY-MM-DD') ? 'bg-[var(--color-bg-brand-solid)] text-black font-bold' :
              day === todayISO ? 'border border-[var(--color-bg-brand-primary)] text-primary' :
                'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-brand-primary)]'
              } ${!day ? 'opacity-0 pointer-events-none' : ''}`}
            onClick={() => day && !readOnly && handleDateSelect(day)}
            disabled={!day || readOnly || (min && day < convertDateFormat(min, dateFormat, 'YYYY-MM-DD')) || (max && day > convertDateFormat(max, dateFormat, 'YYYY-MM-DD')) ? true : false}
          >
            {day ? Number(day.split('-')[2]) : ''}
          </button>
        ))}
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
          onDoubleClick={!readOnly ? handleDoubleClick : undefined}
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
            // width: `${calculatedPosition.width}px`
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