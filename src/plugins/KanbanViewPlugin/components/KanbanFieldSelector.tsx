import React from 'react';
import { getFieldTypeIconWithMargin } from '../../../types/fieldTypes';
import { FieldConfigPopover } from '../../shared/FieldConfigPopover';
import type { BaseColumn } from '../../../types/column.types';

interface KanbanFieldConfigurationProps {
  columns: BaseColumn[];
  groupByField?: BaseColumn;
  onGroupByFieldChange?: (field: BaseColumn | undefined) => void;
  className?: string;
}

export const KanbanFieldConfiguration: React.FC<KanbanFieldConfigurationProps> = ({
  columns,
  groupByField,
  onGroupByFieldChange,
  className = ''
}) => {
  // Filter select/singleSelect columns for grouping
  const selectColumns = (columns || []).filter(col => 
    col.type === 'select' || col.type === 'singleSelect' ||
    col.uidt === 'select' || col.uidt === 'singleSelect'
  );

  // Hide button if handler is not provided (read-only)
  if (!onGroupByFieldChange) {
    return null;
  }

  return (
    <FieldConfigPopover
      buttonLabel="Kanban Fields"
      title="Configure Kanban Fields"
      dropdownLabel="Stacked By"
      options={selectColumns
        .filter(col => col.id != null)
        .map(col => ({
          label: col.title || col.column_name || '',
          value: String(col.id!),
          icon: getFieldTypeIconWithMargin(col.uidt || 'text')
        }))}
      value={groupByField?.id ? String(groupByField.id) : undefined}
      onChange={(val) => {
        const field = selectColumns.find(col => String(col.id) === String(val));
        onGroupByFieldChange(field);
      }}
      placeholder="Select field to group by"
      required={true}
      helpText="The select or single select field that determines how cards are grouped into columns"
      validate={(val) => {
        if (!val) {
          return 'Stacked By field is required';
        }
        return undefined;
      }}
      className={className}
    />
  );
};

