import { describe, expect, it } from 'vitest';

import type { GridColumn } from '../../../../types/grid.types';
import type {
  GridDataOperationContext,
  GridDataOperationPreviewResult,
  GridDataOperationState,
} from '../gridDataOperation.types';
import { getGridDataOperationAdapter } from '../gridDataOperationRegistry';

type PreviewRow = GridDataOperationPreviewResult['previewRows'][number];

const firstNameColumn: GridColumn = {
  id: 'first_name',
  key: 'first_name_key',
  column_name: 'first_name_api',
  title: 'First Name',
  type: 'text',
};

const lastNameColumn: GridColumn = {
  id: 'last_name_id',
  key: 'last_name',
  column_name: 'last_name_api',
  title: 'Last Name',
  type: 'text',
};

const emailColumn = {
  id: '',
  key: '',
  column_name: 'email_address',
  title: 'Email Address',
  type: 'text',
} as unknown as GridColumn;

const titleOnlyColumn = {
  id: '',
  key: '',
  column_name: '',
  title: 'Title Only',
  type: 'text',
} as unknown as GridColumn;

const blankTitleColumnOne = {
  id: 'blank_title_1',
  key: '',
  column_name: '',
  title: '',
  type: 'text',
} as unknown as GridColumn;

const blankTitleColumnTwo = {
  id: 'blank_title_2',
  key: '',
  column_name: '',
  title: '',
  type: 'text',
} as unknown as GridColumn;

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
  splitPattern: '',
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
  ...overrides,
});

const createTableData = (records: Array<Record<string, unknown>>): GridDataOperationContext['tableData'] =>
  ({
    model: {
      id: 'model-1',
    },
    records,
  } as unknown as NonNullable<GridDataOperationContext['tableData']>);

const createContext = (
  overrides: Partial<GridDataOperationContext> = {},
): GridDataOperationContext => ({
  actionId: 'case_normalization',
  columns: [firstNameColumn, lastNameColumn, emailColumn, titleOnlyColumn],
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

const createPreview = (
  overrides: Partial<GridDataOperationPreviewResult> = {},
): GridDataOperationPreviewResult => ({
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

describe('getGridDataOperationAdapter', () => {
  it('returns the fallback no-op adapter for an unknown action id', () => {
    const adapter = getGridDataOperationAdapter('unknown_action' as never);

    expect(adapter.buildApplyPlan(createContext(), createPreview())).toBeNull();
  });

  it('returns the no-op adapter for fuzzy deduplication', () => {
    const adapter = getGridDataOperationAdapter('fuzzy_deduplication');

    expect(adapter.buildApplyPlan(createContext(), createPreview())).toBeNull();
  });

  it('returns null for unsupported previews across the supported adapters', () => {
    const context = createContext();
    const unsupportedPreview = createPreview({ supported: false });
    const results = [
      getGridDataOperationAdapter('case_normalization').buildApplyPlan(context, unsupportedPreview),
      getGridDataOperationAdapter('remove_extra_spaces').buildApplyPlan(context, unsupportedPreview),
      getGridDataOperationAdapter('find_replace').buildApplyPlan(context, unsupportedPreview),
      getGridDataOperationAdapter('remove_formatting').buildApplyPlan(context, unsupportedPreview),
      getGridDataOperationAdapter('remove_duplicates').buildApplyPlan(context, unsupportedPreview),
      getGridDataOperationAdapter('remove_special_characters').buildApplyPlan(context, unsupportedPreview),
      getGridDataOperationAdapter('split_column').buildApplyPlan(context, unsupportedPreview),
      getGridDataOperationAdapter('merge_column').buildApplyPlan(context, unsupportedPreview),
      getGridDataOperationAdapter('extract_substring').buildApplyPlan(context, unsupportedPreview),
    ];

    expect(results).toEqual([null, null, null, null, null, null, null, null, null]);
  });

  it('returns null when case normalization has no selected columns', () => {
    const context = createContext({
      actionId: 'case_normalization',
      columns: [firstNameColumn],
      state: createState({ selectedColumnIds: [] }),
    });

    expect(getGridDataOperationAdapter('case_normalization').buildApplyPlan(context, createPreview())).toBeNull();
  });

  it('builds a case normalization plan for the selected column', () => {
    const context = createContext({
      actionId: 'case_normalization',
      columns: [firstNameColumn],
      state: createState({
        selectedColumnIds: ['first_name'],
        caseFormat: 'uppercase',
      }),
      tableData: createTableData([{ id: '1', first_name: 'alice' }]),
    });
    const preview = createPreview({
      actionId: 'case_normalization',
      previewRows: [
        createPreviewRow('1', { first_name: 'ALICE' }, { changedColumns: ['first_name'], rowState: 'changed' }),
      ],
      changedRowIds: ['1'],
      totalRows: 1,
      previewCount: 1,
      affectedRows: 1,
      affectedCells: 1,
      affectedColumns: 1,
    });

    expect(getGridDataOperationAdapter('case_normalization').buildApplyPlan(context, preview)).toEqual(
      expect.objectContaining({
        supported: true,
        kind: 'case_normalization',
        columnUpdates: [],
        caseNormalization: {
          modelId: 'model-1',
          columns: ['first_name'],
          caseFormat: 'uppercase',
        },
        optimisticRecords: expect.any(Array),
      }),
    );
  });

  it('returns null when extra space cleanup has no selected columns', () => {
    const context = createContext({
      actionId: 'remove_extra_spaces',
      columns: [titleOnlyColumn],
      state: createState({ selectedColumnIds: [] }),
    });

    expect(getGridDataOperationAdapter('remove_extra_spaces').buildApplyPlan(context, createPreview())).toBeNull();
  });

  it('builds a trim whitespace plan using the fallback trim mode for an invalid space mode', () => {
    const context = createContext({
      actionId: 'remove_extra_spaces',
      columns: [titleOnlyColumn],
      state: createState({
        selectedColumnIds: ['Title Only'],
        spaceMode: 'invalid' as GridDataOperationState['spaceMode'],
      }),
      tableData: createTableData([{ id: '1', 'Title Only': '  Hello   World  ' }]),
    });
    const preview = createPreview({
      actionId: 'remove_extra_spaces',
      previewRows: [
        createPreviewRow('1', { 'Title Only': 'Hello   World' }, { changedColumns: ['Title Only'], rowState: 'changed' }),
      ],
      changedRowIds: ['1'],
      totalRows: 1,
      previewCount: 1,
      affectedRows: 1,
      affectedCells: 1,
      affectedColumns: 1,
    });

    expect(getGridDataOperationAdapter('remove_extra_spaces').buildApplyPlan(context, preview)).toEqual(
      expect.objectContaining({
        supported: true,
        kind: 'trim_whitespace',
        columnUpdates: [],
        trimWhitespace: {
          modelId: 'model-1',
          columns: ['Title Only'],
          trimMode: 'trim_both',
        },
        optimisticRecords: expect.any(Array),
      }),
    );
  });

  it('returns null when find and replace has no selected columns', () => {
    const context = createContext({
      actionId: 'find_replace',
      columns: [emailColumn],
      state: createState({ selectedColumnIds: [], findText: 'alice' }),
    });

    expect(getGridDataOperationAdapter('find_replace').buildApplyPlan(context, createPreview())).toBeNull();
  });

  it('returns null when find and replace has no search text', () => {
    const context = createContext({
      actionId: 'find_replace',
      columns: [emailColumn],
      state: createState({ selectedColumnIds: ['email_address'], findText: '' }),
    });

    expect(getGridDataOperationAdapter('find_replace').buildApplyPlan(context, createPreview())).toBeNull();
  });

  it('builds a find and replace plan for the selected columns', () => {
    const context = createContext({
      actionId: 'find_replace',
      columns: [emailColumn],
      state: createState({
        selectedColumnIds: ['email_address'],
        findText: 'alice',
        replaceText: 'Alyssa',
        matchingCase: 'ignore_case',
      }),
      tableData: createTableData([{ id: '1', email_address: 'alice@example.com' }]),
    });
    const preview = createPreview({
      actionId: 'find_replace',
      previewRows: [
        createPreviewRow('1', { email_address: 'Alyssa@example.com' }, { changedColumns: ['email_address'], rowState: 'changed' }),
      ],
      changedRowIds: ['1'],
      totalRows: 1,
      previewCount: 1,
      affectedRows: 1,
      affectedCells: 1,
      affectedColumns: 1,
    });

    expect(getGridDataOperationAdapter('find_replace').buildApplyPlan(context, preview)).toEqual(
      expect.objectContaining({
        supported: true,
        kind: 'find_replace',
        columnUpdates: [],
        findReplace: {
          modelId: 'model-1',
          columns: ['email_address'],
          findValue: 'alice',
          replaceValue: 'Alyssa',
          matchType: 'ignore_case',
        },
        optimisticRecords: expect.any(Array),
      }),
    );
  });

  it('returns null when remove formatting has no selected columns', () => {
    const context = createContext({
      actionId: 'remove_formatting',
      columns: [emailColumn],
      state: createState({ selectedColumnIds: [] }),
    });

    expect(getGridDataOperationAdapter('remove_formatting').buildApplyPlan(context, createPreview())).toBeNull();
  });

  it('builds a remove formatting plan with normalized custom patterns', () => {
    const context = createContext({
      actionId: 'remove_formatting',
      columns: [emailColumn],
      state: createState({
        selectedColumnIds: ['email_address'],
        formatting: 'custom',
        formattingPattern: ' #, \n$ ',
      }),
      tableData: createTableData([{ id: '1', email_address: '$1,000' }]),
    });
    const preview = createPreview({
      actionId: 'remove_formatting',
      previewRows: [
        createPreviewRow('1', { email_address: '1000' }, { changedColumns: ['email_address'], rowState: 'changed' }),
      ],
      changedRowIds: ['1'],
      totalRows: 1,
      previewCount: 1,
      affectedRows: 1,
      affectedCells: 1,
      affectedColumns: 1,
    });

    expect(getGridDataOperationAdapter('remove_formatting').buildApplyPlan(context, preview)).toEqual(
      expect.objectContaining({
        supported: true,
        kind: 'remove_formatting',
        columnUpdates: [],
        removeFormatting: {
          modelId: 'model-1',
          columns: ['email_address'],
          formatting: 'custom',
          customPattern: ['#', '$'],
        },
        optimisticRecords: expect.any(Array),
      }),
    );
  });

  it('builds a remove formatting plan without custom patterns for non-custom formatting', () => {
    const context = createContext({
      actionId: 'remove_formatting',
      columns: [emailColumn],
      state: createState({
        selectedColumnIds: ['email_address'],
        formatting: 'currency',
      }),
      tableData: createTableData([{ id: '1', email_address: '$1,000' }]),
    });
    const preview = createPreview({
      actionId: 'remove_formatting',
      previewRows: [
        createPreviewRow('1', { email_address: '1000' }, { changedColumns: ['email_address'], rowState: 'changed' }),
      ],
      changedRowIds: ['1'],
      totalRows: 1,
      previewCount: 1,
      affectedRows: 1,
      affectedCells: 1,
      affectedColumns: 1,
    });

    expect(getGridDataOperationAdapter('remove_formatting').buildApplyPlan(context, preview)).toEqual(
      expect.objectContaining({
        supported: true,
        kind: 'remove_formatting',
        columnUpdates: [],
        removeFormatting: {
          modelId: 'model-1',
          columns: ['email_address'],
          formatting: 'currency',
          customPattern: undefined,
        },
        optimisticRecords: expect.any(Array),
      }),
    );
  });

  it('returns null when remove duplicates has no selected columns', () => {
    const context = createContext({
      actionId: 'remove_duplicates',
      columns: [firstNameColumn],
      state: createState({ selectedColumnIds: [] }),
    });

    expect(getGridDataOperationAdapter('remove_duplicates').buildApplyPlan(context, createPreview())).toBeNull();
  });

  it('builds a remove duplicates plan that deletes duplicate rows', () => {
    const context = createContext({
      actionId: 'remove_duplicates',
      columns: [firstNameColumn],
      state: createState({
        selectedColumnIds: ['first_name'],
        duplicateAction: 'remove_row',
      }),
      tableData: createTableData([
        { id: 1, first_name: 'Alice' },
        { id: 2, first_name: 'Alice' },
      ]),
    });
    const preview = createPreview({
      actionId: 'remove_duplicates',
      previewRows: [
        createPreviewRow('1', { first_name: 'Alice' }, { rowState: 'kept' }),
        createPreviewRow('2', { first_name: 'Alice' }, { rowState: 'removed' }),
      ],
      changedRowIds: ['2'],
      totalRows: 2,
      previewCount: 2,
      affectedRows: 1,
      affectedCells: 0,
      affectedColumns: 1,
    });

    expect(getGridDataOperationAdapter('remove_duplicates').buildApplyPlan(context, preview)).toEqual(
      expect.objectContaining({
        supported: true,
        kind: 'remove_duplicates',
        columnUpdates: [],
        removeDuplicates: {
          modelId: 'model-1',
          columns: ['first_name'],
          rowIdsToDelete: [2],
          duplicateAction: 'remove_row',
          keepRule: 'keep_first',
        },
        optimisticRecords: expect.any(Array),
      }),
    );
  });

  it('builds a remove duplicates plan that clears duplicate columns in place', () => {
    const context = createContext({
      actionId: 'remove_duplicates',
      columns: [emailColumn],
      state: createState({
        selectedColumnIds: ['email_address'],
        duplicateAction: 'remove_duplicates',
        duplicateKeepRule: 'keep_latest_updated',
      }),
      tableData: createTableData([
        { id: '1', email_address: 'a@example.com' },
        { id: '2', email_address: 'a@example.com' },
      ]),
    });
    const preview = createPreview({
      actionId: 'remove_duplicates',
      previewRows: [
        createPreviewRow('1', { email_address: 'a@example.com' }, { rowState: 'kept' }),
        createPreviewRow('2', { email_address: '' }, { changedColumns: ['email_address'], rowState: 'changed' }),
      ],
      changedRowIds: ['2'],
      totalRows: 2,
      previewCount: 2,
      affectedRows: 1,
      affectedCells: 1,
      affectedColumns: 1,
    });

    expect(getGridDataOperationAdapter('remove_duplicates').buildApplyPlan(context, preview)).toEqual(
      expect.objectContaining({
        supported: true,
        kind: 'remove_duplicates',
        columnUpdates: [
          {
            columnId: 'email_address',
            updates: [
              {
                id: '2',
                value: '',
              },
            ],
          },
        ],
        removeDuplicates: {
          modelId: 'model-1',
          columns: ['email_address'],
          rowIdsToDelete: [],
          duplicateAction: 'remove_duplicates',
          keepRule: 'keep_latest_updated',
        },
        optimisticRecords: expect.any(Array),
      }),
    );
  });

  it('returns null when remove duplicates cannot produce column updates', () => {
    const context = createContext({
      actionId: 'remove_duplicates',
      columns: [emailColumn],
      state: createState({
        selectedColumnIds: ['email_address'],
        duplicateAction: 'remove_duplicates',
      }),
    });
    const preview = createPreview({
      actionId: 'remove_duplicates',
      previewRows: [
        createPreviewRow('1', { email_address: 'a@example.com' }, { rowState: 'kept' }),
        createPreviewRow('2', { email_address: 'a@example.com' }, { rowState: 'removed' }),
      ],
      changedRowIds: ['2'],
      totalRows: 2,
      previewCount: 2,
      affectedRows: 1,
      affectedCells: 0,
      affectedColumns: 1,
    });

    expect(getGridDataOperationAdapter('remove_duplicates').buildApplyPlan(context, preview)).toBeNull();
  });

  it('returns null when merge column has fewer than two distinct selections', () => {
    const context = createContext({
      actionId: 'merge_column',
      columns: [firstNameColumn, lastNameColumn],
      state: createState({ selectedColumnIds: ['first_name'] }),
    });

    expect(getGridDataOperationAdapter('merge_column').buildApplyPlan(context, createPreview())).toBeNull();
  });

  it('returns null when merge column selections are duplicated', () => {
    const context = createContext({
      actionId: 'merge_column',
      columns: [firstNameColumn, lastNameColumn],
      state: createState({ selectedColumnIds: ['first_name', 'first_name'] }),
    });

    expect(getGridDataOperationAdapter('merge_column').buildApplyPlan(context, createPreview())).toBeNull();
  });

  it('returns null when merge column selections cannot be resolved', () => {
    const context = createContext({
      actionId: 'merge_column',
      columns: [firstNameColumn],
      state: createState({ selectedColumnIds: ['first_name', 'last_name_id'] }),
    });

    expect(getGridDataOperationAdapter('merge_column').buildApplyPlan(context, createPreview())).toBeNull();
  });

  it('returns null when merge column falls back to an empty merged title', () => {
    const context = createContext({
      actionId: 'merge_column',
      columns: [blankTitleColumnOne, blankTitleColumnTwo],
      state: createState({
        selectedColumnIds: ['blank_title_1', 'blank_title_2'],
        mergeColumnTitle: '',
      }),
    });

    expect(getGridDataOperationAdapter('merge_column').buildApplyPlan(context, createPreview())).toBeNull();
  });

  it('returns null when custom merge formatting is missing a separator', () => {
    const context = createContext({
      actionId: 'merge_column',
      columns: [firstNameColumn, lastNameColumn],
      state: createState({
        selectedColumnIds: ['first_name', 'last_name_id'],
        mergeFormat: 'custom',
        mergeCustomSeparator: '   ',
      }),
    });

    expect(getGridDataOperationAdapter('merge_column').buildApplyPlan(context, createPreview())).toBeNull();
  });

  it('builds a merge column plan with the resolved title and trimmed separator', () => {
    const context = createContext({
      actionId: 'merge_column',
      columns: [firstNameColumn, lastNameColumn],
      state: createState({
        selectedColumnIds: ['first_name', 'last_name_id'],
        mergeFormat: 'custom',
        mergeCustomSeparator: ' :: ',
        mergeColumnTitle: '',
        mergeKeepOriginalColumns: true,
        mergePlacement: 'end_of_table',
      }),
      tableData: createTableData([
        { id: '1', first_name: 'Alice', last_name: 'Stone' },
      ]),
    });
    const preview = createPreview({
      actionId: 'merge_column',
      previewRows: [
        createPreviewRow(
          '1',
          { first_name: 'Alice', last_name: 'Stone', 'First Name Last Name': 'Alice :: Stone' },
          { changedColumns: ['First Name Last Name'], rowState: 'changed' },
        ),
      ],
      changedRowIds: ['1'],
      totalRows: 1,
      previewCount: 1,
      affectedRows: 1,
      affectedCells: 1,
      affectedColumns: 1,
      virtualColumns: [{ id: 'First Name Last Name', title: 'First Name Last Name' }],
    });

    expect(getGridDataOperationAdapter('merge_column').buildApplyPlan(context, preview)).toEqual(
      expect.objectContaining({
        supported: true,
        kind: 'merge_column',
        columnUpdates: [],
        mergeColumn: {
          modelId: 'model-1',
          sourceColumnIds: ['first_name', 'last_name_id'],
          mergedColumnTitle: 'First Name Last Name',
          mergeFormat: 'custom',
          mergeCustomSeparator: '::',
          mergeKeepOriginalColumns: true,
          mergePlacement: 'end_of_table',
          outputColumnId: '',
        },
        optimisticRecords: expect.any(Array),
      }),
    );
  });

  it('returns null when split column has no source column', () => {
    const context = createContext({
      actionId: 'split_column',
      columns: [firstNameColumn],
      state: createState({ splitSourceColumnId: 'missing-column' }),
    });
    const preview = createPreview({
      actionId: 'split_column',
      previewRows: [createPreviewRow('1', { first_name: 'Alice Smith' })],
      affectedRows: 1,
    });

    expect(getGridDataOperationAdapter('split_column').buildApplyPlan(context, preview)).toBeNull();
  });

  it('returns null when split column has no preview rows', () => {
    const context = createContext({
      actionId: 'split_column',
      columns: [firstNameColumn],
      state: createState({ splitSourceColumnId: 'first_name' }),
    });
    const preview = createPreview({
      actionId: 'split_column',
      previewRows: [],
      affectedRows: 1,
    });

    expect(getGridDataOperationAdapter('split_column').buildApplyPlan(context, preview)).toBeNull();
  });

  it('builds a split column plan with a parsed fallback max column count', () => {
    const context = createContext({
      actionId: 'split_column',
      columns: [firstNameColumn],
      state: createState({
        splitSourceColumnId: 'first_name',
        splitMode: 'separator',
        splitSeparatorType: 'space',
        splitCustomSeparator: '',
        splitMaxColumns: 'not-a-number',
        splitOutputMode: 'replace_original',
        splitPlacement: 'end_of_table',
      }),
      tableData: createTableData([{ id: '1', first_name: 'Alice Smith' }]),
    });
    const preview = createPreview({
      actionId: 'split_column',
      previewRows: [
        createPreviewRow('1', {
          first_name: 'Alice',
          first_name__split_2: 'Smith',
        }, { changedColumns: ['first_name', 'first_name__split_2'], rowState: 'changed' }),
      ],
      changedRowIds: ['1'],
      totalRows: 1,
      previewCount: 1,
      affectedRows: 1,
      affectedCells: 2,
      affectedColumns: 2,
      virtualColumns: [
        { id: 'first_name', title: 'First Name Part 1' },
        { id: 'first_name__split_2', title: 'First Name Part 2' },
      ],
    });

    expect(getGridDataOperationAdapter('split_column').buildApplyPlan(context, preview)).toEqual(
      expect.objectContaining({
        supported: true,
        kind: 'split_column',
        columnUpdates: [],
        splitColumn: {
          modelId: 'model-1',
          sourceColumnId: 'first_name',
          sourceColumnTitle: 'First Name',
          outputColumnTitles: ['First Name Part 1', 'First Name Part 2'],
          splitMode: 'separator',
          splitSeparatorType: 'space',
          splitCustomSeparator: '',
          splitMaxColumns: 10,
          splitFixedDirection: 'after',
          splitCharacterCount: '2',
          splitPattern: '',
          splitOutputMode: 'replace_original',
          splitPlacement: 'end_of_table',
          outputColumnIds: ['first_name', 'first_name__split_2'],
        },
        optimisticRecords: expect.any(Array),
      }),
    );
  });

  it('returns null when remove special characters has no selected columns', () => {
    const context = createContext({
      actionId: 'remove_special_characters',
      columns: [emailColumn],
      state: createState({ selectedColumnIds: [] }),
    });

    expect(getGridDataOperationAdapter('remove_special_characters').buildApplyPlan(context, createPreview())).toBeNull();
  });

  it('builds a remove special characters plan with deduplicated custom characters', () => {
    const context = createContext({
      actionId: 'remove_special_characters',
      columns: [emailColumn],
      state: createState({
        selectedColumnIds: ['email_address'],
        charRemovalMode: 'custom',
        customChar: '@@##',
      }),
      tableData: createTableData([{ id: '1', email_address: '@@hello##' }]),
    });
    const preview = createPreview({
      actionId: 'remove_special_characters',
      previewRows: [
        createPreviewRow('1', { email_address: 'hello' }, { changedColumns: ['email_address'], rowState: 'changed' }),
      ],
      changedRowIds: ['1'],
      totalRows: 1,
      previewCount: 1,
      affectedRows: 1,
      affectedCells: 1,
      affectedColumns: 1,
    });

    expect(getGridDataOperationAdapter('remove_special_characters').buildApplyPlan(context, preview)).toEqual(
      expect.objectContaining({
        supported: true,
        kind: 'remove_special_characters',
        columnUpdates: [],
        removeSpecialCharacters: {
          modelId: 'model-1',
          columns: ['email_address'],
          specialCharactersType: 'custom',
          custom: ['@', '#'],
        },
        optimisticRecords: expect.any(Array),
      }),
    );
  });

  it('builds a remove special characters plan without custom characters for non-custom modes', () => {
    const context = createContext({
      actionId: 'remove_special_characters',
      columns: [emailColumn],
      state: createState({
        selectedColumnIds: ['email_address'],
        charRemovalMode: 'symbols',
        customChar: 'ignored',
      }),
      tableData: createTableData([{ id: '1', email_address: '@hello#' }]),
    });
    const preview = createPreview({
      actionId: 'remove_special_characters',
      previewRows: [
        createPreviewRow('1', { email_address: 'hello' }, { changedColumns: ['email_address'], rowState: 'changed' }),
      ],
      changedRowIds: ['1'],
      totalRows: 1,
      previewCount: 1,
      affectedRows: 1,
      affectedCells: 1,
      affectedColumns: 1,
    });

    expect(getGridDataOperationAdapter('remove_special_characters').buildApplyPlan(context, preview)).toEqual(
      expect.objectContaining({
        supported: true,
        kind: 'remove_special_characters',
        columnUpdates: [],
        removeSpecialCharacters: {
          modelId: 'model-1',
          columns: ['email_address'],
          specialCharactersType: 'symbols',
          custom: undefined,
        },
        optimisticRecords: expect.any(Array),
      }),
    );
  });

  it('returns null when extract substring has no affected rows', () => {
    const context = createContext({
      actionId: 'extract_substring',
      columns: [firstNameColumn],
      state: createState({
        selectedColumnIds: ['first_name'],
        extractMethod: 'between_characters',
        extractStartAfter: '(',
        extractEndBefore: ')',
      }),
    });
    const preview = createPreview({
      actionId: 'extract_substring',
      previewRows: [createPreviewRow('1', { first_name: 'Name (value)' })],
      affectedRows: 0,
    });

    expect(getGridDataOperationAdapter('extract_substring').buildApplyPlan(context, preview)).toBeNull();
  });

  it('returns null when extract substring has no source column', () => {
    const context = createContext({
      actionId: 'extract_substring',
      columns: [firstNameColumn],
      state: createState({
        selectedColumnIds: ['missing-column'],
        extractMethod: 'between_characters',
        extractStartAfter: '(',
        extractEndBefore: ')',
      }),
    });
    const preview = createPreview({
      actionId: 'extract_substring',
      previewRows: [createPreviewRow('1', { first_name: 'Name (value)' })],
      affectedRows: 1,
    });

    expect(getGridDataOperationAdapter('extract_substring').buildApplyPlan(context, preview)).toBeNull();
  });

  it('returns null when extract substring uses an unsupported extraction type', () => {
    const context = createContext({
      actionId: 'extract_substring',
      columns: [firstNameColumn],
      state: createState({
        selectedColumnIds: ['first_name'],
        extractMethod: 'extraction_type',
        extractType: 'unsupported' as GridDataOperationState['extractType'],
      }),
    });
    const preview = createPreview({
      actionId: 'extract_substring',
      previewRows: [createPreviewRow('1', { first_name: 'alice@example.com' })],
      affectedRows: 1,
    });

    expect(getGridDataOperationAdapter('extract_substring').buildApplyPlan(context, preview)).toBeNull();
  });

  it('builds an extract substring plan using the source column title fallback', () => {
    const context = createContext({
      actionId: 'extract_substring',
      columns: [emailColumn],
      state: createState({
        selectedColumnIds: ['email_address'],
        extractMethod: 'between_characters',
        extractStartAfter: '(',
        extractEndBefore: ')',
        extractKeepOriginalColumn: false,
        extractPlacement: 'end_of_table',
      }),
      tableData: createTableData([{ id: '1', email_address: 'Name (value)' }]),
    });
    const preview = createPreview({
      actionId: 'extract_substring',
      previewRows: [
        createPreviewRow('1', { email_address: 'value' }, { changedColumns: ['email_address'], rowState: 'changed' }),
      ],
      changedRowIds: ['1'],
      totalRows: 1,
      previewCount: 1,
      affectedRows: 1,
      affectedCells: 1,
      affectedColumns: 1,
    });

    expect(getGridDataOperationAdapter('extract_substring').buildApplyPlan(context, preview)).toEqual(
      expect.objectContaining({
        supported: true,
        kind: 'extract_substring',
        columnUpdates: [],
        extractSubstring: {
          modelId: 'model-1',
          sourceColumnId: 'email_address',
          sourceColumnTitle: 'Email Address',
          extractionMethod: 'between_characters',
          extractionType: 'email',
          startAfter: '(',
          endBefore: ')',
          keepOriginalColumn: false,
          placement: 'end_of_table',
          outputColumnId: 'email_address',
          outputColumnTitle: 'Extracted value',
        },
        optimisticRecords: expect.any(Array),
      }),
    );
  });

  it('builds an extract substring plan that keeps the original column and uses the mapped title', () => {
    const context = createContext({
      actionId: 'extract_substring',
      columns: [emailColumn],
      state: createState({
        selectedColumnIds: ['email_address'],
        extractMethod: 'extraction_type',
        extractType: 'phone',
        extractKeepOriginalColumn: true,
      }),
      tableData: createTableData([{ id: '1', email_address: 'Call +1 555 111 2222' }]),
    });
    const preview = createPreview({
      actionId: 'extract_substring',
      previewRows: [
        createPreviewRow('1', {
          email_address: 'Call +1 555 111 2222',
          'Extracted Phone': '+1 555 111 2222',
        }, { changedColumns: ['Extracted Phone'], rowState: 'changed' }),
      ],
      changedRowIds: ['1'],
      totalRows: 1,
      previewCount: 1,
      affectedRows: 1,
      affectedCells: 1,
      affectedColumns: 1,
    });

    expect(getGridDataOperationAdapter('extract_substring').buildApplyPlan(context, preview)).toEqual(
      expect.objectContaining({
        supported: true,
        kind: 'extract_substring',
        columnUpdates: [],
        extractSubstring: {
          modelId: 'model-1',
          sourceColumnId: 'email_address',
          sourceColumnTitle: 'Email Address',
          extractionMethod: 'extraction_type',
          extractionType: 'phone',
          startAfter: '',
          endBefore: '',
          keepOriginalColumn: true,
          placement: 'next_to_original',
          outputColumnId: 'email_address__extracted',
          outputColumnTitle: 'Extracted Phone',
        },
        optimisticRecords: expect.any(Array),
      }),
    );
  });
});

