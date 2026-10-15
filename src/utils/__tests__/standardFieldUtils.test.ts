import { describe, it, expect, vi } from 'vitest';
import {
  getStandardFieldType,
  getNormalizedFieldType,
  getFieldConfig,
  getFieldOptions,
  getFieldDisplayName,
  isFieldRequired,
  isFieldSystem,
  isFieldHidden,
  getFieldDefaultValue,
  createFieldRendererProps
} from '../standardFieldUtils';

describe('getStandardFieldType', () => {
  it('should return type if present', () => {
    expect(getStandardFieldType({ type: 'text' })).toBe('text');
  });

  it('should return uidt if type not present', () => {
    expect(getStandardFieldType({ uidt: 'singleLineText' })).toBe('singleLineText');
  });

  it('should return dt if type and uidt not present', () => {
    expect(getStandardFieldType({ dt: 'varchar' })).toBe('varchar');
  });

  it('should return default "text" if nothing present', () => {
    expect(getStandardFieldType({})).toBe('text');
  });

  it('should prioritize type over uidt', () => {
    expect(getStandardFieldType({ type: 'text', uidt: 'singleLineText' })).toBe('text');
  });
});

describe('getNormalizedFieldType', () => {
  it('should normalize field type', () => {
    expect(getNormalizedFieldType({ type: 'TEXT' })).toBe('text');
  });

  it('should use getStandardFieldType first', () => {
    // SINGLELINETEXT gets normalized to 'text' by normalizeFieldType
    expect(getNormalizedFieldType({ uidt: 'SINGLELINETEXT' })).toBe('text');
  });

  it('should normalize SingleLineText to text', () => {
    expect(getNormalizedFieldType({ uidt: 'SingleLineText' })).toBe('text');
  });
});

describe('getFieldConfig', () => {
  it('should return config if present', () => {
    const config = { options: [] };
    expect(getFieldConfig({ config })).toEqual(config);
  });

  it('should return meta if config not present', () => {
    const meta = { options: [] };
    expect(getFieldConfig({ meta })).toEqual(meta);
  });

  it('should return empty object if neither present', () => {
    expect(getFieldConfig({})).toEqual({});
  });

  it('should prioritize config over meta', () => {
    expect(getFieldConfig({ config: { a: 1 }, meta: { b: 2 } })).toEqual({ a: 1 });
  });
});

describe('getFieldOptions', () => {
  it('should return options from config', () => {
    const field = { config: { options: ['a', 'b'] } };
    expect(getFieldOptions(field)).toEqual(['a', 'b']);
  });

  it('should return options from meta', () => {
    const field = { meta: { options: ['c', 'd'] } };
    expect(getFieldOptions(field)).toEqual(['c', 'd']);
  });

  it('should return empty array if no options', () => {
    expect(getFieldOptions({})).toEqual([]);
  });

  it('should return empty array when options are null', () => {
    const field = { config: { options: null } };
    expect(getFieldOptions(field as any)).toEqual([]);
  });
});

describe('getFieldDisplayName', () => {
  it('should return name if present', () => {
    expect(getFieldDisplayName({ name: 'Field Name' })).toBe('Field Name');
  });

  it('should return title if name not present', () => {
    expect(getFieldDisplayName({ title: 'Field Title' })).toBe('Field Title');
  });

  it('should return column_name if name and title not present', () => {
    expect(getFieldDisplayName({ column_name: 'field_column' })).toBe('field_column');
  });

  it('should return "Untitled" if nothing present', () => {
    expect(getFieldDisplayName({})).toBe('Untitled');
  });

  it('should prioritize name over title', () => {
    expect(getFieldDisplayName({ name: 'Name', title: 'Title' })).toBe('Name');
  });
});

describe('isFieldRequired', () => {
  it('should return true for required field', () => {
    expect(isFieldRequired({ required: true })).toBe(true);
  });

  it('should return false for non-required field', () => {
    expect(isFieldRequired({ required: false })).toBe(false);
  });

  it('should return false if required not present', () => {
    expect(isFieldRequired({})).toBe(false);
  });
});

describe('isFieldSystem', () => {
  it('should return true for system field', () => {
    expect(isFieldSystem({ system: true })).toBe(true);
  });

  it('should return false for non-system field', () => {
    expect(isFieldSystem({ system: false })).toBe(false);
  });

  it('should return false if system not present', () => {
    expect(isFieldSystem({})).toBe(false);
  });
});

describe('isFieldHidden', () => {
  it('should return true if hidden is true', () => {
    expect(isFieldHidden({ hidden: true })).toBe(true);
  });

  it('should return true if is_hidden is true', () => {
    expect(isFieldHidden({ is_hidden: true })).toBe(true);
  });

  it('should return true if deleted is true', () => {
    expect(isFieldHidden({ deleted: true })).toBe(true);
  });

  it('should return false if none are true', () => {
    expect(isFieldHidden({})).toBe(false);
  });
});

describe('getFieldDefaultValue', () => {
  it('should ignore config defaults and return the type empty value', () => {
    expect(getFieldDefaultValue({ config: { defaultValue: 'default' } })).toBe('');
    expect(getFieldDefaultValue({ type: 'boolean', config: { checkboxDefault: true } })).toBe(false);
    expect(getFieldDefaultValue({ type: 'rating', config: { ratingDefault: 5 } })).toBe(0);
    expect(getFieldDefaultValue({ type: 'select', config: { singleDefault: 'option1' } })).toBe('');
    expect(getFieldDefaultValue({ type: 'multiSelect', config: { multiDefault: ['a', 'b'] } })).toEqual([]);
    expect(getFieldDefaultValue({ type: 'number', config: { defaultValue: 5 } })).toBe('');
    expect(getFieldDefaultValue({ type: 'date', config: { dateDefault: '2026-01-01' } })).toBe('');
    expect(getFieldDefaultValue({ type: 'email', config: { emailDefault: 'a@b.com' } })).toBe('');
  });

  it('should return the type empty value when config is empty', () => {
    expect(getFieldDefaultValue({ type: 'boolean', config: {} })).toBe(false);
    expect(getFieldDefaultValue({ type: 'multiSelect', config: {} })).toEqual([]);
    expect(getFieldDefaultValue({ type: 'text', config: {} })).toBe('');
  });
});
