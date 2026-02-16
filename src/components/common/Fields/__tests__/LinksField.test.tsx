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

vi.mock('../../../../hooks/useApi', () => ({
  useTable: () => ({
    data: { data: { records: [{ id: 1, title: 'Record One' }, { id: 2, title: 'Record Two' }] } },
    isLoading: false,
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
    hasMore: false,
    totalItems: data.length,
  }),
}));

vi.mock('../../../../hooks/useClickOutside', () => ({
  useClickOutside: () => undefined,
}));

describe('LinksField', () => {
  beforeEach(() => {
    mutateAsyncMock.mockResolvedValue(undefined);
    toastSuccess.mockReset();
    toastError.mockReset();
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
});
