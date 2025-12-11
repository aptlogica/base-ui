type Column = {
  id?: string;
  name?: string;
  title?: string;
  key?: string;
  column_name?: string;
  type?: string;
  uidt?: string;
  system?: boolean;
  meta?: any;
};

type FieldConfig = { id: string; isHidden?: boolean; position?: number };

export type BuildGanttTooltipOptions = {
  formatTime: (t: string) => string;
  fieldConfig?: FieldConfig[];
  fieldsToExclude?: string[];
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
    
    if (t === 'currency' || col?.uidt === 'Currency') {
      const num = Number(raw);
      if (!Number.isNaN(num)) {
        // Get currency config from column meta
        const meta = col?.meta || {};
        const currencyType = meta.currencyType || 'USD';
        const currencyLocale = meta.currencyLocale || 'en-US';
        return new Intl.NumberFormat(currencyLocale, { style: 'currency', currency: currencyType }).format(num);
      }
    }
    if (t === 'percent' || col?.uidt === 'Percent') {
      const num = Number(raw);
      if (!Number.isNaN(num)) return `${num}%`;
    }
    if (t === 'email' || col?.uidt === 'Email') {
      return String(raw);
    }
    if (t === 'phone' || col?.uidt === 'PhoneNumber') {
      return String(raw);
    }
    if (t === 'url' || col?.uidt === 'URL') {
      return String(raw);
    }
    if (t === 'number' || col?.uidt === 'Number') {
      const num = Number(raw);
      if (!Number.isNaN(num)) return num.toLocaleString('en-US');
    }
    if (t === 'decimal' || col?.uidt === 'Decimal') {
      const num = Number(raw);
      if (!Number.isNaN(num)) return num.toFixed(2);
    }
    if (t === 'rating' || col?.uidt === 'Rating') {
      return String(raw);
    }
    if (t === 'boolean' || col?.uidt === 'Checkbox') {
      return raw ? 'Yes' : 'No';
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
    if (Array.isArray(raw)) {
      // Handle links field
      if (raw.length > 0 && typeof raw[0] === 'object' && raw[0].title) {
        return raw.map((v: any) => v?.title || v?.name || String(v)).join(', ');
      }
      return raw.map(v => (v?.name || v?.filename || v?.fileName || String(v))).join(', ');
    }
    if (typeof raw === 'object') {
      const name = (raw as any)?.name || (raw as any)?.label || (raw as any)?.title;
      if (name) return String(name);
      // Don't show [object Object]
      return null;
    }
    
    // Truncate very long strings
    const str = String(raw);
    return str.length > 50 ? str.substring(0, 50) + '...' : str;
  } catch {
    return null;
  }
}

export function buildGanttTooltipLines(args: {
  task: any;
  columns: Column[];
  options: BuildGanttTooltipOptions;
}): string[] {
  const { task, columns, options } = args;
  if (!task) return [];

  const lines: string[] = [];

  // First line: Task name with date range
  const titleLine = [task.name];
  
  // Add date range
  const startDate = task.startDate instanceof Date ? task.startDate : new Date(task.startDate);
  const endDate = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
  
  if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
    const dateRange = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    titleLine.push(dateRange, `${duration} days`);
  }
  
  lines.push(titleLine.join(' • '));

  // Collect all essential fields from rawData
  const essentialFields: Array<{value: string, priority: number}> = [];
  
  if (task.rawData && typeof task.rawData === 'object') {
    (columns || []).forEach(col => {
      const key = String(col?.column_name || col?.name || col?.key || col?.title || '');
      if (!key) return;
      
      // Skip if field is in exclude list
      if (options.fieldsToExclude?.includes(col?.uidt || '')) return;
      
      // Check if field is visible via fieldConfig
      if (options.fieldConfig) {
        const fieldConfig = options.fieldConfig.find(fc => String(fc.id) === String(col.id));
        if (fieldConfig?.isHidden) return;
      }
      
      // Skip title, id, and system fields
      if (key.toLowerCase() === 'title' || key.toLowerCase() === 'id' || col?.system) return;
      
      // Get value from rawData
      const raw = task.rawData[key];
      const formatted = formatValue(col, raw, options.formatTime);
      
      if (formatted) {
        const colType = String(col?.type || col?.uidt || '').toLowerCase();
        let priority = 10; // Default low priority
        
        // Show the most important field types first
        if (colType === 'currency' || col?.uidt === 'Currency') priority = 1;
        else if (colType === 'percent' || col?.uidt === 'Percent') priority = 2;
        else if (colType === 'email' || col?.uidt === 'Email') priority = 3;
        else if (colType === 'phone' || col?.uidt === 'PhoneNumber') priority = 4;
        else if (colType === 'url' || col?.uidt === 'URL') priority = 5;
        else if (colType === 'number' || col?.uidt === 'Number') priority = 6;
        else if (colType === 'decimal' || col?.uidt === 'Decimal') priority = 7;
        else if (colType === 'rating' || col?.uidt === 'Rating') priority = 8;
        else if (colType === 'boolean' || col?.uidt === 'Checkbox') priority = 9;
        // Skip dates, long text, and other verbose fields by not giving them priority < 10
        
        if (priority < 10) {
          essentialFields.push({
            value: formatted,
            priority
          });
        }
      }
    });
  }

  // Create horizontal bullet-separated lines (like NocoDB)
  const sortedFields = essentialFields.sort((a, b) => a.priority - b.priority);
  
  // Group fields into lines (up to 3-4 fields per line max, show first 5 fields total)
  const fieldsPerLine = 3;
  const maxFields = 5;
  for (let i = 0; i < Math.min(sortedFields.length, maxFields); i += fieldsPerLine) {
    const lineFields = sortedFields.slice(i, i + fieldsPerLine);
    const lineValues = lineFields.map(({value}) => value).join(' • ');
    if (lineValues) {
      lines.push(`• ${lineValues}`);
    }
  }

  return lines;
}
