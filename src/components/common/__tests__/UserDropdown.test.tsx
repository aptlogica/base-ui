import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import UserDropdown from '../UserDropdown';

const logoutMock = vi.fn();
const navigateMock = vi.fn();
const useUserProfileMock = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ logout: logoutMock, user: { id: 'user-1' } }),
}));

vi.mock('../../../hooks/useApi', () => ({
  useUserProfile: (...args: any[]) => useUserProfileMock(...args),
}));

vi.mock('../../modals/AccountSettingsModal', () => ({
  AccountSettingsModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="account-modal">Account Settings</div> : null,
}));

const matchMediaMock = vi.fn();

describe('UserDropdown', () => {
  beforeEach(() => {
    logoutMock.mockResolvedValue(undefined);
    navigateMock.mockClear();
    useUserProfileMock.mockReturnValue({
      data: { data: { display_name: 'Jane Doe', email: 'jane@example.com' } },
      isLoading: false,
    });

    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    Object.defineProperty(globalThis, 'matchMedia', {
      value: matchMediaMock,
      writable: true,
    });

    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.dataset.theme = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders user name and email from profile', () => {
    render(<UserDropdown />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('opens dropdown and shows actions', () => {
    render(<UserDropdown />);
    fireEvent.click(screen.getByTitle(/user menu/i));
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  it('opens account settings modal from profile action', () => {
    render(<UserDropdown />);
    fireEvent.click(screen.getByTitle(/user menu/i));
    fireEvent.click(screen.getByText('Profile'));
    expect(screen.getByTestId('account-modal')).toBeInTheDocument();
  });

  it('toggles theme and updates localStorage', () => {
    vi.useFakeTimers();
    localStorage.setItem('theme', 'light');
    render(<UserDropdown />);
    fireEvent.click(screen.getByTitle(/user menu/i));
    fireEvent.click(screen.getByLabelText(/switch to dark mode/i));
    act(() => {
      vi.runAllTimers();
    });
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    vi.useRealTimers();
  });

  it('logs out and navigates to login', async () => {
    render(<UserDropdown />);
    fireEvent.click(screen.getByTitle(/user menu/i));
    await act(async () => {
      fireEvent.click(screen.getByText('Sign out'));
    });
    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });

  it('closes dropdown when clicking outside', () => {
    render(<UserDropdown />);
    fireEvent.click(screen.getByTitle(/user menu/i));
    expect(screen.getByText('Sign out')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
  });
});
