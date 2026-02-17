import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Hoist mock functions to top scope for vi.mock() to access them
const {
  mockForgotPassword,
  mockNavigate,
} = vi.hoisted(() => ({
  mockForgotPassword: vi.fn(),
  mockNavigate: vi.fn(),
}));

// Setup mocks BEFORE importing component
vi.mock('../../service/clientService', () => ({
  forgotPassword: mockForgotPassword,
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Import AFTER mocks are set up
import ForgotPasswordPage from '../ForgotPasswordPage';

// Helper to render with router
const renderWithRouter = () => {
  return render(
    <BrowserRouter>
      <ForgotPasswordPage />
    </BrowserRouter>
  );
};

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the forgot password form', () => {
      renderWithRouter();

      expect(screen.getByRole('heading', { name: /forgot password\?/i })).toBeInTheDocument();
      expect(screen.getByText(/no worries! enter your email address/i)).toBeInTheDocument();
    });

    it('should render email input field with label', () => {
      renderWithRouter();

      const emailLabel = screen.getByText('Email Address');
      const emailInput = screen.getByPlaceholderText('Enter your email address');

      expect(emailLabel).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();
      expect((emailInput as HTMLInputElement).type).toBe('email');
      expect((emailInput as HTMLInputElement).value).toBe('');
    });

    it('should render required indicator on email label', () => {
      renderWithRouter();

      const requiredSpan = screen.getByText('*');
      expect(requiredSpan).toBeInTheDocument();
    });

    it('should render submit button with correct text', () => {
      renderWithRouter();

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should render back to login link', () => {
      renderWithRouter();

      const backLinks = screen.getAllByRole('link', { name: /back to login/i });
      expect(backLinks.length).toBeGreaterThan(0);
      backLinks.forEach((link) => {
        expect(link).toHaveAttribute('href', '/login');
      });
    });

    it('should render sign in link in footer', () => {
      renderWithRouter();

      const signInLink = screen.getByRole('link', { name: /sign in/i });
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute('href', '/login');
    });

    it('should render remember password text', () => {
      renderWithRouter();

      expect(screen.getByText(/remember your password\?/i)).toBeInTheDocument();
    });
  });

  describe('Email Validation', () => {
    it('should show required error when email is empty on blur', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      
      await user.click(emailInput);
      await user.tab();

      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should show invalid email error for malformed email', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('should clear error when user starts typing after error', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      
      await user.click(emailInput);
      await user.tab();
      
      expect(screen.getByText('This field is required')).toBeInTheDocument();

      await user.type(emailInput, 'test@example.com');

      expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
    });

    it('should validate email on blur with valid email', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      
      await user.type(emailInput, 'valid@example.com');
      await user.tab();

      expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/this field is required/i)).not.toBeInTheDocument();
    });

    it('should show invalid email error with email missing domain', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      
      await user.type(emailInput, 'user@');
      await user.tab();

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('should show invalid email error with email missing @ symbol', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      
      await user.type(emailInput, 'userdomain.com');
      await user.tab();

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('should accept valid email formats', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const validEmails = [
        'user@example.com',
        'test.email@example.co.uk',
        'user+tag@example.com',
      ];

      for (const email of validEmails) {
        await user.clear(emailInput);
        await user.type(emailInput, email);
        await user.tab();

        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
      }
    });

    it('rejects emails longer than 254 chars', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const longLocal = 'a'.repeat(200);
      const longEmail = `${longLocal}@example.com`;

      await user.type(emailInput, longEmail);
      await user.tab();

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('rejects emails with local part longer than 64 chars', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const longLocal = 'a'.repeat(65);
      const email = `${longLocal}@example.com`;

      await user.type(emailInput, email);
      await user.tab();

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('rejects emails with invalid domain characters', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      await user.type(emailInput, 'user@exa mple.com');
      await user.tab();

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('rejects emails with short TLD', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      await user.type(emailInput, 'user@example.c');
      await user.tab();

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should not submit form when email is empty', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      expect(mockForgotPassword).not.toHaveBeenCalled();
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should not submit form when email is invalid', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      expect(mockForgotPassword).not.toHaveBeenCalled();
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('should call forgotPassword with trimmed email on valid submission', async () => {
      const user = userEvent.setup();
      mockForgotPassword.mockResolvedValueOnce({ success: true });
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, '  test@example.com  ');
      await user.click(submitButton);

      expect(mockForgotPassword).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockForgotPassword).toHaveBeenCalledTimes(1);
    });;
  });

  describe('Success State', () => {
    it('should display success message after successful submission', async () => {
      const user = userEvent.setup();
      mockForgotPassword.mockResolvedValueOnce({ success: true });
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
      });
    });

    it('should show success icon after successful submission', async () => {
      const user = userEvent.setup();
      mockForgotPassword.mockResolvedValueOnce({ success: true });
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
      });
    });

    it('should display email confirmation message with submitted email', async () => {
      const user = userEvent.setup();
      mockForgotPassword.mockResolvedValueOnce({ success: true });
      renderWithRouter();

      const testEmail = 'test@example.com';
      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, testEmail);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(new RegExp(testEmail))).toBeInTheDocument();
      });
    });

    it('should show back to login button on success', async () => {
      const user = userEvent.setup();
      mockForgotPassword.mockResolvedValueOnce({ success: true });
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        const backToLoginButton = screen.getByRole('link', { name: /back to login/i });
        expect(backToLoginButton).toBeInTheDocument();
        expect(backToLoginButton).toHaveAttribute('href', '/login');
      });
    });

    it('should show try different email button on success', async () => {
      const user = userEvent.setup();
      mockForgotPassword.mockResolvedValueOnce({ success: true });
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try a different email/i })).toBeInTheDocument();
      });
    });

    it('should reset form when clicking try different email button', async () => {
      const user = userEvent.setup();
      mockForgotPassword.mockResolvedValueOnce({ success: true });
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
      });

      const tryDifferentButton = screen.getByRole('button', { name: /try a different email/i });
      await user.click(tryDifferentButton);

      expect(screen.getByRole('heading', { name: /forgot password\?/i })).toBeInTheDocument();
      const resetEmailInput = screen.getByPlaceholderText('Enter your email address');
      expect((resetEmailInput as HTMLInputElement).value).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'User not found';
      mockForgotPassword.mockRejectedValueOnce(new Error(errorMessage));
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'nonexistent@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should display default error message when error has no message property', async () => {
      const user = userEvent.setup();
      mockForgotPassword.mockRejectedValueOnce(new Error('Failed to send reset email'));
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to send reset email/i)).toBeInTheDocument();
      });
    });

    it('should clear error when user starts typing', async () => {
      const user = userEvent.setup();
      mockForgotPassword.mockRejectedValueOnce(new Error('Failed to send reset email'));
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to send reset email/i)).toBeInTheDocument();
      });

      await user.clear(emailInput);
      expect(screen.queryByText(/failed to send reset email/i)).not.toBeInTheDocument();
    });

    it('should clear error when user changes email input', async () => {
      const user = userEvent.setup();
      mockForgotPassword.mockRejectedValueOnce(new Error('Failed to send reset email'));
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to send reset email/i)).toBeInTheDocument();
      });

      await user.type(emailInput, 'another');
      expect(screen.queryByText(/failed to send reset email/i)).not.toBeInTheDocument();
    });

    it('should not show success state when error occurs', async () => {
      const user = userEvent.setup();
      mockForgotPassword.mockRejectedValueOnce(new Error('Failed to send reset email'));
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to send reset email/i)).toBeInTheDocument();
      });

      expect(screen.queryByRole('heading', { name: /check your email/i })).not.toBeInTheDocument();
    });

    it('should keep form visible when error occurs', async () => {
      const user = userEvent.setup();
      mockForgotPassword.mockRejectedValueOnce(new Error('Failed to send reset email'));
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to send reset email/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { name: /forgot password\?/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
    });

    it('should allow resubmission after error', async () => {
      const user = userEvent.setup();
      mockForgotPassword
        .mockRejectedValueOnce(new Error('Failed to send reset email'))
        .mockResolvedValueOnce({ success: true });
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      // First submission with error
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to send reset email/i)).toBeInTheDocument();
      });

      // Second submission should succeed
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should set isLoading to true during submission', async () => {
      const user = userEvent.setup();
      let resolveCallback: (() => void) | undefined;
      const promise = new Promise<void>((resolve) => {
        resolveCallback = resolve;
      });
      
      mockForgotPassword.mockImplementationOnce(() => promise);
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      const loadingButton = screen.getByRole('button', { name: /sending/i });
      expect(loadingButton).toBeDisabled();

      if (resolveCallback !== undefined) {
        resolveCallback();
      }

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /sending/i })).not.toBeInTheDocument();
      });
    });

    it('should reset loading state after successful submission', async () => {
      const user = userEvent.setup();
      mockForgotPassword.mockResolvedValueOnce({ success: true });
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
      });

      const backToLoginButton = screen.getByRole('link', { name: /back to login/i });
      expect(backToLoginButton).toBeInTheDocument();
    });

    it('should reset loading state after error', async () => {
      const user = userEvent.setup();
      mockForgotPassword.mockRejectedValueOnce(new Error('Failed to send reset email'));
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to send reset email/i)).toBeInTheDocument();
      });

      const resetButton = screen.getByRole('button', { name: /send reset link/i });
      expect(resetButton).not.toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace-only email input', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, '   ');
      await user.click(submitButton);

      expect(mockForgotPassword).not.toHaveBeenCalled();
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should handle email with leading and trailing spaces', async () => {
      const user = userEvent.setup();
      mockForgotPassword.mockResolvedValueOnce({ success: true });
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, '  test@example.com  ');
      await user.click(submitButton);

      expect(mockForgotPassword).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should handle rapid form submissions', async () => {
      const user = userEvent.setup();
      let resolveCallback: (() => void) | undefined;
      const promise = new Promise<void>((resolve) => {
        resolveCallback = resolve;
      });
      
      mockForgotPassword.mockImplementationOnce(() => promise);
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      
      // Attempt multiple clicks while loading
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      if (resolveCallback !== undefined) {
        resolveCallback();
      }

      // Should only call API once due to disabled button
      await waitFor(() => {
        expect(mockForgotPassword).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle special characters in email', async () => {
      const user = userEvent.setup();
      mockForgotPassword.mockResolvedValueOnce({ success: true });
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      const specialEmail = 'user+tag@example.com';
      await user.type(emailInput, specialEmail);
      await user.click(submitButton);

      expect(mockForgotPassword).toHaveBeenCalledWith({ email: specialEmail });
    });

    it('should allow multiple submissions with different emails after reset', async () => {
      const user = userEvent.setup();
      mockForgotPassword
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: true });
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      let submitButton = screen.getByRole('button', { name: /send reset link/i });

      // First submission
      await user.type(emailInput, 'first@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
      });

      expect(mockForgotPassword).toHaveBeenNthCalledWith(1, { email: 'first@example.com' });

      // Reset to try different email
      const tryDifferentButton = screen.getByRole('button', { name: /try a different email/i });
      await user.click(tryDifferentButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /forgot password\?/i })).toBeInTheDocument();
      });

      // Second submission with different email
      submitButton = screen.getByRole('button', { name: /send reset link/i });
      const resetEmailInput = screen.getByPlaceholderText('Enter your email address');
      await user.type(resetEmailInput, 'second@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
      });

      expect(mockForgotPassword).toHaveBeenNthCalledWith(2, { email: 'second@example.com' });
      expect(mockForgotPassword).toHaveBeenCalledTimes(2);
    });

    it('should handle very long email addresses', async () => {
      const user = userEvent.setup();
      mockForgotPassword.mockResolvedValueOnce({ success: true });
      renderWithRouter();

      const longEmail = 'verylongemailaddresswithmanycharacters@example.com';
      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, longEmail);
      await user.click(submitButton);

      expect(mockForgotPassword).toHaveBeenCalledWith({ email: longEmail });
    });
  });

  describe('Navigation', () => {
    it('should navigate to login when clicking back to login from form', () => {
      renderWithRouter();

      const backLinks = screen.getAllByRole('link', { name: /back to login/i });
      const backFormLink = backLinks[0];

      expect(backFormLink).toHaveAttribute('href', '/login');
    });

    it('should navigate to login when clicking sign in link', () => {
      renderWithRouter();

      const signInLink = screen.getByRole('link', { name: /sign in/i });
      expect(signInLink).toHaveAttribute('href', '/login');
    });

    it('should navigate to login when clicking back to login from success state', async () => {
      const user = userEvent.setup();
      mockForgotPassword.mockResolvedValueOnce({ success: true });
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
      });

      const successBackButton = screen.getByRole('link', { name: /back to login/i });
      expect(successBackButton).toHaveAttribute('href', '/login');
    });
  });

  describe('Accessibility', () => {
    it('should have proper label association with input', () => {
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      expect(emailInput).toBeInTheDocument();
    });

    it('should show error icons when validation fails', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      
      await user.type(emailInput, 'invalid');
      await user.tab();

      // Error message should be displayed
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('should have semantic heading hierarchy', () => {
      renderWithRouter();

      const mainHeading = screen.getByRole('heading', { name: /forgot password\?/i });
      expect(mainHeading.tagName).toMatch(/^H[1-6]$/);
    });

    it('should have form with proper structure', () => {
      renderWithRouter();

      const form = screen.getByRole('button', { name: /send reset link/i }).closest('form');
      expect(form).toBeInTheDocument();
    });
  });
});
