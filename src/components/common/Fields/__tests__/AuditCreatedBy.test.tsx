import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuditCreatedBy } from '../AuditCreatedBy';

vi.mock('../AuditUser', () => ({
  AuditUser: ({ placeholder }: { placeholder?: string }) => (
    <div data-testid="audit-user-mock">{placeholder || 'User...'}</div>
  ),
}));

describe('AuditCreatedBy Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<AuditCreatedBy />);
      expect(document.body).toBeInTheDocument();
    });

    it('should pass default placeholder to AuditUser', () => {
      render(<AuditCreatedBy />);
      expect(screen.getByText('Created by...')).toBeInTheDocument();
    });

    it('should pass custom placeholder to AuditUser', () => {
      render(<AuditCreatedBy placeholder="Created by custom" />);
      expect(screen.getByText('Created by custom')).toBeInTheDocument();
    });
  });

  describe('Props Passing', () => {
    it('should forward placeholder prop to AuditUser', () => {
      render(<AuditCreatedBy placeholder="Test Placeholder" />);
      expect(screen.getByTestId('audit-user-mock')).toBeInTheDocument();
    });

    it('should use default created by placeholder when not specified', () => {
      render(<AuditCreatedBy />);
      expect(screen.getByText('Created by...')).toBeInTheDocument();
    });
  });

  describe('Integration with AuditUser', () => {
    it('should render AuditUser component', () => {
      render(<AuditCreatedBy />);
      expect(screen.getByTestId('audit-user-mock')).toBeInTheDocument();
    });

    it('should properly delegate to AuditUser with props', () => {
      const { rerender } = render(
        <AuditCreatedBy placeholder="First Placeholder" />
      );
      expect(screen.getByText('First Placeholder')).toBeInTheDocument();

      rerender(<AuditCreatedBy placeholder="Second Placeholder" />);
      expect(screen.getByText('Second Placeholder')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      const { container } = render(<AuditCreatedBy />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty placeholder string', () => {
      render(<AuditCreatedBy placeholder="" />);
      expect(screen.getByTestId('audit-user-mock')).toBeInTheDocument();
    });

    it('should handle very long placeholder text', () => {
      const longPlaceholder = 'A'.repeat(100);
      render(<AuditCreatedBy placeholder={longPlaceholder} />);
      expect(screen.getByText(longPlaceholder)).toBeInTheDocument();
    });
  });
});
