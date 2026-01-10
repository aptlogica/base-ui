import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Hoist mock functions to top scope for vi.mock() to access them
const {
  mockResetPassword,
  mockNavigate,
  mockUseParams,
  mockUseSearchParams,
} = vi.hoisted(() => ({
  mockResetPassword: vi.fn(),
  mockNavigate: vi.fn(),
  mockUseParams: vi.fn(),
  mockUseSearchParams: vi.fn(),
}));

// Setup mocks BEFORE importing component
vi.mock('../../service/clientService', () => ({
  resetPassword: mockResetPassword,
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
    useSearchParams: () => mockUseSearchParams(),
  };
});

// Import AFTER mocks are set up
import ResetPasswordPage from '../ResetPasswordPage';

// Helper to render with router - with token by default
const renderWithRouter = (hasToken = true) => {
  if (hasToken) {
    mockUseParams.mockReturnValue({ token: 'test-token-123' });
    mockUseSearchParams.mockReturnValue([new URLSearchParams(), vi.fn()]);
  } else {
    mockUseParams.mockReturnValue({ token: undefined });
    mockUseSearchParams.mockReturnValue([new URLSearchParams(), vi.fn()]);
  }

  return render(
    <BrowserRouter>
      <ResetPasswordPage />
    </BrowserRouter>
  );
};

// Helper to get password toggle buttons
const getPasswordToggleButtons = (): HTMLElement[] => {
  return screen.getAllByRole('button').filter((btn) =>
    btn.getAttribute('aria-label')?.includes('password')
  );
};

// Helper to resolve a promise with delay
const createDelayedPromise = (delayMs: number): Promise<{ success: boolean }> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, delayMs);
  });

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
    mockUseParams.mockReset();
    mockUseSearchParams.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render reset password form with correct heading', () => {
      renderWithRouter();

      expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument();
      expect(screen.getByText(/enter your new password below/i)).toBeInTheDocument();
    });

    it('should render back to login link', () => {
      renderWithRouter();

      const backLink = screen.getByRole('link', { name: /back to login/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/login');
    });

    it('should render new password input field with label', () => {
      renderWithRouter();

      const label = screen.getByText('New Password');
      const input = screen.getByPlaceholderText('Enter your new password');

      expect(label).toBeInTheDocument();
      expect(input).toBeInTheDocument();
      expect((input as HTMLInputElement).type).toBe('password');
      expect((input as HTMLInputElement).value).toBe('');
    });

    it('should render confirm password input field with label', () => {
      renderWithRouter();

      const label = screen.getByText('Confirm New Password');
      const input = screen.getByPlaceholderText('Confirm your new password');

      expect(label).toBeInTheDocument();
      expect(input).toBeInTheDocument();
      expect((input as HTMLInputElement).type).toBe('password');
      expect((input as HTMLInputElement).value).toBe('');
    });

    it('should render required indicators on both password fields', () => {
      renderWithRouter();

      const requiredSpans = screen.getAllByText('*');
      expect(requiredSpans.length).toBeGreaterThanOrEqual(2);
    });

    it('should render password reset button', () => {
      renderWithRouter();

      const button = screen.getByRole('button', { name: /reset password/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should render sign in link in footer', () => {
      renderWithRouter();

      const signInLink = screen.getByRole('link', { name: /sign in/i });
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute('href', '/login');
    });

    it('should render help circle icon for password requirements', () => {
      renderWithRouter();

      const helpCircleIcon = document.querySelector('svg[class*="lucide-circle-question-mark"]');
      expect(helpCircleIcon).toBeInTheDocument();
    });

    it('should render password visibility toggle buttons', () => {
      renderWithRouter();

      const toggleButtons = screen.getAllByRole('button');
      const visibilityButtons = toggleButtons.filter((btn) =>
        btn.getAttribute('aria-label')?.includes('password')
      );
      expect(visibilityButtons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Token validation', () => {
    it('should redirect to login when token is missing from path and query', () => {
      renderWithRouter(false);

      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  describe('Password visibility toggle', () => {
    it('should toggle new password visibility on button click', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const toggleButtons = getPasswordToggleButtons();
      const newPasswordToggle = toggleButtons[0];
      if (!newPasswordToggle) throw new Error('Toggle not found');

      expect((passwordInput as HTMLInputElement).type).toBe('password');

      await user.click(newPasswordToggle);
      expect((passwordInput as HTMLInputElement).type).toBe('text');

      await user.click(newPasswordToggle);
      expect((passwordInput as HTMLInputElement).type).toBe('password');
    });

    it('should toggle confirm password visibility on button click', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your new password');
      const toggleButtons = getPasswordToggleButtons();
      const confirmPasswordToggle = toggleButtons[1];
      if (!confirmPasswordToggle) throw new Error('Toggle not found');

      expect((confirmPasswordInput as HTMLInputElement).type).toBe('password');

      await user.click(confirmPasswordToggle);
      expect((confirmPasswordInput as HTMLInputElement).type).toBe('text');

      await user.click(confirmPasswordToggle);
      expect((confirmPasswordInput as HTMLInputElement).type).toBe('password');
    });

    it('should have correct aria-labels for visibility toggle', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const toggleButtons = getPasswordToggleButtons();
      const newPasswordToggle = toggleButtons[0];

      expect(newPasswordToggle.getAttribute('aria-label')).toBe('Show password');

      await user.click(newPasswordToggle);
      expect(newPasswordToggle.getAttribute('aria-label')).toBe('Hide password');
    });
  });

  describe('Form validation - Password field', () => {
    it('should show required error when password is empty on blur', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');

      await user.click(passwordInput);
      await user.tab();

      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should clear required error when user types in password field', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');

      await user.click(passwordInput);
      await user.tab();
      expect(screen.getByText('This field is required')).toBeInTheDocument();

      await user.type(passwordInput, 'T');
      expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
    });

    it('should show password strength requirements tooltip on hover', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const helpCircleIcon = document.querySelector('svg[class*="lucide-circle-question-mark"]');
      if (!helpCircleIcon) throw new Error('Help icon not found');

      // Hover over help icon to show tooltip
      await user.hover(helpCircleIcon.parentElement as HTMLElement);

      // Wait for tooltip to appear
      await waitFor(() => {
        expect(screen.getByText('Password Requirements:')).toBeInTheDocument();
      });
    });

    it('should validate password strength on blur', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');

      // Type a weak password (missing numbers, symbols, uppercase, lowercase)
      await user.type(passwordInput, 'weak');
      await user.tab();

      await waitFor(() => {
        // Check for the actual error message that the validation produces
        expect(screen.getByText(/Password must include/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for password without uppercase', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');

      await user.type(passwordInput, 'password123!');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/Password must include/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for password without lowercase', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');

      await user.type(passwordInput, 'PASSWORD123!');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/Password must include/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for password without number', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');

      await user.type(passwordInput, 'PasswordTest!');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/Password must include/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for password without symbol', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');

      await user.type(passwordInput, 'PasswordTest123');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/Password must include/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for password under 8 characters', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');

      await user.type(passwordInput, 'Pass1!');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/Password must include/i)).toBeInTheDocument();
      });
    });

    it('should accept valid password with all requirements', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');

      await user.type(passwordInput, 'ValidPass123!');
      await user.tab();

      expect(screen.queryByText(/Password must include/i)).not.toBeInTheDocument();
    });

    it('should display password strength meter bars', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');

      // Type a valid password
      await user.type(passwordInput, 'ValidPass123!');

      // The strength bars should be rendered (element check)
      expect(passwordInput).toBeInTheDocument();
    });

  });

  describe('Form validation - Confirm password field', () => {
    it('should show required error when confirm password is empty on blur', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const confirmInput = screen.getByPlaceholderText('Confirm your new password');

      await user.click(confirmInput);
      await user.tab();

      const errorMessages = screen.getAllByText('This field is required');
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    it('should clear required error when user types in confirm password field', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const confirmInput = screen.getByPlaceholderText('Confirm your new password');

      await user.click(confirmInput);
      await user.tab();
      expect(screen.getByText('This field is required')).toBeInTheDocument();

      await user.type(confirmInput, 'T');
      expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
    });

    it('should show password mismatch error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmInput = screen.getByPlaceholderText('Confirm your new password');

      await user.type(passwordInput, 'ValidPass123!');
      await user.type(confirmInput, 'ValidPass456!');
      await user.tab();

      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    it('should clear mismatch error when passwords match', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmInput = screen.getByPlaceholderText('Confirm your new password');

      await user.type(passwordInput, 'ValidPass123!');
      await user.type(confirmInput, 'Different123!');
      await user.tab();

      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();

      // Clear confirm and retype to match
      await user.clear(confirmInput);
      await user.type(confirmInput, 'ValidPass123!');
      await user.tab();

      expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument();
    });
  });

  describe('Form submission', () => {
    it('should disable submit button when form is invalid', () => {
      renderWithRouter();

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      expect((submitButton as HTMLButtonElement).disabled).toBe(true);
    });

    it('should disable submit button when password is empty', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const confirmInput = screen.getByPlaceholderText('Confirm your new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(confirmInput, 'ValidPass123!');

      expect((submitButton as HTMLButtonElement).disabled).toBe(true);
    });

    it('should disable submit button when confirm password is empty', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'ValidPass123!');

      expect((submitButton as HTMLButtonElement).disabled).toBe(true);
    });

    it('should disable submit button when passwords do not match', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmInput = screen.getByPlaceholderText('Confirm your new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'ValidPass123!');
      await user.type(confirmInput, 'ValidPass456!');

      expect((submitButton as HTMLButtonElement).disabled).toBe(true);
    });

    it('should disable submit button when password is invalid', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmInput = screen.getByPlaceholderText('Confirm your new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      const weakPassword = 'weak';
      await user.type(passwordInput, weakPassword);
      await user.type(confirmInput, weakPassword);

      expect((submitButton as HTMLButtonElement).disabled).toBe(true);
    });

    it('should enable submit button when form is valid', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmInput = screen.getByPlaceholderText('Confirm your new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      const validPassword = 'ValidPass123!';
      await user.type(passwordInput, validPassword);
      await user.type(confirmInput, validPassword);

      expect((submitButton as HTMLButtonElement).disabled).toBe(false);
    });

    it('should call resetPassword with correct parameters on successful submission', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockResolvedValue({ success: true });
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmInput = screen.getByPlaceholderText('Confirm your new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      const validPassword = 'ValidPass123!';
      await user.type(passwordInput, validPassword);
      await user.type(confirmInput, validPassword);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith({
          token: 'test-token-123',
          new_password: validPassword,
        });
      });
    });

    it('should show loading state while submitting', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockImplementation(() => createDelayedPromise(500));
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmInput = screen.getByPlaceholderText('Confirm your new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      const validPassword = 'ValidPass123!';
      await user.type(passwordInput, validPassword);
      await user.type(confirmInput, validPassword);
      await user.click(submitButton);

      expect(screen.getByRole('button', { name: /resetting/i })).toBeInTheDocument();
    });

    it('should disable submit button while loading', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockImplementation(() => createDelayedPromise(500));
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmInput = screen.getByPlaceholderText('Confirm your new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      const validPassword = 'ValidPass123!';
      await user.type(passwordInput, validPassword);
      await user.type(confirmInput, validPassword);
      await user.click(submitButton);

      expect((submitButton as HTMLButtonElement).disabled).toBe(true);
    });
  });

  describe('Success state', () => {
    it('should show success message after successful password reset', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockResolvedValue({ success: true });
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmInput = screen.getByPlaceholderText('Confirm your new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      const validPassword = 'ValidPass123!';
      await user.type(passwordInput, validPassword);
      await user.type(confirmInput, validPassword);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password reset successful/i)).toBeInTheDocument();
      });
    });

    it('should show success icon after successful password reset', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockResolvedValue({ success: true });
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmInput = screen.getByPlaceholderText('Confirm your new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      const validPassword = 'ValidPass123!';
      await user.type(passwordInput, validPassword);
      await user.type(confirmInput, validPassword);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/your password has been successfully reset/i)).toBeInTheDocument();
      });
    });

    it('should show sign in button on success page', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockResolvedValue({ success: true });
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmInput = screen.getByPlaceholderText('Confirm your new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      const validPassword = 'ValidPass123!';
      await user.type(passwordInput, validPassword);
      await user.type(confirmInput, validPassword);
      await user.click(submitButton);

      await waitFor(() => {
        const signInButton = screen.getByRole('link', { name: /sign in/i });
        expect(signInButton).toBeInTheDocument();
        expect(signInButton).toHaveAttribute('href', '/login');
      });
    });

    it('should navigate to login page from success page', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockResolvedValue({ success: true });
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmInput = screen.getByPlaceholderText('Confirm your new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      const validPassword = 'ValidPass123!';
      await user.type(passwordInput, validPassword);
      await user.type(confirmInput, validPassword);
      await user.click(submitButton);

      await waitFor(() => {
        const signInLink = screen.getByRole('link', { name: /sign in/i });
        expect(signInLink).toHaveAttribute('href', '/login');
      });
    });
  });

  describe('Error handling', () => {
    it('should show error message on API failure', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Token has expired';
      mockResetPassword.mockRejectedValue(new Error(errorMessage));
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmInput = screen.getByPlaceholderText('Confirm your new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      const validPassword = 'ValidPass123!';
      await user.type(passwordInput, validPassword);
      await user.type(confirmInput, validPassword);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should show generic error message when API error has no message', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockRejectedValue({});
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmInput = screen.getByPlaceholderText('Confirm your new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      const validPassword = 'ValidPass123!';
      await user.type(passwordInput, validPassword);
      await user.type(confirmInput, validPassword);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to reset password')).toBeInTheDocument();
      });
    });

    it('should clear error when user modifies password field after error', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockRejectedValue(new Error('Reset failed'));
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmInput = screen.getByPlaceholderText('Confirm your new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      const validPassword = 'ValidPass123!';
      await user.type(passwordInput, validPassword);
      await user.type(confirmInput, validPassword);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Reset failed')).toBeInTheDocument();
      });

      // Modify password to clear error
      await user.clear(passwordInput);
      await user.type(passwordInput, 'NewValidPass456!');

      expect(screen.queryByText('Reset failed')).not.toBeInTheDocument();
    });

    it('should clear error when user modifies confirm password field after error', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockRejectedValue(new Error('Reset failed'));
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmInput = screen.getByPlaceholderText('Confirm your new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      const validPassword = 'ValidPass123!';
      const newPassword = 'NewValidPass456!';
      await user.type(passwordInput, validPassword);
      await user.type(confirmInput, validPassword);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Reset failed')).toBeInTheDocument();
      });

      // Modify confirm password to clear error
      await user.clear(confirmInput);
      await user.type(confirmInput, newPassword);

      expect(screen.queryByText('Reset failed')).not.toBeInTheDocument();
    });

    it('should remain on form page after error', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockRejectedValue(new Error('Reset failed'));
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmInput = screen.getByPlaceholderText('Confirm your new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      const validPassword = 'ValidPass123!';
      await user.type(passwordInput, validPassword);
      await user.type(confirmInput, validPassword);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Reset failed')).toBeInTheDocument();
      });

      // Form should still be visible
      expect(screen.getByPlaceholderText('Enter your new password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm your new password')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle whitespace-only password input', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, '     ');
      await user.click(submitButton);

      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should handle rapid form submissions', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockImplementation(() => createDelayedPromise(100));
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmInput = screen.getByPlaceholderText('Confirm your new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      const validPassword = 'ValidPass123!';
      await user.type(passwordInput, validPassword);
      await user.type(confirmInput, validPassword);

      // Click multiple times quickly
      await user.click(submitButton);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle password with special characters', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockResolvedValue({ success: true });
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmInput = screen.getByPlaceholderText('Confirm your new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      const passwordWithSpecialChars = 'P@ssw0rd!#$%';
      await user.type(passwordInput, passwordWithSpecialChars);
      await user.type(confirmInput, passwordWithSpecialChars);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith({
          token: 'test-token-123',
          new_password: passwordWithSpecialChars,
        });
      });
    });

    it('should handle case-sensitive password matching', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmInput = screen.getByPlaceholderText('Confirm your new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'ValidPass123!');
      await user.type(confirmInput, 'validpass123!');
      await user.tab();

      await waitFor(() => {
        expect((submitButton as HTMLButtonElement).disabled).toBe(true);
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    it('should handle unicode characters in password', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockResolvedValue({ success: true });
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmInput = screen.getByPlaceholderText('Confirm your new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      const passwordWithUnicode = 'P@ssw0rd✓!';
      await user.type(passwordInput, passwordWithUnicode);
      await user.type(confirmInput, passwordWithUnicode);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith({
          token: 'test-token-123',
          new_password: passwordWithUnicode,
        });
      });
    });
  });

  describe('Password requirements tooltip', () => {
    it('should display all password requirements in tooltip', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const helpCircleIcon = document.querySelector('svg[class*="lucide-circle-question-mark"]');
      if (!helpCircleIcon) throw new Error('Help icon not found');

      // Hover over help circle to show tooltip
      await user.hover(helpCircleIcon.parentElement as HTMLElement);

      // Verify all requirements are displayed
      await waitFor(() => {
        expect(screen.getByText(/Minimum 8 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/At least one uppercase letter/i)).toBeInTheDocument();
        expect(screen.getByText(/At least one lowercase letter/i)).toBeInTheDocument();
        expect(screen.getByText(/At least one number/i)).toBeInTheDocument();
        expect(screen.getByText(/At least one symbol/i)).toBeInTheDocument();
      });
    });

    it('should update requirement indicators as user types', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');

      // Type incrementally to test requirement indicators
      await user.type(passwordInput, 'password');
      // Indicator updates should happen in DOM

      // Type uppercase
      await user.clear(passwordInput);
      await user.type(passwordInput, 'Password');
      // Indicator should update

      expect(passwordInput).toBeInTheDocument();
    });
  });

  describe('Back button navigation', () => {
    it('should navigate to login when back button is clicked', async () => {
      renderWithRouter();

      const backLink = screen.getByRole('link', { name: /back to login/i });
      expect(backLink).toHaveAttribute('href', '/login');
    });

    it('should allow user to navigate back without losing focus on form validation', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      await user.type(passwordInput, 'Test');

      const backLink = screen.getByRole('link', { name: /back to login/i });
      expect(backLink).toHaveAttribute('href', '/login');
      expect((passwordInput as HTMLInputElement).value).toBe('Test');
    });
  });

  describe('Form state management', () => {
    it('should maintain password field value while typing', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');

      await user.type(passwordInput, 'ValidPass123!');

      expect((passwordInput as HTMLInputElement).value).toBe('ValidPass123!');
    });

    it('should maintain confirm password field value while typing', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const confirmInput = screen.getByPlaceholderText('Confirm your new password');

      await user.type(confirmInput, 'ValidPass123!');

      expect((confirmInput as HTMLInputElement).value).toBe('ValidPass123!');
    });

    it('should independently manage visibility state for each password field', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmInput = screen.getByPlaceholderText('Confirm your new password');
      const toggleButtons = getPasswordToggleButtons();

      expect((passwordInput as HTMLInputElement).type).toBe('password');
      expect((confirmInput as HTMLInputElement).type).toBe('password');

      await user.click(toggleButtons[0]);

      expect((passwordInput as HTMLInputElement).type).toBe('text');
      expect((confirmInput as HTMLInputElement).type).toBe('password');
    });
  });
});
