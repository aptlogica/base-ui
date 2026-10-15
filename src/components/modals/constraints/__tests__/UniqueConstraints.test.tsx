import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import ColumnPicker from '../ColumnPicker';
import UniqueKeyFormModal, { defaultKeyName } from '../UniqueKeyFormModal';
import UniqueKeysPanel from '../UniqueKeysPanel';
import { columnBlockReason } from '../constraintUtils';
import { useTable, useTableConstraints } from '../../../../hooks/useApi';
import { useBaseAccess } from '../../../../hooks/useBaseAccess';
import type { TableConstraint } from '../../../../service/clientService';
import type { Column } from '../../../../types/api.types';

const checkMutateAsync = vi.fn();
const createMutateAsync = vi.fn();
const updateMutateAsync = vi.fn();
const deleteMutateAsync = vi.fn();

vi.mock('../../../../hooks/useApi', () => ({
  useTable: vi.fn(),
  useTableConstraints: vi.fn(),
  useCheckTableConstraint: () => ({ mutateAsync: checkMutateAsync, isPending: false }),
  useCreateTableConstraint: () => ({ mutateAsync: createMutateAsync, isPending: false }),
  useUpdateTableConstraint: () => ({ mutateAsync: updateMutateAsync, isPending: false }),
  useDeleteTableConstraint: () => ({ mutateAsync: deleteMutateAsync, isPending: false }),
}));

vi.mock('../../../../hooks/useBaseAccess', () => ({ useBaseAccess: vi.fn() }));

const col = (id: string, title: string, extra: Partial<Column> = {}): Column => ({
  id, model_id: 't1', base_id: 'b1', column_name: title.toLowerCase().replace(/\s+/g, '_'), title, uidt: 'text', dt: 'TEXT',
  description: '', meta: {}, virtual: false, system: false, deleted: false, order_index: 0, created_at: '', updated_at: '', ...extra,
});

const COLUMNS: Column[] = [
  col('c-id', 'Id', { column_name: 'id', uidt: 'number', system: true, order_index: 0 }),
  col('c-title', 'Title', { column_name: 'title', system: true, order_index: 1 }),
  col('c-email', 'Email', { uidt: 'email', order_index: 2 }),
  col('c-code', 'Emp Code', { order_index: 3 }),
  col('c-photo', 'Photo', { uidt: 'attachment', order_index: 4 }),
  col('c-gone', 'Old', { deleted: true, order_index: 5 }),
];

const table = { id: 't1', base_id: 'b1', title: 'Employee' };

const KEY: TableConstraint = {
  id: 'k1', title: 'Dept code', constraint_name: 'uq_employee_1a2b3c4d',
  columns: [{ id: 'c-code', title: 'Emp Code' }, { id: 'c-email', title: 'Email' }],
  status: 'ok',
};

describe('constraintUtils', () => {
  it('explains why a column cannot be part of a key', () => {
    expect(columnBlockReason(COLUMNS[0])).toBe('Already unique');
    expect(columnBlockReason(COLUMNS[1])).toBeNull();
    expect(columnBlockReason(COLUMNS[2])).toBeNull();
    expect(columnBlockReason(COLUMNS[4])).toBe("Attachments can't be part of a key");
    expect(columnBlockReason(col('x', 'Dept', { uidt: 'links' }))).toBe("Link fields can't be part of a key");
    // The server also flags columns made with the table as virtual; they are ordinary columns
    expect(columnBlockReason(col('x', 'EMPLOYEE_ID', { uidt: 'number', virtual: true }))).toBeNull();
    expect(columnBlockReason(col('x', 'Total', { uidt: 'formula' }))).toBe("Formula fields can't be part of a key");
    expect(columnBlockReason(col('x', 'Created', { system: true }))).toBe("System fields can't be part of a key");
  });

  it('builds default names', () => {
    expect(defaultKeyName(['Email'])).toBe('Unique Email');
    expect(defaultKeyName([])).toBe('');
    expect(defaultKeyName(['A'.repeat(60)])).toHaveLength(50);
  });
});

describe('ColumnPicker', () => {
  const Picker = ({ initial = [] as string[], onChange = vi.fn() }) => {
    const [value, setValue] = useState(initial);
    return <ColumnPicker columns={COLUMNS.filter(c => !c.deleted)} value={value} onChange={v => { setValue(v); onChange(v); }} />;
  };
  const option = (name: RegExp) => screen.getByRole('menuitemcheckbox', { name });

  it('lists the columns in a dropdown, without system columns, usable ones first', async () => {
    render(<Picker />);
    expect(screen.queryByRole('list', { name: 'Columns' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Choose columns' }));

    const items = within(screen.getByRole('list', { name: 'Columns' })).getAllByRole('menuitemcheckbox');
    // Id is a system column and hidden; Title is kept; Photo can't be used
    // Only the column name; blocked columns say why they can't be picked
    expect(items.map(i => i.textContent)).toEqual(['Title', 'Email', 'Emp Code', 'PhotoNot allowed']);
    expect(option(/Email/)).toBeEnabled();
    expect(option(/Photo/)).toBeDisabled();
    expect(option(/Photo/)).toHaveAttribute('title', "Attachments can't be part of a key");
    expect(screen.getByPlaceholderText('Search columns')).toHaveFocus();
  });

  it('adds chosen columns as chips and removes them', async () => {
    const onChange = vi.fn();
    render(<Picker onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Choose columns' }));
    await userEvent.click(option(/Emp Code/));
    await userEvent.click(option(/Email/));
    expect(onChange).toHaveBeenLastCalledWith(['c-code', 'c-email']);
    expect(option(/Email/)).toHaveAttribute('aria-checked', 'true');

    // Clicking a chosen column again removes it
    await userEvent.click(option(/Emp Code/));
    expect(onChange).toHaveBeenLastCalledWith(['c-email']);

    await userEvent.click(screen.getByRole('button', { name: 'Remove Email' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('searches the columns and closes on an outside click', async () => {
    render(<div><Picker /><p>outside</p></div>);
    await userEvent.click(screen.getByRole('button', { name: 'Choose columns' }));
    await userEvent.type(screen.getByPlaceholderText('Search columns'), 'mail');
    expect(screen.getAllByRole('menuitemcheckbox')).toHaveLength(1);
    await userEvent.type(screen.getByPlaceholderText('Search columns'), 'zzz');
    expect(screen.getByText('No columns match "mailzzz"')).toBeInTheDocument();

    await userEvent.click(screen.getByText('outside'));
    expect(screen.queryByPlaceholderText('Search columns')).not.toBeInTheDocument();
  });

  it('renders the dropdown in a portal on document.body, and Escape closes only the dropdown', async () => {
    const parentKeyDown = vi.fn();
    const { container } = render(<div onKeyDown={parentKeyDown}><Picker /></div>);
    await userEvent.click(screen.getByRole('button', { name: 'Choose columns' }));
    const list = screen.getByRole('list', { name: 'Columns' });
    expect(container.contains(list)).toBe(false);
    expect(document.body.contains(list)).toBe(true);

    fireEvent.keyDown(screen.getByPlaceholderText('Search columns'), { key: 'Escape' });
    expect(screen.queryByRole('list', { name: 'Columns' })).not.toBeInTheDocument();
    expect(parentKeyDown).not.toHaveBeenCalled();
  });

  it('has no column limit of its own', async () => {
    const many = Array.from({ length: 12 }, (_, i) => col(`m${i}`, `Col ${i}`));
    render(<ColumnPicker columns={many} value={many.slice(0, 11).map(c => c.id)} onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add column' }));
    expect(screen.getByRole('menuitemcheckbox', { name: /Col 11/ })).toBeEnabled();
  });
});

describe('UniqueKeyFormModal', () => {
  const onClose = vi.fn();
  const columns = COLUMNS.filter(c => !c.deleted);
  const choose = async (...names: RegExp[]) => {
    await userEvent.click(screen.getByRole('button', { name: /Choose columns|Add column/ }));
    for (const name of names) await userEvent.click(screen.getByRole('menuitemcheckbox', { name }));
  };

  beforeEach(() => {
    vi.clearAllMocks();
    checkMutateAsync.mockResolvedValue({ data: { valid: true, duplicate_groups: 0, affected_records: 0, examples: [] } });
    createMutateAsync.mockResolvedValue({});
    updateMutateAsync.mockResolvedValue({});
  });

  it('fills in the required name from the columns and saves after checking the records', async () => {
    render(<UniqueKeyFormModal table={table} columns={columns} onClose={onClose} />);
    expect(screen.getByLabelText(/Name/)).toHaveValue('');
    // Nothing filled in: Save reports the missing name and highlights the field
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByLabelText(/Name/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Name is required');
    expect(createMutateAsync).not.toHaveBeenCalled();

    await choose(/Email/, /Emp Code/);
    expect(screen.getByLabelText(/Name/)).toHaveValue('Unique Email + Emp Code');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(createMutateAsync).toHaveBeenCalledWith({
      model_id: 't1', type: 'unique', title: 'Unique Email + Emp Code', column_ids: ['c-email', 'c-code'],
    }));
    expect(checkMutateAsync).toHaveBeenCalledWith({ model_id: 't1', column_ids: ['c-email', 'c-code'] });
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps a typed name when columns change, and needs a name to save', async () => {
    render(<UniqueKeyFormModal table={table} columns={columns} onClose={onClose} />);
    await choose(/Email/);
    await userEvent.clear(screen.getByLabelText(/Name/));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByLabelText(/Name/)).toHaveAttribute('aria-invalid', 'true');
    expect(createMutateAsync).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText(/Name/), '  Email once ');
    expect(screen.getByLabelText(/Name/)).toHaveAttribute('aria-invalid', 'false');
    await choose(/Emp Code/);
    expect(screen.getByLabelText(/Name/)).toHaveValue('  Email once ');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(createMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ title: 'Email once' })));
  });

  it('asks for a column when none is chosen', async () => {
    render(<UniqueKeyFormModal table={table} columns={columns} onClose={onClose} />);
    await userEvent.type(screen.getByLabelText(/Name/), 'Email once');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Select at least one column');
    expect(createMutateAsync).not.toHaveBeenCalled();
  });

  it('shows which column has duplicate data, and does not save', async () => {
    const message = 'Duplicate data in column "Email". Remove the duplicates and try again.';
    checkMutateAsync.mockResolvedValue({ data: { valid: false, message } });
    render(<UniqueKeyFormModal table={table} columns={columns} onClose={onClose} />);
    await choose(/Email/);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(createMutateAsync).not.toHaveBeenCalled();

    // Changing the columns clears the message
    await choose(/Emp Code/);
    expect(screen.queryByText(message)).not.toBeInTheDocument();
  });

  it('renames without checking the records again and keeps the message', async () => {
    render(<UniqueKeyFormModal table={table} columns={columns} item={KEY} onClose={onClose} />);
    expect(screen.getByRole('dialog', { name: 'Edit unique key' })).toBeInTheDocument();
    expect(screen.getByText('Emp Code')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    await userEvent.clear(screen.getByLabelText(/Name/));
    await userEvent.type(screen.getByLabelText(/Name/), 'Code per dept');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(updateMutateAsync).toHaveBeenCalledWith({
      id: 'k1', tableId: 't1', title: 'Code per dept', column_ids: ['c-code', 'c-email'],
    }));
    expect(checkMutateAsync).not.toHaveBeenCalled();
  });

  it('shows the server error and stays open', async () => {
    createMutateAsync.mockRejectedValue(new Error('A unique key on these columns already exists'));
    render(<UniqueKeyFormModal table={table} columns={columns} onClose={onClose} />);
    await choose(/Email/);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('A unique key on these columns already exists')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('looks like the trigger popup: title, table name and character count', async () => {
    render(<UniqueKeyFormModal table={table} columns={columns} onClose={onClose} />);
    expect(screen.getByRole('dialog', { name: 'Add unique key' })).toBeInTheDocument();
    expect(screen.getByText('Employee')).toBeInTheDocument();
    expect(screen.getByText('0/50 characters')).toBeInTheDocument();
    await choose(/Email/);
    expect(screen.getByText('12/50 characters')).toBeInTheDocument();
  });

  it('closes with Cancel, the close button, the backdrop and Escape, without Escape reaching the settings popup', async () => {
    const parentKeyDown = vi.fn();
    render(<div onKeyDown={parentKeyDown}><UniqueKeyFormModal table={table} columns={columns} onClose={onClose} /></div>);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close modal' }));
    fireEvent.keyDown(screen.getByLabelText(/Name/), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(4);
    expect(parentKeyDown).not.toHaveBeenCalled();
  });
});

describe('UniqueKeysPanel', () => {
  const access = (canEdit: boolean) => vi.mocked(useBaseAccess).mockReturnValue({
    canUpdateTable: () => canEdit, isBaseReadOnly: () => false,
  } as any);
  const constraints = (data: TableConstraint[], extra: object = {}) =>
    vi.mocked(useTableConstraints).mockReturnValue({ data, isLoading: false, error: null, ...extra } as any);

  beforeEach(() => {
    vi.clearAllMocks();
    access(true);
    constraints([KEY]);
    vi.mocked(useTable).mockReturnValue({ data: { data: { columns: COLUMNS } } } as any);
    deleteMutateAsync.mockResolvedValue({});
  });

  it('lists one row per key with its columns, name and Postgres name on hover', () => {
    render(<UniqueKeysPanel table={table} />);
    expect(useTableConstraints).toHaveBeenCalledWith('t1', 'unique');
    expect(useTable).toHaveBeenCalledWith('t1');
    expect(screen.getByText('Dept code')).toHaveAttribute('title', 'uq_employee_1a2b3c4d in Postgres');
    // Columns of one key are joined with +
    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.getByText('Emp Code')).toBeInTheDocument();
    expect(screen.queryByText('empty counts as duplicate')).not.toBeInTheDocument();
  });

  it('opens the add popup with all non-deleted, non-system columns of the table', async () => {
    const { container } = render(<UniqueKeysPanel table={table} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add unique key' }));
    const popup = screen.getByRole('dialog', { name: 'Add unique key' });
    // A popup on top of the panel, like the trigger popup
    expect(container.contains(popup)).toBe(false);

    await userEvent.click(within(popup).getByRole('button', { name: 'Choose columns' }));
    const list = screen.getByRole('list', { name: 'Columns' });
    expect(within(list).getAllByRole('menuitemcheckbox')).toHaveLength(4);
    expect(within(list).queryByText('Old')).not.toBeInTheDocument();
    expect(within(list).queryByText('Id')).not.toBeInTheDocument();
  });

  it('opens the add popup from the empty state', async () => {
    constraints([]);
    render(<UniqueKeysPanel table={table} />);
    // The header button and the one in the empty state
    await userEvent.click(screen.getAllByRole('button', { name: 'Add unique key' })[1]);
    expect(screen.getByRole('dialog', { name: 'Add unique key' })).toBeInTheDocument();
  });

  it('opens the edit popup filled in and closes it on cancel', async () => {
    render(<UniqueKeysPanel table={table} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit Dept code' }));
    const popup = screen.getByRole('dialog', { name: 'Edit unique key' });
    expect(within(popup).getByLabelText(/Name/)).toHaveValue('Dept code');
    // The list stays as it was underneath
    expect(screen.getByRole('button', { name: 'Edit Dept code' })).toBeInTheDocument();

    await userEvent.click(within(popup).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows Edit and Delete like the triggers list', () => {
    render(<UniqueKeysPanel table={table} />);
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit Dept code' })).toHaveTextContent('Edit');
    expect(screen.getByRole('button', { name: 'Delete Dept code' })).toHaveTextContent('Delete');
  });

  it('marks constraints missing from the database', () => {
    constraints([{ ...KEY, status: 'missing' }]);
    render(<UniqueKeysPanel table={table} />);
    expect(screen.getByTitle('This key no longer exists in the database')).toBeInTheDocument();
  });

  it('searches by name, Postgres name and column', async () => {
    constraints([KEY, { ...KEY, id: 'k2', title: 'Unique phone', constraint_name: 'uq_employee_ffff', columns: [{ id: 'p', title: 'Phone' }] }]);
    render(<UniqueKeysPanel table={table} />);
    await userEvent.type(screen.getByPlaceholderText('Search unique keys'), 'phone');
    expect(screen.getByText('Unique phone')).toBeInTheDocument();
    expect(screen.queryByText('Dept code')).not.toBeInTheDocument();
  });

  it('deletes after confirmation and shows errors', async () => {
    deleteMutateAsync.mockRejectedValue(new Error('constraint is referenced by a foreign key'));
    render(<UniqueKeysPanel table={table} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete Dept code' }));
    expect(screen.getByText(/records may repeat values in Emp Code, Email again/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteMutateAsync).toHaveBeenCalledWith({ id: 'k1', tableId: 't1' }));
    expect(await screen.findByText('constraint is referenced by a foreign key')).toBeInTheDocument();
  });

  it('shows empty, loading and error states', () => {
    constraints([]);
    const { rerender } = render(<UniqueKeysPanel table={table} />);
    expect(screen.getByText(/No unique keys yet/)).toBeInTheDocument();

    constraints([], { isLoading: true });
    rerender(<UniqueKeysPanel table={table} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();

    constraints([], { error: new Error('Network down') });
    rerender(<UniqueKeysPanel table={table} />);
    expect(screen.getByText(/Couldn't load unique keys. Network down/)).toBeInTheDocument();
  });

  it('is read-only for users who cannot edit the table', () => {
    access(false);
    render(<UniqueKeysPanel table={table} />);
    expect(screen.queryByRole('button', { name: 'Add unique key' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit Dept code' })).not.toBeInTheDocument();
  });
});
