export type FilterOp =
  | 'is equal'
  | 'is not equal'
  | 'contains'
  | 'does not contain'
  | 'is empty'
  | 'is not empty'
  | 'greater than'
  | 'less than'
  | 'less than or equal'
  | 'greater than or equal'
  | 'before'
  | 'after'
  | 'is'
  | 'is checked'
  | 'is not checked'
  | 'is not'
  | 'contains any of'
  | 'does not contains any of';

const isEmpty = (v: any) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);

// Export parseMultiSelectValue for use in FilterPopover
export const parseMultiSelectValue = (val: any): string[] => {
  if (Array.isArray(val)) {
    return val.map((item: any) => {
      // If item is an object with an 'option' property, extract it
      if (item && typeof item === 'object' && 'option' in item) {
        return String(item.option);
      }
      // Otherwise, convert to string
      return String(item);
    });
  }
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => {
          // If item is an object with an 'option' property, extract it
          if (item && typeof item === 'object' && 'option' in item) {
            return String(item.option);
          }
          // Otherwise, convert to string
          return String(item);
        });
      }
      return val ? [val] : [];
    } catch {
      return val ? [val] : [];
    }
  }
  return val == null ? [] : [String(val)];
};

// Internal use only - keep normalizeMultiSelect for backward compatibility
const normalizeMultiSelect = parseMultiSelectValue;

const toNumber = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

const toDate = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const t = Date.parse(String(v));
  return Number.isNaN(t) ? null : t;
};

export const matchesFilter = (card: any, f: any, columns: any): boolean => {
  const findColumnByKey = (key: string) => columns.find((c:any) => c.key === key || c.id === key || c.title === key || c.column_name === key);
  const col = findColumnByKey(f.column);
  if (!col) return true;
  // Try multiple keys to access the data: key, column_name
  const dataKey = col.key || col.column_name;
  const raw = card?.data?.[dataKey as string] ?? card?.[dataKey as string];
  const type = String((col as any).type || (col as any).uidt);
  const op = f.operator;
  const val = f.value;

  if (op === 'is empty') return isEmpty(raw);
  if (op === 'is not empty') return !isEmpty(raw);

  switch (type) {
    case 'multiSelect': {
      // Normalize both raw and val to string arrays
      const rawArr = normalizeMultiSelect(raw);
      // For filter values, val is typically a JSON string, so normalize directly
      const valArr = normalizeMultiSelect(val);

      // Helper: set equality (ignores order and duplicates)
      const setEquals = (a: string[], b: string[]) => {
        if (a.length !== b.length) return false;
        const sa = new Set(a);
        const sb = new Set(b);
        if (sa.size !== sb.size) return false;
        for (const x of sa) if (!sb.has(x)) return false;
        return true;
      };

      // Helper: any intersection
      const hasAny = (a: string[], b: string[]) => a.some(x => b.includes(x));

      if (op === 'is equal') return setEquals(rawArr, valArr);
      if (op === 'is not equal') return !setEquals(rawArr, valArr);
      if (op === 'contains any of') return hasAny(rawArr, valArr);
      if (op === 'does not contains any of') return !hasAny(rawArr, valArr);
      return true;
    }
    case 'select': {
      const s = raw == null ? '' : String(raw);
      if (op === 'is equal') return s === String(val);
      if (op === 'is not equal') return s !== String(val);
      if (op === 'contains any of') {
        // val can be comma-separated or array
        const values = typeof val === 'string' ? val.split(',').map(v => v.trim()) : Array.isArray(val) ? val : [val];
        return values.some(v => s === String(v));
      }
      if (op === 'does not contains any of') {
        // val can be comma-separated or array
        const values = typeof val === 'string' ? val.split(',').map(v => v.trim()) : Array.isArray(val) ? val : [val];
        return !values.some(v => s === String(v));
      }
      return true;
    }
    case 'text':
    case 'email':
    case 'longText': {
      const s = raw == null ? '' : String(raw);
      // console.log('s------>',s);
      // console.log('val------>',val);
      if (op === 'is equal') return s === String(val);
      if (op === 'is not equal') return s !== String(val);
      if (op === 'contains') return s.toLowerCase().includes(String(val).toLowerCase());
      if (op === 'does not contain') return !s.toLowerCase().includes(String(val).toLowerCase());
      return true;
    }

    case 'json':{
      const s = raw == null ? '' : JSON.stringify(raw);
      if (op === 'is equal') return s === String(val);
      if (op === 'is not equal') return s !== String(val);
      if (op === 'contains') return s.toLowerCase().includes(String(val).toLowerCase());
      if (op === 'does not contain') return !s.toLowerCase().includes(String(val).toLowerCase());
      return true;
    }

    case 'url':{
      const s = raw == null ? '' : String(raw);
      const updatedurl = `https://${val}`
      const sNoProto = s.toLowerCase().replace(/^https?:\/\//, '');
      const vNoProto = String(val ?? '').toLowerCase().replace(/^https?:\/\//, '');

      if (op === 'is equal') return s === String(updatedurl);
      if (op === 'is not equal') return s !== String(updatedurl);
      if (op === 'contains') return sNoProto.includes(vNoProto);
      if (op === 'does not contain') return !sNoProto.includes(vNoProto);
    }
    case 'boolean': {
      const isTrue = raw === true || String(raw).toLowerCase() === 'true' || String(raw) === '1';
      if (op === 'is checked') return isTrue === true;
      if (op === 'is not checked') return isTrue === false;
      return true;
    }
    case 'number':
    case 'decimal':
    case 'currency':
    case 'percent':
    case 'year':
    case 'rating':
    case 'duration': {
      const n = toNumber(raw);
      const t = toNumber(val);
      if (n === null || t === null) return false;
      if (op === 'is equal') return n === t;
      if (op === 'is not equal') return n !== t;
      if (op === 'greater than') return n > t;
      if (op === 'less than') return n < t;
      if (op === 'less than or equal') return n <= t;
      if (op === 'greater than or equal') return n >= t;
      if (op === 'is empty') return n == null;
      if (op === 'is not empty') return n != null;
      return true;
    }
    case 'date':
    case 'datetime': {
      const d = toDate(raw);
      const td = toDate(val);
      if (d === null || td === null) return false;
      if (op === 'is equal') return d === td;
      if (op === 'is not equal') return d !== td;
      if (op === 'before') return d < td;
      if (op === 'after') return d > td;
      return true;
    }
    // case 'time':{
      
    // }
    default: {
      const s = raw == null ? '' : String(raw);
      if (op === 'is equal') return s === String(val);
      if (op === 'is not equal') return s !== String(val);
      if (op === 'contains') return s.toLowerCase().includes(String(val).toLowerCase());
      if (op === 'does not contain') return !s.toLowerCase().includes(String(val).toLowerCase());
      return true;
    }
  }
};

export const applyFilters = (cards: any[], filters: any[], columns: any) => {
  if (!Array.isArray(filters) || filters.length === 0) return cards;
  
  return cards.filter(card => {
    // If no filters, include all cards
    if (filters.length === 0) return true;
    
    // First filter always applies
    let result = matchesFilter(card, filters[0], columns);
    
    // Apply remaining filters with their logic
    for (let i = 1; i < filters.length; i++) {
      const filter = filters[i];
      const matches = matchesFilter(card, filter, columns);
      
      // The logic property determines how this filter combines with previous result
      // Default to 'AND' for backward compatibility
      const logic = filter.logic || 'AND';
      
      if (logic === 'OR') {
        // For OR, include if either previous result OR current filter matches
        result = result || matches;
      } else {
        // For AND, include only if both previous result AND current filter match
        result = result && matches;
      }
      
      // If result is false and we're in AND mode, we can break early
      if (!result) break;
    }
    
    return result;
  });
};

// Filter validation utilities
export interface FilterCondition {
  column: string;
  operator: string;
  value: string;
  logic?: 'AND' | 'OR';
}

/**
 * Check if an operator requires a value (e.g., 'is empty' doesn't need a value)
 */
export const operatorRequiresValue = (operator: string): boolean => {
  return !['is empty', 'is not empty', 'is checked', 'is not checked'].includes(operator);
};

/**
 * Check if a filter is complete and valid
 */
export const isFilterComplete = (filter: Partial<FilterCondition>, inputValue?: string): boolean => {
  if (!filter.column) return false;
  
  const value = inputValue !== undefined ? inputValue.trim() : (filter.value || '').trim();
  
  if (operatorRequiresValue(filter.operator || '')) {
    return value.length > 0;
  }
  
  // Operators that don't require values are valid if column and operator are set
  return true;
};

export const FIELD_TYPE_OPERATORS: Record<string, { value: FilterOp; label: string }[]> = {
  text: [
    { value: 'is equal', label: 'is equal' },
    { value: 'is not equal', label: 'is not equal' },
    { value: 'contains', label: 'contains' },
    { value: 'does not contain', label: 'does not contain' },
    { value: 'is empty', label: 'is empty' },
    { value: 'is not empty', label: 'is not empty' },
  ],
  json: [
    { value: 'is equal', label: 'is equal' },
    { value: 'is not equal', label: 'is not equal' },
    { value: 'contains', label: 'contains' },
    { value: 'does not contain', label: 'does not contain' },
    { value: 'is empty', label: 'is empty' },
    { value: 'is not empty', label: 'is not empty' },
  ],
  email: [
    { value: 'is equal', label: 'is equal' },
    { value: 'is not equal', label: 'is not equal' },
    { value: 'contains', label: 'contains' },
    { value: 'does not contain', label: 'does not contain' },
    { value: 'is empty', label: 'is empty' },
    { value: 'is not empty', label: 'is not empty' },
  ],
  url: [
    { value: 'is equal', label: 'is equal' },
    { value: 'is not equal', label: 'is not equal' },
    { value: 'contains', label: 'contains' },
    { value: 'does not contain', label: 'does not contain' },
    { value: 'is empty', label: 'is empty' },
    { value: 'is not empty', label: 'is not empty' },
  ],
  longText: [
    { value: 'is equal', label: 'is equal' },
    { value: 'is not equal', label: 'is not equal' },
    { value: 'contains', label: 'contains' },
    { value: 'does not contain', label: 'does not contain' },
    { value: 'is empty', label: 'is empty' },
    { value: 'is not empty', label: 'is not empty' },
  ],
  number: [
    { value: 'is equal', label: 'is equal' },
    { value: 'is not equal', label: 'is not equal' },
    { value: 'less than', label: 'less than' },
    { value: 'less than or equal', label: 'less than or equal' },
    { value: 'greater than', label: 'greater than' },
    { value: 'greater than or equal', label: 'greater than or equal' },
    { value: 'is empty', label: 'is empty' },
    { value: 'is not empty', label: 'is not empty' },
  ],
  decimal: [
    { value: 'is equal', label: 'is equal' },
    { value: 'is not equal', label: 'is not equal' },
    { value: 'less than', label: 'less than' },
    { value: 'less than or equal', label: 'less than or equal' },
    { value: 'greater than', label: 'greater than' },
    { value: 'greater than or equal', label: 'greater than or equal' },
    { value: 'is empty', label: 'is empty' },
    { value: 'is not empty', label: 'is not empty' },
  ],
  currency: [
    { value: 'is equal', label: 'is equal' },
    { value: 'is not equal', label: 'is not equal' },
    { value: 'less than', label: 'less than' },
    { value: 'less than or equal', label: 'less than or equal' },
    { value: 'greater than', label: 'greater than' },
    { value: 'greater than or equal', label: 'greater than or equal' },
    { value: 'is empty', label: 'is empty' },
    { value: 'is not empty', label: 'is not empty' },
  ],
  percent: [
    { value: 'is equal', label: 'is equal' },
    { value: 'is not equal', label: 'is not equal' },
    { value: 'less than', label: 'less than' },
    { value: 'less than or equal', label: 'less than or equal' },
    { value: 'greater than', label: 'greater than' },
    { value: 'greater than or equal', label: 'greater than or equal' },
    { value: 'is empty', label: 'is empty' },
    { value: 'is not empty', label: 'is not empty' },
  ],
  year: [
    { value: 'is equal', label: 'is equal' },
    { value: 'is not equal', label: 'is not equal' },
    { value: 'less than', label: 'less than' },
    { value: 'less than or equal', label: 'less than or equal' },
    { value: 'greater than', label: 'greater than' },
    { value: 'greater than or equal', label: 'greater than or equal' },
    { value: 'is empty', label: 'is empty' },
    { value: 'is not empty', label: 'is not empty' }
  ],
  select: [
    { value: 'is equal', label: 'is equal' },
    { value: 'is not equal', label: 'is not equal' },
    { value: 'contains any of', label: 'contains any of' },
    { value: 'does not contains any of', label: 'does not contains any of' },
    { value: 'is empty', label: 'is empty' },
    { value: 'is not empty', label: 'is not empty' }
  ],
  multiSelect: [
    { value: 'is equal', label: 'is equal' },
    { value: 'is not equal', label: 'is not equal' },
    { value: 'contains any of', label: 'contains any of' },
    { value: 'does not contains any of', label: 'does not contains any of' },
    { value: 'is empty', label: 'is empty' },
    { value: 'is not empty', label: 'is not empty' }
  ],
  boolean: [
    { value: 'is checked', label: 'is checked' },
    { value: 'is not checked', label: 'is not checked' },
  ],
  date: [
    { value: 'is equal', label: 'is equal' },
    { value: 'is not equal', label: 'is not equal' },
    { value: 'before', label: 'before' },
    { value: 'after', label: 'after' },
    { value: 'is empty', label: 'is empty' },
    { value: 'is not empty', label: 'is not empty' },
  ],
  datetime: [
    { value: 'is equal', label: 'is equal' },
    { value: 'is not equal', label: 'is not equal' },
    { value: 'before', label: 'before' },
    { value: 'after', label: 'after' },
    { value: 'is empty', label: 'is empty' },
    { value: 'is not empty', label: 'is not empty' },
  ],
  time: [
    { value: 'is equal', label: 'is equal' },
    { value: 'is not equal', label: 'is not equal' },
    { value: 'before', label: 'before' },
    { value: 'after', label: 'after' },
    { value: 'is empty', label: 'is empty' },
    { value: 'is not empty', label: 'is not empty' },
  ],
  rating: [
    { value: 'is equal', label: 'is equal' },
    { value: 'is not equal', label: 'is not equal' },
    { value: 'less than', label: 'less than' },
    { value: 'less than or equal', label: 'less than or equal' },
    { value: 'greater than', label: 'greater than' },
    { value: 'greater than or equal', label: 'greater than or equal' },
    { value: 'is empty', label: 'is empty' },
    { value: 'is not empty', label: 'is not empty' },
  ],
  default: [
    { value: 'is equal', label: 'is equal' },
    { value: 'is not equal', label: 'is not equal' },
    { value: 'is empty', label: 'is empty' },
    { value: 'is not empty', label: 'is not empty' },
  ],
  duration:[
    { value: 'is equal', label: 'is equal' },
    { value: 'is not equal', label: 'is not equal' },
    { value: 'less than', label: 'less than' },
    { value: 'less than or equal', label: 'less than or equal' },
    { value: 'greater than', label: 'greater than' },
    { value: 'greater than or equal', label: 'greater than or equal' },
    { value: 'is empty', label: 'is empty' },
    { value: 'is not empty', label: 'is not empty' },
  ]
};

/**
 * Get the default operator for a field type
 */
export const getDefaultOperator = (fieldType: string): FilterOp => {
  const operators = FIELD_TYPE_OPERATORS[fieldType] || FIELD_TYPE_OPERATORS.default;
  return operators[0]?.value || 'is equal';
};

/**
 * Format duration value for display
 * Duration values are stored in MINUTES
 */
export const formatDurationValue = (value: string | number, format: string = 'h:mm'): string => {
  const durationInMinutes = value ? Number(value) : 0;
  
  // Convert minutes to seconds for detailed formats
  const totalSeconds = Math.floor(durationInMinutes * 60);
  
  if (format === 'h:mm') {
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = Math.floor(durationInMinutes % 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  } else if (format === 'h:mm:ss' || format.startsWith('h:mm:ss.')) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else if (format === 'd:h:mm') {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return days > 0 
      ? `${days}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      : `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  return String(durationInMinutes);
};

/**
 * Normalize filter value before saving
 * For operators that don't require values, return empty string
 */
export const normalizeFilterValue = (filter: Partial<FilterCondition>, inputValue?: string): string => {
  if (!operatorRequiresValue(filter.operator || '')) {
    return '';
  }
  
  const value = inputValue !== undefined ? inputValue.trim() : (filter.value || '').trim();
  return value;
};

/**
 * Get visible columns for filtering (excludes system fields and non-filterable fields)
 */
export const getVisibleColumns = (columns: any[], fieldsToExclude: string[] = []): any[] => {
  return columns.filter(col => 
    !col.hidden && 
    !col.isHidden && 
    !col.system && 
    col.key?.toLowerCase() !== 'id' &&
    col.column_name?.toLowerCase() !== 'id' &&
    !fieldsToExclude.includes(col.uidt || col.type || '')
  );
};
