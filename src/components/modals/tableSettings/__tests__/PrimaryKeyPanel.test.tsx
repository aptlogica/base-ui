import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PrimaryKeyPanel from '../PrimaryKeyPanel';
import { usePrimaryKey } from '../../../../hooks/useApi';
import type { PrimaryKey, PrimaryKeyColumn } from '../../../../service/clientService';

const mutateAsync = vi.fn();

vi.mock('../../../../hooks/useApi', () => ({
  usePrimaryKey: vi.fn(),
  useUpdatePrimaryKey: () => ({ mutateAsync, isPending: false }),
}));

const usePrimaryKeyMock = vi.mocked(usePrimaryKey);

const column = (id: string, title: string, uidt: string, extra: Partial<PrimaryKeyColumn> = {}): PrimaryKeyColumn => ({
  id, title, column_name: title.toLowerCase(), uidt, system: false, in_key: false, eligible: true, ...extra,
});

const COLUMNS = [
  column('c-id', 'Id', 'number', { system: true, in_key: true }),
  column('c-code', 'Code', 'text'),
  column('c-dept', 'Dept', 'select'),
  column('c-tags', 'Tags', 'multiSelect', { eligible: false, reason: 'Holds multiple or long values' }),
  column('c-by', 'Created By', 'createdBy', { system: true, eligible: false, reason: 'Filled in automatically by the system' }),
];

const key = (extra: Partial<PrimaryKey> = {}): PrimaryKey => ({
  model_id: 't1', column_ids: ['c-id'], column_names: ['id'], locked: false, link_columns: [], columns: COLUMNS, ...extra,
});

const mockKey = (value: PrimaryKey | undefined, state: { isLoading?: boolean; error?: unknown } = {}) => {
  usePrimaryKeyMock.mockReturnValue({ data: value, isLoading: !!state.isLoading, error: state.error ?? null } as any);
};

const checkbox = (title: string) => screen.getByRole('checkbox', { name: `Use ${title} in the primary key` });

describe('PrimaryKeyPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the current key with id preselected', () => {
    mockKey(key());
    render(<PrimaryKeyPanel table={{ id: 't1' }} />);

    expect(usePrimaryKeyMock).toHaveBeenCalledWith('t1');
    expect(screen.getByTestId('primary-key-summary')).toHaveTextContent('Id');
    expect(checkbox('Id')).toBeChecked();
    expect(checkbox('Code')).not.toBeChecked();
  });

  it('labels field types, including the audit types', () => {
    mockKey(key());
    render(<PrimaryKeyPanel table={{ id: 't1' }} />);

    expect(screen.getByText('Single line text')).toBeInTheDocument();
    expect(screen.getByText('Created by')).toBeInTheDocument();
    expect(screen.queryByText('Links')).not.toBeInTheDocument();
  });

  it('explains the starting values new records get once the key uses other fields', async () => {
    mockKey(key());
    render(<PrimaryKeyPanel table={{ id: 't1' }} />);
    expect(screen.queryByTestId('primary-key-new-rows')).not.toBeInTheDocument();

    await userEvent.click(checkbox('Code'));

    expect(screen.getByTestId('primary-key-new-rows')).toHaveTextContent('code_20261013101523123456_42');
  });

  it('keeps at least one key field selected', () => {
    mockKey(key());
    render(<PrimaryKeyPanel table={{ id: 't1' }} />);

    expect(checkbox('Id')).toBeDisabled();
  });

  it('disables fields that cannot be key fields and says why', () => {
    mockKey(key());
    render(<PrimaryKeyPanel table={{ id: 't1' }} />);

    expect(checkbox('Tags')).toBeDisabled();
    expect(screen.getByText('Holds multiple or long values')).toBeInTheDocument();
  });

  it('builds a composite key in the order fields are picked and saves it', async () => {
    mockKey(key());
    mutateAsync.mockResolvedValue({});
    render(<PrimaryKeyPanel table={{ id: 't1' }} />);

    const save = screen.getByRole('button', { name: 'Save primary key' });
    expect(save).toBeDisabled();

    await userEvent.click(checkbox('Dept'));
    await userEvent.click(checkbox('Code'));
    await userEvent.click(checkbox('Id'));

    expect(screen.getByTestId('primary-key-summary')).toHaveTextContent('Dept + Code');
    expect(screen.getByText('Key field 1')).toBeInTheDocument();
    expect(screen.getByText('Key field 2')).toBeInTheDocument();

    await userEvent.click(save);

    expect(mutateAsync).toHaveBeenCalledWith({ tableId: 't1', columnIds: ['c-dept', 'c-code'] });
    expect(await screen.findByText('Primary key updated')).toBeInTheDocument();
  });

  it('discards unsaved changes', async () => {
    mockKey(key());
    render(<PrimaryKeyPanel table={{ id: 't1' }} />);

    await userEvent.click(checkbox('Code'));
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));

    expect(checkbox('Code')).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Save primary key' })).toBeDisabled();
  });

  it('shows exactly which records block the new key', async () => {
    mockKey(key());
    const exact = "Can't set the primary key to Code + Dept. Code is empty in 1 record (#4 Acme). "
      + 'Dept is empty in 2 records (#4 Acme, #9). The combination Code = "HR", Dept = "IN" is used by 3 records (#1, #2, #5). '
      + 'Fill in or change these records, then save again.';
    const err = Object.assign(new Error(exact), {
      code: 'PKY_1004',
      details: JSON.stringify({
        message: exact,
        columns: ['code', 'dept'],
        column_titles: ['Code', 'Dept'],
        null_count: 12,
        empty_fields: [{ column: 'code', title: 'Code', count: 1 }, { column: 'dept', title: 'Dept', count: 2 }],
        null_records: [{ id: 4, title: 'Acme', missing: ['Code', 'Dept'] }, { id: 9, title: '', missing: ['Dept'] }],
        duplicate_groups: 3,
        duplicates: [{ values: { code: 'HR', dept: 'IN' }, count: 12, record_ids: [1, 2, 5] }],
      }),
    });
    mutateAsync.mockRejectedValue(err);
    render(<PrimaryKeyPanel table={{ id: 't1' }} />);

    await userEvent.click(checkbox('Code'));
    await userEvent.click(checkbox('Dept'));
    await userEvent.click(screen.getByRole('button', { name: 'Save primary key' }));

    const box = await screen.findByTestId('primary-key-violation');
    expect(screen.getByTestId('primary-key-violation-message')).toHaveTextContent(exact);
    expect(box).toHaveTextContent('Code is empty in 1 record');
    expect(box).toHaveTextContent('Dept is empty in 2 records');
    expect(box).toHaveTextContent('Record #4 (Acme) — empty: Code, Dept');
    expect(box).toHaveTextContent('Record #9 — empty: Dept');
    expect(box).toHaveTextContent('and 10 more records');
    expect(box).toHaveTextContent('Code = "HR", Dept = "IN" — used by 12 records: #1, #2, #5 and 9 more');
    expect(box).toHaveTextContent('and 2 more duplicated values');
  });

  it('shows other errors as a message', async () => {
    mockKey(key());
    mutateAsync.mockRejectedValue(new Error('could not create unique index'));
    render(<PrimaryKeyPanel table={{ id: 't1' }} />);

    await userEvent.click(checkbox('Code'));
    await userEvent.click(screen.getByRole('button', { name: 'Save primary key' }));

    await waitFor(() => expect(screen.getByText('could not create unique index')).toBeInTheDocument());
    expect(screen.queryByTestId('primary-key-violation')).not.toBeInTheDocument();
  });

  it('explains why the key is locked by link fields', () => {
    mockKey(key({ locked: true, link_columns: ['Employees', 'Manager'] }));
    render(<PrimaryKeyPanel table={{ id: 't1' }} />);

    const note = screen.getByRole('note');
    expect(note).toHaveTextContent("The primary key can't be changed while this table has link fields");
    expect(note).toHaveTextContent('Employees, Manager');
    expect(checkbox('Code')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save primary key' })).not.toBeInTheDocument();
  });

  it('shows loading and load errors', () => {
    mockKey(undefined, { isLoading: true });
    const { rerender } = render(<PrimaryKeyPanel table={{ id: 't1' }} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();

    mockKey(undefined, { error: new Error('Table not found') });
    rerender(<PrimaryKeyPanel table={{ id: 't1' }} />);
    expect(screen.getByText('Table not found')).toBeInTheDocument();
  });
});
