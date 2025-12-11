import React, { useState, useEffect } from 'react';
import { FormField } from '../../types/form';
import { FIELD_TYPES } from '../../types/fieldTypes';
import { Plus } from 'lucide-react';
import { 
  SingleLineText, 
  LongText, 
  Number, 
  Decimal, 
  Currency, 
  PhoneNumber, 
  Email, 
  URL, 
  Percent, 
  Duration, 
  Year, 
  DateField, 
  Time, 
  DateTime, 
  User, 
  JSONField 
} from './Fields';
import AdvancedDropdown from './dropdown/AdvancedDropdown';
import { 
  CURRENCY_OPTIONS, 
  PRECISION_OPTIONS, 
  DATE_FORMAT_OPTIONS, 
  TIME_FORMAT_OPTIONS, 
  DURATION_FORMAT_OPTIONS 
} from '../../utils/componentOptions';
import { currencyLocaleOptions } from '../../types/constants';

interface FieldConfigFormProps {
  fieldType: string;
  config: any;
  onConfigChange: (newConfig: any) => void;
  description?: string;
  onDescriptionChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onDescriptionBlur?: () => void;
}

export const FieldConfigForm: React.FC<FieldConfigFormProps> = ({
  fieldType,
  config,
  onConfigChange,
  description = '',
  onDescriptionChange,
  onDescriptionBlur
}) => {
  const [showDefaults, setShowDefaults] = useState<Record<string, boolean>>({});

  const toggleDefault = (key: string) => {
    setShowDefaults(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateConfig = (updates: any) => {
    onConfigChange({ ...config, ...updates });
  };

  const renderConfigForType = () => {
    switch (fieldType) {
      case 'text':
        return (
          <div className="space-y-4">
            <button 
              className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]" 
              onClick={() => toggleDefault('text')}
            >
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showDefaults.text && (
              <SingleLineText
                value={config.defaultValue || ''}
                onChange={value => updateConfig({ defaultValue: value })}
                placeholder="Enter default text value"
                isBorder={true}
              />
            )}
          </div>
        );

      case 'longText':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                className="checkbox-primary-brand" 
                checked={config.richText || false}
                onChange={e => updateConfig({ richText: e.target.checked })}
              />
              <label className="text-sm font-medium text-[var(--color-gray-700)]">Rich text</label>
            </div>
            <button 
              className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]" 
              onClick={() => toggleDefault('longText')}
            >
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showDefaults.longText && (
              <LongText
                value={config.defaultValue || ''}
                onChange={value => updateConfig({ defaultValue: value })}
                placeholder="Enter default text value"
                minRows={4}
                isBorder={true}
              />
            )}
          </div>
        );

      case 'number':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                className="checkbox-primary-brand" 
                checked={config.showThousands || false}
                onChange={e => updateConfig({ showThousands: e.target.checked })}
              />
              <label className="text-sm font-medium text-[var(--color-gray-700)]">Show thousands separator</label>
            </div>
            <button 
              className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]" 
              onClick={() => toggleDefault('number')}
            >
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showDefaults.number && (
              <Number
                value={config.defaultValue || ''}
                onChange={value => updateConfig({ defaultValue: value?.toString() || '' })}
                config={{ showThousands: config.showThousands }}
                isBorder={true}
              />
            )}
          </div>
        );

      case 'decimal':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">Precision</label>
              <AdvancedDropdown
                options={PRECISION_OPTIONS}
                value={config.precision || '1.0'}
                onChange={(val) => updateConfig({ precision: val })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                className="checkbox-primary-brand" 
                checked={config.showThousands || false}
                onChange={e => updateConfig({ showThousands: e.target.checked })}
              />
              <label className="text-sm font-medium text-[var(--color-gray-700)]">Show thousands separator</label>
            </div>
            <button 
              className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]" 
              onClick={() => toggleDefault('decimal')}
            >
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showDefaults.decimal && (
              <Decimal
                value={parseFloat(config.defaultValue) || 0}
                onChange={(value: any) => updateConfig({ defaultValue: value })}
                showThousands={config.showThousands}
                config={{ precision: parseInt(config.precision) }}
                isBorder={true}
                allowEdit={false}
              />
            )}
          </div>
        );

      case 'currency':
        return (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">Currency Locale</label>
                <AdvancedDropdown
                  options={currencyLocaleOptions}
                  value={config.currencyLocale || 'en-US'}
                  onChange={(val) => updateConfig({ currencyLocale: val })}
                  placeholder="Select Locale"
                  searchable={true}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">Currency Type</label>
                <AdvancedDropdown
                  options={CURRENCY_OPTIONS}
                  value={config.currencyType || 'USD'}
                  onChange={(val) => updateConfig({ currencyType: val })}
                  placeholder="Select Currency"
                  searchable={true}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">Precision</label>
              <AdvancedDropdown
                options={PRECISION_OPTIONS}
                value={config.precision || '1.0'}
                onChange={(val) => updateConfig({ precision: val })}
                placeholder="Select precision"
              />
            </div>
            <button 
              className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]" 
              onClick={() => toggleDefault('currency')}
            >
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showDefaults.currency && (
              <Currency
                value={config.defaultValue}
                onChange={(value: any) => updateConfig({ defaultValue: value })}
                config={{
                  currencyType: config.currencyType,
                  currencyLocale: config.currencyLocale || 'en-US',
                  precision: config.precision
                }}
                isBorder={true}
              />
            )}
          </div>
        );

      case 'date':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">Date Format</label>
              <AdvancedDropdown
                options={DATE_FORMAT_OPTIONS}
                value={config.dateFormat || 'YYYY-MM-DD'}
                onChange={(val) => updateConfig({ dateFormat: val })}
              />
            </div>
            <button 
              className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]" 
              onClick={() => toggleDefault('date')}
            >
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showDefaults.date && (
              <DateField
                value={config.defaultValue || ''}
                onChange={value => updateConfig({ defaultValue: value })}
                config={{ dateFormat: config.dateFormat }}
                isBorder={true}
              />
            )}
          </div>
        );

      case 'time':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">Time Format</label>
              <AdvancedDropdown
                options={TIME_FORMAT_OPTIONS}
                value={config.timeFormat || 'HH:mm'}
                onChange={(val) => updateConfig({ timeFormat: val })}
              />
            </div>
            <button 
              className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]" 
              onClick={() => toggleDefault('time')}
            >
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showDefaults.time && (
              <Time
                value={config.defaultValue || ''}
                onChange={value => updateConfig({ defaultValue: value })}
                config={{ timeFormat: config.timeFormat }}
                isBorder={true}
              />
            )}
          </div>
        );

      case 'year':
        return (
          <div className="space-y-4">
            <button 
              className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]" 
              onClick={() => toggleDefault('year')}
            >
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showDefaults.year && (
              <Year
                value={config.defaultValue}
                onChange={value => updateConfig({ defaultValue: value })}
                isBorder={true}
              />
            )}
          </div>
        );

      case 'phoneNumber':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                className="checkbox-primary-brand" 
                checked={config.phoneValid || false}
                onChange={e => updateConfig({ phoneValid: e.target.checked })}
              />
              <label className="text-sm font-medium text-[var(--color-gray-700)]">Validate phone number format</label>
            </div>
            <button 
              className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]" 
              onClick={() => toggleDefault('phone')}
            >
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showDefaults.phone && (
              <PhoneNumber
                value={config.defaultValue || ''}
                onChange={value => updateConfig({ defaultValue: value })}
                config={{ phoneValid: config.phoneValid }}
                isBorder={true}
              />
            )}
          </div>
        );

      case 'email':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                className="checkbox-primary-brand" 
                checked={config.emailValid || false}
                onChange={e => updateConfig({ emailValid: e.target.checked })}
              />
              <label className="text-sm font-medium text-[var(--color-gray-700)]">Validate email format</label>
            </div>
            <button 
              className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]" 
              onClick={() => toggleDefault('email')}
            >
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showDefaults.email && (
              <Email
                value={config.defaultValue || ''}
                onChange={value => updateConfig({ defaultValue: value })}
                config={{ emailValid: config.emailValid }}
                isBorder={true}
              />
            )}
          </div>
        );

      case 'url':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                className="checkbox-primary-brand" 
                checked={config.urlValid || false}
                onChange={e => updateConfig({ urlValid: e.target.checked })}
              />
              <label className="text-sm font-medium text-[var(--color-gray-700)]">Validate URL format</label>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                className="checkbox-primary-brand" 
                checked={config.showIcon !== false}
                onChange={e => updateConfig({ showIcon: e.target.checked })}
              />
              <label className="text-sm font-medium text-[var(--color-gray-700)]">Show URL icon</label>
            </div>
            <button 
              className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]" 
              onClick={() => toggleDefault('url')}
            >
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showDefaults.url && (
              <URL
                value={config.defaultValue || ''}
                onChange={value => updateConfig({ defaultValue: value })}
                config={{ urlValid: config.urlValid, showIcon: config.showIcon }}
                isBorder={true}
              />
            )}
          </div>
        );

      case 'percent':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                className="checkbox-primary-brand" 
                checked={config.displayAsProgress || false}
                onChange={e => updateConfig({ displayAsProgress: e.target.checked })}
              />
              <label className="text-sm font-medium text-[var(--color-gray-700)]">Display as progress bar</label>
            </div>
            <button 
              className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]" 
              onClick={() => toggleDefault('percent')}
            >
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showDefaults.percent && (
              <Percent
                value={config.defaultValue || 0}
                onChange={value => updateConfig({ defaultValue: value })}
                config={{ displayAsProgress: config.displayAsProgress }}
                isBorder={true}
              />
            )}
          </div>
        );

      case 'duration':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">Duration Format</label>
              <AdvancedDropdown
                options={DURATION_FORMAT_OPTIONS}
                value={config.durationFormat || 'h:mm'}
                onChange={(val) => updateConfig({ durationFormat: val })}
              />
            </div>
            <button 
              className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]" 
              onClick={() => toggleDefault('duration')}
            >
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showDefaults.duration && (
              <Duration
                value={config.defaultValue || 0}
                onChange={value => updateConfig({ defaultValue: value })}
                config={{ durationFormat: config.durationFormat }}
                isBorder={true}
              />
            )}
          </div>
        );

      case 'user':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                className="checkbox-primary-brand" 
                checked={config.allowMultiple || false}
                onChange={e => updateConfig({ allowMultiple: e.target.checked })}
              />
              <label className="text-sm font-medium text-[var(--color-gray-700)]">Allow multiple users</label>
            </div>
            <button 
              className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]" 
              onClick={() => toggleDefault('user')}
            >
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showDefaults.user && (
              <User
                value={config.defaultValue}
                onChange={value => updateConfig({ defaultValue: value })}
                config={{
                  allowMultiple: config.allowMultiple,
                  showAvatar: true,
                }}
                isBorder={true}
                placeholder="Select users..."
              />
            )}
          </div>
        );

      case 'json':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                className="checkbox-primary-brand" 
                checked={config.prettyPrint !== false}
                onChange={e => updateConfig({ prettyPrint: e.target.checked })}
              />
              <label className="text-sm font-medium text-[var(--color-gray-700)]">Pretty print JSON</label>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                className="checkbox-primary-brand" 
                checked={config.collapsible !== false}
                onChange={e => updateConfig({ collapsible: e.target.checked })}
              />
              <label className="text-sm font-medium text-[var(--color-gray-700)]">Collapsible JSON</label>
            </div>
            <button 
              className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]" 
              onClick={() => toggleDefault('json')}
            >
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showDefaults.json && (
              <JSONField
                value={config.defaultValue}
                onChange={value => updateConfig({ defaultValue: value })}
                config={{ prettyPrint: config.prettyPrint, collapsible: config.collapsible }}
                isBorder={true}
              />
            )}
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-500">
            No additional configuration options for this field type.
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {renderConfigForType()}
      
      {onDescriptionChange && (
        <div>
          <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">Description</label>
          <textarea
            className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-lg text-sm outline-none field-component-focus resize-none"
            placeholder="Enter field description..."
            value={description}
            onChange={onDescriptionChange}
            onBlur={onDescriptionBlur}
            rows={3}
          />
        </div>
      )}
    </div>
  );
};