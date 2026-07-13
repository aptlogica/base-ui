import { describe, it, expect, vi, beforeEach } from 'vitest';
import Papa, { type ParseConfig, type ParseResult } from 'papaparse';
import { FieldType } from '../../../../types/fieldTypes';
import type { ImportPreview } from '../ImportTypes';
import { buildImportPreview, buildInitialMappings } from '../importPreviewBuilder';

vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn(),
  },
}));

const createFile = (name: string, content: string, type = 'text/plain'): File => {
  const file = new File([content], name, { type });
  Object.defineProperty(file, 'text', {
    value: () => Promise.resolve(content),
    configurable: true,
  });
  return file;
};

const createParseMeta = (fields: string[]) => ({
  fields,
  delimiter: ',',
  linebreak: '\n',
  aborted: false,
  truncated: false,
  cursor: 0,
});

interface PapaFileParseConfig {
  complete?: (results: ParseResult<Record<string, unknown>>) => void;
  error?: (error: Error) => void;
}

const mockPapaParseSuccess = (data: Record<string, unknown>[], fields: string[]) => {
  vi.mocked(Papa.parse).mockImplementation(((_file: typeof Papa.NODE_STREAM_INPUT, config?: ParseConfig<Record<string, unknown>>) => {
    const parseConfig = config as PapaFileParseConfig;
    const result: ParseResult<Record<string, unknown>> = {
      data,
      errors: [],
      meta: createParseMeta(fields),
    };
    parseConfig.complete?.(result);
  }) as typeof Papa.parse);
};

const mockPapaParseError = (message: string) => {
  vi.mocked(Papa.parse).mockImplementation(((_file: typeof Papa.NODE_STREAM_INPUT, config?: ParseConfig<Record<string, unknown>>) => {
    const parseConfig = config as PapaFileParseConfig;
    const result: ParseResult<Record<string, unknown>> = {
      data: [],
      errors: [{ type: 'Quotes', code: 'MissingQuotes', message, row: 0 }],
      meta: createParseMeta([]),
    };
    parseConfig.complete?.(result);
  }) as typeof Papa.parse);
};

const mockPapaParseReject = (error: Error) => {
  vi.mocked(Papa.parse).mockImplementation(((_file: typeof Papa.NODE_STREAM_INPUT, config?: ParseConfig<Record<string, unknown>>) => {
    const parseConfig = config as PapaFileParseConfig;
    parseConfig.error?.(error);
  }) as typeof Papa.parse);
};

describe('importPreviewBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildImportPreview', () => {
    it('should parse csv file and return preview columns and rows', async () => {
      mockPapaParseSuccess(
        [{ Name: 'Alice', Age: '30' }],
        ['Name', 'Age']
      );
      const file = createFile('contacts.csv', 'Name,Age\nAlice,30', 'text/csv');

      const preview = await buildImportPreview(file);

      expect(preview.columns).toHaveLength(2);
      expect(preview.rows).toHaveLength(1);
      expect(preview.totalRows).toBe(1);
    });

    it('should infer boolean field type from column name prefix in csv', async () => {
      mockPapaParseSuccess(
        [{ is_active: 'yes' }],
        ['is_active']
      );
      const file = createFile('flags.csv', 'is_active\nyes', 'text/csv');

      const preview = await buildImportPreview(file);

      expect(preview.columns[0]?.inferredFieldType).toBe(FieldType.Boolean);
    });

    it('should reject csv when papa parse reports a fatal error', async () => {
      mockPapaParseError('Invalid CSV format');
      const file = createFile('bad.csv', 'invalid', 'text/csv');

      await expect(buildImportPreview(file)).rejects.toThrow('Invalid CSV format');
    });

    it('should proceed when papa parse reports too few fields warning', async () => {
      mockPapaParseSuccess(
        [{ Name: 'Bob' }],
        ['Name']
      );
      vi.mocked(Papa.parse).mockImplementation(((_file: typeof Papa.NODE_STREAM_INPUT, config?: ParseConfig<Record<string, unknown>>) => {
        const parseConfig = config as PapaFileParseConfig;
        const result: ParseResult<Record<string, unknown>> = {
          data: [{ Name: 'Bob' }],
          errors: [{ type: 'FieldMismatch', code: 'TooFewFields', message: 'Too few fields', row: 1 }],
          meta: createParseMeta(['Name']),
        };
        parseConfig.complete?.(result);
      }) as typeof Papa.parse);
      const file = createFile('partial.csv', 'Name\nBob', 'text/csv');

      const preview = await buildImportPreview(file);

      expect(preview.rows).toHaveLength(1);
    });

    it('should reject csv when papa parse error callback is invoked', async () => {
      mockPapaParseReject(new Error('Parse failed'));
      const file = createFile('error.csv', 'data', 'text/csv');

      await expect(buildImportPreview(file)).rejects.toThrow('Parse failed');
    });

    it('should parse json array file and return preview', async () => {
      const content = JSON.stringify([{ title: 'Task 1' }, { title: 'Task 2' }]);
      const file = createFile('tasks.json', content, 'application/json');

      const preview = await buildImportPreview(file);

      expect(preview.columns).toHaveLength(1);
      expect(preview.rows).toHaveLength(2);
      expect(preview.totalRows).toBe(2);
    });

    it('should parse json file with data property', async () => {
      const content = JSON.stringify({ data: [{ sku: 'A1' }] });
      const file = createFile('products.json', content, 'application/json');

      const preview = await buildImportPreview(file);

      expect(preview.columns[0]?.label).toBe('sku');
      expect(preview.rows).toHaveLength(1);
    });

    it('should return empty preview for empty json array', async () => {
      const file = createFile('empty.json', '[]', 'application/json');

      const preview = await buildImportPreview(file);

      expect(preview).toEqual({ columns: [], rows: [], totalRows: 0 });
    });

    it('should return empty preview for json without array data', async () => {
      const file = createFile('object.json', '{"name":"test"}', 'application/json');

      const preview = await buildImportPreview(file);

      expect(preview).toEqual({ columns: [], rows: [], totalRows: 0 });
    });

    it('should throw error for unsupported file extension', async () => {
      const file = createFile('data.xlsx', 'binary', 'application/octet-stream');

      await expect(buildImportPreview(file)).rejects.toThrow(
        'Preview is currently available for CSV and JSON files only.'
      );
    });

    it('should slugify duplicate column labels into unique keys', async () => {
      mockPapaParseSuccess(
        [{ 'User Name': 'Alice', 'user name': 'Bob' }],
        ['User Name', 'user name']
      );
      const file = createFile('dupes.csv', 'User Name,user name\nAlice,Bob', 'text/csv');

      const preview = await buildImportPreview(file);

      expect(preview.columns[0]?.key).not.toBe(preview.columns[1]?.key);
    });

    it('should default inferred field type to text when samples are empty', async () => {
      mockPapaParseSuccess(
        [{ notes: '' }],
        ['notes']
      );
      const file = createFile('empty-samples.csv', 'notes\n', 'text/csv');

      const preview = await buildImportPreview(file);

      expect(preview.columns[0]?.inferredFieldType).toBe(FieldType.Text);
    });

    it('should infer json field type from json-like samples', async () => {
      const content = JSON.stringify([{ payload: '{"a":1}' }]);
      const file = createFile('payloads.json', content, 'application/json');

      const preview = await buildImportPreview(file);

      expect(preview.columns[0]?.inferredFieldType).toBe(FieldType.JSON);
    });
  });

  describe('buildInitialMappings', () => {
    it('should create a mapping entry for each preview column', () => {
      const preview: ImportPreview = {
        columns: [
          {
            key: 'name',
            label: 'Name',
            inferredFieldType: FieldType.Text,
            inferredDefaultValue: '',
          },
        ],
        rows: [{ name: 'Alice' }],
        totalRows: 1,
      };

      const mappings = buildInitialMappings(preview);

      expect(mappings.name).toBeDefined();
    });

    it('should set include to true for each column mapping', () => {
      const preview: ImportPreview = {
        columns: [
          {
            key: 'email',
            label: 'Email',
            inferredFieldType: FieldType.Email,
            inferredDefaultValue: '',
          },
        ],
        rows: [],
        totalRows: 0,
      };

      const mappings = buildInitialMappings(preview);

      expect(mappings.email?.include).toBe(true);
    });

    it('should use column label as source name', () => {
      const preview: ImportPreview = {
        columns: [
          {
            key: 'title',
            label: 'Title',
            inferredFieldType: FieldType.Text,
            inferredDefaultValue: '',
          },
        ],
        rows: [],
        totalRows: 0,
      };

      const mappings = buildInitialMappings(preview);

      expect(mappings.title?.sourceName).toBe('Title');
    });

    it('should normalize unsupported inferred field types to text', () => {
      const preview: ImportPreview = {
        columns: [
          {
            key: 'status',
            label: 'Status',
            inferredFieldType: FieldType.Select,
            inferredDefaultValue: '',
          },
        ],
        rows: [],
        totalRows: 0,
      };

      const mappings = buildInitialMappings(preview);

      expect(mappings.status?.fieldType).toBe(FieldType.Text);
    });

    it('should use inferred default value for boolean columns', () => {
      const preview: ImportPreview = {
        columns: [
          {
            key: 'active',
            label: 'Active',
            inferredFieldType: FieldType.Boolean,
            inferredDefaultValue: 'false',
          },
        ],
        rows: [],
        totalRows: 0,
      };

      const mappings = buildInitialMappings(preview);

      expect(mappings.active?.defaultValue).toBe('false');
    });

    it('should return empty object when preview has no columns', () => {
      const preview: ImportPreview = {
        columns: [],
        rows: [],
        totalRows: 0,
      };

      const mappings = buildInitialMappings(preview);

      expect(mappings).toEqual({});
    });
  });
});
