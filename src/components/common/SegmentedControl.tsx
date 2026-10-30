// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
}

// A small two-or-more way switch: a grey track with the selected option as a white pill
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className = '',
}: Readonly<SegmentedControlProps<T>>): React.ReactElement {
  return (
    <fieldset
      aria-label={ariaLabel}
      className={`flex gap-1 p-[3px] m-0 min-w-0 border-0 rounded-xl bg-(--color-gray-100) ${className}`}
    >
      {options.map(option => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            disabled={option.disabled}
            onClick={() => !selected && onChange(option.value)}
            className={`flex-1 py-1.5 rounded-[10px] text-[13px] font-medium transition-colors ${selected
              ? 'bg-(--color-alpha-white) text-(--text-color-primary) shadow-sm'
              : 'bg-transparent text-(--text-color-secondary) hover:text-(--text-color-primary)'
              } ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {option.label}
          </button>
        );
      })}
    </fieldset>
  );
}

export default SegmentedControl;
