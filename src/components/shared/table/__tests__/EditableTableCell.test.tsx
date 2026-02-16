import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditableTableCell } from '../EditableTableCell';

const MockField = ({
  value,
  onChange,
  'data-testid': testId,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  'data-testid'?: string;
}) => (
  <div data-testid={testId ?? 'mock-field'}>
    <span>{String(value)}</span>
    <input
      type="text"
      aria-label="field-input"
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

vi.mock('../../../../utils/fieldType', () => ({
  normalizeFieldType: (t: string) => {
    const s = (t || 'text').toLowerCase();
    if (s === 'multiselect') return 'multiSelect';
    return s;
  },
}));

vi.mock('../../../../utils/dateUtils', () => ({
  utcISOToZoned: vi.fn((iso: string) => iso),
}));

vi.mock('../../../../types/constants', () => ({
  timeZoneOptions: [{ value: 'UTC', label: 'UTC' }],
}));

vi.mock('../../../../components/common/Fields', () => ({
  SingleLineText: (props: { value: unknown; onChange: (v: unknown) => void }) => (
    <MockField value={props.value} onChange={props.onChange} data-testid="single-line-text" />
  ),
  LongText: (props: { value: unknown; onChange: (v: unknown) => void }) => (
    <MockField value={props.value} onChange={props.onChange} data-testid="long-text" />
  ),
  Number: (props: { value: unknown; onChange: (v: unknown) => void }) => (
    <MockField value={props.value} onChange={props.onChange} data-testid="number" />
  ),
  Decimal: (props: { value: unknown; onChange: (v: unknown) => void }) => (
    <MockField value={props.value} onChange={props.onChange} data-testid="decimal" />
  ),
  DateField: (props: { value: unknown; onChange: (v: unknown) => void }) => (
    <MockField value={props.value} onChange={props.onChange} data-testid="date-field" />
  ),
  Checkbox: (props: { value: unknown; onChange: (v: unknown) => void }) => (
    <MockField value={props.value} onChange={props.onChange} data-testid="checkbox" />
  ),
  Email: (props: { value: unknown; onChange: (v: unknown) => void }) => (
    <MockField value={props.value} onChange={props.onChange} data-testid="email" />
  ),
  SingleSelect: (props: { value: unknown; onChange: (v: unknown) => void }) => (
    <MockField value={props.value} onChange={props.onChange} data-testid="single-select" />
  ),
  MultiSelect: (props: { value: unknown; onChange: (v: unknown) => void }) => (
    <MockField value={props.value} onChange={props.onChange} data-testid="multi-select" />
  ),
  URL: (props: { value: unknown; onChange: (v: unknown) => void }) => (
    <MockField value={props.value} onChange={props.onChange} data-testid="url" />
  ),
  Rating: (props: { value: unknown; onChange: (v: unknown) => void }) => (
    <MockField value={props.value} onChange={props.onChange} data-testid="rating" />
  ),
  PhoneNumber: (props: { value: unknown; onChange: (v: unknown) => void }) => (
    <MockField value={props.value} onChange={props.onChange} data-testid="phone-number" />
  ),
  Currency: (props: { value: unknown; onChange: (v: unknown) => void }) => (
    <MockField value={props.value} onChange={props.onChange} data-testid="currency" />
  ),
  Percent: (props: { value: unknown; onChange: (v: unknown) => void }) => (
    <MockField value={props.value} onChange={props.onChange} data-testid="percent" />
  ),
  Duration: (props: { value: unknown; onChange: (v: unknown) => void }) => (
    <MockField value={props.value} onChange={props.onChange} data-testid="duration" />
  ),
  Year: (props: { value: unknown; onChange: (v: unknown) => void }) => (
    <MockField value={props.value} onChange={props.onChange} data-testid="year" />
  ),
  Time: (props: { value: unknown; onChange: (v: unknown) => void }) => (
    <MockField value={props.value} onChange={props.onChange} data-testid="time" />
  ),
  DateTime: (props: { value: unknown; onChange: (v: unknown) => void }) => (
    <MockField value={props.value} onChange={props.onChange} data-testid="datetime" />
  ),
  User: (props: { value: unknown; onChange: (v: unknown) => void }) => (
    <MockField value={props.value} onChange={props.onChange} data-testid="user" />
  ),
  JSONField: (props: { value: unknown; onChange: (v: unknown) => void }) => (
    <MockField value={props.value} onChange={props.onChange} data-testid="json-field" />
  ),
  AuditCreatedTime: (props: { value: unknown }) => <MockField value={props.value} onChange={() => {}} data-testid="audit-created-time" />,
  AuditLastModifiedTime: (props: { value: unknown }) => <MockField value={props.value} onChange={() => {}} data-testid="audit-last-modified-time" />,
  AuditCreatedBy: (props: { value: unknown }) => <MockField value={props.value} onChange={() => {}} data-testid="audit-created-by" />,
  AuditLastModifiedBy: (props: { value: unknown }) => <MockField value={props.value} onChange={() => {}} data-testid="audit-last-modified-by" />,
  LinksField: () => <div data-testid="links-field">Links</div>,
  Formula: (props: { value: unknown }) => <MockField value={props.value} onChange={() => {}} data-testid="formula" />,
  Lookup: (props: { value: unknown }) => <MockField value={props.value} onChange={() => {}} data-testid="lookup" />,
  Attachment: () => <div data-testid="attachment">Attachment</div>,
}));

const defaultColumn = {
  id: 'col1',
  title: 'Name',
  column_name: 'name',
  uidt: 'text',
};

describe('EditableTableCell', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(globalThis.sessionStorage.getItem).mockReturnValue(null);
    vi.mocked(globalThis.localStorage.getItem).mockReturnValue(null);
  });

  describe('Rendering by field type', () => {
    it('should render SingleLineText for text column', () => {
      render(
        <EditableTableCell
          column={defaultColumn}
          value="Hello"
          onChange={mockOnChange}
          width={200}
        />
      );
      expect(screen.getByTestId('single-line-text')).toBeInTheDocument();
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('should render Number for number column', () => {
      render(
        <EditableTableCell
          column={{ ...defaultColumn, uidt: 'number' }}
          value={42}
          onChange={mockOnChange}
          width={200}
        />
      );
      expect(screen.getByTestId('number')).toBeInTheDocument();
    });

    it('should render Checkbox for boolean column', () => {
      render(
        <EditableTableCell
          column={{ ...defaultColumn, uidt: 'boolean' }}
          value={true}
          onChange={mockOnChange}
          width={200}
        />
      );
      expect(screen.getByTestId('checkbox')).toBeInTheDocument();
    });

    it('should render Email for email column', () => {
      render(
        <EditableTableCell
          column={{ ...defaultColumn, uidt: 'email' }}
          value="a@b.com"
          onChange={mockOnChange}
          width={200}
        />
      );
      expect(screen.getByTestId('email')).toBeInTheDocument();
    });

    it('should apply width style to wrapper', () => {
      const { container } = render(
        <EditableTableCell
          column={defaultColumn}
          value=""
          onChange={mockOnChange}
          width={300}
        />
      );
      const wrapper = container.querySelector('[style*="width: 300px"]');
      expect(wrapper).toBeInTheDocument();
    });

    it('should use column_name when uidt is missing for field type', () => {
      render(
        <EditableTableCell
          column={{ ...defaultColumn, uidt: '', column_name: 'number' }}
          value={0}
          onChange={mockOnChange}
          width={200}
        />
      );
      expect(screen.getByTestId('number')).toBeInTheDocument();
    });

    it('should default to SingleLineText for unknown type', () => {
      render(
        <EditableTableCell
          column={{ ...defaultColumn, uidt: 'unknown' }}
          value="x"
          onChange={mockOnChange}
          width={200}
        />
      );
      expect(screen.getByTestId('single-line-text')).toBeInTheDocument();
    });
  });

  describe('onChange', () => {
    it('should call onChange when text field input is changed', async () => {
      render(
        <EditableTableCell
          column={defaultColumn}
          value=""
          onChange={mockOnChange}
          width={200}
        />
      );
      const input = screen.getByLabelText('field-input');
      await userEvent.type(input, 'New value');
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Config and meta', () => {
    it('should use column.config when provided', () => {
      render(
        <EditableTableCell
          column={{ ...defaultColumn, config: { options: [] } }}
          value=""
          onChange={mockOnChange}
          width={200}
        />
      );
      expect(screen.getByTestId('single-line-text')).toBeInTheDocument();
    });

    it('should use column.meta when config is not provided', () => {
      render(
        <EditableTableCell
          column={{ ...defaultColumn, meta: { options: ['A'] } }}
          value=""
          onChange={mockOnChange}
          width={200}
        />
      );
      expect(screen.getByTestId('single-line-text')).toBeInTheDocument();
    });

    it('should parse column.meta when it is a JSON string', () => {
      render(
        <EditableTableCell
          column={{ ...defaultColumn, uidt: 'select', meta: '{"options":["A"]}' }}
          value=""
          onChange={mockOnChange}
          width={200}
        />
      );
      expect(screen.getByTestId('single-select')).toBeInTheDocument();
    });

    it('should handle invalid JSON in column.meta gracefully', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <EditableTableCell
          column={{ ...defaultColumn, meta: '{bad-json' }}
          value=""
          onChange={mockOnChange}
          width={200}
        />
      );
      expect(screen.getByTestId('single-line-text')).toBeInTheDocument();
      warnSpy.mockRestore();
    });
  });

  describe('Value normalization', () => {
    it('should normalize numeric values with commas for number fields', () => {
      render(
        <EditableTableCell
          column={{ ...defaultColumn, uidt: 'number' }}
          value="1,234"
          onChange={mockOnChange}
          width={200}
        />
      );
      expect(screen.getByTestId('number')).toHaveTextContent('1234');
    });

    it('should use default numeric value when number input is invalid', () => {
      render(
        <EditableTableCell
          column={{ ...defaultColumn, uidt: 'number', meta: { defaultValue: '5' } }}
          value="not-a-number"
          onChange={mockOnChange}
          width={200}
        />
      );
      expect(screen.getByTestId('number')).toHaveTextContent('5');
    });

    it('should normalize date values and fall back to dateDefault', () => {
      render(
        <EditableTableCell
          column={{ ...defaultColumn, uidt: 'date', meta: { dateDefault: '2024-01-01' } }}
          value="invalid-date"
          onChange={mockOnChange}
          width={200}
        />
      );
      expect(screen.getByTestId('date-field')).toHaveTextContent('2024-01-01');
    });

    it('should normalize time values and fall back to timeDefault', () => {
      render(
        <EditableTableCell
          column={{ ...defaultColumn, uidt: 'time', meta: { timeDefault: '12:30' } }}
          value="not-time"
          onChange={mockOnChange}
          width={200}
        />
      );
      expect(screen.getByTestId('time')).toHaveTextContent('12:30');
    });

    it('should normalize year values and fall back to yearDefault', () => {
      render(
        <EditableTableCell
          column={{ ...defaultColumn, uidt: 'year', meta: { yearDefault: 2020 } }}
          value="abc"
          onChange={mockOnChange}
          width={200}
        />
      );
      expect(screen.getByTestId('year')).toHaveTextContent('2020');
    });

    it('should format system datetime fields using selected timezone', () => {
      vi.mocked(globalThis.localStorage.getItem).mockReturnValue('UTC');
      render(
        <EditableTableCell
          column={{ ...defaultColumn, uidt: 'datetime' }}
          value="2024-01-01T00:00:00"
          onChange={mockOnChange}
          width={200}
          isSystemField
        />
      );
      expect(screen.getByText('2024-01-01T00:00:00Z')).toBeInTheDocument();
    });

    it('should parse multiSelect values from JSON string', () => {
      render(
        <EditableTableCell
          column={{ ...defaultColumn, uidt: 'multiSelect', meta: { options: ['A', 'B'] } }}
          value='["A","B"]'
          onChange={mockOnChange}
          width={200}
        />
      );
      expect(screen.getByTestId('multi-select')).toHaveTextContent('A,B');
    });
  });

  describe('isLast', () => {
    it('should render when isLast is true', () => {
      const { container } = render(
        <EditableTableCell
          column={defaultColumn}
          value=""
          onChange={mockOnChange}
          width={200}
          isLast
        />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render when isLast is false', () => {
      const { container } = render(
        <EditableTableCell
          column={defaultColumn}
          value=""
          onChange={mockOnChange}
          width={200}
          isLast={false}
        />
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
