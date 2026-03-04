import AdvancedDropdown from '../../components/common/dropdown/AdvancedDropdown';
import { renderDescriptionToggle } from './NewColumnModalConfigStep';

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
              <div className="text-xs text-gray-500 bg-gray-50 border rounded-xl p-2 mb-2">
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
                  <div className="w-9 h-9 p-1 rounded-full bg-purple-100 flex items-center justify-center">
                  <img src="/assets/one-to-one.svg" alt="one-to-one-relation"/>
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
                  <div className="w-9 h-9 p-1 rounded-full bg-orange-100 flex items-center justify-center">
                    <img src="/assets/one-to-many.svg" alt="one-to-many-relation"/>
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
                  <div className="w-9 h-9 p-1 rounded-full bg-pink-100 flex items-center justify-center">
                  <img src="/assets/many-to-many.svg" alt="many-to-many-relation"/>
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
              <div className="mt-1 text-xs text-orange-400">
                Target table is required for relation fields
              </div>
            )}
          </div>

          {renderDescriptionToggle({
            showDescription,
            setShowDescription,
            description,
            setDescription,
            buttonClassName: 'flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2',
            wrapperClassName: 'relative',
          })}
        </>
      );
    case 'lookup': {
      const relationOptions = linkFields.map((field: Record<string, any>) => ({
        value: field.id,
        label: field.title || field.name || field.id
      }));

      const lookupColumnOptions = targetTableFields.map((field: Record<string, any>) => ({
        value: field.id,
        label: field.title || field.column_name || field.id
      }));

      return (
        <>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="mb-4 w-full">
              <label htmlFor='linkField' className="block text-sm font-medium text-[var(--color-text-tertiary)] mb-2">
                Link Field
              </label>
              <AdvancedDropdown
                id='linkField'
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
              <label htmlFor='lookupField' className="block text-sm font-medium text-[var(--color-text-tertiary)] mb-2">
                Lookup Field
              </label>
              <AdvancedDropdown
                id='lookupField'
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
              <div className="text-sm text-secondary">This field will display the <span className="font-semibold">{targetTableFields.find((f: Record<string, any>) => f.id === selectedLookupColumnId)?.title || selectedLookupColumnId} </span> from the linked record via <span className="font-semibold">{linkFields.find((f: Record<string, any>) => f.id === selectedRelationId)?.title || selectedRelationId}</span>
              </div>
            </div>
          )
          }
          {
            renderDescriptionToggle({
              showDescription,
              setShowDescription,
              description,
              setDescription,
              buttonClassName: 'flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2',
              wrapperClassName: 'relative',
            })
          }
        </>
      );
    }
    default:
      return null;
  }
}
