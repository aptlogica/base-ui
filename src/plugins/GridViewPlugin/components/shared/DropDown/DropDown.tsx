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

  const isMultipleValue = (input: string | string[]): input is string[] => Array.isArray(input);

  const handleSelectMultiple = (optionValue: string) => {
    const selectedValues = isMultipleValue(value) ? [...value] : [];
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter((v) => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  const handleSelectSingle = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      handleSelectMultiple(optionValue);
      return;
    }
    handleSelectSingle(optionValue);
  };

  const isSelectedMultiple = (optionValue: string) =>
    isMultipleValue(value) && value.includes(optionValue);

  const isSelectedSingle = (optionValue: string) => value === optionValue;

  const isSelected = (optionValue: string) =>
    multiple ? isSelectedMultiple(optionValue) : isSelectedSingle(optionValue);

  const getDisplayValueMultiple = () =>
    isMultipleValue(value) && value.length > 0 ? value.join(", ") : placeholder;

  const getDisplayValueSingle = () => (value as string) || placeholder;

  const getDisplayValue = () => (multiple ? getDisplayValueMultiple() : getDisplayValueSingle());

  return (
    <div className="relative w-full mb-3">
      {/* Trigger box (same look as <select> tag) */}
      <div //NOSONAR
        className="w-full px-3 py-2 bg-[var(--color-alpha-white)] text-[var(--text-color-secondary)] 
                   border rounded-xl text-sm cursor-pointer 
                   flex justify-between items-center focus:outline-none 
                   focus:ring-1 focus:ring-[var(--ring-color-brand)]"
        onClick={() => setOpen(!open)}
      >
        <span>
          {getDisplayValue()}
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>

      {/* Dropdown list */}
      {open && (
        <ul className="absolute mt-1 w-full border space-y-1 p-2 
                       rounded-xl bg-[var(--color-alpha-white)] shadow-lg z-10 
                       max-h-48 overflow-auto text-sm">
          {options.map((option) => (
            <li //NOSONAR
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`px-3 py-2 space-y-1 cursor-pointer rounded-xl hover:bg-[var(--color-bg-brand-primary)] hover:text-black ${isSelected(option.value)
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
