import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SecuritySection } from '../SecuritySection';
import { getUserActivity } from '../../../service/activityService';

const toastSuccess = vi.fn();
const toastError = vi.fn();
const mutateAsync = vi.fn();

let profileState: { data?: any; isLoading: boolean; error: unknown | null } = {
  data: { data: { first_name: 'A', last_name: 'B', email: 'a@b.com' } },
  isLoading: false,
  error: null,
};

vi.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', first_name: 'A', last_name: 'B', email: 'a@b.com' },
  }),
}));

vi.mock('../../../hooks/useApi', () => ({
  useUserProfile: () => profileState,
  useChangePassword: () => ({ mutateAsync, isPending: false }),
}));

vi.mock('../../common/Toast', () => ({
  useToast: () => ({ success: toastSuccess, error: toastError }),
}));

vi.mock('../../../service/activityService', () => ({
  getUserActivity: vi.fn(() =>
    Promise.resolve({
      login_sessions: [
        {
          login_at: new Date().toISOString(),
          browser: 'Chrome',
          browser_version: '120',
          os: 'Windows',
          timezone: 'UTC',
        },
      ],
    })
  ),
}));

vi.mock('../../../utils/validation', () => ({
  validatePasswordStrength: () => ({
    isValid: true,
    hasLength: true,
    hasUpper: true,
    hasLower: true,
    hasNumber: true,
    hasSymbol: true,
    containsNameAndEmail: false,
    containsCommon: false,
  }),
}));

vi.mock('../AccountSettings', () => ({
  useFooterButtons: () => ({
    registerFooter: vi.fn(),
    clearFooter: vi.fn(),
    currentSection: 'security',
  }),
}));

describe('SecuritySection', () => {
  beforeEach(() => {
    profileState = {
      data: { data: { first_name: 'A', last_name: 'B', email: 'a@b.com' } },
      isLoading: false,
      error: null,
    };
  });

  it('renders loading state', async () => {
    profileState = { data: undefined, isLoading: true, error: null };
    render(<SecuritySection />);
    await waitFor(() => {
      expect(screen.getByText('Loading security settings...')).toBeInTheDocument();
    });
  });

  it('renders error state', async () => {
    profileState = { data: undefined, isLoading: false, error: new Error('fail') };
    render(<SecuritySection />);
    await waitFor(() => {
      expect(screen.getByText('Failed to load security settings')).toBeInTheDocument();
    });
  });

  it('renders sections and login sessions', async () => {
    render(<SecuritySection />);
    expect(screen.getByText('Change Password')).toBeInTheDocument();
    expect(screen.getByText('Recent Login Activity')).toBeInTheDocument();
    expect(await screen.findByText(/Chrome/)).toBeInTheDocument();
  });

  it('shows empty sessions message when no sessions found', async () => {
    vi.mocked(getUserActivity).mockResolvedValueOnce({ login_sessions: [] });
    render(<SecuritySection />);
    expect(await screen.findByText(/No previous login sessions found/i)).toBeInTheDocument();
  });

  it('validates current password on blur', async () => {
    render(<SecuritySection />);
    const input = screen.getByLabelText('Current Password');
    fireEvent.blur(input);
    expect(await screen.findByText(/Current password is required/i)).toBeInTheDocument();
  });
});
