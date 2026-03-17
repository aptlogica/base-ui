// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
/**
 * Get yesterday's date in YYYY-MM-DD format
 */
export function getYesterdayISO(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert date from YYYY-MM-DD to target format
 */
export function convertDateToFormat(dateISO: string, targetFormat: string): string {
  if (!dateISO) return '';
  
  const parts = dateISO.split('-');
  if (parts.length !== 3) return dateISO;
  
  const [year, month, day] = parts;
  
  switch (targetFormat) {
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`;
    case 'YYYY-MM-DD':
      return dateISO;
    default:
      return dateISO;
  }
}

/**
 * Validate Date of Birth - ensures date is not today or in the future
 */
export function validateDOB(dob: string, format: string = 'DD-MM-YYYY'): string | null {
  if (!dob?.trim()) return null;
  
  try {
    let dobDate: Date;
    if (format === 'DD-MM-YYYY') {
      const parts = dob.split('-');
      if (parts.length === 3) {
        const day = Number.parseInt(parts[0], 10);
        const month = Number.parseInt(parts[1], 10) - 1;
        const year = Number.parseInt(parts[2], 10);
        dobDate = new Date(year, month, day);
      } else {
        return 'Please enter a valid date';
      }
    } else {
      dobDate = new Date(dob);
    }
    
    if (Number.isNaN(dobDate.getTime())) {
      return 'Please enter a valid date';
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dobDate.setHours(0, 0, 0, 0);
    
    if (dobDate >= today) {
      return 'Date of birth cannot be today or in the future';
    }
    
    return null;
  } catch (error) {
    return 'Please enter a valid date' + error;
  }
}

