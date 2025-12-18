import { DropdownOption } from '../types/dropdown';

export function normalizeValue<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

export function getDisplayLabel<T>(
  value: T | T[] | undefined | null,
  options: DropdownOption<T>[],
  placeholder: string,
  multiple: boolean
): string {
  const normalizedValue = normalizeValue(value);
  
  if (normalizedValue.length === 0) return placeholder;
  
  const labels = normalizedValue
    .map(val => options.find(opt => opt.value === val)?.label)
    .filter(Boolean);
  
  if (labels.length === 0) return placeholder;
  
  if (multiple) {
    if (labels.length > 2) {
      return `${labels.length} items selected`;
    }
    return labels.join(', ');
  }
  
  return labels[0] || placeholder;
}

export function filterOptions<T>(
  options: DropdownOption<T>[],
  searchQuery: string
): DropdownOption<T>[] {
  if (!searchQuery.trim()) return options;
  
  const query = searchQuery.toLowerCase();
  return options.filter(option =>
    option.label.toLowerCase().includes(query) ||
    (option.description?.toLowerCase().includes(query))
  );
}

export function getSelectedCount<T>(
  value: T | T[] | undefined | null
): number {
  const normalizedValue = normalizeValue(value);
  return normalizedValue.length;
}

export function isValueSelected<T>(
  optionValue: T,
  currentValue: T | T[] | undefined | null,
  multiple: boolean
): boolean {
  if (multiple) {
    const normalizedValue = normalizeValue(currentValue);
    return normalizedValue.includes(optionValue);
  }
  return currentValue === optionValue;
}