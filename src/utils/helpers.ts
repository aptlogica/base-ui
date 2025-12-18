import { useRef, useCallback } from "react";

// Debounce utility for delaying function execution
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  return debouncedCallback;
}

// Simple debounce function for non-hook usage
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function useClickHandler(
  onSingleClick: () => void,
  onDoubleClick: () => void,
  delay = 200
) {
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleClick = () => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      onDoubleClick();
    } else {
      clickTimeout.current = setTimeout(() => {
        onSingleClick();
        clickTimeout.current = null;
      }, delay);
    }
  };

  return handleClick;
}

// Convert date from one format to another
export function convertDateFormat(date: string, fromFormat: string, toFormat: string): string {
  if (!date) return '';

  let isoDate = '';

  if (fromFormat === 'YYYY-MM-DD') {
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
