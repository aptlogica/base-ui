// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import type { GridColumn } from '../../../types/grid.types';
import { ColumnSelectionSection } from '../shared/ColumnSelectionSection';
import type { GridFindReplaceMatchMode } from '../shared/gridDataOperation.types';

interface FindAndReplacePanelProps {
  columns: GridColumn[];
  selectedColumnIds: string[];
  onToggleColumn: (columnId: string) => void;
  onToggleAllColumns: () => void;
  findText: string;
  onFindTextChange: (value: string) => void;
  replaceText: string;
  onReplaceTextChange: (value: string) => void;
  matchingCase: GridFindReplaceMatchMode;
  onMatchingCaseChange: (value: GridFindReplaceMatchMode) => void;
}

const MATCHING_CASES: Array<{
  value: GridFindReplaceMatchMode;
  label: string;
  description: string;
}> = [
    {
      value: 'match_case',
      label: 'Match case',
      description: 'Only match values with exact letter casing.',
    },
    {
      value: 'ignore_case',
      label: 'Ignore case',
      description: 'Match values regardless of letter casing.',
    },
    {
      value: 'match_entire_value',
      label: 'Match entire value',
      description: 'Only match values that are an exact match to the search text.',
    }
  ];

export const FindAndReplacePanel: React.FC<FindAndReplacePanelProps> = ({
  columns,
  selectedColumnIds,
  onToggleColumn,
  onToggleAllColumns,
  findText,
  onFindTextChange,
  replaceText,
  onReplaceTextChange,
  matchingCase,
  onMatchingCaseChange,
}) => {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
      <ColumnSelectionSection
        columns={columns}
        selectedColumnIds={selectedColumnIds}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={onToggleAllColumns}
        title="Select columns"
        description="Choose the columns to normalize."
      />

      <section className="space-y-7">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Find value</h3>
          <p className="mb-2 text-sm text-secondary">
            Enter the value you want to find in the selected columns.
          </p>

          <input
            type="text"
            placeholder="e.g. NY"
            value={findText}
            onChange={(event) => onFindTextChange(event.target.value)}
            className="field-component field-component-focus field-component-border"
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">Replace with</h3>
          <p className="mb-2 text-sm  text-secondary">
            Enter the value you want to replace in the selected columns.
          </p>
          <input
            type="text"
            placeholder="e.g. 'New York'"
            value={replaceText}
            onChange={(event) => onReplaceTextChange(event.target.value)}
            className="field-component field-component-focus field-component-border"
          />
        </div>


        <div>
          <h3 className="text-sm font-semibold text-foreground">Matching preferences</h3>
          <p className="text-sm  text-secondary">
            Choose additional options for how text should be matched.
          </p>
        </div>

        <div className="space-y-2 rounded-xl border bg-card">
          {MATCHING_CASES.map((option, index) => (
            <label
              aria-label={option.label}
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 p-4 hover:bg-muted/50 ${index === MATCHING_CASES.length - 1 ? '' : 'border-b'
                }`}
            >
              <input
                type="radio"
                name="matching-case"
                checked={matchingCase === option.value}
                onChange={() => onMatchingCaseChange(option.value)}
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
