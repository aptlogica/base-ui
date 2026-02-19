import React from 'react';
import { getFieldTypeIconWithMargin } from '../../../types/fieldTypes';
import { FieldConfigPopover } from '../../shared/FieldConfigPopover';
import type { GridColumn } from '../../GridViewPlugin/types/grid.types';

interface CalendarFieldConfigurationProps {
  columns: GridColumn[];
  dateField?: GridColumn;
  onDateFieldChange?: (field: GridColumn | undefined) => void;
  className?: string;
}

export const CalendarFieldConfiguration: React.FC<CalendarFieldConfigurationProps> = ({
  columns,
  dateField,
  onDateFieldChange,
  className = ''
}) => {
  // Filter date/datetime columns
  const dateColumns = columns?.filter(col => {
    const type = col.type?.toLowerCase() || col.uidt?.toLowerCase() || '';
    return ['datetime', 'date', 'createdtime', 'lastmodifiedtime'].includes(type);
  });

  // Hide button if handler is not provided (read-only)
  if (!onDateFieldChange) {
    return null;
  }

  return (
    <FieldConfigPopover
      buttonLabel="Calendar Fields"
      title="Configure Calendar Fields"
      dropdownLabel="Date Field"
      options={dateColumns
        .filter(col => col.id != null)
        .map(col => ({
          label: col.title || col.key || '',
          value: String(col.id!),
          icon: getFieldTypeIconWithMargin(col.uidt || col.type || 'text')
        }))}
      value={dateField?.id ? String(dateField.id) : undefined}
      onChange={(val) => {
        const field = dateColumns.find(col => String(col.id) === String(val));
        onDateFieldChange(field);
      }}
      placeholder="Select date field"
      required={true}
      helpText="The date or datetime field that determines when events appear on the calendar"
      validate={(val) => {
        if (!val) {
          return 'Date Field is required';
        }
        return undefined;
      }}
      className={className}
    />
  );
};

