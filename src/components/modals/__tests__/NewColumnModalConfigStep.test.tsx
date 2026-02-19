import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderNewColumnConfigStep } from '../NewColumnModalConfigStep';

const renderBasicConfigStepMock = vi.fn();
const renderDateTimeConfigStepMock = vi.fn();
const renderContactConfigStepMock = vi.fn();
const renderRelationsConfigStepMock = vi.fn();

vi.mock('../NewColumnModalConfigStep.basic', () => ({
  renderBasicConfigStep: (props: any) => renderBasicConfigStepMock(props),
}));

vi.mock('../NewColumnModalConfigStep.dateTime', () => ({
  renderDateTimeConfigStep: (props: any) => renderDateTimeConfigStepMock(props),
}));

vi.mock('../NewColumnModalConfigStep.contact', () => ({
  renderContactConfigStep: (props: any) => renderContactConfigStepMock(props),
}));

vi.mock('../NewColumnModalConfigStep.relations', () => ({
  renderRelationsConfigStep: (props: any) => renderRelationsConfigStepMock(props),
}));

vi.mock('../../../src/plugins/GridViewPlugin/components/shared/DropDown/DropDown', () => ({
  default: ({ onSelect, onChange }: any) => (
    <button type="button" data-testid="dropdown" onClick={() => { onSelect?.('1'); onChange?.('1'); }}>
      Dropdown
    </button>
  ),
}));

vi.mock('../../common/dropdown/AdvancedDropdown', () => ({
  default: ({ options = [], value, onChange, disabled, placeholder }: any) => (
    <select
      data-testid={placeholder || 'advanced-dropdown'}
      disabled={disabled}
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
    >
      <option value="">none</option>
      {options.map((option: any) => (
        <option key={option.value || option.label} value={option.value || option.label}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock('../../common/Fields', () => ({
  DateTime: ({ value, onChange }: any) => (
    <input data-testid="date-time" value={value || ''} onChange={(e) => onChange(e.target.value)} />
  ),
  Duration: ({ value, onChange }: any) => (
    <input data-testid="duration" value={value || ''} onChange={(e) => onChange(e.target.value)} />
  ),
  JSONField: ({ value, onChange }: any) => (
    <input
      data-testid="json-field"
      value={typeof value === 'string' ? value : JSON.stringify(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
  User: ({ value, onChange }: any) => (
    <input data-testid="user-field" value={value || ''} onChange={(e) => onChange(e.target.value)} />
  ),
  Currency: ({ value, onChange }: any) => (
    <input data-testid="currency-field" value={value || ''} onChange={(e) => onChange(e.target.value)} />
  ),
  MultiLineText: ({ value, onChange }: any) => (
    <textarea data-testid="multiline" value={value || ''} onChange={(e) => onChange(e.target.value)} />
  ),
  Formula: ({ value, onFormulaChange, helperText }: any) => (
    <div>
      <textarea data-testid="formula-field" value={value || ''} onChange={(e) => onFormulaChange(e.target.value)} />
      <span>{helperText}</span>
    </div>
  ),
}));

const makeProps = (type: string, overrides: Record<string, unknown> = {}) => {
  const fixed: Record<string, unknown> = {
    selectedType: { key: type, label: type },
    fields: [{ id: 'f1', title: 'Amount', column_name: 'amount', type: 'number' }],
    tables: [{ id: 't1', title: 'Table 1', alias: 'T1' }],
    linkFields: [{ id: 'l1', title: 'Link A' }],
    targetTableFields: [{ id: 'tf1', title: 'Lookup Field', column_name: 'lookup_field' }],
    selectOptions: [{ id: 1, option: 'Open', color: 'blue' }],
    defaultValue: '',
    description: '',
    formulaText: '1+1',
    formulaFormatting: { type: 'number', precision: 2, currency: 'USD', dateFormat: 'YYYY-MM-DD' },
    relationType: 'one-to-one',
    selectedTableId: '',
    selectedRelationId: '',
    selectedLookupColumnId: '',
    ratingDefaultHover: null,
    ratingIcon: 'star',
    ratingColor: 'yellow',
    ratingMax: 5,
    ratingDefault: 0,
    hourFormat: '12',
    timeFormat: 'hh:mm A',
    dateFormat: 'MM/DD/YYYY',
    timeZone: 'UTC',
    ...overrides,
  };

  return new Proxy(fixed, {
    get(target, prop: string) {
      if (prop in target) return target[prop];
      if (prop.startsWith('set')) return vi.fn();
      if (prop.startsWith('show')) return false;
      if (prop === 'isTargetTableLoading') return false;
      if (prop === 'isLinksFieldEditing') return false;
      if (prop === 'allowMultipleUsers') return false;
      if (prop === 'selectedUsers') return '';
      if (prop === 'currencyType') return 'USD';
      if (prop === 'currencyLocale') return 'en-US';
      if (prop === 'progressColor') return 'green';
      if (prop === 'displayAsProgress') return false;
      if (prop === 'precision') return '0.00';
      if (prop === 'showThousands') return false;
      return '';
    },
  });
};

const renderStep = (type: string, overrides: Record<string, unknown> = {}) =>
  render(<div>{renderNewColumnConfigStep(makeProps(type, overrides))}</div>);

describe('renderNewColumnConfigStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    renderBasicConfigStepMock.mockReturnValue(null);
    renderDateTimeConfigStepMock.mockReturnValue(null);
    renderContactConfigStepMock.mockReturnValue(null);
    renderRelationsConfigStepMock.mockReturnValue(null);
  });

  it('returns delegated content from basic step', () => {
    renderBasicConfigStepMock.mockReturnValue(<div data-testid="delegated-basic" />);
    render(<div>{renderNewColumnConfigStep(makeProps('text'))}</div>);
    expect(screen.getByTestId('delegated-basic')).toBeInTheDocument();
  });

  it('returns delegated content from datetime step', () => {
    renderBasicConfigStepMock.mockReturnValue(null);
    renderDateTimeConfigStepMock.mockReturnValue(<div data-testid="delegated-date" />);
    render(<div>{renderNewColumnConfigStep(makeProps('date'))}</div>);
    expect(screen.getByTestId('delegated-date')).toBeInTheDocument();
  });

  it('returns delegated content from contact step', () => {
    renderBasicConfigStepMock.mockReturnValue(null);
    renderContactConfigStepMock.mockReturnValue(<div data-testid="delegated-contact" />);
    render(<div>{renderNewColumnConfigStep(makeProps('email'))}</div>);
    expect(screen.getByTestId('delegated-contact')).toBeInTheDocument();
  });

  it('returns delegated content from relations step', () => {
    renderBasicConfigStepMock.mockReturnValue(null);
    renderRelationsConfigStepMock.mockReturnValue(<div data-testid="delegated-relations" />);
    render(<div>{renderNewColumnConfigStep(makeProps('links'))}</div>);
    expect(screen.getByTestId('delegated-relations')).toBeInTheDocument();
  });

  it('renders boolean config and supports icon/color dropdown interactions', () => {
    const setShowIconDropdown = vi.fn();
    const setShowColorDropdown = vi.fn();
    const setCheckboxDefault = vi.fn();

    renderStep('boolean', {
      showIconDropdown: false,
      showColorDropdown: false,
      setShowIconDropdown,
      setShowColorDropdown,
      setCheckboxDefault,
      checkboxIcon: 'check',
      checkboxColor: 'green',
      checkboxDefault: false,
    });

    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Colour')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(setShowIconDropdown).toHaveBeenCalled();
    fireEvent.click(buttons[1]);
    expect(setShowColorDropdown).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /^Checked$/i }));
    expect(setCheckboxDefault).toHaveBeenCalledWith(true);
  });

  it('renders datetime config path and supports timezone/default toggles', () => {
    const setShowDateTimeDefault = vi.fn();
    const setDisplayTimeZone = vi.fn();
    const setSameTimezone = vi.fn();
    const setTimeZone = vi.fn();

    renderStep('datetime', {
      showDateTimeDefault: true,
      setShowDateTimeDefault,
      displayTimeZone: false,
      setDisplayTimeZone,
      sameTimezone: true,
      setSameTimezone,
      setTimeZone,
      dateTimeDefault: '2026-02-12T10:00',
      description: 'desc',
      showDescription: true,
    });

    expect(screen.getByText('Date Format')).toBeInTheDocument();
    expect(screen.getByText('Time Format')).toBeInTheDocument();
    expect(screen.getByText('Use same timezone for all members')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Set default value'));
    expect(setShowDateTimeDefault).toHaveBeenCalled();
  });

  it('renders user config and set default toggle', () => {
    const setShowUserDefault = vi.fn();
    const setAllowMultipleUsers = vi.fn();
    renderStep('user', {
      showUserDefault: true,
      setShowUserDefault,
      setAllowMultipleUsers,
      allowMultipleUsers: false,
    });

    expect(screen.getByText('Multiple users')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Set default value'));
    expect(setShowUserDefault).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(setAllowMultipleUsers).toHaveBeenCalledWith(true);
  });

  it('renders attachment/json/createdBy/lastModifiedBy branches', () => {
    const attachment = renderStep('attachment');
    expect(screen.getAllByText('Add description').length).toBeGreaterThan(0);
    attachment.unmount();

    const json = renderStep('json', { showJsonDefault: true });
    expect(screen.getByText('Set default value')).toBeInTheDocument();
    expect(screen.getByTestId('json-field')).toBeInTheDocument();
    json.unmount();

    const createdBy = renderStep('createdBy');
    expect(screen.getAllByText('Add description').length).toBeGreaterThan(0);
    createdBy.unmount();

    renderStep('lastModifiedBy');
    expect(screen.getAllByText('Add description').length).toBeGreaterThan(0);
  });

  it('renders formula branch and forwards formula change', () => {
    const setFormulaText = vi.fn();
    const setFormulaError = vi.fn();
    renderStep('formula', {
      setFormulaText,
      setFormulaError,
      formulaText: 'SUM({Amount})',
      showDescription: true,
      description: 'desc',
    });

    expect(screen.getByTestId('formula-field')).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('formula-field'), { target: { value: '1+2' } });
    expect(setFormulaText).toHaveBeenCalledWith('1+2');
  });

  it.each(['percent', 'duration', 'currency', 'rating'])(
    'smoke renders %s branch',
    (type) => {
      const { container } = renderStep(type);
      expect(container.textContent?.trim().length).toBeGreaterThan(0);
    }
  );

  it('returns null for unsupported type when delegated steps return null', () => {
    const { container } = renderStep('unsupported');
    expect(container.textContent).toBe('');
  });

  it('multiSelect: adds option on Enter and sets duplicate error', () => {
    const setSelectOptions = vi.fn();
    const setNewOption = vi.fn();
    const setOptionError = vi.fn();
    const getOptionColor = vi.fn(() => '#123456');

    const { rerender } = render(
      <div>
        {renderNewColumnConfigStep(makeProps('multiSelect', {
          newOption: 'New Item',
          color: '',
          setSelectOptions,
          setNewOption,
          setOptionError,
          getOptionColor,
          selectOptions: [{ id: 1, option: 'Open', color: 'blue' }],
        }))}
      </div>
    );

    const input = screen.getByPlaceholderText('Add option');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(setSelectOptions).toHaveBeenCalled();
    expect(setNewOption).toHaveBeenCalledWith('');
    expect(setOptionError).toHaveBeenCalledWith('');

    rerender(
      <div>
        {renderNewColumnConfigStep(makeProps('multiSelect', {
          newOption: 'open',
          color: '',
          setSelectOptions,
          setNewOption,
          setOptionError,
          getOptionColor,
          selectOptions: [{ id: 1, option: 'Open', color: 'blue' }],
        }))}
      </div>
    );
    fireEvent.keyDown(screen.getByPlaceholderText('Add option'), { key: 'Enter' });
    expect(setOptionError).toHaveBeenCalledWith('Option already exists');
  });

  it('multiSelect: updates defaults on checkbox and remove', () => {
    const setMultiDefault = vi.fn();
    const setSelectOptions = vi.fn();

    renderStep('multiSelect', {
      selectOptions: [{ id: 1, option: 'Open', color: '#111111' }],
      multiDefault: [],
      setMultiDefault,
      setSelectOptions,
    });

    fireEvent.click(screen.getByRole('checkbox'));
    expect(setMultiDefault).toHaveBeenCalledWith(['Open']);

    fireEvent.click(screen.getByRole('button', { name: '' }));
    expect(setSelectOptions).toHaveBeenCalled();
  });

  it('select: updates single default and clears it on remove', () => {
    const setSingleDefault = vi.fn();
    const setSelectOptions = vi.fn();

    renderStep('select', {
      selectOptions: [{ id: 1, option: 'Open', color: '#111111' }],
      singleDefault: '',
      setSingleDefault,
      setSelectOptions,
    });

    fireEvent.click(screen.getByRole('radio'));
    expect(setSingleDefault).toHaveBeenCalledWith('Open');

    fireEvent.click(screen.getByRole('button', { name: '' }));
    expect(setSelectOptions).toHaveBeenCalled();
  });

  it('percent: toggles progress and validates default value', () => {
    const setDisplayAsProgress = vi.fn();
    const setProgressColor = vi.fn();
    const setPercentDefault = vi.fn();
    const isValidPercentInput = vi.fn((value: string) => value !== 'abc');

    renderStep('percent', {
      displayAsProgress: true,
      setDisplayAsProgress,
      setProgressColor,
      showPercentDefault: true,
      setShowPercentDefault: vi.fn(),
      setPercentDefault,
      isValidPercentInput,
    });

    fireEvent.click(screen.getByRole('checkbox'));
    expect(setDisplayAsProgress).toHaveBeenCalledWith(false);

    fireEvent.change(screen.getByTestId('Select progress color'), { target: { value: 'blue' } });
    expect(setProgressColor).toHaveBeenCalledWith('blue');

    fireEvent.change(screen.getByPlaceholderText('Enter default percentage'), { target: { value: '55' } });
    expect(setPercentDefault).toHaveBeenCalledWith(55);

    fireEvent.change(screen.getByPlaceholderText('Enter default percentage'), { target: { value: '120' } });
    expect(setPercentDefault).not.toHaveBeenCalledWith(120);
  });

  it('currency: updates locale/code/precision/default', () => {
    const setCurrencyLocale = vi.fn();
    const setCurrencyType = vi.fn();
    const setPrecision = vi.fn();
    const setCurrencyDefault = vi.fn();

    renderStep('currency', {
      showCurrencyDefault: true,
      setCurrencyLocale,
      setCurrencyType,
      setPrecision,
      setCurrencyDefault,
    });

    fireEvent.change(screen.getByTestId('Select Locale'), { target: { value: 'en-IN' } });
    fireEvent.change(screen.getByTestId('Select Currency'), { target: { value: 'INR' } });
    fireEvent.change(screen.getByTestId('Select precision'), { target: { value: '0.000' } });
    fireEvent.change(screen.getByTestId('currency-field'), { target: { value: '1000' } });

    expect(setCurrencyLocale).toHaveBeenCalled();
    expect(setCurrencyType).toHaveBeenCalled();
    expect(setPrecision).toHaveBeenCalled();
    expect(setCurrencyDefault).toHaveBeenCalledWith('1000');
  });

  it('duration: updates format and default value', () => {
    const setDurationFormat = vi.fn();
    const setDurationDefault = vi.fn();

    renderStep('duration', {
      showDurationDefault: true,
      setDurationFormat,
      setDurationDefault,
    });

    fireEvent.change(screen.getByTestId('advanced-dropdown'), { target: { value: 'h:mm:ss' } });
    fireEvent.change(screen.getByTestId('duration'), { target: { value: '1:10:30' } });
    expect(setDurationFormat).toHaveBeenCalled();
    expect(setDurationDefault).toHaveBeenCalledWith('1:10:30');
  });

  it('rating: updates max and clears default', () => {
    const setRatingMax = vi.fn();
    const setRatingDefault = vi.fn();

    renderStep('rating', {
      showRatingDefault: true,
      ratingDefault: 2,
      setShowRatingDefault: vi.fn(),
      setRatingMax,
      setRatingDefault,
    });

    fireEvent.click(screen.getByText('5'));
    fireEvent.click(screen.getByText('1'));
    expect(setRatingMax).toHaveBeenCalledWith('1');

    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(setRatingDefault).toHaveBeenCalledWith(0);
  });

  it('json: stringifies object value change', () => {
    const setDefaultValue = vi.fn();
    renderStep('json', {
      showJsonDefault: true,
      setDefaultValue,
      defaultValue: '{}',
    });

    fireEvent.change(screen.getByTestId('json-field'), { target: { value: '{"a":1}' } });
    expect(setDefaultValue).toHaveBeenCalledWith('"{\\"a\\":1}"');
  });
});
