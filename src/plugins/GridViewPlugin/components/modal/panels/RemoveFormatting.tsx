// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { Info } from 'lucide-react';
import type { GridColumn } from '../../../types/grid.types';
import { ColumnSelectionSection } from '../shared/ColumnSelectionSection';
import type { GridFormattingMode } from '../shared/gridDataOperation.types';

interface FormattingPanelProps {
  columns: GridColumn[];
  selectedColumnIds: string[];
  onToggleColumn: (columnId: string) => void;
  onToggleAllColumns: () => void;
  formatting: GridFormattingMode;
  onFormattingChange: (value: GridFormattingMode) => void;
  formattingPattern: string;
  onFormattingPatternChange: (value: string) => void;
}

const FORMATTING_OPTIONS: Array<{
  value: GridFormattingMode;
  label: string;
  description: string;
}> = [
    {
      value: 'currency',
      label: 'Currency formatting',
      description: 'Remove currency symbols and formatting from values.',
    },
    {
      value: 'percentage',
      label: 'Percentage formatting',
      description: 'Remove percentage symbols from values.',
    },
    {
      value: 'separator',
      label: 'Separator formatting',
      description: 'Remove commas and numeric separators from values.',
    },
    {
      value: 'phone',
      label: 'Phone formatting',
      description: 'Remove spaces, dashes, brackets and phone formatting.',
    },
    {
      value: 'date',
      label: 'Date formatting',
      description: 'Convert dates into standardized format (YYYY-MM-DD).',
    },
    {
      value: 'custom',
      label: 'Custom formatting',
      description: 'Remove custom formatting patterns from values.',
    }
  ];

export const FormattingPanel: React.FC<FormattingPanelProps> = ({
  columns,
  selectedColumnIds,
  onToggleColumn,
  onToggleAllColumns,
  formatting,
  onFormattingChange,
  formattingPattern,
  onFormattingPatternChange,
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
          <h3 className="text-sm font-semibold text-foreground">Formatting to remove</h3>
          <p className="text-sm  text-secondary">
            Choose the type of formatting you want to remove.
          </p>
        </div>

        <div className="space-y-2 rounded-xl border bg-card">
          {FORMATTING_OPTIONS.map((option, index) => (
            <label
              aria-label={option.label}
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 p-4 hover:bg-muted/50 ${index === FORMATTING_OPTIONS.length - 1 ? '' : 'border-b'
                }`}
            >
              <input
                type="radio"
                name="formatting"
                checked={formatting === option.value}
                onChange={() => onFormattingChange(option.value)}
                className="mt-1 h-4 w-4 radio-primary-brand"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">{option.label}</span>
                <span className="block text-sm text-secondary">{option.description}</span>
              </span>
            </label>
          ))}
        </div>

        {formatting === 'custom' ? (
          <div className="space-y-2">
            <div>
              <h4 className="text-sm font-medium text-foreground">Custom pattern</h4>
              <p className="text-sm text-secondary">
                Enter one or more characters, strings, or patterns to remove.
                Separate multiple patterns with commas or new lines.
              </p>
            </div>
            <input
              type="text"
              value={formattingPattern}
              onChange={(event) => onFormattingPatternChange(event.target.value)}
              placeholder="e.g. $, -, /"
              className="field-component field-component-focus field-component-border"
            />
          </div>
        ) : null}
      </section>
    </div>
  );
};
