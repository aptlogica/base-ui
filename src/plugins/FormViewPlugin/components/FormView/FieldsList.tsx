import React, { useState } from 'react';
import { FormField } from '../../../../types/form';
import { SortableFieldItem } from './SortableFieldItem';
import { Search } from 'lucide-react';

interface FieldsListProps {
  fields: FormField[];
  selectedFieldId: string | null;
  onFieldSelect: (fieldId: string) => void;
  onFieldToggle?: (fieldId: string) => void;
  onFieldOrderChange?: (newFields: FormField[]) => void;
  onDeleteField?: (fieldId: string) => void;
  setVisibleAllFields?: (newState: boolean) => void;
}

export const FieldsList: React.FC<FieldsListProps> = ({
  fields,
  selectedFieldId,
  onFieldSelect,
  onFieldToggle,
  onFieldOrderChange,
  onDeleteField,
  setVisibleAllFields
}) => {
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [dragOverFieldId, setDragOverFieldId] = useState<string | null>(null);

  const enabledFields = fields.filter(field => !field.is_hidden && !field.system && !field.isSystem);
  const nonSystemFields = fields.filter(field => !field.system && !field.isSystem);
  const selectedCount = enabledFields.length;
  const totalCount = nonSystemFields.length;
  const allFieldsEnabled = selectedCount === totalCount;
  
  const handleSelectAllToggle = () => {
    if (!setVisibleAllFields) return;
    const newState = !allFieldsEnabled;
    // Instead of toggling one by one, update all at once
  //   const updatedFields = fields.map(field => ({ ...field, is_hidden: !newState }));
  //   onFieldOrderChange?.(updatedFields);
    setVisibleAllFields(newState);
  };

  const handleDragStart = (fieldId: string) => {
    setDraggedFieldId(fieldId);
  };

  const handleDragOver = (fieldId: string) => {
    setDragOverFieldId(fieldId);
  };

  const handleDrop = (fieldId: string) => {
    if (!onFieldOrderChange) return;
    if (draggedFieldId && draggedFieldId !== fieldId) {
      const oldIndex = fields.findIndex(f => f.id === draggedFieldId);
      const newIndex = fields.findIndex(f => f.id === fieldId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const updated = [...fields];
        const [moved] = updated.splice(oldIndex, 1);
        updated.splice(newIndex, 0, moved);
        onFieldOrderChange(updated);
      }
    }
    setDraggedFieldId(null);
    setDragOverFieldId(null);
  };

  const handleDragEnd = () => {
    setDraggedFieldId(null);
    setDragOverFieldId(null);
  };

  const [searchTerm, setSearchTerm] = useState('');

  const filteredFields = fields.filter(
    (field:any) =>{
      return field?.name?.toLowerCase().includes(searchTerm.toLowerCase()) && !field.system && !field.isSystem
    }
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search fields..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-background border outline-none focus:ring-1 focus:ring-[var(--ring-color-brand)] text-[var(--text-color-primary)] placeholder:text-[var(--text-color-placeholder)] transition-colors"
          />
        </div>
      </div>

      {/* Select All Fields - Separate scrollable section */}
      <div className="px-4 pb-2 flex-shrink-0">
        <div className="rounded-xl p-3 bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Selected fields {selectedCount}/{totalCount}</span>
            <label className={`inline-flex items-center gap-2 ${setVisibleAllFields ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
              <input
                type="checkbox"
                checked={allFieldsEnabled}
                onChange={handleSelectAllToggle}
                disabled={!setVisibleAllFields}
                className="checkbox-primary-brand "
              />
               {/* <div className={`w-11 h-6 rounded-full transition-colors ${
                allFieldsEnabled ? 'bg-primary' : 'bg-muted'
              }`}>
                <div className={`w-5 h-5 bg-background rounded-full shadow transform transition-transform ${
                  allFieldsEnabled ? 'translate-x-5' : 'translate-x-0.5'
                } mt-0.5`} /> 
              </div>  */}
                
              <span className="text-sm text-foreground">Select all</span>
            </label>
          </div>
        </div>
      </div>

      {/* Fields List - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-2 ">
          {filteredFields.map((field) => (
            <SortableFieldItem
              key={field.id}
              field={field}
              isSelected={selectedFieldId === field.id}
              onSelect={onFieldSelect}
              onToggle={onFieldToggle ? () => onFieldToggle(field.id) : undefined}
              draggable={onFieldOrderChange !== undefined}
              isDragging={draggedFieldId === field.id}
              isDragOver={dragOverFieldId === field.id}
              onDragStart={onFieldOrderChange !== undefined ? () => handleDragStart(field.id) : undefined}
              onDragOver={onFieldOrderChange !== undefined ? () => handleDragOver(field.id) : undefined}
              onDrop={onFieldOrderChange !== undefined ? () => handleDrop(field.id) : undefined}
              onDragEnd={onFieldOrderChange !== undefined ? handleDragEnd : undefined}
              onDelete={onDeleteField}
            />
          ))}
        </div>
      </div>
    </div>
  );
};