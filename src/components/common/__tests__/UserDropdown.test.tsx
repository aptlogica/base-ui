import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserDropdown from '../UserDropdown';

const logoutSpy = vi.fn();
const navigateSpy = vi.fn();
const mockUseUserProfile = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateSpy,
}));

vi.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ logout: logoutSpy, user: { id: 'u1' } }),
}));

vi.mock('../../../hooks/useApi', () => ({
  useUserProfile: () => mockUseUserProfile(),
}));

vi.mock('../../modals/AccountSettingsModal', () => ({
  AccountSettingsModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="account-settings-modal">Account Settings</div> : null,
}));

const mockMatchMedia = (matches = false) => {
  return vi.fn().mockImplementation(() => ({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
};

describe('UserDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserProfile.mockReturnValue({
      data: { data: { display_name: 'Jane Doe', email: 'jane@example.com' } },
      isLoading: false,
    });
    Object.defineProperty(globalThis, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    });
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    delete document.documentElement.dataset.theme;
  });

  it('renders display name and email', () => {
    render(<UserDropdown />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('opens menu and shows profile action', async () => {
    const user = userEvent.setup();
    render(<UserDropdown />);

    await user.click(screen.getByTitle(/user menu/i));
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('opens account settings modal when Profile is clicked', async () => {
    const user = userEvent.setup();
    render(<UserDropdown />);

    await user.click(screen.getByTitle(/user menu/i));
    await user.click(screen.getByText('Profile'));

    expect(screen.getByTestId('account-settings-modal')).toBeInTheDocument();
  });

  it('toggles theme and stores preference', async () => {
    const user = userEvent.setup();
    render(<UserDropdown />);

    await user.click(screen.getByTitle(/user menu/i));
    await user.click(screen.getByRole('button', { name: /switch to dark mode/i }));

    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('logs out and navigates to login', async () => {
    const user = userEvent.setup();
    logoutSpy.mockResolvedValue(undefined);
    render(<UserDropdown />);

    await user.click(screen.getByTitle(/user menu/i));
    await user.click(screen.getByText('Sign out'));

    expect(logoutSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith('/login');
  });
});
