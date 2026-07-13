// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import type { GridColumn } from '../../../types/grid.types';
import { Dropdown } from '../../shared';
import { AdvancedDropdown } from '../../../../../components/common/dropdown/AdvancedDropdown';
import type {
  GridSplitFixedDirection,
  GridSplitMode,
  GridSplitOutputMode,
  GridSplitPlacement,
  GridSplitSeparatorType,
} from '../shared/gridDataOperation.types';
import { filterGridDataOperationColumns, getGridColumnIdentity } from '../shared/gridColumnIdentity';

interface SplitColumnPanelProps {
  columns: GridColumn[];
  splitSourceColumnId: string;
  onSplitSourceColumnChange: (columnId: string) => void;
  onClearSplitSourceColumn: () => void;
  splitMode: GridSplitMode;
  onSplitModeChange: (value: GridSplitMode) => void;
  splitSeparatorType: GridSplitSeparatorType;
  onSplitSeparatorTypeChange: (value: GridSplitSeparatorType) => void;
  splitCustomSeparator: string;
  onSplitCustomSeparatorChange: (value: string) => void;
  splitMaxColumns: string;
  onSplitMaxColumnsChange: (value: string) => void;
  splitFixedDirection: GridSplitFixedDirection;
  onSplitFixedDirectionChange: (value: GridSplitFixedDirection) => void;
  splitCharacterCount: string;
  onSplitCharacterCountChange: (value: string) => void;
  splitPattern: string;
  onSplitPatternChange: (value: string) => void;
  splitOutputMode: GridSplitOutputMode;
  onSplitOutputModeChange: (value: GridSplitOutputMode) => void;
  splitPlacement: GridSplitPlacement;
  onSplitPlacementChange: (value: GridSplitPlacement) => void;
}

interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

const SEPARATOR_OPTIONS: SelectOption[] = [
  { value: 'space', label: 'Space' },
  { value: 'comma', label: 'Comma (,)' },
  { value: 'dash', label: 'Dash' },
  { value: 'custom', label: 'Custom' },
];

const FIXED_LENGTH_OPTIONS: SelectOption[] = [
  { value: 'after', label: 'After' },
  { value: 'before', label: 'Before' },
];

const PATTERN_OPTIONS: SelectOption[] = [
  { value: String.raw`\d+`, label: String.raw`\d+`, description: 'Numbers' },
  { value: '[A-Z]+', label: '[A-Z]+', description: 'Uppercase letters' },
  { value: '[a-z]+', label: '[a-z]+', description: 'Lowercase letters' },
  { value: '[A-Za-z]+', label: '[A-Za-z]+', description: 'Any letters' },
  { value: String.raw`\s+`, label: String.raw`\s+`, description: 'Whitespace' },
  { value: '[^a-zA-Z0-9]', label: '[^a-zA-Z0-9]', description: 'Special characters' },
  { value: '@(.+)', label: '@(.+)', description: 'Text after @' },
  { value: String.raw`\.`, label: String.raw`\.`, description: 'Dot character' },
];

export const SplitColumnPanel: React.FC<SplitColumnPanelProps> = ({
  columns,
  splitSourceColumnId,
  onSplitSourceColumnChange,
  onClearSplitSourceColumn,
  splitMode,
  onSplitModeChange,
  splitSeparatorType,
  onSplitSeparatorTypeChange,
  splitCustomSeparator,
  onSplitCustomSeparatorChange,
  splitMaxColumns,
  onSplitMaxColumnsChange,
  splitFixedDirection,
  onSplitFixedDirectionChange,
  splitCharacterCount,
  onSplitCharacterCountChange,
  splitPattern,
  onSplitPatternChange,
  splitOutputMode,
  onSplitOutputModeChange,
  splitPlacement,
  onSplitPlacementChange,
}) => {
  const visibleColumns = filterGridDataOperationColumns(columns);

  const renderSplitModeFields = (mode: GridSplitMode) => {
    if (splitMode !== mode) return null;

    switch (mode) {
      case 'separator':
        return (
          <div className="space-y-4 px-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Separator type</p>
              <Dropdown
                options={SEPARATOR_OPTIONS}
                value={splitSeparatorType}
                onChange={(value) => onSplitSeparatorTypeChange(value as GridSplitSeparatorType)}
              />
            </div>

            {splitSeparatorType === 'custom' && (
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium text-foreground">Custom separator</p>
                <input
                  type="text"
                  value={splitCustomSeparator}
                  onChange={(event) => onSplitCustomSeparatorChange(event.target.value)}
                  placeholder="Enter custom separator"
                  className="w-full rounded-xl border bg-alpha-white px-4 py-3 transition-colors focus:border-transparent focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-600)] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                />
                <span className="pt-1 text-xs text-secondary">Only used when "Custom" is selected.</span>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Maximum Split Columns</p>
              <input
                type="number"
                min={2}
                value={splitMaxColumns}
                onChange={(event) => onSplitMaxColumnsChange(event.target.value)}
                placeholder="10"
                className="h-11 w-full rounded-xl border bg-alpha-white px-4 transition-colors focus:border-transparent focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-600)] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
              />
              <div className="text-xs text-secondary">
                Additional values will be added in the last column.
              </div>
            </div>
          </div>
        );
      case 'fixed_length':
        return (
          <div className="space-y-4 px-6">
            <div className="flex gap-2">
              <Dropdown
                options={FIXED_LENGTH_OPTIONS}
                value={splitFixedDirection}
                onChange={(value) => onSplitFixedDirectionChange(value as GridSplitFixedDirection)}
              />
              <input
                type="number"
                value={splitCharacterCount}
                onChange={(event) => onSplitCharacterCountChange(event.target.value)}
                placeholder="Enter number of characters"
                className="h-11 w-full rounded-xl border bg-alpha-white px-4 transition-colors focus:border-transparent focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-600)] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>
        );
      case 'pattern':
        return (
          <div className="px-6">
            <AdvancedDropdown
              options={PATTERN_OPTIONS}
              value={splitPattern}
              onChange={(value) => onSplitPatternChange(value as string)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
      <section className="space-y-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Column to split</h3>
          <p className="text-sm text-secondary">Choose one source column to split.</p>
        </div>

        <div className="rounded-xl border bg-card p-3">
          <div className="mb-3 flex items-center justify-between gap-2 border-b pb-3">
            <button
              type="button"
              onClick={onClearSplitSourceColumn}
              className="rounded-lg px-2 py-1 text-xs font-medium text-secondary transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              Clear selection
            </button>
            <span className="text-xs text-secondary">
              {splitSourceColumnId ? '1 selected' : 'No column selected'}
            </span>
          </div>

          <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
            {visibleColumns.length === 0 ? (
              <div className="px-2 py-2 text-sm text-secondary">No columns available.</div>
            ) : (
              visibleColumns.map((column) => {
                const columnId = getGridColumnIdentity(column);
                const checked = splitSourceColumnId === columnId;

                return (
                  <label
                    key={columnId}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50"
                  >
                    <input
                      type="radio"
                      name="split-source-column"
                      checked={checked}
                      onChange={() => onSplitSourceColumnChange(columnId)}
                      className="radio-primary-brand"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground" title={column.title}>
                      {column.title}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Split by</h3>
          <p className="text-sm text-secondary">Choose how the value should be separated.</p>
        </div>

        <div className="space-y-2 rounded-xl border bg-card">
          <div className="border-b p-4">
            <label aria-label="Split by separator" className="flex cursor-pointer items-start gap-3">
              <input
                type="radio"
                name="split-mode"
                checked={splitMode === 'separator'}
                onChange={() => onSplitModeChange('separator')}
                className="mt-1 h-4 w-4 radio-primary-brand"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">Separator</span>
                <span className="block text-sm text-secondary">Split using a separator character.</span>
              </span>
            </label>
            {renderSplitModeFields('separator')}
          </div>

          <div className="border-b p-4 space-y-2">
            <label aria-label="Split by fixed length" className="flex cursor-pointer items-start gap-3">
              <input
                type="radio"
                name="split-mode"
                checked={splitMode === 'fixed_length'}
                onChange={() => onSplitModeChange('fixed_length')}
                className="mt-1 h-4 w-4 radio-primary-brand"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">Fixed length</span>
                <span className="block text-sm text-secondary">Split before or after a number of characters.</span>
              </span>
            </label>
            {renderSplitModeFields('fixed_length')}
          </div>

          <div className="p-4 space-y-2">
            <label aria-label="Split by pattern" className="flex cursor-pointer items-start gap-3">
              <input
                type="radio"
                name="split-mode"
                checked={splitMode === 'pattern'}
                onChange={() => onSplitModeChange('pattern')}
                className="mt-1 h-4 w-4 radio-primary-brand"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">Pattern</span>
                <span className="block text-sm text-secondary">Use a pattern to split values.</span>
              </span>
            </label>
            {renderSplitModeFields('pattern')}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Output option</h3>
        <label className="flex cursor-pointer items-start gap-3" aria-label="keep-original">
          <input
            type="checkbox"
            checked={splitOutputMode === 'keep_original'}
            onChange={(event) => onSplitOutputModeChange(event.target.checked ? 'keep_original' : 'replace_original')}
            className="mt-1 checkbox-primary-brand"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-foreground">Keep original column</span>
            <span className="block text-sm text-secondary">Keep the source column and create new split columns.</span>
          </span>
        </label>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Where to add new columns</h3>
          <p className="text-sm text-secondary">Choose where the split columns should appear.</p>
        </div>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="flex cursor-pointer items-start gap-3" aria-label="next-to-original">
            <input
              type="radio"
              name="split-placement"
              checked={splitPlacement === 'next_to_original'}
              onChange={() => onSplitPlacementChange('next_to_original')}
              className="mt-1 h-4 w-4 radio-primary-brand"
            />
            <span className="text-sm text-foreground">Next to original column</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3" aria-label="at-end-of-table">
            <input
              type="radio"
              name="split-placement"
              checked={splitPlacement === 'end_of_table'}
              onChange={() => onSplitPlacementChange('end_of_table')}
              className="mt-1 h-4 w-4 radio-primary-brand"
            />
            <span className="text-sm text-foreground">At end of table</span>
          </label>
        </div>
      </section>
    </div>
  );
};
