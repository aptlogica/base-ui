import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useState } from "react";

interface Option {
  label: string;
  value: string;
}

interface DropdownProps {
  options: Option[];
  multiple?: boolean;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  multiple = false,
  value,
  onChange,
  placeholder = "Select..."
}) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const selectedValues = Array.isArray(value) ? [...value] : [];
      if (selectedValues.includes(optionValue)) {
        onChange(selectedValues.filter((v) => v !== optionValue));
      } else {
        onChange([...selectedValues, optionValue]);
      }
    } else {
      onChange(optionValue);
      setOpen(false);
    }
  };

  const isSelected = (optionValue: string) =>
    multiple
      ? Array.isArray(value) && value.includes(optionValue)
      : value === optionValue;

  return (
    <div className="relative w-full mb-3">
      {/* Trigger box (same look as <select> tag) */}
      <div
        tabIndex={0}
        className="w-full px-3 py-2 bg-[var(--color-alpha-white)] text-[var(--text-color-secondary)] 
                   border border-[var(--color-gray-300)] rounded text-sm cursor-pointer 
                   flex justify-between items-center focus:outline-none 
                   focus:ring-1 focus:ring-[var(--ring-color-brand)]"
        onClick={() => setOpen(!open)}
      >
        <span>
          {multiple
            ? Array.isArray(value) && value.length > 0
              ? value.join(", ")
              : placeholder
            : (value as string) || placeholder}
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>

      {/* Dropdown list */}
      {open && (
        <ul className="absolute mt-1 w-full border border-[var(--color-gray-300)] 
                       rounded bg-[var(--color-alpha-white)] shadow-lg z-10 
                       max-h-48 overflow-auto text-sm">
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`px-3 py-2 cursor-pointer hover:bg-[var(--color-bg-brand-primary)] hover:text-black ${isSelected(option.value)
                  ? "bg-[var(--color-bg-brand-secondary)] text-black font-bold"
                  : "text-[var(--text-color-secondary)]"
                }`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;
