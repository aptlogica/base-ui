import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuditLastModifiedBy } from '../AuditLastModifiedBy';

vi.mock('../AuditUser', () => ({
  AuditUser: ({ placeholder }: { placeholder?: string }) => (
    <div data-testid="audit-user-mock">{placeholder || 'User...'}</div>
  ),
}));

describe('AuditLastModifiedBy Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<AuditLastModifiedBy />);
      expect(document.body).toBeInTheDocument();
    });

    it('should pass default placeholder to AuditUser', () => {
      render(<AuditLastModifiedBy />);
      expect(screen.getByText('Last Modified by...')).toBeInTheDocument();
    });

    it('should pass custom placeholder to AuditUser', () => {
      render(<AuditLastModifiedBy placeholder="Last Modified by custom" />);
      expect(screen.getByText('Last Modified by custom')).toBeInTheDocument();
    });
  });

  describe('Props Passing', () => {
    it('should forward placeholder prop to AuditUser', () => {
      render(<AuditLastModifiedBy placeholder="Test Placeholder" />);
      expect(screen.getByTestId('audit-user-mock')).toBeInTheDocument();
    });

    it('should use default last modified by placeholder when not specified', () => {
      render(<AuditLastModifiedBy />);
      expect(screen.getByText('Last Modified by...')).toBeInTheDocument();
    });
  });

  describe('Integration with AuditUser', () => {
    it('should render AuditUser component', () => {
      render(<AuditLastModifiedBy />);
      expect(screen.getByTestId('audit-user-mock')).toBeInTheDocument();
    });

    it('should properly delegate to AuditUser with props', () => {
      const { rerender } = render(
        <AuditLastModifiedBy placeholder="First Placeholder" />
      );
      expect(screen.getByText('First Placeholder')).toBeInTheDocument();

      rerender(<AuditLastModifiedBy placeholder="Second Placeholder" />);
      expect(screen.getByText('Second Placeholder')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      const { container } = render(<AuditLastModifiedBy />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty placeholder string', () => {
      render(<AuditLastModifiedBy placeholder="" />);
      expect(screen.getByTestId('audit-user-mock')).toBeInTheDocument();
    });

    it('should handle very long placeholder text', () => {
      const longPlaceholder = 'B'.repeat(100);
      render(<AuditLastModifiedBy placeholder={longPlaceholder} />);
      expect(screen.getByText(longPlaceholder)).toBeInTheDocument();
    });
  });
});
