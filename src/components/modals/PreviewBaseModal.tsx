// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigationStore } from '../../stores/navigationStore';
import { Database, Plus, Sheet, Trash2, X } from 'lucide-react';
import { FIELD_TYPES, FieldType } from '../../types/fieldTypes';
import { FieldTypeDropdown } from '../common/dropdown/fieldDropdown/FieldTypeDropdown';

export interface PreviewBaseField {
  name: string;
  type: string;
  meta?: Record<string, unknown>;
}

export interface PreviewBaseRelationField extends PreviewBaseField {
  isRelationField: true;
  relationIndex: number;
  relationType: string;
}

type PreviewBaseDisplayField = PreviewBaseField | PreviewBaseRelationField;

interface PreviewBaseWithRelationFields extends Omit<PreviewBaseTable, 'fields'> {
  fields: PreviewBaseDisplayField[];
}

const isPreviewBaseRelationField = (
  field: PreviewBaseDisplayField
): field is PreviewBaseRelationField => 'isRelationField' in field;


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
  onApply?: (data: PreviewBaseData, sampleData: boolean) => Promise<void | { base_id: string; data: any }>;
}

const normalizeFieldType = (value: string) => {
  const exists = FIELD_TYPES.some((fieldType) => fieldType.key === value);
  return exists ? value : FieldType.Text;
};

const hiddenFieldTypeKeys = new Set(['links', 'lookup', 'select', 'multiSelect']);
const visibleFieldTypes = FIELD_TYPES.filter((fieldType) => !hiddenFieldTypeKeys.has(fieldType.key));

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
  const navigate = useNavigate();
  const { navigateToBase, navigateToTable } = useNavigationStore();


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

  const relationFieldRows = useMemo(() => {
    if (!selectedTable || !draftData?.relations?.length) return [];
    return draftData.relations
      .map((relation, relationIndex) => {
        const matchesSelectedTable =
          relation.source_table === selectedTable.name || relation.target_table === selectedTable.name;
        if (!matchesSelectedTable) {
          return null;
        }
        const isOutgoing = relation.source_table === selectedTable.name;
        const otherTable = isOutgoing ? relation.target_table : relation.source_table;
        return {
          isRelationField: true as const,
          relationIndex,
          name: otherTable,
          type: FieldType.Links,
          relationType: relation.type,
          meta: {
            relation: {
              type: relation.type,
              with: otherTable,
            },

          },

        };

      })

      .filter((relation): relation is {
        isRelationField: true;
        relationIndex: number;
        name: string;
        type: FieldType.Links;
        relationType: string;
        meta: {
          relation: {
            type: string;
            with: string;
          };
        };
      } => relation !== null);
  }, [draftData, selectedTable]);

  const selectedTableWithRelationFields = useMemo<PreviewBaseWithRelationFields | null>(() => {
    if (!selectedTable) return null;
    return {
      ...selectedTable,
      fields: [...selectedTable.fields, ...relationFieldRows],
    };
  }, [relationFieldRows, selectedTable]);

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

  const handleDeleteField = (fieldIndex: number) => {
    updateDraftData((current) => ({
      ...current,
      tables: current.tables.map((table, index) => {
        if (index !== selectedTableIndex) {
          return table;
        }

        return {
          ...table,
          fields: table.fields.filter((_, currentFieldIndex) => currentFieldIndex !== fieldIndex),
        };
      }),
    }));
  };

  const handleDeleteRelationField = (relationIndex: number) => {
    updateDraftData((current) => ({
      ...current,
      relations: current.relations.filter((_, currentRelationIndex) => currentRelationIndex !== relationIndex),
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

  // const handleApply = async () => {
  //   if (!draftData) {
  //     onClose();
  //     return;
  //   }

  //   setIsApplying(true);
  //   try {
  //     await Promise.resolve(onApply?.(draftData, includeSampleData));
  //     onClose();
  //   } catch (err) {
  //     console.error('Failed to apply preview schema:', err);
  //   } finally {
  //     setIsApplying(false);
  //   }
  // };


  const handleApply = async () => {
  if (!draftData) {
    onClose();
    return;
  }

  setIsApplying(true);
  try {
    const result = await Promise.resolve(onApply?.(draftData, includeSampleData));
    if (result && result?.data?.id) {
      const baseId = result?.data?.id;
      const workspaceId = result?.data?.workspace_id;
      const firstTableId = result?.data?.tables?.[0]?.model?.id;
      if (workspaceId && baseId) {
        if (firstTableId) {
          navigateToTable(workspaceId, baseId, firstTableId);
          navigate(`/workspace/${workspaceId}/base/${baseId}/table/${firstTableId}/grid`);
        } else {
          navigateToBase(workspaceId, baseId);
          navigate(`/workspace/${workspaceId}`);
        }
      }
    }
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
        className="bg-modal !w-[75rem] !max-w-7xl !p-0 flex flex-col relative overflow-hidden"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 icon-primary rounded-full flex items-center justify-center flex-shrink-0 p-3">
              <Database size={20} className="icon-primary" />
            </div>
            <div className="flex flex-col gap-2 flex-1 items-start">
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
          <div className="flex items-start flex-1 self-stretch">
            <div className="flex w-[21.875rem] flex-col items-start self-stretch bg-[var(--color-bg-secondary)]">
              <div className='flex py-5 px-6 flex-col items-start gap-6 self-stretch'>
                <div className="flex items-start gap-6 self-stretch">
                  <div className='flex flex-col items-start gap-6 flex-1'>
                    <div className="flex flex-col items-start gap-[0.375rem] self-stretch">
                      <div className="flex flex-col items-start gap-[0.375rem] self-stretch">
                        <label className="block text-xs font-medium not-italic text-secondary">
                          Base Name
                        </label>
                        <input
                          type="text"
                          value={draftData.base_name}
                          onChange={(event:any) => handleBaseNameChange(event.target.value)}
                          className="field-component field-component-border field-component-focus bg-background text-primary font-normal not-italic"
                          aria-label="Base name"
                        />
                      </div>
                      <p className="text-[0.875rem] font-normal not-italic text-gray-500">The global identifier for this instance.</p>
                    </div>
                    <div className="flex flex-col items-start gap-[0.5625rem] self-stretch">
                      <label className="block text-xs font-medium not-italic text-secondary">
                        Tables
                      </label>
                      <div className="flex flex-col gap-2 self-stretch">
                        {draftData.tables.map((table, index) => (
                          <button
                            key={`${table.name}-${index}`}
                            type="button"
                            onClick={() => handleTableSelectionChange(String(index))}
                            className={`flex items-center gap-[0.625rem] text-left px-3 py-2 rounded-lg text-sm font-medium not-italictransition-colors ${
                              selectedTableIndex === index
                                ? 'bg-gray-100 text-[var(--color-text-secondary)] '
                                : 'text-[var(--color-text-tertiary)] hover:bg-gray-50'
                            }`}
                            aria-label={`Select table ${table.name}`}
                          >
                            <Sheet size={14} className="text-blue-600" />
                            {table.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* <div className="space-y-1">
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
                    </div> */}
                  </div>
                </div>
              </div>
            </div>
             
            <div className="flex py-5 px-6 flex-col items-start gap-[0.625rem] flex-1 self-stretch border-l border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)]">
              <div className="flex flex-col items-start gap-6 flex-1 w-full">
                <div className="flex flex-col justify-center items-start gap-[0.375rem] self-stretch">
                  <label className="block text-xs font-medium not-italic text-secondary">
                    Table
                  </label>
                  <input
                    type="text"
                    value={selectedTable?.name || ''}
                    onChange={(event) => handleTableNameChange(event.target.value)}
                    className="field-component field-component-border field-component-focus bg-background text-primary"
                    aria-label="Table"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium not-italic text-[var(--color-text-secondary)]">Fields Configuration</p>
                  <div className="inline-flex items-center rounded-full bg-green-50 px-2 py-[0.125rem] border border-green-100 text-[0.75rem] font-medium text-green-700 ">
                    {selectedTableWithRelationFields?.fields?.length || 0} Fields Defined
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start flex-1 self-stretch rounded-[0.75rem] border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] shadow-[0_1px_2px_0_rgba(10,13,18,0.05)]">
                <div className="flex items-center flex-1 self-stretch">
                  <div className='flex flex-col items-start flex-1 self-stretch'>
                    <div className="flex w-full items-center border-b border-[var(--color-border-secondary)] bg-[var(--color-gray-100)]">
                      <div className="flex w-[60%] h-11 py-3 px-5 items-center gap-3 border-b border-[var(--color-border-secondary)] bg-[var(--color-gray-100)]">
                        <p className='text-[0.75rem] text-[var(--color-text-tertiary)] font-semibold not-italic'>Field Name</p>
                      </div>
                      <div className="flex w-[43%] h-11 py-3 px-5 items-center gap-3 border-b border-[var(--color-border-secondary)] bg-[var(--color-gray-100)]">
                        <p className='text-[0.75rem] text-[var(--color-text-tertiary)] font-semibold not-italic'>Type</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-start flex-1 self-stretch">
                      {(selectedTableWithRelationFields?.fields?.length || 0) ? (
                        <>
                          {selectedTableWithRelationFields?.fields?.map((field, index) => (
                            <div className="flex items-center self-stretch" key={`field-${index}`}>
                              <div className={`flex items-center self-stretch ${isPreviewBaseRelationField(field) ? 'bg-green-50/40' : 'bg-white'}`}>
                                <div className="w-[28.875rem] flex py-3 px-5 items-center gap-2 flex-1 self-stretch border-b border-[var(--color-border-secondary)]">
                                  {/* <div className="flex items-center gap-2"> */}
                                    <input
                                      type="text"
                                      value={field.name}
                                      onChange={
                                        isPreviewBaseRelationField(field)
                                          ? undefined
                                          : (event) => handleFieldChange(index, 'name', event.target.value)
                                      }
                                      readOnly={isPreviewBaseRelationField(field)}
                                      className="rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm line-clamp-1 font-normal not-italic text-primary outline-none focus:border-green-300 focus:bg-green-50"
                                      aria-label={`${isPreviewBaseRelationField(field) ? 'Relation' : 'Field'} name ${index + 1}`}
                                    />
                                    {/* <input
                                      type="text"
                                      value={field.name}
                                      onChange={
                                        isPreviewBaseRelationField(field)
                                          ? undefined
                                          : (event) => handleFieldChange(index, 'name', event.target.value)
                                      }
                                      readOnly={isPreviewBaseRelationField(field)}
                                      style={{ width: `${Math.max(field.name.length + 2, 2)}ch` }}
                                      className="rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm line-clamp-1 font-normal not-italic text-primary outline-none focus:border-green-300 focus:bg-green-50"
                                      aria-label={`${isPreviewBaseRelationField(field) ? 'Relation' : 'Field'} name ${index + 1}`}
                                    /> */}
                                    {isPreviewBaseRelationField(field) && (
                                      <span className="rounded-lg bg-green-100 px-2 py-1 text-[0.75rem] font-medium not-italic text-green-700">
                                        Relation
                                      </span>
                                    )}
                                  {/* </div> */}
                                </div>
                                  {isPreviewBaseRelationField(field) ? (
                                    <div className="relative flex w-[17.5rem] py-3 px-5 items-center gap-2 self-stretch border-b border-[var(--color-border-secondary)]">
                                      <div className="px-2 py-1 w-full rounded-lg border border-[var(--color-border-secondary)] text-[0.875rem] text-[var(--color-text-disabled)] font-semibold not-italic">
                                        Links
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="relative flex w-[17.5rem] py-3 px-5 items-center gap-2 self-stretch border-b border-[var(--color-border-secondary)]">
                                      <FieldTypeDropdown
                                        selectedType={FIELD_TYPES.find(ft => ft.key === normalizeFieldType(field.type)) || null}
                                        setSelectedType={(type) => handleFieldChange(index, 'type', type.key)}
                                        fieldTypes={visibleFieldTypes}
                                        className="!w-full !text-[0.875rem] !mb-0 text-[var(--color-text-secondary)] font-semibold not-italic"
                                      />                            
                                    </div>
                                  )}
                                
                                <div className="flex py-3 px-4 items-center gap-[0.125rem] self-stretch border-b border-[var(--color-border-secondary)]">
                                  <button
                                    type="button"
                                    onClick={
                                      isPreviewBaseRelationField(field)
                                        ? () => handleDeleteRelationField(field.relationIndex)
                                        : () => handleDeleteField(index)
                                    }
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                    aria-label={`${isPreviewBaseRelationField(field) ? 'Delete relation field' : 'Delete field'} ${index + 1}`}
                                    title={isPreviewBaseRelationField(field) ? 'Delete relation field' : 'Delete field'}
                                  >
                                    <Trash2 size={16} className='!w-[0.97225rem] !h-[0.97225rem]' />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="px-4 py-8 text-center text-sm text-secondary">
                          No fields available for this table.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex py-3 px-5 items-center self-stretch bg-[var(--color-bg-white)]">
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="flex items-center justify-center gap-2 text-[0.875rem] font-semibold not-italic text-[var(--color-brand-700)] hover:text-green-800 transition-colors"
                  >
                    <Plus size={16} className='w-5 h-5'/>
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
              className="h-4 w-4 rounded border-gray-300 checkbox-primary-brand"
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