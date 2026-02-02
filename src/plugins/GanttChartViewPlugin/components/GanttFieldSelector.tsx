import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { AdvancedDropdown } from '../../../components/common/dropdown/AdvancedDropdown';
import { getFieldTypeIconWithMargin } from '../../../types/fieldTypes';
import { useSmartPopover } from '../../../hooks/useSmartPopover';
import { createPortal } from 'react-dom';
import type { Column } from '../../../types/api.types';

interface GanttFieldSelectorProps {
  label: string;
  iconComponent: React.ComponentType<{ className?: string }>;
  items: Column[];
  value?: Column;
  onChange: (field: Column | undefined) => void;
  fieldType: 'date' | 'progress' | 'completion';
  className?: string;
}

export const GanttFieldSelector: React.FC<GanttFieldSelectorProps> = ({
  label,
  iconComponent: IconComponent,
  items,
  value,
  onChange,
  fieldType,
  className = ''
}) => {
  // Filter items based on field type
  const filteredItems = items.filter(item => {
    if (fieldType === 'date') {
      return item.uidt === 'date'; // Only date fields, exclude datetime and timestamp
    } else if (fieldType === 'progress') {
      return item.uidt === 'percent' ||
        (item.uidt === 'number' && (
          item.column_name?.toLowerCase().includes('progress') ||
          item.title?.toLowerCase().includes('progress') ||
          item.column_name?.toLowerCase().includes('percent') ||
          item.title?.toLowerCase().includes('percent')
        ));
    } else if (fieldType === 'completion') {
      // Only date fields (not datetime) for completion status
      // If completion date exists, task is completed
      return item.uidt === 'date' ||
        (item.column_name?.toLowerCase().includes('complete') ||
          item.title?.toLowerCase().includes('complete') ||
          item.column_name?.toLowerCase().includes('done') ||
          item.title?.toLowerCase().includes('done'));
    }
    return false;
  });

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <IconComponent className="w-4 h-4 shrink-0" />
      <span className="whitespace-nowrap text-secondary">{label}</span>
      <AdvancedDropdown
        options={filteredItems.map(item => ({
          label: item.title || item.column_name || '',
          value: item.id,
          icon: getFieldTypeIconWithMargin(item.uidt || 'text')
        }))}
        value={value?.id}
        onChange={(val) => {
          const field = filteredItems.find(item => item.id === val);
          onChange(field);
        }}
        placeholder="Select"
        searchable={true}
        clearable={true}
        className="flex-1"
      />
    </div>
  );
};

// Main Gantt Field Configuration Component
interface GanttFieldConfigurationProps {
  columns: Column[];
  startDateField?: Column;
  endDateField?: Column;
  progressField?: Column;
  completionField?: Column;
  onStartDateFieldChange?: (field: Column | undefined) => void;
  onEndDateFieldChange?: (field: Column | undefined) => void;
  onProgressFieldChange?: (field: Column | undefined) => void;
  onCompletionFieldChange?: (field: Column | undefined) => void;
  className?: string;
}

export const GanttFieldConfiguration: React.FC<GanttFieldConfigurationProps> = ({
  columns,
  startDateField,
  endDateField,
  progressField,
  completionField,
  onStartDateFieldChange,
  onEndDateFieldChange,
  onProgressFieldChange,
  onCompletionFieldChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const { position } = useSmartPopover({
    open: isOpen,
    triggerRef: triggerRef as unknown as React.RefObject<HTMLElement>,
    panelRef: panelRef as unknown as React.RefObject<HTMLElement>,
    margin: 8,
    preferred: { horizontal: 'right', vertical: 'bottom' },
    onOutsideClick: () => setIsOpen(false)
  });

  // Filter columns by type
  const dateColumns = columns?.filter(col =>
    col.uidt === 'date' // Only date fields, exclude datetime and timestamp
  );

  const progressColumns = columns.filter(col =>
    col.uidt === 'percent' ||
    (col.uidt === 'number' && (
      col.column_name?.toLowerCase().includes('progress') ||
      col.title?.toLowerCase().includes('progress') ||
      col.column_name?.toLowerCase().includes('percent') ||
      col.title?.toLowerCase().includes('percent')
    ))
  );

  const completionColumns = columns.filter(col =>
    // Only date fields (not datetime) for completion status
    // If completion date exists, task is completed
    col.uidt === 'date' ||
    (col.column_name?.toLowerCase().includes('complete') ||
      col.title?.toLowerCase().includes('complete') ||
      col.column_name?.toLowerCase().includes('done') ||
      col.title?.toLowerCase().includes('done'))
  );

  // Close on Escape
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  // Hide button if handlers are not provided (read-only)
  if (!onStartDateFieldChange || !onEndDateFieldChange || !onProgressFieldChange || !onCompletionFieldChange) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-brand-primary)] text-black hover:bg-[var(--color-bg-brand-primary)] hover:text-black font-semibold rounded-xl transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Layers className="w-4 h-4" />
        <span>Gantt Fields</span>
      </button>

      {isOpen && position && createPortal(
        <div
          ref={panelRef}
          className="p-4 bg-card border rounded-xl shadow-lg z-50 min-w-[320px] max-w-[400px]"
          style={{ position: 'fixed', top: position.top, left: position.left }}
        >
          <h3 className="text-sm font-semibold text-primary mb-4">Configure Gantt Fields</h3>

          <div className="space-y-4">
            {/* Start Date Field */}
            <div>
              <AdvancedDropdown
                label="Start Date"
                options={dateColumns.map(col => ({
                  label: col.title || col.column_name || '',
                  value: col.id,
                  icon: getFieldTypeIconWithMargin(col.uidt || 'text')
                }))}
                value={startDateField?.id}
                onChange={(val) => {
                  const field = dateColumns.find(col => col.id === val);
                  onStartDateFieldChange?.(field);
                }}
                placeholder="Select start date field"
                searchable={true}
                required={true}
                helpText="The date field that marks when the task begins"
                validate={(val) => {
                  if (!val) {
                    return 'Start Date is required';
                  }
                  if (val && endDateField?.id && val === endDateField.id) {
                    return 'Start Date and End Date cannot be the same field';
                  }
                  return undefined;
                }}
                className="w-full"
              />
            </div>

            {/* End Date Field */}
            <div>
              <AdvancedDropdown
                label="End Date"
                options={dateColumns.map(col => ({
                  label: col.title || col.column_name || '',
                  value: col.id,
                  icon: getFieldTypeIconWithMargin(col.uidt || 'text')
                }))}
                value={endDateField?.id}
                onChange={(val) => {
                  const field = dateColumns.find(col => col.id === val);
                  onEndDateFieldChange?.(field);
                }}
                placeholder="Select end date field"
                searchable={true}
                required={true}
                helpText="The date field that marks when the task should be completed"
                validate={(val) => {
                  if (!val) {
                    return 'End Date is required';
                  }
                  if (val && startDateField?.id && val === startDateField.id) {
                    return 'End Date and Start Date cannot be the same field';
                  }
                  return undefined;
                }}
                className="w-full"
              />
            </div>

            {/* Progress Field */}
            <div>
              <AdvancedDropdown
                label="Progress"
                options={progressColumns.map(col => ({
                  label: col.title || col.column_name || '',
                  value: col.id,
                  icon: getFieldTypeIconWithMargin(col.uidt || 'text')
                }))}
                value={progressField?.id}
                onChange={(val) => {
                  const field = progressColumns.find(col => col.id === val);
                  onProgressFieldChange?.(field);
                }}
                placeholder="Select progress field"
                searchable={true}
                clearable={true}
                helpText="Optional: A percentage or number field to track task completion (0-100)"
                className="w-full"
              />
            </div>

            {/* Completion Field */}
            <div>
              <AdvancedDropdown
                label="Completion"
                options={completionColumns.map(col => ({
                  label: col.title || col.column_name || '',
                  value: col.id,
                  icon: getFieldTypeIconWithMargin(col.uidt || 'text')
                }))}
                value={completionField?.id}
                onChange={(val) => {
                  const field = completionColumns.find(col => col.id === val);
                  onCompletionFieldChange?.(field);
                }}
                placeholder="Select completion field"
                searchable={true}
                clearable={true}
                helpText="Optional: A date field indicating when the task was actually completed"
                className="w-full"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
