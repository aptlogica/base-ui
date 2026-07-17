import { describe, expect, it } from 'vitest';

import type { GridColumn } from '../../../../types/grid.types';
import type {
  GridDataOperationContext,
  GridDataOperationPreviewResult,
  GridDataOperationState,
} from '../gridDataOperation.types';
import {
  applyGridDataOperationToRecords,
  buildGridDataOperationPreview,
  mergeColumnValues,
  normalizeCaseValue,
  normalizeCustomFormattingPattern,
  normalizeWhitespaceValue,
  removeFormattingValue,
  removeSpecialCharsValue,
  replaceTextValue,
} from '../gridDataOperationTransforms';

type PreviewRow = GridDataOperationPreviewResult['previewRows'][number];

const nameColumn: GridColumn = {
  id: 'name',
  key: 'name',
  column_name: 'name_api',
  title: 'Name',
  type: 'text',
};

const emailColumn: GridColumn = {
  id: 'email',
  key: 'email',
  column_name: 'email_api',
  title: 'Email',
  type: 'text',
};

const notesColumn: GridColumn = {
  id: 'notes',
  key: 'notes',
  column_name: 'notes_api',
  title: 'Notes',
  type: 'text',
};

const createState = (overrides: Partial<GridDataOperationState> = {}): GridDataOperationState => ({
  scope: 'all',
  selectedColumnIds: [],
  caseFormat: 'lowercase',
  spaceMode: 'both',
  formatting: 'currency',
  formattingPattern: '',
  findText: '',
  replaceText: '',
  matchingCase: 'match_case',
  duplicateAction: 'remove_row',
  duplicateKeepRule: 'keep_first',
  splitSourceColumnId: '',
  splitMode: 'separator',
  splitSeparatorType: 'space',
  splitCustomSeparator: '',
  splitMaxColumns: '2',
  splitFixedDirection: 'after',
  splitCharacterCount: '2',
    splitPattern: String.raw`\s+`,
  splitOutputMode: 'keep_original',
  splitPlacement: 'next_to_original',
  mergeFormat: 'space',
  mergeCustomSeparator: '',
  mergeColumnTitle: '',
  mergeKeepOriginalColumns: false,
  mergePlacement: 'next_to_original',
  charRemovalMode: 'symbols',
  customChar: '',
  extractMethod: 'extraction_type',
  extractType: 'email',
  extractStartAfter: '',
  extractEndBefore: '',
  extractKeepOriginalColumn: false,
  extractPlacement: 'next_to_original',
  fuzzySensitivity: 'medium',
  ...overrides,
});

const createTableData = (records: Array<Record<string, unknown>>) =>
  ({
    model: {
      id: 'model-1',
    },
    records,
  } as unknown as NonNullable<GridDataOperationContext['tableData']>);

const createContext = (overrides: Partial<GridDataOperationContext> = {}): GridDataOperationContext => ({
  actionId: 'case_normalization',
  columns: [nameColumn, emailColumn, notesColumn],
  tableData: createTableData([]),
  state: createState(),
  ...overrides,
});

const createPreviewRow = (
  id: string,
  values: Record<string, unknown>,
  overrides: Partial<PreviewRow> = {},
): PreviewRow => ({
  id,
  original: { ...values },
  values,
  changedColumns: [],
  rowState: 'unchanged',
  ...overrides,
});

const createPreview = (overrides: Partial<GridDataOperationPreviewResult> = {}): GridDataOperationPreviewResult => ({
  supported: true,
  previewRows: [],
  changedRowIds: [],
  totalRows: 0,
  previewCount: 0,
  affectedRows: 0,
  affectedCells: 0,
  affectedColumns: 0,
  actionId: 'case_normalization',
  ...overrides,
});

describe('normalizeCaseValue', () => {
  it('returns non-string values unchanged', () => {
    expect(normalizeCaseValue(123, 'lowercase')).toBe(123);
  });

  it('converts text to lowercase', () => {
    expect(normalizeCaseValue('MiXeD', 'lowercase')).toBe('mixed');
  });

  it('converts text to uppercase', () => {
    expect(normalizeCaseValue('MiXeD', 'uppercase')).toBe('MIXED');
  });

  it('converts text to title case', () => {
    expect(normalizeCaseValue('hello world', 'title_case')).toBe('Hello World');
  });

  it('converts text to sentence case', () => {
    expect(normalizeCaseValue('hello world. second line!', 'sentence_case')).toBe('Hello world. Second line!');
  });

  it('returns the original string for unknown formats', () => {
    expect(normalizeCaseValue('Stay Put', 'invalid' as GridDataOperationState['caseFormat'])).toBe('Stay Put');
  });
});

describe('normalizeWhitespaceValue', () => {
  it('returns non-string values unchanged', () => {
    expect(normalizeWhitespaceValue(true, 'both')).toBe(true);
  });

  it('removes leading whitespace', () => {
    expect(normalizeWhitespaceValue('   hello', 'leading')).toBe('hello');
  });

  it('removes trailing whitespace', () => {
    expect(normalizeWhitespaceValue('hello   ', 'trailing')).toBe('hello');
  });

  it('collapses extra whitespace', () => {
    expect(normalizeWhitespaceValue('hello   world', 'extra')).toBe('hello world');
  });

  it('trims both sides by default', () => {
    expect(normalizeWhitespaceValue('  hello  ', 'both')).toBe('hello');
  });
});

describe('replaceTextValue', () => {
  it('returns non-string values unchanged', () => {
    expect(replaceTextValue({ value: 'x' }, 'x', 'y', 'match_case')).toEqual({ value: 'x' });
  });

  it('returns the original value when find text is empty', () => {
    expect(replaceTextValue('hello', '', 'world', 'match_case')).toBe('hello');
  });

  it('replaces the entire value only when it matches exactly', () => {
    expect(replaceTextValue('HELLO', 'HELLO', 'hi', 'match_entire_value')).toBe('hi');
  });

  it('leaves the value unchanged when the entire value does not match', () => {
    expect(replaceTextValue('HELLO', 'hello', 'hi', 'match_entire_value')).toBe('HELLO');
  });

  it('replaces escaped text using case-insensitive matching', () => {
    expect(replaceTextValue('A.B and a.b', 'a.b', 'x', 'ignore_case')).toBe('x and x');
  });
});

describe('removeSpecialCharsValue', () => {
  it('returns non-string values unchanged', () => {
    expect(removeSpecialCharsValue(null, 'symbols', '')).toBeNull();
  });

  it('returns an empty string unchanged', () => {
    expect(removeSpecialCharsValue('', 'symbols', '')).toBe('');
  });

  it('returns the original string when custom removal has no characters', () => {
    expect(removeSpecialCharsValue('a@b#c', 'custom', '')).toBe('a@b#c');
  });

  it('removes custom characters with duplicates and regex symbols', () => {
    expect(removeSpecialCharsValue('a@b#c.$', 'custom', '@@#.$')).toBe('abc');
  });

  it('removes symbol characters using the built-in pattern', () => {
    expect(removeSpecialCharsValue('a@b#c!', 'symbols', '')).toBe('abc');
  });

  it('removes currency symbols using the built-in pattern', () => {
    expect(removeSpecialCharsValue('₹1,000', 'currency_symbols', '')).toBe('1,000');
  });

  it('removes brackets using the built-in pattern', () => {
    expect(removeSpecialCharsValue('(hello)', 'brackets', '')).toBe('hello');
  });

  it('removes punctuation using the built-in pattern', () => {
    expect(removeSpecialCharsValue('hello, world.', 'punctuation', '')).toBe('hello world');
  });
});

describe('normalizeCustomFormattingPattern', () => {
  it('splits and trims custom formatting patterns', () => {
    expect(normalizeCustomFormattingPattern(' #, \n$ ;  % ')).toEqual(['#', '$', '%']);
  });
});

describe('mergeColumnValues', () => {
  it('stringifies supported values and skips empty entries', () => {
    const circular: Record<string, unknown> = { name: 'loop' };
    circular.self = circular;

    expect(
      mergeColumnValues(
        [null, '', 1, true, 2n, new Date('2026-07-01T00:00:00.000Z'), { a: 1 }, circular],
        ' | ',
      ),
    ).toBe('1 | true | 2 | 2026-07-01T00:00:00.000Z | {"a":1}');
  });

  it('returns an empty string when every value is empty', () => {
    expect(mergeColumnValues([null, undefined, ''], ', ')).toBe('');
  });
});

describe('removeFormattingValue', () => {
  it('returns non-string values unchanged', () => {
    expect(removeFormattingValue(42, 'currency')).toBe(42);
  });

  it('removes currency characters', () => {
    expect(removeFormattingValue('$1,234', 'currency')).toBe('1234');
  });

  it('removes percentage characters', () => {
    expect(removeFormattingValue('12.5%', 'percentage')).toBe('12.5');
  });

  it('removes separator characters', () => {
    expect(removeFormattingValue('1,234,567', 'separator')).toBe('1234567');
  });

  it('removes phone formatting characters', () => {
    expect(removeFormattingValue('(555) 123-4567', 'phone')).toBe('5551234567');
  });

  it('normalizes formatted dates', () => {
    expect(removeFormattingValue('2026/07/01', 'date')).toBe('2026-07-01');
  });

  it('returns the original value when a date cannot be parsed', () => {
    expect(removeFormattingValue('not-a-date', 'date')).toBe('not-a-date');
  });

  it('removes custom formatting tokens from a single pattern', () => {
    expect(removeFormattingValue('A#B#C', 'custom', '#')).toBe('ABC');
  });

  it('removes custom formatting tokens from multiple patterns', () => {
    expect(removeFormattingValue('A#B$C', 'custom', '#, $')).toBe('ABC');
  });
});

describe('buildGridDataOperationPreview', () => {
  it('returns an unsupported preview unchanged for unknown actions', () => {
    const context = createContext({
      actionId: 'unknown_action' as GridDataOperationContext['actionId'],
      state: createState({ selectedColumnIds: ['name'] }),
      tableData: createTableData([{ id: '1', name: 'Alice' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        supported: false,
        actionId: 'unknown_action',
        previewCount: 1,
        affectedRows: 0,
        affectedCells: 0,
        affectedColumns: 0,
      }),
    );
  });

  it('normalizes selected case-sensitive text columns', () => {
    const context = createContext({
      actionId: 'case_normalization',
      state: createState({
        selectedColumnIds: ['name'],
        caseFormat: 'uppercase',
      }),
      tableData: createTableData([{ id: '1', name: 'Alice', email: 'alice@example.com' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        supported: true,
        actionId: 'case_normalization',
        affectedRows: 1,
        affectedCells: 1,
        affectedColumns: 1,
        previewRows: [
          expect.objectContaining({
            id: '1',
            rowState: 'changed',
            changedColumns: ['name'],
            values: expect.objectContaining({
              name: 'ALICE',
              email: 'alice@example.com',
            }),
          }),
        ],
      }),
    );
  });

  it('trims extra whitespace from the selected column', () => {
    const context = createContext({
      actionId: 'remove_extra_spaces',
      state: createState({
        selectedColumnIds: ['notes'],
        spaceMode: 'extra',
      }),
      tableData: createTableData([{ id: '1', notes: '  hello   world  ' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        actionId: 'remove_extra_spaces',
        affectedRows: 1,
        previewRows: [
          expect.objectContaining({
            values: expect.objectContaining({
              notes: 'hello world',
            }),
          }),
        ],
      }),
    );
  });

  it('replaces text using the selected column and case mode', () => {
    const context = createContext({
      actionId: 'find_replace',
      state: createState({
        selectedColumnIds: ['email'],
        findText: 'alice',
        replaceText: 'alyssa',
        matchingCase: 'ignore_case',
      }),
      tableData: createTableData([{ id: '1', email: 'Alice@example.com' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        actionId: 'find_replace',
        affectedRows: 1,
        affectedCells: 1,
        previewRows: [
          expect.objectContaining({
            changedColumns: ['email'],
            values: expect.objectContaining({
              email: 'alyssa@example.com',
            }),
          }),
        ],
      }),
    );
  });

  it('removes special characters from the selected column', () => {
    const context = createContext({
      actionId: 'remove_special_characters',
      state: createState({
        selectedColumnIds: ['notes'],
        charRemovalMode: 'custom',
        customChar: '@#',
      }),
      tableData: createTableData([{ id: '1', notes: '@hello#' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        actionId: 'remove_special_characters',
        affectedRows: 1,
        previewRows: [
          expect.objectContaining({
            values: expect.objectContaining({
              notes: 'hello',
            }),
          }),
        ],
      }),
    );
  });

  it('removes formatting from dates in the selected column', () => {
    const context = createContext({
      actionId: 'remove_formatting',
      state: createState({
        selectedColumnIds: ['notes'],
        formatting: 'date',
      }),
      tableData: createTableData([{ id: '1', notes: '2026/07/01' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        actionId: 'remove_formatting',
        affectedRows: 1,
        previewRows: [
          expect.objectContaining({
            values: expect.objectContaining({
              notes: '2026-07-01',
            }),
          }),
        ],
      }),
    );
  });

  it('marks duplicate rows for removal when duplicateAction removes rows', () => {
    const context = createContext({
      actionId: 'remove_duplicates',
      state: createState({
        selectedColumnIds: ['email'],
        duplicateAction: 'remove_row',
      }),
      tableData: createTableData([
        { id: '1', email: 'alice@example.com' },
        { id: '2', email: 'alice@example.com' },
      ]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        actionId: 'remove_duplicates',
        affectedRows: 1,
        changedRowIds: ['2'],
        previewRows: [
          expect.objectContaining({ id: '1', rowState: 'kept' }),
          expect.objectContaining({ id: '2', rowState: 'removed' }),
        ],
      }),
    );
  });

  it('clears duplicate values in place when duplicateAction keeps rows', () => {
    const context = createContext({
      actionId: 'remove_duplicates',
      state: createState({
        selectedColumnIds: ['email'],
        duplicateAction: 'remove_duplicates',
        duplicateKeepRule: 'keep_last',
      }),
      tableData: createTableData([
        { id: '1', email: 'alice@example.com' },
        { id: '2', email: 'alice@example.com' },
      ]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        actionId: 'remove_duplicates',
        affectedRows: 1,
        affectedCells: 1,
        previewRows: expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            rowState: 'changed',
            values: expect.objectContaining({
              email: '',
            }),
          }),
          expect.objectContaining({
            id: '2',
            rowState: 'kept',
          }),
        ]),
      }),
    );
  });

  it('splits a column by fixed length from the start of the string', () => {
    const context = createContext({
      actionId: 'split_column',
      columns: [nameColumn],
      state: createState({
        selectedColumnIds: ['name'],
        splitSourceColumnId: 'name',
        splitMode: 'fixed_length',
        splitFixedDirection: 'after',
        splitCharacterCount: '3',
        splitOutputMode: 'keep_original',
      }),
      tableData: createTableData([{ id: '1', name: 'abcdef' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        actionId: 'split_column',
        affectedRows: 1,
        affectedColumns: 2,
        virtualColumns: [
          expect.objectContaining({ id: 'name__split_1', title: 'Name Part 1' }),
          expect.objectContaining({ id: 'name__split_2', title: 'Name Part 2' }),
        ],
      }),
    );
  });

  it('returns an unchanged split preview when the source column is missing', () => {
    const context = createContext({
      actionId: 'split_column',
      state: createState({
        selectedColumnIds: ['name'],
        splitSourceColumnId: 'missing',
      }),
      tableData: createTableData([{ id: '1', name: 'Alice Smith' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        actionId: 'split_column',
        affectedRows: 0,
        affectedColumns: 0,
        previewRows: [
          expect.objectContaining({
            id: '1',
            rowState: 'unchanged',
          }),
        ],
      }),
    );
  });

  it('merges selected columns and keeps the original values when requested', () => {
    const context = createContext({
      actionId: 'merge_column',
      columns: [nameColumn, emailColumn],
      state: createState({
        selectedColumnIds: ['name', 'email'],
        mergeFormat: 'custom',
        mergeCustomSeparator: ' :: ',
        mergeColumnTitle: '',
        mergeKeepOriginalColumns: true,
      }),
      tableData: createTableData([{ id: '1', name: 'Alice', email: 'Stone' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        actionId: 'merge_column',
        affectedRows: 1,
        affectedCells: 1,
        affectedColumns: 1,
        virtualColumns: [
          expect.objectContaining({
            id: 'Name Email',
            title: 'Name Email',
          }),
        ],
        previewRows: [
          expect.objectContaining({
            values: expect.objectContaining({
              name: 'Alice',
              email: 'Stone',
              'Name Email': 'Alice :: Stone',
            }),
          }),
        ],
      }),
    );
  });

  it('returns an unchanged merge preview when fewer than two columns are selected', () => {
    const context = createContext({
      actionId: 'merge_column',
      state: createState({
        selectedColumnIds: ['name'],
      }),
      tableData: createTableData([{ id: '1', name: 'Alice' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        actionId: 'merge_column',
        affectedRows: 0,
        previewRows: [
          expect.objectContaining({
            rowState: 'unchanged',
          }),
        ],
      }),
    );
  });

  it('extracts text between delimiters into the source column', () => {
    const context = createContext({
      actionId: 'extract_substring',
      state: createState({
        selectedColumnIds: ['notes'],
        extractMethod: 'between_characters',
        extractStartAfter: '(',
        extractEndBefore: ')',
        extractKeepOriginalColumn: false,
      }),
      tableData: createTableData([{ id: '1', notes: 'Name (value)' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        actionId: 'extract_substring',
        affectedRows: 1,
        affectedCells: 1,
        previewRows: [
          expect.objectContaining({
            values: expect.objectContaining({
              notes: 'value',
            }),
          }),
        ],
      }),
    );
  });

  it('extracts domains when using extraction types', () => {
    const context = createContext({
      actionId: 'extract_substring',
      state: createState({
        selectedColumnIds: ['email'],
        extractMethod: 'extraction_type',
        extractType: 'domain',
        extractKeepOriginalColumn: true,
      }),
      tableData: createTableData([{ id: '1', email: 'alice@example.com https://www.serenibase.com' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        actionId: 'extract_substring',
        affectedRows: 1,
        virtualColumns: [
          expect.objectContaining({
            id: 'Extracted Domain',
            title: 'Extracted Domain',
          }),
        ],
      }),
    );
  });

  it('extracts keyword tokens from text', () => {
    const context = createContext({
      actionId: 'extract_substring',
      state: createState({
        selectedColumnIds: ['notes'],
        extractMethod: 'extraction_type',
        extractType: 'keywords',
        extractKeepOriginalColumn: false,
      }),
      tableData: createTableData([{ id: '1', notes: 'The quick brown fox jumps over the lazy dog' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        actionId: 'extract_substring',
        affectedRows: 1,
        previewRows: [
          expect.objectContaining({
            values: expect.objectContaining({
              notes: 'Quick, Brown, Fox, Jumps, Lazy, Dog',
            }),
          }),
        ],
      }),
    );
  });

  it('extracts mentions from text', () => {
    const context = createContext({
      actionId: 'extract_substring',
      state: createState({
        selectedColumnIds: ['notes'],
        extractMethod: 'extraction_type',
        extractType: 'mentions',
      }),
      tableData: createTableData([{ id: '1', notes: 'Ping @alice and @bob' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        previewRows: [
          expect.objectContaining({
            values: expect.objectContaining({
              notes: '@alice, @bob',
            }),
          }),
        ],
      }),
    );
  });

  it('extracts tags from text', () => {
    const context = createContext({
      actionId: 'extract_substring',
      state: createState({
        selectedColumnIds: ['notes'],
        extractMethod: 'extraction_type',
        extractType: 'tags',
      }),
      tableData: createTableData([{ id: '1', notes: 'Use #react and #typescript' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        previewRows: [
          expect.objectContaining({
            values: expect.objectContaining({
              notes: '#react, #typescript',
            }),
          }),
        ],
      }),
    );
  });

  it('extracts emoji from text', () => {
    const context = createContext({
      actionId: 'extract_substring',
      state: createState({
        selectedColumnIds: ['notes'],
        extractMethod: 'extraction_type',
        extractType: 'emoji',
      }),
      tableData: createTableData([{ id: '1', notes: 'Great job 😀🎉' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        previewRows: [
          expect.objectContaining({
            values: expect.objectContaining({
              notes: '😀, 🎉',
            }),
          }),
        ],
      }),
    );
  });

  it('extracts phone numbers from text', () => {
    const context = createContext({
      actionId: 'extract_substring',
      state: createState({
        selectedColumnIds: ['notes'],
        extractMethod: 'extraction_type',
        extractType: 'phone',
      }),
      tableData: createTableData([{ id: '1', notes: 'Call +1 555 111 2222 now' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        previewRows: [
          expect.objectContaining({
            values: expect.objectContaining({
              notes: '+1 555 111 2222',
            }),
          }),
        ],
      }),
    );
  });

  it('extracts prefixes from email text', () => {
    const context = createContext({
      actionId: 'extract_substring',
      state: createState({
        selectedColumnIds: ['email'],
        extractMethod: 'extraction_type',
        extractType: 'prefix',
      }),
      tableData: createTableData([{ id: '1', email: 'alice@example.com' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        previewRows: [
          expect.objectContaining({
            values: expect.objectContaining({
              email: 'alice',
            }),
          }),
        ],
      }),
    );
  });
});

describe('additional grid data operation coverage', () => {
  it('returns the trimmed string when whitespace mode is unknown', () => {
    expect(normalizeWhitespaceValue('  keep me  ', 'invalid' as GridDataOperationState['spaceMode'])).toBe('keep me');
  });

  it('uses case-sensitive matching when replacing text', () => {
    expect(replaceTextValue('a.b and A.B', 'a.b', 'x', 'match_case')).toBe('x and A.B');
  });

  it('parses date formatting from a compact custom-separated value', () => {
    expect(removeFormattingValue('2026x07x01', 'date')).toBe('2026-07-01');
  });

  it('returns the original value when custom formatting has no patterns', () => {
    expect(removeFormattingValue('A#B', 'custom', '')).toBe('A#B');
  });

  it('treats a null table as an empty record set', () => {
    const context = createContext({
      actionId: 'case_normalization',
      tableData: null,
      state: createState({
        selectedColumnIds: ['name'],
        caseFormat: 'uppercase',
      }),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        previewCount: 0,
        affectedRows: 0,
        affectedCells: 0,
      }),
    );
  });

  it('returns an unchanged duplicate preview when no columns are selected', () => {
    const context = createContext({
      actionId: 'remove_duplicates',
      state: createState({
        selectedColumnIds: [],
      }),
      tableData: createTableData([
        { id: '1', email: 'alice@example.com' },
        { id: '2', email: 'alice@example.com' },
      ]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        actionId: 'remove_duplicates',
        affectedRows: 0,
        previewRows: expect.arrayContaining([
          expect.objectContaining({ rowState: 'unchanged' }),
        ]),
      }),
    );
  });

  it('treats case-sensitive duplicate matching as distinct values', () => {
    const context = createContext({
      actionId: 'remove_duplicates',
      state: createState({
        selectedColumnIds: ['email'],
        duplicateAction: 'remove_duplicates_matchCase',
      }),
      tableData: createTableData([
        { id: '1', email: 'Alice@example.com' },
        { id: '2', email: 'alice@example.com' },
      ]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        affectedRows: 0,
        previewRows: expect.arrayContaining([
          expect.objectContaining({ id: '1', rowState: 'unchanged' }),
          expect.objectContaining({ id: '2', rowState: 'unchanged' }),
        ]),
      }),
    );
  });

  it('returns a split preview that preserves the original value when a custom separator is missing', () => {
    const context = createContext({
      actionId: 'split_column',
      columns: [nameColumn],
      state: createState({
        selectedColumnIds: ['name'],
        splitSourceColumnId: 'name',
        splitMode: 'separator',
        splitSeparatorType: 'custom',
        splitCustomSeparator: '',
      }),
      tableData: createTableData([{ id: '1', name: 'Alice Smith' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        affectedRows: 1,
        affectedCells: 2,
        affectedColumns: 2,
        previewRows: expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            rowState: 'changed',
            values: expect.objectContaining({
              name__split_1: 'Alice Smith',
              name__split_2: '',
            }),
          }),
        ]),
      }),
    );
  });

  it('splits using separators and replaces the original column when requested', () => {
    const splitColumn: GridColumn = {
      id: 'full_name',
      key: 'full_name_value',
      column_name: 'full_name_api',
      title: 'Full Name',
      type: 'text',
    };

    const context = createContext({
      actionId: 'split_column',
      columns: [splitColumn],
      state: createState({
        selectedColumnIds: ['full_name'],
        splitSourceColumnId: 'full_name',
        splitMode: 'separator',
        splitSeparatorType: 'comma',
        splitMaxColumns: '2',
        splitOutputMode: 'replace_original',
      }),
      tableData: createTableData([{ id: '1', full_name_value: 'a, b, c' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        affectedRows: 1,
        affectedCells: 2,
        affectedColumns: 3,
        virtualColumns: expect.arrayContaining([
          expect.objectContaining({ id: 'full_name', title: 'Full Name Part 1' }),
          expect.objectContaining({ id: 'full_name__split_2', title: 'Full Name Part 2' }),
        ]),
      }),
    );
  });

  it('returns a split preview when the pattern cannot be compiled', () => {
    const context = createContext({
      actionId: 'split_column',
      columns: [nameColumn],
      state: createState({
        selectedColumnIds: ['name'],
        splitSourceColumnId: 'name',
        splitMode: 'pattern',
        splitPattern: '[',
      }),
      tableData: createTableData([{ id: '1', name: 'Alice Smith' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        affectedRows: 1,
        affectedCells: 2,
        affectedColumns: 2,
        previewRows: expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            rowState: 'changed',
            values: expect.objectContaining({
              name__split_1: 'Alice Smith',
              name__split_2: '',
            }),
          }),
        ]),
      }),
    );
  });

  it('clears merged source columns when keeping originals is disabled', () => {
    const context = createContext({
      actionId: 'merge_column',
      columns: [nameColumn, emailColumn],
      state: createState({
        selectedColumnIds: ['name', 'email'],
        mergeFormat: 'dash',
        mergeKeepOriginalColumns: false,
      }),
      tableData: createTableData([{ id: '1', name: 'Alice', email: 'Stone' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        affectedRows: 1,
        affectedColumns: 3,
        previewRows: expect.arrayContaining([
          expect.objectContaining({
            values: expect.objectContaining({
              name: '',
              email: '',
              'Name Email': 'Alice-Stone',
            }),
          }),
        ]),
      }),
    );
  });

  it('returns an unchanged extract preview when the source column is missing', () => {
    const context = createContext({
      actionId: 'extract_substring',
      state: createState({
        selectedColumnIds: ['missing'],
        extractMethod: 'extraction_type',
        extractType: 'email',
      }),
      tableData: createTableData([{ id: '1', notes: 'hello world' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        affectedRows: 0,
        affectedCells: 0,
        affectedColumns: 0,
        previewRows: expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            rowState: 'unchanged',
          }),
        ]),
      }),
    );
  });

  it('extracts email addresses from text', () => {
    const context = createContext({
      actionId: 'extract_substring',
      state: createState({
        selectedColumnIds: ['notes'],
        extractMethod: 'extraction_type',
        extractType: 'email',
      }),
      tableData: createTableData([{ id: '1', notes: 'Contact alice@example.com now' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        previewRows: expect.arrayContaining([
          expect.objectContaining({
            values: expect.objectContaining({
              notes: 'alice@example.com',
            }),
          }),
        ]),
      }),
    );
  });

  it('extracts urls from text', () => {
    const context = createContext({
      actionId: 'extract_substring',
      state: createState({
        selectedColumnIds: ['notes'],
        extractMethod: 'extraction_type',
        extractType: 'url',
      }),
      tableData: createTableData([{ id: '1', notes: 'Visit https://serenibase.com today' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        previewRows: expect.arrayContaining([
          expect.objectContaining({
            values: expect.objectContaining({
              notes: 'https://serenibase.com',
            }),
          }),
        ]),
      }),
    );
  });
  it('returns whitespace-only strings unchanged in sentence case', () => {
    expect(normalizeCaseValue('   ', 'sentence_case')).toBe('   ');
  });

  it('returns the original value for an unsupported formatting mode', () => {
    expect(removeFormattingValue('Value', 'invalid' as GridDataOperationState['formatting'])).toBe('Value');
  });

  it('splits fixed-length values from the end of the string', () => {
    const context = createContext({
      actionId: 'split_column',
      columns: [nameColumn],
      state: createState({
        selectedColumnIds: ['name'],
        splitSourceColumnId: 'name',
        splitMode: 'fixed_length',
        splitFixedDirection: 'before',
        splitCharacterCount: '3',
        splitOutputMode: 'keep_original',
      }),
      tableData: createTableData([{ id: '1', name: 'abcdef' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        affectedRows: 1,
        previewRows: expect.arrayContaining([
          expect.objectContaining({
            values: expect.objectContaining({
              name__split_1: 'abc',
              name__split_2: 'def',
            }),
          }),
        ]),
      }),
    );
  });

  it('splits values by a valid pattern', () => {
    const context = createContext({
      actionId: 'split_column',
      columns: [nameColumn],
      state: createState({
        selectedColumnIds: ['name'],
        splitSourceColumnId: 'name',
        splitMode: 'pattern',
        splitPattern: '\\\\s+',
        splitMaxColumns: '3',
      }),
      tableData: createTableData([{ id: '1', name: 'Alice Smith Jones' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        affectedRows: 1,
        previewRows: expect.arrayContaining([
          expect.objectContaining({
            values: expect.objectContaining({
              name__split_1: expect.any(String),
              name__split_2: expect.any(String),
            }),
          }),
        ]),
      }),
    );
  });

  it('returns null when merged column titles are empty', () => {
    const emptyTitleColumnOne = {
      id: 'empty_1',
      key: 'empty_1',
      column_name: '',
      title: '',
      type: 'text',
    } as unknown as GridColumn;
    const emptyTitleColumnTwo = {
      id: 'empty_2',
      key: 'empty_2',
      column_name: '',
      title: '',
      type: 'text',
    } as unknown as GridColumn;

    const context = createContext({
      actionId: 'merge_column',
      columns: [emptyTitleColumnOne, emptyTitleColumnTwo],
      state: createState({
        selectedColumnIds: ['empty_1', 'empty_2'],
        mergeColumnTitle: '',
      }),
      tableData: createTableData([{ id: '1', empty_1: 'A', empty_2: 'B' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        actionId: 'merge_column',
        previewRows: expect.any(Array),
      }),
    );
  });

  it('keeps duplicate rows unchanged when the duplicate values are null', () => {
    const context = createContext({
      actionId: 'remove_duplicates',
      state: createState({
        selectedColumnIds: ['email'],
        duplicateAction: 'remove_duplicates',
      }),
      tableData: createTableData([
        { id: '1', email: null },
        { id: '2', email: null },
      ]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        affectedRows: 0,
        previewRows: expect.arrayContaining([
          expect.objectContaining({ id: '1', values: expect.objectContaining({ email: null }) }),
          expect.objectContaining({ id: '2', values: expect.objectContaining({ email: null }) }),
        ]),
      }),
    );
  });

  it('uses the default extracted value title for unsupported extraction types', () => {
    const context = createContext({
      actionId: 'extract_substring',
      state: createState({
        selectedColumnIds: ['notes'],
        extractMethod: 'extraction_type',
        extractType: 'invalid' as GridDataOperationState['extractType'],
      }),
      tableData: createTableData([{ id: '1', notes: 'hello world' }]),
    });

    expect(buildGridDataOperationPreview(context)).toEqual(
      expect.objectContaining({
        affectedRows: 0,
        virtualColumns: expect.arrayContaining([
          expect.objectContaining({
            title: 'Extracted value',
          }),
        ]),
      }),
    );
  });
});
describe('applyGridDataOperationToRecords', () => {
  it('applies previewed updates to flat records and removes deleted rows', () => {
    const records = [
      { id: '1', name: 'Alice', email: 'alice@example.com' },
      { id: '2', name: 'Bob', email: 'bob@example.com' },
    ];
    const preview = createPreview({
      previewRows: [
        createPreviewRow('1', { name: 'ALICE', email: 'alice@example.com' }, {
          changedColumns: ['name'],
          rowState: 'changed',
        }),
        createPreviewRow('2', { name: 'Bob', email: 'bob@example.com' }, {
          changedColumns: [],
          rowState: 'removed',
        }),
      ],
    });

    expect(applyGridDataOperationToRecords(records, preview)).toEqual([
      { id: '1', name: 'ALICE', email: 'alice@example.com' },
    ]);
  });

  it('applies previewed updates to structured records', () => {
    const records = [
      { id: '1', data: { name: 'Alice', email: 'alice@example.com' } },
    ];
    const preview = createPreview({
      previewRows: [
        createPreviewRow('1', { name: 'ALICE', email: 'alice@example.com' }, {
          changedColumns: ['name'],
          rowState: 'changed',
        }),
      ],
    });

    expect(applyGridDataOperationToRecords(records, preview)).toEqual([
      { id: '1', data: { name: 'ALICE', email: 'alice@example.com' } },
    ]);
  });

  it('leaves unmatched records untouched', () => {
    const records = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ];
    const preview = createPreview({
      previewRows: [
        createPreviewRow('1', { name: 'ALICE' }, {
          changedColumns: ['name'],
          rowState: 'changed',
        }),
      ],
    });

    expect(applyGridDataOperationToRecords(records, preview)).toEqual([
      { id: '1', name: 'ALICE' },
      { id: '2', name: 'Bob' },
    ]);
  });
});

describe('fuzzy_deduplication preview', () => {
  it('correctly deduplicates three identical rows with keep_first', () => {
    const context = createContext({
      actionId: 'fuzzy_deduplication',
      columns: [nameColumn],
      state: createState({
        selectedColumnIds: ['name'],
        duplicateAction: 'remove_row',
        duplicateKeepRule: 'keep_first',
        fuzzySensitivity: 'medium',
      }),
      tableData: createTableData([
        { id: 'rec-1', name: 'Apple' },
        { id: 'rec-2', name: 'Apple' },
        { id: 'rec-3', name: 'Apple' },
      ]),
    });

    const preview = buildGridDataOperationPreview(context);
    expect(preview.affectedRows).toBe(2);
    expect(preview.previewRows).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'rec-1', rowState: 'kept' }),
      expect.objectContaining({ id: 'rec-2', rowState: 'removed' }),
      expect.objectContaining({ id: 'rec-3', rowState: 'removed' }),
    ]));
  });

  it('correctly deduplicates three identical rows with keep_last', () => {
    const context = createContext({
      actionId: 'fuzzy_deduplication',
      columns: [nameColumn],
      state: createState({
        selectedColumnIds: ['name'],
        duplicateAction: 'remove_row',
        duplicateKeepRule: 'keep_last',
        fuzzySensitivity: 'medium',
      }),
      tableData: createTableData([
        { id: 'rec-1', name: 'Apple' },
        { id: 'rec-2', name: 'Apple' },
        { id: 'rec-3', name: 'Apple' },
      ]),
    });

    const preview = buildGridDataOperationPreview(context);
    expect(preview.affectedRows).toBe(2);
    expect(preview.previewRows).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'rec-1', rowState: 'removed' }),
      expect.objectContaining({ id: 'rec-2', rowState: 'removed' }),
      expect.objectContaining({ id: 'rec-3', rowState: 'kept' }),
    ]));
  });
});







