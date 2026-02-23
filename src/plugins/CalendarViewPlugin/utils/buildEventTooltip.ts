import { isTruthyValue } from '../../shared/tooltipTextUtils';
import { formatTooltipValue } from '../../shared/tooltipValueUtils';
import { toBulletLines } from '../../shared/tooltipLineUtils';

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

const getColumnKey = (col: Column) =>
  String(col?.columnName ?? col?.name ?? col?.key ?? col?.title ?? '');

const isHiddenField = (col: Column, options: BuildEventTooltipOptions) => {
  if (!options.fieldConfig || !col.id) return false;
  const fc = options.fieldConfig.find(fc => String(fc.id) === String(col.id));
  return !!fc?.isHidden;
};

const isSystemOrTitleField = (key: string, col: Column) =>
  key.toLowerCase() === 'title' || !!col?.system;

const isCategoryLikeField = (key: string) => {
  const lower = key.toLowerCase();
  return lower.includes('category') || lower.includes('tag') || lower.includes('type');
};

const getFieldPriority = (col: Column) => {
  const colType = String(col?.type || col?.uidt || '').toLowerCase();
  if (colType === 'currency') return 1;
  if (colType === 'percent') return 2;
  if (colType === 'email') return 3;
  if (colType === 'phone') return 4;
  if (colType === 'url') return 5;
  if (colType === 'number') return 6;
  if (colType === 'decimal') return 7;
  if (colType === 'rating') return 8;
  if (colType === 'boolean') return 9;
  return 20;
};

function formatValue(col: Column, raw: any, formatTime: (t: string) => string): string | null {
  return formatTooltipValue(col, raw, {
    formatTime,
    matchUidt: false,
    useMetaCurrency: false,
    currencyFallback: { locale: "en-US", currency: "USD" },
    booleanAsYesNo: false,
  });
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
  if (isTruthyValue(event.title)) {
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
    const key = getColumnKey(col);
    if (!key) return;

    // Respect fieldConfig visibility if provided
    if (isHiddenField(col, options)) return;

    // Skip title, system fields, and category/tag/type fields (already reflected in title)
    if (isSystemOrTitleField(key, col)) return;
    if (isCategoryLikeField(key)) return;

    const raw = event?.data?.[key] ?? event?.[key];
    const formatted = formatValue(col, raw, options.formatTime);

    if (formatted) {
      visibleFields.push({
        col,
        value: formatted,
        priority: getFieldPriority(col),
      });
    }
  });

  // Create horizontal bullet-separated lines (like NocoDB)
  const bulletSeparator = ' \u2022 ';
  const bulletPrefix = '\u2022 ';
  lines.push(
    ...toBulletLines(
      visibleFields.map(({ value, priority }) => ({ value, priority })),
      { fieldsPerLine: 3, separator: bulletSeparator, prefix: bulletPrefix }
    )
  );

  return lines;
}



