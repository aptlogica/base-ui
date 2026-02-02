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

  let cleaned = content
    .replaceAll(/<[^>]*>/g, '')
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&nbsp;', ' ')
    .replaceAll(/\s+/g, ' ')
    .trim();

  cleaned = cleaned
    .replaceAll(/[^:]*:\s*[^;]*;/g, '')
    .replaceAll(/rgb\([^)]*\)/g, '')
    .replaceAll(/#[0-9a-fA-F]{3,6}/g, '')
    .replaceAll(/\d+px/g, '')
    .replaceAll(/\d+em/g, '')
    .replaceAll(/\d+rem/g, '')
    .replaceAll(/\d+%/g, '')
    .replaceAll(/\s+/g, ' ')
    .trim();

  return cleaned;
}


function formatValue(col: Column, raw: any, formatTime: (t: string) => string): string | null {
  // If value is null/undefined/empty, show hyphen instead of hiding the field
  if (!isTruthy(raw)) return '-';
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
        // Calendar's Column type doesn't expose meta; use default currency formatting
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(num);
      }
      return '-';
    }
    if (t === 'percent') {
      const num = Number(raw);
      if (!Number.isNaN(num)) return `${num}%`;
      return '-';
    }
    if (t === 'email') {
      return String(raw);
    }
    if (t === 'phone') {
      return String(raw);
    }
    if (t === 'url') {
      return String(raw);
    }
    if (t === 'number') {
      const num = Number(raw);
      if (!Number.isNaN(num)) return num.toLocaleString('en-US');
      return '-';
    }
    if (t === 'decimal') {
      const num = Number(raw);
      if (!Number.isNaN(num)) return num.toFixed(2);
      return '-';
    }
    if (t === 'date' || t === 'datetime' || t === 'createdtime' || t === 'lastmodifiedtime') {
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) {
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
      if (Array.isArray(raw)) return raw.map(v => String((v)?.label ?? v)).join(', ');
      try { const parsed = JSON.parse(String(raw)); if (Array.isArray(parsed)) return parsed.join(', '); } catch { }
    }
    if (Array.isArray(raw)) {
      // Handle links / attachments similar to Gantt
      if (raw.length > 0 && typeof raw[0] === 'object' && raw[0].title) {
        return raw
          .map((v: any) => v?.title || v?.name || String(v))
          .join(', ');
      }
      return raw
        .map(v => (v?.name || v?.filename || v?.fileName || String(v)))
        .join(', ');
    }
    if (typeof raw === 'object') {
      const name = raw?.name || raw?.label || raw?.title;
      if (name) return String(name);
      // Unknown object shape – show hyphen instead of JSON noise
      return '-';
    }

    // Truncate very long strings
    const str = String(raw);
    return str.length > 50 ? str.substring(0, 50) + '...' : str;
  } catch {
    // On any formatting error, show hyphen
    return '-';
  }
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
    if (event.dateTime instanceof Date && !Number.isNaN(event.dateTime.getTime())) {
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

  // Collect all visible, non-empty fields
  // We use "priority" only for ordering (essential types first), not for exclusion
  const visibleFields: Array<{ col: Column; value: string; priority: number }> = [];

  (columns || []).forEach(col => {
    const key = String(col?.columnName ?? col?.name ?? col?.key ?? col?.title ?? '');
    if (!key) return;

    // Respect fieldConfig visibility if provided
    if (options.fieldConfig && col.id) {
      const fc = options.fieldConfig.find(fc => String(fc.id) === String(col.id));
      if (fc?.isHidden) return;
    }

    // Skip title, system fields, and category/tag/type fields (already reflected in title)
    if (key.toLowerCase() === 'title' || col?.system) return;
    if (key.toLowerCase().includes('category') || key.toLowerCase().includes('tag') || key.toLowerCase().includes('type')) return;

    const raw = event?.data?.[key] ?? event?.[key];
    const formatted = formatValue(col, raw, options.formatTime);

    if (formatted) {
      const colType = String(col?.type || col?.uidt || '').toLowerCase();
      let priority = 20; // Default medium/low priority

      // Essential types first (lower number = earlier)
      if (colType === 'currency') priority = 1;
      else if (colType === 'percent') priority = 2;
      else if (colType === 'email') priority = 3;
      else if (colType === 'phone') priority = 4;
      else if (colType === 'url') priority = 5;
      else if (colType === 'number') priority = 6;
      else if (colType === 'decimal') priority = 7;
      else if (colType === 'rating') priority = 8;
      else if (colType === 'boolean') priority = 9;

      visibleFields.push({
        col,
        value: formatted,
        priority,
      });
    }
  });

  // Create horizontal bullet-separated lines (like NocoDB)
  const sortedFields = visibleFields.sort((a, b) => a.priority - b.priority);

  // Group fields into lines (up to 3-4 fields per line max)
  const fieldsPerLine = 3;
  for (let i = 0; i < sortedFields.length; i += fieldsPerLine) {
    const lineFields = sortedFields.slice(i, i + fieldsPerLine);
    const lineValues = lineFields.map(({ value }) => value).join(' • ');
    if (lineValues) {
      lines.push(`• ${lineValues}`);
    }
  }

  return lines;
}
