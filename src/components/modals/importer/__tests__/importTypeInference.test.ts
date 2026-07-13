import { describe, it, expect } from 'vitest';
import { FieldType } from '../../../../types/fieldTypes';
import { inferImportDefaultValue, inferImportFieldType } from '../importTypeInference';

describe('importTypeInference', () => {
  describe('inferImportFieldType', () => {
    it('should infer number field type from integer samples', () => {
      const result = inferImportFieldType('count', ['10', '20']);

      expect(result).toBe(FieldType.Number);
    });

    it('should infer email field type from email samples', () => {
      const result = inferImportFieldType('contact', ['user@example.com']);

      expect(result).toBe(FieldType.Email);
    });

    it('should infer url field type from http url samples', () => {
      const result = inferImportFieldType('link', ['http://example.com']);

      expect(result).toBe(FieldType.URL);
    });

    it('should infer url field type from www url samples', () => {
      const result = inferImportFieldType('website', ['www.example.com']);

      expect(result).toBe(FieldType.URL);
    });

    it('should infer phone number field type from phone samples', () => {
      const result = inferImportFieldType('mobile', ['+1 (555) 123-4567']);

      expect(result).toBe(FieldType.PhoneNumber);
    });

    it('should infer boolean field type from column name prefix', () => {
      const result = inferImportFieldType('is_active', ['yes']);

      expect(result).toBe(FieldType.Boolean);
    });

    it('should infer date field type from date column name', () => {
      const result = inferImportFieldType('birth_date', ['06/15/2024']);

      expect(result).toBe(FieldType.Date);
    });

    it('should infer datetime field type from timestamp samples', () => {
      const result = inferImportFieldType('timestamp', ['2024-06-15T10:30:00.000Z']);

      expect(result).toBe(FieldType.DateTime);
    });

    it('should infer time field type from timestamp column name without datetime samples', () => {
      const result = inferImportFieldType('time_slot', ['morning']);

      expect(result).toBe(FieldType.Time);
    });

    it('should infer number field type for four digit year samples before year rule', () => {
      const result = inferImportFieldType('year', ['2024']);

      expect(result).toBe(FieldType.Number);
    });

    it('should infer currency field type from currency samples', () => {
      const result = inferImportFieldType('amount', ['$1,234.50']);

      expect(result).toBe(FieldType.Currency);
    });

    it('should infer percent field type from percent samples', () => {
      const result = inferImportFieldType('ratio', ['12.5%']);

      expect(result).toBe(FieldType.Percent);
    });

    it('should infer currency field type from decimal samples matching currency pattern', () => {
      const result = inferImportFieldType('score', ['1.5', '2.0']);

      expect(result).toBe(FieldType.Currency);
    });

    it('should infer json field type from json samples', () => {
      const result = inferImportFieldType('payload', ['{"a":1}']);

      expect(result).toBe(FieldType.JSON);
    });

    it('should default to text when samples are empty', () => {
      const result = inferImportFieldType('notes', []);

      expect(result).toBe(FieldType.Text);
    });
  });

  describe('inferImportDefaultValue', () => {
    it('should return false for boolean field type', () => {
      expect(inferImportDefaultValue(FieldType.Boolean)).toBe('false');
    });

    it('should return zero for number field type', () => {
      expect(inferImportDefaultValue(FieldType.Number)).toBe('0');
    });

    it('should return empty string for text field type', () => {
      expect(inferImportDefaultValue(FieldType.Text)).toBe('');
    });
  });
});
