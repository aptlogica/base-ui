import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { AdvancedDropdown } from '../../../components/common/dropdown/AdvancedDropdown';
import { getFieldTypeIconWithMargin } from '../../../types/fieldTypes';
import { useSmartPopover } from '../../../hooks/useSmartPopover';
import { createPortal } from 'react-dom';
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

  // Filter date/datetime columns
  const dateColumns = columns?.filter(col => {
    const type = col.type?.toLowerCase() || col.uidt?.toLowerCase() || '';
    return ['datetime', 'date', 'createdtime', 'lastmodifiedtime'].includes(type);
  });

  // Close on Escape
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  // Hide button if handler is not provided (read-only)
  if (!onDateFieldChange) {
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
        <span>Calendar Fields</span>
      </button>

      {isOpen && position && createPortal(
        <div
          ref={panelRef}
          className="p-4 bg-card border rounded-xl shadow-lg z-50 min-w-[320px] max-w-[400px]"
          style={{ position: 'fixed', top: position.top, left: position.left }}
        >
          <h3 className="text-sm font-semibold text-primary mb-4">Configure Calendar Fields</h3>
          
          <div className="space-y-4">
            {/* Date Field */}
            <div>
              <AdvancedDropdown
                label="Date Field"
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
                searchable={true}
                required={true}
                helpText="The date or datetime field that determines when events appear on the calendar"
                validate={(val) => {
                  if (!val) {
                    return 'Date Field is required';
                  }
                  return undefined;
                }}
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

