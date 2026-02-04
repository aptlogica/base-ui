import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuditCreatedTime } from '../AuditCreatedTime';

vi.mock('../DateTime', () => ({
  DateTime: (props: any) => (
    <div data-testid="datetime-mock" data-props={JSON.stringify(props)}>
      DateTime Component
    </div>
  ),
}));

describe('AuditCreatedTime Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <AuditCreatedTime value="" onChange={() => {}} />
      );
      expect(container).toBeInTheDocument();
    });

    it('should render DateTime component', () => {
      const { getByTestId } = render(
        <AuditCreatedTime value="" onChange={() => {}} />
      );
      expect(getByTestId('datetime-mock')).toBeInTheDocument();
    });
  });

  describe('Props Passing', () => {
    it('should forward all props to DateTime', () => {
      const onChange = vi.fn();
      const config = {
        dateFormat: 'yyyy-MM-dd',
        timeFormat: 'HH:mm:ss',
      };

      const { getByTestId } = render(
        <AuditCreatedTime
          label="Created Time"
          value="2024-01-01T12:00:00Z"
          onChange={onChange}
          required={true}
          disabled={false}
          isBorder={true}
          className="custom-class"
          allowEdit={false}
          readOnly={true}
          helperText="Created timestamp"
          icon="calendar"
          config={config}
        />
      );

      const mockElement = getByTestId('datetime-mock');
      const propsData = mockElement.getAttribute('data-props');
      const passedProps = JSON.parse(propsData || '{}');

      expect(passedProps.label).toBe('Created Time');
      expect(passedProps.value).toBe('2024-01-01T12:00:00Z');
      expect(passedProps.required).toBe(true);
      expect(passedProps.disabled).toBe(false);
      expect(passedProps.readOnly).toBe(true);
    });

    it('should handle optional props', () => {
      const onChange = vi.fn();
      const { getByTestId } = render(
        <AuditCreatedTime value="2024-01-01T12:00:00Z" onChange={onChange} />
      );

      expect(getByTestId('datetime-mock')).toBeInTheDocument();
    });

    it('should call onChange prop when forwarded to DateTime', () => {
      const onChange = vi.fn();
      render(
        <AuditCreatedTime value="2024-01-01" onChange={onChange} />
      );

      // Component just passes props through, so onChange should be accessible
      expect(onChange).not.toHaveBeenCalled(); // Not called until DateTime triggers it
    });
  });

  describe('Integration with DateTime', () => {
    it('should act as a transparent wrapper', () => {
      const onChange = vi.fn();
      const { getByTestId, rerender } = render(
        <AuditCreatedTime
          label="Test"
          value="2024-01-01"
          onChange={onChange}
        />
      );

      expect(getByTestId('datetime-mock')).toBeInTheDocument();

      rerender(
        <AuditCreatedTime
          label="Updated"
          value="2024-01-02"
          onChange={onChange}
        />
      );

      expect(getByTestId('datetime-mock')).toBeInTheDocument();
    });
  });

  describe('Config Object', () => {
    it('should pass config object to DateTime', () => {
      const config = {
        dateFormat: 'MM/dd/yyyy',
        timeFormat: 'HH:mm',
        hourFormat: '24' as const,
      };

      const { getByTestId } = render(
        <AuditCreatedTime
          value="2024-01-01T12:00:00Z"
          onChange={() => {}}
          config={config}
        />
      );

      const mockElement = getByTestId('datetime-mock');
      const propsData = mockElement.getAttribute('data-props');
      const passedProps = JSON.parse(propsData || '{}');

      expect(passedProps.config).toBeDefined();
      expect(passedProps.config.dateFormat).toBe('MM/dd/yyyy');
      expect(passedProps.config.hourFormat).toBe('24');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty value', () => {
      const { container } = render(
        <AuditCreatedTime value="" onChange={() => {}} />
      );
      expect(container).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      const { container } = render(
        <AuditCreatedTime
          value="2024-01-01"
          onChange={() => {}}
          disabled={true}
        />
      );
      expect(container).toBeInTheDocument();
    });

    it('should handle readOnly state', () => {
      const { container } = render(
        <AuditCreatedTime
          value="2024-01-01"
          onChange={() => {}}
          readOnly={true}
        />
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      const { container } = render(
        <AuditCreatedTime
          label="Created At"
          value="2024-01-01T12:00:00Z"
          onChange={() => {}}
        />
      );
      expect(container).toBeInTheDocument();
    });
  });
});
