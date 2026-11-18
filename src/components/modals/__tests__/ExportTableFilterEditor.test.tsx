import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ExportTableFilterEditor } from '../ExportTableFilterEditor';
import type { ExportFieldInfo, ExportFilterCondition } from '../../../service/baseExportService';

vi.mock('../../../types/fieldTypes', () => ({
  getFieldTypeIconComponent: vi.fn(() => null),
  getRelationTypeFromField: vi.fn(() => undefined),
}));

const fields: ExportFieldInfo[] = [
  { id: 'f-status', title: 'Status', uidt: 'select', options: ['Open', 'Paid'] },
  { id: 'f-amount', title: 'Amount', uidt: 'decimal' },
  { id: 'f-name', title: 'Name', uidt: 'text' },
];

describe('ExportTableFilterEditor (looks and works like the filter of a table view)', () => {
  it('adds a first condition with the first field and its default operator', () => {
    const onChange = vi.fn();
    render(<ExportTableFilterEditor fields={fields} conditions={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText('Add filter'));
    expect(onChange).toHaveBeenCalledWith([{ column: 'f-status', operator: 'is equal', value: '' }]);
  });

  it('a next condition joins with AND by default', () => {
    const onChange = vi.fn();
    const first: ExportFilterCondition = { column: 'f-amount', operator: 'is equal', value: '1' };
    render(<ExportTableFilterEditor fields={fields} conditions={[first]} onChange={onChange} />);
    fireEvent.click(screen.getByText('Add filter'));
    expect(onChange.mock.calls[0][0][1]).toMatchObject({ logic: 'AND' });
  });

  it('shows Where for the first condition and the join of the next ones, which can be changed', () => {
    const onChange = vi.fn();
    const conds: ExportFilterCondition[] = [
      { column: 'f-name', operator: 'contains', value: 'a' },
      { column: 'f-amount', operator: 'greater than', value: '5', logic: 'OR' },
    ];
    render(<ExportTableFilterEditor fields={fields} conditions={conds} onChange={onChange} />);
    expect(screen.getByText('Where')).toBeTruthy();
    const join = screen.getByLabelText('Join with the previous condition');
    expect(join.textContent).toContain('OR');
    fireEvent.click(join);
    fireEvent.click(screen.getByText('AND'));
    expect(onChange.mock.calls[0][0][1]).toMatchObject({ logic: 'AND' });
  });

  it('offers the operators of the field type, and changing one is kept', () => {
    const onChange = vi.fn();
    render(<ExportTableFilterEditor fields={fields} conditions={[{ column: 'f-amount', operator: 'is equal', value: '3' }]} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Operator'));
    expect(screen.queryByText('contains')).toBeNull();
    fireEvent.click(screen.getByText('greater than'));
    expect(onChange).toHaveBeenCalledWith([{ column: 'f-amount', operator: 'greater than', value: '3' }]);
  });

  it('changing the field resets the operator and the value', () => {
    const onChange = vi.fn();
    render(<ExportTableFilterEditor fields={fields} conditions={[{ column: 'f-name', operator: 'contains', value: 'abc' }]} onChange={onChange} />);
    // the field dropdown shows the chosen field; opening it lists every field
    fireEvent.click(screen.getByText('Name'));
    fireEvent.click(within(screen.getByTestId('export-filter-field-options-0')).getByText('Amount'));
    expect(onChange).toHaveBeenCalledWith([{ column: 'f-amount', operator: 'is equal', value: '' }]);
  });

  it('typing a value updates the condition; a number field takes a number', () => {
    const onChange = vi.fn();
    render(<ExportTableFilterEditor fields={fields} conditions={[{ column: 'f-amount', operator: 'is equal', value: '' }]} onChange={onChange} />);
    const input = screen.getByLabelText('Value') as HTMLInputElement;
    expect(input.type).toBe('number');
    fireEvent.change(input, { target: { value: '42' } });
    expect(onChange).toHaveBeenCalledWith([{ column: 'f-amount', operator: 'is equal', value: '42' }]);
  });

  it('an operator that needs no value shows no value input', () => {
    render(<ExportTableFilterEditor fields={fields} conditions={[{ column: 'f-name', operator: 'is empty', value: '' }]} onChange={vi.fn()} />);
    expect(screen.queryByLabelText('Value')).toBeNull();
  });

  it('removes a condition', () => {
    const onChange = vi.fn();
    render(<ExportTableFilterEditor fields={fields} conditions={[{ column: 'f-name', operator: 'is empty', value: '' }]} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Remove filter'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('a click outside closes an open menu', () => {
    render(<ExportTableFilterEditor fields={fields} conditions={[{ column: 'f-amount', operator: 'is equal', value: '3' }]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Operator'));
    expect(screen.getByText('greater than')).toBeTruthy();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('greater than')).toBeNull();
  });

  it('renders the value control of a select, a multi-select and a date field', () => {
    const many: ExportFieldInfo[] = [
      { id: 'f-status', title: 'Status', uidt: 'select', options: ['Open', 'Paid'] },
      { id: 'f-tags', title: 'Tags', uidt: 'multiSelect', options: ['A', 'B'] },
      { id: 'f-due', title: 'Due', uidt: 'date' },
    ];
    const conds: ExportFilterCondition[] = [
      { column: 'f-status', operator: 'is equal', value: '' },
      { column: 'f-tags', operator: 'contains any of', value: '', logic: 'AND' },
      { column: 'f-due', operator: 'is equal', value: '', logic: 'AND' },
    ];
    const { container } = render(<ExportTableFilterEditor fields={many} conditions={conds} onChange={vi.fn()} />);
    // three rows, each with its own value control
    expect(container.querySelectorAll('.mb-3').length).toBe(3);
  });
});
