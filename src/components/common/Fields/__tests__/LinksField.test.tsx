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
let mockColumns: Array<Record<string, unknown>> = [
  { id: 'c-title', column_name: 'title', uidt: 'text', order_index: 1 },
];
let mockRecords: Array<Record<string, unknown>> = [
  { id: 1, title: 'Record One' },
  { id: 2, title: 'Record Two' },
];
let mockIsLoading = false;
let mockHasMore = false;

vi.mock('../../../../hooks/useApi', () => ({
  useTable: () => ({
    data: { data: { records: mockRecords, columns: mockColumns } },
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
    mockColumns = [{ id: 'c-title', column_name: 'title', uidt: 'text', order_index: 1 }];
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

  it('defaults to One to One when relation meta is missing', async () => {
    const user = userEvent.setup();
    render(
      <LinksField
        field={{ id: 'col1', title: 'Rel' }}
        value={[]}
        onChange={vi.fn()}
        currentRowId={10}
        currentTableId="tbl1"
      />
    );

    await user.click(screen.getByRole('button', { name: /rel/i }));
    expect(screen.getByText('One to One')).toBeInTheDocument();
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

  it('resolves stored primary-key values to the linked records', async () => {
    // A composite-key table stores [{code, dept}] instead of ids
    mockRecords = [
      { id: 1, title: 'India HR', code: 'IN', dept: 'HR' },
      { id: 2, title: 'US HR', code: 'US', dept: 'HR' },
    ] as any;
    mockIsLoading = false;
    mutateAsyncMock.mockResolvedValue({});
    const onChange = vi.fn();

    render(
      <LinksField
        field={{ id: 'col1', title: 'Rel', meta: { relation: { with: 'tbl2', type: 'has-many' } } }}
        value={[{ code: 'US', dept: 'HR' }, { code: 'UK', dept: 'OPS' }]}
        onChange={onChange}
        currentRowId={10}
        currentTableId="tbl1"
      />
    );

    expect(screen.getByText('US HR')).toBeInTheDocument();
    expect(screen.queryByText('India HR')).not.toBeInTheDocument();
    // A key without a loaded record shows its values
    expect(screen.getByText('Record UK / OPS')).toBeInTheDocument();
    expect(screen.queryByText(/object Object/)).not.toBeInTheDocument();
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

  it('shows loading indicators when table data is loading', async () => {
    mockIsLoading = true;
    render(
      <LinksField
        field={{ id: 'col1', title: 'Rel', meta: { relation: { with: 'tbl2', type: 'one-to-one' } } }}
        value={[]}
        onChange={vi.fn()}
        currentRowId={10}
        currentTableId="tbl1"
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /rel/i }));
    expect(screen.getByText('Loading records...')).toBeInTheDocument();
  });

  it('opens dropdown from the +count pill when more than two records are selected', async () => {
    const user = userEvent.setup();
    render(
      <LinksField
        field={{ id: 'col1', title: 'Rel', meta: { relation: { with: 'tbl2', type: 'one-to-one' } } }}
        value={[{ id: 1, title: 'Record One' }, { id: 2, title: 'Record Two' }, { id: 3, title: 'Record Three' }]}
        onChange={vi.fn()}
        currentRowId={10}
        currentTableId="tbl1"
      />
    );

    await user.click(screen.getByRole('button', { name: /\+1/i }));
    expect(screen.getByText('One to One')).toBeInTheDocument();
  });

  it('loads more when arrowing past the last record with hasMore', async () => {
    const user = userEvent.setup();
    mockHasMore = true;

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
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    fireEvent.keyDown(window, { key: 'ArrowDown' });

    expect(loadNextPage).toHaveBeenCalled();
  });

  it('reverts optimistic add when linking fails', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    mutateAsyncMock.mockRejectedValueOnce(new Error('fail'));

    const initialValue: any[] = [];
    render(
      <LinksField
        field={{ id: 'col1', title: 'Rel', meta: { relation: { with: 'tbl2', type: 'one-to-one' } } }}
        value={initialValue}
        onChange={onChange}
        currentRowId={10}
        currentTableId="tbl1"
      />
    );

    await user.click(screen.getByRole('button', { name: /rel/i }));
    await user.click(screen.getByText('Record One'));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(onChange).toHaveBeenLastCalledWith(initialValue);
  });

  it('reverts optimistic remove when unlink fails', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    mutateAsyncMock.mockRejectedValueOnce(new Error('fail'));

    const originalValue = [{ id: 1, title: 'Record One' }];
    render(
      <LinksField
        field={{ id: 'col1', title: 'Rel', meta: { relation: { with: 'tbl2', type: 'one-to-one' } } }}
        value={originalValue}
        onChange={onChange}
        currentRowId={10}
        currentTableId="tbl1"
      />
    );

    await user.click(screen.getByRole('button', { name: /rel/i }));
    await user.click(screen.getByRole('button', { name: /unlink record one/i }));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(onChange).toHaveBeenLastCalledWith(originalValue);
  });

  it('hides the current row from the options on a self-link', async () => {
    const user = userEvent.setup();
    render(
      <LinksField
        field={{ id: 'col1', title: 'Rel', meta: { relation: { with: 'tbl1', type: 'many-to-many' } } }}
        value={[]}
        onChange={vi.fn()}
        currentRowId={1}
        currentTableId="tbl1"
      />
    );

    await user.click(screen.getByRole('button', { name: /rel/i }));

    expect(screen.queryByRole('option', { name: /record one/i })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: /record two/i })).toBeInTheDocument();
  });

  it('unlinks an already selected record when its option is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <LinksField
        field={{ id: 'col1', title: 'Rel', meta: { relation: { with: 'tbl2', type: 'many-to-many' } } }}
        value={[{ id: 1, title: 'Record One' }, 2]}
        onChange={onChange}
        currentRowId={10}
        currentTableId="tbl1"
      />
    );

    await user.click(screen.getByRole('button', { name: /rel/i }));
    await user.click(screen.getByRole('option', { name: /record one/i }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith([2]));
    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledWith(expect.objectContaining({ action: 'unlink' })));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Record unlinked successfully'));
  });

  it('appends to existing links on a many-to-many field and keeps the dropdown open', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <LinksField
        field={{ id: 'col1', title: 'Rel', meta: { relation: { with: 'tbl2', type: 'many-to-many' } } }}
        value={[{ id: 1, title: 'Record One' }]}
        onChange={onChange}
        currentRowId={10}
        currentTableId="tbl1"
      />
    );

    await user.click(screen.getByRole('button', { name: /rel/i }));
    await user.click(screen.getByRole('option', { name: /record two/i }));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange.mock.calls[0][0]).toEqual([
      { id: 1, title: 'Record One' },
      expect.objectContaining({ title: 'Record Two' }),
    ]);
    expect(screen.getByRole('listbox', { name: 'Available records' })).toBeInTheDocument();
  });

  it('toggles local selection on a many-to-many field without persisting', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <LinksField
        field={{ id: 'col1', title: 'Rel', meta: { relation: { with: 'tbl2', type: 'many-to-many' } } }}
        value={[{ id: 1, title: 'Record One' }]}
        onChange={onChange}
        currentRowId={10}
        currentTableId="tbl1"
        persistImmediately={false}
      />
    );

    await user.click(screen.getByRole('button', { name: /rel/i }));
    await user.click(screen.getByRole('option', { name: /record one/i }));
    expect(onChange).toHaveBeenLastCalledWith([]);

    await user.click(screen.getByRole('option', { name: /record two/i }));
    expect(onChange.mock.calls[1][0]).toEqual([
      expect.objectContaining({ title: 'Record One' }),
      expect.objectContaining({ title: 'Record Two' }),
    ]);
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });
  describe('display column', () => {
    const people = [
      { id: 1, title: 'Alpha', company: 'Acme Corp' },
      { id: 2, title: 'Beta', company: 'Globex' },
    ];
    const columns = [
      { id: 'c-title', column_name: 'title', uidt: 'text', order_index: 1 },
      { id: 'c-company', column_name: 'company', uidt: 'text', order_index: 2 },
    ];

    it('shows the column chosen for the link, not Title', async () => {
      const user = userEvent.setup();
      mockRecords = people;
      mockColumns = columns;
      render(
        <LinksField
          field={{ id: 'col1', title: 'Rel', meta: { display_column_id: 'c-company', relation: { with: 'tbl2', type: 'has-many' } } }}
          value={[{ id: 1 }]}
          currentRowId={10}
          currentTableId="tbl1"
        />
      );

      await user.click(screen.getByRole('button', { name: /rel/i }));

      expect(screen.getAllByText('Acme Corp').length).toBeGreaterThan(0);
      expect(screen.getByText('Globex')).toBeInTheDocument();
      expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    });

    it('falls back to the first text column when none is chosen', async () => {
      const user = userEvent.setup();
      mockRecords = people;
      mockColumns = columns;
      render(
        <LinksField
          field={{ id: 'col1', title: 'Rel', meta: { relation: { with: 'tbl2', type: 'has-many' } } }}
          value={[]}
          currentRowId={10}
          currentTableId="tbl1"
        />
      );

      await user.click(screen.getByRole('button', { name: /rel/i }));

      expect(screen.getByText('Alpha')).toBeInTheDocument();
      expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
    });

    it('shows Record <id> when the display value is empty', async () => {
      const user = userEvent.setup();
      mockRecords = [{ id: 7, title: 'Alpha', company: '' }];
      mockColumns = columns;
      render(
        <LinksField
          field={{ id: 'col1', title: 'Rel', meta: { display_column_id: 'c-company', relation: { with: 'tbl2', type: 'has-many' } } }}
          value={[]}
          currentRowId={10}
          currentTableId="tbl1"
        />
      );

      await user.click(screen.getByRole('button', { name: /rel/i }));

      expect(screen.getByText('Record 7')).toBeInTheDocument();
    });

    it('searches the chosen column', async () => {
      const user = userEvent.setup();
      mockRecords = people;
      mockColumns = columns;
      render(
        <LinksField
          field={{ id: 'col1', title: 'Rel', meta: { display_column_id: 'c-company', relation: { with: 'tbl2', type: 'has-many' } } }}
          value={[]}
          currentRowId={10}
          currentTableId="tbl1"
        />
      );

      await user.click(screen.getByRole('button', { name: /rel/i }));
      await user.type(screen.getByRole('textbox'), 'globex');

      await waitFor(() => expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument());
      expect(screen.getByText('Globex')).toBeInTheDocument();
    });
  });
});
