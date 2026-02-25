import { formatTooltipValue } from '../../shared/tooltipValueUtils';
import { toBulletLines } from '../../shared/tooltipLineUtils';

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

const getColumnKey = (col: Column) => String(col?.column_name || col?.name || col?.key || col?.title || '');

const isSystemOrReservedField = (key: string, col: Column) => {
  const loweredKey = key.toLowerCase();
  return loweredKey === 'title' || loweredKey === 'id' || !!col?.system;
};

const isExcludedField = (col: Column, options: BuildGanttTooltipOptions) =>
  options.fieldsToExclude?.includes(col?.uidt || '') ?? false;

const isHiddenField = (col: Column, options: BuildGanttTooltipOptions) => {
  if (!options.fieldConfig) return false;
  const fieldConfig = options.fieldConfig.find(fc => String(fc.id) === String(col.id));
  return !!fieldConfig?.isHidden;
};

const getFieldPriority = (col: Column) => {
  const colType = String(col?.type || col?.uidt || '').toLowerCase();
  if (colType === 'currency' || col?.uidt === 'Currency') return 1;
  if (colType === 'percent' || col?.uidt === 'Percent') return 2;
  if (colType === 'email' || col?.uidt === 'Email') return 3;
  if (colType === 'phone' || col?.uidt === 'PhoneNumber') return 4;
  if (colType === 'url' || col?.uidt === 'URL') return 5;
  if (colType === 'number' || col?.uidt === 'Number') return 6;
  if (colType === 'decimal' || col?.uidt === 'Decimal') return 7;
  if (colType === 'rating' || col?.uidt === 'Rating') return 8;
  if (colType === 'boolean' || col?.uidt === 'Checkbox') return 9;
  return 20;
};

const isMeaningfulValue = (value: string) => {
  const trimmed = value.trim();
  return trimmed !== '' && trimmed !== '-' && trimmed !== 'N/A';
};

function formatValue(col: Column, raw: any, formatTime: (t: string) => string): string | null {
  return formatTooltipValue(col, raw, {
    formatTime,
    matchUidt: true,
    useMetaCurrency: true,
    booleanAsYesNo: true,
  });
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
  
  if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
    const dateRange = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    titleLine.push(dateRange, `${duration} days`);
  }
  
  lines.push(titleLine.join(' • '));

  // Collect all visible, non-empty fields from rawData
  // We use "priority" only for ordering (essential types first), not for exclusion
  const visibleFields: Array<{ value: string; priority: number }> = [];
  
  if (task.rawData && typeof task.rawData === 'object') {
    (columns || []).forEach(col => {
      const key = getColumnKey(col);
      if (!key) return;
      
      // Skip if field is in exclude list
      if (isExcludedField(col, options)) return;
      
      // Check if field is visible via fieldConfig
      if (isHiddenField(col, options)) return;
      
      // Skip title, id, and system fields
      if (isSystemOrReservedField(key, col)) return;
      
      // Get value from rawData (use rawData[key] only – same mapping as filtering)
      const raw = task.rawData[key];
      const formatted = formatValue(col, raw, options.formatTime);
      
      if (formatted && isMeaningfulValue(formatted)) {
        visibleFields.push({
          value: formatted,
          priority: getFieldPriority(col),
        });
      }
    });
  }

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


