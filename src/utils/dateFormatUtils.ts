// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
// Date format helpers shared by the Date and DateTime fields

// What a date typed in each supported format looks like
const DATE_FORMAT_PATTERNS: Record<string, RegExp> = {
  'YYYY-MM-DD': /^\d{4}-\d{2}-\d{2}$/,
  'YYYY/MM/DD': /^\d{4}\/\d{2}\/\d{2}$/,
  'DD-MM-YYYY': /^\d{2}-\d{2}-\d{4}$/,
  'MM-DD-YYYY': /^\d{2}-\d{2}-\d{4}$/,
  'DD/MM/YYYY': /^\d{2}\/\d{2}\/\d{4}$/,
  'MM/DD/YYYY': /^\d{2}\/\d{2}\/\d{4}$/,
  'DD MM YYYY': /^\d{2} \d{2} \d{4}$/,
};

export const SUPPORTED_DATE_FORMATS = Object.keys(DATE_FORMAT_PATTERNS);

// True when input is written in a supported format; unknown formats never match
export function matchesDateFormat(input: string, format: string): boolean {
  return DATE_FORMAT_PATTERNS[format]?.test(input) ?? false;
}

// Convert from ISO (YYYY-MM-DD) to target format
export function formatISODate(isoDate: string, toFormat: string): string {
  const [year, month, day] = isoDate.split('-');

  switch (toFormat) {
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
