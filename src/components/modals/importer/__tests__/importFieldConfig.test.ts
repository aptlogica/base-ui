import { describe, it, expect } from 'vitest';
import { FieldType } from '../../../../types/fieldTypes';
import {
  ALLOWED_IMPORT_FIELD_TYPES,
  normalizeImportFieldType,
  getAllowedImportFieldOptions,
  getImportFieldDataType,
  getImportFieldMeta,
} from '../importFieldConfig';

describe('importFieldConfig', () => {
  describe('ALLOWED_IMPORT_FIELD_TYPES', () => {
    it('should include text as an allowed import field type', () => {
      expect(ALLOWED_IMPORT_FIELD_TYPES).toContain(FieldType.Text);
    });

    it('should not include select as an allowed import field type', () => {
      expect(ALLOWED_IMPORT_FIELD_TYPES).not.toContain(FieldType.Select);
    });
  });

  describe('normalizeImportFieldType', () => {
    it('should return the same field type when it is allowed', () => {
      const result = normalizeImportFieldType(FieldType.Email);

      expect(result).toBe(FieldType.Email);
    });

    it('should return text when field type is undefined', () => {
      const result = normalizeImportFieldType(undefined);

      expect(result).toBe(FieldType.Text);
    });

    it('should return text when field type is not allowed', () => {
      const result = normalizeImportFieldType(FieldType.Select);

      expect(result).toBe(FieldType.Text);
    });

    it('should return text when field type is an empty string', () => {
      const result = normalizeImportFieldType('');

      expect(result).toBe(FieldType.Text);
    });
  });

  describe('getAllowedImportFieldOptions', () => {
    it('should return one option per allowed import field type', () => {
      const options = getAllowedImportFieldOptions();

      expect(options).toHaveLength(ALLOWED_IMPORT_FIELD_TYPES.length);
    });

    it('should include a label for the text field option', () => {
      const options = getAllowedImportFieldOptions();
      const textOption = options.find((option) => option.key === FieldType.Text);

      expect(textOption?.label).toBe('Single line text');
    });

    it('should include the field type key for each option', () => {
      const options = getAllowedImportFieldOptions();
      const numberOption = options.find((option) => option.key === FieldType.Number);

      expect(numberOption?.key).toBe(FieldType.Number);
    });
  });

  describe('getImportFieldDataType', () => {
    it('should return INTEGER for number field type', () => {
      const result = getImportFieldDataType(FieldType.Number);

      expect(result).toBe('INTEGER');
    });

    it('should return INTEGER for year field type', () => {
      const result = getImportFieldDataType(FieldType.Year);

      expect(result).toBe('INTEGER');
    });

    it('should return NUMERIC for decimal field type', () => {
      const result = getImportFieldDataType(FieldType.Decimal);

      expect(result).toBe('NUMERIC');
    });

    it('should return NUMERIC for currency field type', () => {
      const result = getImportFieldDataType(FieldType.Currency);

      expect(result).toBe('NUMERIC');
    });

    it('should return NUMERIC for percent field type', () => {
      const result = getImportFieldDataType(FieldType.Percent);

      expect(result).toBe('NUMERIC');
    });

    it('should return BOOLEAN for boolean field type', () => {
      const result = getImportFieldDataType(FieldType.Boolean);

      expect(result).toBe('BOOLEAN');
    });

    it('should return INT for rating field type', () => {
      const result = getImportFieldDataType(FieldType.Rating);

      expect(result).toBe('INT');
    });

    it('should return TEXT for text field type', () => {
      const result = getImportFieldDataType(FieldType.Text);

      expect(result).toBe('TEXT');
    });

    it('should return TEXT for an unsupported field type', () => {
      const result = getImportFieldDataType(FieldType.Select);

      expect(result).toBe('TEXT');
    });
  });

  describe('getImportFieldMeta', () => {
    it('should return richText false for long text field type', () => {
      const result = getImportFieldMeta(FieldType.LongText);

      expect(result).toEqual({ richText: false });
    });

    it('should return showThousands false for number field type', () => {
      const result = getImportFieldMeta(FieldType.Number);

      expect(result).toEqual({ showThousands: false });
    });

    it('should return precision for decimal field type', () => {
      const result = getImportFieldMeta(FieldType.Decimal);

      expect(result).toEqual({ precision: '1.0', showThousands: false });
    });

    it('should return checkbox defaults for boolean field type', () => {
      const result = getImportFieldMeta(FieldType.Boolean);

      expect(result).toEqual({ color: 'green', defaultValue: false, icon: 'check' });
    });

    it('should return currency locale for currency field type', () => {
      const result = getImportFieldMeta(FieldType.Currency);

      expect(result).toEqual({ currencyLocale: 'en-US', currencyType: 'USD', precision: '1.0' });
    });

    it('should return progress settings for percent field type', () => {
      const result = getImportFieldMeta(FieldType.Percent);

      expect(result).toEqual({ displayAsProgress: false, progressColor: 'blue' });
    });

    it('should return emailValid false for email field type', () => {
      const result = getImportFieldMeta(FieldType.Email);

      expect(result).toEqual({ emailValid: false });
    });

    it('should return phoneValid false for phone number field type', () => {
      const result = getImportFieldMeta(FieldType.PhoneNumber);

      expect(result).toEqual({ phoneValid: false });
    });

    it('should return urlValid false for url field type', () => {
      const result = getImportFieldMeta(FieldType.URL);

      expect(result).toEqual({ urlValid: false });
    });

    it('should return rating settings for rating field type', () => {
      const result = getImportFieldMeta(FieldType.Rating);

      expect(result).toEqual({
        ratingColor: 'yellow',
        ratingDefault: 0,
        ratingDescription: '',
        ratingIcon: 'star',
        ratingMax: 5,
      });
    });

    it('should return empty object for text field type', () => {
      const result = getImportFieldMeta(FieldType.Text);

      expect(result).toEqual({});
    });

    it('should return empty object for an unsupported field type', () => {
      const result = getImportFieldMeta(FieldType.Select);

      expect(result).toEqual({});
    });
  });
});
