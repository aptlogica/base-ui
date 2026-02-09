import React from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, List } from 'lucide-react';
import { useSmartPopover } from '../../../hooks/useSmartPopover';
import { ColumnConfig } from '../../../plugins/GridViewPlugin/types/grid.types';
import { getFieldTypeIconComponent } from '../../../types/fieldTypes';

interface FieldsPopoverProps {
  readonly columns: ColumnConfig[];
  readonly fieldConfig: any[];
  readonly onFieldToggle: (fieldId: string) => void;
  readonly label?: string;
  readonly iconComponent?: React.ComponentType<{ className?: string }>;
  readonly onEnsureAllFieldsRegistered?: () => Promise<void>;
}

export function FieldsPopover({ columns, fieldConfig, onFieldToggle, label = 'Fields', iconComponent: IconComponent, onEnsureAllFieldsRegistered }: FieldsPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [showSystemFields, setShowSystemFields] = React.useState(false);
  const [initDone, setInitDone] = React.useState(false);
  const [initLoading, setInitLoading] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const getIsHidden = (fieldId: string) => {
    const config = fieldConfig?.find(fc => String(fc.id) === String(fieldId));
    return !!config?.isHidden;
  };

  const { position } = useSmartPopover({
    open,
    triggerRef: triggerRef as unknown as React.RefObject<HTMLElement>,
    panelRef: panelRef as unknown as React.RefObject<HTMLElement>,
    margin: 8,
    preferred: { horizontal: 'right', vertical: 'bottom' },
    onOutsideClick: () => setOpen(false)
  });

  const handleToggle = (fieldId: string) => {
    onFieldToggle(fieldId);
  };

  const isTitleField = (col: ColumnConfig) => {
    const title = (col.title || '').toLowerCase();
    const columnName = (col.column_name || '').toLowerCase();
    return title === 'title' || columnName === 'title';
  };

  // Sort columns by position from fieldConfig, then separate regular from system fields
  const sortedColumns = [...columns].sort((a, b) => {
    const aConfig = fieldConfig?.find(fc => String(fc.id) === String(a.id));
    const bConfig = fieldConfig?.find(fc => String(fc.id) === String(b.id));

    const aPosition = aConfig?.position ?? a.position ?? 0;
    const bPosition = bConfig?.position ?? b.position ?? 0;

    return aPosition - bPosition;
  });

  // Separate regular fields from system fields (using sorted order)
  const regularFields = sortedColumns.filter(col => !col.system || isTitleField(col));
  const systemFields = sortedColumns.filter(col => col.system && !isTitleField(col));

  const filteredRegularFields = regularFields?.filter(col =>
    col.title?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredSystemFields = systemFields?.filter(col =>
    col.title?.toLowerCase().includes(search.toLowerCase())
  );

  const visibleCount = columns.filter(col => col.id && !getIsHidden(col.id)).length;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium border shadow-xs rounded-xl hover:bg-sidebar-menu focus:outline-none bg-card text-muted-foreground`}
        onClick={async () => {
          // If already open, close immediately
          if (open) {
            setOpen(false);
            return;
          }
          // If initialization is needed and supported, run it before opening
          if (!initDone && onEnsureAllFieldsRegistered) {
            try {
              setInitLoading(true);
              await onEnsureAllFieldsRegistered();
              setInitDone(true);
            } catch (e) {
              // Log the error to help with debugging and monitoring
              console.error('Failed ensuring fieldConfig on open:', e);
            } finally {
              setInitLoading(false);
            }
          }
          setOpen(true);
        }}
        disabled={initLoading}
        aria-busy={initLoading}
        type="button"
      >
        {IconComponent ? <IconComponent className="w-4 h-4" /> : <List className="w-4 h-4" />}
        {label}
        <span className="ml-1 w-8 rounded-xl bg-[var(--color-success-200)] text-[var(--color-success-700)] text-xs font-bold">{visibleCount}</span>
      </button>
      {open && position && createPortal(
        <div
          ref={panelRef}
          className="w-72 bg-card border rounded-xl shadow-lg z-50 p-0"
          style={{ position: 'fixed', top: position.top, left: position.left }}
        >
          {/* Search bar */}
          <div className="p-2 border-b flex items-center gap-2">
            <input
              className="field-component field-component-focus field-component-border"
              placeholder="Search fields"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ minWidth: 0 }}
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {/* Regular Fields */}
            {filteredRegularFields.map((col) => (
              <div
                key={col.id || col.column_name || `field-${col.title}`}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded"
                style={{ userSelect: 'none' }}
              >
                <span className="w-5 h-5 flex text-primary items-center justify-center flex-shrink-0">{getFieldTypeIconComponent(col.uidt || 'text') || <span className="w-4 h-4 text-gray-400" />}</span>
                <span className="flex-1 truncate text-sm select-none text-secondary" title={col.title}>{col.title}</span>
                {/* Switch for visibility */}
                <label className="relative inline-flex items-center cursor-pointer ml-2">
                  <span className="sr-only">
                    Toggle visibility for {col.title}
                  </span>
                  <input
                    type="checkbox"
                    checked={col.id ? !getIsHidden(col.id) : false}
                    onChange={() => col.id && handleToggle(col.id)}
                    className="sr-only peer"
                    aria-label={`Toggle visibility for ${col.title}`}
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-[var(--color-focus-ring)] rounded-full peer peer-checked:bg-primary transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transform transition-transform peer-checked:translate-x-4" />
                </label>
              </div>
            ))}

            {/* System Fields Section */}
            {showSystemFields && filteredSystemFields.length > 0 && (
              <>
                <div className="border-t border-gray-100 my-2"/>
                <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">System Fields</div>
                {filteredSystemFields.map((col) => (
                  <div
                    key={col.id || col.column_name || `system-field-${col.title}`}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded"
                    style={{ userSelect: 'none' }}
                  >
                    <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">{getFieldTypeIconComponent(col.uidt || 'text') || <span className="w-4 h-4 text-gray-400" />}</span>
                    <span className="flex-1 truncate text-sm select-none text-secondary" title={col.title}>{col.title}</span>
                    {/* Switch for visibility */}
                    <label className="relative inline-flex items-center cursor-pointer ml-2">
                      <span className="sr-only">
                        Toggle visibility for {col.title}
                      </span>
                      <input
                        type="checkbox"
                        checked={col.id ? !getIsHidden(col.id) : false}
                        onChange={() => col.id && handleToggle(col.id)}
                        className="sr-only peer"
                        aria-label={`Toggle visibility for ${col.title}`}
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-[var(--color-focus-ring)] rounded-full peer peer-checked:bg-primary transition-colors" />
                      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transform transition-transform peer-checked:translate-x-4" />
                    </label>
                  </div>
                ))}
              </>
            )}
          </div>
          <div className="flex items-center justify-between border-t rounded-bl-xl rounded-br-xl px-3 py-2 bg-card">
            <button
              className="flex items-center gap-1 text-gray-600 text-xs font-medium hover:text-gray-800"
              onClick={() => setShowSystemFields(!showSystemFields)}
            >
              {showSystemFields ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              System fields
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}