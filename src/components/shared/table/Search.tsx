import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search as SearchIcon, ChevronUp, ChevronDown, Hash } from 'lucide-react';
import { BaseColumn as ColumnConfig } from '../../../types/column.types';
import { FIELD_TYPES } from '../../../types/fieldTypes';
import { useClickOutside } from '../../../hooks/useClickOutside';
import { SearchField } from '../../../hooks/useSearch';
import { fieldsToExcludeInFilter } from '../../../types/constants';

export interface SearchProps {
  columns: ColumnConfig[];
  onSearch: (searchTerm: string, selectedField: SearchField | null) => void;
  placeholder?: string;
  className?: string;
  initialSelectedField?: SearchField | null;
  disabled?: boolean;
}

// Icon mapping using FIELD_TYPES
const getFieldIcon = (type: string): React.ReactNode => {
  const fieldType = FIELD_TYPES.find(field => field.key === type);
  if (fieldType) {
    const IconComponent = fieldType.icon;
    return <IconComponent className="w-4 h-4" />;
  }
  // Fallback to Hash icon for unknown types
  return <Hash className="w-4 h-4" />;
};

export const Search: React.FC<SearchProps> = ({
  columns,
  onSearch,
  placeholder = "Search...",
  className = "",
  initialSelectedField = null,
  disabled = false
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Set default to the 0th position (first column) if no initial field is provided
  const defaultField = initialSelectedField || (columns.length > 0 ? {
    key: columns[0].key,
    title: columns[0].title,
    type: columns[0].type
  } : null);
  const [selectedField, setSelectedField] = useState<SearchField | null>(defaultField);

  // Update selectedField when columns change
  useEffect(() => {
    if (columns.length > 0) {
      // Check if current selectedField still exists in columns
      const fieldExists = selectedField && columns.find(col => col.key === selectedField.key);

      if (!fieldExists) {
        setSelectedField({
          key: columns[0].key,
          title: columns[0].title,
          type: columns[0].type
        });
      }
    } else {
      // No columns available, clear selectedField
      setSelectedField(null);
    }
  }, [columns]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldSearchTerm, setFieldSearchTerm] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useClickOutside({
    isOpen: isDropdownOpen,
    onClose: () => setIsDropdownOpen(false),
    excludeRefs: [buttonRef]
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // Store latest selectedField in ref to avoid stale closures in debounced callback
  const selectedFieldRef = useRef<SearchField | null>(selectedField);
  useEffect(() => {
    selectedFieldRef.current = selectedField;
  }, [selectedField]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Track debounce timeout to allow cancellation
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isClearingRef = useRef(false);

  // Debounced search callback - delays API calls but updates UI immediately
  const debouncedOnSearch = useCallback((value: string, field: SearchField | null) => {
    // Clear any pending debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    // Skip if we're in the process of clearing
    if (isClearingRef.current) {
      return;
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (!isClearingRef.current) {
        onSearch(value, field);
      }
      debounceTimeoutRef.current = null;
    }, 300);
  }, [onSearch]);

  // Handle dropdown toggle
  const handleDropdownToggle = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
  }, []);

  // Handle search input changes - update UI immediately, debounce API call
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    // If search is cleared, trigger immediately and cancel any pending debounce
    if (value.trim() === '') {
      // Cancel any pending debounced calls
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
      // Mark that we're clearing to prevent any pending debounced calls from firing
      isClearingRef.current = true;
      // Clear search immediately
      onSearch('', selectedFieldRef.current);
      // Reset clearing flag after a short delay to allow the immediate call to complete
      setTimeout(() => {
        isClearingRef.current = false;
      }, 50);
    } else {
      // Reset clearing flag if user starts typing again
      isClearingRef.current = false;
      // Call debounced search with current field
      debouncedOnSearch(value, selectedFieldRef.current);
    }
  }, [debouncedOnSearch, onSearch]);

  // Handle field selection - trigger search immediately (no debounce for field changes)
  const handleFieldSelect = useCallback((field: SearchField) => {
    setSelectedField(field);
    setIsDropdownOpen(false);
    setFieldSearchTerm('');
    // Trigger search immediately with current search term and new field (no debounce)
    onSearch(searchTerm, field);
  }, [searchTerm, onSearch]);

  // Filter fields based on search term and exclude system fields (except Title) and fieldsToExcludeInFilter
  // Memoized to prevent recalculation on every render
  const excludedFieldTypes = React.useMemo(() => new Set(fieldsToExcludeInFilter.map(type => String(type).toLowerCase())), []);

  const filteredFields = React.useMemo(() => {
    // Normalize search term to lowercase for case-insensitive comparison
    const normalizedSearchTerm = fieldSearchTerm.toLowerCase().trim();

    return columns.filter(column => {
      // Include if it matches the search term (case-insensitive)
      const columnTitle = (column.title || '').toLowerCase();
      const columnName = (column.column_name || '').toLowerCase();
      const matchesSearch = normalizedSearchTerm === '' ||
        columnTitle.includes(normalizedSearchTerm) ||
        columnName.includes(normalizedSearchTerm);

      // Exclude system fields except Title (case-insensitive comparison)
      const isSystemField = column.isSystem || column.system;
      const isTitle = columnTitle === 'title' || columnName === 'title';

      // Exclude fields in fieldsToExcludeInFilter
      const normalizedType = String(column.type || '').toLowerCase();
      const normalizedUidt = String(column.uidt || '').toLowerCase();
      const isExcludedType = excludedFieldTypes.has(normalizedType) || excludedFieldTypes.has(normalizedUidt);

      // Show if it matches search AND (not a system field OR is Title) AND not in excluded types
      return matchesSearch && (!isSystemField || isTitle) && !isExcludedType;
    });
  }, [columns, fieldSearchTerm, excludedFieldTypes]);

  return (
    <div className={`relative ${className} ${columns.length === 0 ? "opacity-[0.5] pointer-events-none" : ""}`}>
      <div className="flex items-center bg-gray-50 border rounded-xl px-2 py-1 focus-within:outline-none focus-within:ring-1 focus-within:ring-[var(--color-focus-ring)] outline-none transition-all">
        <SearchIcon className="w-4 h-4 text-gray-400 mr-2" />

        <button
          ref={buttonRef}
          type="button"
          onClick={handleDropdownToggle}
          disabled={disabled}
          className="flex items-center gap-3 px-2 py-1 btn-primary !rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed max-w-[200px]"
        >
          <span className='flex items-center gap-1 text-sm flex-1 min-w-0 overflow-hidden'>
            <span className="flex-shrink-0">{getFieldIcon(selectedField?.type || '')}</span>
            <span className="truncate">{selectedField?.title}</span>
          </span>
          {isDropdownOpen ? (
            <ChevronUp className="w-3 h-3 transition-transform flex-shrink-0" />
          ):(
            <ChevronDown className="w-3 h-3 transition-transform flex-shrink-0" />
          )}
        </button>

        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={selectedField ? `Search in ${selectedField.title.length > 20 ? selectedField.title.substring(0, 20) + '...' : selectedField.title}` : placeholder}
          disabled={disabled}
          className="flex-1 ml-2 bg-transparent border-none outline-none text-sm placeholder-gray-400 focus-within:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
        />
      </div>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 mt-1 bg-background border rounded-xl shadow-lg z-40 max-h-80 overflow-hidden w-72"
        >
          {/* Internal Search Bar */}
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center bg-gray-50 rounded-md px-3 py-2">
              <SearchIcon className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                value={fieldSearchTerm}
                onChange={(e) => setFieldSearchTerm(e.target.value)}
                placeholder="Search fields"
                className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-400"
              />
            </div>
          </div>

          {/* Fields List */}
          <div className="p-2 max-h-60 space-y-1 overflow-y-auto">
            {filteredFields.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No fields found
              </div>
            ) : (
              <>
                {/* Field Options */}
                {filteredFields.map((field) => (
                  <button
                    key={field.key}
                    type="button"
                    onClick={() => handleFieldSelect(field)}
                    className={`w-full px-3 py-2 text-left hover:bg-[var(--color-bg-brand-primary)] hover:text-black focus:bg-[var(--color-bg-brand-secondary)] rounded-xl flex items-center gap-2 ${selectedField?.key === field.key ? 'bg-[var(--color-bg-brand-secondary)] text-black font-bold ' : ''
                      }`}
                  >
                    <span className='flex items-center gap-2 flex-1 min-w-0 overflow-hidden'>
                      <span className='text-gray-400 flex-shrink-0'>{getFieldIcon(field.type)}</span>
                      <span className="truncate">{field.title}</span>
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
