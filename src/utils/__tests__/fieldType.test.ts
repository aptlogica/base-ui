import { describe, it, expect } from 'vitest';
import { normalizeFieldType } from '../fieldType';

describe('fieldType', () => {
  describe('normalizeFieldType', () => {
    it('should normalize text field types', () => {
      expect(normalizeFieldType('text')).toBe('text');
      expect(normalizeFieldType('SingleLineText')).toBe('text');
      expect(normalizeFieldType('uuid')).toBe('text');
    });

    it('should normalize number field types', () => {
      expect(normalizeFieldType('number')).toBe('number');
      expect(normalizeFieldType('Number')).toBe('number');
    });

    it('should normalize decimal field types', () => {
      expect(normalizeFieldType('decimal')).toBe('decimal');
      expect(normalizeFieldType('Decimal')).toBe('decimal');
    });

    it('should normalize date/time field types', () => {
      expect(normalizeFieldType('date')).toBe('date');
      expect(normalizeFieldType('time')).toBe('time');
      expect(normalizeFieldType('datetime')).toBe('datetime');
      expect(normalizeFieldType('DateTime')).toBe('datetime');
      expect(normalizeFieldType('year')).toBe('year');
    });

    it('should normalize select field types', () => {
      expect(normalizeFieldType('select')).toBe('select');
      expect(normalizeFieldType('singleSelect')).toBe('select');
      expect(normalizeFieldType('singleselect')).toBe('select');
      expect(normalizeFieldType('radio')).toBe('select');
    });

    it('should normalize multi-select field types', () => {
      expect(normalizeFieldType('multiSelect')).toBe('multiSelect');
      expect(normalizeFieldType('multiselect')).toBe('multiSelect');
      expect(normalizeFieldType('dropdown')).toBe('multiSelect');
    });

    it('should normalize boolean field types', () => {
      expect(normalizeFieldType('boolean')).toBe('boolean');
      expect(normalizeFieldType('checkbox')).toBe('boolean');
    });

    it('should normalize long text field types', () => {
      expect(normalizeFieldType('longText')).toBe('longText');
      expect(normalizeFieldType('longtext')).toBe('longText');
      expect(normalizeFieldType('long_text')).toBe('longText');
      expect(normalizeFieldType('textarea')).toBe('longText');
      expect(normalizeFieldType('LongText')).toBe('longText');
    });

    it('should normalize attachment field types', () => {
      expect(normalizeFieldType('attachment')).toBe('attachment');
      expect(normalizeFieldType('file')).toBe('attachment');
    });

    it('should normalize email, phone, url field types', () => {
      expect(normalizeFieldType('email')).toBe('email');
      expect(normalizeFieldType('phoneNumber')).toBe('phoneNumber');
      expect(normalizeFieldType('phonenumber')).toBe('phoneNumber');
      expect(normalizeFieldType('url')).toBe('url');
    });

    it('should normalize special field types', () => {
      expect(normalizeFieldType('rating')).toBe('rating');
      expect(normalizeFieldType('currency')).toBe('currency');
      expect(normalizeFieldType('percent')).toBe('percent');
      expect(normalizeFieldType('duration')).toBe('duration');
      expect(normalizeFieldType('json')).toBe('json');
      expect(normalizeFieldType('user')).toBe('user');
      expect(normalizeFieldType('button')).toBe('button');
      expect(normalizeFieldType('links')).toBe('links');
      expect(normalizeFieldType('lookup')).toBe('lookup');
      expect(normalizeFieldType('formula')).toBe('formula');
    });

    it('should normalize timestamp field types', () => {
      expect(normalizeFieldType('createdTime')).toBe('createdTime');
      expect(normalizeFieldType('createdtime')).toBe('createdTime');
      expect(normalizeFieldType('lastModifiedTime')).toBe('lastModifiedTime');
      expect(normalizeFieldType('lastmodifiedtime')).toBe('lastModifiedTime');
      expect(normalizeFieldType('createdBy')).toBe('createdBy');
      expect(normalizeFieldType('createdby')).toBe('createdBy');
      expect(normalizeFieldType('lastModifiedBy')).toBe('lastModifiedBy');
      expect(normalizeFieldType('lastmodifiedby')).toBe('lastModifiedBy');
    });

    it('should handle case sensitivity', () => {
      expect(normalizeFieldType('TEXT')).toBe('text');
      expect(normalizeFieldType('NUMBER')).toBe('number');
      expect(normalizeFieldType('BOOLEAN')).toBe('boolean');
    });

    it('should handle empty or invalid types', () => {
      expect(normalizeFieldType('')).toBe('text');
      expect(normalizeFieldType('invalid')).toBe('text');
    });
  });
});
