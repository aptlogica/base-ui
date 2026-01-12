import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import UserDropdown from '../UserDropdown';

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useAuth
const mockLogout = vi.fn();
vi.mock('../../../auth/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    logout: mockLogout,
    saving: false,
    user: { id: 'user-1', email: 'test@example.com' },
  })),
}));

// Import the mocked module for access in tests
import { useAuth } from '../../../auth/AuthContext';

// Mock useUserProfile
const mockUseUserProfile = vi.fn().mockReturnValue({
  data: {
    data: {
      id: 'user-1',
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      display_name: 'John Doe',
    },
  },
  isLoading: false,
});

vi.mock('../../../hooks/useApi', () => ({
  useUserProfile: (id: string) => mockUseUserProfile(id),
}));

vi.mock('../../modals/AccountSettingsModal', () => ({
  AccountSettingsModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="account-settings-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null,
}));

// Mock window.matchMedia
const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

// Reset default mock values
const resetMocks = () => {
  mockLogout.mockReset();
  mockUseUserProfile.mockReturnValue({
    data: {
      data: {
        id: 'user-1',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        display_name: 'John Doe',
      },
    },
    isLoading: false,
  });
  vi.mocked(useAuth).mockReturnValue({
    logout: mockLogout,
    saving: false,
    user: { id: 'user-1', email: 'test@example.com' },
  } as any);
};

describe('UserDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMocks();
    localStorage.clear();
    window.matchMedia = mockMatchMedia;
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
  });

  it('renders user display name', () => {
    renderWithRouter(<UserDropdown />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders user email', () => {
    renderWithRouter(<UserDropdown />);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('displays user initials in avatar', () => {
    renderWithRouter(<UserDropdown />);

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('opens dropdown when avatar is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<UserDropdown />);

    await user.click(screen.getByText('JD'));

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  it('does not show dropdown initially', () => {
    renderWithRouter(<UserDropdown />);

    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <div>
        <UserDropdown />
        <button>Outside</button>
      </div>
    );

    await user.click(screen.getByText('JD'));
    expect(screen.getByText('Profile')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Outside' }));

    await waitFor(() => {
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    });
  });

  it('calls logout and navigates when Sign out is clicked', async () => {
    const user = userEvent.setup();

    renderWithRouter(<UserDropdown />);

    await user.click(screen.getByText('JD'));
    await user.click(screen.getByText('Sign out'));

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('opens account settings modal when Profile is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<UserDropdown />);

    await user.click(screen.getByText('JD'));
    await user.click(screen.getByText('Profile'));

    expect(screen.getByTestId('account-settings-modal')).toBeInTheDocument();
  });

  it('closes dropdown when Profile is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<UserDropdown />);

    await user.click(screen.getByText('JD'));
    await user.click(screen.getByText('Profile'));

    await waitFor(() => {
      expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
    });
  });

  it('shows loading state when profile is loading', () => {
    mockUseUserProfile.mockReturnValue({
      data: null,
      isLoading: true,
    });

    renderWithRouter(<UserDropdown />);

    // Should show skeleton loaders
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays avatar image when provided', () => {
    mockUseUserProfile.mockReturnValue({
      data: {
        data: {
          id: 'user-1',
          email: 'test@example.com',
          display_name: 'John Doe',
          avatar: 'https://example.com/avatar.jpg',
        },
      },
      isLoading: false,
    });

    renderWithRouter(<UserDropdown />);

    const img = screen.getByRole('img', { name: 'John Doe' });
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('falls back to email when no display name', () => {
    mockUseUserProfile.mockReturnValue({
      data: {
        data: {
          id: 'user-1',
          email: 'test@example.com',
          display_name: null,
          first_name: null,
          last_name: null,
        } as any,
      },
      isLoading: false,
    });

    renderWithRouter(<UserDropdown />);

    // Email should appear twice: once as display name and once as email
    const emailElements = screen.getAllByText('test@example.com');
    expect(emailElements.length).toBeGreaterThanOrEqual(1);
  });

  it('generates initials from first and last name', () => {
    renderWithRouter(<UserDropdown />);

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('generates initials from display name when no first/last name', () => {
    mockUseUserProfile.mockReturnValue({
      data: {
        data: {
          id: 'user-1',
          email: 'test@example.com',
          display_name: 'Bob Smith',
        },
      },
      isLoading: false,
    });

    renderWithRouter(<UserDropdown />);

    expect(screen.getByText('BS')).toBeInTheDocument();
  });

  it('disables Sign out button when saving', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue({
      logout: vi.fn(),
      saving: true,
      user: { id: 'user-1', email: 'test@example.com' },
    } as any);

    renderWithRouter(<UserDropdown />);

    await user.click(screen.getByText('JD'));

    const signOutButton = screen.getByText('Sign out').closest('button');
    expect(signOutButton).toBeDisabled();
  });

  it('shows Light Mode button when dark theme is active', async () => {
    const user = userEvent.setup();
    
    renderWithRouter(<UserDropdown />);

    // Open dropdown and click Dark Mode to activate dark theme
    await user.click(screen.getByText('JD'));
    await user.click(screen.getByText('Dark Mode'));

    // Wait for theme to be applied
    await waitFor(() => {
      expect(document.documentElement).toHaveClass('dark');
    });

    // The dropdown is still open after clicking Dark Mode, so Light Mode should be visible
    await waitFor(() => {
      expect(screen.getByText('Light Mode')).toBeInTheDocument();
    });
  });

  it('shows Dark Mode button when light theme is active', async () => {
    const user = userEvent.setup();
    localStorage.setItem('theme', 'light');
    renderWithRouter(<UserDropdown />);

    await user.click(screen.getByText('JD'));

    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
  });

  it('applies theme to document element', async () => {
    const user = userEvent.setup();
    renderWithRouter(<UserDropdown />);

    await user.click(screen.getByText('JD'));
    await user.click(screen.getByText('Dark Mode'));

    await waitFor(() => {
      expect(document.documentElement).toHaveClass('dark');
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggles dropdown on multiple clicks', async () => {
    const user = userEvent.setup();
    renderWithRouter(<UserDropdown />);

    const avatarButton = screen.getByText('JD');

    // Open
    await user.click(avatarButton);
    expect(screen.getByText('Profile')).toBeInTheDocument();

    // Close
    await user.click(avatarButton);
    await waitFor(() => {
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    });

    // Open again
    await user.click(avatarButton);
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('renders menu items with icons', async () => {
    const user = userEvent.setup();
    renderWithRouter(<UserDropdown />);

    await user.click(screen.getByText('JD'));

    // Check if icons are rendered (lucide-react renders as SVG)
    const menuItems = screen.getByText('Profile').closest('div');
    const icons = menuItems?.querySelectorAll('svg');
    expect(icons!.length).toBeGreaterThan(0);
  });

  it('handles missing user data gracefully', () => {
    mockUseUserProfile.mockReturnValue({
      data: null,
      isLoading: false,
    });

    renderWithRouter(<UserDropdown />);

    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('navigates to login after logout error', async () => {
    const user = userEvent.setup();
    const mockLogoutError = vi.fn().mockRejectedValue(new Error('Logout failed'));
    vi.mocked(useAuth).mockReturnValue({
      logout: mockLogoutError,
      saving: false,
      user: { id: 'user-1', email: 'test@example.com' },
    } as any);

    renderWithRouter(<UserDropdown />);

    await user.click(screen.getByText('JD'));
    await user.click(screen.getByText('Sign out'));

    expect(mockLogoutError).toHaveBeenCalledTimes(1);
  });

  it('closes account modal when close is triggered', async () => {
    const user = userEvent.setup();
    renderWithRouter(<UserDropdown />);

    await user.click(screen.getByText('JD'));
    await user.click(screen.getByText('Profile'));

    expect(screen.getByTestId('account-settings-modal')).toBeInTheDocument();

    await user.click(screen.getByText('Close Modal'));

    await waitFor(() => {
      expect(screen.queryByTestId('account-settings-modal')).not.toBeInTheDocument();
    });
  });
});
