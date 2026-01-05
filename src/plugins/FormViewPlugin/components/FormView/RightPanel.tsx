import React, { useState } from 'react';
import { FormField, FormConfig } from '../../../../types/form';
import { FieldsList } from './FieldsList';
import { FieldEditor } from '../shared/FieldEditor';
import { AppearanceSettings } from '../shared/AppearanceSettings';
import { Plus, SquareArrowLeft } from 'lucide-react';
import { FIELD_TYPES } from '../../../../types/fieldTypes';

interface RightPanelProps {
  config: FormConfig;
  selectedFieldId: string | null;
  editingFieldId: string | null;
  onFieldSelect: (fieldId: string) => void;
  onAddField?: () => void;
  onConfigChange?: (config: FormConfig) => void;
  onFieldUpdate?: (fieldId: string, updates: Partial<FormField>) => void;
  onBackToFieldsList: () => void;
  onDeleteField?: (fieldId: string) => void;
  onFieldToggle?: (fieldId: string) => void;
  onFieldOrderChange?: (fields: any[]) => void;
  setVisibleAllFields?: (newState: boolean) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  config,
  selectedFieldId,
  editingFieldId,
  onFieldSelect,
  onAddField,
  onConfigChange,
  onFieldUpdate,
  onBackToFieldsList,
  onDeleteField,
  onFieldToggle,
  setVisibleAllFields,
  onFieldOrderChange
}) => {
  const [activeTab, setActiveTab] = useState<'fields' | 'appearance'>('fields');

  const editingField = config.fields.find(field => field.id === editingFieldId);

  if (editingFieldId && editingField) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={onBackToFieldsList}
              className="transition-colors border-r pr-2 text-primary-brand hover:text-text"
            >
            <SquareArrowLeft size={16} />
            </button>
            <span className="text-md font-medium text-primary ">Form</span>
            <span className="text-secondary">/</span>
            <span className="text-md font-medium text-primary">{editingField.name}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {onFieldUpdate && (
            <FieldEditor
              field={editingField}
              fields={config.fields}
              onFieldUpdate={(updates) => onFieldUpdate(editingField.id, updates)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex-shrink-0 bg-sidebar">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Form Fields</h2>
          <span className="text-sm text-secondary">{config.fields.length}/{FIELD_TYPES.length} Field</span>
        </div>
      </div>

      <div className="p-4 border-b flex-shrink-0 bg-sidebar">
        <div className="flex space-x-1 bg-[var(--color-gray-100)] rounded-xl p-1">
          <button
            onClick={() => setActiveTab('fields')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'fields'
                ? 'bg-card text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Fields
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'appearance'
                ? 'bg-card text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>Style</span>
            </div>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'fields' && (
          <FieldsList
            fields={config.fields}
            selectedFieldId={selectedFieldId}
            onFieldSelect={onFieldSelect}
            onFieldOrderChange={onFieldOrderChange}
            onFieldToggle={onFieldToggle ? (fieldId: string) => onFieldToggle(fieldId) : undefined}
            onDeleteField={onDeleteField}
            setVisibleAllFields={setVisibleAllFields}
          />
        )}

        {activeTab === 'appearance' && (
          <div className="p-4 overflow-y-auto h-full">
            {onConfigChange && (
              <AppearanceSettings
                appearance={config.appearance}
                onChange={(appearance) => onConfigChange({ appearance })}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
