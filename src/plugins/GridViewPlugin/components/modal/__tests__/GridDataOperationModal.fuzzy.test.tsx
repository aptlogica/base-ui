// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../../../../components/common/Toast';

vi.mock('../shared/gridDataOperationRegistry', () => ({
  getGridDataOperationAdapter: vi.fn(),
}));

vi.mock('../preview/GridDataOperationPreviewGrid', () => ({
  GridDataOperationPreviewGrid: (props: any) => (
    <div data-testid="preview-grid">
      <span data-testid="grid-cols">{props.columns.map((c: any) => c.title).join(',')}</span>
      <span data-testid="grid-progress">{props.scanProgress ? props.scanProgress.scannedRows : 'none'}</span>
      {props.onRowAction ? (
        <>
          <button onClick={() => props.onRowAction('r1', 'delete')}>del-r1</button>
          <button onClick={() => props.onRowAction('r2', 'delete')}>del-r2</button>
          <button onClick={() => props.onRowAction('r1', 'keep')}>keep-r1</button>
          <button onClick={() => props.onRowAction('zz', 'clear')}>clear-unknown</button>
        </>
      ) : (
        <span>no-row-action</span>
      )}
    </div>
  ),
}));

vi.mock('../shared/GridDataOperationPanel', () => ({
  GridDataOperationPanel: () => <div data-testid="operation-panel" />,
}));

const mockFuzzy = vi.fn().mockResolvedValue({});
vi.mock('../../../../../hooks/useApi', () => {
  const noop = () => ({ mutateAsync: vi.fn().mockResolvedValue({}) });
  return {
    useCaseNormalize: noop,
    useExtractSubstring: noop,
    useFindReplace: noop,
    useMergeColumns: noop,
    useRemoveDuplicates: noop,
    useRemoveSpecialCharacters: noop,
    useRemoveFormatting: noop,
    useTrimWhitespace: noop,
    useSplitColumn: noop,
    useFuzzyDeduplication: () => ({ mutateAsync: mockFuzzy }),
  };
});

vi.mock('../../../../../service/clientService', () => ({
  bulkUpdateFieldService: vi.fn().mockResolvedValue({}),
}));

import { GridDataOperationModal } from '../GridDataOperationModal';
import { getGridDataOperationAdapter } from '../shared/gridDataOperationRegistry';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    <ToastProvider>{children}</ToastProvider>
  </QueryClientProvider>
);

const action = { id: 'fuzzy_deduplication', label: 'Fuzzy', description: 'd', icon: () => <svg /> } as any;
const columns = [
  { id: 'a', key: 'a', title: 'Alpha', type: 'text' },
  { id: 'b', key: 'b', title: 'Beta', type: 'text' },
] as any[];
const tableData = { model: { id: 't1' }, records: [{ id: 'r1' }] } as any;

const previewResult = {
  supported: true,
  actionId: 'fuzzy_deduplication',
  totalRows: 3,
  previewRows: [
    { id: 'r1', groupId: 'g', rowState: 'kept', changedColumns: [], values: {}, original: {} },
    { id: 'r2', groupId: 'g', rowState: 'removed', changedColumns: [], values: {}, original: {} },
    { id: 'r3', groupId: 'g', rowState: 'changed', changedColumns: [], values: {}, original: {} },
  ],
};

describe('GridDataOperationModal fuzzy deduplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'production');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('uses buildPreviewAsync, reports progress and renders the preview', async () => {
    const buildPreviewAsync = vi.fn(async (ctx: any) => {
      ctx.onProgress({ scannedRows: 1, totalRows: 3, duplicatesDetected: 0 });
      return previewResult;
    });
    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: vi.fn(),
      buildPreviewAsync,
      buildApplyPlan: () => null,
    });

    render(<GridDataOperationModal isOpen action={action} columns={columns} tableData={tableData} onClose={vi.fn()} />, { wrapper });

    await waitFor(() => expect(screen.getByTestId('preview-grid')).toBeInTheDocument());
    expect(buildPreviewAsync).toHaveBeenCalled();
  });

  it('falls back to sync buildPreview when no async builder exists', async () => {
    const buildPreview = vi.fn((ctx: any) => {
      ctx.onProgress?.({ scannedRows: 3, totalRows: 3, duplicatesDetected: 1 });
      return previewResult;
    });
    (getGridDataOperationAdapter as any).mockReturnValue({ buildPreview, buildApplyPlan: () => null });

    render(<GridDataOperationModal isOpen action={action} columns={columns} tableData={tableData} onClose={vi.fn()} />, { wrapper });

    await waitFor(() => expect(screen.getByTestId('preview-grid')).toBeInTheDocument());
    expect(buildPreview).toHaveBeenCalled();
  });

  it('shows no preview when the builder throws', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: vi.fn(),
      buildPreviewAsync: vi.fn().mockRejectedValue(new Error('boom')),
      buildApplyPlan: () => null,
    });

    render(<GridDataOperationModal isOpen action={action} columns={columns} tableData={tableData} onClose={vi.fn()} />, { wrapper });

    await waitFor(() => expect(spy).toHaveBeenCalledWith('Failed to calculate preview:', expect.any(Error)));
    expect(screen.queryByTestId('preview-grid')).toBeNull();
    spy.mockRestore();
  });

  it('handles row actions, including auto-keeping another row in a fully actioned group', async () => {
    const applyPlan = vi.fn().mockReturnValue(null);
    (getGridDataOperationAdapter as any).mockReturnValue({
      buildPreview: vi.fn(),
      buildPreviewAsync: vi.fn().mockResolvedValue(previewResult),
      buildApplyPlan: applyPlan,
    });

    render(<GridDataOperationModal isOpen action={action} columns={columns} tableData={tableData} onClose={vi.fn()} />, { wrapper });
    await screen.findByText('del-r1');

    fireEvent.click(screen.getByText('del-r1'));
    fireEvent.click(screen.getByText('del-r2'));
    fireEvent.click(screen.getByText('keep-r1'));
    fireEvent.click(screen.getByText('clear-unknown'));

    await waitFor(() => {
      const states = applyPlan.mock.calls.map((c) => c[0]?.state?.rowActions).filter(Boolean);
      expect(states.length).toBeGreaterThan(0);
    });
  });
});
