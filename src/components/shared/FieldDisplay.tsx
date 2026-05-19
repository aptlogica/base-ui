// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
/* eslint-disable sonarjs/cognitive-complexity */
import React from 'react';
import {
  SingleLineText,
  DateField,
  Checkbox,
  Email,
  SingleSelect,
  MultiSelect,
  LongText,
  URLField,
  Rating,
  PhoneNumber,
  Currency,
  Percent,
  Duration,
  Decimal,
  Year,
  Time,
  DateTime,
  User,
  JSONField,
  AuditCreatedTime,
  AuditLastModifiedTime,
  AuditCreatedBy,
  AuditLastModifiedBy,
  LinksField,
  Formula,
  Lookup,
  Attachment,
  NumberField,
} from '../common/Fields';
import { normalizeFieldType } from '../../utils/fieldType';

interface FieldDisplayProps {
  field: {
    id?: string;
    title?: string;
    column_name?: string;
    type?: string;
    uidt?: string;
    system?: boolean;
    meta?: any;
    config?: any;
    model_id?: string; // For links field
  };
  value: any;
  currentRowId?: number;
  className?: string;
  rowData?: Record<string, any>;
  allColumns?: any[];
  hideActionButtons?: boolean;
}

export const FieldDisplay: React.FC<FieldDisplayProps> = ({
  field,
  value,
  currentRowId,
  className = '',
  rowData,
  allColumns,
  hideActionButtons = false
}) => {
  // Parse column meta for config (same logic as EditableTableCell)
  const parsedConfig = (() => {
    try {
      if (typeof field.meta === 'object' && field.meta !== null) {
        return field.meta;
      }
      if (typeof field.meta === 'string' && field.meta.trim()) {
        return JSON.parse(field.meta);
      }
      return field.config || {};
    } catch (error) {
      console.warn(error)
      return field.config || {};
    }
  })();

  // Get default value helper (same as EditableTableCell)
  const getDefaultValueFromConfig = (fieldConfig: any, fieldType: string): any => {
    if (!fieldConfig || typeof fieldConfig !== 'object') return '';
    if (fieldConfig.defaultValue !== undefined && fieldConfig.defaultValue !== null) {
      return fieldConfig.defaultValue;
    }

    const normalizedType = normalizeFieldType(fieldType);
    switch (normalizedType) {
      case 'boolean':
        return fieldConfig.checkboxDefault || false;
      case 'rating':
        return fieldConfig.ratingDefault || 0;
      case 'number':
      case 'decimal':
      case 'currency':
      case 'percent':
        return fieldConfig.defaultValue || '';
      case 'select':
        return fieldConfig.singleDefault || '';
      case 'multiSelect':
        return fieldConfig.multiDefault || [];
      case 'datetime':
        return fieldConfig.dateTimeDefault || '';
      case 'date':
        return fieldConfig.dateDefault || null;
      case 'time':
        return fieldConfig.timeDefault || '';
      case 'year':
        return fieldConfig.yearDefault || null;
      default:
        return fieldConfig.defaultValue || '';
    }
  };

  // Prioritize uidt over type for field type detection (uidt is the canonical identifier)
  const fieldType = normalizeFieldType(field.uidt || field.type || 'text');
  const isSystemField = field.system || false;

  // Helper to check if value is empty
  const isEmpty = (val: any): boolean => {
    if (val === null || val === undefined || val === '') return true;
    if (Array.isArray(val) && val.length === 0) return true;
    if (typeof val === 'object' && Object.keys(val).length === 0) return true;
    return false;
  };

  // Helper to get display value - show "-" for empty values (except for fields that handle empty states themselves)
  const getDisplayValue = (fieldType: string, val: any): any => {
    if (fieldType === 'duration') {
      if (isEmpty(val)) return '-';
      if (typeof val === 'number') return globalThis.Number.isFinite(val) ? val : '-';
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (!trimmed || trimmed === '-') return '-';
        const parsed = globalThis.Number(trimmed);
        return globalThis.Number.isFinite(parsed) ? parsed : '-';
      }
      return '-';
    }

    // Fields that shouldn't show "-" (they have their own empty state handling)
    const noDashFields = ['boolean', 'rating', 'user', 'attachment', 'links', 'multiSelect'];
    if (noDashFields.includes(fieldType)) {
      return val ?? getDefaultValueFromConfig(parsedConfig, fieldType);
    }
    
    // For other fields, show "-" if empty
    if (isEmpty(val) && !getDefaultValueFromConfig(parsedConfig, fieldType)) {
      return '-';
    }
    return val ?? getDefaultValueFromConfig(parsedConfig, fieldType);
  };

  const commonProps = {
    value: getDisplayValue(fieldType, value),
    onChange: () => {}, // No-op for display only
    disabled: true
  };

  // Render the appropriate field component (same switch as EditableTableCell)
  let renderedComponent: React.ReactNode;

  switch (fieldType) {
    case 'text':
      renderedComponent = (
        <SingleLineText
          {...commonProps}
          maxLength={255}
          config={parsedConfig}
          allowEdit={false}
          isBorder={false}
        />
      );
      break;
    case 'longText':
      renderedComponent = (
        <LongText
          value={getDisplayValue(fieldType, value)}
          onChange={() => {}}
          readOnly={true}
          config={{ ...parsedConfig, hideMaximizeButton: hideActionButtons }}
          allowEdit={false}
          isBorder={false}
        />
      );
      break;
    case 'number':
      renderedComponent = (
        <NumberField
          {...commonProps}
          config={parsedConfig}
          allowEdit={false}
          isBorder={false}
        />
      );
      break;
    case 'decimal': {
      let precision = 2;
      if (
        parsedConfig?.precision &&
        typeof parsedConfig.precision === 'string' &&
        parsedConfig.precision.includes('.')
      ) {
        const parts = parsedConfig.precision.split('.');
        precision = parts[1] ? parts[1].length : 2;
      }
      renderedComponent = commonProps.value === '-' ? (
        <div className="w-full px-3 py-2 text-sm bg-[var(--color-alpha-white)] rounded-lg text-muted-foreground">-</div>
      ) : (
        <Decimal
          {...commonProps}
          decimals={precision}
          showThousands={parsedConfig?.showThousands}
          config={{ ...parsedConfig, precision }}
          allowEdit={false}
          isBorder={false}
        />
      );
      break;
    }
    case 'boolean': {
      // Normalize value to boolean - handle old text values when field type was changed
      let normalizedValue: boolean;
      if (value === null || value === undefined || value === '') {
        normalizedValue = getDefaultValueFromConfig(parsedConfig, fieldType) || false;
      } else if (typeof value === 'boolean') {
        normalizedValue = value;
      } else if (typeof value === 'string') {
        // Only accept explicit boolean strings, treat everything else as invalid (use default)
        const trimmed = value.trim().toLowerCase();
        if (trimmed === 'true' || trimmed === '1') {
          normalizedValue = true;
        } else if (trimmed === 'false' || trimmed === '0' || trimmed === 'null') {
          normalizedValue = getDefaultValueFromConfig(parsedConfig, fieldType) || false;
        } else {
          // For any other string (like old text values "xyz"), treat as invalid and use default
          normalizedValue = getDefaultValueFromConfig(parsedConfig, fieldType) || false;
        }
      } else {
        normalizedValue = Boolean(value);
      }
      renderedComponent = (
        <Checkbox
          {...commonProps}
          value={normalizedValue}
          icon={parsedConfig?.checkboxIcon}
          color={parsedConfig?.checkboxColor}
          config={{ ...parsedConfig, defaultValue: getDefaultValueFromConfig(parsedConfig, fieldType) }}
        />
      );
      break;
    }
    case 'currency': {
      let precision = 2;
      if (
        parsedConfig?.precision &&
        typeof parsedConfig.precision === 'string' &&
        parsedConfig.precision.includes('.')
      ) {
        const parts = parsedConfig.precision.split('.');
        precision = parts[1] ? parts[1].length : 2;
      }
      renderedComponent = commonProps.value === '-' ? (
        <div className="w-full px-3 py-2 text-sm bg-[var(--color-alpha-white)] rounded-lg text-muted-foreground">-</div>
      ) : (
        <Currency
          {...commonProps}
          config={{ ...parsedConfig, precision }}
          allowEdit={false}
          isBorder={false}
        />
      );
      break;
    }
    case 'percent':
      renderedComponent = (
        <Percent
          {...commonProps}
          config={parsedConfig}
          allowEdit={false}
          isBorder={false}
        />
      );
      break;
    case 'duration':
      renderedComponent = commonProps.value === '-' ? (
        <div className="w-full px-3 py-2 text-sm bg-[var(--color-alpha-white)] rounded-lg text-muted-foreground">-</div>
      ) : (
        <Duration
          {...commonProps}
          config={parsedConfig}
          allowEdit={false}
          isBorder={false}
        />
      );
      break;
    case 'year':
      renderedComponent = (
        <Year
          {...commonProps}
          config={parsedConfig}
          allowEdit={false}
          isBorder={false}
        />
      );
      break;
    case 'date':
      renderedComponent = (
        <DateField
          {...commonProps}
          format={parsedConfig?.dateFormat || 'YYYY-MM-DD'}
          config={parsedConfig}
          allowEdit={false}
          isBorder={false}
        />
      );
      break;
    case 'datetime':
      if (commonProps.value === '-') {
        renderedComponent = (
          <div className="w-full px-3 py-2 text-sm bg-[var(--color-alpha-white)] rounded-lg text-muted-foreground">-</div>
        );
      } else if (isSystemField) {
        renderedComponent = (
          <div className="w-full px-3 py-2 text-sm text-muted-foreground cursor-not-allowed">
            {value ? new Date(value).toLocaleString() : getDisplayValue(fieldType, value)}
          </div>
        );
      } else {
        renderedComponent = (
          <DateTime
            {...commonProps}
            config={parsedConfig}
            allowEdit={false}
            isBorder={false}
          />
        );
      }
      break;
    case 'time':
      renderedComponent = (
        <Time
          {...commonProps}
          config={parsedConfig}
          allowEdit={false}
          isBorder={false}
        />
      );
      break;
    case 'email':
      renderedComponent = (
        <Email
          {...commonProps}
          config={parsedConfig}
          allowEdit={false}
          isBorder={false}
        />
      );
      break;
    case 'phoneNumber':
      renderedComponent = (
        <PhoneNumber
          {...commonProps}
          config={parsedConfig}
          allowEdit={false}
          isBorder={false}
        />
      );
      break;
    case 'url':
      renderedComponent = commonProps.value === '-' ? (
        <div className="w-full px-3 py-2 text-sm bg-[var(--color-alpha-white)] rounded-lg text-muted-foreground">-</div>
      ) : (
        <URLField
          {...commonProps}
          config={{ ...parsedConfig, showIcon: !hideActionButtons }}
          allowEdit={false}
          isBorder={false}
        />
      );
      break;
    case 'select':
      renderedComponent = (
        <SingleSelect
          {...commonProps}
          options={parsedConfig?.options || []}
          config={parsedConfig}
          allowEdit={false}
          isBorder={false}
          disabled={false}
        />
      );
      break;
    case 'multiSelect':
      // Safely parse multiSelect value - handle both string and array formats
      { let multiSelectValue: any[] = [];
      try {
        if (Array.isArray(value)) {
          multiSelectValue = value;
        } else if (typeof value === 'string' && value.trim()) {
          multiSelectValue = JSON.parse(value);
          if (!Array.isArray(multiSelectValue)) {
            multiSelectValue = [];
          }
        }
      } catch (e) {
        // If parsing fails, default to empty array
        console.warn(e);
        multiSelectValue = [];
      }
      renderedComponent = (
        <MultiSelect
          value={multiSelectValue}
          onChange={() => {}}
          options={parsedConfig?.options || []}
          maxSelections={10}
          config={parsedConfig}
          allowEdit={false}
          isBorder={false}
        />
      );
      break; }
    case 'rating':
      renderedComponent = (
        <Rating
          {...commonProps}
          max={parsedConfig?.ratingMax || 5}
          config={parsedConfig}
        />
      );
      break;
    case 'user':
      renderedComponent = <User {...commonProps} config={parsedConfig} readOnly={true} />;
      break;
    case 'json':
      renderedComponent = isEmpty(value) ? (
        <div className="w-full px-3 py-2 text-sm bg-[var(--color-alpha-white)] rounded-lg text-muted-foreground">-</div>
      ) : (
        <JSONField {...commonProps} config={{ ...parsedConfig, hideMaximizeButton: hideActionButtons }} />
      );
      break;
    case 'createdTime':
      renderedComponent = (
        <AuditCreatedTime
          {...commonProps}
          config={parsedConfig}
          allowEdit={false}
          isBorder={false}
        />
      );
      break;
    case 'lastModifiedTime':
      renderedComponent = (
        <AuditLastModifiedTime
          {...commonProps}
          config={parsedConfig}
          allowEdit={false}
          isBorder={false}
        />
      );
      break;
    case 'createdBy':
      renderedComponent = <AuditCreatedBy />;
      break;
    case 'lastModifiedBy':
      renderedComponent = <AuditLastModifiedBy />;
      break;
    case 'links':
      renderedComponent = (
        <LinksField
          value={value}
          onChange={() => {}}
          field={{
            id: field.id || '',
            title: field.title || '',
            meta: parsedConfig,
          }}
          disabled={true}
          currentRowId={currentRowId}
          currentTableId={field.model_id}
        />
      );
      break;
    case 'lookup':
      renderedComponent = <Lookup value={value} isBorder={false} field={field} />;
      break;
    case 'formula':
      renderedComponent = (
        <Formula
          {...commonProps}
          config={parsedConfig}
          columns={allColumns || []}
          isBorder={false}
          disabled={true}
          rowData={rowData}
          allColumns={allColumns}
        />
      );
      break;
    case 'attachment':
      renderedComponent = (
        <Attachment
          {...commonProps}
          config={parsedConfig}
          model_id={field.model_id}
          column_id={field.id}
          row_id={currentRowId}
          isBorder={false}
          disabled={true}
          showPreview={!hideActionButtons}
        />
      );
      break;
    default:
      renderedComponent = (
        <SingleLineText
          {...commonProps}
          allowEdit={false}
          isBorder={false}
        />
      );
  }

  return <div className={className}>{renderedComponent}</div>;
};

