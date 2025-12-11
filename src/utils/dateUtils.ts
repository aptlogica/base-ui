import { DateTime } from "luxon";

/**
 * Utility functions for date formatting and handling
 */

/**
 * Format a date string to a readable format
 * @param dateStr - The date string to format (ISO string, timestamp, etc.)
 * @param options - Formatting options
 * @returns Formatted date string or 'N/A' if invalid
 */
export const formatDate = (
  dateStr: string | null | undefined,
  options: {
    year?: 'numeric' | '2-digit';
    month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
    day?: 'numeric' | '2-digit';
    hour?: 'numeric' | '2-digit';
    minute?: 'numeric' | '2-digit';
    second?: 'numeric' | '2-digit';
    timeZoneName?: 'short' | 'long';
  } = {}
): string => {
  // Default options for a clean date format
  const defaultOptions = {
    year: 'numeric' as const,
    month: 'short' as const,
    day: 'numeric' as const,
    ...options
  };

  // Handle null, undefined, or empty strings
  if (!dateStr) {
    return 'N/A';
  }

  // Handle placeholder dates (common in APIs)
  if (dateStr === '0001-01-01T00:00:00Z' || dateStr === '1970-01-01T00:00:00Z') {
    return 'N/A';
  }

  try {
    const date = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }

    return date.toLocaleDateString('en-US', defaultOptions);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return 'N/A';
  }
};

/**
 * Format a date string to a relative time (e.g., "2 days ago")
 * @param dateStr - The date string to format
 * @returns Relative time string or 'N/A' if invalid
 */
export const formatRelativeDate = (dateStr: string | null | undefined): string => {
  if (!dateStr || dateStr === '0001-01-01T00:00:00Z' || dateStr === '1970-01-01T00:00:00Z') {
    return 'N/A';
  }

  try {
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      return 'N/A';
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days === 1 ? '' : 's'} ago`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months === 1 ? '' : 's'} ago`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years} year${years === 1 ? '' : 's'} ago`;
    }
  } catch (error) {
    console.warn('Relative date formatting error:', error);
    return 'N/A';
  }
};

/**
 * Check if a date string is a placeholder or invalid date
 * @param dateStr - The date string to check
 * @returns True if the date is a placeholder or invalid
 */
export const isPlaceholderDate = (dateStr: string | null | undefined): boolean => {
  if (!dateStr) return true;
  
  const placeholderDates = [
    '0001-01-01T00:00:00Z',
    '1970-01-01T00:00:00Z',
    '1900-01-01T00:00:00Z'
  ];
  
  return placeholderDates.includes(dateStr);
};



/**
 * Convert local date/time from a given timezone to UTC ISO string
 */
export function zonedToUtcISO(dateStr: string, timeStr: string, fromZone: string): string {
  const dt = DateTime.fromFormat(`${dateStr} ${timeStr}`, "yyyy-MM-dd HH:mm", { zone: fromZone });
  if (!dt.isValid) throw new Error("Invalid date/time or timezone");
  return dt.toUTC().toISO() || "";
}

/**
 * Convert a UTC ISO string to a date/time in a given timezone
 */
export function utcISOToZoned(utcIso: string, toZone: string): string {
  const dt = DateTime.fromISO(utcIso, { zone: "utc" });
  if (!dt.isValid) throw new Error("Invalid UTC ISO string");
  return dt.setZone(toZone).toFormat("yyyy-MM-dd HH:mm");
}

export function getCurrentTimeInZone(zone: string): string {
  const dt = DateTime.now().setZone(zone);
  if (!dt.isValid) throw new Error("Invalid timezone");
  return dt.toFormat("yyyy-MM-dd HH:mm:ss");
}