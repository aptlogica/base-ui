// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getDisplayValue, isSelected as isSelectedValue, normalizeSelection, toggleSelection } from "../../../../../components/common/dropdown/dropdownSelection";

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
  const [position, setPosition] = useState<'above' | 'below'>('below');
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const currentValues = useMemo(
    () => normalizeSelection(value, (v) => v === ""),
    [value]
  );

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      onChange(toggleSelection(currentValues, optionValue));
      return;
    }
    onChange(optionValue);
    setOpen(false);
  };

  const isSelected = (optionValue: string) => isSelectedValue(currentValues, optionValue);

  const selectedLabels = currentValues
    .map((selectedValue) => options.find((option) => option.value === selectedValue)?.label ?? selectedValue)
    .filter(Boolean);

  const displayValue = multiple
    ? getDisplayValue(selectedLabels, placeholder, multiple)
    : selectedLabels[0] ?? placeholder;

  const updatePosition = useCallback(() => {
    if (!rootRef.current) return;

    const triggerRect = rootRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight ?? 220;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
      setPosition('above');
      return;
    }

    setPosition('below');
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const handleReposition = () => updatePosition();
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [open, updatePosition]);

  return (
    <div className="relative w-full mb-3" ref={rootRef}>
      {/* Trigger box (same look as <select> tag) */}
      <div //NOSONAR
        className="w-full px-3 py-2 bg-[var(--color-alpha-white)] text-[var(--text-color-secondary)] 
                   border rounded-xl text-sm cursor-pointer 
                   flex justify-between items-center focus:outline-none 
                   focus:ring-1 focus:ring-[var(--ring-color-brand)]"
        onClick={() => setOpen(!open)}
      >
        <span>
          {displayValue}
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>

      {/* Dropdown list */}
      {open && (
          <ul
              ref={menuRef}
              className={`absolute w-full border space-y-1 p-2 rounded-xl bg-[var(--color-alpha-white)] shadow-lg z-10 max-h-48 overflow-auto text-sm ${
                position === 'above' ? 'bottom-full mb-1' : 'top-full mt-1'
              }`}
            >
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
