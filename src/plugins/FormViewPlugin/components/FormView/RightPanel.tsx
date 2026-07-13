// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState } from 'react';
import { FormConfig } from '../../../../types/form';
import { FieldsList } from './FieldsList';
import { AppearanceSettings } from '../shared/AppearanceSettings';
import { FIELD_TYPES } from '../../../../types/fieldTypes';

interface RightPanelProps {
  config: FormConfig;
  selectedFieldId: string | null;
  onFieldSelect: (fieldId: string) => void;
  onConfigChange?: (config: FormConfig) => void;
  onDeleteField?: (fieldId: string) => void;
  onFieldToggle?: (fieldId: string) => void;
  onFieldOrderChange?: (fields: any[]) => void;
  setVisibleAllFields?: (newState: boolean) => void;
  isReadOnly?: boolean;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  config,
  selectedFieldId,
  onFieldSelect,
  onConfigChange,
  onDeleteField,
  onFieldToggle,
  setVisibleAllFields,
  onFieldOrderChange,
  isReadOnly = false
}) => {
  const [activeTab, setActiveTab] = useState<'fields' | 'appearance'>('fields');

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
            onFieldOrderChange={isReadOnly ? undefined : onFieldOrderChange}
            onFieldToggle={isReadOnly || !onFieldToggle ? undefined : (fieldId: string) => onFieldToggle(fieldId)}
            onDeleteField={isReadOnly ? undefined : onDeleteField}
            setVisibleAllFields={isReadOnly ? undefined : setVisibleAllFields}
          />
        )}

        {activeTab === 'appearance' && (
          <div className="p-4 overflow-y-auto h-full">
            {onConfigChange && !isReadOnly && (
              <AppearanceSettings
                appearance={config.appearance}
                onChange={(appearance) => onConfigChange({ ...config, appearance })}
              />
            )}
            {isReadOnly && (
              <div className="text-sm text-secondary">
                Appearance settings are not available in read-only mode.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
