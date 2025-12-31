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

/**
 * Formats a number to a compact, human-readable string
 * Examples: 8778 -> "8.8K", 1234567 -> "1.2M", 500 -> "500"
 */
export function formatCompactNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  }
  
  if (num < 1000000) {
    // Thousands: 8778 -> 8.8K
    const thousands = num / 1000;
    // Round to 1 decimal place, but show as integer if it's a whole number
    const rounded = Math.round(thousands * 10) / 10;
    return rounded % 1 === 0 ? `${rounded}K` : `${rounded.toFixed(1)}K`;
  }
  
  if (num < 1000000000) {
    // Millions: 1234567 -> 1.2M
    const millions = num / 1000000;
    const rounded = Math.round(millions * 10) / 10;
    return rounded % 1 === 0 ? `${rounded}M` : `${rounded.toFixed(1)}M`;
  }
  
  // Billions: 1234567890 -> 1.2B
  const billions = num / 1000000000;
  const rounded = Math.round(billions * 10) / 10;
  return rounded % 1 === 0 ? `${rounded}B` : `${rounded.toFixed(1)}B`;
}

/**
 * Gets initials from a name string (2 letters when possible)
 * Examples: "Movies Base" -> "MB", "Base" -> "BA", "New" -> "NE"
 * @param name - The name string to get initials from
 * @param fallback - Fallback initial if name is empty (default: 'U')
 * @returns 2-letter initials when possible, or 1-2 characters
 */
export function getInitials(name: string, fallback: string = 'U'): string {
  if (!name || !name.trim()) return fallback;
  
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    // If multiple words, take first letter of first two words
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  
  // If single word, take first 2 characters (or first if only 1 char)
  const result = name.substring(0, 2).toUpperCase();
  return result || name.charAt(0).toUpperCase() || fallback;
}