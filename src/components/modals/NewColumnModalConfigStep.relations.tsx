import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { MultiLineText } from '../../components/common/Fields';
import AdvancedDropdown from '../../components/common/dropdown/AdvancedDropdown';

export function renderRelationsConfigStep(props: any) {
  const {
    selectedType,
    isLinksFieldEditing,
    relationType,
    setRelationType,
    tables,
    selectedTableId,
    setSelectedTableId,
    selectedTable,
    setSelectedTable,
    showDescription,
    setShowDescription,
    description,
    setDescription,
    linkFields,
    targetTableFields,
    selectedRelationId,
    setSelectedRelationId,
    selectedLookupColumnId,
    setSelectedLookupColumnId,
    setHasUserModifiedLookupColumn,
    isTargetTableLoading,
  } = props;

  switch (selectedType?.key) {
    case 'links':
      return (
        <>
          <div className="mb-4">
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-medium text-[var(--color-text-tertiary)]">Relation Type</span>
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 border border rounded-md p-2 mb-2">
                <span className="font-medium text-gray-700">What is a Link?</span> A link creates a relationship between tables to reference related records.
                Example: link "Orders" to "Customers" to see which customer placed each order.
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={isLinksFieldEditing}
                className={`p-3 rounded-xl border-2 transition-all ${isLinksFieldEditing
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-50'
                  } ${relationType === 'one-to-one'
                    ? 'text-[var(--color-text-primary)] rounded-xl border-[var(--color-border-brand)]'
                  : 'text-[var(--color-text-primary)] border'
                  }`}
                onClick={() => !isLinksFieldEditing && setRelationType('one-to-one')}
                title="Each record in this table links to exactly one record in the target table, and vice versa"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <svg className="w-5 h-5" stroke="currentColor" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 10C11.8954 10 11 9.10457 11 8C11 6.89543 11.8954 6 13 6C14.1046 6 15 6.89543 15 8C15 9.10457 14.1046 10 13 10Z" stroke="#9333EA" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3 10C1.89543 10 1 9.10457 1 8C1 6.89543 1.89543 6 3 6C4.10457 6 5 6.89543 5 8C5 9.10457 4.10457 10 3 10Z" stroke="#9333EA" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5 8L11 8" stroke="#9333EA" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium">One to One</span>
                  <p className="text-xs text-gray-500 text-center mt-1 px-1">
                    Each record links to exactly one related record
                  </p>
                </div>
              </button>
              <button
                type="button"
                disabled={isLinksFieldEditing}
                className={`p-3 rounded-xl border-2 transition-all ${isLinksFieldEditing
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-50'
                  } ${relationType === 'has-many'
                    ? 'text-[var(--color-text-primary)] rounded-xl border-[var(--color-border-brand)]'
                  : 'text-[var(--color-text-primary)] border'
                  }`}
                onClick={() => !isLinksFieldEditing && setRelationType('has-many')}
                title="Each record in this table can link to multiple records in the target table"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <svg className="w-5 h-5" stroke="currentColor" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g>
                        <path d="M3 10C4.10457 10 5 9.10457 5 8C5 6.89543 4.10457 6 3 6C1.89543 6 1 6.89543 1 8C1 9.10457 1.89543 10 3 10Z" stroke="#FA8231" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M13 10C14.1046 10 15 9.10457 15 8C15 6.89543 14.1046 6 13 6C11.8954 6 11 6.89543 11 8C11 9.10457 11.8954 10 13 10Z" stroke="#FA8231" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 15C10.1046 15 11 14.1046 11 13C11 11.8954 10.1046 11 9 11C7.89543 11 7 11.8954 7 13C7 14.1046 7.89543 15 9 15Z" stroke="#FA8231" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 5C10.1046 5 11 4.10457 11 3C11 1.89543 10.1046 1 9 1C7.89543 1 7 1.89543 7 3C7 4.10457 7.89543 5 9 5Z" stroke="#FA8231" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M11 8L5 8" stroke="#FA8231" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M7 4L5 6" stroke="#FA8231" strokeWidth="1.33333" strokeLinecap="square" strokeLinejoin="round" />
                        <path d="M7 12L5 10" stroke="#FA8231" strokeWidth="1.33333" strokeLinecap="square" strokeLinejoin="round" />
                      </g>
                    </svg>
                  </div>
                  <span className="text-xs font-medium">Has Many</span>
                  <p className="text-xs text-gray-500 text-center mt-1 px-1">
                    One record can link to many related records
                  </p>
                </div>
              </button>
              <button
                type="button"
                disabled={isLinksFieldEditing}
                className={`p-3 rounded-xl border-2 transition-all ${isLinksFieldEditing
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-50'
                  } ${relationType === 'many-to-many'
                    ? 'text-[var(--color-text-primary)] rounded-xl border-[var(--color-border-brand)]'
                  : 'text-[var(--color-text-primary)] border'
                  }`}
                onClick={() => !isLinksFieldEditing && setRelationType('many-to-many')}
                title="Records in both tables can link to multiple records in the other table"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                    <svg className="w-5 h-5" stroke="currentColor" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 6C10.8954 6 10 5.10457 10 4C10 2.89543 10.8954 2 12 2C13.1046 2 14 2.89543 14 4C14 5.10457 13.1046 6 12 6Z" stroke="#FC3AC6" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14Z" stroke="#FC3AC6" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 14C2.89543 14 2 13.1046 2 12C2 10.8954 2.89543 10 4 10C5.10457 10 6 10.8954 6 12C6 13.1046 5.10457 14 4 14Z" stroke="#FC3AC6" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 6C2.89543 6 2 5.10457 2 4C2 2.89543 2.89543 2 4 2C5.10457 2 6 2.89543 6 4C6 5.10457 5.10457 6 4 6Z" stroke="#FC3AC6" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5.5 10.5L10.5 5.5" stroke="#FC3AC6" strokeWidth="1.33333" strokeLinecap="square" strokeLinejoin="round" />
                      <path d="M5.5 5.5L10.5 10.5" stroke="#FC3AC6" strokeWidth="1.33333" strokeLinecap="square" strokeLinejoin="round" />
                      <path d="M6 4L10 4" stroke="#FC3AC6" strokeWidth="1.33333" strokeLinecap="square" strokeLinejoin="round" />
                      <path d="M6 12L10 12" stroke="#FC3AC6" strokeWidth="1.33333" strokeLinecap="square" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium">Many to Many</span>
                  <p className="text-xs text-gray-500 text-center mt-1 px-1">
                    Multiple records link to multiple related records
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-2 text-sm font-medium text-[var(--color-text-tertiary)]">Target Table</div>
            <AdvancedDropdown
              options={Array.isArray(tables) ? tables.map(table => ({
                value: table.id,
                label: table.title || table.alias || `Table ${table.id}`
              })) : []}
              value={selectedTableId}
              onChange={(value) => {
                if (!isLinksFieldEditing) {
                setSelectedTableId(value as string);
                const table = Array.isArray(tables) ? tables.find(t => t.id === value) : null;
                setSelectedTable(table);
                }
              }}
              placeholder="Select table to link"
              searchable
              clearable
              disabled={isLinksFieldEditing}
            />
            {selectedTable && (
              <div className="mt-2 text-xs text-gray-500">
                Linking to: <span className="font-medium">{selectedTable.title || selectedTable.alias}</span>
              </div>
            )}
            {selectedType.key === 'links' && !selectedTableId && (
              <div className="mt-1 text-xs text-red-500">
                Target table is required for relation fields
              </div>
            )}
          </div>

          <div className="relative">
            <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
              <Plus className="w-4 h-4" />
              Add description
            </button>
            {showDescription && (
              <>
                <MultiLineText
                  placeholder="Enter field description..."
                  value={description}
                  onChange={value => setDescription(value)}
                  rows={4}
                  isBorder={true}
                />
                {description && (
                  <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </>
      );
    case 'lookup': {
      const relationOptions = linkFields.map(field => ({
        value: field.id,
        label: field.title || field.name || field.id
      }));

      const lookupColumnOptions = targetTableFields.map(field => ({
        value: field.id,
        label: field.title || field.column_name || field.id
      }));

      return (
        <>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="mb-4 w-full">
              <label className="block text-sm font-medium text-[var(--color-text-tertiary)] mb-2">
                Link Field
              </label>
              <AdvancedDropdown
                options={relationOptions}
                value={selectedRelationId}
                onChange={(value) => {
                  setHasUserModifiedLookupColumn(true);
                  setSelectedRelationId(value as string);
                }}
                placeholder="-select-"
                searchable
                clearable
              />
              {!selectedRelationId && linkFields.length === 0 && (
                <div className="mt-1 text-xs text-orange-500">
                  No link fields found in this table. Create a link field first.
                </div>
              )}
            </div>

            <div className="mb-4 w-full">
              <label className="block text-sm font-medium text-[var(--color-text-tertiary)] mb-2">
                Lookup Field
              </label>
              <AdvancedDropdown
                options={lookupColumnOptions}
                value={selectedLookupColumnId}
                onChange={(value) => {
                  setHasUserModifiedLookupColumn(true);
                  if (typeof value === 'string' && value) {
                    setSelectedLookupColumnId(value);
                  } else {
                    setSelectedLookupColumnId('');
                  }
                }}
                placeholder="-select-"
                disabled={!selectedRelationId || isTargetTableLoading}
                searchable
                clearable
              />
              {selectedRelationId && isTargetTableLoading && (
                <div className="mt-1 text-xs text-gray-500">Loading fields...</div>
              )}
              {selectedRelationId && !isTargetTableLoading && targetTableFields.length === 0 && (
                <div className="mt-1 text-xs text-gray-500">No fields available</div>
              )}
            </div>
          </div>

          {selectedRelationId && selectedLookupColumnId && (
            <div className="mb-4 p-3 bg-gray-50 border rounded-xl">
              <div className="text-sm text-secondary">
                This field will display the <span className="font-semibold">{targetTableFields.find(f => f.id === selectedLookupColumnId)?.title || selectedLookupColumnId} </span>
                from the linked record via <span className="font-semibold">{linkFields.find(f => f.id === selectedRelationId)?.title || selectedRelationId}</span>
              </div>
            </div>
          )}

          <div className="relative">
            <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
              <Plus className="w-4 h-4" />
              Add description
            </button>
            {showDescription && (
              <>
                <MultiLineText
                  placeholder="Enter field description..."
                  value={description}
                  onChange={value => setDescription(value)}
                  rows={4}
                  isBorder={true}
                />
                {description && (
                  <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </>
      );
    }
    default:
      return null;
  }
}
