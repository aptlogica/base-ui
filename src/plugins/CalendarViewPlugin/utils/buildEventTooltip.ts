import type React from 'react';

type Column = {
  id?: string;
  name?: string;
  title?: string;
  key?: string;
  columnName?: string; // normalized key used in record.data
  type?: string;
  uidt?: string;
  system?: boolean;
};

type FieldConfig = { id: string; isHidden?: boolean; position?: number };

export type BuildEventTooltipOptions = {
  formatTime: (t: string) => string;
  fieldConfig?: FieldConfig[];
  selectedDateFieldId?: string; // to find current date column visibility
};

const isTruthy = (v: any) => v !== null && v !== undefined && v !== '';

// Clean HTML/CSS content from rich text fields
function cleanRichTextContent(content: string): string {
  if (!content || typeof content !== 'string') return '';
  
  // Remove HTML tags and decode entities
  let cleaned = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Remove CSS properties and other technical content
  cleaned = cleaned
    .replace(/[^:]*:\s*[^;]*;/g, '') // Remove CSS properties
    .replace(/rgb\([^)]*\)/g, '') // Remove RGB colors
    .replace(/#[0-9a-fA-F]{3,6}/g, '') // Remove hex colors
    .replace(/\d+px/g, '') // Remove pixel values
    .replace(/\d+em/g, '') // Remove em values
    .replace(/\d+rem/g, '') // Remove rem values
    .replace(/\d+%/g, '') // Remove percentage values
    .replace(/\s+/g, ' ') // Normalize whitespace again
    .trim();
  
  return cleaned;
}

function formatValue(col: Column, raw: any, formatTime: (t: string) => string): string | null {
  if (!isTruthy(raw)) return null;
  const t = String(col?.type || col?.uidt || '').toLowerCase();
  
  try {
    // Handle rich text fields (longText with richText: true)
    if (t === 'longtext' && col?.uidt === 'longText' && typeof raw === 'string' && raw.includes('<')) {
      const cleaned = cleanRichTextContent(raw);
      return cleaned.length > 100 ? cleaned.substring(0, 100) + '...' : cleaned;
    }
    
    if (t === 'currency') {
      const num = Number(raw);
      if (!Number.isNaN(num)) {
        // Get currency config from column meta
        const meta = col?.meta || {};
        const currencyType = meta.currencyType || 'USD';
        const currencyLocale = meta.currencyLocale || 'en-US';
        return new Intl.NumberFormat(currencyLocale, { style: 'currency', currency: currencyType }).format(num);
      }
    }
    if (t === 'percent') {
      const num = Number(raw);
      if (!Number.isNaN(num)) return `${num}%`;
    }
    if (t === 'date' || t === 'datetime' || t === 'createdtime' || t === 'lastmodifiedtime') {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        // Format date more nicely
        if (t === 'date') {
          return d.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          });
        } else {
          return d.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        }
      }
    }
    if (t === 'time') {
      const s = String(raw);
      if (/^\d{1,2}:\d{2}$/.test(s)) return formatTime(s);
      return s;
    }
    if (t === 'multiselect') {
      if (Array.isArray(raw)) return raw.map(v => String((v as any)?.label ?? v)).join(', ');
      try { const parsed = JSON.parse(String(raw)); if (Array.isArray(parsed)) return parsed.join(', '); } catch {}
    }
    if (Array.isArray(raw)) return raw.map(v => (v?.name || v?.filename || v?.fileName || String(v))).join(', ');
    if (typeof raw === 'object') {
      const name = (raw as any)?.name || (raw as any)?.label || (raw as any)?.title;
      if (name) return String(name);
      return JSON.stringify(raw);
    }
    
    // Truncate very long strings
    const str = String(raw);
    return str.length > 50 ? str.substring(0, 50) + '...' : str;
  } catch {
    return String(raw);
  }
}

// Get a user-friendly label for a column
function getColumnLabel(col: Column): string {
  const title = col?.title || col?.name || col?.key || col?.columnName || '';
  if (!title) return '';
  
  // Convert camelCase/snake_case to readable format
  return title
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
    .join(' ');
}

export function buildEventTooltipLines(args: {
  event: any;
  columns: Column[];
  options: BuildEventTooltipOptions;
}): string[] {
  const { event, columns, options } = args;
  if (!event) return [];

  const lines: string[] = [];

  // First line: Event title with date/time separated by bullets (horizontal)
  if (isTruthy(event.title)) {
    const titleLine = [String(event.title)];
    
    // Add date/time info (always show date for context)
    if (event.dateTime instanceof Date && !isNaN(event.dateTime.getTime())) {
      // Format as local "YYYY-MM-DD HH:MM" (or "YYYY-MM-DD" for date-only)
      const d = event.dateTime;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const ymd = `${yyyy}-${mm}-${dd}`; // Local date components avoid UTC shift from toISOString()
      const dateStr = event.isDateField
         ? ymd
        : `${ymd} ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })}`;
      titleLine.push(dateStr);
    }
    
    lines.push(titleLine.join(' • '));
  }

  // Collect all essential fields
  const essentialFields: Array<{col: Column, value: string, priority: number}> = [];
  
  (columns || []).forEach(col => {
    const key = String(col?.columnName ?? col?.name ?? col?.key ?? col?.title ?? '');
    if (!key) return;
    
    // Skip title, system fields, and very long content
    if (key.toLowerCase() === 'title' || col?.system) return;
    if (key.toLowerCase().includes('category') || key.toLowerCase().includes('tag') || key.toLowerCase().includes('type')) return; // Skip category already shown in title
    
    const raw = event?.data?.[key] ?? event?.[key];
    const formatted = formatValue(col, raw, options.formatTime);
    
    if (formatted) {
      const colType = String(col?.type || col?.uidt || '').toLowerCase();
      let priority = 10; // Default low priority
      
      // Show the most important field types
      if (colType === 'currency') priority = 1;
      else if (colType === 'percent') priority = 2;
      else if (colType === 'email') priority = 3;
      else if (colType === 'phone') priority = 4;
      else if (colType === 'url') priority = 5;
      else if (colType === 'number') priority = 6;
      else if (colType === 'decimal') priority = 7;
      else if (colType === 'rating') priority = 8;
      else if (colType === 'boolean') priority = 9;
      // Skip dates, long text, and other verbose fields
      
      if (priority < 10) {
        essentialFields.push({
          col,
          value: formatted,
          priority
        });
      }
    }
  });

  // Create horizontal bullet-separated lines (like NocoDB)
  const sortedFields = essentialFields.sort((a, b) => a.priority - b.priority);
  
  // Group fields into lines (up to 3-4 fields per line max)
  const fieldsPerLine = 3;
  for (let i = 0; i < sortedFields.length; i += fieldsPerLine) {
    const lineFields = sortedFields.slice(i, i + fieldsPerLine);
    const lineValues = lineFields.map(({value}) => value).join(' • ');
    if (lineValues) {
      lines.push(`• ${lineValues}`);
    }
  }

  return lines;
}
