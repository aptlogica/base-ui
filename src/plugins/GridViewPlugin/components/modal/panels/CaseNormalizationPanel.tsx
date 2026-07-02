// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import type { GridColumn } from '../../../types/grid.types';
import { ColumnSelectionSection } from '../shared/ColumnSelectionSection';

type CaseFormat = 'lowercase' | 'uppercase' | 'title_case' | 'sentence_case';

interface CaseNormalizationPanelProps {
  columns: GridColumn[];
  selectedColumnIds: string[];
  onToggleColumn: (columnId: string) => void;
  onToggleAllColumns: () => void;
  caseFormat: CaseFormat;
  onCaseFormatChange: (value: CaseFormat) => void;
}

const CASE_FORMATS: Array<{
  value: CaseFormat;
  label: string;
  description: string;
}> = [
    {
      value: 'lowercase',
      label: 'lowercase',
      description: 'Convert all text to lowercase.',
    },
    {
      value: 'uppercase',
      label: 'UPPERCASE',
      description: 'Convert all text to uppercase.',
    },
    {
      value: 'title_case',
      label: 'Title Case',
      description: 'Capitalize the first letter of each word.',
    },
    {
      value: 'sentence_case',
      label: 'Sentence case',
      description: 'Capitalize the first letter of each sentence.',
    },
  ];

export const CaseNormalizationPanel: React.FC<CaseNormalizationPanelProps> = ({
  columns,
  selectedColumnIds,
  onToggleColumn,
  onToggleAllColumns,
  caseFormat,
  onCaseFormatChange,
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

      <section className="space-y-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Case format</h3>
          <p className="text-sm text-secondary">
            Choose how text should be formatted.
          </p>
        </div>

        <div className="space-y-2 rounded-xl border bg-card">
          {CASE_FORMATS.map((option, index) => (
            <label
              aria-label={option.label}
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 p-4 hover:bg-muted/50 ${index === CASE_FORMATS.length - 1 ? '' : 'border-b'
                }`}
            >
              <input
                type="radio"
                name="case-format"
                checked={caseFormat === option.value}
                onChange={() => onCaseFormatChange(option.value)}
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