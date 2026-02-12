import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
let ToastProvider: React.ComponentType<{ children: React.ReactNode }>;
let NewColumnModal: typeof import('../NewColumnModal').NewColumnModal;

vi.mock('../../../hooks/useApi', () => ({
  useBaseTables: () => ({ data: null }),
  useTable: () => ({ data: null, isLoading: false }),
  useAllViews: () => ({ data: [] }),
}));

vi.mock('../../../stores/navigationStore', () => ({
  useNavigationStore: () => ({ selectedBaseId: 'base-1' }),
}));

vi.mock('../../../utils/fieldUsageUtils', () => ({
  checkFieldUsageInViews: () => ({ isUsedInViews: false }),
  checkCriticalFieldUsageInViews: () => ({ isUsedInViews: false, usedInViews: [] }),
}));

vi.mock('../../../types/fieldTypes', () => ({
  FIELD_TYPES: [
    { key: 'text', label: 'Text', icon: () => <span data-testid="icon-text" /> },
    { key: 'number', label: 'Number', icon: () => <span data-testid="icon-number" /> },
  ],
}));

vi.mock('../../common/Fields', () => ({
  DateField: () => <div />,
  DateTime: () => <div />,
  Duration: () => <div />,
  Email: () => <div />,
  JSONField: () => <div />,
  Time: () => <div />,
  URLField: () => <div />,
  Year: () => <div />,
  User: () => <div />,
  SingleLineText: () => <div />,
  LongText: () => <div />,
  Number: () => <div />,
  Decimal: () => <div />,
  Currency: () => <div />,
  MultiLineText: () => <div />,
  Formula: () => <div />,
}));

vi.mock('../../../plugins/GridViewPlugin/components/shared/DropDown/DropDown', () => ({
  default: () => <div />,
}));

vi.mock('../../common/dropdown/AdvancedDropdown', () => ({
  default: () => <div />,
}));

vi.mock('../../common/dropdown/fieldDropdown/FieldTypeDropdown', () => ({
  FieldTypeDropdown: ({ selectedType }: { selectedType: any }) => (
    <div data-testid="field-type-dropdown">{selectedType?.label || 'Select type'}</div>
  ),
}));

vi.mock('../../../utils/helpers', () => ({
  convertDateFormat: (value: string) => value,
}));

describe.skip('NewColumnModal', () => {
  it('capitalizes field name input and moves to step 2 on type select', async () => {
    ({ NewColumnModal } = await import('../NewColumnModal'));
    ({ ToastProvider } = await import('../../common/Toast'));
    render(
      <ToastProvider>
        <NewColumnModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          fields={[]}
        />
      </ToastProvider>
    );

    const nameInput = screen.getByPlaceholderText('Enter Field name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'sample field' } });
    expect(nameInput.value).toBe('Sample field');

    const searchInput = screen.getByPlaceholderText('Search field type');
    fireEvent.change(searchInput, { target: { value: 'num' } });
    expect(screen.getByText('Number')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Number'));
    expect(screen.queryByPlaceholderText('Search field type')).not.toBeInTheDocument();
    expect(screen.getByTestId('field-type-dropdown')).toHaveTextContent('Number');
  });
});
