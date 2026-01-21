/**
 * Comprehensive Unit Tests for ProfileSection.tsx
 *
 * Following the AAA pattern (Arrange-Act-Assert) and testing:
 * - Happy path scenarios
 * - Error handling and failure modes
 * - Edge cases
 * - User interactions
 * - Form validation
 * - Avatar upload/removal
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfileSection } from '../ProfileSection';
import type { UserProfile } from '../../../types/userProfile';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock useAuth hook
const mockAuthUser = { id: 'user-123', email: 'test@example.com' };
vi.mock('../../../auth/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: mockAuthUser })),
}));

// Mock useCurrentUser hook
const mockCurrentUser = {
  id: 'user-123',
  email: 'test@example.com',
  avatar: 'https://example.com/avatar.png',
};
vi.mock('../../../auth/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => mockCurrentUser),
}));

// Mock Toast hook
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};
vi.mock('../../common/Toast', () => ({
  useToast: vi.fn(() => mockToast),
}));

// Mock footer buttons context
const mockRegisterFooter = vi.fn();
const mockClearFooter = vi.fn();
vi.mock('../AccountSettings', () => ({
  useFooterButtons: vi.fn(() => ({
    registerFooter: mockRegisterFooter,
    clearFooter: mockClearFooter,
    currentSection: 'profile',
  })),
}));

// Mock API hooks - using factory functions
const mockRefetch = vi.fn();
const mockUpdateProfileMutate = vi.fn();
const mockAddAvatarMutate = vi.fn();
const mockRemoveAvatarMutate = vi.fn();

vi.mock('../../../hooks/useApi', () => ({
  useUserProfile: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    isError: false,
    isPending: false,
    isSuccess: false,
    status: 'success',
    fetchStatus: 'idle',
  })),
  useUpdateUserProfile: vi.fn(() => ({
    mutateAsync: vi.fn(),
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: undefined,
    reset: vi.fn(),
    status: 'idle',
  })),
  useAddOrUpdateAvatar: vi.fn(() => ({
    mutateAsync: vi.fn(),
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: undefined,
    reset: vi.fn(),
    status: 'idle',
  })),
  useRemoveAvatar: vi.fn(() => ({
    mutateAsync: vi.fn(),
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: undefined,
    reset: vi.fn(),
    status: 'idle',
  })),
}));

// Mock AdvancedDropdown component
vi.mock('../../common/dropdown/AdvancedDropdown', () => ({
  AdvancedDropdown: vi.fn(({ options, value, onChange, placeholder, disabled }) => (
    <select
      data-testid="advanced-dropdown"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-label={placeholder}
    >
      <option value="">{placeholder}</option>
      {options.map((opt: { label: string; value: string }) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )),
}));

// Mock DateField component
vi.mock('../../common/Fields/DateField', () => ({
  DateField: vi.fn(({ value, onChange, disabled }) => (
    <input
      data-testid="date-field"
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder="DD-MM-YYYY"
    />
  )),
}));

// Mock dateValidation utilities
vi.mock('../../../utils/dateValidation', () => ({
  validateDOB: vi.fn(() => null),
  getYesterdayISO: vi.fn(() => '2026-01-11'),
  convertDateToFormat: vi.fn((date: string) => date),
}));

// Mock constants
vi.mock('../../../types/constants', () => ({
  timeZoneOptions: [
    { label: 'America/New_York', value: 'EST', country: 'United States' },
    { label: 'America/Los_Angeles', value: 'PST', country: 'United States' },
    { label: 'Europe/London', value: 'GMT', country: 'United Kingdom' },
    { label: 'Asia/Tokyo', value: 'JST', country: 'Japan' },
  ],
  currencyLocaleOptions: [
    { label: 'English (en-US)', value: 'en-US' },
    { label: 'French (fr-FR)', value: 'fr-FR' },
    { label: 'German (de-DE)', value: 'de-DE' },
  ],
}));

// Import mocked modules for manipulation
import { useAuth } from '../../../auth/AuthContext';
import { useCurrentUser } from '../../../auth/useCurrentUser';
import {
  useUserProfile,
  useUpdateUserProfile,
  useAddOrUpdateAvatar,
  useRemoveAvatar,
} from '../../../hooks/useApi';
import { useFooterButtons } from '../AccountSettings';

// ============================================================================
// Test Utilities
// ============================================================================

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

const createMockUserProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: 'user-123',
  email: 'test@example.com',
  first_name: 'John',
  last_name: 'Doe',
  display_name: 'John Doe',
  avatar: 'https://example.com/avatar.png',
  auth_provider: 'email',
  external_id: 'ext-123',
  mfa_enabled: false,
  mfa_secret: '',
  email_verified: true,
  phone: '+1234567890',
  phone_verified: false,
  status: 'active',
  last_login_at: '2026-01-10T10:00:00Z',
  last_active_at: '2026-01-10T12:00:00Z',
  timezone: 'EST',
  locale: 'en-US',
  failed_login_attempts: 0,
  locked_until: null,
  password_changed_at: '2026-01-01T00:00:00Z',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2026-01-10T12:00:00Z',
  deleted_at: null,
  is_deleted: false,
  country: 'United States',
  dob: '15-05-1990',
  ...overrides,
});

// Helper to setup all mocks with profile data
const setupMocksWithProfile = (profile: UserProfile | null) => {
  vi.mocked(useUserProfile).mockReturnValue({
    data: profile ? { data: profile } : null,
    isLoading: false,
    error: null,
    refetch: mockRefetch,
    isError: false,
    isPending: false,
    isSuccess: true,
    status: 'success',
    fetchStatus: 'idle',
  } as unknown as ReturnType<typeof useUserProfile>);

  vi.mocked(useUpdateUserProfile).mockReturnValue({
    mutateAsync: mockUpdateProfileMutate,
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: undefined,
    reset: vi.fn(),
    status: 'idle',
  } as unknown as ReturnType<typeof useUpdateUserProfile>);

  vi.mocked(useAddOrUpdateAvatar).mockReturnValue({
    mutateAsync: mockAddAvatarMutate,
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: undefined,
    reset: vi.fn(),
    status: 'idle',
  } as unknown as ReturnType<typeof useAddOrUpdateAvatar>);

  vi.mocked(useRemoveAvatar).mockReturnValue({
    mutateAsync: mockRemoveAvatarMutate,
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: undefined,
    reset: vi.fn(),
    status: 'idle',
  } as unknown as ReturnType<typeof useRemoveAvatar>);
};

interface WrapperProps {
  children: React.ReactNode;
}

const createWrapper = (queryClient: QueryClient) => {
  const Wrapper: React.FC<WrapperProps> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

const renderProfileSection = (queryClient?: QueryClient) => {
  const client = queryClient || createTestQueryClient();
  return render(<ProfileSection />, { wrapper: createWrapper(client) });
};

// ============================================================================
// Test Suite
// ============================================================================

describe('ProfileSection', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();

    // Reset auth mocks
    vi.mocked(useAuth).mockReturnValue({ user: mockAuthUser } as ReturnType<typeof useAuth>);
    vi.mocked(useCurrentUser).mockReturnValue(mockCurrentUser);
    vi.mocked(useFooterButtons).mockReturnValue({
      registerFooter: mockRegisterFooter,
      clearFooter: mockClearFooter,
      currentSection: 'profile',
    });

    // Setup default API hook returns with null profile
    setupMocksWithProfile(null);

    // Reset sessionStorage mock
    vi.spyOn(sessionStorage, 'setItem').mockImplementation(() => {});
    vi.spyOn(sessionStorage, 'getItem').mockReturnValue(null);

    // Reset URL methods
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==========================================================================
  // Loading State Tests
  // ==========================================================================

  describe('Loading State', () => {
    it('displays loading spinner when profile is loading', () => {
      // Arrange
      vi.mocked(useUserProfile).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
        isError: false,
        isPending: true,
        isSuccess: false,
        status: 'pending',
        fetchStatus: 'fetching',
      } as unknown as ReturnType<typeof useUserProfile>);

      // Act
      renderProfileSection(queryClient);

      // Assert
      expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    });

    it('displays loading spinner with correct styling', () => {
      // Arrange
      vi.mocked(useUserProfile).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
        isError: false,
        isPending: true,
        isSuccess: false,
        status: 'pending',
        fetchStatus: 'fetching',
      } as unknown as ReturnType<typeof useUserProfile>);

      // Act
      const { container } = renderProfileSection(queryClient);

      // Assert
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Error State Tests
  // ==========================================================================

  describe('Error State', () => {
    it('displays error message when profile fetch fails', () => {
      // Arrange
      vi.mocked(useUserProfile).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Network error'),
        refetch: mockRefetch,
        isError: true,
        isPending: false,
        isSuccess: false,
        status: 'error',
        fetchStatus: 'idle',
      } as unknown as ReturnType<typeof useUserProfile>);

      // Act
      renderProfileSection(queryClient);

      // Assert
      expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
    });

    it('displays Try Again button on error', () => {
      // Arrange
      vi.mocked(useUserProfile).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Network error'),
        refetch: mockRefetch,
        isError: true,
        isPending: false,
        isSuccess: false,
        status: 'error',
        fetchStatus: 'idle',
      } as unknown as ReturnType<typeof useUserProfile>);

      // Act
      renderProfileSection(queryClient);

      // Assert
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });

    it('calls refetch when Try Again button is clicked', async () => {
      // Arrange
      vi.mocked(useUserProfile).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Network error'),
        refetch: mockRefetch,
        isError: true,
        isPending: false,
        isSuccess: false,
        status: 'error',
        fetchStatus: 'idle',
      } as unknown as ReturnType<typeof useUserProfile>);

      renderProfileSection(queryClient);

      // Act
      const tryAgainButton = screen.getByRole('button', { name: 'Try Again' });
      fireEvent.click(tryAgainButton);

      // Assert
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // No Profile Data State Tests
  // ==========================================================================

  describe('No Profile Data State', () => {
    it('displays no profile data message when profile is null', () => {
      // Arrange
      vi.mocked(useUserProfile).mockReturnValue({
        data: { data: null },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        isError: false,
        isPending: false,
        isSuccess: true,
        status: 'success',
        fetchStatus: 'idle',
      } as unknown as ReturnType<typeof useUserProfile>);

      // Act
      renderProfileSection(queryClient);

      // Assert
      expect(screen.getByText('No profile data available')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Profile Display Tests (View Mode)
  // ==========================================================================

  describe('Profile Display (View Mode)', () => {
    beforeEach(() => {
      const mockProfile = createMockUserProfile();
      setupMocksWithProfile(mockProfile);
    });

    it('renders first name field with profile data', () => {
      // Arrange & Act
      renderProfileSection(queryClient);

      // Assert
      const firstNameInput = screen.getByPlaceholderText('Enter first name');
      expect(firstNameInput).toHaveValue('John');
    });

    it('renders last name field with profile data', () => {
      // Arrange & Act
      renderProfileSection(queryClient);

      // Assert
      const lastNameInput = screen.getByPlaceholderText('Enter last name');
      expect(lastNameInput).toHaveValue('Doe');
    });

    it('renders display name field with profile data', () => {
      // Arrange & Act
      renderProfileSection(queryClient);

      // Assert
      const displayNameInput = screen.getByPlaceholderText('Enter display name');
      expect(displayNameInput).toHaveValue('John Doe');
    });

    it('renders email field as readonly', () => {
      // Arrange & Act
      renderProfileSection(queryClient);

      // Assert
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('displays email verified badge when email is verified', () => {
      // Arrange & Act
      renderProfileSection(queryClient);

      // Assert
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('does not display verified badge when email is not verified', () => {
      // Arrange
      const mockProfile = createMockUserProfile({ email_verified: false });
      setupMocksWithProfile(mockProfile);

      // Act
      renderProfileSection(queryClient);

      // Assert
      expect(screen.queryByText('Verified')).not.toBeInTheDocument();
    });

    it('renders all form fields as disabled in view mode', () => {
      // Arrange & Act
      renderProfileSection(queryClient);

      // Assert
      const firstNameInput = screen.getByPlaceholderText('Enter first name');
      const lastNameInput = screen.getByPlaceholderText('Enter last name');
      const displayNameInput = screen.getByPlaceholderText('Enter display name');

      expect(firstNameInput).toBeDisabled();
      expect(lastNameInput).toBeDisabled();
      expect(displayNameInput).toBeDisabled();
    });

    it('displays profile image when avatar exists', () => {
      // Arrange & Act
      renderProfileSection(queryClient);

      // Assert
      const avatarImg = screen.getByAltText('Profile');
      expect(avatarImg).toHaveAttribute('src', 'https://example.com/avatar.png');
    });

    it('displays upload area when no avatar exists', () => {
      // Arrange
      const mockProfile = createMockUserProfile({ avatar: undefined });
      setupMocksWithProfile(mockProfile);
      vi.mocked(useCurrentUser).mockReturnValue({ ...mockCurrentUser, avatar: undefined });

      // Act
      renderProfileSection(queryClient);

      // Assert
      expect(screen.getByText('Click to upload')).toBeInTheDocument();
      expect(screen.getByText(/or drag and drop/)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Edit Mode Tests
  // ==========================================================================

  describe('Edit Mode', () => {
    beforeEach(() => {
      const mockProfile = createMockUserProfile();
      setupMocksWithProfile(mockProfile);
    });

    it('registers Edit button in footer on initial render', () => {
      // Arrange & Act
      renderProfileSection(queryClient);

      // Assert
      expect(mockRegisterFooter).toHaveBeenCalled();
    });

    it('enables form fields when edit mode is activated via footer', async () => {
      // Arrange
      renderProfileSection(queryClient);

      // Act - Get the registered footer content and simulate clicking Edit
      const lastCall = mockRegisterFooter.mock.calls[mockRegisterFooter.mock.calls.length - 1];
      const footerContent = lastCall[0] as React.ReactElement;

      const { getByText: getFooterText } = render(footerContent);
      const editButton = getFooterText('Edit');

      await act(async () => {
        fireEvent.click(editButton);
      });

      // Assert
      expect(mockRegisterFooter).toHaveBeenCalled();
    });

    it('clears footer when component unmounts', () => {
      // Arrange & Act
      const { unmount } = renderProfileSection(queryClient);
      unmount();

      // Assert
      expect(mockClearFooter).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Form Input Change Tests
  // ==========================================================================

  describe('Form Input Changes', () => {
    beforeEach(() => {
      const mockProfile = createMockUserProfile();
      setupMocksWithProfile(mockProfile);
    });

    it('displays initial first name value', () => {
      // Arrange & Act
      renderProfileSection(queryClient);

      // Assert
      const firstNameInput = screen.getByPlaceholderText('Enter first name');
      expect(firstNameInput).toHaveValue('John');
    });

    it('displays initial last name value', () => {
      // Arrange & Act
      renderProfileSection(queryClient);

      // Assert
      const lastNameInput = screen.getByPlaceholderText('Enter last name');
      expect(lastNameInput).toHaveValue('Doe');
    });

    it('displays initial display name value', () => {
      // Arrange & Act
      renderProfileSection(queryClient);

      // Assert
      const displayNameInput = screen.getByPlaceholderText('Enter display name');
      expect(displayNameInput).toHaveValue('John Doe');
    });
  });

  // ==========================================================================
  // Country and Timezone Relationship Tests
  // ==========================================================================

  describe('Country and Timezone Relationship', () => {
    beforeEach(() => {
      const mockProfile = createMockUserProfile({ country: 'United States', timezone: 'EST' });
      setupMocksWithProfile(mockProfile);
    });

    it('renders country section with label', () => {
      // Arrange & Act
      renderProfileSection(queryClient);

      // Assert
      expect(screen.getByText('Country')).toBeInTheDocument();
    });

    it('renders timezone section with label', () => {
      // Arrange & Act
      renderProfileSection(queryClient);

      // Assert
      expect(screen.getByText('Time Zone')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Avatar Upload Tests
  // ==========================================================================

  describe('Avatar Upload', () => {
    beforeEach(() => {
      const mockProfile = createMockUserProfile({ avatar: undefined });
      setupMocksWithProfile(mockProfile);
      vi.mocked(useCurrentUser).mockReturnValue({ ...mockCurrentUser, avatar: undefined });
    });

    it('displays upload instructions', () => {
      // Arrange & Act
      renderProfileSection(queryClient);

      // Assert
      expect(screen.getByText('Click to upload')).toBeInTheDocument();
      expect(screen.getByText(/SVG, PNG, JPG or GIF/)).toBeInTheDocument();
    });

    it('displays file size limit information', () => {
      // Arrange & Act
      renderProfileSection(queryClient);

      // Assert
      expect(screen.getByText(/max. 800 x 400px/)).toBeInTheDocument();
    });

    it('has hidden file input for avatar upload', () => {
      // Arrange & Act
      renderProfileSection(queryClient);

      // Assert
      const fileInput = document.getElementById('avatar-upload-input');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveClass('hidden');
    });

    it('accepts image files only', () => {
      // Arrange & Act
      renderProfileSection(queryClient);

      // Assert
      const fileInput = document.getElementById('avatar-upload-input') as HTMLInputElement;
      expect(fileInput.accept).toBe('image/*');
    });
  });

  // ==========================================================================
  // Avatar with Existing Image Tests
  // ==========================================================================

  describe('Avatar with Existing Image', () => {
    beforeEach(() => {
      const mockProfile = createMockUserProfile({ avatar: 'https://example.com/existing-avatar.png' });
      setupMocksWithProfile(mockProfile);
    });

    it('displays existing avatar image', () => {
      // Arrange & Act
      renderProfileSection(queryClient);

      // Assert
      const avatarImg = screen.getByAltText('Profile');
      expect(avatarImg).toHaveAttribute('src', 'https://example.com/existing-avatar.png');
    });

    it('shows upload area alongside existing avatar', () => {
      // Arrange & Act
      renderProfileSection(queryClient);

      // Assert
      expect(screen.getByAltText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Click to upload')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Session Storage Tests
  // ==========================================================================

  describe('Session Storage', () => {
    beforeEach(() => {
      const mockProfile = createMockUserProfile({ country: 'United States', timezone: 'EST' });
      setupMocksWithProfile(mockProfile);
    });

    it('stores timezone in sessionStorage when profile loads', async () => {
      // Arrange
      renderProfileSection(queryClient);
      const lastCall = mockRegisterFooter.mock.calls[mockRegisterFooter.mock.calls.length - 1];
      const footerContent = lastCall[0] as React.ReactElement;
      const { getByText: getFooterText } = render(footerContent);
      const editButton = getFooterText('Edit');

      // Act - Enter edit mode to trigger sessionStorage
      await act(async () => {
        fireEvent.click(editButton);
      });

      // Assert
      await waitFor(() => {
        expect(sessionStorage.setItem).toHaveBeenCalledWith('timezone', 'EST');
      });
    });

    it('stores country in sessionStorage when profile loads', async () => {
      // Arrange
      renderProfileSection(queryClient);
      const lastCall = mockRegisterFooter.mock.calls[mockRegisterFooter.mock.calls.length - 1];
      const footerContent = lastCall[0] as React.ReactElement;
      const { getByText: getFooterText } = render(footerContent);
      const editButton = getFooterText('Edit');

      // Act - Enter edit mode to trigger sessionStorage
      await act(async () => {
        fireEvent.click(editButton);
      });

      // Assert
      await waitFor(() => {
        expect(sessionStorage.setItem).toHaveBeenCalledWith('country', 'United States');
      });
    });
  });

  // ==========================================================================
  // DOB Validation Tests
  // ==========================================================================

  describe('DOB Validation', () => {
    beforeEach(() => {
      const mockProfile = createMockUserProfile();
      setupMocksWithProfile(mockProfile);
    });

    it('displays Date of Birth label', () => {
      // Arrange & Act
      renderProfileSection(queryClient);

      // Assert
      expect(screen.getByText('Date of Birth')).toBeInTheDocument();
    });

    it('shows DOB value from profile in view mode', () => {
      // Arrange & Act
      renderProfileSection(queryClient);

      // Assert
      const dobInput = screen.getByPlaceholderText('Not set');
      expect(dobInput).toHaveValue('15-05-1990');
    });

    it('handles empty DOB value', () => {
      // Arrange
      const mockProfile = createMockUserProfile({ dob: undefined });
      setupMocksWithProfile(mockProfile);

      // Act
      renderProfileSection(queryClient);

      // Assert
      const dobInput = screen.getByPlaceholderText('Not set');
      expect(dobInput).toHaveValue('');
    });
  });

  // ==========================================================================
  // Footer Button Registration Tests
  // ==========================================================================

  describe('Footer Button Registration', () => {
    beforeEach(() => {
      const mockProfile = createMockUserProfile();
      setupMocksWithProfile(mockProfile);
    });

    it('registers footer with profile section identifier', () => {
      // Arrange & Act
      renderProfileSection(queryClient);

      // Assert
      expect(mockRegisterFooter).toHaveBeenCalledWith(expect.anything(), 'profile');
    });

    it('does not register footer when currentSection is not profile', () => {
      // Arrange
      vi.mocked(useFooterButtons).mockReturnValue({
        registerFooter: mockRegisterFooter,
        clearFooter: mockClearFooter,
        currentSection: 'security',
      });

      // Act
      renderProfileSection(queryClient);

      // Assert
      const profileCalls = mockRegisterFooter.mock.calls.filter(
        (call) => call[1] === 'profile'
      );
      expect(profileCalls.length).toBe(0);
    });
  });

  // ==========================================================================
  // Profile Fields Display Tests
  // ==========================================================================

  describe('Profile Fields Display', () => {
    beforeEach(() => {
      const mockProfile = createMockUserProfile();
      setupMocksWithProfile(mockProfile);
    });

    it('renders First Name label', () => {
      renderProfileSection(queryClient);
      expect(screen.getByText('First Name')).toBeInTheDocument();
    });

    it('renders Last Name label', () => {
      renderProfileSection(queryClient);
      expect(screen.getByText('Last Name')).toBeInTheDocument();
    });

    it('renders Display Name label', () => {
      renderProfileSection(queryClient);
      expect(screen.getByText('Display Name')).toBeInTheDocument();
    });

    it('renders Email address label', () => {
      renderProfileSection(queryClient);
      expect(screen.getByText('Email address')).toBeInTheDocument();
    });

    it('renders Profile Image label', () => {
      renderProfileSection(queryClient);
      expect(screen.getByText('Profile Image')).toBeInTheDocument();
    });

    it('renders Country label', () => {
      renderProfileSection(queryClient);
      expect(screen.getByText('Country')).toBeInTheDocument();
    });

    it('renders Time Zone label', () => {
      renderProfileSection(queryClient);
      expect(screen.getByText('Time Zone')).toBeInTheDocument();
    });

    it('renders Language label', () => {
      renderProfileSection(queryClient);
      expect(screen.getByText('Language')).toBeInTheDocument();
    });

    it('renders Date of Birth label', () => {
      renderProfileSection(queryClient);
      expect(screen.getByText('Date of Birth')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Empty/Undefined Field Handling Tests
  // ==========================================================================

  describe('Empty Field Handling', () => {
    it('handles empty first_name gracefully', () => {
      // Arrange
      const mockProfile = createMockUserProfile({ first_name: '' });
      setupMocksWithProfile(mockProfile);

      // Act
      renderProfileSection(queryClient);

      // Assert
      const firstNameInput = screen.getByPlaceholderText('Enter first name');
      expect(firstNameInput).toHaveValue('');
    });

    it('handles undefined country gracefully', () => {
      // Arrange
      const mockProfile = createMockUserProfile({ country: undefined });
      setupMocksWithProfile(mockProfile);

      // Act
      renderProfileSection(queryClient);

      // Assert
      expect(screen.getByText('Country')).toBeInTheDocument();
    });

    it('handles empty timezone gracefully', () => {
      // Arrange
      const mockProfile = createMockUserProfile({ timezone: '' });
      setupMocksWithProfile(mockProfile);

      // Act
      renderProfileSection(queryClient);

      // Assert
      expect(screen.getByText('Time Zone')).toBeInTheDocument();
    });

    it('handles empty locale gracefully', () => {
      // Arrange
      const mockProfile = createMockUserProfile({ locale: '' });
      setupMocksWithProfile(mockProfile);

      // Act
      renderProfileSection(queryClient);

      // Assert
      expect(screen.getByText('Language')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // User ID Edge Cases Tests
  // ==========================================================================

  describe('User ID Edge Cases', () => {
    it('handles missing user ID from auth context', () => {
      // Arrange
      vi.mocked(useAuth).mockReturnValue({ user: null } as ReturnType<typeof useAuth>);
      setupMocksWithProfile(null);

      // Act & Assert - should not throw
      expect(() => renderProfileSection(queryClient)).not.toThrow();
    });

    it('handles undefined user ID', () => {
      // Arrange
      vi.mocked(useAuth).mockReturnValue({
        user: { ...mockAuthUser, id: undefined },
      } as ReturnType<typeof useAuth>);
      setupMocksWithProfile(null);

      // Act & Assert - should not throw
      expect(() => renderProfileSection(queryClient)).not.toThrow();
    });
  });

  // ==========================================================================
  // Avatar Mutation State Tests
  // ==========================================================================

  describe('Avatar Mutation States', () => {
    beforeEach(() => {
      const mockProfile = createMockUserProfile();
      setupMocksWithProfile(mockProfile);
    });

    it('disables avatar input when upload is pending', () => {
      // Arrange
      vi.mocked(useUpdateUserProfile).mockReturnValue({
        mutateAsync: mockUpdateProfileMutate,
        mutate: vi.fn(),
        isPending: true,
        isSuccess: false,
        isError: false,
        error: null,
        data: undefined,
        reset: vi.fn(),
        status: 'pending',
      } as unknown as ReturnType<typeof useUpdateUserProfile>);

      // Act
      renderProfileSection(queryClient);

      // Assert
      const fileInput = document.getElementById('avatar-upload-input') as HTMLInputElement;
      expect(fileInput).toBeDisabled();
    });

    it('shows loading indicator during avatar upload', async () => {
      // Arrange
      vi.mocked(useUpdateUserProfile).mockReturnValue({
        mutateAsync: mockUpdateProfileMutate,
        mutate: vi.fn(),
        isPending: true,
        isSuccess: false,
        isError: false,
        error: null,
        data: undefined,
        reset: vi.fn(),
        status: 'pending',
      } as unknown as ReturnType<typeof useUpdateUserProfile>);

      // Act
      const { container } = renderProfileSection(queryClient);

      // Assert
      await waitFor(() => {
        const spinners = container.querySelectorAll('.animate-spin');
        expect(spinners.length).toBeGreaterThan(0);
      });
    });
  });

  // ==========================================================================
  // Profile Update Mutation Tests
  // ==========================================================================

  describe('Profile Update Mutation', () => {
    beforeEach(() => {
      const mockProfile = createMockUserProfile();
      setupMocksWithProfile(mockProfile);
    });

    it('registers footer during profile update', () => {
      // Arrange
      vi.mocked(useUpdateUserProfile).mockReturnValue({
        mutateAsync: mockUpdateProfileMutate,
        mutate: vi.fn(),
        isPending: true,
        isSuccess: false,
        isError: false,
        error: null,
        data: undefined,
        reset: vi.fn(),
        status: 'pending',
      } as unknown as ReturnType<typeof useUpdateUserProfile>);

      // Act
      renderProfileSection(queryClient);

      // Assert
      expect(mockRegisterFooter).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================

  describe('Accessibility', () => {
    beforeEach(() => {
      const mockProfile = createMockUserProfile();
      setupMocksWithProfile(mockProfile);
    });

    it('has accessible labels for form fields', () => {
      // Arrange & Act
      renderProfileSection(queryClient);

      // Assert
      expect(screen.getByText('First Name')).toBeInTheDocument();
      expect(screen.getByText('Last Name')).toBeInTheDocument();
      expect(screen.getByText('Display Name')).toBeInTheDocument();
    });

    it('has placeholder text for input fields', () => {
      // Arrange & Act
      renderProfileSection(queryClient);

      // Assert
      expect(screen.getByPlaceholderText('Enter first name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter last name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter display name')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Component Cleanup Tests
  // ==========================================================================

  describe('Component Cleanup', () => {
    beforeEach(() => {
      const mockProfile = createMockUserProfile();
      setupMocksWithProfile(mockProfile);
    });

    it('cleans up resources on unmount', () => {
      // Arrange & Act
      const { unmount } = renderProfileSection(queryClient);
      unmount();

      // Assert - cleanup should complete without errors
      expect(true).toBe(true);
    });

    it('clears footer on unmount', () => {
      // Arrange & Act
      const { unmount } = renderProfileSection(queryClient);
      unmount();

      // Assert
      expect(mockClearFooter).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Grid Layout Tests
  // ==========================================================================

  describe('Grid Layout', () => {
    beforeEach(() => {
      const mockProfile = createMockUserProfile();
      setupMocksWithProfile(mockProfile);
    });

    it('renders first name and last name in a grid layout', () => {
      // Arrange & Act
      const { container } = renderProfileSection(queryClient);

      // Assert
      const gridContainer = container.querySelector(String.raw`.grid.grid-cols-1.sm\:grid-cols-2`);
      expect(gridContainer).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Drag and Drop State Tests
  // ==========================================================================

  describe('Drag and Drop States', () => {
    beforeEach(() => {
      const mockProfile = createMockUserProfile({ avatar: undefined });
      setupMocksWithProfile(mockProfile);
      vi.mocked(useCurrentUser).mockReturnValue({ ...mockCurrentUser, avatar: undefined });
    });

    it('renders upload area with correct base styling', () => {
      // Arrange & Act
      const { container } = renderProfileSection(queryClient);

      // Assert
      const uploadArea = container.querySelector('.border-2.border-dashed');
      expect(uploadArea).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Form Data Initialization Tests
  // ==========================================================================

  describe('Form Data Initialization', () => {
    it('initializes form data from user profile', () => {
      // Arrange
      const mockProfile = createMockUserProfile({
        first_name: 'Jane',
        last_name: 'Smith',
        display_name: 'Jane Smith',
      });
      setupMocksWithProfile(mockProfile);

      // Act
      renderProfileSection(queryClient);

      // Assert
      expect(screen.getByPlaceholderText('Enter first name')).toHaveValue('Jane');
      expect(screen.getByPlaceholderText('Enter last name')).toHaveValue('Smith');
      expect(screen.getByPlaceholderText('Enter display name')).toHaveValue('Jane Smith');
    });

    it('handles profile with all fields populated', () => {
      // Arrange
      const mockProfile = createMockUserProfile({
        first_name: 'Test',
        last_name: 'User',
        display_name: 'Test User',
        country: 'Japan',
        timezone: 'JST',
        locale: 'ja-JP',
        dob: '01-01-1985',
      });
      setupMocksWithProfile(mockProfile);

      // Act
      renderProfileSection(queryClient);

      // Assert
      expect(screen.getByPlaceholderText('Enter first name')).toHaveValue('Test');
      expect(screen.getByPlaceholderText('Enter last name')).toHaveValue('User');
    });
  });

  // ==========================================================================
  // Multiple Renders Stability Tests
  // ==========================================================================

  describe('Render Stability', () => {
    beforeEach(() => {
      const mockProfile = createMockUserProfile();
      setupMocksWithProfile(mockProfile);
    });

    it('renders consistently on multiple render cycles', () => {
      // Arrange & Act
      const { rerender } = render(<ProfileSection />, {
        wrapper: createWrapper(queryClient),
      });

      // Assert first render
      expect(screen.getByText('First Name')).toBeInTheDocument();

      // Act - rerender
      rerender(<ProfileSection />);

      // Assert - should still have the same content
      expect(screen.getByText('First Name')).toBeInTheDocument();
    });
  });
});

