// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useRef, useState, useMemo } from 'react';
import { Group, Check, Plus, ChevronDown as ChevronDownIcon, ChevronUp, Trash2 } from 'lucide-react';
import { useSmartPopover } from '../../../hooks/useSmartPopover';
import { ColumnConfig } from '../../../plugins/GridViewPlugin/types/grid.types';
import { fieldsToExcludeInFilter } from '../../../types/constants';
import { FieldSelectDropdown, FieldSelectOption } from './FieldSelectDropdown';

const GROUPABLE_TYPES = new Set<string>([
  'text',
  'number',
  'decimal',
  'year',
  'time',
  'datetime',
  'currency',
  'percent',
  'duration',
  'date',
  'boolean',
  'email',
  'phonenumber',
  'select',
  'multiselect',
  'longtext',
  'url',
  'rating',
  'user',
  'createdtime',
  'lastmodifiedtime',
  'createdby',
  'lastmodifiedby',
]);

const EXCLUDED_GROUP_TYPES = new Set(fieldsToExcludeInFilter.map(type => String(type).toLowerCase()));


export type GroupByItem = {
  id: string;
  column: string;
  direction: 'asc' | 'desc';
};

export const GroupPopover: React.FC<{
  columns: ColumnConfig[];
  groupBy: GroupByItem[];
  setGroupBy: React.Dispatch<React.SetStateAction<GroupByItem[]>>;
}> = ({ columns: popoverColumns, groupBy, setGroupBy }) => {
  const [open, setOpen] = useState(false);
  const [fieldDropdownOpen, setFieldDropdownOpen] = useState<string | null>(null);
  const [sortDropdownOpen, setSortDropdownOpen] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Track pending groups (empty groups that haven't been saved yet)
  const [pendingGroups, setPendingGroups] = useState<GroupByItem[]>([]);

  const { position } = useSmartPopover({
    open,
    triggerRef: triggerRef as unknown as React.RefObject<HTMLElement>,
    panelRef: panelRef as React.RefObject<HTMLElement>,
    margin: 8,
    preferred: { horizontal: 'right', vertical: 'bottom' },
    onOutsideClick: () => {
      setOpen(false);
      setFieldDropdownOpen(null);
      setSortDropdownOpen(null);
      // Clean up any pending empty groups when closing
      setPendingGroups([]);
    }
  });

  // Merge saved groups with pending groups for display
  const displayGroups = useMemo(() => {
    return [...groupBy, ...pendingGroups];
  }, [groupBy, pendingGroups]);

  // Count only valid groups (with a column selected) for badge display
  const validGroupsCount = useMemo(() => {
    return displayGroups.filter(group => group.column?.trim()).length;
  }, [displayGroups]);

  const groupableColumns = popoverColumns.filter(col => {
    const key = String(col.key || '').toLowerCase();
    const columnName = String(col.column_name || '').toLowerCase();
    const columnType = String(col.uidt || col.type || '').toLowerCase();

    if (key === 'id' || columnName === 'id') {
      return false;
    }

    if (EXCLUDED_GROUP_TYPES.has(columnType)) {
      return false;
    }

    return GROUPABLE_TYPES.has(columnType);
  });
  const getColumnKey = (col: ColumnConfig) => String(col.key || col.column_name || '').trim();
  const availableColumns = groupableColumns;

  const usedColumnCounts = useMemo(() => {
    const counts = new Map<string, number>();
    displayGroups.forEach((group) => {
      const key = (group.column || '').trim();
      if (!key) {
        return;
      }
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [displayGroups]);

  const hasUnusedColumns = useMemo(() => {
    return availableColumns.some((col) => {
      const key = getColumnKey(col);
      if (!key) {
        return false;
      }
      return (usedColumnCounts.get(key) ?? 0) === 0;
    });
  }, [availableColumns, usedColumnCounts]);

  const addGrouping = () => {
    if (displayGroups.length >= 3) return; // Maximum 3 groupings (including pending)
    if (!hasUnusedColumns) return;

    const newGroupId = `group_${Date.now()}`;
    const newGroup: GroupByItem = {
      id: newGroupId,
      column: '', // Empty - user will select
      direction: 'asc'
    };
    // Add to pending groups (local state only, no setGroupBy call)
    // This prevents saving empty group to backend
    setPendingGroups(prev => [...prev, newGroup]);
    // Automatically open field dropdown for the new group
    setFieldDropdownOpen(newGroupId);
    setSortDropdownOpen(null);
  };

  const removeGrouping = (id: string) => {
    // Check if it's a pending group
    const isPendingGroup = pendingGroups.some(g => g.id === id);

    if (isPendingGroup) {
      // Remove from pending groups (no save needed)
      setPendingGroups(prev => prev.filter(g => g.id !== id));
    } else {
      // Remove from saved groups
      setGroupBy(prev => prev.filter(g => g.id !== id));
    }
  };

  const updateGroupingField = (id: string, columnKey: string) => {
    // Check if it's a pending group
    const isPendingGroup = pendingGroups.some(g => g.id === id);

    if (isPendingGroup) {
      // This is a pending group - move it to saved groups
      const pendingGroup = pendingGroups.find(g => g.id === id);
      if (pendingGroup) {
        const newGroup: GroupByItem = {
          ...pendingGroup,
          column: columnKey
        };
        // Remove from pending, add to saved
        setPendingGroups(prev => prev.filter(g => g.id !== id));
        setGroupBy(prev => [...prev, newGroup]);
      }
    } else {
      // This is an existing saved group - update it
      setGroupBy(prev => prev.map(g => g.id === id ? { ...g, column: columnKey } : g));
    }
    setFieldDropdownOpen(null);
  };

  // Close dropdowns when clicking outside or pressing Escape
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsidePanel = panelRef.current?.contains(target);
      const isInsideTrigger = triggerRef.current?.contains(target);

      if (!isInsidePanel && !isInsideTrigger) {
        setFieldDropdownOpen(null);
        setSortDropdownOpen(null);
        setOpen(false); // Also close the main popover
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFieldDropdownOpen(null);
        setSortDropdownOpen(null);
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
  const handleFieldDropdownToggle = (groupId: string) => {
    if (fieldDropdownOpen === groupId) {
      setFieldDropdownOpen(null);
    } else {
      setFieldDropdownOpen(groupId);
      setSortDropdownOpen(null); // Close sort dropdown
    }
  };

  const handleSortDropdownToggle = (groupId: string) => {
    if (sortDropdownOpen === groupId) {
      setSortDropdownOpen(null);
    } else {
      setSortDropdownOpen(groupId);
      setFieldDropdownOpen(null); // Close field dropdown
    }
  };

  const updateGroupingDirection = (id: string, direction: 'asc' | 'desc') => {
    // Check if it's a pending group
    const isPendingGroup = pendingGroups.some(g => g.id === id);

    if (isPendingGroup) {
      // Update pending group direction (won't save until field is selected)
      setPendingGroups(prev => prev.map(g => g.id === id ? { ...g, direction } : g));
    } else {
      // Update saved group direction
      setGroupBy(prev => prev.map(g => g.id === id ? { ...g, direction } : g));
    }
    setSortDropdownOpen(null);
  };


  const getSortOptions = (column: ColumnConfig) => {
    const numericTypes = ['number', 'decimal', 'currency', 'percent', 'duration', 'year'];
    const dateTypes = ['date', 'datetime', 'time'];
    const isNumeric = numericTypes.includes(column.type);
    const isDate = dateTypes.includes(column.type);

    if (isNumeric || isDate) {
      return [
        { value: 'asc', label: '1 → 9' },
        { value: 'desc', label: '9 → 1' }
      ];
    } else {
      return [
        { value: 'asc', label: 'A → Z' },
        { value: 'desc', label: 'Z → A' }
      ];
    }
  };

  const getCurrentSortLabel = (group: GroupByItem) => {
    const column = popoverColumns.find(col => col.key === group.column);
    if (!column) return 'A → Z';

    const options = getSortOptions(column);
    const currentOption = options.find(opt => opt.value === group.direction);
    return currentOption?.label || 'A → Z';
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium border shadow-xs rounded-xl focus:outline-none ${validGroupsCount > 0 ? 'bg-purple-50 text-purple-700 border-purple-300' : 'bg-card text-muted-foreground border-border'}`}
        onClick={() => setOpen(v => !v)}
        type="button"
      >
        <Group className="w-4 h-4" />
        Group
        {validGroupsCount > 0 && (
          <span className="ml-1 w-8 rounded-xl bg-purple-500 text-white text-xs font-bold">{validGroupsCount}</span>
        )}
      </button>

      {open && position && (
        <div
          ref={panelRef}
          className="fixed w-[330px] bg-card border rounded-xl shadow-lg z-50 p-4"
          style={{ top: position.top, left: position.left }}
        >
          {/* Grouping Rules */}
          <div className="space-y-3">
            {displayGroups.length === 0 && <div className="text-gray-400 text-sm mb-2">No group options</div>}
            {displayGroups.map((group) => {
              const column = popoverColumns.find(col => col.key === group.column);
              const sortOptions = column ? getSortOptions(column) : [];
              const currentColumnKey = (group.column || '').trim();
              const columnOptions = availableColumns.filter((col) => {
                const key = getColumnKey(col);
                if (!key) {
                  return false;
                }
                if (currentColumnKey === key) {
                  return true;
                }
                return (usedColumnCounts.get(key) ?? 0) === 0;
              });
              const dropdownOptions: FieldSelectOption[] = columnOptions.map(col => ({
                key: getColumnKey(col),
                title: col.title,
                uidt: col.uidt,
                type: col.type,
              }));

              return (
                <div key={group.id} className="flex items-center gap-3">
                  {/* Field Selector */}
                  <div className="relative flex-1">
                    <FieldSelectDropdown
                      options={dropdownOptions}
                      selectedKey={currentColumnKey}
                      isOpen={fieldDropdownOpen === group.id}
                      onToggle={() => handleFieldDropdownToggle(group.id)}
                      onSelect={(key) => updateGroupingField(group.id, key)}
                      placeholder="Select field"
                      menuTestId={`group-field-options-${group.id}`}
                      buttonClassName="w-full px-3 py-2 text-left bg-background border rounded-xl shadow-xs cursor-pointer transition-all duration-200 ease-in-out focus:outline-none focus:border-[--color-brand-600] flex items-center justify-between"
                      menuClassName="absolute z-50 top-full mt-1 p-2 space-y-1 w-full bg-background border text-primary rounded-xl shadow-lg max-h-64 overflow-y-auto"
                      optionClassName={(_, isSelected) =>
                        `w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl transition-colors ${isSelected
                          ? 'bg-[var(--color-bg-brand-primary)] text-black'
                          : 'hover:bg-[var(--color-bg-brand-primary)] hover:text-black'
                        }`
                      }
                    />
                  </div>

                  {/* Sort Direction Selector - only show if field is selected */}
                  {group.column && (
                    <div className="relative w-32 text-primary bg-background">
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left bg-background border rounded-xl shadow-xs
                       cursor-pointer transition-all duration-200 ease-in-out
                       focus:outline-none focus:border-[--color-brand-600]
                       flex items-center justify-between"
                        aria-haspopup="listbox"
                        onClick={() => handleSortDropdownToggle(group.id)}
                      >
                        <span className="flex-1 text-left">{getCurrentSortLabel(group)}</span>
                        {sortDropdownOpen === group.id ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </button>

                      {sortDropdownOpen === group.id && (
                        <div className="absolute z-50 top-full mt-1 p-2 space-y-1 left-0 w-full text-primary bg-background border rounded-xl shadow-lg max-h-32 overflow-y-auto">
                          {sortOptions.map((option) => (
                            <button
                              key={option.value}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${group.direction === option.value
                                ? 'bg-[var(--color-bg-brand-primary)] text-black'
                                : 'hover:bg-[var(--color-bg-brand-primary)] hover:text-black'
                                }`}
                              onClick={() => updateGroupingDirection(group.id, option.value as any)}
                            >
                              <span className="flex-1">{option.label}</span>
                              {group.direction === option.value && <Check className="w-4 h-4 text-black" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delete Button */}
                  <button
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    onClick={() => removeGrouping(group.id)}
                    title="Remove grouping"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}

            {/* Add New Group Option Button */}
            {displayGroups.length < 3 && (
              <button
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-sm font-medium mt-2 ${hasUnusedColumns
                  ? 'text-primary hover:bg-[var(--color-bg-brand-primary)] hover:text-black'
                  : 'text-gray-400 cursor-not-allowed opacity-60'
                  }`}
                onClick={addGrouping}
                disabled={!hasUnusedColumns}
                data-testid="group-add-button"
              >
                <Plus className="w-5 h-5" />
                Add Group Option
              </button>
            )}

            {/* Max groupings reached message */}
            {displayGroups.length >= 3 && (
              <div className="text-xs text-gray-500 text-center py-2">
                Maximum 3 groupings allowed
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
