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
  it('should return defaultValue from config if present', () => {
    const field = { config: { defaultValue: 'default' } };
    expect(getFieldDefaultValue(field)).toBe('default');
  });

  it('should return checkboxDefault for boolean type', () => {
    const field = { type: 'boolean', config: { checkboxDefault: true } };
    expect(getFieldDefaultValue(field)).toBe(true);
  });

  it('should return false for boolean if no checkboxDefault', () => {
    const field = { type: 'boolean', config: {} };
    expect(getFieldDefaultValue(field)).toBe(false);
  });

  it('should return ratingDefault for rating type', () => {
    const field = { type: 'rating', config: { ratingDefault: 5 } };
    expect(getFieldDefaultValue(field)).toBe(5);
  });

  it('should return singleDefault for select type', () => {
    const field = { type: 'select', config: { singleDefault: 'option1' } };
    expect(getFieldDefaultValue(field)).toBe('option1');
  });

  it('should return multiDefault for multiSelect type', () => {
    const field = { type: 'multiSelect', config: { multiDefault: ['a', 'b'] } };
    expect(getFieldDefaultValue(field)).toEqual(['a', 'b']);
  });

  it('should return empty array for multiSelect if no default', () => {
    const field = { type: 'multiSelect', config: {} };
    expect(getFieldDefaultValue(field)).toEqual([]);
  });

  it('should return empty string for text type', () => {
    const field = { type: 'text', config: {} };
    expect(getFieldDefaultValue(field)).toBe('');
  });

  it('should return number-like defaults for numeric types', () => {
    expect(getFieldDefaultValue({ type: 'number', config: { defaultValue: 5 } })).toBe(5);
    expect(getFieldDefaultValue({ type: 'decimal', config: { defaultValue: 1.2 } })).toBe(1.2);
    expect(getFieldDefaultValue({ type: 'currency', config: { defaultValue: 9 } })).toBe(9);
    expect(getFieldDefaultValue({ type: 'percent', config: { defaultValue: 12 } })).toBe(12);
  });

  it('should return specific defaults for time-based fields', () => {
    expect(getFieldDefaultValue({ type: 'datetime', config: { dateTimeDefault: '2026-01-01T00:00:00Z' } }))
      .toBe('2026-01-01T00:00:00Z');
    expect(getFieldDefaultValue({ type: 'date', config: { dateDefault: '2026-01-01' } }))
      .toBe('2026-01-01');
    expect(getFieldDefaultValue({ type: 'time', config: { timeDefault: '10:30' } }))
      .toBe('10:30');
    expect(getFieldDefaultValue({ type: 'year', config: { yearDefault: '2026' } }))
      .toBe('2026');
    expect(getFieldDefaultValue({ type: 'duration', config: { durationDefault: '120' } }))
      .toBe('120');
  });

  it('should return specific defaults for email and url', () => {
    expect(getFieldDefaultValue({ type: 'email', config: { emailDefault: 'a@b.com' } }))
      .toBe('a@b.com');
    expect(getFieldDefaultValue({ type: 'url', config: { urlDefault: 'https://example.com' } }))
      .toBe('https://example.com');
  });
});

describe('createFieldRendererProps', () => {
  it('should create props with correct structure', () => {
    const field = {
      type: 'text',
      name: 'Test Field',
      config: { options: [] },
      required: true
    };
    const onChange = vi.fn();
    const props = createFieldRendererProps(field, 'value', onChange);

    expect(props.type).toBe('text');
    expect(props.value).toBe('value');
    expect(props.onChange).toBe(onChange);
    expect(props.config).toHaveProperty('options');
    expect(props.config.required).toBe(true);
  });

  it('should merge additionalConfig', () => {
    const field = { type: 'text', config: {} };
    const props = createFieldRendererProps(
      field,
      'value',
      vi.fn(),
      { isBorder: true, className: 'custom-class', customProp: 'test' }
    );

    expect(props.isBorder).toBe(true);
    expect(props.className).toBe('custom-class');
    expect(props.config.customProp).toBe('test');
  });

  it('should include required and options in config', () => {
    const field = { uidt: 'select', required: true, config: { options: ['x'] } };
    const props = createFieldRendererProps(field, 'x', vi.fn(), { options: ['y'] });

    expect(props.config.required).toBe(true);
    // options should be derived from field via getFieldOptions
    expect(props.config.options).toEqual(['x']);
  });
});

