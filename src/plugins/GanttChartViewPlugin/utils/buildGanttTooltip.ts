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
      
      // Get value from rawData (use rawData[key] only – same mapping as filtering)
      const raw = task.rawData[key];
      const formatted = formatValue(col, raw, options.formatTime);
      
      if (formatted) {
        const colType = String(col?.type || col?.uidt || '').toLowerCase();
        let priority = 20; // Default medium/low priority
        
        // Essential types get higher priority (lower number = earlier)
        if (colType === 'currency' || col?.uidt === 'Currency') priority = 1;
        else if (colType === 'percent' || col?.uidt === 'Percent') priority = 2;
        else if (colType === 'email' || col?.uidt === 'Email') priority = 3;
        else if (colType === 'phone' || col?.uidt === 'PhoneNumber') priority = 4;
        else if (colType === 'url' || col?.uidt === 'URL') priority = 5;
        else if (colType === 'number' || col?.uidt === 'Number') priority = 6;
        else if (colType === 'decimal' || col?.uidt === 'Decimal') priority = 7;
        else if (colType === 'rating' || col?.uidt === 'Rating') priority = 8;
        else if (colType === 'boolean' || col?.uidt === 'Checkbox') priority = 9;
        // Other types (dates, short text, etc.) keep default priority

        visibleFields.push({
          value: formatted,
          priority,
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


