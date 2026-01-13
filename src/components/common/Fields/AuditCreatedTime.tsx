import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { utcISOToZoned, zonedToUtcISO } from '../../../utils/dateUtils';

interface AuditCreatedTimeProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  isBorder?: boolean;
  className?: string;
  allowEdit?: boolean;
  helperText?: string;
  icon?: string;
  config?: {
    dateFormat?: string;
    timeFormat?: string;
    hourFormat?: '12' | '24';
    timeZone?: string;
    displayTimeZone?: boolean;
    sameTimezone?: boolean;
    defaultValue?: string;
    [key: string]: any;
  };
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function getTimeOptions(step = 30, hourFormat: '12' | '24' = '24', timeFormat: string = 'HH:mm') {
  const options: string[] = [];
  
  // Determine step based on time format
  let actualStep = step;
  if (timeFormat === 'HH:mm:ss' || timeFormat === 'HH:mm:ss.SSS') {
    actualStep = 1; // Show every minute for seconds format
  }
  
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += actualStep) {
      if (hourFormat === '12') {
        const period = h >= 12 ? 'PM' : 'AM';
        const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
        
        if (timeFormat === 'HH:mm:ss' || timeFormat === 'HH:mm:ss.SSS') {
          // For seconds format, show seconds as 00
          options.push(`${displayHour}:${pad(m)}:00 ${period}`);
        } else {
          options.push(`${displayHour}:${pad(m)} ${period}`);
        }
      } else {
        if (timeFormat === 'HH:mm:ss' || timeFormat === 'HH:mm:ss.SSS') {
          // For seconds format, show seconds as 00
          options.push(`${pad(h)}:${pad(m)}:00`);
        } else {
          options.push(`${pad(h)}:${pad(m)}`);
        }
      }
    }
  }
  return options;
}

function getTodayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function formatDate(date: string, format: string): string {
  if (!date) return '';

  const [year, month, day] = date.split('-');
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));

  switch (format) {
    case 'YYYY-MM-DD':
      return date;
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
      return date;
  }
}

function parseDate(dateStr: string, format: string): string {
  if (!dateStr) return '';

  let year, month, day;

  switch (format) {
    case 'YYYY-MM-DD':
      [year, month, day] = dateStr.split('-');
      break;
    case 'YYYY/MM/DD':
      [year, month, day] = dateStr.split('/');
      break;
    case 'DD-MM-YYYY':
      [day, month, year] = dateStr.split('-');
      break;
    case 'MM-DD-YYYY':
      [month, day, year] = dateStr.split('-');
      break;
    case 'DD/MM/YYYY':
      [day, month, year] = dateStr.split('/');
      break;
    case 'MM/DD/YYYY':
      [month, day, year] = dateStr.split('/');
      break;
    case 'DD MM YYYY':
      [day, month, year] = dateStr.split(' ');
      break;
    default:
      return dateStr;
  }

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Validate if input matches the expected format pattern
function validateDateTimeFormat(input: string, dateFormat: string, timeFormat: string, hourFormat: '12' | '24'): boolean {
  if (!input.trim()) return false;

  // Split input into date and time parts
  const parts = input.split(' ');
  if (parts.length !== 2) return false;

  const [datePart, timePart] = parts;

  // Validate date format
  let dateValid = false;
  switch (dateFormat) {
    case 'YYYY-MM-DD':
      dateValid = /^\d{4}-\d{2}-\d{2}$/.test(datePart);
      break;
    case 'YYYY/MM/DD':
      dateValid = /^\d{4}\/\d{2}\/\d{2}$/.test(datePart);
      break;
    case 'DD-MM-YYYY':
      dateValid = /^\d{2}-\d{2}-\d{4}$/.test(datePart);
      break;
    case 'MM-DD-YYYY':
      dateValid = /^\d{2}-\d{2}-\d{4}$/.test(datePart);
      break;
    case 'DD/MM/YYYY':
      dateValid = /^\d{2}\/\d{2}\/\d{4}$/.test(datePart);
      break;
    case 'MM/DD/YYYY':
      dateValid = /^\d{2}\/\d{2}\/\d{4}$/.test(datePart);
      break;
    case 'DD MM YYYY':
      dateValid = /^\d{2} \d{2} \d{4}$/.test(datePart);
      break;
  }

  // Validate time format
  let timeValid = false;
  if (hourFormat === '12') {
    timeValid = /^\d{1,2}:\d{2} (AM|PM)$/.test(timePart);
  } else {
    timeValid = /^\d{2}:\d{2}$/.test(timePart);
  }

  return dateValid && timeValid;
}

// Get placeholder based on format
function getDateTimePlaceholder(dateFormat: string, hourFormat: '12' | '24', timeFormat: string = 'HH:mm'): string {
  return `${dateFormat} ${timeFormat}`;
}

// Convert a local date (YYYY-MM-DD) and time (HH:mm or HH:mm:ss[.SSS]) into a UTC ISO string with Z
function toUtcIso(localDate: string, localTime: string): string {
  const candidate = `${localDate}T${localTime}`;
  const d = new Date(candidate);
  if (!isNaN(d.getTime())) {
    return d.toISOString();
  }
  // Fallback: append Z if parsing somehow failed (should be rare with valid inputs)
      return `${localDate}T${localTime}Z`;
}

// Normalize any display time (possibly 12h or with seconds) to 24h HH:mm for calculations
function toHHmm(timeStr: string, hourFormat: '12' | '24', timeFormat: string): string {
  if (!timeStr) return '';
  let t = timeStr.trim();
  if (hourFormat === '12') {
    // Expect formats like h:mm, h:mm:ss, h:mm:ss.SSS optionally with AM/PM
    const parts = t.split(' ');
    let period = '';
    if (parts.length === 2) {
      t = parts[0];
      period = parts[1];
    }
    const [hStr, mStr] = t.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (period.toUpperCase() === 'AM' && h === 12) h = 0;
    return `${pad(h)}:${pad(m)}`;
  }
  // 24h: just take HH and mm even if seconds are present
  const segs = t.split(':');
  const HH = segs[0] || '00';
  const MM = segs[1] || '00';
  return `${pad(parseInt(HH, 10))}:${pad(parseInt(MM, 10))}`;
}

export const AuditCreatedTime: React.FC<AuditCreatedTimeProps> = ({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  isBorder = false,
  className = "",
  allowEdit = true,
  helperText,
  icon = "",
  config = {}
}) => {
  const {
    dateFormat = 'YYYY-MM-DD',
    timeFormat = 'HH:mm',
    hourFormat = '24',
    displayTimeZone = false,
    sameTimezone = false,
    defaultValue = ''
  } = config;

  // Split value into date and time
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showQuickSelect, setShowQuickSelect] = useState(false);
  const [dateDropdownPosition, setDateDropdownPosition] = useState<'below' | 'above'>('below');
  const [timeDropdownPosition, setTimeDropdownPosition] = useState<'below' | 'above'>('below');
  const [displayOriginalTime, setDisplayOriginalTime] = useState('');
  const [displayOriginalDate, setDisplayOriginalDate] = useState('');
  const [dateCalculatedPosition, setDateCalculatedPosition] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);
  const [timeCalculatedPosition, setTimeCalculatedPosition] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);
  const dateButtonRef = useRef<HTMLButtonElement>(null);
  const timeButtonRef = useRef<HTMLButtonElement>(null);
  const datePopoverRef = useRef<HTMLDivElement>(null);
  const timePopoverRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const timeDropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const currentValue = value || defaultValue;
    if (currentValue) {
      const [d, t] = currentValue.split('T');
      setDate(d || '');
      setTime(t ? t.slice(0, 5) : '');
    } else {
      setDate('');
      setTime('');
    }
  }, [value, defaultValue]);

  useEffect(() => {
  }, [displayTimeZone])

  // Calculate date dropdown position for portal rendering
  const calculateDateDropdownPosition = useCallback(() => {
    const trigger = dateButtonRef.current;
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
    setDateDropdownPosition(position);

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

  useEffect(() => {
    if (!dateOpen) {
      setDateCalculatedPosition(null);
      return;
    }

    const position = calculateDateDropdownPosition();
    setDateCalculatedPosition(position);

    const handleResize = () => {
      const newPosition = calculateDateDropdownPosition();
      setDateCalculatedPosition(newPosition);
    };

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        dateButtonRef.current && !dateButtonRef.current.contains(target) &&
        dateDropdownRef.current && !dateDropdownRef.current.contains(target) &&
        datePopoverRef.current && !datePopoverRef.current.contains(target)
      ) {
        setDateOpen(false);
        setShowYearPicker(false);
        setShowMonthPicker(false);
        setShowQuickSelect(false);
      }
    }
    
    if (dateOpen) {
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize);
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [dateOpen, calculateDateDropdownPosition]);

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

  // Calculate time dropdown position for portal rendering
  const calculateTimeDropdownPosition = useCallback(() => {
    const trigger = timeButtonRef.current;
    if (!trigger) return null;

    const rect = trigger.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dropdownMinHeight = 300;
    const dropdownWidth = 144; // w-36 = 144px

        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        
    // Determine if we should open above or below
    let position: 'below' | 'above' = 'below';
    if (spaceBelow < dropdownMinHeight && spaceAbove > spaceBelow) {
      position = 'above';
    }
    setTimeDropdownPosition(position);

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

  useEffect(() => {
    if (!timeOpen) {
      setTimeCalculatedPosition(null);
      return;
    }

    const position = calculateTimeDropdownPosition();
    setTimeCalculatedPosition(position);

    const handleResize = () => {
      const newPosition = calculateTimeDropdownPosition();
      setTimeCalculatedPosition(newPosition);
    };

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        timeButtonRef.current && !timeButtonRef.current.contains(target) &&
        timeDropdownRef.current && !timeDropdownRef.current.contains(target) &&
        timePopoverRef.current && !timePopoverRef.current.contains(target)
      ) {
        setTimeOpen(false);
      }
    }
    
    if (timeOpen) {
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize);
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [timeOpen, calculateTimeDropdownPosition]);

  // Compute display-original date/time in configured timezone from the ISO value (UTC)
  useEffect(() => {
    try {
      if (!value) {
        setDisplayOriginalTime('');
        setDisplayOriginalDate('');
        return;
      }
      const hasTz = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(value);
      const dt = new Date(hasTz ? value : `${value}Z`);
      if (isNaN(dt.getTime())) {
        setDisplayOriginalTime('');
        setDisplayOriginalDate('');
        return;
      }

      const tz = config?.timeZoneLabel || config?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      const includeSeconds = timeFormat === 'HH:mm:ss' || timeFormat === 'hh:mm:ss' || timeFormat === 'hh:mm:ss.SSS' || timeFormat === 'HH:mm:ss.SSS';
      const newDateTime = utcISOToZoned(value, tz)

      // Support GMT/UTC offsets like GMT-7, GMT+7, UTC+05:30
      const gmtMatch = /^(?:GMT|UTC)\s*([+-]\d{1,2})(?::?(\d{2}))?$/i.exec(tz || '');
      let map: Record<string, string> = {};
      if (gmtMatch) {
        const signChar = gmtMatch[1][0];
        const hoursAbs = Math.abs(parseInt(gmtMatch[1], 10));
        const minsAbs = gmtMatch[2] ? parseInt(gmtMatch[2], 10) : 0;
        const totalMinutes = (hoursAbs * 60 + minsAbs) * (signChar === '-' ? -1 : 1);
        // Adjust base UTC time by the offset to get local wall-clock in that GMT zone
        const adj = new Date(dt.getTime() + totalMinutes * 60_000);
        map.year = String(adj.getUTCFullYear());
        map.month = pad(adj.getUTCMonth() + 1);
        map.day = pad(adj.getUTCDate());
        map.hour = pad(adj.getUTCHours());
        map.minute = pad(adj.getUTCMinutes());
        if (includeSeconds) map.second = pad(adj.getUTCSeconds());
        // Derive AM/PM if needed
        const hNum = adj.getUTCHours();
        map.dayPeriod = hNum >= 12 ? 'PM' : 'AM';
      } else {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          hour12: hourFormat === '12',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: includeSeconds ? '2-digit' : undefined,
        }).formatToParts(dt);

        for (const p of parts) {
          if (p.type !== 'literal') map[p.type] = p.value;
        }
      }

      const yyyy = map.year || String(dt.getUTCFullYear());
      const mm = map.month || pad(dt.getUTCMonth() + 1);
      const dd = map.day || pad(dt.getUTCDate());

      // Build date string per configured format
      const isoLocalDate = `${yyyy}-${mm}-${dd}`;
      const formattedDate = formatDate(isoLocalDate, dateFormat);

      // Build time string per configured format
      let hh = map.hour || '00';
      const min = map.minute || '00';
      const sec = map.second || (includeSeconds ? '00' : '');
      const period = map.dayPeriod || '';

      let timeStr = '';
      if (hourFormat === '12') {
        // Remove any leading zeros from hour for display in 12h UI
        const hNum = parseInt(hh, 10);
        const displayHour = hNum === 0 ? 12 : hNum > 12 ? hNum - 12 : hNum;
        if (timeFormat === 'hh:mm:ss' || timeFormat === 'HH:mm:ss') {
          timeStr = `${displayHour}:${min}:${sec || '00'} ${period}`.trim();
        } else if (timeFormat === 'hh:mm:ss.SSS' || timeFormat === 'HH:mm:ss.SSS') {
          timeStr = `${displayHour}:${min}:${sec ? sec : '00'}.000 ${period}`.trim();
        } else {
          timeStr = `${displayHour}:${min} ${period}`.trim();
        }
      } else {
        // 24-hour display
        if (timeFormat === 'hh:mm:ss' || timeFormat === 'HH:mm:ss') {
          timeStr = `${hh}:${min}:${sec || '00'}`;
        } else if (timeFormat === 'hh:mm:ss.SSS' || timeFormat === 'HH:mm:ss.SSS') {
          timeStr = `${hh}:${min}:${sec ? sec : '00'}.000`;
        } else {
          timeStr = `${hh}:${min}`;
        }
      }

      setDisplayOriginalDate(formattedDate);
      setDisplayOriginalTime(timeStr);
    } catch {
      // On any unexpected error, do not block rendering
      setDisplayOriginalTime('');
      setDisplayOriginalDate('');
    }
  }, [value, dateFormat, timeFormat, hourFormat, config?.timeZone]);

  const validate = (d: string, t: string) => {
    if (required && (!d || !t)) {
      return 'This field is required';
    }
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Don't save immediately - only update display
    // Save will happen on blur if valid
  };

  const handleInputBlur = () => {
    setIsEditing(false);

    if (inputValue.trim()) {
      // Check if the input matches the expected date+time format
      if (validateDateTimeFormat(inputValue, dateFormat, timeFormat, hourFormat)) {
        // Parse the input and save it
        const [datePart, timePart] = inputValue.split(' ');
        const isoDate = parseDate(datePart, dateFormat);

        // Convert time to 24-hour format for storage
        let timeValue = timePart;
        if (hourFormat === '12' && timePart.includes(' ')) {
          const [time, period] = timePart.split(' ');
          const [hours, minutes] = time.split(':');
          let hour = parseInt(hours);
          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;
          timeValue = `${pad(hour)}:${minutes}`;
        }

        const newValue = toUtcIso(isoDate, timeValue);
        setDate(isoDate);
        setTime(timeValue);
        onChange(newValue);
        return;
      }

      // Support date-only input: validate date part against configured date format
      const raw = inputValue.trim();
      const parts = raw.split(' ');
      if (parts.length === 1) {
        const datePartOnly = parts[0];
        
        let dateOnlyValid = false;
        switch (dateFormat) {
          case 'YYYY-MM-DD':
            dateOnlyValid = /^\d{4}-\d{2}-\d{2}$/.test(datePartOnly);
            break;
          case 'YYYY/MM/DD':
            dateOnlyValid = /^\d{4}\/\d{2}\/\d{2}$/.test(datePartOnly);
            break;
          case 'DD-MM-YYYY':
            dateOnlyValid = /^\d{2}-\d{2}-\d{4}$/.test(datePartOnly);
            break;
          case 'MM-DD-YYYY':
            dateOnlyValid = /^\d{2}-\d{2}-\d{4}$/.test(datePartOnly);
            break;
          case 'DD/MM/YYYY':
            dateOnlyValid = /^\d{2}\/\d{2}\/\d{4}$/.test(datePartOnly);
            break;
          case 'MM/DD/YYYY':
            dateOnlyValid = /^\d{2}\/\d{2}\/\d{4}$/.test(datePartOnly);
            break;
          case 'DD MM YYYY':
            dateOnlyValid = /^\d{2} \d{2} \d{4}$/.test(datePartOnly);
            break;
        }

        if (dateOnlyValid) {
          const isoDate = parseDate(datePartOnly, dateFormat);
          // Default time: keep existing if present, otherwise 00:00 (with seconds if required)
          let defaultTime = time || '00:00';
          if (timeFormat === 'HH:mm:ss' || timeFormat === 'HH:mm:ss.SSS') {
            defaultTime = defaultTime.length === 5 ? `${defaultTime}:00` : defaultTime;
          }
          setDate(isoDate);
          setTime(defaultTime);
          onChange(toUtcIso(isoDate, defaultTime));
          // Keep the user's date input in the inputValue so it doesn't get cleared
          setInputValue(datePartOnly);
          setError(null);
          return;
        }
      }

      // Invalid input: keep what the user typed, but show error instead of clearing
      // setError('Invalid date/time format');
      return;
    } else {
      // Empty input - clear the value
      setInputValue('');
      setDate('');
      setTime('');
      onChange('');
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!disabled) {
      setIsEditing(true);
      // Set input value to current display value
      const displayValue = `${displayDate} ${displayTime}`;
      setInputValue(displayValue);
      e.stopPropagation();
    }
  };

  const handleDateSelect = (selected: string) => {
    let newTime = displayOriginalTime;
    if (!newTime) {
      newTime = '00:00';
      setTime(newTime);
    }
    setDate(selected);
    setDateOpen(false);
    setShowYearPicker(false);
    setShowMonthPicker(false);
    setShowQuickSelect(false);
    // const newValue = toUtcIso(selected, newTime);
    // const newValue = toUtcIso(selected, newTime);
    const normalizedTime = toHHmm(newTime, hourFormat, timeFormat);
    const newValue = zonedToUtcISO(selected, normalizedTime, config?.timeZoneLabel);   
    setError(validate(selected, normalizedTime));
    onChange(newValue);
  };

  const handleNowUtc = () => {
    const now = new Date();
    const iso = now.toISOString();
    const d = iso.slice(0, 10);
    const h = pad(now.getUTCHours());
    const m = pad(now.getUTCMinutes());
    const s = pad(now.getUTCSeconds());
    let t = `${h}:${m}`;
    if (timeFormat === 'HH:mm:ss' || timeFormat === 'hh:mm:ss' || timeFormat === 'HH:mm:ss.SSS' || timeFormat === 'hh:mm:ss.SSS') {
      t = `${h}:${m}:${s}`;
    }
    setDate(d);
    setTime(t);
    setTimeOpen(false);
    setError(validate(d, t));
    onChange(iso);
  };

  const handleTimeSelect = (selected: string) => {
    // Convert 12-hour format to 24-hour format for storage
    let timeValue = selected;
    if (hourFormat === '12' && selected.includes(' ')) {
      const [time, period] = selected.split(' ');
      const [hours, minutes] = time.split(':');
      let hour = parseInt(hours);
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      timeValue = `${pad(hour)}:${minutes}`;
    }
    let newDate = displayOriginalDate;
    if (!newDate) {
      // Set to today in correct format
      const todayISO = getTodayISO();
      newDate = formatDate(todayISO, dateFormat);
      setDate(newDate);
    }
    const isoDate = parseDate(newDate, dateFormat);
    timeValue = toHHmm(timeValue, hourFormat, timeFormat);
    setTime(timeValue);
    setTimeOpen(false);
    const newValue = zonedToUtcISO(isoDate, timeValue, config?.timeZoneLabel);
    setError(validate(isoDate, timeValue));
    onChange(newValue);
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
    // handleDateSelect(isoDate);
  };

  // Calendar logic
  const [calendarMonth, setCalendarMonth] = useState(() => {
    if (date) {
      const [y, m] = date.split('-');
      return new Date(Number(y), Number(m) - 1, 1);
    }
    return new Date();
  });

  useEffect(() => {
    if (date) {
      const [y, m] = date.split('-');
      setCalendarMonth(new Date(Number(y), Number(m) - 1, 1));
    }
  }, [date]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 201 }, (_, i) => currentYear - 100 + i);

  // Generate month options for dropdown
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const renderCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();
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
    return (
      <div className="p-2 bg-background rounded-xl">
        {/* Header with navigation and quick actions */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex w-full items-center justify-between">
            <button
              type="button"
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {/* Month dropdown */}
              <div className="relative" data-month-picker>
                <button
                  className="px-3 py-1 text-sm font-medium hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMonthPicker(!showMonthPicker);
                    setShowYearPicker(false);
                    setShowQuickSelect(false);
                  }}
                >
                  {months[month]}
                  <ChevronLeft className={`w-3 h-3 transition-transform ${showMonthPicker ? 'rotate-90' : '-rotate-90'}`} />
                </button>
                {showMonthPicker && (
                  <div className="absolute top-full left-0 mt-1 p-1.5 space-y-1 border bg-background rounded-xl shadow-lg z-50 w-32 max-h-48 overflow-y-auto">
                    {months.map((monthName, index) => (
                      <button
                        key={index}
                        className={`w-full px-3 py-2 text-left text-sm rounded-xl hover:bg-[var(--color-bg-brand-primary)] hover:text-black focus:bg-[var(--color-bg-brand-secondary)] transition-colors ${index === month ? 'bg-[var(--color-bg-brand-secondary)] text-black font-bold' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMonthSelect(index);
                        }}
                      >
                        {monthName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Year dropdown */}
              <div className="relative" data-year-picker>
                <button
                  className="px-3 py-1 text-sm font-medium hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowYearPicker(!showYearPicker);
                    setShowMonthPicker(false);
                    setShowQuickSelect(false);
                  }}
                >
                  {year}
                  <ChevronLeft className={`w-3 h-3 transition-transform ${showYearPicker ? 'rotate-90' : '-rotate-90'}`} />
                </button>
                {showYearPicker && (
                  <div className="absolute top-full left-0 mt-1 p-1.5 space-y-1 border bg-background rounded-xl shadow-lg z-50 w-24 max-h-48 overflow-y-auto">
                    {years.map((yearOption) => (
                      <button
                        key={yearOption}
                        className={`w-full px-3 py-2 text-left text-sm rounded-xl hover:bg-[var(--color-bg-brand-primary)] hover:text-black focus:bg-[var(--color-bg-brand-secondary)] transition-colors ${yearOption === year ? 'bg-[var(--color-bg-brand-secondary)] text-black font-bold' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleYearSelect(yearOption);
                        }}
                      >
                        {yearOption}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
            >
              <ChevronRight className="w-4 h-4" />
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
              key={idx}
              className={`w-9 h-9 rounded-full text-center text-sm font-medium hover:bg-[var(--color-bg-brand-primary)] hover:text-black transition-colors ${day === date ? 'bg-[var(--color-bg-brand-solid)] text-black font-bold' :
                day === todayISO ? 'border-2 border-[var(--color-border-brand)] text-[var(--color-text-primary)] bg-[var(--color-bg-brand-primary)]' :
                  'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-brand-primary)]'
                } ${!day ? 'opacity-0 pointer-events-none' : ''}`}
              onClick={() => day && handleDateSelect(day)}
              disabled={!day}
            >
              {day ? Number(day.split('-')[2]) : ''}
            </button>
          ))}
        </div>

        {/* Footer with Today button */}
        <div className="flex justify-center mt-4 pt-3 border-t border-gray-100">
          <button
            className="px-4 py-2 rounded-xl bg-[var(--color-bg-brand-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-brand-secondary)] text-sm font-medium transition-colors"
            onClick={() => handleDateSelect(todayISO)}
          >
            Today
          </button>
        </div>
      </div>
    );
  };

  // Time popover logic
  const timeOptions = getTimeOptions(30, hourFormat, timeFormat);

  // Format display values
  const displayDate = date ? formatDate(date, dateFormat) : '';
  const displayTime = time ? (hourFormat === '12' ?
    (() => {
      const [hours, minutes, seconds] = time.split(':');
      const hour = parseInt(hours);
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      
      if (timeFormat === 'hh:mm:ss') {
        return `${displayHour}:${minutes}:${seconds || '00'} ${period}`;
      } 
      else if (timeFormat === 'hh:mm:ss.SSS') {
        return `${displayHour}:${minutes}:${seconds || '00.000'} ${period}`;
      } else {
        return `${displayHour}:${minutes} ${period}`;
      }
    })() : (() => {
      if (timeFormat === 'hh:mm:ss') {
        const [hours, minutes, seconds] = time.split(':');
        return `${hours}:${minutes}:${seconds || '00'}`;
      } else if (timeFormat === 'hh:mm:ss.SSS') {
        const [hours, minutes, seconds] = time.split(':');
        return `${hours}:${minutes}:${seconds || '00.000'}`;
      }
       else {
        return time;
      }
    })()) : '';


  return (
    <div className={`w-full relative ${className} ${isBorder ? "field-component-border" : ""}`} onDoubleClick={handleDoubleClick}>
      {/* Label */}
      {label && (
        <label className="field-component-label">
          {label}
          {required && <span className="field-component-required">*</span>}
        </label>
      )}

      {isEditing ? (
        <div className="relative group">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder={getDateTimePlaceholder(dateFormat, hourFormat, timeFormat)}
            disabled={disabled}
            className={`field-component min-w-max ${error ? 'border-red-500 bg-red-50' : ''
              } ${disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900'}`}
          />
        </div>
      ) : (
        <div className="w-full relative flex items-center gap-2 pr-1.5">
          {/* Date field */}
          <div className="relative" ref={datePopoverRef}>
            <button
              ref={dateButtonRef}
              type="button"
              className={`field-component min-w-max ${error ? 'border-red-500 bg-red-50' : ''
                } ${disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900'}`}
              onClick={() => !disabled && setDateOpen(v => !v)}
              disabled={disabled}
            >
              {displayOriginalDate || <span className="text-gray-400 min-w-max">{dateFormat}</span>} 
            </button>
              </div>
          {/* Date Dropdown Portal */}
          {dateOpen && dateCalculatedPosition && createPortal(
            <div
              ref={dateDropdownRef}
              className="fixed z-[9999] border rounded-xl shadow-lg w-80 animate-fade-in bg-background"
              style={{
                ...(dateCalculatedPosition.top !== undefined && { top: `${dateCalculatedPosition.top}px` }),
                ...(dateCalculatedPosition.bottom !== undefined && { bottom: `${dateCalculatedPosition.bottom}px` }),
                left: `${dateCalculatedPosition.left}px`,
                // width: `${dateCalculatedPosition.width}px`
              }}
            >
              {renderCalendar()}
            </div>,
            document.body
          )}
          {/* Time field */}
          <div className="relative" ref={timePopoverRef}>
            <button
              ref={timeButtonRef}
              type="button"
              className={`field-component min-w-max ${error ? 'border-red-500 bg-red-50' : ''
                } ${disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900'}`}
              onClick={() => !disabled && setTimeOpen(v => !v)}
              disabled={disabled}
            >
               {displayOriginalTime ||          
                <span className="text-gray-400">  {/* hello2 */}
                {timeFormat}
              </span>
              }
            </button>
          </div>
          {/* Time Dropdown Portal */}
          {timeOpen && timeCalculatedPosition && createPortal(
            <div
              ref={timeDropdownRef}
              className="fixed z-[9999] border bg-background rounded-xl shadow-lg w-36 animate-fade-in"
              style={{
                ...(timeCalculatedPosition.top !== undefined && { top: `${timeCalculatedPosition.top}px` }),
                ...(timeCalculatedPosition.bottom !== undefined && { bottom: `${timeCalculatedPosition.bottom}px` }),
                left: `${timeCalculatedPosition.left}px`,
                width: `${timeCalculatedPosition.width}px`
              }}
            >
                <div className="flex flex-col">
                  {/* Scrollable time options */}
                  <div className="flex-1 max-h-64 overflow-y-auto p-1.5 space-y-1">
                    {timeOptions.map(option => (
                      <button
                        key={option}
                        type="button"
                        className={`w-full px-4 py-2 text-sm text-[var(--color-text-primary)] rounded-xl text-left 
              hover:bg-[var(--color-bg-brand-primary)] hover:text-black 
              focus:bg-[var(--color-bg-brand-secondary)] transition-colors 
              ${displayTime === option ? 'bg-[var(--color-bg-brand-secondary)] text-black font-bold' : ''}`}
                      onClick={() => handleTimeSelect(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                  {/* Sticky footer */}
                  <div className="border-t border-gray-100 px-2 py-2 flex justify-center bg-background">
                    <button
                      type="button"
                      className="px-3 py-1 rounded bg-[var(--color-bg-brand-primary)] text-[var(--color-text-primary)] 
            hover:bg-[var(--color-bg-brand-secondary)] text-xs font-medium"
                    onClick={() =>
                     handleNowUtc()
                    }
                    >
                      Now
                    </button>
                  </div>
                </div>
            </div>,
            document.body
            )}
          {/* Timezone indicator - positioned on the right, separate from date & time */}
          {displayTimeZone && (
            <span className="text-xs text-gray-500 ml-auto">
              {config.timeZone}
            </span>
          )}
        </div>
      )}

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