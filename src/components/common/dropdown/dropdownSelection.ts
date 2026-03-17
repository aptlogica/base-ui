// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
export function normalizeSelection<T>(
  value: T | T[] | undefined | null,
  isEmpty?: (item: T) => boolean
): T[] {
  if (value === undefined || value === null) return [];
  const raw = Array.isArray(value) ? value : [value];
  if (!isEmpty) return raw;
  return raw.filter(item => !isEmpty(item));
}

export function toggleSelection<T>(values: T[], option: T): T[] {
  return values.includes(option)
    ? values.filter(v => v !== option)
    : [...values, option];
}

export function isSelected<T>(values: T[], option: T): boolean {
  return values.includes(option);
}

export function getDisplayValue(values: string[], placeholder: string, multiple: boolean): string {
  if (values.length === 0) return placeholder;
  if (!multiple) return values[0] ?? placeholder;
  if (values.length > 2) return `${values.length} items selected`;
  return values.join(', ');
}
