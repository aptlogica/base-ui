// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { Search } from 'lucide-react';

interface DropdownSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  inputClassName?: string;
  containerClassName?: string;
  clearAutofillOnFocus?: boolean;
}

export const DropdownSearch = React.forwardRef<HTMLInputElement, DropdownSearchProps>(({
  value,
  onChange,
  placeholder = 'Search options...',
  autoFocus = true,
  inputClassName,
  containerClassName = 'p-3 border-b',
  clearAutofillOnFocus = false
}, ref) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  const handleFocus = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (!clearAutofillOnFocus) return;
    const input = e.target;
    if (input.value && /@/.test(input.value) && !value) {
      input.value = '';
      onChange('');
    }
  }, [clearAutofillOnFocus, value, onChange]);

  return (
    <div className={containerClassName}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={inputClassName ?? "w-full pl-9 pr-3 py-2 text-sm border rounded-xl focus:outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] bg-[--color-alpha-white] transition-colors duration-200"}
          autoFocus={autoFocus}
          autoComplete="new-password"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-lpignore="true"
          data-form-type="other"
        />
      </div>
    </div>
  );
});
