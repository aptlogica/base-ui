import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FieldDisplay } from '../FieldDisplay';

const MockField = ({ value, 'data-testid': testId }: { value: unknown; 'data-testid'?: string }) => (
  <div data-testid={testId ?? 'mock-field'}>{String(value)}</div>
);

vi.mock('../../../utils/fieldType', () => ({
  normalizeFieldType: (t: string) => {
    const s = (t || 'text').toLowerCase();
    if (s === 'multiselect') return 'multiSelect';
    return s;
  },
}));

vi.mock('../../common/Fields', () => ({
  SingleLineText: (props: { value: unknown }) => <MockField value={props.value} data-testid="single-line-text" />,
  LongText: (props: { value: unknown }) => <MockField value={props.value} data-testid="long-text" />,
  Number: (props: { value: unknown }) => <MockField value={props.value} data-testid="number" />,
  Decimal: (props: { value: unknown }) => <MockField value={props.value} data-testid="decimal" />,
  DateField: (props: { value: unknown }) => <MockField value={props.value} data-testid="date-field" />,
  Checkbox: (props: { value: unknown }) => <MockField value={props.value} data-testid="checkbox" />,
  Email: (props: { value: unknown }) => <MockField value={props.value} data-testid="email" />,
  SingleSelect: (props: { value: unknown }) => <MockField value={props.value} data-testid="single-select" />,
  MultiSelect: (props: { value: unknown }) => <MockField value={JSON.stringify(props.value)} data-testid="multi-select" />,
  URL: (props: { value: unknown }) => <MockField value={props.value} data-testid="url" />,
  Rating: (props: { value: unknown }) => <MockField value={props.value} data-testid="rating" />,
  PhoneNumber: (props: { value: unknown }) => <MockField value={props.value} data-testid="phone-number" />,
  Currency: (props: { value: unknown }) => <MockField value={props.value} data-testid="currency" />,
  Percent: (props: { value: unknown }) => <MockField value={props.value} data-testid="percent" />,
  Duration: (props: { value: unknown }) => <MockField value={props.value} data-testid="duration" />,
  Year: (props: { value: unknown }) => <MockField value={props.value} data-testid="year" />,
  Time: (props: { value: unknown }) => <MockField value={props.value} data-testid="time" />,
  DateTime: (props: { value: unknown }) => <MockField value={props.value} data-testid="datetime" />,
  User: (props: { value: unknown }) => <MockField value={props.value} data-testid="user" />,
  JSONField: (props: { value: unknown }) => <MockField value={props.value} data-testid="json-field" />,
  AuditCreatedTime: (props: { value: unknown }) => <MockField value={props.value} data-testid="audit-created-time" />,
  AuditLastModifiedTime: (props: { value: unknown }) => <MockField value={props.value} data-testid="audit-last-modified-time" />,
  AuditCreatedBy: (props: { value: unknown }) => <MockField value={props.value} data-testid="audit-created-by" />,
  AuditLastModifiedBy: (props: { value: unknown }) => <MockField value={props.value} data-testid="audit-last-modified-by" />,
  LinksField: () => <div data-testid="links-field">Links</div>,
  Formula: (props: { value: unknown }) => <MockField value={props.value} data-testid="formula" />,
  Lookup: (props: { value: unknown }) => <MockField value={props.value} data-testid="lookup" />,
  Attachment: () => <div data-testid="attachment">Attachment</div>,
}));

describe('FieldDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering by field type', () => {
    it('should render SingleLineText for text field type', () => {
      render(
        <FieldDisplay
          field={{ uidt: 'text', title: 'Name' }}
          value="Hello"
        />
      );
      expect(screen.getByTestId('single-line-text')).toBeInTheDocument();
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('should render Number for number field type', () => {
      render(
        <FieldDisplay
          field={{ uidt: 'number', title: 'Count' }}
          value={42}
        />
      );
      expect(screen.getByTestId('number')).toBeInTheDocument();
    });

    it('should render Checkbox for boolean field type', () => {
      render(
        <FieldDisplay
          field={{ uidt: 'boolean', title: 'Active' }}
          value={true}
        />
      );
      expect(screen.getByTestId('checkbox')).toBeInTheDocument();
    });

    it('should render Email for email field type', () => {
      render(
        <FieldDisplay
          field={{ uidt: 'email', title: 'Email' }}
          value="a@b.com"
        />
      );
      expect(screen.getByTestId('email')).toBeInTheDocument();
    });

    it('should use type when uidt is not provided', () => {
      render(
        <FieldDisplay
          field={{ type: 'number', title: 'Count' }}
          value={10}
        />
      );
      expect(screen.getByTestId('number')).toBeInTheDocument();
    });

    it('should default to text when uidt and type are missing', () => {
      render(
        <FieldDisplay
          field={{ title: 'Unknown' }}
          value="x"
        />
      );
      expect(screen.getByTestId('single-line-text')).toBeInTheDocument();
    });
  });

  describe('Empty value display', () => {
    it('should display dash for empty text value when no default', () => {
      render(
        <FieldDisplay
          field={{ uidt: 'text', title: 'Name' }}
          value=""
        />
      );
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should display dash for null text value', () => {
      render(
        <FieldDisplay
          field={{ uidt: 'text', title: 'Name' }}
          value={null}
        />
      );
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should not display dash for empty multiSelect', () => {
      render(
        <FieldDisplay
          field={{ uidt: 'multiSelect', title: 'Tags', meta: { options: [] } }}
          value={[]}
        />
      );
      expect(screen.getByTestId('multi-select')).toBeInTheDocument();
      expect(screen.queryByText('-')).not.toBeInTheDocument();
    });
  });

  describe('Config and meta', () => {
    it('should apply className to wrapper', () => {
      const { container } = render(
        <FieldDisplay
          field={{ uidt: 'text', title: 'Name' }}
          value="x"
          className="my-class"
        />
      );
      const wrapper = container.querySelector('.my-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('should use meta as config when meta is object', () => {
      render(
        <FieldDisplay
          field={{ uidt: 'text', title: 'Name', meta: { defaultValue: 'Default' } }}
          value=""
        />
      );
      expect(screen.getByTestId('single-line-text')).toBeInTheDocument();
    });
  });

  describe('System datetime field', () => {
    it('should render div with toLocaleString for system datetime when value present', () => {
      const dateStr = '2024-01-15T12:00:00.000Z';
      render(
        <FieldDisplay
          field={{ uidt: 'datetime', title: 'Created', system: true }}
          value={dateStr}
        />
      );
      const formatted = new Date(dateStr).toLocaleString();
      expect(screen.getByText(formatted)).toBeInTheDocument();
    });

    it('should render display value for system datetime when value empty', () => {
      render(
        <FieldDisplay
          field={{ uidt: 'datetime', title: 'Created', system: true }}
          value={null}
        />
      );
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('MultiSelect value parsing', () => {
    it('should pass array value to MultiSelect when value is array', () => {
      render(
        <FieldDisplay
          field={{ uidt: 'multiSelect', title: 'Tags', meta: { options: ['A', 'B'] } }}
          value={['A', 'B']}
        />
      );
      expect(screen.getByTestId('multi-select')).toBeInTheDocument();
      expect(screen.getByText('["A","B"]')).toBeInTheDocument();
    });

    it('should parse JSON string value for multiSelect', () => {
      render(
        <FieldDisplay
          field={{ uidt: 'multiSelect', title: 'Tags', meta: { options: ['X', 'Y'] } }}
          value='["X"]'
        />
      );
      expect(screen.getByTestId('multi-select')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should render default wrapper when className is empty', () => {
      const { container } = render(
        <FieldDisplay
          field={{ uidt: 'text', title: 'Name' }}
          value=""
        />
      );
      expect(container.firstChild).toBeInTheDocument();
      expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('should handle field with invalid meta string without throwing', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <FieldDisplay
          field={{ uidt: 'text', title: 'Name', meta: 'not-json' }}
          value="ok"
        />
      );
      expect(screen.getByText('ok')).toBeInTheDocument();
      await Promise.resolve();
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });
});
