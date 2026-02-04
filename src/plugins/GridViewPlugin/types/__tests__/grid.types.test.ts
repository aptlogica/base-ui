import { describe, it, expect } from 'vitest';
import type {
  GridTable,
  GridColumn,
  GridRecord,
  GridColumnConfig,
  GridSelectOption,
  GridValidationRule,
  AttachmentFile,
  GridFieldType,
  SortState,
  FilterState,
} from '../grid.types';

describe('GridViewPlugin Types', () => {
  describe('GridTable', () => {
    it('should have correct structure', () => {
      const table: GridTable = {
        id: 'table-1',
        title: 'Test Table',
        description: 'A test table',
        base_id: 'base-1',
        workspace_id: 'workspace-1',
      };

      expect(table.id).toBe('table-1');
      expect(table.title).toBe('Test Table');
      expect(table.description).toBe('A test table');
      expect(table.base_id).toBe('base-1');
      expect(table.workspace_id).toBe('workspace-1');
    });

    it('should allow optional description', () => {
      const tableWithoutDescription: GridTable = {
        id: 'table-1',
        title: 'Test Table',
        base_id: 'base-1',
        workspace_id: 'workspace-1',
      };

      expect(tableWithoutDescription.description).toBeUndefined();
    });
  });

  describe('GridColumn', () => {
    it('should have correct structure with all properties', () => {
      const column: GridColumn = {
        id: 'col-1',
        title: 'Test Column',
        key: 'test_field',
        type: 'text',
        options: ['option1', 'option2'],
        meta: {
          description: 'Test field description',
          defaultValue: 'default',
        },
        config: {
          displayAsProgress: false,
          precision: 2,
        },
        isSystem: false,
        hidden: false,
      };

      expect(column.type).toBe('text');
      expect(column.options).toEqual(['option1', 'option2']);
      expect(column.meta?.description).toBe('Test field description');
      expect(column.config?.precision).toBe(2);
    });

    it('should support GridSelectOption format for options', () => {
      const selectOptions: GridSelectOption[] = [
        { id: '1', value: 'opt1', label: 'Option 1', color: '#ff0000' },
        { id: '2', value: 'opt2', label: 'Option 2' },
      ];

      const column: GridColumn = {
        id: 'col-1',
        title: 'Select Column',
        key: 'select_field',
        type: 'select',
        options: selectOptions,
      };

      expect(Array.isArray(column.options)).toBe(true);
      expect(column.options).toHaveLength(2);
    });

    it('should support all field types', () => {
      const fieldTypes: GridFieldType[] = [
        'text', 'longText', 'number', 'decimal', 'currency', 'percent',
        'date', 'datetime', 'time', 'duration', 'checkbox', 'select',
        'multiSelect', 'email', 'url', 'phoneNumber', 'rating',
        'attachment', 'user'
      ];

      fieldTypes.forEach(type => {
        const column: GridColumn = {
          id: `col-${type}`,
          title: `${type} Column`,
          key: `${type}_field`,
          type,
        };

        expect(column.type).toBe(type);
      });
    });
  });

  describe('GridRecord', () => {
    it('should support structured data format', () => {
      const record: GridRecord = {
        id: 'rec-1',
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          age: 30,
        },
        _meta: {
          id: 'rec-1',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
          deleted_at: null,
          position: 1,
          created_by: 'user-1',
          updated_by: 'user-2',
        },
      };

      expect(record.id).toBe('rec-1');
      expect(record.data?.name).toBe('John Doe');
      expect(record._meta?.created_at).toBe('2023-01-01T00:00:00Z');
    });

    it('should support legacy flat format', () => {
      const record: GridRecord = {
        id: 'rec-1',
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(record.id).toBe('rec-1');
      expect(record.name).toBe('John Doe');
      expect(record.email).toBe('john@example.com');
    });

    it('should allow optional meta properties', () => {
      const record: GridRecord = {
        id: 'rec-1',
        meta: {
          id: 'rec-1',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
          deleted_at: null,
          position: 1,
        },
      };

      expect(record.meta?.id).toBe('rec-1');
      expect(record.meta?.created_by).toBeUndefined();
    });
  });

  describe('GridColumnConfig', () => {
    it('should support all configuration options', () => {
      const config: GridColumnConfig = {
        displayAsProgress: true,
        precision: 2,
        currency: 'USD',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm:ss',
        options: ['option1', 'option2'],
        customProperty: 'custom value',
      };

      expect(config.displayAsProgress).toBe(true);
      expect(config.precision).toBe(2);
      expect(config.currency).toBe('USD');
      expect(config.customProperty).toBe('custom value');
    });

    it('should allow empty configuration', () => {
      const config: GridColumnConfig = {};

      expect(Object.keys(config)).toHaveLength(0);
    });
  });

  describe('GridValidationRule', () => {
    it('should support required validation', () => {
      const rule: GridValidationRule = {
        type: 'required',
        message: 'This field is required',
      };

      expect(rule.type).toBe('required');
      expect(rule.message).toBe('This field is required');
    });

    it('should support range validation with value', () => {
      const rule: GridValidationRule = {
        type: 'range',
        value: { min: 0, max: 100 },
        message: 'Value must be between 0 and 100',
      };

      expect(rule.type).toBe('range');
      expect(rule.value).toEqual({ min: 0, max: 100 });
    });

    it('should support pattern validation', () => {
      const rule: GridValidationRule = {
        type: 'pattern',
        value: '^[A-Za-z]+$',
        message: 'Only letters allowed',
      };

      expect(rule.type).toBe('pattern');
      expect(rule.value).toBe('^[A-Za-z]+$');
    });

    it('should support length validations', () => {
      const minLengthRule: GridValidationRule = {
        type: 'minLength',
        value: 5,
      };

      const maxLengthRule: GridValidationRule = {
        type: 'maxLength',
        value: 50,
      };

      expect(minLengthRule.type).toBe('minLength');
      expect(minLengthRule.value).toBe(5);
      expect(maxLengthRule.type).toBe('maxLength');
      expect(maxLengthRule.value).toBe(50);
    });
  });

  describe('AttachmentFile', () => {
    it('should have correct structure', () => {
      const file: AttachmentFile = {
        name: 'document.pdf',
        url: 'https://example.com/document.pdf',
        type: 'application/pdf',
        size: 1024576,
      };

      expect(file.name).toBe('document.pdf');
      expect(file.url).toBe('https://example.com/document.pdf');
      expect(file.type).toBe('application/pdf');
      expect(file.size).toBe(1024576);
    });

    it('should support optional File object', () => {
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      const attachment: AttachmentFile = {
        name: 'test.txt',
        url: 'blob:test-url',
        type: 'text/plain',
        size: 7,
        file: mockFile,
      };

      expect(attachment.file).toBe(mockFile);
    });
  });

  describe('State Types', () => {
    it('should define SortState correctly', () => {
      const sortState: SortState = {
        column: 'name',
        direction: 'asc',
      };

      expect(sortState.column).toBe('name');
      expect(sortState.direction).toBe('asc');

      const emptySort: SortState = {
        column: null,
        direction: 'desc',
      };

      expect(emptySort.column).toBeNull();
      expect(emptySort.direction).toBe('desc');
    });

    it('should define FilterState correctly', () => {
      // FilterState is a Record<string, string[]> for filter values by column
      const filterState: FilterState = {
        status: ['active', 'pending'],
        category: ['tech'],
      };

      expect(filterState.status).toEqual(['active', 'pending']);
      expect(filterState.category).toEqual(['tech']);
      expect(Object.keys(filterState)).toHaveLength(2);
    });
  });

  describe('Type compatibility', () => {
    it('should allow GridColumn to extend BaseColumn', () => {
      // Test that GridColumn properly omits and extends BaseColumn types
      const column: GridColumn = {
        id: 'col-1',
        title: 'Test Column',
        key: 'test_field',
        type: 'text', // This should be GridFieldType, not the base type
        position: 0,
        width: 200,
        isSystem: false,
        hidden: false,
        meta: {
          description: 'Test description',
        },
        config: {
          precision: 2,
        },
      };

      expect(column.type).toBe('text');
      expect(typeof column.meta).toBe('object');
      expect(typeof column.config).toBe('object');
    });

    it('should support GridSelectOption in column options', () => {
      const selectOptions: GridSelectOption[] = [
        { id: '1', value: 'val1', label: 'Label 1' },
        { id: '2', value: 'val2', label: 'Label 2', color: '#ff0000' },
      ];

      const stringOptions: string[] = ['option1', 'option2'];

      const columnWithSelectOptions: GridColumn = {
        id: 'col-select',
        title: 'Select Column',
        key: 'select_field',
        type: 'select',
        options: selectOptions,
      };

      const columnWithStringOptions: GridColumn = {
        id: 'col-string',
        title: 'String Column',
        key: 'string_field',
        type: 'multiSelect',
        options: stringOptions,
      };

      expect(Array.isArray(columnWithSelectOptions.options)).toBe(true);
      expect(Array.isArray(columnWithStringOptions.options)).toBe(true);
    });

    it('should support both structured and flat GridRecord formats', () => {
      const structuredRecord: GridRecord = {
        id: 'rec-1',
        data: {
          name: 'John',
          email: 'john@example.com',
        },
        _meta: {
          id: 'rec-1',
          created_at: '2023-01-01',
          updated_at: '2023-01-01',
          deleted_at: null,
          position: 1,
        },
      };

      const flatRecord: GridRecord = {
        id: 'rec-2',
        name: 'Jane',
        email: 'jane@example.com',
        created_at: '2023-01-01',
      };

      expect(structuredRecord.data?.name).toBe('John');
      expect(flatRecord.name).toBe('Jane');
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle empty or minimal objects', () => {
      const minimalColumn: GridColumn = {
        id: 'col-1',
        title: 'Minimal Column',
        key: 'minimal',
        type: 'text',
      };

      const minimalRecord: GridRecord = {
        id: 'rec-1',
      };

      const minimalConfig: GridColumnConfig = {};

      expect(minimalColumn.id).toBe('col-1');
      expect(minimalRecord.id).toBe('rec-1');
      expect(Object.keys(minimalConfig)).toHaveLength(0);
    });

    it('should support complex nested structures', () => {
      const complexRecord: GridRecord = {
        id: 'complex-rec',
        data: {
          nested: {
            deeply: {
              value: 'deep value',
            },
          },
          array: [1, 2, 3],
          mixed: {
            string: 'text',
            number: 42,
            boolean: true,
            null: null,
          },
        },
        _meta: {
          id: 'complex-rec',
          created_at: '2023-01-01',
          updated_at: '2023-01-01',
          deleted_at: null,
          position: 1,
          customMetaField: 'custom value',
        },
      };

      expect(complexRecord.data?.nested?.deeply?.value).toBe('deep value');
      expect(complexRecord.data?.array).toEqual([1, 2, 3]);
      expect(complexRecord._meta?.customMetaField).toBe('custom value');
    });
  });
});