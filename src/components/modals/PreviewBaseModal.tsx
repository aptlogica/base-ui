// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Database, Plus, X } from 'lucide-react';
import { FIELD_TYPES, FieldType } from '../../types/fieldTypes';

export interface PreviewBaseField {
  name: string;
  type: string;
  meta?: Record<string, unknown>;
}

export interface PreviewBaseTable {
  name: string;
  fields: PreviewBaseField[];
}

export interface PreviewBaseRelation {
  type: string;
  source_table: string;
  target_table: string;
}

export interface PreviewBaseData {
  base_name: string;
  tables: PreviewBaseTable[];
  relations: PreviewBaseRelation[];
}

interface PreviewBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PreviewBaseData | null;
  onApply?: (data: PreviewBaseData, sampleData: boolean) => Promise<void> | void;
}

const normalizeFieldType = (value: string) => {
  const exists = FIELD_TYPES.some((fieldType) => fieldType.key === value);
  return exists ? value : FieldType.Text;
};

const createDraftData = (input: PreviewBaseData): PreviewBaseData => ({
  base_name: input.base_name,
  tables: input.tables.map((table) => ({
    name: table.name,
    fields: table.fields.map((field) => ({
      name: field.name,
      type: normalizeFieldType(field.type),
      meta: field.meta ? { ...field.meta } : {},
    })),
  })),
  relations: input.relations.map((relation) => ({ ...relation })),
});

export const PreviewBaseModal: React.FC<PreviewBaseModalProps> = ({
  isOpen,
  onClose,
  data,
  onApply,
}) => {
  const [draftData, setDraftData] = useState<PreviewBaseData | null>(null);
  const [selectedTableIndex, setSelectedTableIndex] = useState(0);
  const [includeSampleData, setIncludeSampleData] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setDraftData(null);
      setSelectedTableIndex(0);
      setIncludeSampleData(false);
      setIsApplying(false);
      return;
    }

    setDraftData(data ? createDraftData(data) : null);
    setSelectedTableIndex(0);
    setIncludeSampleData(false);
    setIsApplying(false);
  }, [data, isOpen]);

  const selectedTable = useMemo(() => {
    if (!draftData?.tables?.length) return null;
    return draftData.tables[selectedTableIndex] || draftData.tables[0] || null;
  }, [draftData, selectedTableIndex]);

  const selectedTableRelations = useMemo(() => {
    if (!draftData?.relations?.length || !selectedTable) return [];
    return draftData.relations.filter(
      (relation) =>
        relation.source_table === selectedTable.name || relation.target_table === selectedTable.name
    );
  }, [draftData, selectedTable]);

  const relationFieldRows = useMemo(() => {
    if (!selectedTable) return [];

    return selectedTableRelations.map((relation) => {
      const isOutgoing = relation.source_table === selectedTable.name;
      const otherTable = isOutgoing ? relation.target_table : relation.source_table;
      return {
        name: otherTable,
        type: FieldType.Links,
        relationType: relation.type,
      };
    });
  }, [selectedTable, selectedTableRelations]);

  const updateDraftData = (updater: (current: PreviewBaseData) => PreviewBaseData) => {
    setDraftData((current) => {
      if (!current) return current;
      return updater(current);
    });
  };

  const handleBaseNameChange = (value: string) => {
    updateDraftData((current) => ({
      ...current,
      base_name: value,
    }));
  };

  const handleTableSelectionChange = (value: string) => {
    const nextIndex = Number(value);
    if (!Number.isNaN(nextIndex)) {
      setSelectedTableIndex(nextIndex);
    }
  };

  const handleTableNameChange = (value: string) => {
    const previousTableName = selectedTable?.name || '';
    updateDraftData((current) => ({
      ...current,
      tables: current.tables.map((table, index) => (
        index === selectedTableIndex ? { ...table, name: value } : table
      )),
      relations: current.relations.map((relation) => {
        if (relation.source_table === previousTableName) {
          return { ...relation, source_table: value };
        }
        if (relation.target_table === previousTableName) {
          return { ...relation, target_table: value };
        }
        return relation;
      }),
    }));
  };

  const handleFieldChange = (fieldIndex: number, key: 'name' | 'type', value: string) => {
    updateDraftData((current) => ({
      ...current,
      tables: current.tables.map((table, index) => {
        if (index !== selectedTableIndex) {
          return table;
        }

        return {
          ...table,
          fields: table.fields.map((field, currentFieldIndex) => {
            if (currentFieldIndex !== fieldIndex) {
              return field;
            }

            return key === 'name'
              ? { ...field, name: value }
              : { ...field, type: normalizeFieldType(value) };
          }),
        };
      }),
    }));
  };

  const handleAddField = () => {
    updateDraftData((current) => ({
      ...current,
      tables: current.tables.map((table, index) => {
        if (index !== selectedTableIndex) {
          return table;
        }

        return {
          ...table,
          fields: [
            ...table.fields,
            {
              name: '',
              type: FieldType.Text,
              meta: {},
            },
          ],
        };
      }),
    }));
  };

  const handleApply = async () => {
    if (!draftData) {
      onClose();
      return;
    }

    setIsApplying(true);
    try {
      await Promise.resolve(onApply?.(draftData, includeSampleData));
      onClose();
    } catch (err) {
      console.error('Failed to apply preview schema:', err);
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen || !draftData) return null;

  return (
    <div className="bg-modal-backdrop relative" role="dialog" aria-modal="true" tabIndex={-1}>
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div
        className="bg-modal !max-w-5xl !p-0 flex flex-col relative overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 icon-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <Database size={20} className="icon-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-primary truncate">Preview Base</h2>
              <p className="text-sm text-secondary truncate">
                Review the generated schema before applying it
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="text-[var(--text-color-tertiary)] h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="p-4 md:p-5">
            <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-secondary">
                    Base Name
                  </label>
                  <input
                    type="text"
                    value={draftData.base_name}
                    onChange={(event) => handleBaseNameChange(event.target.value)}
                    className="field-component field-component-border field-component-focus bg-background text-primary"
                    aria-label="Base name"
                  />
                  <p className="text-xs text-gray-500">The global identifier for this instance.</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-secondary">
                    Table Selection
                  </label>
                  <div className="relative">
                    <select
                      value={String(selectedTableIndex)}
                      onChange={(event) => handleTableSelectionChange(event.target.value)}
                      className="field-component field-component-border field-component-focus pr-10 bg-background"
                      aria-label="Table selection"
                    >
                      {draftData.tables.map((table, index) => (
                        <option key={`${table.name}-${index}`} value={String(index)}>
                          {table.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-secondary">
                    Table Name
                  </label>
                  <input
                    type="text"
                    value={selectedTable?.name || ''}
                    onChange={(event) => handleTableNameChange(event.target.value)}
                    className="field-component field-component-border field-component-focus bg-background text-primary"
                    aria-label="Table name"
                  />
                </div>
              </div>

              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="flex items-center justify-between gap-3 p-4 border-b">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-primary">Fields Configuration</h3>
                    <p className="text-xs text-secondary truncate">
                      {selectedTable?.name || 'No table selected'}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    {selectedTable?.fields?.length || 0} Fields Defined
                  </div>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_140px_32px] gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-secondary">
                    <div>Field Name</div>
                    <div>Type</div>
                    <div />
                  </div>

                  <div className="overflow-hidden rounded-xl border">
                    {(selectedTable?.fields?.length || relationFieldRows.length) ? (
                      <>
                        {selectedTable?.fields?.map((field, index) => (
                          <div
                            key={`field-${index}`}
                            className="grid grid-cols-[minmax(0,1fr)_140px_32px] items-center gap-3 px-3 py-3 border-b last:border-b-0 bg-white"
                          >
                            <div className="min-w-0">
                              <input
                                type="text"
                                value={field.name}
                                onChange={(event) => handleFieldChange(index, 'name', event.target.value)}
                                className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-primary outline-none focus:border-green-300 focus:bg-green-50"
                                aria-label={`Field name ${index + 1}`}
                              />
                            </div>
                            <div className="min-w-0">
                              <select
                                value={normalizeFieldType(field.type)}
                                onChange={(event) => handleFieldChange(index, 'type', event.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-sm text-gray-700 outline-none focus:border-green-300 focus:bg-white"
                                aria-label={`Field type ${index + 1}`}
                              >
                                {FIELD_TYPES.map((fieldType) => (
                                  <option key={fieldType.key} value={fieldType.key}>
                                    {fieldType.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <ChevronDown size={16} className="justify-self-center text-gray-400" />
                          </div>
                        ))}

                        {relationFieldRows.map((relationField, index) => (
                          <div
                            key={`relation-field-${index}`}
                            className="grid grid-cols-[minmax(0,1fr)_140px_32px] items-center gap-3 px-3 py-3 border-b last:border-b-0 bg-green-50/40"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={relationField.name}
                                  readOnly
                                  className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-primary outline-none"
                                  aria-label={`Relation field name ${index + 1}`}
                                />
                                <span className="inline-flex items-center rounded-lg bg-green-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-green-700">
                                  Relation
                                </span>
                              </div>
                            </div>
                            <div className="min-w-0">
                              <div className="inline-flex w-full items-center rounded-lg border border-green-200 bg-white px-2 py-1 text-sm text-green-800">
                                Links
                              </div>
                            </div>
                            <ChevronDown size={16} className="justify-self-center text-gray-300" />
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="px-4 py-8 text-center text-sm text-secondary">
                        No fields available for this table.
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddField}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800 transition-colors"
                  >
                    <Plus size={16} />
                    Add Field
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t flex-shrink-0 bg-background">
          <label className="mr-auto flex items-center gap-3 text-sm text-primary">
            <input
              type="checkbox"
              checked={includeSampleData}
              onChange={(event) => setIncludeSampleData(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-green-700 focus:ring-green-500"
            />
            <span>Include sample data</span>
          </label>
          <button
            type="button"
            onClick={onClose}
            className="px-10 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isApplying}
            className="flex items-center gap-2 px-10 py-2 rounded-xl btn-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApplying ? (
              <>
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
                Applying...
              </>
            ) : (
              'Apply Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
 