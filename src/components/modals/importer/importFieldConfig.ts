// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { FieldType, FIELD_TYPES } from '../../../types/fieldTypes';

export const ALLOWED_IMPORT_FIELD_TYPES = [
  FieldType.Text,
  FieldType.LongText,
  FieldType.Number,
  FieldType.Decimal,
  FieldType.Boolean,
  FieldType.Currency,
  FieldType.Percent,
  FieldType.Year,
  FieldType.Email,
  FieldType.PhoneNumber,
  FieldType.URL,
  FieldType.Rating,
  FieldType.JSON,
] as const;

export type AllowedImportFieldType = (typeof ALLOWED_IMPORT_FIELD_TYPES)[number];

const ALLOWED_IMPORT_FIELD_SET = new Set<string>(ALLOWED_IMPORT_FIELD_TYPES);

export const normalizeImportFieldType = (fieldType?: string): AllowedImportFieldType => {
  if (fieldType && ALLOWED_IMPORT_FIELD_SET.has(fieldType)) {
    return fieldType as AllowedImportFieldType;
  }

  return FieldType.Text;
};

export const getAllowedImportFieldOptions = () => {
  return ALLOWED_IMPORT_FIELD_TYPES.map((fieldType) => {
    const fieldConfig = FIELD_TYPES.find((item) => item.key === fieldType);
    return {
      key: fieldType,
      label: fieldConfig?.label || String(fieldType),
      icon: fieldConfig?.icon,
    };
  });
};

export const getImportFieldDataType = (fieldType: string): string => {
  switch (normalizeImportFieldType(fieldType)) {
    case FieldType.Number:
    case FieldType.Year:
      return 'INTEGER';
    case FieldType.Decimal:
    case FieldType.Currency:
    case FieldType.Percent:
      return 'NUMERIC';
    case FieldType.Boolean:
      return 'BOOLEAN';
    case FieldType.Rating:
      return 'INT';
    default:
      return 'TEXT';
  }
};

export const getImportFieldMeta = (fieldType: string): Record<string, unknown> => {
  switch (normalizeImportFieldType(fieldType)) {
    case FieldType.LongText:
      return { richText: false };
    case FieldType.Number:
      return { showThousands: false };
    case FieldType.Decimal:
      return { precision: '1.0', showThousands: false };
    case FieldType.Boolean:
      return { color: 'green', defaultValue: false, icon: 'check' };
    case FieldType.Currency:
      return { currencyLocale: 'en-US', currencyType: 'USD', precision: '1.0' };
    case FieldType.Percent:
      return { displayAsProgress: false, progressColor: 'blue' };
    case FieldType.Email:
      return { emailValid: false };
    case FieldType.PhoneNumber:
      return { phoneValid: false };
    case FieldType.URL:
      return { urlValid: false };
    case FieldType.Rating:
      return {
        ratingColor: 'yellow',
        ratingDefault: 0,
        ratingDescription: '',
        ratingIcon: 'star',
        ratingMax: 5,
      };
    default:
      return {};
  }
};
