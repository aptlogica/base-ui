// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import type { GridColumn } from '../../../types/grid.types';
import { ColumnSelectionSection } from '../shared/ColumnSelectionSection';

type SpaceMode = 'both' | 'leading' | 'trailing' | 'extra';

interface ExtraspacePanelProps {
  columns: GridColumn[];
  selectedColumnIds: string[];
  onToggleColumn: (columnId: string) => void;
  onToggleAllColumns: () => void;
  spaceMode: SpaceMode;
  onSpaceModeChange: (value: SpaceMode) => void;
}

const SPACE_OPTIONS: Array<{
  value: SpaceMode;
  label: string;
  description: string;
}> = [
    {
      value: 'extra',
      label: 'Remove extra spaces',
      description: 'Remove extra spaces between words with a single space.',
    },
    {
      value: 'both',
      label: 'Trim leading and trailing spaces',
      description: 'Remove spaces from both the beginning and end of text.',
    },
    {
      value: 'leading',
      label: 'Trim leading spaces',
      description: 'Remove spaces from the beginning of text only.',
    },
    {
      value: 'trailing',
      label: 'Trim trailing spaces',
      description: 'Remove spaces from the end of text only.',
    },
  ];

export const ExtraspacePanel: React.FC<ExtraspacePanelProps> = ({
  columns,
  selectedColumnIds,
  onToggleColumn,
  onToggleAllColumns,
  spaceMode,
  onSpaceModeChange,
}) => {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
      <ColumnSelectionSection
        columns={columns}
        selectedColumnIds={selectedColumnIds}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={onToggleAllColumns}
        title="Select columns"
        description="Choose the columns to clean."
      />

      <section className="space-y-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Space Options</h3>
          <p className="text-sm text-secondary">
            Choose how to handle spaces in the selected columns.
          </p>
        </div>

        <div className="space-y-2 rounded-xl border bg-card">
          {SPACE_OPTIONS.map((option, index) => (
            <label
              aria-label={option.label}
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 p-4 hover:bg-muted/50 ${index === SPACE_OPTIONS.length - 1 ? '' : 'border-b'
                }`}
            >
              <input
                type="radio"
                name="space-mode"
                checked={spaceMode === option.value}
                onChange={() => onSpaceModeChange(option.value)}
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
    </div>
  );
};
