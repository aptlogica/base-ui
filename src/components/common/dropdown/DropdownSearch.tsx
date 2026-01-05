import React from 'react';
import { Search } from 'lucide-react';

interface DropdownSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DropdownSearch({
  value,
  onChange,
  placeholder = 'Search options...',
}: DropdownSearchProps) {
  return (
    <div className="p-2 border-b border">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 text-sm border border rounded-md 
                     focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)] focus:border-[var(--color-brand-600)]"
          autoFocus
        />
      </div>
    </div>
  );
}