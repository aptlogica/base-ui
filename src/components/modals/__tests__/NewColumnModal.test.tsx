import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewColumnModal } from '../NewColumnModal';

const toast = { error: vi.fn(), success: vi.fn() };

vi.mock('../../common/Toast', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useToast: () => toast,
}));

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

vi.mock('../../../types/fieldTypes', () => {
  const makeType = (key: string) => ({ key, label: key, icon: () => <span data-testid={`icon-${key}`} /> });
  return {
    FIELD_TYPES: [
      'text','number','decimal','boolean','select','multiSelect','rating','datetime','createdTime','lastModifiedTime',
      'currency','percent','duration','year','date','time','phoneNumber','email','url','user','button','json','formula','links'
    ].map(makeType),
  };
});

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

const renderWithType = (type: string, fields: any[] = []) => {
  const onSave = vi.fn();
  render(
    <NewColumnModal
      isOpen={true}
      onClose={vi.fn()}
      onSave={onSave}
      fields={fields}
      initialValues={{ id: 'c1', title: 'Field', type }}
    />
  );
  return onSave;
};

describe('NewColumnModal', () => {
  beforeEach(() => {
    toast.error.mockClear();
    toast.success.mockClear();
  });

  it('blocks save when field name is duplicate', () => {
    const onSave = vi.fn();
    render(
      <NewColumnModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
        fields={[{ id: 'c2', title: 'Status' }]}
      />
    );

    const nameInput = screen.getByPlaceholderText('Enter Field name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Status' } });

    fireEvent.click(screen.getByText('text'));
    fireEvent.click(screen.getByText('Save Field'));

    expect(screen.getByText('Field name already exists')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('blocks saving links field without target table', () => {
    const onSave = renderWithType('links');
    fireEvent.click(screen.getByText('Save Field'));
    expect(onSave).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Target table is required for relation fields');
  });

  it.each([
    'text','number','decimal','boolean','select','multiSelect','rating','datetime','createdTime','lastModifiedTime',
    'currency','percent','duration','year','date','time','phoneNumber','email','url','user','button','json','formula'
  ])('saves config for %s type', (type) => {
    const onSave = renderWithType(type);
    fireEvent.click(screen.getByText('Save Field'));
    expect(onSave).toHaveBeenCalled();
    const payload = onSave.mock.calls[0][0];
    expect(payload.type).toBe(type);
    expect(payload.meta).toBeDefined();
  });
});
