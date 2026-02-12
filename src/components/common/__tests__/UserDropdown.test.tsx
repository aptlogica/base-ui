import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import UserDropdown from '../UserDropdown';

const logoutMock = vi.fn(() => Promise.resolve());
const navigateMock = vi.fn();

vi.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ logout: logoutMock, user: { id: 'user-1' } }),
}));

vi.mock('../../../hooks/useApi', () => ({
  useUserProfile: () => ({
    data: {
      data: {
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
      },
    },
    isLoading: false,
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('../../modals/AccountSettingsModal', () => ({
  AccountSettingsModal: ({ isOpen }: { isOpen: boolean }) => (
    <div data-testid="account-settings-modal" data-open={isOpen ? 'true' : 'false'} />
  ),
}));

const mockMatchMedia = () => {
  const listeners: Array<() => void> = [];
  return (query: string) => ({
    matches: false,
    media: query,
    addEventListener: (_: string, cb: () => void) => listeners.push(cb),
    removeEventListener: (_: string, cb: () => void) => {
      const idx = listeners.indexOf(cb);
      if (idx >= 0) listeners.splice(idx, 1);
    },
  });
};

describe('UserDropdown', () => {
  beforeEach(() => {
    logoutMock.mockClear();
    navigateMock.mockClear();
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.dataset.theme = '';
    // @ts-expect-error - test shim
    globalThis.matchMedia = mockMatchMedia();
  });

  it('renders user name and email', () => {
    render(<UserDropdown />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('opens profile menu and account settings modal', () => {
    render(<UserDropdown />);
    fireEvent.click(screen.getByTitle(/user menu/i));
    fireEvent.click(screen.getByText('Profile'));
    expect(screen.getByTestId('account-settings-modal')).toHaveAttribute('data-open', 'true');
  });

  it('toggles theme and persists preference', () => {
    localStorage.setItem('theme', 'light');
    render(<UserDropdown />);
    fireEvent.click(screen.getByTitle(/user menu/i));
    fireEvent.click(screen.getByRole('button', { name: /switch to dark mode/i }));
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('logs out and navigates to login', async () => {
    render(<UserDropdown />);
    fireEvent.click(screen.getByTitle(/user menu/i));
    fireEvent.click(screen.getByText('Sign out'));
    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith('/login');
    });
  });
});
