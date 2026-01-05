import React, { useState, useRef, useMemo } from 'react';
import { MoreHorizontal, Search } from 'lucide-react';
import { useLookupSourceColumn } from '../../../hooks/useLookupSourceColumn';
import { 
  renderRatingPill,
  renderLongTextPill,
  renderDateTimePill,
  renderEmailPill,
  renderUserPill,
  renderDurationPill,
  renderAttachmentPill,
  renderCheckboxPill,
  renderCurrencyPill,
  renderPercentPill,
  renderDecimalPill,
  renderURLPill,
  renderPhoneNumberPill,
  renderYearPill,
  renderNumberPill,
  renderJSONPill,
  renderMultiSelectPill,
  renderSingleSelectPill,
  renderTextPill,
} from './lookupRenderers';
import { normalizeFieldType } from '../../../utils/fieldType';

interface LookupProps {
  label?: string;
  value: any;
  required?: boolean;
  isBorder?: boolean;
  className?: string;
  helperText?: string;
  icon?: string;
  // Field configuration for proper rendering
  field?: {
    uidt?: string;
    meta?: any;
    config?: any;
    column_name?: string;
    title?: string;
  };
}

/**
 * Get the lookup_column_id from field meta
 */
const getLookupColumnId = (field: LookupProps['field']): string | undefined => {
  if (!field?.meta) return undefined;
  
  const meta = typeof field.meta === 'string' 
    ? JSON.parse(field.meta || '{}') 
    : field.meta;
  
  return meta.lookup_column_id;
};

/**
 * Normalize lookup value to array of individual values
 * Each element in the array represents a value from a related record
 */
const normalizeLookupValue = (value: any): any[] => {
  if (value === null || value === undefined) return [];
  
  // If it's already an array, return it (filter out nulls)
  if (Array.isArray(value)) {
    return value.filter(item => item !== null && item !== undefined);
  }
  
  // Single value - wrap in array
  return [value];
};

/**
 * Get the field type from source column's uidt
 */
const getFieldTypeFromSource = (sourceColumn: any): string => {
  if (!sourceColumn) return 'text';
  
  const uidt = sourceColumn.uidt || sourceColumn.type || 'text';
  return normalizeFieldType(uidt);
};

/**
 * Render a single lookup value based on source column type
 */
const renderLookupValue = (
  value: any,
  sourceColumn: any,
  index: number
): React.ReactNode | null => {
  if (value === null || value === undefined) return null;
  
  const fieldType = getFieldTypeFromSource(sourceColumn);
  const renderProps = { value, sourceColumn, index };
  
  switch (fieldType) {
    case 'rating':
      return renderRatingPill(renderProps);
    
    case 'longText':
      return renderLongTextPill(renderProps);
    
    case 'datetime':
    case 'date':
      return renderDateTimePill(renderProps);
    
    case 'email':
      return renderEmailPill(renderProps);
    
    case 'user':
    case 'createdBy':
    case 'lastModifiedBy':
      return renderUserPill(renderProps);
    
    case 'duration':
      return renderDurationPill(renderProps);
    
    case 'attachment':
      return renderAttachmentPill(renderProps);
    
    case 'boolean':
    case 'checkbox':
      return renderCheckboxPill(renderProps);
    
    case 'currency':
      return renderCurrencyPill(renderProps);
    
    case 'percent':
      return renderPercentPill(renderProps);
    
    case 'decimal':
      return renderDecimalPill(renderProps);
    
    case 'url':
      return renderURLPill(renderProps);
    
    case 'phoneNumber':
      return renderPhoneNumberPill(renderProps);
    
    case 'year':
      return renderYearPill(renderProps);
    
    case 'number':
      return renderNumberPill(renderProps);
    
    case 'json':
      return renderJSONPill(renderProps);
    
    case 'multiSelect':
      return renderMultiSelectPill(renderProps);
    
    case 'select':
      return renderSingleSelectPill(renderProps);
    
    default:
      return renderTextPill(renderProps);
  }
};

export const Lookup: React.FC<LookupProps> = ({
  label,
  value,
  required = false,
  isBorder = false,
  className = "",
  helperText,
  icon = "",
  field
}) => {
  // Get lookup_column_id from field meta
  const lookupColumnId = useMemo(() => getLookupColumnId(field), [field]);
  
  // Fetch source column configuration
  const { data: sourceColumn, isLoading: isLoadingSourceColumn } = useLookupSourceColumn(lookupColumnId);
  
  // Normalize value to array
  const normalizedValues = useMemo(() => normalizeLookupValue(value), [value]);
  
  // State for dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Calculate visible items based on container width
  React.useEffect(() => {
    if (!containerRef.current || normalizedValues.length === 0) {
      setVisibleCount(0);
      return;
    }
    
    const containerWidth = containerRef.current.offsetWidth;
    const itemWidth = 120; // Approximate width per pill
    const ellipsisWidth = 30; // Width for ellipsis button
    const gap = 8; // Gap between items
    
    let totalWidth = 0;
    let count = 0;
    
    for (let i = 0; i < normalizedValues.length; i++) {
      const itemWidthWithGap = itemWidth + (i > 0 ? gap : 0);
      if (totalWidth + itemWidthWithGap + ellipsisWidth <= containerWidth) {
        totalWidth += itemWidthWithGap;
        count++;
      } else {
        break;
      }
    }
    
    setVisibleCount(Math.max(0, count));
  }, [normalizedValues.length]);
  
  const visibleItems = normalizedValues.slice(0, visibleCount);
  const hiddenItems = normalizedValues.slice(visibleCount);
  
  // Filter hidden items based on search
  const filteredHiddenItems = useMemo(() => {
    if (!searchTerm) return hiddenItems;
    return hiddenItems.filter((item: any) => {
      const searchableText = typeof item === 'object' 
        ? JSON.stringify(item).toLowerCase()
        : String(item).toLowerCase();
      return searchableText.includes(searchTerm.toLowerCase());
    });
  }, [hiddenItems, searchTerm]);

  // Handle click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && 
          containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchTerm('');
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Render all lookup values
  const renderValues = (items: any[], isInDropdown = false) => {
    if (items.length === 0) return null;
    
    // If source column is still loading, show loading state
    if (isLoadingSourceColumn) {
    return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm bg-gray-100 text-gray-700 border border-gray-200">
          Loading...
            </span>
          );
    }
    
    // If source column is not available, fallback to text rendering
    // This can happen if lookup_column_id is missing or invalid
    if (!sourceColumn) {
      const renderedItems = items
        .map((item, index) => renderTextPill({ value: item, sourceColumn: null, index }))
        .filter((item) => item !== null);
      
      if (renderedItems.length === 0) return null;
      
        return (
        <div className={`flex flex-wrap gap-1 items-center ${isInDropdown ? 'max-w-full' : ''}`} style={{ maxWidth: '100%', overflow: 'hidden' }}>
          {renderedItems}
          </div>
        );
      }
      
    // Render each value as a separate pill using source column type
    const renderedItems = items
      .map((item, index) => renderLookupValue(item, sourceColumn, index))
      .filter((item) => item !== null);
    
    if (renderedItems.length === 0) return null;

    return (
      <div className={`flex flex-wrap gap-1 items-center ${isInDropdown ? 'max-w-full' : ''}`} style={{ maxWidth: '100%', overflow: 'hidden' }}>
        {renderedItems}
      </div>
    );
  };

  // If no values, don't render anything
  if (normalizedValues.length === 0) {
    return null;
  }

  return (
    <div className={`w-full relative ${className} ${isBorder ? "field-component-border" : ""}`}>
      {/* Label */}
      {label && (
        <label className="field-component-label">
          {icon && <span className="mr-2">{icon}</span>}
          {label}
          {required && <span className="field-component-required">*</span>}
        </label>
      )}

      {/* Items Container */}
        <div 
          ref={containerRef}
          className="px-1.5 w-full min-h-[32px] flex items-center justify-start flex-wrap gap-1"
          style={{ overflow: 'hidden' }}
        >
        {renderValues(visibleItems)}
          
          {hiddenItems.length > 0 && (
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex items-center px-2.5 py-1 rounded-full text-sm bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors"
            >
              <MoreHorizontal className="w-3 h-3" />
            </button>
          )}
        </div>

      {/* Dropdown for hidden items */}
      {isDropdownOpen && hiddenItems.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 top-full left-0 mt-1 bg-card border rounded-xl shadow-lg min-w-[300px] max-w-[500px]"
        >
          {/* Search Input */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] bg-[--color-alpha-white] outline-none transition-all duration-200"
                autoFocus
              />
            </div>
          </div>

          {/* Items List */}
          <div className="p-2 max-h-60 overflow-y-auto">
            {filteredHiddenItems.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-2">
                {searchTerm ? 'No matching values' : 'No hidden values'}
              </div>
            ) : (
              renderValues(filteredHiddenItems, true)
            )}
          </div>
        </div>
      )}

      {/* Helper Text */}
      {helperText && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
};
