// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useMemo } from 'react';
import type { ImportColumnMapping, ImportPreview } from './ImportTypes';
import { getFieldTypeIconComponent } from '../../../types/fieldTypes';
import AdvancedDropdown from '../../common/dropdown/AdvancedDropdown';
import { DefaultValueEditor } from './DefaultValueEditor';
import { getAllowedImportFieldOptions } from './importFieldConfig';
import { getSingleDropdownValue } from './importDropdownValue';

type Props = {
  preview: ImportPreview;
  mappings: Record<string, ImportColumnMapping>;
  onChange: (key: string, patch: Partial<ImportColumnMapping>) => void;
};

export const ImportColumnMapper: React.FC<Props> = ({ preview, mappings, onChange }) => {
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

  return (
    <div className="overflow-hidden">
      <div className="flex items-center justify-start flex-wrap gap-4 py-4">
        <div className="text-sm font-semibold text-primary">Configure Columns</div>
        <div className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-secondary">
          {columns.length} columns detected &bull; {includedCount} columns selected for import
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

          return (
            <div
              key={key}
              className={`grid ${rowTemplate} gap-3 items-start p-3 border-b last:border-b-0`}
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
                  onChange={(value: string | string[]) => {
                    onChange(key, { fieldType: getSingleDropdownValue(value) });
                  }}
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
              </div>
            </div>
          );
        })}
        {columns.length === 0 && <div className="px-4 py-6 text-sm text-secondary">No columns detected.</div>}
      </div>
    </div>
  );
};
