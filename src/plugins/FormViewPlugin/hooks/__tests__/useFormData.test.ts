import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useFormData } from '../useFormData';
import { isFormulaField } from '../../../../utils/fieldUtils';

interface MockQueryResult {
  data: unknown;
  isLoading: boolean;
  error: unknown;
  refetch: ReturnType<typeof vi.fn>;
}

interface MockMutationResult {
  mutateAsync: ReturnType<typeof vi.fn>;
}

vi.mock('../../../../hooks/useApi', () => ({
  useTable: vi.fn(),
  useAddRow: vi.fn(),
  useDeleteRecord: vi.fn(),
  useInsertRowData: vi.fn(),
  useUpdateField: vi.fn(),
  useDeleteColumn: vi.fn(),
  useCreateField: vi.fn(),
  useUpdateView: vi.fn(),
  useUpdateViewAppearance: vi.fn(),
  useInsertRelationData: vi.fn(),
  useAddAttachment: vi.fn(),
}));

vi.mock('../../../../types/constants', () => ({
  fieldsToFilter: ['createdTime', 'lastModifiedTime'],
}));

vi.mock('../../../../utils/fieldUtils', () => ({
  isFormulaField: vi.fn(() => false),
}));

const mockUseTable = vi.mocked(await import('../../../../hooks/useApi').then(m => m.useTable));
const mockUseAddRow = vi.mocked(await import('../../../../hooks/useApi').then(m => m.useAddRow));
const mockUseInsertRowData = vi.mocked(await import('../../../../hooks/useApi').then(m => m.useInsertRowData));
const mockUseDeleteRecord = vi.mocked(await import('../../../../hooks/useApi').then(m => m.useDeleteRecord));
const mockUseUpdateField = vi.mocked(await import('../../../../hooks/useApi').then(m => m.useUpdateField));
const mockUseDeleteColumn = vi.mocked(await import('../../../../hooks/useApi').then(m => m.useDeleteColumn));
const mockUseCreateField = vi.mocked(await import('../../../../hooks/useApi').then(m => m.useCreateField));
const mockUseUpdateView = vi.mocked(await import('../../../../hooks/useApi').then(m => m.useUpdateView));
const mockUseUpdateViewAppearance = vi.mocked(await import('../../../../hooks/useApi').then(m => m.useUpdateViewAppearance));
const mockUseInsertRelationData = vi.mocked(await import('../../../../hooks/useApi').then(m => m.useInsertRelationData));
const mockUseAddAttachment = vi.mocked(await import('../../../../hooks/useApi').then(m => m.useAddAttachment));
const mockIsFormulaField = vi.mocked(isFormulaField);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useFormData', () => {
  const mockMutateAsync = vi.fn();
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsFormulaField.mockReturnValue(false);

    mockUseTable.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof mockUseTable>);

    const mockMutation = { mutateAsync: mockMutateAsync } as unknown as MockMutationResult;
    mockUseAddRow.mockReturnValue(mockMutation as ReturnType<typeof mockUseAddRow>);
    mockUseInsertRowData.mockReturnValue(mockMutation as ReturnType<typeof mockUseInsertRowData>);
    mockUseDeleteRecord.mockReturnValue(mockMutation as ReturnType<typeof mockUseDeleteRecord>);
    mockUseUpdateField.mockReturnValue(mockMutation as ReturnType<typeof mockUseUpdateField>);
    mockUseDeleteColumn.mockReturnValue(mockMutation as ReturnType<typeof mockUseDeleteColumn>);
    mockUseCreateField.mockReturnValue(mockMutation as ReturnType<typeof mockUseCreateField>);
    mockUseUpdateView.mockReturnValue(mockMutation as ReturnType<typeof mockUseUpdateView>);
    mockUseUpdateViewAppearance.mockReturnValue(mockMutation as ReturnType<typeof mockUseUpdateViewAppearance>);
    mockUseInsertRelationData.mockReturnValue(mockMutation as ReturnType<typeof mockUseInsertRelationData>);
    mockUseAddAttachment.mockReturnValue(mockMutation as ReturnType<typeof mockUseAddAttachment>);
  });

  describe('initial state', () => {
    it('should return undefined tableData when no data loaded', () => {
      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      expect(result.current.tableData).toBeUndefined();
    });

    it('should return isLoading from useTable', () => {
      mockUseTable.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof mockUseTable>);

      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should return error from useTable', () => {
      const mockError = new Error('Failed to load');
      mockUseTable.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof mockUseTable>);

      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      expect(result.current.error).toBe(mockError);
    });
  });

  describe('tableData transformation', () => {
    it('should transform API response to TableData format', () => {
      mockUseTable.mockReturnValue({
        data: {
          model: { id: 'm1', base_id: 'b1' },
          columns: [
            { id: 'c1', title: 'Title', uidt: 'text' },
            { id: 'c2', title: 'Created', uidt: 'createdTime' },
          ],
          records: [{ id: 'r1' }],
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof mockUseTable>);

      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      expect(result.current.tableData).toBeDefined();
      expect(result.current.tableData?.model?.id).toBe('m1');
      expect(result.current.tableData?.columns).toHaveLength(1);
      expect(result.current.tableData?.columns[0].title).toBe('Title');
    });

    it('should handle wrapped TableResponse format', () => {
      mockUseTable.mockReturnValue({
        data: {
          data: {
            model: { id: 'm1' },
            columns: [{ id: 'c1', title: 'Name', uidt: 'text' }],
            records: [],
          },
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof mockUseTable>);

      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      expect(result.current.tableData?.model?.id).toBe('m1');
    });

    it('should return undefined when data has no model', () => {
      mockUseTable.mockReturnValue({
        data: { columns: [] },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof mockUseTable>);

      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      expect(result.current.tableData).toBeUndefined();
    });
  });

  describe('refresh', () => {
    it('should call refetch when refresh is called', () => {
      mockRefetch.mockResolvedValue({});
      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      result.current.refresh();

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('mutations exposure', () => {
    it('should expose addRow mutation', () => {
      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      expect(result.current.addRow).toBeDefined();
    });

    it('should expose insertRowData mutation', () => {
      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      expect(result.current.insertRowData).toBeDefined();
    });

    it('should expose deleteRecord mutation', () => {
      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      expect(result.current.deleteRecord).toBeDefined();
    });

    it('should expose updateField mutation', () => {
      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      expect(result.current.updateField).toBeDefined();
    });

    it('should expose deleteColumn mutation', () => {
      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      expect(result.current.deleteColumn).toBeDefined();
    });

    it('should expose createField mutation', () => {
      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      expect(result.current.createField).toBeDefined();
    });

    it('should expose updateView mutation', () => {
      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      expect(result.current.updateView).toBeDefined();
    });
  });

  describe('business logic operations', () => {
    it('should expose submitForm function', () => {
      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.submitForm).toBe('function');
    });

    it('should expose createNewField function', () => {
      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.createNewField).toBe('function');
    });

    it('should expose updateFieldData function', () => {
      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.updateFieldData).toBe('function');
    });

    it('should expose toggleFieldVisibility function', () => {
      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.toggleFieldVisibility).toBe('function');
    });

    it('should expose setAllFieldsVisibility function', () => {
      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.setAllFieldsVisibility).toBe('function');
    });

    it('should expose updateFieldOrder function', () => {
      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.updateFieldOrder).toBe('function');
    });

    it('should expose updateAppearance function', () => {
      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.updateAppearance).toBe('function');
    });

    it('should expose deleteFieldData function', () => {
      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.deleteFieldData).toBe('function');
    });
  });

  describe('submitForm', () => {
    it('should throw error when required fields are missing', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockUseTable.mockReturnValue({
        data: {
          model: { id: 'm1' },
          columns: [],
          records: [],
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof mockUseTable>);

      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      const formFields = [
        { id: 'f1', required: true, title: 'Name', type: 'text', key: 'name', column_name: 'name', uidt: 'text', position: 0, order_index: 0, isSystem: false, system: false, hidden: false, is_hidden: false, config: {} },
      ];

      await expect(result.current.submitForm({}, formFields)).rejects.toThrow(
        'Required field(s) must not be left empty.'
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('deleteFieldData', () => {
    it('should call deleteColumn mutation', async () => {
      mockUseTable.mockReturnValue({
        data: {
          model: { id: 'm1' },
          columns: [],
          records: [],
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof mockUseTable>);

      mockMutateAsync.mockResolvedValue({});

      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      await result.current.deleteFieldData('field-1');

      expect(mockMutateAsync).toHaveBeenCalledWith({
        fieldId: 'field-1',
        tableId: 'm1',
      });
    });
  });

  describe('updateAppearance', () => {
    it('should call updateViewAppearance mutation', async () => {
      mockMutateAsync.mockResolvedValue({});

      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      const view = { id: 'v1', meta: {} };
      await result.current.updateAppearance({ backgroundColor: '#fff' }, view);

      expect(mockMutateAsync).toHaveBeenCalledWith({
        viewId: 'v1',
        appearance: { backgroundColor: '#fff' },
        currentMeta: {},
      });
    });
  });

  describe('toggleFieldVisibility', () => {
    it('should call updateView mutation with toggled visibility', async () => {
      mockMutateAsync.mockResolvedValue({});

      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      const view = {
        id: 'v1',
        meta: {
          fieldConfig: [{ id: 'f1', isHidden: false, position: 0 }],
        },
      };

      await result.current.toggleFieldVisibility('f1', view, []);

      expect(mockMutateAsync).toHaveBeenCalledWith({
        viewId: 'v1',
        view: {
          meta: {
            fieldConfig: [{ id: 'f1', isHidden: true, position: 0 }],
          },
        },
      });
    });

    it('should add new field config when field not in existing config', async () => {
      mockMutateAsync.mockResolvedValue({});

      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      const view = { id: 'v1', meta: { fieldConfig: [] } };

      await result.current.toggleFieldVisibility('f2', view, []);

      expect(mockMutateAsync).toHaveBeenCalledWith({
        viewId: 'v1',
        view: {
          meta: {
            fieldConfig: [{ id: 'f2', isHidden: true, position: 0 }],
          },
        },
      });
    });
  });

  describe('setAllFieldsVisibility', () => {
    it('should set all fields to visible', async () => {
      mockMutateAsync.mockResolvedValue({});

      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      const view = { id: 'v1', meta: {} };
      const formFields = [
        { id: 'f1', title: 'Field 1', type: 'text', key: 'f1', column_name: 'f1', uidt: 'text', position: 0, order_index: 0, isSystem: false, system: false, hidden: false, is_hidden: true, config: {} },
        { id: 'f2', title: 'Field 2', type: 'text', key: 'f2', column_name: 'f2', uidt: 'text', position: 1, order_index: 1, isSystem: false, system: false, hidden: false, is_hidden: true, config: {} },
      ];

      await result.current.setAllFieldsVisibility(true, view, formFields);

      expect(mockMutateAsync).toHaveBeenCalledWith({
        viewId: 'v1',
        view: {
          meta: {
            fieldConfig: [
              { id: 'f1', isHidden: false, position: 0 },
              { id: 'f2', isHidden: false, position: 1 },
            ],
          },
        },
      });
    });
  });

  describe('createNewField', () => {
    it('should call createField mutation with config', async () => {
      mockUseTable.mockReturnValue({
        data: {
          model: { id: 'm1', base_id: 'b1' },
          columns: [],
          records: [],
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof mockUseTable>);

      mockMutateAsync.mockResolvedValue({});

      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      await result.current.createNewField(
        { title: 'New Field', type: 'text', description: 'Test' },
        [{ id: 'existing' }]
      );

      expect(mockMutateAsync).toHaveBeenCalledWith({
        tableId: 'm1',
        baseId: 'b1',
        config: {
          title: 'New Field',
          uidt: 'text',
          meta: {},
          order_index: 1,
          description: 'Test',
        },
      });
    });
  });

  describe('submitForm success path', () => {
    it('should insert regular fields, link records, and upload attachments', async () => {
      const addRowMutate = vi.fn().mockResolvedValue({ id: 123 });
      const insertRowDataMutate = vi.fn().mockResolvedValue({});
      const insertRelationMutate = vi.fn().mockResolvedValue({});
      const addAttachmentMutate = vi.fn().mockResolvedValue({});

      mockUseAddRow.mockReturnValue({ mutateAsync: addRowMutate } as unknown as MockMutationResult);
      mockUseInsertRowData.mockReturnValue({ mutateAsync: insertRowDataMutate } as unknown as MockMutationResult);
      mockUseInsertRelationData.mockReturnValue({ mutateAsync: insertRelationMutate } as unknown as MockMutationResult);
      mockUseAddAttachment.mockReturnValue({ mutateAsync: addAttachmentMutate } as unknown as MockMutationResult);

      mockUseTable.mockReturnValue({
        data: {
          model: { id: 'm1' },
          columns: [],
          records: [],
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof mockUseTable>);

      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      const formFields = [
        { id: 'f1', required: true, title: 'Title', type: 'text', key: 'title', column_name: 'title', uidt: 'text', position: 0, order_index: 0, isSystem: false, system: false, hidden: false, is_hidden: false, config: {} },
        { id: 'f2', title: 'Due', type: 'date', key: 'due', column_name: 'due', uidt: 'date', position: 1, order_index: 1, isSystem: false, system: false, hidden: false, is_hidden: false, config: {} },
        { id: 'f3', title: 'When', type: 'datetime', key: 'when', column_name: 'when', uidt: 'datetime', position: 2, order_index: 2, isSystem: false, system: false, hidden: false, is_hidden: false, config: {} },
        { id: 'f4', title: 'Data', type: 'json', key: 'data', column_name: 'data', uidt: 'json', position: 3, order_index: 3, isSystem: false, system: false, hidden: false, is_hidden: false, config: {} },
        { id: 'f5', title: 'Links', type: 'links', key: 'links', column_name: 'links', uidt: 'links', position: 4, order_index: 4, isSystem: false, system: false, hidden: false, is_hidden: false, config: {} },
        { id: 'f6', title: 'Files', type: 'attachment', key: 'files', column_name: 'files', uidt: 'attachment', position: 5, order_index: 5, isSystem: false, system: false, hidden: false, is_hidden: false, config: {} },
      ];

      const fileA = new File(['a'], 'a.txt', { type: 'text/plain' });
      const fileB = new File(['b'], 'b.txt', { type: 'text/plain' });

      const formData = {
        f1: 'Hello',
        f2: '2024-01-02T00:00:00Z',
        f3: '2024-01-03T10:00:00Z',
        f4: { a: 1 },
        f5: [{ id: 10 }, { id: 20 }],
        f6: [{ file: fileA }, { file: fileB }],
      };

      await result.current.submitForm(formData, formFields);

      expect(addRowMutate).toHaveBeenCalledWith({
        model_id: 'm1',
        rows: [{
          f1: 'Hello',
          f2: '2024-01-02',
          f3: '2024-01-03T10:00:00Z',
          f4: JSON.stringify({ a: 1 }),
        }]
      });
      expect(insertRowDataMutate).not.toHaveBeenCalled();

      expect(insertRelationMutate).toHaveBeenCalledWith({
        model_id: 'm1',
        column_id: 'f5',
        source_row_id: 123,
        target_row_id: 10,
        action: 'link',
      });
      expect(insertRelationMutate).toHaveBeenCalledWith({
        model_id: 'm1',
        column_id: 'f5',
        source_row_id: 123,
        target_row_id: 20,
        action: 'link',
      });

      expect(addAttachmentMutate).toHaveBeenCalledWith({
        model_id: 'm1',
        column_id: 'f6',
        row_id: 123,
        files: [fileA, fileB],
      });
    });
  });

  describe('submitForm edge cases', () => {
    it('should skip formula fields when isFormulaField returns true', async () => {
      const addRowMutate = vi.fn().mockResolvedValue({ id: 100 });
      const insertRowDataMutate = vi.fn().mockResolvedValue({});

      mockUseAddRow.mockReturnValue({ mutateAsync: addRowMutate } as unknown as MockMutationResult);
      mockUseInsertRowData.mockReturnValue({ mutateAsync: insertRowDataMutate } as unknown as MockMutationResult);
      mockIsFormulaField.mockImplementation((field: any) => field.type === 'formula');

      mockUseTable.mockReturnValue({
        data: {
          model: { id: 'm1' },
          columns: [],
          records: [],
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof mockUseTable>);

      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      const formFields = [
        { id: 'f1', title: 'Formula', type: 'formula', key: 'formula', column_name: 'formula', uidt: 'formula', position: 0, order_index: 0, isSystem: false, system: false, hidden: false, is_hidden: false, config: {} },
      ];

      await result.current.submitForm({ f1: 'x' }, formFields);

      expect(insertRowDataMutate).not.toHaveBeenCalled();
    });

    it('should skip datetime field when date parsing fails', async () => {
      const addRowMutate = vi.fn().mockResolvedValue({ id: 101 });
      const insertRowDataMutate = vi.fn().mockResolvedValue({});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockUseAddRow.mockReturnValue({ mutateAsync: addRowMutate } as unknown as MockMutationResult);
      mockUseInsertRowData.mockReturnValue({ mutateAsync: insertRowDataMutate } as unknown as MockMutationResult);

      mockUseTable.mockReturnValue({
        data: {
          model: { id: 'm1' },
          columns: [],
          records: [],
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof mockUseTable>);

      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      const formFields = [
        { id: 'f1', title: 'When', type: 'datetime', key: 'when', column_name: 'when', uidt: 'datetime', position: 0, order_index: 0, isSystem: false, system: false, hidden: false, is_hidden: false, config: {} },
      ];

      await result.current.submitForm({ f1: 'not-a-date' }, formFields);

      expect(insertRowDataMutate).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('should throw when addRow returns no id', async () => {
      const addRowMutate = vi.fn().mockResolvedValue({});
      mockUseAddRow.mockReturnValue({ mutateAsync: addRowMutate } as unknown as MockMutationResult);

      mockUseTable.mockReturnValue({
        data: {
          model: { id: 'm1' },
          columns: [],
          records: [],
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof mockUseTable>);

      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      await expect(result.current.submitForm({}, [])).rejects.toThrow('Failed to create record - no ID returned');
    });
  });

  describe('updateFieldData', () => {
    it('should map updates and call updateField mutation', async () => {
      const updateFieldMutate = vi.fn().mockResolvedValue({});
      mockUseUpdateField.mockReturnValue({ mutateAsync: updateFieldMutate } as unknown as MockMutationResult);

      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      await result.current.updateFieldData('field-1', {
        name: 'New Title',
        description: 'Updated',
        type: 'text',
        required: true,
        config: { a: 1 },
      });

      expect(updateFieldMutate).toHaveBeenCalledWith({
        fieldId: 'field-1',
        updatedValue: {
          title: 'New Title',
          description: 'Updated',
          uidt: 'text',
          required: true,
          meta: { a: 1 },
        },
      });
    });
  });

  describe('updateFieldOrder', () => {
    it('should update positions and preserve hidden values', async () => {
      const updateViewMutate = vi.fn().mockResolvedValue({});
      mockUseUpdateView.mockReturnValue({ mutateAsync: updateViewMutate } as unknown as MockMutationResult);

      const { result } = renderHook(() => useFormData({ tableId: 't1' }), {
        wrapper: createWrapper(),
      });

      const view = {
        id: 'v1',
        meta: {
          fieldConfig: [
            { id: 'a', position: 0, isHidden: false },
            { id: 'b', position: 1, isHidden: true },
          ],
        },
      };

      const newFields = [
        { id: 'b', isHidden: false },
        { id: 'a', isHidden: true },
        { id: 'c', isHidden: true },
      ];

      await result.current.updateFieldOrder(newFields, view);

      expect(updateViewMutate).toHaveBeenCalledWith({
        viewId: 'v1',
        view: {
          meta: {
            fieldConfig: [
              { id: 'b', position: 0, isHidden: false },
              { id: 'a', position: 1, isHidden: true },
              { id: 'c', position: 2, isHidden: true },
            ],
          },
        },
      });
    });
  });
});
