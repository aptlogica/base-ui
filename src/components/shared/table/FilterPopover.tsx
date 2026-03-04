/* eslint-disable sonarjs/cognitive-complexity */
import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Filter, Trash2, Plus, Check, ChevronDown, X } from 'lucide-react';
import { useSmartPopover } from '../../../hooks/useSmartPopover';
import { ColumnConfig } from '../../../plugins/GridViewPlugin/types/grid.types';
import {
  FIELD_TYPE_OPERATORS,
  FilterCondition,
  isFilterComplete,
  getDefaultOperator,
  formatDurationValue,
  normalizeFilterValue,
  getVisibleColumns,
  parseMultiSelectValue,
  operatorRequiresValue
} from '../../../utils/filterUtils';
import { DateField } from '../../common/Fields/DateField';
import { Duration, MultiSelect, Rating, SingleSelect, Time } from '../../common/Fields';
import { fieldsToExcludeInFilter } from '../../../types/constants';
import { FieldSelectDropdown, FieldSelectOption } from './FieldSelectDropdown';

const OPERATORS = [
  { value: 'is equal', label: 'is equal' },
  { value: 'is not equal', label: 'is not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'does not contain', label: 'does not contain' },
  { value: 'is empty', label: 'is empty' },
  { value: 'is not empty', label: 'is not empty' },
];

interface FilterPopoverProps {
  readonly columns: ColumnConfig[];
  readonly filters: FilterCondition[];
  readonly onAddFilter: (filter: FilterCondition) => void;
  readonly onRemoveFilter: (index: number) => void;
  readonly onUpdateFilter: (index: number, updates: Partial<FilterCondition>) => void;
}

export function FilterPopover({ columns, filters, onAddFilter, onRemoveFilter, onUpdateFilter }: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [newFilter, setNewFilter] = useState<FilterCondition>({
    column: '',
    operator: 'is equal',
    value: '',
    logic: 'AND'
  });
  // Track dropdown states per filter index (use -1 for new filter)
  const [fieldDropdownOpen, setFieldDropdownOpen] = useState<number | null>(null);
  const [operatorDropdownOpen, setOperatorDropdownOpen] = useState<number | null>(null);
  const [logicDropdownOpen, setLogicDropdownOpen] = useState<number | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [showNewFilterRow, setShowNewFilterRow] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Track local input values for existing filters to avoid real-time updates
  const [localFilterValues, setLocalFilterValues] = useState<Record<number, string>>({});

  // Function to close popover and clear form values
  const handleClosePopover = () => {
    setOpen(false);
    setFieldDropdownOpen(null);
    setOperatorDropdownOpen(null);
    setLogicDropdownOpen(null);
    setHasUserInteracted(false);
    setShowNewFilterRow(false);
    // Clear form values
    setNewFilter({ column: '', operator: 'is equal', value: '', logic: 'AND' });
    setInputValue('');
  };

  const { position } = useSmartPopover({
    open,
    triggerRef: triggerRef as unknown as React.RefObject<HTMLElement>,
    panelRef: panelRef as unknown as React.RefObject<HTMLElement>,
    margin: 8,
    preferred: { horizontal: 'right', vertical: 'bottom' },
    onOutsideClick: handleClosePopover
  });

  // Clear inputValue when column changes
  useEffect(() => {
    if (newFilter.column) {
      setInputValue('');
    }
  }, [newFilter.column]);

  // Show new filter row when popover opens and there are no filters
  useEffect(() => {
    if (open) {
      if (filters.length === 0) {
        setShowNewFilterRow(true);
      } else {
        // Only reset if user hasn't explicitly shown it
        // This prevents hiding it when user clicks "Add filter"
      }
      if (!hasUserInteracted) {
        setShowNewFilterRow(false);
      }
    }
  }, [open]);

  const handleAdd = () => {
    if (isFilterComplete(newFilter, inputValue)) {
      const filterToAdd = {
        ...newFilter,
        value: normalizeFilterValue(newFilter, inputValue)
      };
      onAddFilter(filterToAdd);
      setNewFilter({ column: '', operator: 'is equal', value: '', logic: 'AND' });
      setInputValue('');
      setHasUserInteracted(false);
      setShowNewFilterRow(false);
      setFieldDropdownOpen(null);
      setOperatorDropdownOpen(null);
      setLogicDropdownOpen(null);
    }
  };

  // Get visible columns using utility function
  const visibleColumns = getVisibleColumns(columns, fieldsToExcludeInFilter);
  const getColumnKey = (col: ColumnConfig) => String(col.column_name || col.key || '').trim();

  const usedColumnsByFilters = useMemo(() => {
    const counts = new Map<string, number>();
    filters.forEach((filter) => {
      const key = (filter.column || '').trim();
      if (!key) {
        return;
      }
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [filters]);

  const usedColumnCounts = useMemo(() => {
    const counts = new Map<string, number>(usedColumnsByFilters);
    const newKey = (newFilter.column || '').trim();
    if (showNewFilterRow && newKey) {
      counts.set(newKey, (counts.get(newKey) ?? 0) + 1);
    }
    return counts;
  }, [usedColumnsByFilters, newFilter.column, showNewFilterRow]);

  const newFilterSelectedColumn = useMemo(
    () => visibleColumns.find(col => col.column_name === newFilter.column),
    [visibleColumns, newFilter.column]
  );

  const newFilterOperatorOptions = useMemo(
    () =>
      newFilterSelectedColumn
        ? (FIELD_TYPE_OPERATORS[newFilterSelectedColumn.uidt || 'text'] || FIELD_TYPE_OPERATORS.default)
        : OPERATORS,
    [newFilterSelectedColumn]
  );

  const isNewFilterComplete = isFilterComplete(newFilter, inputValue);

  const canAddFilter = useMemo(() => {
    return visibleColumns.some((col) => {
      const key = getColumnKey(col);
      if (!key) {
        return false;
      }
      return (usedColumnsByFilters.get(key) ?? 0) === 0;
    });
  }, [visibleColumns, usedColumnsByFilters]);

  const getColumnOptions = (currentFieldKey: string) => {
    return visibleColumns.filter((col) => {
      const key = getColumnKey(col);
      if (!key) {
        return false;
      }
      if (currentFieldKey === key) {
        return true;
      }
      return (usedColumnCounts.get(key) ?? 0) === 0;
    });
  };

  const buildDropdownOptions = (currentFieldKey: string): FieldSelectOption[] => {
    return getColumnOptions(currentFieldKey).map((col) => ({
      key: getColumnKey(col),
      title: col.title,
      uidt: col.uidt,
      type: col.type,
    }));
  };

  const renderLogicDropdown = (
    rowKey: number,
    isFirstRow: boolean,
    currentLogic: string | undefined,
    onLogicChange: (logic: 'AND' | 'OR') => void,
    onLogicToggle: () => void
  ) => {
    if (isFirstRow) {
      return (
        <button
          type="button"
          className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 border rounded-xl hover:bg-gray-200"
        >
          Where
        </button>
      );
    }
    return (
      <>
        <button
          type="button"
          className="px-3 py-1.5 text-sm text-primary bg-background border rounded-xl hover:bg-gray-50 flex items-center gap-1"
          onClick={onLogicToggle}
        >
          {currentLogic}
          <ChevronDown className="h-3 w-3" />
        </button>
        {logicDropdownOpen === rowKey && (
          <div //NOSONAR
            className="absolute z-50 mt-1 p-1 left-0 w-20 bg-background border rounded-xl shadow-lg"
            onMouseLeave={() => setLogicDropdownOpen(null)}
          >
            {['AND', 'OR'].map((logic) => (
              <button
                key={logic}
                className={`w-full text-left px-3 py-1.5 text-sm rounded hover:bg-[var(--color-bg-brand-primary)] hover:text-black ${currentLogic === logic ? 'bg-[var(--color-bg-brand-primary)] text-black' : ''
                  }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onLogicChange(logic as 'AND' | 'OR');
                  setLogicDropdownOpen(null);
                }}
              >
                {logic}
              </button>
            ))}
          </div>
        )}
      </>
    );
  };

  const renderFieldDropdown = (
    rowKey: number,
    currentFieldKey: string,
    onSelectField: (key: string) => void,
    menuTestId: string,
    menuClassName: string,
    optionClassName: (option: FieldSelectOption, isSelected: boolean) => string,
    labelClassName?: (option: FieldSelectOption, isSelected: boolean) => string
  ) => {
    return (
      <FieldSelectDropdown
        options={buildDropdownOptions(currentFieldKey)}
        selectedKey={currentFieldKey}
        isOpen={fieldDropdownOpen === rowKey}
        onToggle={() => {
          setFieldDropdownOpen(fieldDropdownOpen === rowKey ? null : rowKey);
          setOperatorDropdownOpen(null);
          setLogicDropdownOpen(null);
        }}
        onSelect={onSelectField}
        placeholder="Select field"
        menuTestId={menuTestId}
        buttonClassName="w-full px-3 py-1.5 text-sm text-left bg-background border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center justify-between"
        menuClassName={menuClassName}
        optionClassName={optionClassName}
        labelClassName={labelClassName}
      />
    );
  };

  const renderOperatorDropdown = (
    rowKey: number,
    operatorOptions: Array<{ value: string; label: string }>,
    operatorValue: string,
    onOperatorSelect: (value: string) => void,
    menuClassName: string,
    optionClassName: (op: { value: string; label: string }) => string,
    labelClassName?: (op: { value: string; label: string }) => string
  ) => {
    return (
      <>
        <button
          type="button"
          className="px-3 py-1.5 text-sm text-primary bg-background border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-1"
          onClick={() => {
            setOperatorDropdownOpen(operatorDropdownOpen === rowKey ? null : rowKey);
            setFieldDropdownOpen(null);
            setLogicDropdownOpen(null);
          }}
        >
          {operatorOptions.find(op => op.value === operatorValue)?.label || 'is'}
          <ChevronDown className="h-3 w-3" />
        </button>
        {operatorDropdownOpen === rowKey && (
          <div className={menuClassName}>
            {operatorOptions.map((op) => (
              <button
                key={op.value}
                className={optionClassName(op)}
                onClick={() => {
                  onOperatorSelect(op.value);
                  setOperatorDropdownOpen(null);
                }}
                type="button"
              >
                <span className={labelClassName ? labelClassName(op) : undefined}>{op.label}</span>
                {operatorValue === op.value && <Check className="w-4 h-4 ml-auto text-black" />}
              </button>
            ))}
          </div>
        )}
      </>
    );
  };

  // Helper function to render value input/display for a filter
  const renderFilterValue = (filter: FilterCondition, filterIndex: number, isNewFilter: boolean = false) => {
    const column = visibleColumns.find(col => col.column_name === filter.column);
    if (!column) {
      // For existing filters, use local state while typing, filter.value when not editing
      let currentValue: string;
      if (isNewFilter) {
        currentValue = inputValue;
      } else {
        currentValue = localFilterValues[filterIndex] ?? filter.value;
      }
      return (
        <input
          className="flex-1 min-w-0 px-3 py-1.5 text-sm border rounded-xl bg-background text-primary placeholder-gray-400 focus:outline-none focus:border-[--color-brand-600]"
          placeholder="Enter a value"
          value={currentValue}
          onChange={e => {
            const val = e.target.value;
            if (isNewFilter) {
              setInputValue(val);
            } else {
              // Update local state only, don't trigger filter update on every keystroke
              setLocalFilterValues(prev => ({ ...prev, [filterIndex]: val }));
            }
          }}
          onBlur={e => {
            // Only update the actual filter when user finishes typing (on blur)
            if (!isNewFilter) {
              const val = e.target.value;
              onUpdateFilter(filterIndex, { value: val });
              // Clear local state after updating
              setLocalFilterValues(prev => {
                const next = { ...prev };
                delete next[filterIndex];
                return next;
              });
            }
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
      );
    }

    const hasValue = filter.value && operatorRequiresValue(filter.operator);

    // Helper to get field type (check both uidt and type)
    const fieldType = (column.uidt || column.type || '').toString().toLowerCase();
    const isSelect = fieldType === 'select' || fieldType === 'singleselect';
    const isMultiSelect = fieldType === 'multiselect';

    // Helper to get options from various possible locations
    const getOptions = () => {
      if (Array.isArray(column.config?.options)) return column.config.options;
      if (Array.isArray(column.options)) return column.options;
      if (Array.isArray(column.meta?.options)) return column.meta.options;
      if (Array.isArray(column.config?.options)) return column.config.options;
      return [];
    };
    const options = getOptions();

    if (isSelect && options.length > 0) {
      if (hasValue) {
        const option = options.find((opt: any) => {
          const optValue = typeof opt === 'string' ? opt : (opt.value || opt.title || opt.option);
          return optValue === filter.value || optValue === String(filter.value);
        });
        const displayValue = typeof option === 'string' ? option : (option?.title || option?.option || option?.value || filter.value);
        return (
          <div className="flex items-center justify-between gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm whitespace-nowrap">
            <span className="truncate max-w-[200px]">{displayValue}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isNewFilter) {
                  setNewFilter(f => ({ ...f, value: '' }));
                  setInputValue('');
                } else {
                  onUpdateFilter(filterIndex, { value: '' });
                }
              }}
              className="hover:bg-blue-200 rounded-full p-0.5 flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      }
      return (
        <div //NOSONAR
          className="flex-1 min-w-0 w-full" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <SingleSelect
            value={filter.value}
            onChange={(val) => {
              if (isNewFilter) {
                setNewFilter(f => ({ ...f, value: val }));
                setInputValue(val);
                setHasUserInteracted(true);
              } else {
                onUpdateFilter(filterIndex, { value: val });
              }
            }}
            options={options}
            allowEdit={true}
            isBorder={true}
          />
        </div>
      );
    }

    if (isMultiSelect && options.length > 0) {
      return (
        <div //NOSONAR
          className="flex-1 min-w-0 w-full" onClick={(e) => e.stopPropagation()}>
          <MultiSelect
            value={parseMultiSelectValue(filter.value)}
            onChange={(val) => {
              // val is already a string array from MultiSelect component
              const valStr = JSON.stringify(val);
              if (isNewFilter) {
                setNewFilter(f => ({ ...f, value: valStr }));
                setInputValue(valStr);
                setHasUserInteracted(true);
              } else {
                onUpdateFilter(filterIndex, { value: valStr });
              }
            }}
            options={options}
            allowEdit={true}
            isBorder={true}
          />
        </div>
      );
    }

    if (column.uidt === 'boolean') {
      // No value input needed for boolean - operator selection is enough
      // The pill display is removed as per requirements
      return null;
    }

    if (column.uidt === 'number' || column.uidt === 'decimal' || column.uidt === 'currency' || column.uidt === 'percent' || column.uidt === 'year') {
      if (hasValue) {
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm whitespace-nowrap">
            <span className="truncate max-w-[200px]">{filter.value}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isNewFilter) {
                  setNewFilter(f => ({ ...f, value: '' }));
                  setInputValue('');
                } else {
                  onUpdateFilter(filterIndex, { value: '' });
                  // Clear local state when removing value
                  setLocalFilterValues(prev => {
                    const next = { ...prev };
                    delete next[filterIndex];
                    return next;
                  });
                }
              }}
              className="hover:bg-blue-200 rounded-full p-0.5 flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      }
      // For existing filters, use local state while typing, filter.value when not editing
      let currentValue: string;
      if (isNewFilter) {
        currentValue = inputValue;
      } else {
        currentValue = localFilterValues[filterIndex] ?? filter.value;
      }
      return (
        <input
          type="number"
          className="flex-1 min-w-0 px-3 py-1.5 text-sm border rounded-xl bg-background text-primary placeholder-gray-400 focus:outline-none focus:border-[--color-brand-600]"
          placeholder="Enter a value"
          value={currentValue}
          onChange={e => {
            const val = String(e.target.value);
            if (isNewFilter) {
              setInputValue(val);
            } else {
              // Update local state only, don't trigger filter update on every keystroke
              setLocalFilterValues(prev => ({ ...prev, [filterIndex]: val }));
            }
          }}
          onBlur={e => {
            // Only update the actual filter when user finishes typing (on blur)
            if (!isNewFilter) {
              const val = String(e.target.value);
              onUpdateFilter(filterIndex, { value: val });
              // Clear local state after updating
              setLocalFilterValues(prev => {
                const next = { ...prev };
                delete next[filterIndex];
                return next;
              });
            }
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
      );
    }

    if (column.uidt === 'date' || column.uidt === 'datetime' || column.uidt === 'auditCreatedTime' || column.uidt === 'auditLastModifiedTime') {
      if (hasValue) {
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            <span>{filter.value}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isNewFilter) {
                  setNewFilter(f => ({ ...f, value: '' }));
                  setInputValue('');
                } else {
                  onUpdateFilter(filterIndex, { value: '' });
                }
              }}
              className="hover:bg-blue-200 rounded-full p-0.5 flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      }
      return (
        <div //NOSONAR
          className="flex-1 min-w-0 w-full" onClick={(e) => e.stopPropagation()}>
          <DateField
            value={filter.value}
            onChange={(v) => {
              const valStr = String(v);
              if (isNewFilter) {
                setNewFilter(f => ({ ...f, value: valStr }));
                setInputValue(valStr);
                setHasUserInteracted(true);
              } else {
                onUpdateFilter(filterIndex, { value: valStr });
              }
            }}
            format={column?.config?.dateFormat || 'YYYY-MM-DD'}
            allowEdit={true}
            isBorder={true}
            config={column?.config || {}}
          />
        </div>
      );
    }

    if (column.uidt === 'duration') {
      if (hasValue) {
        const format = column?.config?.durationFormat || 'h:mm';
        const displayValue = formatDurationValue(filter.value, format);
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm whitespace-nowrap">
            <span>{displayValue}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isNewFilter) {
                  setNewFilter(f => ({ ...f, value: '' }));
                  setInputValue('');
                } else {
                  onUpdateFilter(filterIndex, { value: '' });
                }
              }}
              className="hover:bg-blue-200 rounded-full p-0.5 flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      }
      return (
        <div //NOSONAR
          className="flex-1 min-w-0 w-full" onClick={(e) => e.stopPropagation()}>
          <Duration
            value={filter.value ? Number(filter.value) : 0}
            onChange={(v) => {
              const valStr = String(v);
              if (isNewFilter) {
                setNewFilter(f => ({ ...f, value: valStr }));
                setInputValue(valStr);
                setHasUserInteracted(true);
              } else {
                onUpdateFilter(filterIndex, { value: valStr });
              }
            }}
            config={{ durationFormat: (column?.config?.durationFormat || 'h:mm') }}
            allowEdit={true}
            isBorder={true}
          />
        </div>
      );
    }

    if (column.uidt === 'rating') {
      // Check if value exists and is not empty
      const ratingValue = filter?.value.trim() ? Number(filter.value) : undefined;
      if (hasValue && ratingValue !== undefined) {
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-xl text-sm">
            <Rating
              value={ratingValue}
              onChange={() => { }}
              disabled
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isNewFilter) {
                  setNewFilter(f => ({ ...f, value: '' }));
                  setInputValue('');
                } else {
                  onUpdateFilter(filterIndex, { value: '' });
                }
              }}
              className="hover:bg-blue-200 rounded-full p-0.5 flex-shrink-0 ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      }
      return (
        <div //NOSONAR
          className="flex-1 min-w-0 w-full" onClick={(e) => e.stopPropagation()}>
          <Rating
            value={ratingValue || 0}
            onChange={(v) => {
              const valStr = String(v);
              if (isNewFilter) {
                setNewFilter(f => ({ ...f, value: valStr }));
                setInputValue(valStr);
                setHasUserInteracted(true);
              } else {
                onUpdateFilter(filterIndex, { value: valStr });
              }
            }}
            config={column?.config || {}}
          />
        </div>
      );
    }

    if (column.uidt === 'time') {
      if (hasValue) {
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            <span>{filter.value}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isNewFilter) {
                  setNewFilter(f => ({ ...f, value: '' }));
                  setInputValue('');
                } else {
                  onUpdateFilter(filterIndex, { value: '' });
                }
              }}
              className="hover:bg-blue-200 rounded-full p-0.5 flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      }
      return (
        <div //NOSONAR
          className="flex-1 min-w-0 w-full" onClick={(e) => e.stopPropagation()}>
          <Time
            value={filter.value}
            onChange={(v) => {
              const valStr = String(v);
              if (isNewFilter) {
                setNewFilter(f => ({ ...f, value: valStr }));
                setInputValue(valStr);
                setHasUserInteracted(true);
              } else {
                onUpdateFilter(filterIndex, { value: valStr });
              }
            }}
            config={{
              timeFormat: column?.config?.timeFormat || 'HH:mm',
              hourFormat: column?.config?.hourFormat || '24',
            }}
            allowEdit={true}
            isBorder={true}
          />
        </div>
      );
    }

    // Default text input
    if (hasValue) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm whitespace-nowrap">
          <span className="truncate max-w-[200px]">{filter.value}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isNewFilter) {
                setNewFilter(f => ({ ...f, value: '' }));
                setInputValue('');
              } else {
                onUpdateFilter(filterIndex, { value: '' });
                // Clear local state when removing value
                setLocalFilterValues(prev => {
                  const next = { ...prev };
                  delete next[filterIndex];
                  return next;
                });
              }
            }}
            className="hover:bg-blue-200 rounded-full p-0.5 flex-shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      );
    }
    // For existing filters, use local state while typing, filter.value when not editing
    let currentValue: string;
    if (isNewFilter) {
      currentValue = inputValue;
    } else {
      currentValue = localFilterValues[filterIndex] ?? filter.value;
    }
    return (
      <input
        className="flex-1 min-w-0 px-3 py-1.5 text-sm border rounded-xl bg-background text-primary placeholder-gray-400 focus:outline-none focus:border-[--color-brand-600]"
        placeholder="Enter a value"
        value={currentValue}
        onChange={e => {
          const val = e.target.value;
          if (isNewFilter) {
            setInputValue(val);
          } else {
            // Update local state only, don't trigger filter update on every keystroke
            setLocalFilterValues(prev => ({ ...prev, [filterIndex]: val }));
          }
        }}
        onBlur={e => {
          // Only update the actual filter when user finishes typing (on blur)
          if (!isNewFilter) {
            const val = e.target.value;
            onUpdateFilter(filterIndex, { value: val });
            // Clear local state after updating
            setLocalFilterValues(prev => {
              const next = { ...prev };
              delete next[filterIndex];
              return next;
            });
          }
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      />
    );
  };

  return (
    <div className="relative">
      <button
        type="button"
        ref={triggerRef}
        className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium border shadow-xs rounded-xl focus:outline-none ${filters.length > 0 ? 'bg-green-50 text-green-700 border-green-300' : 'bg-card text-tertiary border-border'}`}
        onClick={() => {
          if (open) {
            handleClosePopover();
          } else {
            setOpen(true);
          }
        }}
      >
        <Filter className="w-4 h-4" />
        Filter
        {filters.length > 0 && (
          <span className="ml-1 w-8 rounded-xl bg-green-500 text-white text-xs font-bold">{filters.length}</span>
        )}
      </button>
      {open && position && createPortal(
        <div //NOSONAR
          ref={panelRef}
          className="w-auto bg-background border border-gray-200 rounded-xl shadow-lg z-50 p-4"
          style={{ position: 'fixed', top: position.top, left: position.left }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {/* Existing filters as inline editable rows */}
          {filters.map((filter, idx) => {
            const column = visibleColumns.find(col => col.column_name === filter.column);
            const filterOperatorOptions = column ? (FIELD_TYPE_OPERATORS[column.uidt || 'text'] || FIELD_TYPE_OPERATORS.default) : OPERATORS;
            const currentLogic = filter.logic || (idx === 0 ? undefined : 'AND');
            const uniqueKey = `${filter.column}-${filter.operator}-${filter.value}-${idx}`;
            const currentFieldKey = (filter.column || '').trim();

            return (
              <div key={uniqueKey} className="flex items-center gap-2 mb-3">
                {/* Logic dropdown (Where/And/Or) */}
                <div className="relative">
                  {renderLogicDropdown(
                    idx,
                    idx === 0,
                    currentLogic,
                    (logic) => onUpdateFilter(idx, { logic }),
                    () => {
                      setLogicDropdownOpen(logicDropdownOpen === idx ? null : idx);
                      setFieldDropdownOpen(null);
                      setOperatorDropdownOpen(null);
                    }
                  )}
                </div>

                {/* Field dropdown */}
                <div className="relative flex-1 min-w-[200px]">
                  {renderFieldDropdown(
                    idx,
                    currentFieldKey,
                    (key) => {
                      const selectedColumn = visibleColumns.find(c => getColumnKey(c) === key);
                      const defaultOperator = selectedColumn
                        ? getDefaultOperator(selectedColumn.uidt || selectedColumn.type || 'text')
                        : 'is equal';
                      onUpdateFilter(idx, { column: selectedColumn?.column_name || selectedColumn?.key || key, operator: defaultOperator, value: '' });
                      setFieldDropdownOpen(null);
                    },
                    `filter-field-options-${idx}`,
                    "absolute z-50 mt-1 p-2 space-y-1 left-0 w-full min-w-[200px] bg-background border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto",
                    (_, isSelected) =>
                      `w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-[var(--color-bg-brand-primary)] hover:text-black transition-colors whitespace-nowrap ${isSelected ? 'bg-[var(--color-bg-brand-primary)] text-black' : 'text-primary'}`
                  )}
                </div>

                {/* Operator dropdown */}
                <div className="relative">
                  {renderOperatorDropdown(
                    idx,
                    filterOperatorOptions,
                    filter.operator,
                    (value) => onUpdateFilter(idx, { operator: value }),
                    "absolute z-50 mt-1 p-2 space-y-1 left-0 w-max bg-background border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto",
                    (op) =>
                      `w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-[var(--color-bg-brand-primary)] hover:text-black transition-colors ${filter.operator === op.value ? 'bg-[var(--color-bg-brand-primary)] text-black' : 'text-primary'
                      }`
                  )}
                </div>

                {/* Value display/input */}
                <div className="flex-1">
                  {renderFilterValue(filter, idx, false)}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="p-1 text-gray-400 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFilter(idx);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* New filter row - only show when filters.length === 0 or showNewFilterRow is true */}
          {(filters.length === 0 || showNewFilterRow) && (
            <div className="flex items-center gap-2 mb-3">
              {/* Logic dropdown for new filter */}
              <div className="relative">
                {renderLogicDropdown(
                  -1,
                  filters.length === 0,
                  newFilter.logic || 'AND',
                  (logic) => setNewFilter(f => ({ ...f, logic })),
                  () => {
                    setLogicDropdownOpen(logicDropdownOpen === -1 ? null : -1);
                    setFieldDropdownOpen(null);
                    setOperatorDropdownOpen(null);
                  }
                )}
              </div>

              {/* Field dropdown for new filter */}
              <div className="relative flex-1 min-w-[200px]">
                {renderFieldDropdown(
                  -1,
                  (newFilter.column || '').trim(),
                  (key) => {
                    const selectedColumn = visibleColumns.find(c => getColumnKey(c) === key);
                    const defaultOperator = getDefaultOperator(selectedColumn?.uidt || selectedColumn?.type || 'text');
                    setNewFilter({ column: selectedColumn?.column_name || selectedColumn?.key || key, operator: defaultOperator, value: '', logic: 'AND' });
                    setInputValue('');
                    setFieldDropdownOpen(null);
                    setHasUserInteracted(true);
                  },
                  "filter-new-field-options",
                  "absolute z-50 mt-1 p-2 space-y-1 left-0 w-full min-w-[200px] bg-background border border-primary rounded-xl shadow-lg max-h-64 overflow-y-auto",
                  (_, isSelected) =>
                    `w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-[var(--color-bg-brand-primary)] hover:text-black transition-colors whitespace-nowrap group ${isSelected ? 'bg-[var(--color-bg-brand-primary)] text-black' : 'text-primary'}`,
                  (_, isSelected) => (isSelected ? 'text-black' : 'text-primary group-hover:text-black')
                )}
              </div>

              {/* Operator dropdown for new filter */}
              <div className="relative">
                {renderOperatorDropdown(
                  -1,
                  newFilterOperatorOptions,
                  newFilter.operator,
                  (value) => {
                    setNewFilter(f => ({ ...f, operator: value }));
                    setHasUserInteracted(true);
                  },
                  "absolute z-50 mt-1 p-2 space-y-1 left-0 w-max bg-background border border-primary rounded-xl shadow-lg max-h-72 overflow-y-auto",
                  (op) =>
                    `w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-[var(--color-bg-brand-primary)] hover:text-black transition-colors group ${newFilter.operator === op.value ? 'bg-[var(--color-bg-brand-primary)] text-black' : 'text-primary'
                    }`,
                  (op) => (newFilter.operator === op.value ? 'text-black' : 'text-primary group-hover:text-black')
                )}
              </div>

              {/* Value input for new filter */}
              <div className="flex-1">
                {renderFilterValue(newFilter, -1, true)}
              </div>

              {/* Save/Apply button */}
              {isNewFilterComplete ? (
                <button
                  type="button"
                  className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdd();
                  }}
                  title="Apply filter"
                >
                  <Check className="w-5 h-5" />
                </button>
              ) : null}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-3 border-t">
            {!showNewFilterRow && (
              <button
                type="button"
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-xl ${canAddFilter
                  ? 'text-primary hover:bg-[var(--color-bg-brand-primary)] hover:text-black'
                  : 'text-gray-400 cursor-not-allowed opacity-60'
                  }`}
                disabled={!canAddFilter}
                onClick={() => {
                  if (!canAddFilter) {
                    return;
                  }
                  setShowNewFilterRow(true);
                  setHasUserInteracted(false);
                  // Clear any existing new filter state
                  setNewFilter({ column: '', operator: 'is equal', value: '', logic: 'AND' });
                  setInputValue('');
                }}
              >
                <Plus className="w-5 h-5" />
                Add filter
              </button>
            )}
            {showNewFilterRow && (
              <button
                type="button"
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary hover:bg-[var(--color-bg-brand-primary)] hover:text-black rounded-xl"
                onClick={handleAdd}
              >
                <Plus className="w-5 h-5" />
                Add filter
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
} 
