import React, { useRef, useState, useMemo } from 'react';
import { BarChart2, Check, ChevronDown, ChevronUp, CircleCheckBig, CircleOff, Plus, Trash2, Type } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useSmartPopover } from '../../../hooks/useSmartPopover';
import { BaseColumn } from '../../../types/column.types';
import { SortItem, filterValidSorts } from '../../../utils/sortUtils';
import { FieldSelectDropdown, FieldSelectOption } from './FieldSelectDropdown';


interface SortPopoverProps {
  columns: BaseColumn[];
  sorts: SortItem[];
  onChange: (newSorts: SortItem[]) => void;
}

export const SortPopover: React.FC<SortPopoverProps> = ({ columns, sorts, onChange }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { position } = useSmartPopover({
    open,
    triggerRef: triggerRef as unknown as React.RefObject<HTMLElement>,
    panelRef: panelRef as unknown as React.RefObject<HTMLElement>,
    margin: 8,
    preferred: { horizontal: 'right', vertical: 'bottom' },
    onOutsideClick: () => {
      setOpen(false);
      setFieldDropdownOpen(null);
      setDirDropdownOpen(null);
      // Clean up any pending empty sorts when closing
      setPendingSorts([]);
    }
  });
  const [fieldDropdownOpen, setFieldDropdownOpen] = useState<number | null>(null);
  const [dirDropdownOpen, setDirDropdownOpen] = useState<number | null>(null);
  // Track pending sorts (empty sorts that haven't been saved yet)
  const [pendingSorts, setPendingSorts] = useState<SortItem[]>([]);

  // Merge saved sorts with pending sorts for display
  const displaySorts = useMemo(() => [...sorts, ...pendingSorts], [sorts, pendingSorts]);

  // Count only valid sorts (with a column selected) for badge display
  const validSortsCount = useMemo(() => {
    return displaySorts.filter(sort => sort.column?.trim()).length;
  }, [displaySorts]);

  // Only show columns that can be sorted
  // Exclude only non-sortable field types (not hidden/system status - those can still be sorted)
  const fieldsToExcludeFromSort = new Set(['links', 'lookup', 'rollup', 'attachment', 'json']);
  const excludedAuditFields = new Set(['createdTime', 'lastModifiedTime', 'createdBy', 'lastModifiedBy']);

  const availableColumns = columns.filter(col => {
    const uidt = String(col.uidt || col.type || '').toLowerCase();
    // Exclude non-sortable field types
    if (fieldsToExcludeFromSort.has(uidt)) return false;
    // Exclude 'id' field specifically (by name, not just type)
    if (col.key?.toLowerCase() === 'id' || col.column_name?.toLowerCase() === 'id') return false;
    // Exclude audit fields that aren't sortable
    if (excludedAuditFields.has(uidt)) return false;
    // Allow all other fields (including hidden, system, datetime, etc.)
    return true;
  });

  const getColumnKey = (col: BaseColumn) => String(col.column_name || col.key || '').trim();

  const usedColumnCounts = useMemo(() => {
    const counts = new Map<string, number>();
    displaySorts.forEach(sort => {
      const key = (sort.column || '').trim();
      if (!key) return;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [displaySorts]);

  const hasUnusedColumns = useMemo(() => {
    return availableColumns.some(col => {
      const key = getColumnKey(col);
      if (!key) return false;
      return (usedColumnCounts.get(key) ?? 0) === 0;
    });
  }, [availableColumns, usedColumnCounts]);

  // Close dropdowns when clicking outside or pressing Escape
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsidePanel = panelRef.current?.contains(target);
      const isInsideTrigger = triggerRef.current?.contains(target);

      if (!isInsidePanel && !isInsideTrigger) {
        setFieldDropdownOpen(null);
        setDirDropdownOpen(null);
        setOpen(false); // Also close the main popover
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFieldDropdownOpen(null);
        setDirDropdownOpen(null);
        setOpen(false); // Also close the main popover
      }
    };

    if (open) {
      // Add a small delay to prevent immediate closing when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
      }, 0);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [open]);

  // Close other dropdowns when opening a new one
  const handleFieldDropdownToggle = (idx: number) => {
    if (fieldDropdownOpen === idx) {
      setFieldDropdownOpen(null);
    } else {
      setFieldDropdownOpen(idx);
      setDirDropdownOpen(null); // Close direction dropdown
    }
  };

  const handleDirDropdownToggle = (idx: number) => {
    if (dirDropdownOpen === idx) {
      setDirDropdownOpen(null);
    } else {
      setDirDropdownOpen(idx);
      setFieldDropdownOpen(null); // Close field dropdown
    }
  };

  const getSortLabel = (col: BaseColumn | undefined, dir: 'asc' | 'desc') => {
    // If no column selected, show generic placeholder
    if (!col) {
      return dir === 'asc' ? 'A → Z' : 'Z → A';
    }

    // Boolean fields use icons
    if (col.uidt === 'boolean') {
      return dir === 'asc'
        ? <CircleCheckBig className="w-4 h-4 icons-primary" />
        : <CircleOff className="w-4 h-4 text-secondary" />
    }

    const fieldType = String(col.uidt || col.type || '').toLowerCase();

    // Numeric fields: 1→9 / 9→1
    const numericTypes = ["number", "decimal", "currency", "percent", "year", "rating"];
    // Date/DateTime fields: 1→9 / 9→1 (chronological ordering - oldest = 1, newest = 9)
    const dateTypes = ["date", "datetime", "time"];

    if (numericTypes.includes(fieldType) || dateTypes.includes(fieldType)) {
      return dir === 'asc' ? '1 → 9' : '9 → 1';
    }

    // All other fields (text, etc.): A→Z / Z→A
    return dir === 'asc' ? 'A → Z' : 'Z → A';
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium border shadow-xs rounded-xl focus:outline-none ${validSortsCount > 0 ? 'bg-orange-50 text-orange-700 border-orange-300' : 'bg-card text-tertiary border-border'}`}
        onClick={() => setOpen(v => !v)}
        type="button"
      >
        <BarChart2 className="w-4 h-4" />
        Sort
        {validSortsCount > 0 && (
          <span className="ml-1 w-8 rounded-xl bg-orange-500 text-white text-xs font-bold">{validSortsCount}</span>
        )}
      </button>
      {open && position && createPortal(
        <div
          ref={panelRef}
          className="w-[350px] bg-card border rounded-xl shadow-lg z-50 p-0"
          style={{ position: 'fixed', top: position.top, left: position.left }}
        >
          <div className="p-3">
            {displaySorts.length === 0 && <div className="text-gray-400 text-sm mb-2">No sort options</div>}
            {displaySorts.map((sort, idx) => {
              const currentKey = (sort.column || '').trim();
              const col = columns.find(c => (c.column_name || c.key) === currentKey) || availableColumns.find(c => (c.column_name || c.key) === currentKey);
              const columnOptions = availableColumns.filter(c => {
                const key = getColumnKey(c);
                if (!key) return false;
                if (key === currentKey) return true;
                return (usedColumnCounts.get(key) ?? 0) === 0;
              });
              const dropdownOptions: FieldSelectOption[] = columnOptions.map(c => ({
                key: getColumnKey(c),
                title: c.title,
                uidt: c.uidt,
                type: c.type,
              }));
              const rowKey = currentKey || `sort-row-${idx}`;
              return (
                <div key={rowKey} className="flex items-center gap-2 mb-2">
                  {/* Field dropdown */}
                  <div className="relative flex-1">
                    <FieldSelectDropdown
                      options={dropdownOptions}
                      selectedKey={currentKey}
                      isOpen={fieldDropdownOpen === idx}
                      onToggle={() => handleFieldDropdownToggle(idx)}
                      onSelect={(key) => {
                        const isPendingSort = idx >= sorts.length;

                        if (isPendingSort) {
                          const pendingIdx = idx - sorts.length;
                          const newSort: SortItem = {
                            column: key,
                            direction: 'asc'
                          };
                          const newPendingSorts = pendingSorts.filter((_, i) => i !== pendingIdx);
                          const newSavedSorts = [...sorts, newSort];

                          setPendingSorts(newPendingSorts);
                          onChange(filterValidSorts(newSavedSorts));
                        } else {
                          const newSorts = [...sorts];
                          newSorts[idx].column = key;
                          onChange(filterValidSorts(newSorts));
                        }
                        setFieldDropdownOpen(null);
                      }}
                      placeholder="Select field"
                      menuTestId={`sort-field-options-${idx}`}
                      buttonClassName="w-full px-3 py-2 text-left bg-background border rounded-xl shadow-xs cursor-pointer transition-all duration-200 ease-in-out focus:outline-none focus:border-[--color-brand-600] flex items-center justify-between"
                      menuClassName="absolute z-50 mt-1 p-2 space-y-1 left-0 w-full bg-background border text-primary rounded-xl shadow-lg max-h-64 overflow-y-auto"
                      optionClassName={(_, isSelected) =>
                        `w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl  hover:bg-[var(--color-bg-brand-primary)] hover:text-black transition-colors ${isSelected ? 'bg-[var(--color-bg-brand-primary)] text-black' : ''}`
                      }
                    />
                  </div>

                  {/* Direction dropdown - only show if field is selected */}
                  {sort.column && (
                    <div className="relative w-28">
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left bg-background border rounded-xl shadow-xs
                        cursor-pointer transition-all duration-200 ease-in-out
                        focus:outline-none focus:border-[--color-brand-600]
                        flex items-center justify-between"
                        aria-haspopup="listbox"
                        aria-expanded={dirDropdownOpen === idx}
                        onClick={() => handleDirDropdownToggle(idx)}
                      >
                        <span className="flex-1 text-left text-primary">
                          {getSortLabel(col, sort.direction)}
                        </span>
                        {dirDropdownOpen === idx ? (
                          <ChevronUp className="h-4 w-4 ml-auto text-primary" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-auto text-primary" />
                        )}
                      </button>
                      {dirDropdownOpen === idx && (
                        <div className="absolute z-50 mt-1 p-2 space-y-1 left-0 w-32 text-primary bg-background border rounded-xl shadow-lg max-h-32 overflow-y-auto">
                          {['asc', 'desc'].map((dir) => (
                            <button
                              key={dir}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl  hover:bg-[var(--color-bg-brand-primary)] hover:text-black transition-colors ${sort.direction === dir ? 'bg-[var(--color-bg-brand-primary)] text-black' : ''}`}
                              onClick={() => {
                                const isPendingSort = idx >= sorts.length;

                                if (isPendingSort) {
                                  // Update pending sort direction (won't save until field is selected)
                                  const pendingIdx = idx - sorts.length;
                                  const newPendingSorts = [...pendingSorts];
                                  newPendingSorts[pendingIdx].direction = dir as 'asc' | 'desc';
                                  setPendingSorts(newPendingSorts);
                                } else {
                                  // Update saved sort direction
                                  const newSorts = [...sorts];
                                  newSorts[idx].direction = dir as 'asc' | 'desc';
                                  onChange(filterValidSorts(newSorts));
                                }
                                setDirDropdownOpen(null);
                              }}
                              type="button"
                            >
                              <span>{getSortLabel(col, dir as 'asc' | 'desc')}</span>
                              {sort.direction === dir && <Check className="w-4 h-4 ml-auto text-black" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    onClick={() => {
                      const isPendingSort = idx >= sorts.length;
                      if (isPendingSort) {
                        // Remove from pending sorts (no save needed)
                        const pendingIdx = idx - sorts.length;
                        setPendingSorts(prev => prev.filter((_, i) => i !== pendingIdx));
                      } else {
                        // Remove from saved sorts
                        const newSorts = sorts.filter((_, i) => i !== idx);
                        onChange(filterValidSorts(newSorts));
                      }
                    }}
                    title="Remove sort"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
            {availableColumns.length > 0 && (
              <button
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-sm font-medium mt-2 ${hasUnusedColumns ? 'text-primary hover:bg-[var(--color-bg-brand-primary)] hover:text-black' : 'text-secondary cursor-not-allowed opacity-60'}`}
                data-testid="add-sort-button"
                disabled={!hasUnusedColumns}
                onClick={() => {
                  if (!hasUnusedColumns) return;
                  const newIndex = displaySorts.length;
                  // Add new sort to pending sorts (local state only, no onChange call)
                  // This prevents saving empty sort to backend
                  setPendingSorts(prev => [...prev, { column: '', direction: 'asc' }]);
                  // Automatically open field dropdown for the new sort
                  setFieldDropdownOpen(newIndex);
                  setDirDropdownOpen(null);
                }}
                type="button"
              >
                <Plus className="w-4 h-4" /> Add Sort Option
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
