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
};

const isTruthy = (v: any) => v !== null && v !== undefined && v !== '';

// Clean HTML/CSS content from rich text fields
function stripHtmlTags(input: string): string {
  let out = '';
  let inTag = false;
  for (const element of input) {
    const ch = element;
    if (ch === '<') {
      inTag = true;
      continue;
    }
    if (ch === '>') {
      inTag = false;
      continue;
    }
    if (!inTag) out += ch;
  }
  return out;
}

function collapseWhitespace(input: string): string {
  let out = '';
  let inWs = false;
  for (const element of input) {
    const ch = element;
    const isWs =
      ch === ' ' ||
      ch === '\n' ||
      ch === '\r' ||
      ch === '\t' ||
      ch === '\f' ||
      ch === '\v';
    if (isWs) {
      if (!inWs) out += ' ';
      inWs = true;
      continue;
    }
    inWs = false;
    out += ch;
  }
  return out;
}

function removeCssDeclarations(input: string): string {
  const parts = input.split(';');
  const kept = parts.filter(part => !part.includes(':'));
  return kept.join(';');
}

function removeRgbAndColorsAndUnits(input: string): string {
  let out = '';
  let i = 0;
  while (i < input.length) {
    const ch = input[i];

    if (ch === '#' && i + 3 < input.length) {
      let j = i + 1;
      while (j < input.length && j - (i + 1) < 6) {
        const c = input[j];
        const isHex =
          (c >= '0' && c <= '9') ||
          (c >= 'a' && c <= 'f') ||
          (c >= 'A' && c <= 'F');
        if (!isHex) break;
        j++;
      }
      const hexLen = j - (i + 1);
      if (hexLen >= 3) {
        i = j;
        continue;
      }
    }

    if (ch === 'r' && input.slice(i, i + 4) === 'rgb(') {
      const close = input.indexOf(')', i + 4);
      if (close !== -1) {
        i = close + 1;
        continue;
      }
    }

    if (ch >= '0' && ch <= '9') {
      let j = i;
      while (j < input.length && input[j] >= '0' && input[j] <= '9') j++;
      const unit2 = input.slice(j, j + 2);
      const unit3 = input.slice(j, j + 3);
      if (unit2 === 'px' || unit2 === 'em') {
        i = j + 2;
        continue;
      }
      if (unit3 === 'rem') {
        i = j + 3;
        continue;
      }
      if (input[j] === '%') {
        i = j + 1;
        continue;
      }
    }

    out += ch;
    i++;
  }
  return out;
}

function cleanRichTextContent(content: string): string {
  if (!content || typeof content !== 'string') return '';

  let cleaned = stripHtmlTags(content)
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&nbsp;', ' ')
    .trim();
  cleaned = collapseWhitespace(cleaned).trim();

  cleaned = removeCssDeclarations(cleaned);
  cleaned = removeRgbAndColorsAndUnits(cleaned);
  cleaned = collapseWhitespace(cleaned).trim();

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
  const sortedFields = visibleFields.toSorted((a, b) => a.priority - b.priority);

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

