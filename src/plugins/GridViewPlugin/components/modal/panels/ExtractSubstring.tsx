// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import type { GridColumn } from '../../../types/grid.types';
import { AdvancedDropdown } from '../../../../../components/common/dropdown/AdvancedDropdown';
import { getGridColumnIdentity } from '../shared/gridColumnIdentity';

type ExtractionMethod = 'extraction_type' | 'between_characters';
type ExtractionType = 'email' | 'keywords' | 'mentions' | 'tags' | 'url' | 'domain' | 'emoji' | 'phone' | 'prefix';
type Placement = 'next_to_original' | 'end_of_table';

interface ExtractSubstringPanelProps {
  columns: GridColumn[];
  selectedColumnIds: string[];
  onSelectColumn: (columnId: string) => void;
  method: ExtractionMethod;
  onMethodChange: (value: ExtractionMethod) => void;
  extractionType: ExtractionType;
  onExtractionTypeChange: (value: ExtractionType) => void;
  startAfter: string;
  onStartAfterChange: (value: string) => void;
  endBefore: string;
  onEndBeforeChange: (value: string) => void;
  keepOriginalColumn: boolean;
  onKeepOriginalColumnChange: (value: boolean) => void;
  placement: Placement;
  onPlacementChange: (value: Placement) => void;
}

interface DropdownOption {
  value: ExtractionType;
  label: string;
  description?: string;
  supported?: boolean;
}

const EXTRACTION_TYPE_OPTIONS: DropdownOption[] = [
  { value: 'email', label: 'Extract email from texts', supported: true },
  { value: 'keywords', label: 'Extract keywords from texts', supported: true },
  { value: 'mentions', label: 'Extract mentions from texts', description: 'eg. @name', supported: true },
  { value: 'tags', label: 'Extract tags from texts', description: 'eg. #string', supported: true },
  { value: 'url', label: 'Extract URL from texts', supported: true },
  { value: 'domain', label: 'Extract domain from email address or URL', supported: true },
  { value: 'emoji', label: 'Extract emoji from texts', supported: true },
  { value: 'phone', label: 'Extract phone numbers from texts', supported: true },
  { value: 'prefix', label: 'Extract prefix from email', supported: true },
];

export const ExtractSubstringPanel: React.FC<ExtractSubstringPanelProps> = ({
  columns,
  selectedColumnIds,
  onSelectColumn,
  method,
  onMethodChange,
  extractionType,
  onExtractionTypeChange,
  startAfter,
  onStartAfterChange,
  endBefore,
  onEndBeforeChange,
  keepOriginalColumn,
  onKeepOriginalColumnChange,
  placement,
  onPlacementChange,
}) => {
  const selectedColumnId = selectedColumnIds[0] ?? '';

  return (
    <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
      <section className="space-y-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Column to extract from</h3>
          <p className="text-sm text-secondary">Select one column to extract values from.</p>
        </div>

        <div className="rounded-xl border bg-card p-3">
          <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
            {columns
              .filter((column) => column.id || column.key)
              .map((column) => {
                const columnId = getGridColumnIdentity(column);
                const checked = selectedColumnId === columnId;

                return (
                  <label
                    key={columnId}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50"
                  >
                    <input
                      type="radio"
                      name="extract-source-column"
                      checked={checked}
                      onChange={() => onSelectColumn(columnId)}
                      className="radio-primary-brand"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground" title={column.title}>
                      {column.title}
                    </span>
                  </label>
                );
              })}
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Extraction method</h3>
          <p className="text-sm text-secondary">Choose how text should be extracted.</p>
        </div>

        <div className="space-y-2 rounded-xl border bg-card">
          <label className={`flex cursor-pointer items-start gap-3 p-4 hover:bg-muted/50 ${method === 'between_characters' ? 'border-b' : ''}`}>
            <input
              type="radio"
              name="extract-method"
              checked={method === 'extraction_type'}
              onChange={() => onMethodChange('extraction_type')}
              className="mt-1 h-4 w-4 radio-primary-brand"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-foreground">Extraction Type</span>
              <span className="block text-sm text-secondary">Choose the type of content to extract.</span>
              {method === 'extraction_type' && (
                <div className="mt-3">
                    <AdvancedDropdown
                      options={EXTRACTION_TYPE_OPTIONS}
                      value={extractionType}
                    onChange={(value) => onExtractionTypeChange(value as ExtractionType)}
                      placeholder="Select extraction type"
                    />
                  <p className="mt-2 text-xs text-secondary">
                    This preset is ready to preview and apply.
                  </p>
                </div>
              )}
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 p-4 hover:bg-muted/50">
            <input
              type="radio"
              name="extract-method"
              checked={method === 'between_characters'}
              onChange={() => onMethodChange('between_characters')}
              className="mt-1 h-4 w-4 radio-primary-brand"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-foreground">Between Characters</span>
              <span className="block text-sm text-secondary">Extract text between two values.</span>
              {method === 'between_characters' && (
                <div className="mt-4 grid gap-4">
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-foreground">Start after</p>
                    <input
                      type="text"
                      value={startAfter}
                      onChange={(event) => onStartAfterChange(event.target.value)}
                      placeholder="Enter starting value"
                      className="h-11 w-full rounded-xl border bg-alpha-white px-4 text-sm transition-colors focus:border-transparent focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-600)]"
                    />
                  </div>
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-foreground">End before</p>
                    <input
                      type="text"
                      value={endBefore}
                      onChange={(event) => onEndBeforeChange(event.target.value)}
                      placeholder="Enter ending value"
                      className="h-11 w-full rounded-xl border bg-alpha-white px-4 text-sm transition-colors focus:border-transparent focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-600)]"
                    />
                  </div>
                </div>
              )}
            </span>
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Output option</h3>
        <label className="flex cursor-pointer items-start gap-3 hover:bg-muted/50">
          <input
            type="checkbox"
            checked={keepOriginalColumn}
            onChange={(event) => onKeepOriginalColumnChange(event.target.checked)}
            className="mt-1 h-4 w-4 checkbox-primary-brand"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-foreground">Keep original column</span>
            <span className="block text-sm text-secondary">Keep the original column after applying changes.</span>
          </span>
        </label>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Where to add new columns</h3>
        {[
          { value: 'next_to_original', label: 'Next to original column' },
          { value: 'end_of_table', label: 'At end of table' },
        ].map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-start gap-3"
          >
            <input
              type="radio"
              name="extract-placement"
              checked={placement === option.value}
              onChange={() => onPlacementChange(option.value as Placement)}
              className="mt-1 h-4 w-4 radio-primary-brand"
            />
            <span className="text-sm text-foreground">{option.label}</span>
          </label>
        ))}
      </section>
    </div>
  );
};
