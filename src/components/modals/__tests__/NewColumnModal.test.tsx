import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewColumnModal } from '../NewColumnModal';
import * as fieldUsageUtils from '../../../utils/fieldUsageUtils';
import { validateFormula } from '../../../utils/formulaHelper';

const toast = { error: vi.fn(), success: vi.fn() };
const mockUseBaseTables = vi.fn(() => ({ data: null }));
const mockUseResetField = vi.fn(() => ({ mutate: vi.fn() }));
const mockUseTableConstraints = vi.fn((..._args: any[]): { data: any[] } => ({ data: [] }));
const mockUseBaseById = vi.fn((): { data: any } => ({ data: null }));

vi.mock('../../common/Toast', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useToast: () => toast,
}));

vi.mock('../../../hooks/useApi', () => ({
  useBaseTables: (...args: any[]) => mockUseBaseTables(...args),
  useBaseById: () => mockUseBaseById(),
  useTable: () => ({ data: null, isLoading: false }),
  useAllViews: () => ({ data: [] }),
  useResetField: (...args: any[]) => mockUseResetField(...args),
  useTableConstraints: (...args: any[]) => mockUseTableConstraints(...args),
  usePrimaryKey: () => ({ data: undefined }),
  useFieldEmptyCount: () => ({ data: undefined }),
}));

vi.mock('../../../stores/navigationStore', () => ({
  useNavigationStore: () => ({ selectedBaseId: 'base-1' }),
}));

vi.mock('../../../utils/fieldUsageUtils', () => ({
  checkFieldUsageInViews: vi.fn(() => ({ isUsedInViews: false })),
  checkCriticalFieldUsageInViews: vi.fn(() => ({ isUsedInViews: false, usedInViews: [] })),
}));

vi.mock('../../../types/fieldTypes', () => {
  const makeType = (key: string) => ({ key, label: key, icon: () => <span data-testid={`icon-${key}`} /> });
  return {
    FIELD_TYPES: [
      'text','number','decimal','boolean','select','multiSelect','rating','datetime','createdTime','lastModifiedTime',
      'currency','percent','duration','year','date','time','phoneNumber','email','url','user','button','json','formula','links','lookup'
    ].map(makeType),
    getRelationTypeFromField: vi.fn(() => undefined),
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
  Formula: ({ externalError }: { externalError?: string | null }) => (
    <div>
      {externalError ? <div>{externalError}</div> : null}
    </div>
  ),
}));

vi.mock('../../../plugins/GridViewPlugin/components/shared/DropDown/DropDown', () => ({
  default: () => <div />,
}));

vi.mock('../../common/dropdown/AdvancedDropdown', () => ({
  default: () => <div />,
}));

vi.mock('../../common/dropdown/fieldDropdown/FieldTypeDropdown', () => ({
  FieldTypeDropdown: ({
    selectedType,
    setSelectedType,
    fieldTypes,
  }: {
    selectedType: any;
    setSelectedType: (type: any) => void;
    fieldTypes: any[];
  }) => (
    <div>
      <div data-testid="field-type-dropdown">{selectedType?.label || 'Select type'}</div>
      {fieldTypes.map((type) => (
        <button key={type.key} type="button" onClick={() => setSelectedType(type)}>
          {type.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../../../utils/helpers', () => ({
  convertDateFormat: (value: string) => value,
}));

vi.mock('../../../utils/formulaHelper', () => ({
  validateFormula: vi.fn(() => null),
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
    mockUseBaseTables.mockReturnValue({ data: null });
    mockUseBaseById.mockReturnValue({ data: null });
    vi.mocked(validateFormula).mockReturnValue(null);
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

  it('renders nothing when modal is closed', () => {
    const { container } = render(
      <NewColumnModal
        isOpen={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(
      <NewColumnModal
        isOpen={true}
        onClose={onClose}
        onSave={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not save when field type is not selected', () => {
    const onSave = vi.fn();
    render(
      <NewColumnModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    fireEvent.click(screen.getByText('Save Field'));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('allows same field name for current field in edit mode', () => {
    const onSave = vi.fn();
    render(
      <NewColumnModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
        fields={[{ id: 'c1', title: 'Status' }]}
        initialValues={{ id: 'c1', title: 'Status', type: 'text' }}
      />
    );

    fireEvent.click(screen.getByText('Save Field'));
    expect(onSave).toHaveBeenCalled();
  });

  describe('unique key and default value', () => {
    const KEY = { id: 'k1', title: 'Unique code', constraint_name: 'uq', status: 'ok', columns: [{ id: 'c1', title: 'Code' }, { id: 'c2', title: 'Other' }] };
    const renderEdit = (meta: any, otherMeta: any) => {
      const onSave = vi.fn();
      render(
        <NewColumnModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={onSave}
          currentTableId="t1"
          fields={[{ id: 'c1', title: 'Code', meta }, { id: 'c2', title: 'Other', meta: otherMeta }]}
          initialValues={{ id: 'c1', title: 'Code', type: 'text', meta }}
        />
      );
      fireEvent.click(screen.getByText('Save Field'));
      return onSave;
    };

    beforeEach(() => {
      mockUseTableConstraints.mockReturnValue({ data: [KEY] });
    });

    it('blocks saving a default on a column of a unique key whose columns all have defaults', () => {
      const onSave = renderEdit({ defaultValue: 'abc' }, { defaultValue: 'x' });
      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toHaveTextContent('This column has a UNIQUE constraint');
    });

    it('blocks saving a default on a column of a check constraint', () => {
      mockUseTableConstraints.mockImplementation((_tableId: string, type: string) => ({ data: type === 'check' ? [KEY] : [] }));
      const onSave = renderEdit({ defaultValue: 'abc' }, { defaultValue: 'x' });
      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toHaveTextContent('This column has a CHECK constraint. Its default value may fail the check rule.');
    });

    it('shows the server message and frees the button when the save is rejected', async () => {
      const onSave = vi.fn().mockRejectedValue({ code: 'TCN_1014', message: 'Rejected by the server' });
      render(
        <NewColumnModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={onSave}
          currentTableId="t1"
          fields={[{ id: 'c1', title: 'Code', meta: {} }]}
          initialValues={{ id: 'c1', title: 'Code', type: 'text', meta: { defaultValue: 'abc' } }}
        />
      );
      mockUseTableConstraints.mockReturnValue({ data: [] });
      fireEvent.click(screen.getByText('Save Field'));
      expect(await screen.findByRole('alert')).toHaveTextContent('Rejected by the server');
      expect(screen.getByText('Save Field')).toBeInTheDocument();
    });

    it('saves when another column of the key has no default', () => {
      const onSave = renderEdit({ defaultValue: 'abc' }, {});
      expect(onSave).toHaveBeenCalled();
    });

    it('saves when the column has no default', () => {
      const onSave = renderEdit({}, { defaultValue: 'x' });
      expect(onSave).toHaveBeenCalled();
    });

    it('saves when the column is in no unique key', () => {
      mockUseTableConstraints.mockReturnValue({ data: [] });
      const onSave = renderEdit({ defaultValue: 'abc' }, { defaultValue: 'x' });
      expect(onSave).toHaveBeenCalled();
    });
  });

  it('blocks saving links field without target table', () => {
    const onSave = renderWithType('links');
    fireEvent.click(screen.getByText('Save Field'));
    expect(onSave).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Target table is required for relation fields');
  });

  it('shows selected target table for links field when base tables come in StandardResponse shape', () => {
    mockUseBaseTables.mockReturnValue({
      data: {
        data: [{ model: { id: 'table-2', title: 'Customers' } }]
      }
    });

    render(
      <NewColumnModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        currentTableId="table-1"
        initialValues={{
          id: 'field-1',
          title: 'Customer',
          type: 'links',
          config: {
            relation: {
              with: 'table-2',
              type: 'one-to-one'
            }
          }
        }}
      />
    );

    expect(screen.getByText(/Linking to:/)).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();
  });

  it('blocks saving lookup field without selecting link field', () => {
    const onSave = renderWithType('lookup');
    fireEvent.click(screen.getByText('Save Field'));
    expect(onSave).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Please select a Link Field');
  });

  it('auto-generates a field name when empty', () => {
    const onSave = vi.fn();
    render(
      <NewColumnModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
        fields={[{ id: 'c2', title: 'Text' }]}
      />
    );

    fireEvent.click(screen.getByText('text'));
    fireEvent.click(screen.getByText('Save Field'));

    expect(onSave).toHaveBeenCalled();
    const payload = onSave.mock.calls[0][0];
    expect(payload.name).toBe('Text 1');
    expect(payload.title).toBe('Text 1');
  });

  it('blocks type change when field is used in critical views', () => {
    vi.mocked(fieldUsageUtils.checkCriticalFieldUsageInViews).mockReturnValue({
      isUsedInViews: true,
      usedInViews: [{ viewName: 'Calendar', usageType: 'Date Field' }],
    } as any);

    render(
      <NewColumnModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        initialValues={{ id: 'c1', title: 'Field', type: 'text' }}
      />
    );

    fireEvent.click(screen.getByText('number'));
    expect(toast.error).toHaveBeenCalled();
    expect(screen.getByTestId('field-type-dropdown')).toHaveTextContent('text');
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

  it.each([
    ['currency', { currencyLocale: 'en-IN', currencyType: 'INR' }],
    ['date', { dateFormat: 'DD/MM/YYYY' }],
    ['datetime', { dateFormat: 'MM-DD-YYYY', timeFormat: 'HH:mm' }],
  ])('defaults %s formats to those saved on the base', (type, expected) => {
    mockUseBaseById.mockReturnValue({
      data: {
        data: {
          meta: {
            dateFormat: 'DD/MM/YYYY',
            dateTimeFormat: { dateFormat: 'MM-DD-YYYY', timeFormat: 'HH:mm' },
            currencyLocale: 'en-IN',
            currencyType: 'INR',
          },
        },
      },
    });
    const onSave = vi.fn();
    render(<NewColumnModal isOpen={true} onClose={vi.fn()} onSave={onSave} />);

    fireEvent.click(screen.getByText(type));
    fireEvent.click(screen.getByText('Save Field'));

    expect(onSave).toHaveBeenCalled();
    expect(onSave.mock.calls[0][0].meta).toMatchObject(expected);
  });

  it('blocks save for formula field when formula is invalid at save time', () => {
    vi.mocked(validateFormula).mockReturnValue('Division by zero is not allowed.');
    const onSave = vi.fn();

    render(
      <NewColumnModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
        fields={[{ id: 'c2', title: 'Amount', type: 'number', uidt: 'number', column_name: 'amount', key: 'amount' }]}
        initialValues={{
          id: 'c1',
          title: 'Total',
          type: 'formula',
          config: { formula: '{Amount} / 0' }
        }}
      />
    );

    fireEvent.click(screen.getByText('Save Field'));

    expect(validateFormula).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Division by zero is not allowed.')).toBeInTheDocument();
  });
});
