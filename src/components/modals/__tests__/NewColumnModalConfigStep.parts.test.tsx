import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderBasicConfigStep } from '../NewColumnModalConfigStep.basic';
import { renderContactConfigStep } from '../NewColumnModalConfigStep.contact';
import { renderDateTimeConfigStep } from '../NewColumnModalConfigStep.dateTime';
import { renderRelationsConfigStep } from '../NewColumnModalConfigStep.relations';

const convertDateFormatMock = vi.fn();

vi.mock('../../common/dropdown/AdvancedDropdown', () => ({
  default: ({
    options = [],
    value,
    onChange,
    disabled,
    placeholder,
  }: {
    options?: Array<{ value: string; label: string }>;
    value?: string;
    onChange?: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
  }) => (
    <select
      data-testid={placeholder || 'advanced-dropdown'}
      disabled={disabled}
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
    >
      <option value="">none</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock('../../common/Fields', () => ({
  SingleLineText: ({ value, onChange }: any) => (
    <input data-testid="single-line-text" value={value || ''} onChange={(e) => onChange(e.target.value)} />
  ),
  LongText: ({ value, onChange }: any) => (
    <textarea data-testid="long-text" value={value || ''} onChange={(e) => onChange(e.target.value)} />
  ),
  NumberField: ({ value, onChange }: any) => (
    <input data-testid="number-field" value={value || ''} onChange={(e) => onChange(e.target.value)} />
  ),
  Decimal: ({ value, onChange }: any) => (
    <input data-testid="decimal-field" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
  ),
  MultiLineText: ({ value, onChange }: any) => (
    <textarea data-testid="multi-line-text" value={value || ''} onChange={(e) => onChange(e.target.value)} />
  ),
  Email: ({ value, onChange }: any) => (
    <input data-testid="email-field" value={value || ''} onChange={(e) => onChange(e.target.value)} />
  ),
  URLField: ({ value, onChange }: any) => (
    <input data-testid="url-field" value={value || ''} onChange={(e) => onChange(e.target.value)} />
  ),
  DateField: ({ value, onChange }: any) => (
    <input data-testid="date-field" value={value || ''} onChange={(e) => onChange(e.target.value)} />
  ),
  Time: ({ value, onChange }: any) => (
    <input data-testid="time-field" value={value || ''} onChange={(e) => onChange(e.target.value)} />
  ),
  Year: ({ value, onChange }: any) => (
    <input data-testid="year-field" value={value || ''} onChange={(e) => onChange(e.target.value)} />
  ),
}));

vi.mock('../../../utils/helpers', () => ({
  convertDateFormat: (...args: unknown[]) => convertDateFormatMock(...args),
}));

const renderStep = (node: React.ReactNode) => render(<div>{node}</div>);

describe('NewColumnModalConfigStep split modules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    convertDateFormatMock.mockImplementation((value: string) => `fmt-${value}`);
  });

  it('basic: returns null for unsupported type', () => {
    const node = renderBasicConfigStep({ selectedType: { key: 'unsupported' } });
    expect(node).toBeNull();
  });

  it('basic: text type toggles default/description and clears description', () => {
    const setShowTextDefault = vi.fn();
    const setShowDescription = vi.fn();
    const setDescription = vi.fn();
    const setDefaultValue = vi.fn();

    renderStep(
      renderBasicConfigStep({
        selectedType: { key: 'text' },
        defaultValue: 'abc',
        setDefaultValue,
        showTextDefault: true,
        setShowTextDefault,
        showDescription: true,
        setShowDescription,
        description: 'desc',
        setDescription,
      })
    );

    fireEvent.click(screen.getByText('Set default value'));
    fireEvent.click(screen.getByText('Add description'));
    fireEvent.click(screen.getAllByRole('button')[2]);
    fireEvent.change(screen.getByTestId('single-line-text'), { target: { value: 'new-value' } });

    expect(setShowTextDefault).toHaveBeenCalled();
    expect(setShowDescription).toHaveBeenCalled();
    expect(setDescription).toHaveBeenCalledWith('');
    expect(setDefaultValue).toHaveBeenCalledWith('new-value');
  });

  it('basic: decimal type updates precision and default value', () => {
    const setPrecision = vi.fn();
    const setShowTextDefault = vi.fn();
    const setDefaultValue = vi.fn();

    renderStep(
      renderBasicConfigStep({
        selectedType: { key: 'decimal' },
        precision: '0.00',
        setPrecision,
        showThousands: false,
        setShowThousands: vi.fn(),
        showTextDefault: true,
        setShowTextDefault,
        defaultValue: '1.23',
        setDefaultValue,
        showDescription: false,
        setShowDescription: vi.fn(),
        description: '',
        setDescription: vi.fn(),
      })
    );

    fireEvent.change(screen.getByTestId('advanced-dropdown'), { target: { value: '0.000' } });
    fireEvent.change(screen.getByTestId('decimal-field'), { target: { value: '9.99' } });
    expect(setPrecision).toHaveBeenCalled();
    expect(setDefaultValue).toHaveBeenCalledWith('9.99');
  });

  it('basic: number type toggles thousands and updates default value', () => {
    const setShowThousands = vi.fn();
    const setShowTextDefault = vi.fn();
    const setDefaultValue = vi.fn();

    renderStep(
      renderBasicConfigStep({
        selectedType: { key: 'number' },
        showThousands: false,
        setShowThousands,
        showTextDefault: true,
        setShowTextDefault,
        defaultValue: '12',
        setDefaultValue,
        showDescription: false,
        setShowDescription: vi.fn(),
        description: '',
        setDescription: vi.fn(),
      })
    );

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.change(screen.getByTestId('number-field'), { target: { value: '1234' } });

    expect(setShowThousands).toHaveBeenCalledWith(true);
    expect(setDefaultValue).toHaveBeenCalledWith('1234');
  });

  it('basic: longText type toggles rich text and updates default', () => {
    const setRichText = vi.fn();
    const setShowTextDefault = vi.fn();
    const setDefaultValue = vi.fn();

    renderStep(
      renderBasicConfigStep({
        selectedType: { key: 'longText' },
        richText: false,
        setRichText,
        showTextDefault: true,
        setShowTextDefault,
        defaultValue: '',
        setDefaultValue,
        showDescription: false,
        setShowDescription: vi.fn(),
        description: '',
        setDescription: vi.fn(),
        handleLongtextModalOpen: vi.fn(),
        handleLongtextModalClose: vi.fn(),
      })
    );

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.change(screen.getByTestId('long-text'), { target: { value: 'long text' } });

    expect(setRichText).toHaveBeenCalledWith(true);
    expect(setDefaultValue).toHaveBeenCalledWith('long text');
  });

  it('contact: phone type enforces max length and toggles validation', () => {
    const setPhoneDefault = vi.fn();
    const setPhoneValid = vi.fn();

    renderStep(
      renderContactConfigStep({
        selectedType: { key: 'phoneNumber' },
        phoneValid: false,
        setPhoneValid,
        showPhoneDefault: true,
        setShowPhoneDefault: vi.fn(),
        phoneDefault: '',
        setPhoneDefault,
        showDescription: false,
        setShowDescription: vi.fn(),
        description: '',
        setDescription: vi.fn(),
      })
    );

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.change(screen.getByPlaceholderText('Enter default phone number'), { target: { value: '123456789012' } });
    fireEvent.change(screen.getByPlaceholderText('Enter default phone number'), { target: { value: '1234567890123' } });

    expect(setPhoneValid).toHaveBeenCalledWith(true);
    expect(setPhoneDefault).toHaveBeenCalledWith('123456789012');
    expect(setPhoneDefault).not.toHaveBeenCalledWith('1234567890123');
  });

  it('contact: email and url types update default values', () => {
    const setEmailDefault = vi.fn();
    const setUrlDefault = vi.fn();

    const email = renderStep(
      renderContactConfigStep({
        selectedType: { key: 'email' },
        emailValid: true,
        setEmailValid: vi.fn(),
        showEmailDefault: true,
        setShowEmailDefault: vi.fn(),
        emailDefault: '',
        setEmailDefault,
        showDescription: false,
        setShowDescription: vi.fn(),
        description: '',
        setDescription: vi.fn(),
      })
    );
    fireEvent.change(screen.getByTestId('email-field'), { target: { value: 'a@b.com' } });
    expect(setEmailDefault).toHaveBeenCalledWith('a@b.com');
    email.unmount();

    renderStep(
      renderContactConfigStep({
        selectedType: { key: 'url' },
        urlValid: true,
        setUrlValid: vi.fn(),
        showUrlDefault: true,
        setShowUrlDefault: vi.fn(),
        urlDefault: '',
        setUrlDefault,
        showDescription: false,
        setShowDescription: vi.fn(),
        description: '',
        setDescription: vi.fn(),
      })
    );
    fireEvent.change(screen.getByTestId('url-field'), { target: { value: 'https://x.dev' } });
    expect(setUrlDefault).toHaveBeenCalledWith('https://x.dev');
  });

  it('dateTime: date type uses convertDateFormat and sets date default', () => {
    const setDateDefault = vi.fn();
    const setDateFormat = vi.fn();

    renderStep(
      renderDateTimeConfigStep({
        selectedType: { key: 'date' },
        dateFormat: 'MM/DD/YYYY',
        setDateFormat,
        showDateDefault: true,
        setShowDateDefault: vi.fn(),
        dateDefault: '2026-01-10',
        setDateDefault,
        showDescription: false,
        setShowDescription: vi.fn(),
        description: '',
        setDescription: vi.fn(),
      })
    );

    expect(convertDateFormatMock).toHaveBeenCalled();
    fireEvent.change(screen.getByTestId('advanced-dropdown'), { target: { value: 'DD-MM-YYYY' } });
    fireEvent.change(screen.getByTestId('date-field'), { target: { value: '2026-02-12' } });

    expect(setDateFormat).toHaveBeenCalled();
    expect(setDateDefault).toHaveBeenCalledWith('2026-02-12');
  });

  it('dateTime: year and time types map values correctly', () => {
    const setYearDefault = vi.fn();
    const setTimeDefault = vi.fn();
    const setHourFormat = vi.fn();

    const year = renderStep(
      renderDateTimeConfigStep({
        selectedType: { key: 'year' },
        showYearDefault: true,
        setShowYearDefault: vi.fn(),
        yearDefault: 2025,
        setYearDefault,
        showDescription: false,
        setShowDescription: vi.fn(),
        description: '',
        setDescription: vi.fn(),
      })
    );
    fireEvent.change(screen.getByTestId('year-field'), { target: { value: '2026' } });
    expect(setYearDefault).toHaveBeenCalledWith(2026);
    year.unmount();

    renderStep(
      renderDateTimeConfigStep({
        selectedType: { key: 'time' },
        hourFormat: '12',
        setHourFormat,
        showTimeDefault: true,
        setShowTimeDefault: vi.fn(),
        timeDefault: '',
        setTimeDefault,
        showDescription: false,
        setShowDescription: vi.fn(),
        description: '',
        setDescription: vi.fn(),
      })
    );
    fireEvent.click(screen.getByText('24 Hrs'));
    fireEvent.change(screen.getByTestId('time-field'), { target: { value: '11:30 PM' } });
    expect(setHourFormat).toHaveBeenCalledWith('24');
    expect(setTimeDefault).toHaveBeenCalledWith('11:30 PM');
  });

  it('relations: links type updates relation and target table, with validation message', () => {
    const setRelationType = vi.fn();
    const setSelectedTableId = vi.fn();
    const setSelectedTable = vi.fn();

    renderStep(
      renderRelationsConfigStep({
        selectedType: { key: 'links' },
        isLinksFieldEditing: false,
        relationType: 'one-to-one',
        setRelationType,
        tables: [{ id: 't1', title: 'Orders' }],
        selectedTableId: '',
        setSelectedTableId,
        selectedTable: null,
        setSelectedTable,
        showDescription: false,
        setShowDescription: vi.fn(),
        description: '',
        setDescription: vi.fn(),
      })
    );

    fireEvent.click(screen.getByRole('button', { name: /has many/i }));
    fireEvent.change(screen.getByTestId('Select table to link'), { target: { value: 't1' } });

    expect(setRelationType).toHaveBeenCalledWith('has-many');
    expect(setSelectedTableId).toHaveBeenCalledWith('t1');
    expect(setSelectedTable).toHaveBeenCalledWith({ id: 't1', title: 'Orders' });
    expect(screen.getByText('Target table is required for relation fields')).toBeInTheDocument();
  });

  it('relations: lookup type updates relation/lookup fields', () => {
    const setSelectedRelationId = vi.fn();
    const setSelectedLookupColumnId = vi.fn();
    const setHasUserModifiedLookupColumn = vi.fn();

    renderStep(
      renderRelationsConfigStep({
        selectedType: { key: 'lookup' },
        linkFields: [{ id: 'lnk1', title: 'Customer Link' }],
        targetTableFields: [{ id: 'name', title: 'Name' }],
        selectedRelationId: 'lnk1',
        setSelectedRelationId,
        selectedLookupColumnId: '',
        setSelectedLookupColumnId,
        setHasUserModifiedLookupColumn,
        isTargetTableLoading: false,
        showDescription: false,
        setShowDescription: vi.fn(),
        description: '',
        setDescription: vi.fn(),
      })
    );

    const dropdowns = screen.getAllByTestId('-select-');
    fireEvent.change(dropdowns[0], { target: { value: 'lnk1' } });
    fireEvent.change(dropdowns[1], { target: { value: 'name' } });

    expect(setHasUserModifiedLookupColumn).toHaveBeenCalled();
    expect(setSelectedRelationId).toHaveBeenCalledWith('lnk1');
    expect(setSelectedLookupColumnId).toHaveBeenCalledWith('name');
  });

  it('relations: lookup shows loading indicator when target fields are loading', () => {
    renderStep(
      renderRelationsConfigStep({
        selectedType: { key: 'lookup' },
        linkFields: [{ id: 'lnk1', title: 'Customer Link' }],
        targetTableFields: [{ id: 'name', title: 'Name' }],
        selectedRelationId: 'lnk1',
        setSelectedRelationId: vi.fn(),
        selectedLookupColumnId: '',
        setSelectedLookupColumnId: vi.fn(),
        setHasUserModifiedLookupColumn: vi.fn(),
        isTargetTableLoading: true,
        showDescription: false,
        setShowDescription: vi.fn(),
        description: '',
        setDescription: vi.fn(),
      })
    );

    expect(screen.getByText('Loading fields...')).toBeInTheDocument();
  });
});
