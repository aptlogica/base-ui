import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X } from "lucide-react";
import { useClickOutside } from "../../../hooks/useClickOutside";

interface YearProps {
  label?: string;
  value: number | null;
  onChange: (value: number | null | string) => void;
  required?: boolean;
  disabled?: boolean;
  isBorder?: boolean;
  className?: string;
  allowEdit?: boolean;
  helperText?: string;
  icon?: string;
  config?: {
    defaultValue?: number | string;
    [key: string]: any;
  };
}

const YEARS_PER_PAGE = 12;
const GRID_COLUMNS = 4;

export const Year: React.FC<YearProps> = ({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  isBorder = false,
  className = "",
  allowEdit = true,
  helperText,
  icon = "",
  config = {}
}) => {
  const { defaultValue = null } = config;
  const currentYear = new Date().getFullYear();

  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState<'below' | 'above'>('below');
  const [calculatedPosition, setCalculatedPosition] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(
    typeof defaultValue === "number"
      ? defaultValue
      : typeof defaultValue === "string"
        ? parseInt(defaultValue) || currentYear
        : currentYear
  );
  const [pageStart, setPageStart] = useState<number>(
    Math.floor(currentYear / YEARS_PER_PAGE) * YEARS_PER_PAGE
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const prevYearRef = useRef<HTMLButtonElement>(null);
  const nextYearRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Track last committed value to avoid redundant calls
  const prevValueRef = useRef<number | null>(value);

  // Calculate dropdown position for portal rendering
  const calculateDropdownPosition = useCallback(() => {
    const trigger = buttonRef.current;
    if (!trigger) return null;

    const rect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dropdownMinHeight = 300;
    const dropdownWidth = rect.width; // Use button width

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Determine if we should open above or below
    let position: 'below' | 'above' = 'below';
    if (spaceBelow < dropdownMinHeight && spaceAbove > spaceBelow) {
      position = 'above';
    }
    setDropdownPosition(position);

    // Calculate left position (align to left edge of trigger)
    let left = rect.left;
    if (left < 10) {
      left = 10; // 10px margin from left edge
    }
    if (left + dropdownWidth > viewportWidth - 10) {
      left = viewportWidth - dropdownWidth - 10; // 10px margin from right edge
    }

    // Calculate top/bottom position
    if (position === 'below') {
      return {
        top: rect.bottom + 8,
        left,
        width: dropdownWidth
      };
    } else {
      return {
        bottom: viewportHeight - rect.top + 8,
        left,
        width: dropdownWidth
      };
    }
  }, []);

  // Update position when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const position = calculateDropdownPosition();
      setCalculatedPosition(position);
    } else {
      setCalculatedPosition(null);
    }
  }, [isOpen, calculateDropdownPosition]);

  useClickOutside({
    isOpen,
    onClose: () => setIsOpen(false),
    excludeRefs: [buttonRef, prevYearRef, nextYearRef, inputRef, containerRef, dropdownRef],
  });

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    prevValueRef.current = value;
  }, [value]);

  const triggerOnChange = (newValue: number | null | string) => {
    const prev = prevValueRef.current;
    const normalizedPrev = typeof prev === "number" ? prev : null;

    if (typeof newValue === "number") {
      if (normalizedPrev !== newValue) {
        prevValueRef.current = newValue;
        onChange(newValue);
      }
    } else {
      if (normalizedPrev !== null) {
        prevValueRef.current = null;
        onChange(newValue);
      }
    }
  };

  const handleYearSelect = (year: number) => {
    setIsOpen(false);
    setSelectedYear(year);
    setInputValue(year.toString());
    triggerOnChange(year);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.trim().slice(0, 4); // Max 4 digits
    setInputValue(newValue);

    if (newValue) {
      const year = parseInt(newValue);
      if (!isNaN(year)) {
        triggerOnChange(year);
      }
    } else {
      triggerOnChange("");
    }
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    if (!inputValue.trim()) {
      triggerOnChange("");
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
    if (e.key === "Escape") {
      setIsEditing(false);
      setInputValue(value ? value.toString() : "");
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue("");
    setSelectedYear(currentYear);
    triggerOnChange("");
  };

  const handlePrev = () => {
    const newPageStart = Math.max(1000, pageStart - YEARS_PER_PAGE);
    setPageStart(newPageStart);
  };

  const handleNext = () => {
    const newPageStart = Math.min(9999 - YEARS_PER_PAGE + 1, pageStart + YEARS_PER_PAGE);
    setPageStart(newPageStart);
  };

  const years = Array.from({ length: YEARS_PER_PAGE }, (_, i) => pageStart + i).filter(
    (y) => y >= 1000 && y <= 9999
  );

  const displayValue =
    value !== null && value !== undefined
      ? value
      : typeof defaultValue === "number"
        ? defaultValue
        : typeof defaultValue === "string"
          ? parseInt(defaultValue) || ""
          : "";

  return (
    <div className={`w-full relative rounded ${isBorder ? "field-component-border" : ""} ${className}`} ref={containerRef}>

      {/* Label */}
      {label && (
        <label className="field-component-label">
          {label}
          {required && <span className="field-component-required">*</span>}
        </label>
      )}

      {isEditing ? (
        <div className="relative group">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            placeholder="YYYY"
            disabled={disabled}
            className={`field-component ${disabled ? "text-gray-400 cursor-not-allowed" : "text-gray-900"
              }`}
          />
        </div>
      ) : (
        <div
          ref={buttonRef}
          tabIndex={0}
          className={`field-component flex items-center justify-between ${disabled ? "text-gray-400 cursor-not-allowed" : "text-gray-900"
            }`}
          onClick={() => {
            if (!disabled) setIsOpen((v) => !v);
          }}
          onDoubleClick={(e) => {
            if (!disabled) {
              e.stopPropagation();
              setIsEditing(true);
              setInputValue(displayValue ? String(displayValue) : "");
              setIsOpen(false); // ensure dropdown closes when editing
            }
          }}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          style={{ minHeight: 30 }}
        >
          <span className={displayValue ? "" : "text-gray-400"}>
            {displayValue || "YYYY"}
          </span>
          <div className="flex items-center gap-1">
            {displayValue !== 0 && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear value"
              >
                {/* <X className="w-3 h-3" /> */}
              </button>
            )}
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      )}

      {/* Year Dropdown Portal */}
      {isOpen && calculatedPosition && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] left-0 border bg-background rounded-xl shadow-lg p-0 select-none"
          style={{
            ...(calculatedPosition.top !== undefined && { top: `${calculatedPosition.top}px` }),
            ...(calculatedPosition.bottom !== undefined && { bottom: `${calculatedPosition.bottom}px` }),
            left: `${calculatedPosition.left}px`,
            width: `${calculatedPosition.width}px`
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <button
              type="button"
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
              onClick={handlePrev}
              disabled={pageStart <= 1000}
              tabIndex={-1}
              ref={prevYearRef}
            >
              <ChevronLeft className="w-5 h-5 text-gray-900" />
            </button>
            <span className="font-semibold text-lg text-gray-900">
              {selectedYear}
            </span>
            <button
              type="button"
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
              onClick={handleNext}
              disabled={pageStart + YEARS_PER_PAGE > 9999}
              tabIndex={-1}
              ref={nextYearRef}
            >
              <ChevronRight className="w-5 h-5 text-gray-900" />
            </button>
          </div>
          <div
            className="grid gap-2 px-4 py-3"
            style={{ gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)` }}
          >
            {years.map((year) => {
              const isSelected = year === displayValue;
              const isCurrentYear = year === currentYear;
              return (
                <button
                  key={year}
                  type="button"
                  className={`py-2 rounded-xl text-center text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-[var(--color-bg-brand-primary)] text-black font-bold"
                      : "text-gray-900 hover:bg-[var(--color-bg-brand-primary)] hover:text-black focus:bg-[var(--color-bg-brand-secondary)]"
                  } ${
                    isCurrentYear ? "border" : ""
                  }`}
                  onClick={() => handleYearSelect(year)}
                  tabIndex={-1}
                >
                  {year}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}

      {helperText && allowEdit && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};
