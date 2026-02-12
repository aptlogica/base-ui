import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
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
        baseId="b1"
        existingTables={[]}
      />
    );

    await screen.findByDisplayValue('Table 1');
    fireEvent.change(screen.getByLabelText(/table name/i), { target: { value: 'New Table' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Table' }));
    expect(onCreate).toHaveBeenCalledWith({ name: 'New Table', description: '' });
  });

  it('blocks submission when name is invalid', () => {
    validateTableNameMock.mockImplementation(() => ({ isValid: false, error: 'Invalid name' }));
    const onCreate = vi.fn();
    render(
      <CreateTableModal
        isOpen={true}
        onClose={vi.fn()}
        onCreate={onCreate}
        baseId="b1"
        existingTables={[]}
      />
    );

    fireEvent.change(screen.getByLabelText(/table name/i), { target: { value: 'Bad' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Table' }));
    expect(validateTableNameMock).toHaveBeenCalled();
    expect(onCreate).not.toHaveBeenCalled();
  });
});
