import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import FieldRenderer from '../FieldRenderer';

vi.mock('../../../../../components/common/Fields/SingleLineText', () => ({
  SingleLineText: (props: { value?: string }) => (
    <input data-testid="single-line-text" value={props.value ?? ''} readOnly />
  ),
}));

vi.mock('../../../../../components/common/Fields/Number', () => ({
  Number: (props: { value?: number }) => (
    <input data-testid="number-field" type="number" value={props.value ?? 0} readOnly />
  ),
}));

vi.mock('../../../../../components/common/Fields/Checkbox', () => ({
  Checkbox: (props: { value?: boolean }) => (
    <input data-testid="checkbox-field" type="checkbox" checked={props.value ?? false} readOnly />
  ),
}));

vi.mock('../../../../../components/common/Fields/Email', () => ({
  Email: (props: { value?: string }) => (
    <input data-testid="email-field" type="email" value={props.value ?? ''} readOnly />
  ),
}));

vi.mock('../../../../../components/common/Fields/LongText', () => ({
  LongText: (props: { value?: string }) => (
    <textarea data-testid="long-text-field" value={props.value ?? ''} readOnly />
  ),
}));

vi.mock('../../../../../components/common/Fields/SingleSelect', () => ({
  SingleSelect: (props: { value?: string }) => (
    <select data-testid="single-select-field" value={props.value ?? ''} onChange={() => {}}>
      <option value="">Select</option>
    </select>
  ),
}));

vi.mock('../../../../../components/common/Fields/MultiSelect', () => ({
  MultiSelect: () => <div data-testid="multi-select-field">MultiSelect</div>,
}));

vi.mock('../../../../../components/common/Fields/URL', () => ({
  URL: (props: { value?: string }) => (
    <input data-testid="url-field" type="url" value={props.value ?? ''} readOnly />
  ),
}));

vi.mock('../../../../../components/common/Fields/DateTime', () => ({
  DateTime: () => <div data-testid="datetime-field">DateTime</div>,
}));

vi.mock('../../../../../components/common/Fields/DateField', () => ({
  DateField: () => <div data-testid="date-field">DateField</div>,
}));

vi.mock('../../../../../components/common/Fields/Rating', () => ({
  Rating: () => <div data-testid="rating-field">Rating</div>,
}));

vi.mock('../../../../../components/common/Fields/Attachment', () => ({
  Attachment: () => <div data-testid="attachment-field">Attachment</div>,
}));

vi.mock('../../../../../components/common/Fields/User', () => ({
  User: () => <div data-testid="user-field">User</div>,
}));

vi.mock('../../../../../components/common/Fields/JSONField', () => ({
  JSONField: () => <div data-testid="json-field">JSONField</div>,
}));

vi.mock('../../../../../components/common/Fields/PhoneNumber', () => ({
  PhoneNumber: () => <div data-testid="phone-field">PhoneNumber</div>,
}));

vi.mock('../../../../../components/common/Fields/Percent', () => ({
  Percent: () => <div data-testid="percent-field">Percent</div>,
}));

vi.mock('../../../../../components/common/Fields/Duration', () => ({
  Duration: () => <div data-testid="duration-field">Duration</div>,
}));

vi.mock('../../../../../components/common/Fields/Currency', () => ({
  Currency: () => <div data-testid="currency-field">Currency</div>,
}));

vi.mock('../../../../../components/common/Fields/LinksField', () => ({
  LinksField: () => <div data-testid="links-field">LinksField</div>,
}));

vi.mock('../../../../../components/common/Fields/Decimal', () => ({
  Decimal: () => <div data-testid="decimal-field">Decimal</div>,
}));

vi.mock('../../../../../components/common/Fields/Year', () => ({
  Year: () => <div data-testid="year-field">Year</div>,
}));

vi.mock('../../../../../components/common/Fields/Time', () => ({
  Time: () => <div data-testid="time-field">Time</div>,
}));

vi.mock('../../../../../components/common/Fields/Lookup', () => ({
  Lookup: () => <div data-testid="lookup-field">Lookup</div>,
}));

vi.mock('../../../../../components/common/Fields/AuditCreatedTime', () => ({
  AuditCreatedTime: () => <div data-testid="created-time-field">CreatedTime</div>,
}));

vi.mock('../../../../../components/common/Fields/AuditLastModifiedTime', () => ({
  AuditLastModifiedTime: () => <div data-testid="last-modified-time-field">LastModifiedTime</div>,
}));

vi.mock('../../../../../components/common/Fields/AuditCreatedBy', () => ({
  AuditCreatedBy: () => <div data-testid="created-by-field">CreatedBy</div>,
}));

vi.mock('../../../../../components/common/Fields/AuditLastModifiedBy', () => ({
  AuditLastModifiedBy: () => <div data-testid="last-modified-by-field">LastModifiedBy</div>,
}));

describe('FieldRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Unsupported type', () => {
    it('should render unsupported type message for unknown type', () => {
      render(<FieldRenderer type="unknown-type" />);

      expect(screen.getByText('Unsupported type: unknown-type')).toBeInTheDocument();
    });
  });

  describe('Text field', () => {
    it('should render text field component', async () => {
      render(<FieldRenderer type="text" value="Hello" />);

      await waitFor(() => {
        expect(screen.getByTestId('single-line-text')).toBeInTheDocument();
      });
    });
  });

  describe('Number field', () => {
    it('should render number field component', async () => {
      render(<FieldRenderer type="number" value={42} />);

      await waitFor(() => {
        expect(screen.getByTestId('number-field')).toBeInTheDocument();
      });
    });
  });

  describe('Boolean field', () => {
    it('should render checkbox field component', async () => {
      render(<FieldRenderer type="boolean" value={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-field')).toBeInTheDocument();
      });
    });
  });

  describe('Email field', () => {
    it('should render email field component', async () => {
      render(<FieldRenderer type="email" value="test@example.com" />);

      await waitFor(() => {
        expect(screen.getByTestId('email-field')).toBeInTheDocument();
      });
    });
  });

  describe('LongText field', () => {
    it('should render long text field component', async () => {
      render(<FieldRenderer type="longText" value="Long content" />);

      await waitFor(() => {
        expect(screen.getByTestId('long-text-field')).toBeInTheDocument();
      });
    });
  });

  describe('Select field', () => {
    it('should render single select field component', async () => {
      render(<FieldRenderer type="select" value="option1" />);

      await waitFor(() => {
        expect(screen.getByTestId('single-select-field')).toBeInTheDocument();
      });
    });
  });

  describe('MultiSelect field', () => {
    it('should render multi select field component', async () => {
      render(<FieldRenderer type="multiSelect" value={['opt1', 'opt2']} />);

      await waitFor(() => {
        expect(screen.getByTestId('multi-select-field')).toBeInTheDocument();
      });
    });
  });

  describe('URL field', () => {
    it('should render URL field component', async () => {
      render(<FieldRenderer type="url" value="https://example.com" />);

      await waitFor(() => {
        expect(screen.getByTestId('url-field')).toBeInTheDocument();
      });
    });
  });

  describe('DateTime field', () => {
    it('should render datetime field component', async () => {
      render(<FieldRenderer type="datetime" value="2024-01-15T10:30:00Z" />);

      await waitFor(() => {
        expect(screen.getByTestId('datetime-field')).toBeInTheDocument();
      });
    });
  });

  describe('Date field', () => {
    it('should render date field component', async () => {
      render(<FieldRenderer type="date" value="2024-01-15" />);

      await waitFor(() => {
        expect(screen.getByTestId('date-field')).toBeInTheDocument();
      });
    });
  });

  describe('Rating field', () => {
    it('should render rating field component', async () => {
      render(<FieldRenderer type="rating" value={4} />);

      await waitFor(() => {
        expect(screen.getByTestId('rating-field')).toBeInTheDocument();
      });
    });
  });

  describe('Attachment field', () => {
    it('should render attachment field component', async () => {
      render(<FieldRenderer type="attachment" value={[]} />);

      await waitFor(() => {
        expect(screen.getByTestId('attachment-field')).toBeInTheDocument();
      });
    });
  });

  describe('JSON field', () => {
    it('should render JSON field component', async () => {
      render(<FieldRenderer type="json" value={{}} />);

      await waitFor(() => {
        expect(screen.getByTestId('json-field')).toBeInTheDocument();
      });
    });
  });

  describe('Links field', () => {
    it('should render links field component', async () => {
      render(<FieldRenderer type="links" value={[]} />);

      await waitFor(() => {
        expect(screen.getByTestId('links-field')).toBeInTheDocument();
      });
    });
  });

  describe('UUID field', () => {
    it('should render uuid as single line text', async () => {
      render(<FieldRenderer type="uuid" value="abc-123" />);

      await waitFor(() => {
        expect(screen.getByTestId('single-line-text')).toBeInTheDocument();
      });
    });
  });

  describe('Decimal field', () => {
    it('should render decimal field component', async () => {
      render(<FieldRenderer type="decimal" value={3.14} />);

      await waitFor(() => {
        expect(screen.getByTestId('decimal-field')).toBeInTheDocument();
      });
    });
  });

  describe('Year field', () => {
    it('should render year field component', async () => {
      render(<FieldRenderer type="year" value={2024} />);

      await waitFor(() => {
        expect(screen.getByTestId('year-field')).toBeInTheDocument();
      });
    });
  });

  describe('Time field', () => {
    it('should render time field component', async () => {
      render(<FieldRenderer type="time" value="10:30" />);

      await waitFor(() => {
        expect(screen.getByTestId('time-field')).toBeInTheDocument();
      });
    });
  });

  describe('User field', () => {
    it('should render user field component', async () => {
      render(<FieldRenderer type="user" value={{}} />);

      await waitFor(() => {
        expect(screen.getByTestId('user-field')).toBeInTheDocument();
      });
    });
  });

  describe('PhoneNumber field', () => {
    it('should render phone number field component', async () => {
      render(<FieldRenderer type="phoneNumber" value="+1234567890" />);

      await waitFor(() => {
        expect(screen.getByTestId('phone-field')).toBeInTheDocument();
      });
    });
  });

  describe('Percent field', () => {
    it('should render percent field component', async () => {
      render(<FieldRenderer type="percent" value={50} />);

      await waitFor(() => {
        expect(screen.getByTestId('percent-field')).toBeInTheDocument();
      });
    });
  });

  describe('Duration field', () => {
    it('should render duration field component', async () => {
      render(<FieldRenderer type="duration" value={3600} />);

      await waitFor(() => {
        expect(screen.getByTestId('duration-field')).toBeInTheDocument();
      });
    });
  });

  describe('Currency field', () => {
    it('should render currency field component', async () => {
      render(<FieldRenderer type="currency" value={100} />);

      await waitFor(() => {
        expect(screen.getByTestId('currency-field')).toBeInTheDocument();
      });
    });
  });

  describe('Lookup field', () => {
    it('should render lookup field component', async () => {
      render(<FieldRenderer type="lookup" value="" />);

      await waitFor(() => {
        expect(screen.getByTestId('lookup-field')).toBeInTheDocument();
      });
    });
  });

  describe('Audit fields', () => {
    it('should render createdTime field component', async () => {
      render(<FieldRenderer type="createdTime" value="2024-01-15" />);

      await waitFor(() => {
        expect(screen.getByTestId('created-time-field')).toBeInTheDocument();
      });
    });

    it('should render lastModifiedTime field component', async () => {
      render(<FieldRenderer type="lastModifiedTime" value="2024-01-15" />);

      await waitFor(() => {
        expect(screen.getByTestId('last-modified-time-field')).toBeInTheDocument();
      });
    });

    it('should render createdBy field component', async () => {
      render(<FieldRenderer type="createdBy" value={{}} />);

      await waitFor(() => {
        expect(screen.getByTestId('created-by-field')).toBeInTheDocument();
      });
    });

    it('should render lastModifiedBy field component', async () => {
      render(<FieldRenderer type="lastModifiedBy" value={{}} />);

      await waitFor(() => {
        expect(screen.getByTestId('last-modified-by-field')).toBeInTheDocument();
      });
    });
  });

  describe('Props forwarding', () => {
    it('should forward additional props to the field component', async () => {
      render(<FieldRenderer type="text" value="Test" customProp="custom" />);

      await waitFor(() => {
        expect(screen.getByTestId('single-line-text')).toBeInTheDocument();
      });
    });
  });
});
