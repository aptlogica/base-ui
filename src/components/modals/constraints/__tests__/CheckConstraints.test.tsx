import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CheckConstraintFormModal from '../CheckConstraintFormModal';
import CheckConstraintsPanel from '../CheckConstraintsPanel';
import { CHECK_CATEGORIES, categoryByKey } from '../checkCategories';
import { displayName, installedSql, valueSql, STATEMENT_ERROR, TABLE_ERROR, checkConstraintName, checkableColumns, fillExample, insertColumn, parseCheckStatement, previewSql, quoteIdent } from '../checkSql';
import { useTable, useTableConstraints } from '../../../../hooks/useApi';
import { useBaseAccess } from '../../../../hooks/useBaseAccess';
import type { TableConstraint } from '../../../../service/clientService';
import type { Column } from '../../../../types/api.types';

const toastSuccess = vi.fn();
const createMutateAsync = vi.fn();
const updateMutateAsync = vi.fn();
const deleteMutateAsync = vi.fn();

vi.mock('../../../../hooks/useApi', () => ({
  useTable: vi.fn(),
  useTableConstraints: vi.fn(),
  useCreateTableConstraint: () => ({ mutateAsync: createMutateAsync, isPending: false }),
  useUpdateTableConstraint: () => ({ mutateAsync: updateMutateAsync, isPending: false }),
  useDeleteTableConstraint: () => ({ mutateAsync: deleteMutateAsync, isPending: false }),
}));

vi.mock('../../../../hooks/useBaseAccess', () => ({ useBaseAccess: vi.fn() }));
vi.mock('../../../common/Toast', () => ({ useToast: () => ({ success: toastSuccess }) }));

const col = (id: string, title: string, extra: Partial<Column> = {}): Column => ({
  id, model_id: 't1', base_id: 'b1', column_name: title.toLowerCase().replace(/\s+/g, '_'), title, uidt: 'text', dt: 'TEXT',
  description: '', meta: {}, virtual: false, system: false, deleted: false, order_index: 0, created_at: '', updated_at: '', ...extra,
});

const COLUMNS: Column[] = [
  col('c-id', 'Id', { column_name: 'id', uidt: 'number', system: true }),
  col('c-title', 'Title', { column_name: 'title', system: true }),
  col('c-age', 'Age', { column_name: 'age_179', uidt: 'number' }),
  col('c-status', 'Status', { column_name: 'status_179', uidt: 'singleSelect' }),
  col('c-start', 'Start', { column_name: 'start_179', uidt: 'date' }),
  col('c-end', 'End', { column_name: 'end_179', uidt: 'date' }),
  col('c-rating', 'Score', { uidt: 'rating' }),
  col('c-flag', 'Active', { uidt: 'checkbox' }),
  col('c-link', 'Dept', { uidt: 'links' }),
];

const table = { id: 't1', base_id: 'b1', title: 'Employee', alias: 'employee_179' };
const TABLE_NAME = '"tenant_1"."employee_179"';

const CHECK: TableConstraint = {
  id: 'k1', title: 'Age 18–100', constraint_name: 'ck_employee_179_1a2b3c4d',
  columns: [{ id: 'c-age', title: 'Age' }], status: 'ok',
  category: 'number_date', condition: 'age_179 BETWEEN 18 AND 100', table_name: TABLE_NAME,
  definition: 'CHECK (((age_179 >= 18) AND (age_179 <= 100)))',
};

describe('check SQL helpers', () => {
  it('quotes column names only when needed', () => {
    expect(quoteIdent('age_179')).toBe('age_179');
    expect(quoteIdent('Order Total')).toBe('"Order Total"');
    expect(quoteIdent('order')).toBe('"order"');
  });

  it('fills examples with the chosen fields and leaves a placeholder for missing ones', () => {
    expect(fillExample('{c} <= {c2}', ['start_179', 'end_179'])).toBe('start_179 <= end_179');
    expect(fillExample('{c} < {c2}', ['a', undefined])).toBe('a < <field>');
  });

  it('inserts a column with spaces, into a placeholder first, else at the cursor or the end', () => {
    expect(insertColumn('', 'age_179').condition).toBe('age_179');
    expect(insertColumn('title', 'age_179').condition).toBe('title age_179');
    expect(insertColumn('<field> IN (1)', 'age_179')).toEqual({ condition: 'age_179 IN (1)', cursor: 7 });
    expect(insertColumn('a > 0 AND  > 1', 'b', { start: 10, end: 10 }).condition).toBe('a > 0 AND b > 1');
    expect(insertColumn('x >0', 'Order', { start: 3, end: 3 }).condition).toBe('x > "Order" 0');
  });

  it('turns typed values into SQL by kind and field type', () => {
    expect(valueSql('number', ' ')).toBeNull();
    expect(valueSql('number', '12')).toBe('12');
    expect(valueSql('number', 'abc')).toBeNull();
    expect(valueSql('text', "it's")).toBe("'it''s'");
    expect(valueSql('list', 'a, b')).toBe("'a', 'b'");
    expect(valueSql('value', '5')).toBeNull();
    expect(valueSql('value', '5', 'number')).toBe('5');
    expect(valueSql('value', 'x', 'number')).toBeNull();
    expect(valueSql('value', '2026-01-31', 'date')).toBe("DATE '2026-01-31'");
    expect(valueSql('value', '31/01/2026', 'date')).toBeNull();
    expect(valueSql('value', 'abc', 'text')).toBe("'abc'");
  });

  it('shows a title plain when it is one word, quoted otherwise', () => {
    expect(displayName('Age')).toBe('Age');
    expect(displayName('Order Total')).toBe('"Order Total"');
  });

  it('previews the constraint as Postgres has it', () => {
    expect(installedSql(TABLE_NAME, 'ck "x"', 'CHECK ((age > 0))')).toBe(`ALTER TABLE ${TABLE_NAME}\n  ADD CONSTRAINT "ck ""x"""\n  CHECK ((age > 0));`);
  });

  it('makes the constraint name like the backend', () => {
    expect(checkConstraintName('employee_179', '3f9a2c1b-5d7e-4a10-9c2b-1e8f0a6b4d21')).toBe('ck_employee_179_3f9a2c1b');
  });

  it('previews ADD, and DROP + ADD when replacing', () => {
    expect(previewSql(TABLE_NAME, 'ck_x', 'age > 0')).toBe(`ALTER TABLE ${TABLE_NAME}\n  ADD CONSTRAINT "ck_x"\n  CHECK (age > 0);`);
    expect(previewSql(TABLE_NAME, 'ck_x', 'age > 0', true)).toMatch(/^ALTER TABLE .* DROP CONSTRAINT IF EXISTS "ck_x";\n/);
  });

  it('offers ordinary fields and Title, not system or computed ones', () => {
    expect(checkableColumns(COLUMNS).map(c => c.title)).toEqual(['Title', 'Age', 'Status', 'Start', 'End', 'Score', 'Active']);
  });

  it('has 3 categories in order, custom last, and shows unknown ones as custom', () => {
    expect(CHECK_CATEGORIES.map(c => c.key)).toEqual(['field', 'compare', 'custom']);
    expect(categoryByKey('range').key).toBe('custom');
    // Constraints saved as Text or Number / Date show as Single Field
    expect(categoryByKey('text').key).toBe('field');
    expect(categoryByKey('number_date').key).toBe('field');
  });

  it('reads the condition out of a custom statement for this table', () => {
    const sql = previewSql(TABLE_NAME, 'ck_x', "status_179 IN ('a;b') AND (age_179 > 0)");
    expect(parseCheckStatement(sql, TABLE_NAME)).toEqual({ condition: "status_179 IN ('a;b') AND (age_179 > 0)" });
    expect(parseCheckStatement('alter table employee_179 add constraint my_rule check (age_179 > 0)', TABLE_NAME))
      .toEqual({ condition: 'age_179 > 0' });
    expect(parseCheckStatement('DROP TABLE x', TABLE_NAME)).toEqual({ error: STATEMENT_ERROR });
    expect(parseCheckStatement(`${sql} -- note`, TABLE_NAME)).toEqual({ error: STATEMENT_ERROR });
    expect(parseCheckStatement('ALTER TABLE "other" ADD CONSTRAINT c CHECK (x > 0)', TABLE_NAME)).toEqual({ error: TABLE_ERROR });
    expect(parseCheckStatement('ALTER TABLE "other_schema"."employee_179" ADD CONSTRAINT c CHECK (x > 0)', TABLE_NAME)).toEqual({ error: TABLE_ERROR });
    expect(parseCheckStatement(previewSql(TABLE_NAME, 'ck_x', ''), TABLE_NAME)).toEqual({ error: 'Condition is required.' });
  });
});

describe('CheckConstraintFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createMutateAsync.mockResolvedValue({});
    updateMutateAsync.mockResolvedValue({});
  });

  const renderForm = (item?: TableConstraint, existingTitles: string[] = []) => {
    const onClose = vi.fn();
    render(<CheckConstraintFormModal table={table} columns={COLUMNS} tableName={TABLE_NAME} item={item} existingTitles={existingTitles} onClose={onClose} />);
    return onClose;
  };
  const preview = () => screen.getByLabelText('SQL preview').textContent;
  const categoryTrigger = () => within(screen.getByTestId('check-category')).getAllByRole('button')[0];
  const toCategory = async (label: string) => {
    await userEvent.click(categoryTrigger());
    await userEvent.click(screen.getAllByText(label).find(e => e.closest('li')) as HTMLElement);
  };
  // Opens an AdvancedDropdown by its trigger text and picks an option
  const pick = async (trigger: string, option: string, index = 0) => {
    await userEvent.click(screen.getAllByRole('button', { name: trigger })[index]);
    await userEvent.click(screen.getAllByText(option).find(e => e.closest('li')) as HTMLElement);
  };

  it('puts Name first, starts with Single Field and has no Test button', async () => {
    renderForm();
    const labels = screen.getAllByText(/^(Name|Category|Condition)/).map(e => e.textContent?.trim());
    expect(labels[0]).toMatch(/^Name/);
    // A dropdown like the field picker, Single Field selected, the three categories in order
    expect(categoryTrigger()).toHaveTextContent(/^Single Field/);
    await userEvent.click(categoryTrigger());
    const options = screen.getAllByRole('listitem').map(li => li.querySelector('.font-medium')?.textContent);
    expect(options).toEqual(['Single Field', 'Compare Two Fields', 'Custom SQL Expression']);
    expect(screen.queryByRole('button', { name: 'Test' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('shows only the SQL box for Custom SQL Expression, prefilled with this table and a new name', async () => {
    renderForm();
    await toCategory('Custom SQL Expression');
    expect((screen.getByLabelText(/^SQL/) as HTMLTextAreaElement).value).toMatch(/^ALTER TABLE "tenant_1"\."employee_179"\n {2}ADD CONSTRAINT "ck_employee_179_[0-9a-f]{8}"\n {2}CHECK \(\);$/);
    expect(screen.queryByLabelText(/Condition/)).not.toBeInTheDocument();
    expect(screen.queryByText('Field')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('SQL preview')).not.toBeInTheDocument();
    expect(screen.queryByText('Examples')).not.toBeInTheDocument();
  });

  it('applies the condition written in the custom statement', async () => {
    const onClose = renderForm();
    await toCategory('Custom SQL Expression');
    await userEvent.type(screen.getByLabelText(/Name/), 'Age positive');
    const box = screen.getByLabelText(/^SQL/);
    await userEvent.clear(box);
    await userEvent.type(box, 'ALTER TABLE "tenant_1"."employee_179" ADD CONSTRAINT x CHECK (age_179 > 0);');
    // The name is never filled in for custom SQL
    expect(screen.getByLabelText(/Name/)).toHaveValue('Age positive');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(createMutateAsync.mock.calls[0][0]).toMatchObject({ type: 'check', title: 'Age positive', category: 'custom', condition: 'age_179 > 0' });
    expect(toastSuccess).toHaveBeenCalledWith('Check constraint applied');
    expect(onClose).toHaveBeenCalled();
  });

  it('inserts a field into the custom statement: inside CHECK ( ) first, then at the cursor', async () => {
    renderForm();
    await toCategory('Custom SQL Expression');
    const box = screen.getByLabelText(/^SQL/) as HTMLTextAreaElement;
    expect(box.value).toContain('CHECK ();');

    await pick('Insert a field', 'Age');
    expect(box.value).toContain('CHECK (Age);');

    // Typing after it and inserting again goes to the cursor
    const at = box.value.indexOf(');');
    await userEvent.type(box, ' > 0 AND ', { initialSelectionStart: at, initialSelectionEnd: at });
    await pick('Insert a field', 'Start');
    expect(box.value).toContain('CHECK (Age > 0 AND Start);');
  });

  it('refuses a custom statement for another table without calling the server', async () => {
    renderForm();
    await toCategory('Custom SQL Expression');
    await userEvent.type(screen.getByLabelText(/Name/), 'x');
    const box = screen.getByLabelText(/^SQL/);
    await userEvent.clear(box);
    await userEvent.type(box, 'ALTER TABLE other ADD CONSTRAINT x CHECK (a > 0)');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(screen.getByRole('alert')).toHaveTextContent(TABLE_ERROR);
    expect(createMutateAsync).not.toHaveBeenCalled();
  });

  it('builds the condition from the field, the condition and the typed values, names it and previews the SQL', async () => {
    renderForm();
    await pick('Select a field', 'Age');
    await pick('Select a condition', 'Between two values');

    // There is no free condition box, only the values; nothing is applied until they are typed
    expect(screen.queryByLabelText(/Condition/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
    expect(preview()).toContain('CHECK (Age BETWEEN <value> AND <value>);');
    await userEvent.type(screen.getByLabelText('From'), '0');
    await userEvent.type(screen.getByLabelText('To'), '100');

    expect(screen.getByLabelText(/Name/)).toHaveValue('Age · Between two values');
    expect(preview()).toMatch(/^ALTER TABLE "tenant_1"\."employee_179"\n {2}ADD CONSTRAINT "ck_employee_179_[0-9a-f]{8}"\n {2}CHECK \(Age BETWEEN 0 AND 100\);$/);
    expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled();
  });

  it('shows field titles in the preview but the column names in what is copied', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderForm();
    await pick('Select a field', 'Age');
    await pick('Select a condition', 'Greater than zero');
    expect(preview()).toContain('CHECK (Age > 0);');
    expect(preview()).not.toContain('age_179');
    await userEvent.click(screen.getByRole('button', { name: /Copy/ }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('CHECK (age_179 > 0);'));
  });

  it('lists the fields in table order, not alphabetically', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Select a field' }));
    const options = screen.getAllByRole('listitem').map(li => li.querySelector('.font-medium')?.textContent);
    expect(options).toEqual(['Title', 'Age', 'Status', 'Start', 'End']);
  });

  it('offers the conditions of the field type and saves a text or number / date category', async () => {
    renderForm();
    const offered = async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Select a condition' }));
      const labels = screen.getAllByRole('listitem').map(li => li.textContent);
      await userEvent.keyboard('{Escape}');
      return labels;
    };
    await pick('Select a field', 'Status');
    expect(await offered()).toEqual(['Only these', 'Not these', 'Minimum length', 'Maximum length', 'Length between']);
    await pick('Status', 'Age');
    expect(await offered()).toEqual(['Between two values', 'Between, empty allowed', 'Minimum', 'Maximum', 'Greater than zero']);
  });

  it('drops the chosen condition when another field type does not offer it', async () => {
    renderForm();
    await pick('Select a field', 'Status');
    await pick('Select a condition', 'Only these');
    await pick('Status', 'Age');
    expect(screen.getByRole('button', { name: 'Select a condition' })).toBeInTheDocument();
  });

  it('quotes text values and fills the field when it is chosen afterwards', async () => {
    renderForm();
    await pick('Select a condition', 'Only these');
    await userEvent.type(screen.getByLabelText('Value'), 'active, in active');
    expect(preview()).toContain("CHECK (<field> IN ('active', 'in active'));");
    await pick('Select a field', 'Status');
    expect(preview()).toContain("CHECK (Status IN ('active', 'in active'));");
  });

  it('follows the field and value, and a different condition starts with empty values', async () => {
    renderForm();
    await pick('Select a field', 'Age');
    await pick('Select a condition', 'Maximum');
    await userEvent.type(screen.getByLabelText('Value'), '100');
    expect(preview()).toContain('CHECK (Age <= 100);');
    expect(screen.getByLabelText(/Name/)).toHaveValue('Age · Maximum');

    // Another field: the condition and the name follow
    await pick('Age', 'Start');
    expect(preview()).toContain("CHECK (Start <= <value>);");
    expect(screen.getByLabelText(/Name/)).toHaveValue('Start · Maximum');

    // A value that does not suit a number field is not used
    await pick('Start', 'Age');
    await userEvent.clear(screen.getByLabelText('Value'));
    await userEvent.type(screen.getByLabelText('Value'), '10');
    expect(preview()).toContain('CHECK (Age <= 10);');

    await pick('Maximum', 'Minimum');
    expect(screen.getByLabelText('Value')).toHaveValue(null);
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('lists only fields the category supports', async () => {
    renderForm();
    await userEvent.click(screen.getAllByRole('button', { name: 'Select a field' })[0]);
    expect(screen.getAllByText('Age').length).toBeGreaterThan(0);
    expect(screen.queryByText('Score')).toBeNull();
    expect(screen.queryByText('Active')).toBeNull();
  });

  it('compares two fields', async () => {
    renderForm();
    await toCategory('Compare Two Fields');
    await pick('Select a field', 'Start', 0);
    await pick('Select a field', 'End', 0);
    await pick('Select a condition', 'First ≤ second');
    expect(preview()).toContain('CHECK (Start <= End);');

    // Another condition replaces it without a browser alert
    const confirm = vi.spyOn(window, 'confirm');
    await pick('First ≤ second', 'Different');
    expect(preview()).toContain('CHECK (Start <> End);');
    expect(confirm).not.toHaveBeenCalled();
  });

  it('carries the condition over when switching to custom', async () => {
    renderForm();
    await pick('Select a field', 'Age');
    await pick('Select a condition', 'Greater than zero');
    await toCategory('Custom SQL Expression');
    expect((screen.getByLabelText(/^SQL/) as HTMLTextAreaElement).value).toContain('CHECK (Age > 0);');
  });

  it('highlights the name and refuses it when empty or already used, like the unique key form', async () => {
    renderForm(undefined, ['Age · Maximum']);
    await pick('Select a field', 'Age');
    await pick('Select a condition', 'Greater than zero');
    const name = screen.getByLabelText(/Name/);

    // Empty name
    await userEvent.clear(name);
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Name is required');
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name.className).toContain('border-red-500!');

    // Typing clears the highlight; a name that is taken (any letter case) is refused
    await userEvent.type(name, 'age · maximum');
    expect(name).toHaveAttribute('aria-invalid', 'false');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.getByRole('alert')).toHaveTextContent('A check constraint named "age · maximum" already exists');
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(createMutateAsync).not.toHaveBeenCalled();

    // Another name goes through
    await userEvent.type(name, ' 2');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(createMutateAsync).toHaveBeenCalled();
  });

  it('lets an edited constraint keep its own name', async () => {
    renderForm(CHECK, []);
    await userEvent.click(screen.getByRole('button', { name: 'Apply changes' }));
    expect(updateMutateAsync).toHaveBeenCalled();
  });

  it('shows why the server refused and stays open', async () => {
    createMutateAsync.mockRejectedValue(new Error('3 records break this condition. Fix them or change the condition.'));
    const onClose = renderForm();
    await pick('Select a field', 'Age');
    await pick('Select a condition', 'Greater than zero');
    await userEvent.type(screen.getByLabelText(/Name/), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(createMutateAsync.mock.calls[0][0]).toMatchObject({ category: 'number_date', condition: 'age_179 > 0' });
    expect(screen.getByRole('alert')).toHaveTextContent('3 records break this condition');
    expect(onClose).not.toHaveBeenCalled();
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it('opens a saved condition as its field and values, and previews DROP + ADD when a value changes', async () => {
    renderForm(CHECK);
    expect(categoryTrigger()).toHaveTextContent(/^Single Field/);
    expect(screen.getByLabelText('From')).toHaveValue(18);
    expect(screen.getByLabelText('To')).toHaveValue(100);

    await userEvent.clear(screen.getByLabelText('From'));
    await userEvent.type(screen.getByLabelText('From'), '21');
    expect(preview()).toContain('DROP CONSTRAINT IF EXISTS "ck_employee_179_1a2b3c4d";');
    await userEvent.click(screen.getByRole('button', { name: 'Apply changes' }));

    expect(updateMutateAsync).toHaveBeenCalledWith({
      id: 'k1', tableId: 't1', title: 'Age 18–100', category: 'number_date', condition: 'age_179 BETWEEN 21 AND 100',
    });
  });

  it('opens a saved condition that is none of the common ones as custom SQL', async () => {
    renderForm({ ...CHECK, condition: 'age_179 > 5 AND age_179 < 9' });
    expect(categoryTrigger()).toHaveTextContent(/^Custom SQL Expression/);
    expect((screen.getByLabelText(/^SQL/) as HTMLTextAreaElement).value).toContain('CHECK (Age > 5 AND Age < 9);');
  });
});

describe('CheckConstraintsPanel', () => {
  const access = (canEdit: boolean) => vi.mocked(useBaseAccess).mockReturnValue({
    canUpdateTable: () => canEdit, isBaseReadOnly: () => false,
  } as any);
  const constraints = (data: TableConstraint[]) =>
    vi.mocked(useTableConstraints).mockReturnValue({ data, isLoading: false, error: null } as any);

  beforeEach(() => {
    vi.clearAllMocks();
    access(true);
    constraints([CHECK, { ...CHECK, id: 'k2', title: 'Gone', category: 'compare', condition: 'age_179 > 0', status: 'missing', definition: undefined }]);
    vi.mocked(useTable).mockReturnValue({ data: { data: { columns: COLUMNS } } } as any);
    deleteMutateAsync.mockResolvedValue({});
  });

  it('lists the check constraints with category, condition and fields', () => {
    render(<CheckConstraintsPanel table={table} />);
    expect(useTableConstraints).toHaveBeenCalledWith('t1', 'check');
    expect(screen.getByText('Age 18–100')).toHaveAttribute('title', 'ck_employee_179_1a2b3c4d in Postgres');
    expect(screen.getAllByText('Single Field').length).toBeGreaterThan(0);
    // Field titles, not column names
    expect(screen.getByText('Age BETWEEN 18 AND 100')).toBeInTheDocument();
  });

  it('does not show SQL or a copy button in the list', () => {
    render(<CheckConstraintsPanel table={table} />);
    expect(screen.queryByRole('button', { name: /SQL of/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/as stored in PostgreSQL/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument();
  });

  it('filters by category', async () => {
    render(<CheckConstraintsPanel table={table} />);
    await userEvent.click(screen.getByRole('button', { name: 'All categories' }));
    await userEvent.click(screen.getAllByText('Compare Two Fields').find(e => e.closest('li')) as HTMLElement);
    expect(screen.queryByText('Age 18–100')).not.toBeInTheDocument();
    expect(screen.getByText('Gone')).toBeInTheDocument();
  });

  it('deletes after confirmation', async () => {
    render(<CheckConstraintsPanel table={table} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete Age 18–100' }));
    const dialog = screen.getByText(/Records will no longer be checked against it/).closest('div') as HTMLElement;
    expect(dialog).toBeTruthy();
    await userEvent.click(within(document.body).getAllByRole('button', { name: /^Delete$/ }).pop() as HTMLElement);
    expect(deleteMutateAsync).toHaveBeenCalledWith({ id: 'k1', tableId: 't1' });
  });

  it('is read-only without update access', () => {
    access(false);
    render(<CheckConstraintsPanel table={table} />);
    expect(screen.queryByRole('button', { name: 'Add check constraint' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit Age 18–100' })).not.toBeInTheDocument();
  });

  it('shows the empty state with an add button', () => {
    constraints([]);
    render(<CheckConstraintsPanel table={table} />);
    expect(screen.getByText(/No check constraints yet/)).toBeInTheDocument();
    // In the toolbar and in the empty state, like the unique keys list
    expect(screen.getAllByRole('button', { name: 'Add check constraint' })).toHaveLength(2);
  });

  it('searches by title or the condition as shown, and says when nothing matches', async () => {
    render(<CheckConstraintsPanel table={table} />);
    const search = screen.getByPlaceholderText('Search check constraints');

    await userEvent.type(search, 'gone');
    expect(screen.queryByText('Age 18–100')).not.toBeInTheDocument();
    expect(screen.getByText('Gone')).toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.type(search, 'between');
    expect(screen.getByText('Age 18–100')).toBeInTheDocument();
    expect(screen.queryByText('Gone')).not.toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.type(search, 'nothing like this');
    expect(screen.getByText('No check constraints match')).toBeInTheDocument();
  });

  it('shows the loading and the load error rows', () => {
    vi.mocked(useTableConstraints).mockReturnValue({ data: undefined, isLoading: true, error: null } as any);
    const { unmount } = render(<CheckConstraintsPanel table={table} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    unmount();

    vi.mocked(useTableConstraints).mockReturnValue({ data: undefined, isLoading: false, error: new Error('boom') } as any);
    render(<CheckConstraintsPanel table={table} />);
    expect(screen.getByText(/Couldn't load check constraints. boom/)).toBeInTheDocument();
  });

  it('marks a constraint that is missing in the database', () => {
    render(<CheckConstraintsPanel table={table} />);
    expect(screen.getByTitle(/not in the database any more/)).toBeInTheDocument();
  });

  it('shows why a delete failed', async () => {
    deleteMutateAsync.mockRejectedValue(new Error('in use'));
    render(<CheckConstraintsPanel table={table} />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete Age 18–100' }));
    await userEvent.click(within(document.body).getAllByRole('button', { name: /^Delete$/ }).pop() as HTMLElement);

    expect(await screen.findByText('in use')).toBeInTheDocument();
  });

  it('closes the delete confirmation without deleting', async () => {
    render(<CheckConstraintsPanel table={table} />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete Age 18–100' }));
    await userEvent.click(within(document.body).getByRole('button', { name: /Cancel/ }));

    expect(deleteMutateAsync).not.toHaveBeenCalled();
    expect(screen.queryByText(/Records will no longer be checked/)).not.toBeInTheDocument();
  });

  it('opens the form to add and to edit, and closes it', async () => {
    render(<CheckConstraintsPanel table={table} />);

    await userEvent.click(screen.getAllByRole('button', { name: 'Add check constraint' })[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');

    await userEvent.click(screen.getByRole('button', { name: 'Edit Age 18–100' }));
    expect(screen.getByDisplayValue('Age 18–100')).toBeInTheDocument();
  });
});
