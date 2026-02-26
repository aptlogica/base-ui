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

const isMeaningfulValue = (value: string) => {
  const trimmed = value.trim();
  return trimmed !== '' && trimmed !== '-' && trimmed !== 'N/A';
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

const getTitleDateLabel = (
  event: any,
  dateField: Column | undefined,
  formatTime: (t: string) => string
): string | null => {
  const dateFieldKey = dateField ? getColumnKey(dateField) : '';
  const rawDateValue = dateFieldKey ? (event?.data?.[dateFieldKey] ?? event?.[dateFieldKey]) : undefined;
  const formattedTitleDate = dateField && rawDateValue
    ? formatValue(dateField, rawDateValue, formatTime)
    : null;

  if (formattedTitleDate && isMeaningfulValue(formattedTitleDate)) {
    return formattedTitleDate;
  }

  if (!(event?.dateTime instanceof Date) || Number.isNaN(event.dateTime.getTime())) {
    return null;
  }

  const d = event.dateTime;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const ymd = `${yyyy}-${mm}-${dd}`; // Local date components avoid UTC shift from toISOString()
  return event.isDateField
    ? ymd
    : `${ymd} ${formatTime(
      `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    )}`;
};

const getVisibleFields = (args: {
  columns: Column[];
  event: any;
  options: BuildEventTooltipOptions;
}) => {
  const { columns, event, options } = args;
  const visibleFields: Array<{ col: Column; value: string; priority: number }> = [];

  (columns || []).forEach(col => {
    const key = getColumnKey(col);
    if (!key) return;
    if (isHiddenField(col, options)) return;
    if (isSystemOrTitleField(key, col)) return;
    if (isCategoryLikeField(key)) return;

    const raw = event?.data?.[key] ?? event?.[key];
    const formatted = formatValue(col, raw, options.formatTime);

    if (formatted && isMeaningfulValue(formatted)) {
      visibleFields.push({
        col,
        value: formatted,
        priority: getFieldPriority(col),
      });
    }
  });

  return visibleFields;
};

export function buildEventTooltipLines(args: {
  event: any;
  columns: Column[];
  options: BuildEventTooltipOptions;
  dateField?: Column;
}): string[] {
  const { event, columns, options, dateField } = args;
  if (!event) return [];

  const lines: string[] = [];

  // First line: Event title with date/time separated by bullets (horizontal)
  if (isTruthyValue(event.title)) {
    const titleLine = [String(event.title)];

    // Add date/time info (always show date for context)
    const titleDateLabel = getTitleDateLabel(event, dateField, options.formatTime);
    if (titleDateLabel) titleLine.push(titleDateLabel);

    lines.push(titleLine.join(' • '));
  }

  // Collect all visible, non-empty fields
  // We use "priority" only for ordering (essential types first), not for exclusion
  const visibleFields = getVisibleFields({ columns, event, options });

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



