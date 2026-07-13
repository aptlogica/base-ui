// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import type { GridColumn } from '../../../types/grid.types';
import { ColumnSelectionSection } from '../shared/ColumnSelectionSection';
import type { GridDuplicateAction, GridDuplicateKeepRule } from '../shared/gridDataOperation.types';
import Dropdown from '../../shared/DropDown/DropDown';

interface RemoveDuplicatesPanelProps {
  columns: GridColumn[];
  selectedColumnIds: string[];
  onToggleColumn: (columnId: string) => void;
  onToggleAllColumns: () => void;
  duplicateAction: GridDuplicateAction;
  onDuplicateActionChange: (value: GridDuplicateAction) => void;
  duplicateKeepRule: GridDuplicateKeepRule;
  onDuplicateKeepRuleChange: (value: GridDuplicateKeepRule) => void;
}

const DUPLICATE_ACTION_OPTIONS: Array<{
  value: GridDuplicateAction;
  label: string;
  description: string;
}> = [
    {
      value: 'remove_row',
      label: 'Remove duplicate rows',
      description: 'Delete duplicate rows and keep a single matching row.',
    },
    {
      value: 'remove_duplicates',
      label: 'Keep row and clear duplicate values',
      description: 'Keep the row but clear the duplicated values in selected columns.',
    },
    {
      value: 'remove_duplicates_matchCase',
      label: 'Remove duplicate with Match Case',
      description: 'Remove rows only when duplicate values match case.',
    },
  ];

const KEEP_RULE_OPTIONS: Array<{
  value: GridDuplicateKeepRule;
  label: string;
}> = [
  {
    value: 'keep_first',
    label: 'Keep first occurrence',
  },
  {
    value: 'keep_last',
    label: 'Keep last occurrence',
  },
  {
    value: 'keep_latest_updated',
    label: 'Keep latest updated record',
  },
];

export const RemoveDuplicatesPanel: React.FC<RemoveDuplicatesPanelProps> = ({
  columns,
  selectedColumnIds,
  onToggleColumn,
  onToggleAllColumns,
  duplicateAction,
  onDuplicateActionChange,
  duplicateKeepRule,
  onDuplicateKeepRuleChange,
}) => {
  return (
    <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
      <ColumnSelectionSection
        columns={columns}
        selectedColumnIds={selectedColumnIds}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={onToggleAllColumns}
        title="Identify duplicates by"
        description="Select one or more columns to compare."
      />

      <section className="space-y-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Duplicate action</h3>
          <p className="text-sm text-secondary">
            Choose whether duplicates should be removed or just cleared from the selected columns.
          </p>
        </div>

        <div className="space-y-2 rounded-xl border bg-card">
          {DUPLICATE_ACTION_OPTIONS.map((option, index) => (
            <label
              key={option.value}
              aria-label={option.label}
              className={`flex cursor-pointer items-start gap-3 p-4 hover:bg-muted/50 ${index === DUPLICATE_ACTION_OPTIONS.length - 1 ? '' : 'border-b'
                }`}
            >
              <input
                type="radio"
                name="duplicate-action"
                checked={duplicateAction === option.value}
                onChange={() => onDuplicateActionChange(option.value)}
                className="mt-1 h-4 w-4 radio-primary-brand"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">{option.label}</span>
                <span className="block text-sm text-secondary">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Keep rule</h3>
          <p className="text-sm text-secondary">
            Choose which matching row should be kept as the original.
          </p>
        </div>
        <Dropdown
          options={KEEP_RULE_OPTIONS}
          value={duplicateKeepRule}
          onChange={(value) => onDuplicateKeepRuleChange(value as GridDuplicateKeepRule)}
          placeholder="Choose keep rule"
        />
      </section>
    </div>
  );
};
