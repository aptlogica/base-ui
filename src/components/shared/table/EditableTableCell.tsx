import React, { useMemo, useCallback } from 'react';
import {
  SingleLineText,
  Number,
  DateField,
  Checkbox,
  Email,
  SingleSelect,
  MultiSelect,
  LongText,
  URLField,
  Rating,
  Attachment,
  PhoneNumber,
  Currency,
  Percent,
  Duration,
  Decimal,
  Year,
  Time,
  DateTime,
  User,
  JSONField,
  AuditCreatedBy,
  AuditLastModifiedBy,
  AuditCreatedTime,
  AuditLastModifiedTime,
  LinksField,
  Formula,
  Lookup
} from '../../../components/common/Fields';
import { normalizeFieldType } from '../../../utils/fieldType';
import { utcISOToZoned } from '../../../utils/dateUtils';
import { timeZoneOptions } from '../../../types/constants';

interface EditableTableCellProps {
  column: {
    id: string;
    title: string;
    column_name: string;
    uidt: string;
    system?: boolean;
    meta?: any; // Can be object or string
    config?: any; // Parsed config (preferred over meta for rendering)
    width?: number;
    order_index?: number;
    model_id?: string; // For links field
  };
  value: any;
  onChange: (value: any) => void;
  width: number;
  isLast?: boolean;
  allowEdit?: boolean;
  isBorder?: boolean;
  isSystemField?: boolean;
  currentRowId?: number; // For links field
  rowData?: Record<string, any>; // Row data for formula evaluation
  allColumns?: any[]; // All columns for formula field name mapping
}

const EditableTableCellComponent: React.FC<EditableTableCellProps> = ({
  column,
  value,
  onChange,
  width,
  isLast,
  allowEdit,
  isBorder,
  isSystemField,
  currentRowId,
  rowData,
  allColumns
}) => {
  const getDefaultValueFromConfig = (fieldConfig: any, fieldType: string): any => {
    if (!fieldConfig || typeof fieldConfig !== 'object') return '';
    // Check for defaultValue in config
    if (fieldConfig.defaultValue !== undefined && fieldConfig.defaultValue !== null) {
      return fieldConfig.defaultValue;
    }

    // Type-specific default values based on canonical type keys
    const normalizedType = normalizeFieldType(fieldType);
    switch (normalizedType) {
      case 'boolean':
        return fieldConfig.checkboxDefault || false;
      case 'rating':
        return fieldConfig.ratingDefault || 0;
      case 'number':
      case 'decimal':
      case 'currency':
      case 'percent':
        return fieldConfig.defaultValue || '';
      case 'select':
        return fieldConfig.singleDefault || '';
      case 'multiSelect':
        return fieldConfig.multiDefault || [];
      case 'datetime':
        return fieldConfig.dateTimeDefault || '';
      case 'date':
        return fieldConfig.dateDefault || null;
      case 'time':
        return fieldConfig.timeDefault || '';
      case 'year':
        return fieldConfig.yearDefault || null;
      case 'phoneNumber':
        return fieldConfig.phoneDefault || '';
      case 'email':
        return fieldConfig.emailDefault || '';
      case 'url':
        return fieldConfig.urlDefault || '';
      case 'duration':
        return fieldConfig.durationDefault || '';
      case 'longText':
      case 'text':
      case 'json':
      case 'formula':
        return fieldConfig.defaultValue || '';
      default:
        return fieldConfig.defaultValue || '';
    }
  };

  // Returns the user's selected timezone in IANA form (e.g., "America/New_York").
  // Reads a short timezone code from session/local storage (e.g., "EST") and
  // maps it to an IANA label via timeZoneOptions. Falls back to the browser's
  // timezone if none is set. Used for displaying system datetime fields.
  const getSelectedTimeZone = (): string | undefined => {
    try {
      const tzShort = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('timezone')) ||
        (typeof localStorage !== 'undefined' && localStorage.getItem('timezone')) || '';
      if (tzShort) {
        const match = timeZoneOptions.find(t => t.value === tzShort);
        if (match?.label) return match.label;
      }
      const fallback = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return fallback;
    } catch {
      return undefined;
    }
  };

  // Formats a UTC ISO datetime into the provided/user-selected timezone.
  // Ensures the input is a UTC ISO string (appends Z if missing) and then
  // uses utcISOToZoned to convert to "yyyy-MM-dd HH:mm" in that timezone.
  // Returns '-' for empty/invalid inputs.
  const formatInZone = (iso: any, zone?: string): string => {
    try {
      if (!iso) return '-';
      const tz = zone || getSelectedTimeZone();
      if (!tz) return '-';
      const str = typeof iso === 'string' ? iso : String(iso);
      const hasTz = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(str);
      const utcIso = hasTz ? str : `${str}Z`;
      return utcISOToZoned(utcIso, tz);
    } catch {
      return '-';
    }
  };

  // Memoize parsed config to avoid re-parsing on every render
  // Use column.config if available (set by Table component), otherwise parse column.meta
  const parsedConfig = useMemo(() => {
    // Prefer config if available (it's already parsed in Table component)
    if (column.config && typeof column.config === 'object') {
      return column.config;
    }
    // Fallback to parsing meta if config is not available
    try {
      if (typeof column.meta === 'object' && column.meta !== null) {
        return column.meta;
      }
      if (typeof column.meta === 'string' && column.meta.trim()) {
        return JSON.parse(column.meta);
      }
      return {};
    } catch (error) {
      console.warn('Failed to parse column meta:', column.meta, error);
      return {};
    }
  }, [column.config, column.meta]); // Include both config and meta in dependencies

  // Memoize field type
  const fieldType = useMemo(() => 
    normalizeFieldType(column.uidt || column.column_name || 'text'),
    [column.uidt, column.column_name]
  );

  // Helper function to normalize numeric values - handles old text values when field type was changed
  const normalizeNumericValue = useCallback((val: any, defaultValue: any): string | null => {
    if (val === null || val === undefined || val === '') return defaultValue ?? null;
    if (typeof val === 'number') {
      // Handle NaN and Infinity
      if (globalThis.Number.isNaN(val) || !globalThis.Number.isFinite(val)) return defaultValue ?? null;
      return val.toString();
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed === '' || trimmed === 'null') return defaultValue ?? null;
      // Check if it's a valid number (remove commas first)
      const cleanValue = trimmed.replaceAll(',', '');
      const num = globalThis.Number.parseFloat(cleanValue);
      if (!globalThis.Number.isNaN(num) && globalThis.Number.isFinite(num)) return num.toString();
      // Invalid numeric string - use default
      return defaultValue ?? null;
    }
    // For other types, try to convert to number
    const num = globalThis.Number(val);
    return (!globalThis.Number.isNaN(num) && globalThis.Number.isFinite(num)) ? num.toString() : (defaultValue ?? null);
  }, []);

  // Helper function to normalize date values - handles old text values when field type was changed
  const normalizeDateValue = useCallback((val: any, defaultValue: any): string => {
    if (val === null || val === undefined || val === '') return defaultValue || '';
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed === '' || trimmed === 'null') return defaultValue || '';
      // Check if it matches a valid date pattern
      const datePatterns = [
        /^\d{4}-\d{2}-\d{2}$/,           // YYYY-MM-DD
        /^\d{4}-\d{2}-\d{2}T/,           // ISO datetime
        /^\d{4}\/\d{2}\/\d{2}$/,         // YYYY/MM/DD
        /^\d{2}-\d{2}-\d{4}$/,           // DD-MM-YYYY or MM-DD-YYYY
        /^\d{2}\/\d{2}\/\d{4}$/,         // DD/MM/YYYY or MM/DD/YYYY
        /^\d{2} \d{2} \d{4}$/            // DD MM YYYY
      ];
      // If it matches a date pattern, use it; otherwise treat as invalid
      if (datePatterns.some(pattern => pattern.test(trimmed))) {
        return trimmed;
      }
      // Invalid date string - use default
      return defaultValue || '';
    }
    // For other types, try to convert to string
    return String(val);
  }, []);

  // Helper function to normalize time values - handles old text values when field type was changed
  const normalizeTimeValue = useCallback((val: any, defaultValue: any): string => {
    if (val === null || val === undefined || val === '') return defaultValue || '';
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed === '' || trimmed === 'null') return defaultValue || '';
      // Check if it matches a valid time pattern (HH:mm, HH:mm:ss, or 12-hour format)
      const timePatterns = [
        /^\d{1,2}:\d{2}(:\d{2})?$/,      // HH:mm or HH:mm:ss
        /^\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM|am|pm)$/  // 12-hour format
      ];
      // If it matches a time pattern, use it; otherwise treat as invalid
      if (timePatterns.some(pattern => pattern.test(trimmed))) {
        return trimmed;
      }
      // Invalid time string - use default
      return defaultValue || '';
    }
    // For other types, try to convert to string
    return String(val);
  }, []);

  // Helper function to normalize year values - handles old text values when field type was changed
  const normalizeYearValue = useCallback((val: any, defaultValue: any): number | null => {
    if (val === null || val === undefined || val === '') return defaultValue ?? null;
    if (typeof val === 'number') {
      // Validate year range (reasonable years between 1000 and 9999)
      if (globalThis.Number.isNaN(val) || !globalThis.Number.isFinite(val) || val < 1000 || val > 9999) return defaultValue ?? null;
      return Math.floor(val);
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed === '' || trimmed === 'null') return defaultValue ?? null;
      const num = globalThis.Number.parseInt(trimmed, 10);
      // Validate year range
      if (!globalThis.Number.isNaN(num) && globalThis.Number.isFinite(num) && num >= 1000 && num <= 9999) return num;
      // Invalid year string - use default
      return defaultValue ?? null;
    }
    // For other types, try to convert to number
    const num = globalThis.Number(val);
    if (!globalThis.Number.isNaN(num) && globalThis.Number.isFinite(num) && num >= 1000 && num <= 9999) return Math.floor(num);
    return defaultValue ?? null;
  }, []);

  function renderField() {
    const commonProps = {
      value: value ?? getDefaultValueFromConfig(parsedConfig, fieldType),
      onChange: isSystemField ? () => { } : onChange,
      disabled: isSystemField,
    };
    switch (fieldType) {
      case 'text': return <SingleLineText {...commonProps} maxLength={255} config={parsedConfig} allowEdit={true} readOnly={!allowEdit} isBorder={isBorder} />;
      case 'longText': return <LongText {...commonProps} maxLength={1000} maxRows={4} config={parsedConfig} allowEdit={true} readOnly={!allowEdit} isBorder={isBorder} />;
      case 'number': {
        // Normalize value to numeric string - handle old text values when field type was changed
        const normalizedValue = normalizeNumericValue(value, getDefaultValueFromConfig(parsedConfig, fieldType));
        return <Number value={normalizedValue} onChange={onChange} config={parsedConfig} allowEdit={true} readOnly={!allowEdit} isBorder={isBorder} />;
      }
      case 'decimal': {
        // Normalize value to numeric - handle old text values when field type was changed
        const normalizedValue = normalizeNumericValue(value, getDefaultValueFromConfig(parsedConfig, fieldType));
        // Convert to number for Decimal component (it expects number | null)
        const numValue = normalizedValue ? globalThis.Number.parseFloat(normalizedValue) : null;
        let precision = 2;
        if (parsedConfig?.precision && typeof parsedConfig.precision === 'string' && parsedConfig.precision.includes('.')) {
          const parts = parsedConfig.precision.split('.');
          precision = parts[1] ? parts[1].length : 2;
        }
        return <Decimal 
          value={numValue} 
          onChange={isSystemField ? () => { } : onChange}
          disabled={isSystemField}
          decimals={precision} 
          showThousands={parsedConfig?.showThousands} 
          config={{ ...parsedConfig, precision }} 
          allowEdit={true}
          readOnly={!allowEdit}
          isBorder={isBorder} 
        />;
      }
      case 'boolean': {
        // Normalize value to boolean - handle old text values when field type was changed
        let normalizedValue: boolean;
        if (value === null || value === undefined || value === '') {
          normalizedValue = getDefaultValueFromConfig(parsedConfig, fieldType);
        } else if (typeof value === 'boolean') {
          normalizedValue = value;
        } else if (typeof value === 'string') {
          // Only accept explicit boolean strings, treat everything else as invalid (use default)
          const trimmed = value.trim().toLowerCase();
          if (trimmed === 'true' || trimmed === '1') {
            normalizedValue = true;
          } else if (trimmed === 'false' || trimmed === '0' || trimmed === 'null') {
            normalizedValue = getDefaultValueFromConfig(parsedConfig, fieldType);
          } else {
            // For any other string (like old text values "xyz"), treat as invalid and use default
            normalizedValue = getDefaultValueFromConfig(parsedConfig, fieldType);
          }
        } else {
          normalizedValue = Boolean(value);
        }
        return <Checkbox value={normalizedValue} onChange={onChange} icon={parsedConfig?.checkboxIcon} color={parsedConfig?.checkboxColor} readOnly={!allowEdit} config={{ ...parsedConfig, defaultValue: getDefaultValueFromConfig(parsedConfig, fieldType) }} />;
      }
      case 'currency': {
        // Normalize value to numeric - handle old text values when field type was changed
        const normalizedValue = normalizeNumericValue(value, getDefaultValueFromConfig(parsedConfig, fieldType));
        // Convert to number for Currency component (it expects number | null)
        const numValue = normalizedValue ? globalThis.Number.parseFloat(normalizedValue) : null;
        let precision = 2;
        if (parsedConfig?.precision && typeof parsedConfig.precision === 'string' && parsedConfig.precision.includes('.')) {
          const parts = parsedConfig.precision.split('.');
          precision = parts[1] ? parts[1].length : 2;
        }
        return <Currency value={numValue} onChange={onChange} config={{ ...parsedConfig, precision }} allowEdit={true} readOnly={!allowEdit} isBorder={isBorder} />;
      }
      case 'percent': {
        // Normalize value to numeric - handle old text values when field type was changed
        const normalizedValue = normalizeNumericValue(value, getDefaultValueFromConfig(parsedConfig, fieldType));
        // Convert to number for Percent component (it expects number | null)
        const numValue = normalizedValue ? globalThis.Number.parseFloat(normalizedValue) : null;
        return <Percent value={numValue} onChange={onChange} config={parsedConfig} allowEdit={true} readOnly={!allowEdit} isBorder={isBorder} />;
      }
      case 'duration': {
        // Use default value fallback, but preserve null/undefined for format placeholder
        let valueWithDefault = value;
        if (value === null || value === undefined || value === '') {
          const defaultValue = getDefaultValueFromConfig(parsedConfig, fieldType);
          // Only use default if it's not an empty string, otherwise keep null for format placeholder
          valueWithDefault = defaultValue && defaultValue !== '' ? defaultValue : null;
        }
        return <Duration value={valueWithDefault} onChange={onChange} config={parsedConfig} allowEdit={true} readOnly={!allowEdit} isBorder={isBorder} />;
      }
      case 'year': {
        // Normalize value to year number - handle old text values when field type was changed
        const normalizedValue = normalizeYearValue(value, getDefaultValueFromConfig(parsedConfig, fieldType));
        return <Year value={normalizedValue} onChange={onChange} config={parsedConfig} allowEdit={true} readOnly={!allowEdit} isBorder={isBorder} />;
      }
      case 'date': {
        // Normalize value to date string - handle old text values when field type was changed
        const normalizedValue = normalizeDateValue(value, getDefaultValueFromConfig(parsedConfig, fieldType));
        return <DateField value={normalizedValue} onChange={onChange} format={parsedConfig?.dateFormat || 'YYYY-MM-DD'} config={parsedConfig} allowEdit={true} readOnly={!allowEdit} isBorder={isBorder} />;
      }
      case 'datetime': {
        if (isSystemField) {
          const tz = getSelectedTimeZone();
          return <div className="w-full px-3 py-2 text-sm text-muted-foreground cursor-not-allowed">{formatInZone(value, tz)}</div>;
        }
        // Normalize value to date string - handle old text values when field type was changed
        const normalizedValue = normalizeDateValue(value, getDefaultValueFromConfig(parsedConfig, fieldType));
        return <DateTime {...commonProps} value={normalizedValue} config={parsedConfig} allowEdit={true} readOnly={!allowEdit} isBorder={isBorder} />;
      }
      case 'time': {
        // Normalize value to time string - handle old text values when field type was changed
        const normalizedValue = normalizeTimeValue(value, getDefaultValueFromConfig(parsedConfig, fieldType));
        return <Time {...commonProps} value={normalizedValue} config={parsedConfig} allowEdit={true} readOnly={!allowEdit} isBorder={isBorder} />;
      }
      case 'email': return <Email {...commonProps} value={value} config={parsedConfig} allowEdit={true} readOnly={!allowEdit} isBorder={isBorder} />;
      case 'phoneNumber': return <PhoneNumber {...commonProps} value={value} config={parsedConfig} allowEdit={true} readOnly={!allowEdit} isBorder={isBorder} />;
      case 'url': return <URLField {...commonProps} value={value} config={parsedConfig} allowEdit={true} readOnly={!allowEdit} isBorder={isBorder} />;
      case 'select': return <SingleSelect {...commonProps} options={parsedConfig?.options || []} config={parsedConfig} allowEdit={true} readOnly={!allowEdit} isBorder={isBorder} />;
      case 'multiSelect': {
        let multiSelectValue = [];
        if (Array.isArray(value)) {
          multiSelectValue = value;
        } else if (typeof value === 'string') {
          multiSelectValue = JSON.parse(value || '[]');
        }
        return <MultiSelect value={multiSelectValue} onChange={(newValue) => onChange(newValue)} options={parsedConfig?.options || []} maxSelections={10} config={parsedConfig} allowEdit={true} readOnly={!allowEdit} isBorder={isBorder} useInternalState />;
      }
      case 'rating': return <Rating {...commonProps} value={value} max={parsedConfig?.ratingMax || 5} readOnly={!allowEdit} config={parsedConfig} />;
      case 'user': return <User {...commonProps} readOnly={!allowEdit} config={parsedConfig} />;
      case 'json': return <JSONField {...commonProps} value={value} config={parsedConfig} readOnly={!allowEdit} />;
      case 'createdTime': {
        const tz = getSelectedTimeZone();
        return <AuditCreatedTime {...commonProps} config={{ ...parsedConfig, timeZone: tz }} allowEdit={allowEdit} isBorder={isBorder} />;
      }
      case 'lastModifiedTime': {
        const tz = getSelectedTimeZone();
        return <AuditLastModifiedTime {...commonProps} config={{ ...parsedConfig, timeZone: tz }} allowEdit={allowEdit} isBorder={isBorder} />;
      }
      case 'createdBy': return <AuditCreatedBy {...commonProps} />;
      case 'lastModifiedBy': return <AuditLastModifiedBy {...commonProps} />;
      case 'links': return <LinksField 
        value={value} 
        onChange={onChange} 
        field={{
          id: column.id,
          title: column.title,
          meta: parsedConfig
        }}
        disabled={!allowEdit}
        currentRowId={currentRowId}
        currentTableId={column.model_id}
      />;
      case 'attachment': return <Attachment 
        {...commonProps} 
        config={parsedConfig}
        model_id={column.model_id}
        column_id={column.id}
        row_id={currentRowId}
        isBorder={isBorder}
        allowEdit={allowEdit}
        readOnly={!allowEdit}
      />;
      case 'lookup': return <Lookup value={value} isBorder={isBorder} field={column} />;
      case 'formula': return <Formula 
        {...commonProps} 
        config={parsedConfig}
        columns={allColumns || []} // All columns for field name mapping
        allowEdit={false} // Formula fields are always read-only
        isBorder={isBorder}
        disabled={true} // Disable editing
        rowData={rowData} // Pass row data for formula evaluation
        allColumns={allColumns} // Pass all columns for field name mapping
      />;
      default: return <SingleLineText {...commonProps} allowEdit={true} readOnly={!allowEdit} isBorder={isBorder} />;
    }
    }

  return (
    <div
      className={`flex-shrink-0 h-10 flex items-center px-0 ${isLast ? 'border-r' : 'border-r border-border/20'} border-b border-border/20`}
      style={{ width: `${width}px`, height: '40px', minHeight: '40px', maxHeight: '40px' }}
    >
      <div className="w-full min-w-0">
        {renderField()}
      </div>
    </div>
  );
};

export const EditableTableCell = React.memo(EditableTableCellComponent, (prevProps, nextProps) => {
  const valueChanged = (() => {
    const prevVal = prevProps.value;
    const nextVal = nextProps.value;
    
    // Fast path: Reference equality (most common - no change)
    if (prevVal === nextVal) {
      return false; // Same reference, unchanged
    }
    
    // Handle null/undefined/primitive differences
    if (prevVal === null || nextVal === null || 
        typeof prevVal !== 'object' || typeof nextVal !== 'object') {
      return prevVal !== nextVal; // Primitive comparison
    }
    
    // Handle arrays (MultiSelect, etc.)
    if (Array.isArray(prevVal) && Array.isArray(nextVal)) {
      // Quick length check first
      if (prevVal.length !== nextVal.length) {
        return true; // Different lengths, changed
      }
      // Only do expensive comparison if lengths match
      return prevVal.length > 0 && JSON.stringify(prevVal) !== JSON.stringify(nextVal);
    }
    
    // Type mismatch: one is array, one is not
    if (Array.isArray(prevVal) || Array.isArray(nextVal)) {
      return true; // Changed
    }
    
    // Handle objects (JSON fields, etc.)
    // Quick key count check first
    const prevKeys = Object.keys(prevVal);
    const nextKeys = Object.keys(nextVal);
    if (prevKeys.length !== nextKeys.length) {
      return true; // Different number of keys, changed
    }
    // Only do expensive comparison if key counts match
    return prevKeys.length > 0 && JSON.stringify(prevVal) !== JSON.stringify(nextVal);
  })();
  
  if (
    valueChanged ||
    prevProps.width !== nextProps.width ||
    prevProps.isLast !== nextProps.isLast ||
    prevProps.allowEdit !== nextProps.allowEdit ||
    prevProps.isBorder !== nextProps.isBorder ||
    prevProps.isSystemField !== nextProps.isSystemField ||
    prevProps.currentRowId !== nextProps.currentRowId
  ) {
    return false; // Props changed, should re-render
  }

  // Deep compare column object (most important for preventing re-renders)
  const prevCol = prevProps.column;
  const nextCol = nextProps.column;
  
  if (
    prevCol.id !== nextCol.id ||
    prevCol.title !== nextCol.title ||
    prevCol.column_name !== nextCol.column_name ||
    prevCol.uidt !== nextCol.uidt ||
    prevCol.system !== nextCol.system ||
    prevCol.width !== nextCol.width ||
    prevCol.order_index !== nextCol.order_index ||
    prevCol.model_id !== nextCol.model_id
  ) {
    return false; // Column changed, should re-render
  }

  // CRITICAL: Compare config (parsed from meta) - this is what the component actually uses
  // The component uses column.config for rendering icons, colors, etc.
  const prevConfig = (prevCol as any).config;
  const nextConfig = (nextCol as any).config;
  
  if (prevConfig !== nextConfig) {
    // If both are objects, do deep comparison
    if (typeof prevConfig === 'object' && typeof nextConfig === 'object' && prevConfig !== null && nextConfig !== null) {
      const prevKeys = Object.keys(prevConfig);
      const nextKeys = Object.keys(nextConfig);
      if (prevKeys.length !== nextKeys.length) {
        return false; // Different number of keys, changed
      }
      for (const key of prevKeys) {
        if (prevConfig[key] !== nextConfig[key]) {
          return false; // Config value changed (icon, color, etc.)
        }
      }
    } else if (prevConfig !== nextConfig) {
      // Different types or one is null/undefined
      return false;
    }
  }

  // Also compare meta - handle both object and string formats
  const prevMeta = prevCol.meta;
  const nextMeta = nextCol.meta;
  
  if (prevMeta !== nextMeta) {
    // If both are objects, compare them
    if (typeof prevMeta === 'object' && typeof nextMeta === 'object' && prevMeta !== null && nextMeta !== null) {
      // Shallow comparison of meta object keys
      const prevKeys = Object.keys(prevMeta);
      const nextKeys = Object.keys(nextMeta);
      if (prevKeys.length !== nextKeys.length) {
        return false;
      }
      for (const key of prevKeys) {
        if (prevMeta[key] !== nextMeta[key]) {
          return false;
        }
      }
    } else {
      // Different types or one is null
      return false;
    }
  }

  // Compare onChange function reference
  // Note: This will cause re-render if parent creates new function each time
  if (prevProps.onChange !== nextProps.onChange) {
    return false;
  }

  return true; // Props are equal, skip re-render
});
