import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ProfileTab } from '../ProfileTab';

const mockUseAuth = vi.fn();
const mockUseCurrentUser = vi.fn();
const mockUseUserProfile = vi.fn();

vi.mock('../../../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../../../auth/useCurrentUser', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
  getUserInitials: (user: { first_name?: string; last_name?: string; email?: string } | null) => {
    if (!user) return '?';
    const first = user.first_name?.[0] ?? '';
    const last = user.last_name?.[0] ?? '';
    if (first || last) return `${first}${last}`.toUpperCase();
    return (user.email?.[0] ?? '?').toUpperCase();
  },
  getUserDisplayName: (user: { first_name?: string; last_name?: string; email?: string } | null) => {
    if (!user) return 'Unknown';
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
    return name || user.email || 'Unknown';
  },
}));

vi.mock('../../../../hooks/useApi', () => ({
  useUserProfile: (userId: string) => mockUseUserProfile(userId),
}));

describe('ProfileTab', () => {
  const defaultUser = {
    id: 'user-1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    is_verified: true,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: defaultUser });
    mockUseCurrentUser.mockReturnValue(defaultUser);
    mockUseUserProfile.mockReturnValue({ data: { data: { avatar: '' } } });
  });

  describe('Rendering', () => {
    it('renders profile information heading', () => {
      render(<ProfileTab workspaceId="workspace-1" />);

      expect(screen.getByRole('heading', { name: /profile information/i })).toBeInTheDocument();
    });

    it('renders full name from current user', () => {
      render(<ProfileTab workspaceId="workspace-1" />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders email from current user', () => {
      render(<ProfileTab workspaceId="workspace-1" />);

      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('renders user id from auth user', () => {
      render(<ProfileTab workspaceId="workspace-1" />);

      expect(screen.getByText('user-1')).toBeInTheDocument();
    });

    it('renders account settings heading', () => {
      render(<ProfileTab workspaceId="workspace-1" />);

      expect(screen.getByRole('heading', { name: /account settings/i })).toBeInTheDocument();
    });

    it('renders email notifications section', () => {
      render(<ProfileTab workspaceId="workspace-1" />);

      expect(screen.getByRole('heading', { name: /email notifications/i })).toBeInTheDocument();
    });

    it('renders two-factor authentication section', () => {
      render(<ProfileTab workspaceId="workspace-1" />);

      expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument();
    });

    it('renders account status section', () => {
      render(<ProfileTab workspaceId="workspace-1" />);

      expect(screen.getByText(/account status/i)).toBeInTheDocument();
    });
  });

  describe('User data', () => {
    it('renders user initials when no avatar', () => {
      mockUseUserProfile.mockReturnValue({ data: { data: {} } });

      render(<ProfileTab workspaceId="workspace-1" />);

      const initialsOutput = screen.getByLabelText(/user initials/i);
      expect(initialsOutput).toHaveTextContent('JD');
    });

    it('renders fallback email when current user has no email', () => {
      mockUseCurrentUser.mockReturnValue({ ...defaultUser, email: undefined });

      render(<ProfileTab workspaceId="workspace-1" />);

      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });

    it('renders member since with formatted date', () => {
      render(<ProfileTab workspaceId="workspace-1" />);

      expect(screen.getByText(/member since/i)).toBeInTheDocument();
    });

    it('renders verified and active in account status when user is verified and active', () => {
      render(<ProfileTab workspaceId="workspace-1" />);

      expect(screen.getByText(/verified/i)).toBeInTheDocument();
      expect(screen.getByText(/active/i)).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('renders Not available when auth user has no id', () => {
      mockUseAuth.mockReturnValue({ user: null });

      render(<ProfileTab workspaceId="workspace-1" />);

      expect(screen.getByText('Not available')).toBeInTheDocument();
    });

    it('renders N/A for created date when user has no created_at', () => {
      mockUseCurrentUser.mockReturnValue({ ...defaultUser, created_at: undefined });

      render(<ProfileTab workspaceId="workspace-1" />);

      expect(screen.getByText(/N\/A/)).toBeInTheDocument();
    });

    it('calls useUserProfile with auth user id', () => {
      mockUseAuth.mockReturnValue({ user: { id: 'auth-123' } });
      mockUseCurrentUser.mockReturnValue({ id: 'auth-123', email: 'a@b.com' });

      render(<ProfileTab workspaceId="workspace-1" />);

      expect(mockUseUserProfile).toHaveBeenCalledWith('auth-123');
    });

    it('calls useUserProfile with empty string when auth user is null', () => {
      mockUseAuth.mockReturnValue({ user: null });
      mockUseCurrentUser.mockReturnValue(null);

      render(<ProfileTab workspaceId="workspace-1" />);

      expect(mockUseUserProfile).toHaveBeenCalledWith('');
    });
  });
});
