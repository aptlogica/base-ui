import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SecuritySection } from '../SecuritySection';
import { getUserActivity } from '../../../service/activityService';
import { validatePasswordStrength } from '../../../utils/validation';

const toastSuccess = vi.fn();
const toastError = vi.fn();
const mutateAsync = vi.fn();
let lastFooter: React.ReactNode | null = null;
const registerFooter = vi.fn((content: React.ReactNode) => {
  lastFooter = content;
});
const clearFooter = vi.fn(() => {
  lastFooter = null;
});

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
  validatePasswordStrength: vi.fn(() => ({
    isValid: true,
    hasLength: true,
    hasUpper: true,
    hasLower: true,
    hasNumber: true,
    hasSymbol: true,
    containsNameAndEmail: false,
    containsCommon: false,
  })),
}));

vi.mock('../AccountSettings', () => ({
  useFooterButtons: () => ({
    registerFooter,
    clearFooter,
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
    lastFooter = null;
    registerFooter.mockClear();
    clearFooter.mockClear();
    mutateAsync.mockResolvedValue(undefined);
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

  it('shows confirm password mismatch error', async () => {
    render(<SecuritySection />);
    const newPassword = screen.getByLabelText('New Password');
    const confirmPassword = screen.getByLabelText('Confirm New Password');

    fireEvent.change(newPassword, { target: { value: 'ValidPass1!' } });
    fireEvent.change(confirmPassword, { target: { value: 'Different1!' } });
    fireEvent.blur(confirmPassword);

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
  });

  it('submits password update when valid', async () => {
    render(<SecuritySection />);

    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'OldPass1!' } });
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'NewPass1!' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'NewPass1!' } });

    expect(registerFooter).toHaveBeenCalled();
    expect(lastFooter).not.toBeNull();

    const footerRender = render(<>{lastFooter}</>);
    const updateButton = footerRender.getByRole('button', { name: /update password/i });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ old_password: 'OldPass1!', new_password: 'NewPass1!' });
      expect(toastSuccess).toHaveBeenCalled();
    });
  });

  it('shows error toast when password update fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mutateAsync.mockRejectedValueOnce(new Error('failed'));
    render(<SecuritySection />);

    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'OldPass1!' } });
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'NewPass1!' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'NewPass1!' } });

    const footerRender = render(<>{lastFooter}</>);
    const updateButton = footerRender.getByRole('button', { name: /update password/i });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(toastError).toHaveBeenCalled();
    });
    errorSpy.mockRestore();
  });

  it('shows validation error when new password is invalid', async () => {
    vi.mocked(getUserActivity).mockResolvedValueOnce({ login_sessions: [] });
    vi.mocked(validatePasswordStrength).mockImplementation(() => ({
      isValid: false,
      errorMessage: 'Weak password',
      hasLength: false,
      hasUpper: false,
      hasLower: false,
      hasNumber: false,
      hasSymbol: false,
      containsNameAndEmail: false,
      containsCommon: true,
    }));

    render(<SecuritySection />);
    const newPassword = screen.getByLabelText('New Password');
    fireEvent.change(newPassword, { target: { value: 'weak' } });
    fireEvent.blur(newPassword);

    expect(await screen.findByText(/Weak password/i)).toBeInTheDocument();
  });

  it('shows error when confirm password is empty', async () => {
    render(<SecuritySection />);
    const confirmPassword = screen.getByLabelText('Confirm New Password');
    fireEvent.blur(confirmPassword);

    expect(await screen.findByText(/Please confirm your new password/i)).toBeInTheDocument();
  });

  it('renders past login sessions with timezone label', async () => {
    vi.mocked(getUserActivity).mockResolvedValueOnce({
      login_sessions: [
        {
          login_at: new Date('2026-01-10T10:00:00Z').toISOString(),
          browser: 'Chrome',
          browser_version: '120',
          os: 'Windows',
          timezone: 'UTC',
        },
        {
          login_at: new Date('2026-01-09T10:00:00Z').toISOString(),
          browser: 'Firefox',
          browser_version: '122',
          os: 'Linux',
          timezone: 'UTC',
        },
      ],
    });

    render(<SecuritySection />);

    expect(await screen.findByText(/Chrome/)).toBeInTheDocument();
    expect(await screen.findByText(/Firefox/)).toBeInTheDocument();
    expect(screen.getAllByText('UTC').length).toBeGreaterThanOrEqual(1);
  });
});
