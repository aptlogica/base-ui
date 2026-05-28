// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useMemo } from 'react';
import { Key } from 'lucide-react';
import type { ImportColumnMapping, ImportPreview } from './ImportTypes';
import { getFieldTypeIconComponent } from '../../../types/fieldTypes';
import AdvancedDropdown from '../../common/dropdown/AdvancedDropdown';
import { DefaultValueEditor } from './DefaultValueEditor';
import { getAllowedImportFieldOptions } from './importFieldConfig';

type Props = {
  preview: ImportPreview;
  mappings: Record<string, ImportColumnMapping>;
  onChange: (key: string, patch: Partial<ImportColumnMapping>) => void;
  primaryKey: string | null;
  primaryColumnError?: string | null;
  onPrimaryKeyChange: (key: string | null) => void;
};

export const ImportColumnMapper: React.FC<Props> = ({ preview, mappings, onChange, primaryKey, primaryColumnError, onPrimaryKeyChange }) => {
  const columns = preview.columns;
  const includedCount = columns.filter((col) => mappings[col.key]?.include !== false).length;
  const rowTemplate = 'grid-cols-[20px_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.95fr)_minmax(0,0.9fr)] items-center';
  const fieldTypeOptions = useMemo(
    () =>
      getAllowedImportFieldOptions().map((ft) => ({
        label: ft.label,
        value: String(ft.key),
        icon: getFieldTypeIconComponent(String(ft.key), 'w-4 h-4 text-gray-400'),
      })),
    []
  );

  const primaryKeyOptions = useMemo(
    () =>
      columns.map((col) => ({
        label: col.label,
        value: col.label, // Use actual column name (CSV header), not normalized key
      })),
    [columns]
  );

  return (
    <div className="overflow-hidden">
      <div className="flex items-center justify-start flex-wrap gap-4 py-4">
        <div className="text-sm font-semibold text-primary">Configure Columns</div>
        <div className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-secondary">
          {columns.length} columns detected &bull; {includedCount} columns selected for import
        </div>
      </div>

      <div className="flex items-center justify-start gap-4 py-4">
        <div className="text-sm font-semibold text-primary">Primary Column</div>
        <div className="w-48">
          <AdvancedDropdown
            options={primaryKeyOptions}
            value={primaryKey || ''}
            onChange={(v: any) => onPrimaryKeyChange(v || null)}
            placeholder="Select primary key column"
            className="text-xs"
            searchable={true}
            maxHeight={120}
            portal={true}
          />
        </div>
      </div>

      <div className={`grid border-t border-x ${rowTemplate} text-xs text-secondary p-3 bg-gray-100 rounded-tl-xl rounded-tr-xl`}>
        <div aria-hidden="true" />
        <div className="font-medium">Column Name</div>
        <div className="font-medium">Column Title</div>
        <div className="font-medium">Column Type</div>
        <div className="font-medium">Default Value</div>
      </div>

      <div className="bg-card border overflow-x-auto overflow-y-visible lg:max-h-full lg:overflow-auto rounded-bl-xl rounded-br-xl">
        {columns.map((col) => {
          const key = col.key;
          const m = mappings[key];
          const include = m?.include !== false;
          const fieldType = m?.fieldType || 'text';
          const defaultValue = m?.defaultValue || '';
          const isPrimaryColumn = primaryKey === col.label;
          const showPrimaryError = isPrimaryColumn && Boolean(primaryColumnError);

          return (
            <div
              key={key}
              className={`grid ${rowTemplate} gap-3 items-start p-3 border-b last:border-b-0 ${showPrimaryError ? 'bg-red-50/50' : ''}`}
            >
              <div className="h-6 w-6 inline-flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={include}
                  onChange={() => onChange(key, { include: !include })}
                  className="checkbox-primary-brand"
                  aria-label={include ? `Exclude ${col.label}` : `Include ${col.label}`}
                />
              </div>

              <div className="flex items-center gap-2">
                {isPrimaryColumn && <Key className="w-4 h-4 text-brand-600 mt-0.5" />}
                <div className="text-sm text-primary truncate font-medium" title={col.label}>
                  {col.label}
                </div>
              </div>

              <input
                type="text"
                value={m?.sourceName || col.label}
                onChange={(e) => onChange(key, { sourceName: e.target.value })}
                disabled={!include}
                className="w-full text-sm text-primary h-10 rounded-xl bg-card border border-gray-200 px-3 outline-none focus:border-brand-600 disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="Column title"
              />

              <div className="relative">
                <AdvancedDropdown
                  options={fieldTypeOptions}
                  value={fieldType}
                  onChange={(v: any) => onChange(key, { fieldType: String(v) })}
                  disabled={!include}
                  placeholder="Select field type"
                  className="text-xs"
                  searchable={true}
                  maxHeight={120}
                  portal={true}
                  isImport={true}
                />
              </div>

              <div className="relative">
                <DefaultValueEditor
                  fieldType={fieldType}
                  value={defaultValue}
                  disabled={!include}
                  onChange={(v) => onChange(key, { defaultValue: v })}
                />
                {showPrimaryError && (
                  <div className="pointer-events-none absolute right-0 top-12 z-10 w-[120px] rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 shadow-sm">
                    {primaryColumnError}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {columns.length === 0 && <div className="px-4 py-6 text-sm text-secondary">No columns detected.</div>}
      </div>
    </div>
  );
};
