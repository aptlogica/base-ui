import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinksField } from '../LinksField';

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => undefined;
}

const mutateAsyncMock = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();
const refetchQueries = vi.fn();
const loadNextPage = vi.fn();
let mockRecords: Array<{ id: number; title: string }> = [
  { id: 1, title: 'Record One' },
  { id: 2, title: 'Record Two' },
];
let mockIsLoading = false;
let mockHasMore = false;

vi.mock('../../../../hooks/useApi', () => ({
  useTable: () => ({
    data: { data: { records: mockRecords } },
    isLoading: mockIsLoading,
  }),
  useInsertRelationData: () => ({ mutateAsync: mutateAsyncMock }),
}));

vi.mock('../../../common/Toast', () => ({
  useToast: () => ({
    success: toastSuccess,
    error: toastError,
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ refetchQueries }),
}));

vi.mock('../../../../hooks/useFrontendPagination', () => ({
  useFrontendPagination: ({ data }: { data: any[] }) => ({
    allLoadedData: data,
    loadNextPage,
    hasMore: mockHasMore,
    totalItems: data.length,
    isLoadingMore: false,
  }),
}));

vi.mock('../../../../hooks/useClickOutside', () => ({
  useClickOutside: () => undefined,
}));

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 88,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        start: index * 88,
      })),
    scrollToIndex: () => undefined,
  }),
}));

describe('LinksField', () => {
  beforeEach(() => {
    mutateAsyncMock.mockReset();
    mutateAsyncMock.mockResolvedValue(undefined);
    toastSuccess.mockReset();
    toastError.mockReset();
    loadNextPage.mockReset();
    mockRecords = [
      { id: 1, title: 'Record One' },
      { id: 2, title: 'Record Two' },
    ];
    mockIsLoading = false;
    mockHasMore = false;
  });

  it('opens dropdown and links a record', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <LinksField
        field={{ id: 'col1', title: 'Rel', meta: { relation: { with: 'tbl2', type: 'one-to-one' } } }}
        value={[]}
        onChange={onChange}
        currentRowId={10}
        currentTableId="tbl1"
      />
    );

    await user.click(screen.getByRole('button', { name: /rel/i }));
    expect(screen.getByText('One to One')).toBeInTheDocument();

    const record = screen.getByText('Record One');
    await user.click(record);

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalled());
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
  });

  it('removes a selected record with optimistic update', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <LinksField
        field={{ id: 'col1', title: 'Rel', meta: { relation: { with: 'tbl2', type: 'one-to-one' } } }}
        value={[{ id: 1, title: 'Record One' }]}
        onChange={onChange}
        currentRowId={10}
        currentTableId="tbl1"
      />
    );

    await user.click(screen.getByRole('button', { name: /rel/i }));
    const unlinkButton = screen.getByRole('button', { name: /unlink record one/i });
    await user.click(unlinkButton);

    await waitFor(() => expect(onChange).toHaveBeenCalled());
  });

  it('updates local selection without persisting when persistImmediately is false', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <LinksField
        field={{ id: 'col1', title: 'Rel', meta: { relation: { with: 'tbl2', type: 'one-to-one' } } }}
        value={[]}
        onChange={onChange}
        currentRowId={10}
        currentTableId="tbl1"
        persistImmediately={false}
      />
    );

    await user.click(screen.getByRole('button', { name: /rel/i }));
    await user.click(screen.getByText('Record One'));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it('shows has-many label and loads more when requested', async () => {
    const user = userEvent.setup();
    mockHasMore = true;

    render(
      <LinksField
        field={{ id: 'col1', title: 'Rel', meta: { relation: { with: 'tbl2', type: 'has-many' } } }}
        value={[]}
        onChange={vi.fn()}
        currentRowId={10}
        currentTableId="tbl1"
      />
    );

    await user.click(screen.getByRole('button', { name: /rel/i }));
    expect(screen.getByText('Has Many')).toBeInTheDocument();

    const loadMoreButton = screen.getByRole('button', { name: /load more/i });
    await user.click(loadMoreButton);

    expect(loadNextPage).toHaveBeenCalled();
  });

  it('shows many-to-many label and supports clearing search input', async () => {
    const user = userEvent.setup();
    render(
      <LinksField
        field={{ id: 'col1', title: 'Rel', meta: { relation: { with: 'tbl2', type: 'many-to-many' } } }}
        value={[]}
        onChange={vi.fn()}
        currentRowId={10}
        currentTableId="tbl1"
      />
    );

    await user.click(screen.getByRole('button', { name: /rel/i }));
    expect(screen.getByText('Many to Many')).toBeInTheDocument();

    const searchInput = screen.getByLabelText('Search records') as HTMLInputElement;
    await user.type(searchInput, 'rec');
    expect(searchInput.value).toBe('rec');

    const clearButton = searchInput.parentElement?.querySelector('button');
    await user.click(clearButton as HTMLElement);
    expect(searchInput.value).toBe('');
  });

  it('renders loading placeholder when records are not loaded yet', () => {
    mockRecords = [];
    mockIsLoading = false;

    render(
      <LinksField
        field={{ id: 'col1', title: 'Rel', meta: { relation: { with: 'tbl2', type: 'one-to-one' } } }}
        value={[{ id: 9 }]}
        onChange={vi.fn()}
        currentRowId={10}
        currentTableId="tbl1"
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows empty state when no records exist', async () => {
    mockRecords = [];
    mockIsLoading = false;

    render(
      <LinksField
        field={{ id: 'col1', title: 'Rel', meta: { relation: { with: 'tbl2', type: 'one-to-one' } } }}
        value={[]}
        onChange={vi.fn()}
        currentRowId={10}
        currentTableId="tbl1"
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /rel/i }));
    expect(screen.getByText('No records available')).toBeInTheDocument();
  });

  it('ignores interactions when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <LinksField
        field={{ id: 'col1', title: 'Rel', meta: { relation: { with: 'tbl2', type: 'one-to-one' } } }}
        value={[]}
        onChange={onChange}
        currentRowId={10}
        currentTableId="tbl1"
        disabled
      />
    );

    await user.click(screen.getByRole('button', { name: /rel/i }));
    expect(screen.queryByText('One to One')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('supports keyboard selection via arrow and enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <LinksField
        field={{ id: 'col1', title: 'Rel', meta: { relation: { with: 'tbl2', type: 'one-to-one' } } }}
        value={[]}
        onChange={onChange}
        currentRowId={10}
        currentTableId="tbl1"
      />
    );

    await user.click(screen.getByRole('button', { name: /rel/i }));
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    fireEvent.keyDown(window, { key: 'Enter' });

    await waitFor(() => expect(onChange).toHaveBeenCalled());
  });

  it('closes dropdown on Escape key', async () => {
    const user = userEvent.setup();
    render(
      <LinksField
        field={{ id: 'col1', title: 'Rel', meta: { relation: { with: 'tbl2', type: 'one-to-one' } } }}
        value={[]}
        onChange={vi.fn()}
        currentRowId={10}
        currentTableId="tbl1"
      />
    );

    await user.click(screen.getByRole('button', { name: /rel/i }));
    expect(screen.getByText('One to One')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByText('One to One')).not.toBeInTheDocument();
    });
  });

  it('removes selected record from pill and persists immediately', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <LinksField
        field={{ id: 'col1', title: 'Rel', meta: { relation: { with: 'tbl2', type: 'one-to-one' } } }}
        value={[{ id: 1, title: 'Record One' }, { id: 2, title: 'Record Two' }]}
        onChange={onChange}
        currentRowId={10}
        currentTableId="tbl1"
      />
    );

    await user.click(screen.getByRole('button', { name: /rel/i }));
    const unlinkButton = screen.getByRole('button', { name: /unlink record one/i });
    await user.click(unlinkButton);

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalled());
  });

  it('shows error toast when link mutation fails', async () => {
    const user = userEvent.setup();
    mutateAsyncMock.mockRejectedValueOnce(new Error('boom'));

    render(
      <LinksField
        field={{ id: 'col1', title: 'Rel', meta: { relation: { with: 'tbl2', type: 'one-to-one' } } }}
        value={[]}
        onChange={vi.fn()}
        currentRowId={10}
        currentTableId="tbl1"
      />
    );

    await user.click(screen.getByRole('button', { name: /rel/i }));
    await user.click(screen.getByText('Record One'));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
