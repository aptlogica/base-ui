import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AccountSettings, useFooterButtons } from '../AccountSettings';

// Mock ProfileSection and SecuritySection
vi.mock('../ProfileSection', () => ({
  ProfileSection: vi.fn(() => <div data-testid="profile-section">ProfileSection</div>),
}));
vi.mock('../SecuritySection', () => ({
  SecuritySection: vi.fn(() => <div data-testid="security-section">SecuritySection</div>),
}));

describe('AccountSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Navigation', () => {
    it('renders navigation tabs with Profile and Security', () => {
      render(<AccountSettings />);
      
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Security')).toBeInTheDocument();
    });

    it('renders Profile section by default', () => {
      render(<AccountSettings />);
      
      expect(screen.getByTestId('profile-section')).toBeInTheDocument();
      expect(screen.queryByTestId('security-section')).not.toBeInTheDocument();
    });

    it('switches to Security section when Security tab is clicked', () => {
      render(<AccountSettings />);
      
      fireEvent.click(screen.getByText('Security'));
      
      expect(screen.getByTestId('security-section')).toBeInTheDocument();
      expect(screen.queryByTestId('profile-section')).not.toBeInTheDocument();
    });

    it('switches back to Profile section when Profile tab is clicked', () => {
      render(<AccountSettings />);
      
      fireEvent.click(screen.getByText('Security'));
      fireEvent.click(screen.getByText('Profile'));
      
      expect(screen.getByTestId('profile-section')).toBeInTheDocument();
      expect(screen.queryByTestId('security-section')).not.toBeInTheDocument();
    });

    it('applies active styles to the selected tab', () => {
      render(<AccountSettings />);
      
      const profileTab = screen.getByText('Profile');
      const securityTab = screen.getByText('Security');
      
      expect(profileTab.className).toContain('border-[var(--color-brand-600)]');
      expect(securityTab.className).toContain('border-transparent');
      
      fireEvent.click(securityTab);
      
      expect(securityTab.className).toContain('border-[var(--color-brand-600)]');
      expect(profileTab.className).toContain('border-transparent');
    });
  });

  describe('Footer', () => {
    it('renders footer section', () => {
      render(<AccountSettings />);
      
      const footer = document.querySelector('.border-t.border-gray-200');
      expect(footer).toBeInTheDocument();
    });
  });

  describe('useFooterButtons hook', () => {
    it('returns default no-op context when used outside provider', () => {
      const capturedValues: { context: ReturnType<typeof useFooterButtons> | null } = { context: null };
      
      function TestComponent() {
        capturedValues.context = useFooterButtons();
        return null;
      }
      
      render(<TestComponent />);
      
      const context = capturedValues.context;
      expect(context).not.toBeNull();
      expect(typeof context?.registerFooter).toBe('function');
      expect(typeof context?.clearFooter).toBe('function');
      expect(context?.currentSection).toBe('');
    });

    it('no-op registerFooter does not throw when called', () => {
      const capturedValues: { context: ReturnType<typeof useFooterButtons> | null } = { context: null };
      
      function TestComponent() {
        capturedValues.context = useFooterButtons();
        return null;
      }
      
      render(<TestComponent />);
      
      expect(() => {
        capturedValues.context?.registerFooter(<div>Test</div>);
      }).not.toThrow();
    });

    it('no-op clearFooter does not throw when called', () => {
      const capturedValues: { context: ReturnType<typeof useFooterButtons> | null } = { context: null };
      
      function TestComponent() {
        capturedValues.context = useFooterButtons();
        return null;
      }
      
      render(<TestComponent />);
      
      expect(() => {
        capturedValues.context?.clearFooter();
      }).not.toThrow();
    });
  });

  describe('Layout', () => {
    it('renders with correct layout structure', () => {
      const { container } = render(<AccountSettings />);
      
      // Check for flex column layout
      const mainContainer = container.querySelector('.flex.flex-col');
      expect(mainContainer).toBeInTheDocument();
    });

    it('renders navigation with correct aria label', () => {
      render(<AccountSettings />);
      
      const nav = screen.getByRole('navigation', { name: 'Account sections' });
      expect(nav).toBeInTheDocument();
    });
  });
});

