import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface RoleDropdownOption {
  label: string;
  value: string;
}

interface RoleDropdownProps {
  value: string;
  options: RoleDropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RoleDropdown: React.FC<RoleDropdownProps> = ({
  value,
  options,
  onChange,
  placeholder = 'Select a role',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-full text-xs px-3 py-1.5 border rounded-xl gap-1 bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-gray-700 flex items-center justify-between transition-all"
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-80 mt-1 right-0 bg-card border rounded-xl shadow-lg overflow-hidden">
          <ul className="p-2 space-y-1" role="listbox">
            {options.map((option) => {
              const isSelected = value === option.value;
              return (
                <li
                  key={option.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(option.value);
                  }}
                  className={`px-3 py-2 text-xs cursor-pointer transition-colors rounded-xl flex items-center justify-between ${isSelected
                      ? 'bg-gray-200 text-primary'
                      : 'text-primary hover:bg-gray-200'
                    }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="w-3 h-3" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

