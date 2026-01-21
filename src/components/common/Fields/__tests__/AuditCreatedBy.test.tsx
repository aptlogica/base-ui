import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuditCreatedBy } from '../AuditCreatedBy';
import { getUserInitials, useCurrentUser } from '@/auth/useCurrentUser';
import { useUserProfile } from '@/hooks/useApi';

vi.mock('@/auth/useCurrentUser');
vi.mock('@/hooks/useApi');

describe('AuditCreatedBy Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render placeholder when current user is null', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue(null);
      mockUseUserProfile.mockReturnValue({ data: undefined } as any);

      render(<AuditCreatedBy placeholder="No creator" />);

      expect(screen.getByText('No creator')).toBeInTheDocument();
    });

    it('should render default placeholder when none is provided and user is null', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue(null);
      mockUseUserProfile.mockReturnValue({ data: undefined } as any);

      render(<AuditCreatedBy />);

      expect(screen.getByText('Created by...')).toBeInTheDocument();
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

      render(<AuditCreatedBy />);

      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('should fallback to default name when display name is missing', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);
      const mockGetUserInitials = vi.mocked(getUserInitials);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: '',
        avatar: '',
      } as any);
      mockUseUserProfile.mockReturnValue({ data: undefined } as any);
      mockGetUserInitials.mockReturnValue('JD');

      render(<AuditCreatedBy />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
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

      render(<AuditCreatedBy />);

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

      render(<AuditCreatedBy />);

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

      render(<AuditCreatedBy />);

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

      render(<AuditCreatedBy />);

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

      render(<AuditCreatedBy />);

      const image = screen.getByAltText('Profile') as HTMLImageElement;
      expect(image.src).toContain('user-avatar.png');
    });
  });

  describe('Function Calls', () => {
    it('should call getUserInitials with current user when no avatar', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);
      const mockGetUserInitials = vi.mocked(getUserInitials);

      const user = {
        id: '1',
        display_name: 'Jane Doe',
        avatar: '',
      };

      mockUseCurrentUser.mockReturnValue(user as any);
      mockUseUserProfile.mockReturnValue({ data: undefined } as any);
      mockGetUserInitials.mockReturnValue('JD');

      render(<AuditCreatedBy />);

      expect(mockGetUserInitials).toHaveBeenCalledWith(user);
    });

    it('should call useUserProfile with user id when user exists', () => {
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

      render(<AuditCreatedBy />);

      expect(mockUseUserProfile).toHaveBeenCalledWith('1');
    });

    it('should call useUserProfile with empty string when user id is missing', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);
      const mockGetUserInitials = vi.mocked(getUserInitials);

      mockUseCurrentUser.mockReturnValue({
        id: '',
        display_name: 'Jane Doe',
        avatar: '',
      } as any);
      mockUseUserProfile.mockReturnValue({ data: undefined } as any);
      mockGetUserInitials.mockReturnValue('JD');

      render(<AuditCreatedBy />);

      expect(mockUseUserProfile).toHaveBeenCalledWith('');
    });

    it('should call useUserProfile with empty string when user is null', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue(null);
      mockUseUserProfile.mockReturnValue({ data: undefined } as any);

      render(<AuditCreatedBy />);

      expect(mockUseUserProfile).toHaveBeenCalledWith('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined user gracefully', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);

      mockUseCurrentUser.mockReturnValue(undefined as any);
      mockUseUserProfile.mockReturnValue({ data: undefined } as any);

      render(<AuditCreatedBy />);

      expect(screen.getByText('Created by...')).toBeInTheDocument();
    });

    it('should handle user with no id', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);
      const mockGetUserInitials = vi.mocked(getUserInitials);

      mockUseCurrentUser.mockReturnValue({
        display_name: 'Jane Doe',
        avatar: '',
      } as any);
      mockUseUserProfile.mockReturnValue({ data: undefined } as any);
      mockGetUserInitials.mockReturnValue('JD');

      render(<AuditCreatedBy />);

      expect(mockUseUserProfile).toHaveBeenCalledWith('');
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('should handle null profile response', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);
      const mockGetUserInitials = vi.mocked(getUserInitials);

      mockUseCurrentUser.mockReturnValue({
        id: '1',
        display_name: 'Jane Doe',
        avatar: '',
      } as any);
      mockUseUserProfile.mockReturnValue({ data: null } as any);
      mockGetUserInitials.mockReturnValue('JD');

      render(<AuditCreatedBy />);

      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should handle profile response with null data', () => {
      const mockUseCurrentUser = vi.mocked(useCurrentUser);
      const mockUseUserProfile = vi.mocked(useUserProfile);
      const mockGetUserInitials = vi.mocked(getUserInitials);

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
      mockGetUserInitials.mockReturnValue('JD');

      render(<AuditCreatedBy />);

      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });
});
