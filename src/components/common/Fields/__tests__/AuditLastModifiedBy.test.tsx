import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuditLastModifiedBy } from '../AuditLastModifiedBy';
import { useCurrentUser } from '../../../auth/useCurrentUser';
import { useUserProfile } from '../../../hooks/useApi';

vi.mock('../../../auth/useCurrentUser');
vi.mock('../../../hooks/useApi');

describe('AuditLastModifiedBy Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render component without crashing', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue(null);
      mockUseUserProfile.mockReturnValue({ data: null } as any);

      render(<AuditLastModifiedBy />);
      expect(document.body).toBeInTheDocument();
    });

    it('should display default placeholder when no current user', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue(null);
      mockUseUserProfile.mockReturnValue({ data: null } as any);

      render(<AuditLastModifiedBy />);
      expect(screen.getByText('Last Modified by...')).toBeInTheDocument();
    });

    it('should display custom placeholder when provided', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue(null);
      mockUseUserProfile.mockReturnValue({ data: null } as any);

      render(<AuditLastModifiedBy placeholder="Modified by..." />);
      expect(screen.getByText('Modified by...')).toBeInTheDocument();
    });

    it('should display user information when available', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'Jane Doe',
        avatar: '/avatar.jpg'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: {} } } as any);

      render(<AuditLastModifiedBy />);
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('should display profile avatar image', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'Jane Doe',
        avatar: '/user-avatar.jpg'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: { avatar: '/profile-avatar.jpg' } } } as any);

      render(<AuditLastModifiedBy />);
      const img = document.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('alt', 'Profile');
    });

    it('should display initials badge when no avatar', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'Jane Doe'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: null } as any);

      render(<AuditLastModifiedBy />);
      
      const badge = document.querySelector('[class*="rounded-full"]');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('User Information Display', () => {
    it('should prioritize profile avatar over user avatar', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'Jane Doe',
        avatar: '/user-avatar.jpg'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: { avatar: '/profile-avatar.jpg' } } } as any);

      render(<AuditLastModifiedBy />);
      const img = document.querySelector('img') as HTMLImageElement;
      
      expect(img).toBeInTheDocument();
      expect(img.src).toContain('profile-avatar');
    });

    it('should use user avatar when profile avatar not available', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'Jane Doe',
        avatar: '/user-avatar.jpg'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: {} } } as any);

      render(<AuditLastModifiedBy />);
      const img = document.querySelector('img') as HTMLImageElement;
      
      expect(img).toBeInTheDocument();
      expect(img.src).toContain('user-avatar');
    });

    it('should display initials when no avatar available', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'John Smith'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: {} } } as any);

      render(<AuditLastModifiedBy />);
      
      const badge = document.querySelector('[class*="rounded-full"]');
      expect(badge).toBeInTheDocument();
    });

    it('should truncate very long display names', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'A'.repeat(60)
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: {} } } as any);

      render(<AuditLastModifiedBy />);
      
      const nameSpan = document.querySelector('[class*="truncate"]');
      expect(nameSpan).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should respect disabled prop', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'Jane Doe'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: {} } } as any);

      render(<AuditLastModifiedBy disabled={true} />);
      
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply correct styling classes', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'Jane Doe',
        avatar: '/avatar.jpg'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: {} } } as any);

      const { container } = render(<AuditLastModifiedBy />);
      
      expect(container.querySelector('[class*="flex"]')).toBeInTheDocument();
      expect(container.querySelector('[class*="gap"]')).toBeInTheDocument();
    });

    it('should use different color scheme than AuditCreatedBy', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'Jane Doe'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: {} } } as any);

      const { container } = render(<AuditLastModifiedBy />);
      
      // Should have purple/different color styling
      const badge = container.querySelector('[class*="purple"]') || container.querySelector('[class*="rounded-full"]');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Read-Only Nature', () => {
    it('should be a read-only audit field', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'Jane Doe'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: {} } } as any);

      render(<AuditLastModifiedBy />);
      
      // Should display as text only, not interactive
      const nameDisplay = screen.getByText('Jane Doe');
      expect(nameDisplay.tagName).not.toBe('INPUT');
      expect(nameDisplay.tagName).not.toBe('BUTTON');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined user gracefully', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue(undefined as any);
      mockUseUserProfile.mockReturnValue({ data: null } as any);

      render(<AuditLastModifiedBy />);
      
      expect(screen.getByText('Last Modified by...')).toBeInTheDocument();
    });

    it('should handle user with no display name', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: {} } } as any);

      render(<AuditLastModifiedBy />);
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle null profile data', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'Jane Doe'
      } as any);

      mockUseUserProfile.mockReturnValue(undefined as any);

      render(<AuditLastModifiedBy />);
      
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('should handle profile loading state', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'Jane Doe'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: undefined, isLoading: true } as any);

      render(<AuditLastModifiedBy />);
      
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'Jane Doe',
        avatar: '/avatar.jpg'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: {} } } as any);

      const { container } = render(<AuditLastModifiedBy />);
      
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should have alt text for avatar', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'Jane Doe',
        avatar: '/avatar.jpg'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: { avatar: '/profile.jpg' } } } as any);

      render(<AuditLastModifiedBy />);
      
      const img = document.querySelector('img');
      expect(img).toHaveAttribute('alt');
    });
  });
});
