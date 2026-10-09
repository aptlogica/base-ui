import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { CreateTableModal } from '../CreateTableModal';

const validateTableNameMock = vi.fn();
const getDefaultTableNameMock = vi.fn();

vi.mock('../../../utils/nameValidation', () => ({
  validateTableName: (...args: any[]) => validateTableNameMock(...args),
  getDefaultTableName: (...args: any[]) => getDefaultTableNameMock(...args),
}));

vi.mock('../../common/Fields/MultiLineText', () => ({
  MultiLineText: ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => (
    <label>
      {label}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  ),
}));

describe('CreateTableModal', () => {
  beforeEach(() => {
    validateTableNameMock.mockImplementation(() => ({ isValid: true }));
    getDefaultTableNameMock.mockImplementation(() => 'Table 1');
  });

  it('prefills default name and submits', async () => {
    const onCreate = vi.fn();
    render(
      <CreateTableModal
        isOpen={true}
        onClose={vi.fn()}
        onCreate={onCreate}
        existingTables={[]}
      />
    );

    await screen.findByDisplayValue('Table 1');
    fireEvent.change(screen.getByLabelText(/table name/i), { target: { value: 'New Table' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Table' }));
    expect(onCreate).toHaveBeenCalledWith({ name: 'New Table', description: '' });
  });

  it('auto-selects the pre-populated default name', async () => {
    render(
      <CreateTableModal
        isOpen={true}
        onClose={vi.fn()}
        onCreate={vi.fn()}
        existingTables={[]}
      />
    );

    const input = (await screen.findByDisplayValue('Table 1')) as HTMLInputElement;
    await waitFor(() => {
      expect(document.activeElement).toBe(input);
      expect(input.selectionStart).toBe(0);
      expect(input.selectionEnd).toBe('Table 1'.length);
    });
  });

  it('keeps typed name when parent re-renders with a new existingTables array', async () => {
    const props = { isOpen: true, onClose: vi.fn(), onCreate: vi.fn() };
    const { rerender } = render(<CreateTableModal {...props} existingTables={[]} />);

    const input = await screen.findByDisplayValue('Table 1');
    fireEvent.change(input, { target: { value: 'Customers' } });
    rerender(<CreateTableModal {...props} existingTables={[]} />);

    expect(screen.getByLabelText(/table name/i)).toHaveValue('Customers');
  });

  it('blocks submission when name is invalid', () => {
    validateTableNameMock.mockImplementation(() => ({ isValid: false, error: 'Invalid name' }));
    const onCreate = vi.fn();
    render(
      <CreateTableModal
        isOpen={true}
        onClose={vi.fn()}
        onCreate={onCreate}
        existingTables={[]}
      />
    );

    fireEvent.change(screen.getByLabelText(/table name/i), { target: { value: 'Bad' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Table' }));
    expect(validateTableNameMock).toHaveBeenCalled();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('uses provided default name when supplied', async () => {
    render(
      <CreateTableModal
        isOpen={true}
        onClose={vi.fn()}
        onCreate={vi.fn()}
        defaultName="Preset"
      />
    );

    await screen.findByDisplayValue('Preset');
  });

  it('shows required error when submitting with empty name', () => {
    const onCreate = vi.fn();
    render(
      <CreateTableModal
        isOpen={true}
        onClose={vi.fn()}
        onCreate={onCreate}
        existingTables={[]}
      />
    );

    fireEvent.change(screen.getByLabelText(/table name/i), { target: { value: '' } });
    const form = document.getElementById('create-table-form');
    if (form) {
      fireEvent.submit(form);
    }
    expect(screen.getByText('Table name is required')).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('closes on Escape key press', () => {
    const onClose = vi.fn();
    render(
      <CreateTableModal
        isOpen={true}
        onClose={onClose}
        onCreate={vi.fn()}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows error when onCreate throws', async () => {
    const onCreate = vi.fn(() => {
      throw new Error('Boom');
    });
    render(
      <CreateTableModal
        isOpen={true}
        onClose={vi.fn()}
        onCreate={onCreate}
        existingTables={[]}
      />
    );

    await screen.findByDisplayValue('Table 1');
    const nameInput = screen.getByLabelText(/table name/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Valid Name' } });
    await screen.findByDisplayValue('Valid Name');
    fireEvent.click(screen.getByRole('button', { name: 'Create Table' }));
    expect(await screen.findByText('Boom')).toBeInTheDocument();
  });
});
