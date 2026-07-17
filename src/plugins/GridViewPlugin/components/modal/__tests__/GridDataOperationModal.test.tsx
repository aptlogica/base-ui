import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../../../../components/common/Toast';

vi.mock('../shared/gridDataOperationRegistry', () => ({
  getGridDataOperationAdapter: vi.fn(),
}));

vi.mock('../preview/GridDataOperationPreviewGrid', () => ({
  GridDataOperationPreviewGrid: (props: any) => (
    <div data-testid="preview-grid">{Array.isArray(props.columns) ? props.columns.map((c: any) => c.title).join(',') : 'preview'}</div>
  ),
}));

vi.mock('../shared/GridDataOperationPanel', () => ({
  GridDataOperationPanel: (props: any) => (
    <div data-testid="operation-panel">
      Panel
      <button data-testid="set-sep-comma" onClick={() => props.onStateChange?.({ splitSeparatorType: 'comma' })}>comma</button>
      <button data-testid="set-sep-space" onClick={() => props.onStateChange?.({ splitSeparatorType: 'space' })}>space</button>
      <button data-testid="set-sep-dash" onClick={() => props.onStateChange?.({ splitSeparatorType: 'dash' })}>dash</button>
      <button data-testid="set-sep-custom" onClick={() => props.onStateChange?.({ splitSeparatorType: 'custom', splitCustomSeparator: '||' })}>custom</button>
      <button data-testid="set-mode-fixed" onClick={() => props.onStateChange?.({ splitMode: 'fixed_length', splitCharacterCount: '3', splitFixedDirection: 'after' })}>fixed</button>
      <button data-testid="set-mode-pattern" onClick={() => props.onStateChange?.({ splitMode: 'pattern', splitPattern: String.raw`\d+` })}>pattern</button>
      <button data-testid="set-merge-custom-empty" onClick={() => props.onStateChange?.({ mergeFormat: 'custom', mergeCustomSeparator: '', selectedColumnIds: ['a','b'] })}>merge-empty</button>
      <button data-testid="set-merge-custom-filled" onClick={() => props.onStateChange?.({ mergeFormat: 'custom', mergeCustomSeparator: '|' , selectedColumnIds: ['a','b'] })}>merge-filled</button>
      <button data-testid="set-source-nonexist" onClick={() => props.onStateChange?.({ splitSourceColumnId: 'nonexist' })}>set-source-nonexist</button>
      <button data-testid="set-extract-end" onClick={() => props.onStateChange?.({ extractPlacement: 'end_of_table' })}>extract-end</button>
      <button data-testid="set-split-end" onClick={() => props.onStateChange?.({ splitPlacement: 'end_of_table' })}>split-end</button>
      <button data-testid="set-merge-end" onClick={() => props.onStateChange?.({ mergePlacement: 'end_of_table' })}>merge-end</button>
      <button data-testid="set-output-replace" onClick={() => props.onStateChange?.({ splitOutputMode: 'replace_original' })}>output-replace</button>
      <button data-testid="set-empty-cols" onClick={() => props.onStateChange?.({ selectedColumnIds: [] })}>empty-cols</button>
      <button data-testid="set-split-next" onClick={() => props.onStateChange?.({ splitPlacement: 'next_to_original', splitSourceColumnId: 'src' })}>split-next</button>
      <button data-testid="set-extract-next" onClick={() => props.onStateChange?.({ extractPlacement: 'next_to_original', selectedColumnIds: ['src'] })}>extract-next</button>
    </div>
  ),
}));

const mockTrimWhitespace = vi.fn().mockResolvedValue({});
const mockCaseNormalize = vi.fn().mockResolvedValue({});
const mockFindReplace = vi.fn().mockResolvedValue({});
const mockMergeColumns = vi.fn().mockResolvedValue({});
const mockRemoveDuplicates = vi.fn().mockResolvedValue({});
const mockSplitColumn = vi.fn().mockResolvedValue({});
const mockRemoveSpecialCharacters = vi.fn().mockResolvedValue({});
const mockExtractSubstring = vi.fn().mockResolvedValue({});
const mockRemoveFormatting = vi.fn().mockResolvedValue({});
const mockFuzzyDeduplication = vi.fn().mockResolvedValue({});

vi.mock('../../../../../hooks/useApi', () => ({
  useCaseNormalize: () => ({ mutateAsync: mockCaseNormalize }),
  useExtractSubstring: () => ({ mutateAsync: mockExtractSubstring }),
  useFindReplace: () => ({ mutateAsync: mockFindReplace }),
  useMergeColumns: () => ({ mutateAsync: mockMergeColumns }),
  useRemoveDuplicates: () => ({ mutateAsync: mockRemoveDuplicates }),
  useRemoveSpecialCharacters: () => ({ mutateAsync: mockRemoveSpecialCharacters }),
  useRemoveFormatting: () => ({ mutateAsync: mockRemoveFormatting }),
  useTrimWhitespace: () => ({ mutateAsync: mockTrimWhitespace }),
  useSplitColumn: () => ({ mutateAsync: mockSplitColumn }),
  useFuzzyDeduplication: () => ({ mutateAsync: mockFuzzyDeduplication }),
}));

vi.mock('../../../../../components/common/Toast', async (importOriginal) => {
  const actual = await importOriginal();
  const mockSuccess = vi.fn();
  const mockError = vi.fn();
  return {
    ...(actual as any),
    useToast: () => ({
      success: mockSuccess,
      error: mockError,
      info: vi.fn(),
      warning: vi.fn(),
      show: vi.fn(),
    }),
    __mock: { mockSuccess, mockError },
  };
});

vi.mock('../../../../../service/clientService', () => ({
  bulkUpdateFieldService: vi.fn().mockResolvedValue({}),
}));

import { GridDataOperationModal } from '../GridDataOperationModal';
import { getGridDataOperationAdapter } from '../shared/gridDataOperationRegistry';

const createWrapper = () => {
  const client = new QueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
};

const defaultAction = {
  id: 'test_action',
  label: 'Test Action',
  description: 'Does something',
  icon: () => <svg />,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GridDataOperationModal', () => {
  it('renders nothing when closed', () => {
    render(
      <GridDataOperationModal isOpen={false} action={defaultAction as any} columns={[]} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('Test Action')).toBeNull();
  });

  it('renders header and backdrop close button when open', () => {
    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[]} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Test Action')).toBeInTheDocument();
    const backdrop = screen.getByLabelText('Close grid action modal');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape key', () => {
    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[]} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error toast when applying without table data', async () => {
    const { __mock } = (await import('../../../../../components/common/Toast')) as any;
    const adapter = { buildPreview: () => ({ foo: true }), buildApplyPlan: () => ({ kind: 'other', columnUpdates: [] }) };
    (getGridDataOperationAdapter as any).mockReturnValue(adapter);

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[]} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    const applyButton = screen.getByText('Apply');
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(__mock.mockError).toHaveBeenCalledWith('Table data is not available.', { title: 'Merge failed' });
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it('disables Apply when merge action has insufficient columns selected', async () => {
    const mergeAction = { ...defaultAction, id: 'merge_column' } as any;
    // Adapter returns no preview to ensure applyPlan is not available
    (getGridDataOperationAdapter as any).mockReturnValue({ buildPreview: () => null, buildApplyPlan: () => null });

    render(
      <GridDataOperationModal isOpen action={mergeAction} columns={[]} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    const applyButton = screen.getByText('Apply') as HTMLButtonElement;
    expect(applyButton.disabled).toBe(true);
  });

  it('applies merge action and shows success toast', async () => {
    const { __mock } = (await import('../../../../../components/common/Toast')) as any;
    const tableData = { model: { id: 'table-1' } } as any;
    const mergeApplyPlan = { kind: 'merge_column', mergeColumn: { modelId: 'table-1', sourceColumnIds: ['a','b'], mergedColumnTitle: 'M', mergeFormat: 'space', mergeCustomSeparator: '', mergeKeepOriginalColumns: true, mergePlacement: 'next_to_original' } } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => mergeApplyPlan,
    });

    // default mocked mutation will be used (mutateAsync is a mock function)
    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'a' } as any, { id: 'b' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    const applyButton = screen.getByText('Apply');
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(__mock.mockSuccess).toHaveBeenCalledWith('Columns merged successfully.', { title: 'Success' });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('applies trim_whitespace and closes', async () => {
    const tableData = { model: { id: 'table-1' } } as any;
    const trimPlan = { kind: 'trim_whitespace', trimWhitespace: { modelId: 'table-1', columns: ['c1'], trimMode: 'both' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => trimPlan,
    });

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'c1' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(mockTrimWhitespace).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('falls back to bulkUpdateFieldService when handler is missing', async () => {
    const tableData = { model: { id: 'table-2' } } as any;
    const fallbackPlan = { kind: 'unknown_kind', columnUpdates: [{ columnId: 'col1', updates: [{ id: 'r1', value: 'v' }] }], optimisticRecords: [{ id: 'r1', col1: 'v' }] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => fallbackPlan,
    });

    const clientService = await import('../../../../../service/clientService');

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'col1' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(clientService.bulkUpdateFieldService).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it.each([
    ['case_normalization', mockCaseNormalize, { caseNormalization: { modelId: 't', columns: ['c'], caseFormat: 'lower' } }],
    ['find_replace', mockFindReplace, { findReplace: { modelId: 't', columns: ['c'], findValue: 'a', replaceValue: 'b', matchType: 'exact' } }],
    ['remove_duplicates', mockRemoveDuplicates, { removeDuplicates: { modelId: 't', columns: ['c'], duplicateAction: 'remove_row', keepRule: 'keep_first' } }],
    ['split_column', mockSplitColumn, { splitColumn: { modelId: 't', sourceColumnId: 'col1' } }],
    ['remove_special_characters', mockRemoveSpecialCharacters, { removeSpecialCharacters: { modelId: 't', columns: ['c'], specialCharactersType: 'symbols', custom: '' } }],
    ['extract_substring', mockExtractSubstring, { extractSubstring: { modelId: 't', sourceColumnId: 'col1', outputColumnTitle: 'Out', outputColumnId: 'out', extractionMethod: 'extraction_type', extractionType: 'email', keepOriginalColumn: true, placement: 'end_of_table' } }],
    ['remove_formatting', mockRemoveFormatting, { removeFormatting: { modelId: 't', columns: ['c'], formatting: 'currency', customPattern: '' } }],
    ['fuzzy_deduplication', mockFuzzyDeduplication, { fuzzyDeduplication: { modelId: 't', columns: ['c'], threshold: 'medium', duplicateAction: 'remove_row', keepRule: 'keep_first' } }],
  ])('applies %s handler and closes', async (kind, mockFn, payload) => {
    const tableData = { model: { id: 't' }, columns: [{ id: 'col1', order_index: 0 }] } as any;
    const applyPlan = { kind, ...payload, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => applyPlan,
    });

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'col1' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect((mockFn as any)).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('applies split with comma delimiter when state changed', async () => {
    const tableData = { model: { id: 't' } } as any;
    const splitPlan = { kind: 'split_column', splitColumn: { modelId: 't', sourceColumnId: 'scol' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => splitPlan,
    });

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'scol', title: 'S' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByTestId('set-sep-comma'));
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(mockSplitColumn).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('applies split with custom delimiter when state changed', async () => {
    const tableData = { model: { id: 't' } } as any;
    const splitPlan = { kind: 'split_column', splitColumn: { modelId: 't', sourceColumnId: 'scol' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => splitPlan,
    });

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'scol', title: 'S' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByTestId('set-sep-custom'));
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(mockSplitColumn).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('applies split with fixed length when state changed', async () => {
    const tableData = { model: { id: 't' } } as any;
    const splitPlan = { kind: 'split_column', splitColumn: { modelId: 't', sourceColumnId: 'scol' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => splitPlan,
    });

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'scol', title: 'S' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByTestId('set-mode-fixed'));
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(mockSplitColumn).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('applies split with pattern when state changed', async () => {
    const tableData = { model: { id: 't' } } as any;
    const splitPlan = { kind: 'split_column', splitColumn: { modelId: 't', sourceColumnId: 'scol' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => splitPlan,
    });

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'scol', title: 'S' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByTestId('set-mode-pattern'));
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(mockSplitColumn).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('applies split with space delimiter when state changed', async () => {
    const tableData = { model: { id: 't' } } as any;
    const splitPlan = { kind: 'split_column', splitColumn: { modelId: 't', sourceColumnId: 'scol' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => splitPlan,
    });

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'scol', title: 'S' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByTestId('set-sep-space'));
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(mockSplitColumn).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('applies merge action with custom separator and shows success toast', async () => {
    const { __mock } = (await import('../../../../../components/common/Toast')) as any;
    const tableData = { model: { id: 'table-2' } } as any;
    const mergeApplyPlan = { kind: 'merge_column', mergeColumn: { modelId: 'table-2', sourceColumnIds: ['a','b'], mergedColumnTitle: 'M', mergeFormat: 'custom', mergeCustomSeparator: '|', mergeKeepOriginalColumns: true, mergePlacement: 'next_to_original' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => mergeApplyPlan,
    });

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'a' } as any, { id: 'b' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByTestId('set-merge-custom-filled'));
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(mockMergeColumns).toHaveBeenCalled();
      expect(__mock.mockSuccess).toHaveBeenCalledWith('Columns merged successfully.', { title: 'Success' });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('falls back to bulkUpdateFieldService for multiple update groups', async () => {
    const tableData = { model: { id: 'table-3' } } as any;
    const fallbackPlan = { kind: 'unknown_kind', columnUpdates: [
      { columnId: 'col1', updates: [{ id: 'r1', value: 'v' }] },
      { columnId: 'col2', updates: [{ id: 'r2', value: 'v2' }] },
    ], optimisticRecords: [{ id: 'r1' }, { id: 'r2' }] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => fallbackPlan,
    });

    const clientService = await import('../../../../../service/clientService');

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'col1' } as any, { id: 'col2' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(clientService.bulkUpdateFieldService).toHaveBeenCalledTimes(2);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('applies split with dash delimiter when state changed', async () => {
    const tableData = { model: { id: 't' } } as any;
    const splitPlan = { kind: 'split_column', splitColumn: { modelId: 't', sourceColumnId: 'scol' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => splitPlan,
    });

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'scol', title: 'S' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByTestId('set-sep-dash'));
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(mockSplitColumn).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles apply error and rolls back previous query data', async () => {
    const client = new QueryClient();
    const prevData = { data: { columns: [], records: [] } };
    client.setQueryData(['tables', 'table-err'], prevData);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    );

    const tableData = { model: { id: 'table-err' }, columns: [{ id: 'src', order_index: 0 }] } as any;
    const splitPlan = { kind: 'split_column', splitColumn: { modelId: 'table-err', sourceColumnId: 'src' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => splitPlan,
    });

    mockSplitColumn.mockRejectedValueOnce(new Error('split failed'));

    const spySet = vi.spyOn(client, 'setQueryData');

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'src', title: 'S' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper }
    );

    fireEvent.click(screen.getByTestId('set-sep-comma'));
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(spySet).toHaveBeenCalledWith(['tables', 'table-err'], prevData);
    });
  });

  it.each([
    'trim_whitespace','case_normalization','find_replace','remove_duplicates','merge_column','split_column','remove_special_characters','extract_substring','remove_formatting','fuzzy_deduplication',
  ])('falls back to bulkUpdateFieldService when %s handler config missing', async (kind) => {
    const tableData = { model: { id: `tb-${kind}` } } as any;
    const fallbackPlan = { kind, columnUpdates: [{ columnId: 'col1', updates: [{ id: 'r1', value: 'v' }] }], optimisticRecords: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => fallbackPlan,
    });

    const clientService = await import('../../../../../service/clientService');

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'col1' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(clientService.bulkUpdateFieldService).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('renders preview additions next to source column when provided', async () => {
    const tableData = { model: { id: 't' } } as any;
    const preview = { virtualColumns: [{ id: 'virtual_col', title: 'Virtual Title' }] } as any;
    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => preview,
      buildApplyPlan: () => ({ kind: 'other', columnUpdates: [] }),
    });

    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 's1', title: 'Source' } as any]} tableData={tableData} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('preview-grid')).toHaveTextContent('Virtual Title');
  });

  it('replaces existing column title when virtual column id matches identity', async () => {
    const tableData = { model: { id: 't' } } as any;
    const preview = { virtualColumns: [{ id: 'col1', title: 'Replaced Title' }] } as any;
    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => preview,
      buildApplyPlan: () => ({ kind: 'other', columnUpdates: [] }),
    });

    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'col1', title: 'Orig' } as any]} tableData={tableData} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('preview-grid')).toHaveTextContent('Replaced Title');
  });

  it('shows merge custom separator validation error when custom separator is empty', async () => {
    await import('../../../../../components/common/Toast');
    const mergeAction = { ...defaultAction, id: 'merge_column' } as any;
    (getGridDataOperationAdapter as any).mockReturnValue({ buildPreview: () => null, buildApplyPlan: () => null });

    const tableData = { model: { id: 't' } } as any;
    render(
      <GridDataOperationModal isOpen action={mergeAction} columns={[{ id: 'a' } as any]} tableData={tableData} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByTestId('set-merge-custom-empty'));
    const applyBtn = screen.getByText('Apply') as HTMLButtonElement;
    await waitFor(() => {
      expect(applyBtn.disabled).toBe(true);
    });
  });

  it.each([
    'url','domain','keywords','mentions','tags','emoji','phone','prefix','',
  ])('applies extract_substring for type %s with keepOriginal true', async (etype) => {
    const tableData = { model: { id: 't' }, columns: [{ id: 'src', order_index: 0 }, { id: 'other', order_index: 1 }] } as any;
    const extractPlan = { kind: 'extract_substring', extractSubstring: { modelId: 't', sourceColumnId: 'src', outputColumnTitle: '', outputColumnId: '', extractionMethod: 'extraction_type', extractionType: etype || 'email', keepOriginalColumn: true, placement: 'next_to_original' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => extractPlan,
    });

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'src', title: 'S' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(mockExtractSubstring).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('applies extract_substring and replaces original when keepOriginal false', async () => {
    const tableData = { model: { id: 't' }, columns: [{ id: 'src', order_index: 0 }] } as any;
    const extractPlan = { kind: 'extract_substring', extractSubstring: { modelId: 't', sourceColumnId: 'src', outputColumnTitle: 'New', outputColumnId: 'new', extractionMethod: 'extraction_type', extractionType: 'email', keepOriginalColumn: false, placement: 'end_of_table' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => extractPlan,
    });

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'src', title: 'S' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(mockExtractSubstring).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('renders preview additions at end when placement is end_of_table', async () => {
    const tableData = { model: { id: 't' } } as any;
    const preview = { virtualColumns: [{ id: 'virtual_end', title: 'End Title' }] } as any;
    const splitAction = { ...defaultAction, id: 'split_column' } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => preview,
      buildApplyPlan: () => ({ kind: 'split_column', columnUpdates: [] }),
    });

    render(
      <GridDataOperationModal isOpen action={splitAction} columns={[{ id: 's1', title: 'Source' } as any]} tableData={tableData} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('preview-grid')).toHaveTextContent('End Title');
  });

  it('resolves merge_column source identity from last selected column', async () => {
    const tableData = { model: { id: 't' } } as any;
    const mergeAction = { ...defaultAction, id: 'merge_column' } as any;
    const preview = { virtualColumns: [{ id: 'merged', title: 'Merged' }] } as any;
    const mergeApplyPlan = { kind: 'merge_column', mergeColumn: { modelId: 't', sourceColumnIds: ['a','b'], mergedColumnTitle: 'M', mergeFormat: 'space', mergeCustomSeparator: '', mergeKeepOriginalColumns: true, mergePlacement: 'next_to_original' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => preview,
      buildApplyPlan: () => mergeApplyPlan,
    });

    render(
      <GridDataOperationModal isOpen action={mergeAction} columns={[{ id: 'a', title: 'A' } as any, { id: 'b', title: 'B' } as any]} tableData={tableData} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('preview-grid')).toHaveTextContent('Merged');
  });

  it('applies extract_substring with between_characters method', async () => {
    const tableData = { model: { id: 't' }, columns: [{ id: 'src', order_index: 0 }] } as any;
    const extractPlan = { kind: 'extract_substring', extractSubstring: { modelId: 't', sourceColumnId: 'src', outputColumnTitle: '', outputColumnId: '', extractionMethod: 'between_characters', extractionType: 'email', startAfter: '[', endBefore: ']', keepOriginalColumn: true, placement: 'end_of_table' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => extractPlan,
    });

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'src', title: 'S' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(mockExtractSubstring).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('uses column position when order_index is missing', async () => {
    const tableData = { model: { id: 't' }, columns: [{ id: 'src', position: 5 }] } as any;
    const extractPlan = { kind: 'extract_substring', extractSubstring: { modelId: 't', sourceColumnId: 'src', outputColumnTitle: 'Out', outputColumnId: 'out', extractionMethod: 'extraction_type', extractionType: 'email', keepOriginalColumn: true, placement: 'next_to_original' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => extractPlan,
    });

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'src', title: 'S', position: 5 } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(mockExtractSubstring).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows error toast with nested response message on apply failure', async () => {
    const { __mock } = (await import('../../../../../components/common/Toast')) as any;
    const client = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    );

    const tableData = { model: { id: 'table-err2' }, columns: [{ id: 'src', order_index: 0 }] } as any;
    const mergeApplyPlan = { kind: 'merge_column', mergeColumn: { modelId: 'table-err2', sourceColumnIds: ['a','b'], mergedColumnTitle: 'M', mergeFormat: 'space', mergeCustomSeparator: '', mergeKeepOriginalColumns: true, mergePlacement: 'next_to_original' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => mergeApplyPlan,
    });

    mockMergeColumns.mockRejectedValueOnce({ response: { data: { error: { message: 'merge error from api' } } } });

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'a' } as any, { id: 'b' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper }
    );

    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(__mock.mockError).toHaveBeenCalledWith('merge error from api', { title: 'Merge failed' });
    });
  });

  it('resolves extract_substring source column via matchesSelectedColumn fallback', async () => {
    const tableData = { model: { id: 't' }, columns: [{ id: 'col_x', key: 'col_x', column_name: 'col_x', title: 'X', order_index: 0 }] } as any;
    const extractAction = { ...defaultAction, id: 'extract_substring' } as any;
    const extractPlan = { kind: 'extract_substring', extractSubstring: { modelId: 't', sourceColumnId: 'col_x', outputColumnTitle: 'Out', outputColumnId: 'out', extractionMethod: 'extraction_type', extractionType: 'email', keepOriginalColumn: false, placement: 'end_of_table' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [{ id: 'out', title: 'Out' }] }),
      buildApplyPlan: () => extractPlan,
    });

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={extractAction} columns={[{ id: 'col_x', key: 'col_x', column_name: 'col_x', title: 'X' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('preview-grid')).toHaveTextContent('Out');

    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(mockExtractSubstring).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows error toast with response.data.message on apply failure', async () => {
    const { __mock } = (await import('../../../../../components/common/Toast')) as any;
    const client = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    );

    const tableData = { model: { id: 'table-err3' } } as any;
    const mergeApplyPlan = { kind: 'merge_column', mergeColumn: { modelId: 'table-err3', sourceColumnIds: ['a','b'], mergedColumnTitle: 'M', mergeFormat: 'space', mergeCustomSeparator: '', mergeKeepOriginalColumns: true, mergePlacement: 'next_to_original' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => mergeApplyPlan,
    });

    mockMergeColumns.mockRejectedValueOnce({ response: { data: { message: 'data level message' } } });

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'a' } as any, { id: 'b' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper }
    );

    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(__mock.mockError).toHaveBeenCalledWith('data level message', { title: 'Merge failed' });
    });
  });

  it('shows error toast with error.message on apply failure', async () => {
    const { __mock } = (await import('../../../../../components/common/Toast')) as any;
    const client = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    );

    const tableData = { model: { id: 'table-err4' } } as any;
    const trimPlan = { kind: 'trim_whitespace', trimWhitespace: { modelId: 'table-err4', columns: ['a'], trimMode: 'both' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => trimPlan,
    });

    mockTrimWhitespace.mockRejectedValueOnce({ message: 'plain error message' });

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'a' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper }
    );

    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(__mock.mockError).toHaveBeenCalledWith('plain error message', { title: 'Action failed' });
    });
  });

  it('shows fallback error message when no error details available', async () => {
    const { __mock } = (await import('../../../../../components/common/Toast')) as any;
    const client = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    );

    const tableData = { model: { id: 'table-err5' } } as any;
    const trimPlan = { kind: 'trim_whitespace', trimWhitespace: { modelId: 'table-err5', columns: ['a'], trimMode: 'both' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => trimPlan,
    });

    mockTrimWhitespace.mockRejectedValueOnce({});

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'a' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper }
    );

    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(__mock.mockError).toHaveBeenCalledWith('Failed to merge columns. Please try again.', { title: 'Action failed' });
    });
  });

  it('handles merge_column action with no selected columns for placement', async () => {
    const tableData = { model: { id: 't' } } as any;
    const mergeAction = { ...defaultAction, id: 'merge_column' } as any;
    const preview = { virtualColumns: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => preview,
      buildApplyPlan: () => null,
    });

    render(
      <GridDataOperationModal isOpen action={mergeAction} columns={[]} tableData={tableData} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    const applyBtn = screen.getByText('Apply') as HTMLButtonElement;
    expect(applyBtn.disabled).toBe(true);
  });

  it('renders preview with split_column source column placement', async () => {
    const tableData = { model: { id: 't' } } as any;
    const splitAction = { ...defaultAction, id: 'split_column' } as any;
    const preview = { virtualColumns: [{ id: 'split1', title: 'Split 1' }] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => preview,
      buildApplyPlan: () => ({ kind: 'split_column', columnUpdates: [] }),
    });

    render(
      <GridDataOperationModal isOpen action={splitAction} columns={[{ id: 'src', title: 'Source' } as any]} tableData={tableData} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('preview-grid')).toHaveTextContent('Split 1');
  });

  it('covers applyOptimisticGridDataUpdate with non-merge action', async () => {
    const client = new QueryClient();
    const existingData = { data: { records: [{ id: 'r1' }], columns: [] } };
    client.setQueryData(['tables', 'table-opt'], existingData);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    );

    const tableData = { model: { id: 'table-opt' }, columns: [] } as any;
    const trimPlan = { kind: 'trim_whitespace', trimWhitespace: { modelId: 'table-opt', columns: ['a'], trimMode: 'both' }, columnUpdates: [], optimisticRecords: [{ id: 'r1', updated: true }] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => trimPlan,
    });

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'a' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper }
    );

    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(mockTrimWhitespace).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles extract_substring when source not found in updateTableCache', async () => {
    const tableData = { model: { id: 't' }, columns: [{ id: 'other', order_index: 0 }] } as any;
    const extractPlan = { kind: 'extract_substring', extractSubstring: { modelId: 't', sourceColumnId: 'nonexistent', outputColumnTitle: 'Out', outputColumnId: 'out', extractionMethod: 'extraction_type', extractionType: 'email', keepOriginalColumn: true, placement: 'end_of_table' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => extractPlan,
    });

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'nonexistent', title: 'S' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(mockExtractSubstring).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('applies split column with keep original false', async () => {
    const tableData = { model: { id: 't' } } as any;
    const splitPlan = { kind: 'split_column', splitColumn: { modelId: 't', sourceColumnId: 'scol' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => splitPlan,
    });

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'scol', title: 'S' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(mockSplitColumn).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('updates extract placement via state change', async () => {
    const tableData = { model: { id: 't' } } as any;
    const extractAction = { ...defaultAction, id: 'extract_substring' } as any;
    const preview = { virtualColumns: [{ id: 'out', title: 'Out' }] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => preview,
      buildApplyPlan: () => ({ kind: 'extract_substring', columnUpdates: [] }),
    });

    render(
      <GridDataOperationModal isOpen action={extractAction} columns={[{ id: 'src', title: 'Source' } as any]} tableData={tableData} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByTestId('set-extract-end'));
    expect(screen.getByTestId('preview-grid')).toBeInTheDocument();
  });

  it('updates split placement via state change', async () => {
    const tableData = { model: { id: 't' } } as any;
    const splitAction = { ...defaultAction, id: 'split_column' } as any;
    const preview = { virtualColumns: [{ id: 'split1', title: 'Split1' }] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => preview,
      buildApplyPlan: () => ({ kind: 'split_column', columnUpdates: [] }),
    });

    render(
      <GridDataOperationModal isOpen action={splitAction} columns={[{ id: 'src', title: 'Source' } as any]} tableData={tableData} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByTestId('set-split-end'));
    expect(screen.getByTestId('preview-grid')).toBeInTheDocument();
  });

  it('updates merge placement via state change', async () => {
    const tableData = { model: { id: 't' } } as any;
    const mergeAction = { ...defaultAction, id: 'merge_column' } as any;
    const preview = { virtualColumns: [{ id: 'merged', title: 'Merged' }] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => preview,
      buildApplyPlan: () => ({ kind: 'merge_column', columnUpdates: [] }),
    });

    render(
      <GridDataOperationModal isOpen action={mergeAction} columns={[{ id: 'a', title: 'A' } as any, { id: 'b', title: 'B' } as any]} tableData={tableData} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByTestId('set-merge-end'));
    expect(screen.getByTestId('preview-grid')).toBeInTheDocument();
  });

  it('handles empty selectedColumnIds in state change', async () => {
    const tableData = { model: { id: 't' } } as any;
    const mergeAction = { ...defaultAction, id: 'merge_column' } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => null,
      buildApplyPlan: () => null,
    });

    render(
      <GridDataOperationModal isOpen action={mergeAction} columns={[{ id: 'a', title: 'A' } as any]} tableData={tableData} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByTestId('set-empty-cols'));
    const applyBtn = screen.getByText('Apply') as HTMLButtonElement;
    expect(applyBtn.disabled).toBe(true);
  });

  it('applies split with replace_original output mode', async () => {
    const tableData = { model: { id: 't' } } as any;
    const splitPlan = { kind: 'split_column', splitColumn: { modelId: 't', sourceColumnId: 'scol' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => splitPlan,
    });

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'scol', title: 'S' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByTestId('set-output-replace'));
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(mockSplitColumn).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('renders preview with split_column next_to_original placement where sourceIndex >= 0', async () => {
    const tableData = { model: { id: 't' } } as any;
    const splitAction = { ...defaultAction, id: 'split_column' } as any;
    const preview = { virtualColumns: [{ id: 'split_out', title: 'SplitOut' }] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => preview,
      buildApplyPlan: () => ({ kind: 'split_column', columnUpdates: [] }),
    });

    render(
      <GridDataOperationModal isOpen action={splitAction} columns={[{ id: 'src', title: 'Source' } as any, { id: 'other', title: 'Other' } as any]} tableData={tableData} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByTestId('set-split-next'));
    expect(screen.getByTestId('preview-grid')).toHaveTextContent('SplitOut');
  });

  it('renders preview with extract_substring next_to_original placement where sourceIndex >= 0', async () => {
    const tableData = { model: { id: 't' } } as any;
    const extractAction = { ...defaultAction, id: 'extract_substring' } as any;
    const preview = { virtualColumns: [{ id: 'ext_out', title: 'ExtOut' }] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => preview,
      buildApplyPlan: () => ({ kind: 'extract_substring', columnUpdates: [] }),
    });

    render(
      <GridDataOperationModal isOpen action={extractAction} columns={[{ id: 'src', title: 'Source' } as any, { id: 'other', title: 'Other' } as any]} tableData={tableData} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByTestId('set-extract-next'));
    expect(screen.getByTestId('preview-grid')).toHaveTextContent('ExtOut');
  });

  it('covers getPreviewSourceColumnIdentity with non-matched selectedId for extract_substring', async () => {
    const tableData = { model: { id: 't' } } as any;
    const extractAction = { ...defaultAction, id: 'extract_substring' } as any;
    const preview = { virtualColumns: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => preview,
      buildApplyPlan: () => null,
    });

    render(
      <GridDataOperationModal isOpen action={extractAction} columns={[{ id: 'col1', title: 'Col1' } as any]} tableData={tableData} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('preview-grid')).toBeInTheDocument();
  });

  it('covers buildPreviewColumns with sourceIndex < 0', async () => {
    const tableData = { model: { id: 't' } } as any;
    const splitAction = { ...defaultAction, id: 'split_column' } as any;
    const preview = { virtualColumns: [{ id: 'new_col', title: 'NewCol' }] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => preview,
      buildApplyPlan: () => ({ kind: 'split_column', columnUpdates: [] }),
    });

    render(
      <GridDataOperationModal isOpen action={splitAction} columns={[{ id: 'other', title: 'Other' } as any]} tableData={tableData} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    // source column 'other' is not the splitSourceColumnId, so sourceIndex will be -1
    fireEvent.click(screen.getByTestId('set-split-next'));
    expect(screen.getByTestId('preview-grid')).toHaveTextContent('NewCol');
  });

  it.each([
    ['url', 'Extracted URL'],
    ['domain', 'Extracted Domain'],
    ['keywords', 'Extracted Keywords'],
    ['mentions', 'Extracted Mentions'],
    ['tags', 'Extracted Tags'],
    ['emoji', 'Extracted Emoji'],
    ['phone', 'Extracted Phone'],
    ['prefix', 'Extracted Prefix'],
  ])('applies extract_substring with type %s', async (etype, _expectedTitle) => {
    const tableData = { model: { id: 't' }, columns: [{ id: 'src', order_index: 0 }] } as any;
    const extractPlan = { kind: 'extract_substring', extractSubstring: { modelId: 't', sourceColumnId: 'src', outputColumnTitle: '', outputColumnId: '', extractionMethod: 'extraction_type', extractionType: etype, keepOriginalColumn: true, placement: 'end_of_table' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => extractPlan,
    });

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'src', title: 'S' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(mockExtractSubstring).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('uses fallback order when column has no order_index or position', async () => {
    const tableData = { model: { id: 't' }, columns: [{ id: 'src', title: 'S' }] } as any;
    const extractPlan = { kind: 'extract_substring', extractSubstring: { modelId: 't', sourceColumnId: 'src', outputColumnTitle: 'Out', outputColumnId: 'out', extractionMethod: 'extraction_type', extractionType: 'email', keepOriginalColumn: true, placement: 'next_to_original' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => extractPlan,
    });

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'src', title: 'S' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(mockExtractSubstring).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles preview with empty columns array for source fallback', async () => {
    const tableData = { model: { id: 't' } } as any;
    const splitAction = { ...defaultAction, id: 'split_column' } as any;
    const preview = { virtualColumns: [{ id: 'virt', title: 'Virtual' }] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => preview,
      buildApplyPlan: () => null,
    });

    render(
      <GridDataOperationModal isOpen action={splitAction} columns={[]} tableData={tableData} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('preview-grid')).toHaveTextContent('Virtual');
  });

  it('covers getPreviewAdditionsSourceColumn fallback to first column', async () => {
    const tableData = { model: { id: 't' } } as any;
    const mergeAction = { ...defaultAction, id: 'merge_column' } as any;
    const preview = { virtualColumns: [{ id: 'merged_col', title: 'MergedCol' }] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => preview,
      buildApplyPlan: () => ({ kind: 'merge_column', columnUpdates: [] }),
    });

    render(
      <GridDataOperationModal isOpen action={mergeAction} columns={[{ id: 'first', title: 'First' } as any, { id: 'second', title: 'Second' } as any]} tableData={tableData} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('preview-grid')).toHaveTextContent('MergedCol');
  });

  it('applies extract_substring with default extraction type', async () => {
    const tableData = { model: { id: 't' }, columns: [{ id: 'src', order_index: 0 }] } as any;
    const extractPlan = { kind: 'extract_substring', extractSubstring: { modelId: 't', sourceColumnId: 'src', outputColumnTitle: '', outputColumnId: '', extractionMethod: 'extraction_type', extractionType: 'unknown_type', keepOriginalColumn: true, placement: 'end_of_table' }, columnUpdates: [] } as any;

    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: () => ({ virtualColumns: [] }),
      buildApplyPlan: () => extractPlan,
    });

    const onClose = vi.fn();
    render(
      <GridDataOperationModal isOpen action={defaultAction as any} columns={[{ id: 'src', title: 'S' } as any]} tableData={tableData} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(mockExtractSubstring).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
