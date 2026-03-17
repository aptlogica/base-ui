// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Check, ChevronDown } from 'lucide-react';
import { calculateDropdownPosition } from '../../utils/dropdownPosition';

export interface MultiSelectTagsOption {
  label: string;
  value: string | number;
  description?: string;
  disabled?: boolean;
}

export interface MultiSelectTagsProps {
  options: MultiSelectTagsOption[];
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  maxSelections?: number;
  className?: string;
  getOptionLabel?: (option: MultiSelectTagsOption) => string;
  getOptionValue?: (option: MultiSelectTagsOption) => string | number;
  showDisabledAsSelected?: boolean; // Show disabled options as selected tags in input
  id?: string; // For label association via htmlFor
}

export const MultiSelectTags: React.FC<MultiSelectTagsProps> = ({
  options,
  value = [],
  onChange,
  placeholder = 'Select users to assign',
  searchPlaceholder = 'Search...',
  disabled = false,
  maxSelections,
  className = '',
  getOptionLabel = (option) => option.label,
  getOptionValue = (option) => option.value,
  showDisabledAsSelected = false,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get selected options (including disabled ones if showDisabledAsSelected is true)
  const selectedOptions = useMemo(() => {
    const selected = options.filter(opt => value.includes(getOptionValue(opt)));
    if (showDisabledAsSelected) {
      // Also include disabled options that aren't in value but should be shown as selected
      const disabledSelected = options.filter(opt => opt.disabled && !value.includes(getOptionValue(opt)));
      return [...selected, ...disabledSelected];
    }
    return selected;
  }, [options, value, getOptionValue, showDisabledAsSelected]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(opt => {
      const label = getOptionLabel(opt).toLowerCase();
      const description = opt.description?.toLowerCase() || '';
      return label.includes(query) || description.includes(query);
    });
  }, [options, searchQuery, getOptionLabel]);

  // Calculate dropdown position
  const getDropdownPosition = useCallback(() => {
    if (!containerRef.current) return null;

    const rect = containerRef.current.getBoundingClientRect();
    const dropdownMinHeight = 200;
    const dropdownWidth = Math.min(400, rect.width);
    return calculateDropdownPosition({
      rect,
      dropdownMinHeight,
      dropdownWidth,
      offset: 4,
      sideMargin: 10
    });
  }, []);

  // Update dropdown position when it opens
  useEffect(() => {
    if (isOpen) {
      const position = getDropdownPosition();
      setDropdownPosition(position);

      // Focus search input when dropdown opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    } else {
      setDropdownPosition(null);
      setSearchQuery('');
      setFocusedIndex(-1);
    }
  }, [isOpen, getDropdownPosition]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use a small delay to avoid immediate closing
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside, true);
      }, 0);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside, true);
      };
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          handleToggleOption(filteredOptions[focusedIndex]);
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        if (isOpen) {
          setIsOpen(false);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
        } else {
          setIsOpen(true);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
        }
        break;
    }
  };

  // Handle option toggle
  const handleToggleOption = (option: MultiSelectTagsOption) => {
    if (option.disabled) return;

    const optionValue = getOptionValue(option);
    const isSelected = value.includes(optionValue);

    if (isSelected) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      if (maxSelections && value.length >= maxSelections) {
        return;
      }
      onChange([...value, optionValue]);
    }
  };

  // Handle remove tag
  const handleRemoveTag = (optionValue: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange(value.filter(v => v !== optionValue));
  };

  // Handle input click
  const handleInputClick = (e: React.MouseEvent) => {
    if (disabled) return;

    // Check if click is on a tag or remove button
    const target = e.target as HTMLElement;
    const clickedElement = target.closest('button, .inline-flex');

    // If clicking on a tag or remove button, don't toggle
    if (clickedElement && (clickedElement.classList.contains('inline-flex') || clickedElement.getAttribute('aria-label')?.startsWith('Remove'))) {
      return;
    }

    // Otherwise, toggle the dropdown
    setIsOpen(prev => !prev);
  };

  // Generate unique ID for the dropdown menu if not provided
  const dropdownId = id ? `${id}-dropdown` : undefined;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Input Field */}
      <div // NOSONAR
        id={id}
        className={`
          min-h-[40px] px-4 py-2 border rounded-xl
          flex items-center gap-2 cursor-pointer
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'focus:border focus:border-[--color-brand-600] bg-[--color-alpha-white]'}
          transition-colors
        `}
        onClick={handleInputClick}
        onKeyDown={handleKeyDown}
      >
        {/* Search Icon */}
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />

        {/* Tags Container */}
        <div className="flex-1 flex flex-wrap items-center gap-2 min-w-0">
          {selectedOptions.length === 0 ? (
            <span className="text-sm text-gray-400">{placeholder}</span>
          ) : (
            <>
              {selectedOptions.map((option) => {
                const optionValue = getOptionValue(option);
                const label = getOptionLabel(option);
                const isDisabled = option.disabled;
                return (
                  <div
                    key={optionValue}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm flex-shrink-0 ${isDisabled
                      ? 'bg-gray-200 text-gray-500 border border-gray-300'
                      : 'bg-gray-100 text-gray-700'
                      }`}
                  >
                    <span className="truncate max-w-[150px]">{label}</span>
                    {isDisabled && (
                      <span className="text-xs text-gray-400 italic ml-1">(Member)</span>
                    )}
                    {!disabled && !isDisabled && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveTag(optionValue, e)}
                        className="hover:bg-gray-200 rounded-full p-0.5 transition-colors flex-shrink-0"
                        aria-label={`Remove ${label}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
              {!disabled && (
                <span className="text-sm text-gray-500 flex-shrink-0">Add more</span>
              )}
            </>
          )}
        </div>

        {/* Chevron Icon */}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Dropdown Portal */}
      {isOpen && dropdownPosition && createPortal(
        <div //NOSONAR
          ref={dropdownRef}
          id={dropdownId}
          role="listbox"
          className="fixed z-[9999] bg-card border rounded-xl shadow-lg overflow-hidden"
          style={{
            ...(dropdownPosition.top !== undefined && { top: `${dropdownPosition.top}px` }),
            ...(dropdownPosition.bottom !== undefined && { bottom: `${dropdownPosition.bottom}px` }),
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            maxHeight: '300px',
          }}
        >
          {/* Search Input */}
          <div className="p-2 border-b bg-card">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  e.stopPropagation();
                  setSearchQuery(e.target.value);
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-3 py-2 text-sm border rounded-xl text-primary outline-none focus:border focus:border-[--color-brand-600] bg-[--color-alpha-white]"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-[250px] overflow-y-auto bg-card">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500 bg-card">
                {searchQuery ? 'No options found' : 'No options available'}
              </div>
            ) : (
              <ul className="py-1 bg-card">
                {filteredOptions.map((option, index) => {
                  const optionValue = getOptionValue(option);
                  const label = getOptionLabel(option);
                  const isSelected = value.includes(optionValue);
                  const isFocused = index === focusedIndex;
                  const isDisabled = Boolean(option.disabled || (maxSelections && !isSelected && value.length >= maxSelections));

                  return (
                    <li key={optionValue} className="bg-card p-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleOption(option);
                        }}
                        disabled={isDisabled}
                        className={`
                          w-full px-4 py-1 rounded-xl text-left text-sm bg-card
                          flex items-center justify-between
                          transition-colors
                          ${isFocused ? 'bg-gray-100' : ''}
                          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'}
                          ${option.disabled && !isSelected ? 'bg-gray-50' : ''}
                        `}
                        onMouseEnter={() => setFocusedIndex(index)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium truncate ${option.disabled && !isSelected ? 'text-gray-500' : 'text-gray-900'}`}>
                            {label}
                            {option.disabled && !isSelected && (
                              <span className="ml-2 text-xs text-gray-400 italic">(Already a member)</span>
                            )}
                          </div>
                          {option.description && (
                            <div className={`text-xs truncate mt-0.5 ${option.disabled && !isSelected ? 'text-gray-400' : 'text-gray-500'}`}>
                              {option.description}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />
                        )}
                        {option.disabled && !isSelected && (
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">Member</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

