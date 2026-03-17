// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
export interface DropdownOption<T = string | number> {
  label: string;
  value: T;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
  rightLabel?: string;
}

export interface DropdownProps<T = string | number> {
  options: DropdownOption<T>[];
  value?: T | T[];
  onChange: (value: T | T[]) => void;
  multiple?: boolean;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  searchable?: boolean;
  clearable?: boolean;
  maxHeight?: number;
  className?: string;
  required?: boolean;
  label?: string;
  id?: string;
}

export interface DropdownState {
  isOpen: boolean;
  searchQuery: string;
  focusedIndex: number;
  highlightedIndex: number;
}
