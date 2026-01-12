import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuditCreatedBy } from '../AuditCreatedBy';
import { useCurrentUser } from '../../../auth/useCurrentUser';
import { useUserProfile } from '../../../hooks/useApi';

vi.mock('../../../auth/useCurrentUser');
vi.mock('../../../hooks/useApi');

describe('AuditCreatedBy Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render component without crashing', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue(null);
      mockUseUserProfile.mockReturnValue({ data: null } as any);

      render(<AuditCreatedBy />);
      expect(document.body).toBeInTheDocument();
    });

    it('should display placeholder when no current user', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue(null);
      mockUseUserProfile.mockReturnValue({ data: null } as any);

      render(<AuditCreatedBy placeholder="Created by..." />);
      expect(screen.getByText('Created by...')).toBeInTheDocument();
    });

    it('should display custom placeholder when provided', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue(null);
      mockUseUserProfile.mockReturnValue({ data: null } as any);

      render(<AuditCreatedBy placeholder="Custom placeholder" />);
      expect(screen.getByText('Custom placeholder')).toBeInTheDocument();
    });

    it('should display user info when available', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'John Doe',
        avatar: '/avatar.jpg'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: {} } } as any);

      render(<AuditCreatedBy />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display avatar image when available', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'John Doe',
        avatar: '/avatar.jpg'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: { avatar: '/profile-avatar.jpg' } } } as any);

      render(<AuditCreatedBy />);
      const img = document.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('alt', 'Profile');
    });

    it('should display avatar initials when no image', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'John Doe'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: null } as any);

      render(<AuditCreatedBy />);
      
      // Should have initials badge
      const avatar = document.querySelector('[class*="rounded-full"]');
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('User Information Display', () => {
    it('should use profile avatar over user avatar', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'John Doe',
        avatar: '/user-avatar.jpg'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: { avatar: '/profile-avatar.jpg' } } } as any);

      render(<AuditCreatedBy />);
      const img = document.querySelector('img') as HTMLImageElement;
      
      expect(img).toBeInTheDocument();
      expect(img.src).toContain('profile-avatar');
    });

    it('should fallback to user avatar when profile avatar unavailable', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'John Doe',
        avatar: '/user-avatar.jpg'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: {} } } as any);

      render(<AuditCreatedBy />);
      const img = document.querySelector('img') as HTMLImageElement;
      
      expect(img).toBeInTheDocument();
      expect(img.src).toContain('user-avatar');
    });

    it('should display default fallback when no avatar found', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'John Doe'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: {} } } as any);

      render(<AuditCreatedBy />);
      
      // Should show initials
      const badge = document.querySelector('[class*="rounded-full"]');
      expect(badge).toBeInTheDocument();
    });

    it('should truncate long display names', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      const longName = 'A'.repeat(50);
      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: longName
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: {} } } as any);

      render(<AuditCreatedBy />);
      
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
        display_name: 'John Doe'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: {} } } as any);

      render(<AuditCreatedBy disabled={true} />);
      
      // Component should still render, disabled might affect styling
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply correct styling classes', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'John Doe',
        avatar: '/avatar.jpg'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: {} } } as any);

      const { container } = render(<AuditCreatedBy />);
      
      // Should have flex container
      expect(container.querySelector('[class*="flex"]')).toBeInTheDocument();
      
      // Should have gap between elements
      expect(container.querySelector('[class*="gap"]')).toBeInTheDocument();
    });

    it('should display as read-only audit field', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'John Doe'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: {} } } as any);

      render(<AuditCreatedBy />);
      
      // Should display as text, not interactive
      const nameDisplay = screen.getByText('John Doe');
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

      render(<AuditCreatedBy />);
      
      const placeholder = screen.getByText('Created by...');
      expect(placeholder).toBeInTheDocument();
    });

    it('should handle user with no display name', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: {} } } as any);

      render(<AuditCreatedBy />);
      
      // Should render without crashing
      expect(document.body).toBeInTheDocument();
    });

    it('should handle null profile data', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'John Doe'
      } as any);

      mockUseUserProfile.mockReturnValue(undefined as any);

      render(<AuditCreatedBy />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should handle profile loading state', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'John Doe'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: undefined, isLoading: true } as any);

      render(<AuditCreatedBy />);
      
      // Should display user info while loading profile
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'John Doe',
        avatar: '/avatar.jpg'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: {} } } as any);

      const { container } = render(<AuditCreatedBy />);
      
      // Should have main container
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should have alt text for avatar image', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'John Doe',
        avatar: '/avatar.jpg'
      } as any);

      mockUseUserProfile.mockReturnValue({ data: { data: { avatar: '/profile.jpg' } } } as any);

      render(<AuditCreatedBy />);
      
      const img = document.querySelector('img');
      expect(img).toHaveAttribute('alt');
    });
  });
});
