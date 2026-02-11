import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuditUser } from '../AuditUser';
import { getUserInitials, useCurrentUser } from '@/auth/useCurrentUser';
import { useUserProfile } from '@/hooks/useApi';

vi.mock('@/auth/useCurrentUser');
vi.mock('@/hooks/useApi');

describe('AuditUser Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render placeholder when current user is null', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue(null);
      mockUseUserProfile.mockReturnValue({ data: undefined } as any);

      render(<AuditUser placeholder="No user" />);

      expect(screen.getByText('No user')).toBeInTheDocument();
    });

    it('should render default placeholder when none is provided and user is null', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue(null);
      mockUseUserProfile.mockReturnValue({ data: undefined } as any);

      render(<AuditUser />);

      expect(screen.getByText('User...')).toBeInTheDocument();
    });

    it('should render user display name when current user exists', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'Jane Doe',
        avatar: '',
      } as any);
      mockUseUserProfile.mockReturnValue({ data: undefined } as any);

      render(<AuditUser />);

      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('should fallback to default email when display name is missing', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: '',
        avatar: '',
      } as any);
      mockUseUserProfile.mockReturnValue({ data: undefined } as any);

      render(<AuditUser />);

      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });

    it('should render avatar from user profile when available', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'Jane Doe',
        avatar: 'user-avatar.png',
      } as any);

      mockUseUserProfile.mockReturnValue({
        data: {
          data: {
            avatar: 'profile-avatar.png',
          },
        },
      } as any);

      render(<AuditUser />);

      const image = screen.getByAltText('Profile') as HTMLImageElement;
      expect(image).toBeInTheDocument();
      expect(image.src).toContain('profile-avatar.png');
    });

    it('should render avatar from current user when profile avatar is missing', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'Jane Doe',
        avatar: 'user-avatar.png',
      } as any);

      mockUseUserProfile.mockReturnValue({ data: undefined } as any);

      render(<AuditUser />);

      const image = screen.getByAltText('Profile') as HTMLImageElement;
      expect(image).toBeInTheDocument();
      expect(image.src).toContain('user-avatar.png');
    });

    it('should render user initials when no avatar is available', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);
      const mockGetUserInitials = vi.mocked(getUserInitials);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'Jane Doe',
        avatar: '',
      } as any);
      mockUseUserProfile.mockReturnValue({ data: undefined } as any);
      mockGetUserInitials.mockReturnValue('JD');

      render(<AuditUser />);

      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should prioritize profile avatar over user avatar', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'Jane Doe',
        avatar: 'user-avatar.png',
      } as any);

      mockUseUserProfile.mockReturnValue({
        data: {
          data: {
            avatar: 'profile-avatar.png',
          },
        },
      } as any);

      render(<AuditUser />);

      const image = screen.getByAltText('Profile') as HTMLImageElement;
      expect(image.src).toContain('profile-avatar.png');
      expect(image.src).not.toContain('user-avatar.png');
    });

    it('should use user avatar when profile data exists but avatar is missing', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'Jane Doe',
        avatar: 'user-avatar.png',
      } as any);

      mockUseUserProfile.mockReturnValue({
        data: {
          data: {},
        },
      } as any);

      render(<AuditUser />);

      const image = screen.getByAltText('Profile') as HTMLImageElement;
      expect(image.src).toContain('user-avatar.png');
    });
  });

  describe('Function Calls', () => {
    it('should call useUserProfile with user id when user exists', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'Jane Doe',
        avatar: '',
      } as any);
      mockUseUserProfile.mockReturnValue({ data: undefined } as any);

      render(<AuditUser />);

      expect(mockUseUserProfile).toHaveBeenCalledWith('1');
    });

    it('should call useUserProfile with empty string when user id is missing', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '',
        display_name: 'Jane Doe',
        avatar: '',
      } as any);
      mockUseUserProfile.mockReturnValue({ data: undefined } as any);

      render(<AuditUser />);

      expect(mockUseUserProfile).toHaveBeenCalledWith('');
    });

    it('should call useUserProfile with empty string when user is null', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue(null);
      mockUseUserProfile.mockReturnValue({ data: undefined } as any);

      render(<AuditUser />);

      expect(mockUseUserProfile).toHaveBeenCalledWith('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined user gracefully', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue(undefined as any);
      mockUseUserProfile.mockReturnValue({ data: undefined } as any);

      render(<AuditUser />);

      expect(screen.getByText('User...')).toBeInTheDocument();
    });

    it('should handle user with no id', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        display_name: 'Jane Doe',
        avatar: '',
      } as any);
      mockUseUserProfile.mockReturnValue({ data: undefined } as any);

      render(<AuditUser />);

      expect(mockUseUserProfile).toHaveBeenCalledWith('');
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('should handle null profile response', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'Jane Doe',
        avatar: '',
      } as any);
      mockUseUserProfile.mockReturnValue({ data: null } as any);

      render(<AuditUser />);

      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('should handle profile response with null data property', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'Jane Doe',
        avatar: '',
      } as any);
      mockUseUserProfile.mockReturnValue({
        data: {
          data: null,
        },
      } as any);

      render(<AuditUser />);

      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
  });

  describe('Custom Placeholder', () => {
    it('should use custom placeholder text', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue(null);
      mockUseUserProfile.mockReturnValue({ data: undefined } as any);

      render(<AuditUser placeholder="Unknown Author" />);

      expect(screen.getByText('Unknown Author')).toBeInTheDocument();
    });

    it('should apply placeholder with current user null', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue(null);
      mockUseUserProfile.mockReturnValue({ data: undefined } as any);

      const { rerender } = render(<AuditUser placeholder="Creator..." />);

      expect(screen.getByText('Creator...')).toBeInTheDocument();

      rerender(<AuditUser placeholder="Editor..." />);

      expect(screen.getByText('Editor...')).toBeInTheDocument();
    });
  });
});
