import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Hoist mock functions to top scope for vi.mock() to access them
const {
  mockAuthLogin,
  mockApiLogin,
  mockResendOtp,
  mockIsAuthenticated,
  mockToastSuccess,
  mockToastError,
  mockToastInfo,
  mockNavigate,
} = vi.hoisted(() => ({
  mockAuthLogin: vi.fn(),
  mockApiLogin: vi.fn(),
  mockResendOtp: vi.fn(),
  mockIsAuthenticated: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
  mockToastInfo: vi.fn(),
  mockNavigate: vi.fn(),
}));

// Setup mocks BEFORE importing component
vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({
    login: mockAuthLogin,
  }),
}));

vi.mock('../../service/clientService', () => ({
  login: mockApiLogin,
  resendOtp: mockResendOtp,
  isAuthenticated: mockIsAuthenticated,
}));

vi.mock('../../components/common/Toast', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
    info: mockToastInfo,
  }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Import AFTER mocks are set up
import LogIn from '../LoginPage';

// Helper to render with router
const renderWithRouter = () => {
  return render(
    <BrowserRouter>
      <LogIn />
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockIsAuthenticated.mockResolvedValue(false);
  });

  describe('Rendering', () => {
    it('should render login form elements', () => {
      renderWithRouter();

      expect(screen.getByText('Sereni Base')).toBeInTheDocument();
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(screen.getByText('Welcome back! Please enter your details.')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    });

    it('should render email input as type email', () => {
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      expect(emailInput.type).toBe('email');
      expect(emailInput.value).toBe('');
    });

    it('should render password input as type password', () => {
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      expect(passwordInput.type).toBe('password');
      expect(passwordInput.value).toBe('');
    });

    it('should render forgot password link', () => {
      renderWithRouter();

      const link = screen.getByRole('link', { name: /forgot password/i });
      expect(link).toHaveAttribute('href', '/forgot-password');
    });

    it('should render sign in button', () => {
      renderWithRouter();

      const button = screen.getByRole('button', { name: /sign in/i });
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should render logo image', () => {
      renderWithRouter();

      const logo = screen.getByAltText('Sereni Base Logo');
      expect(logo).toBeInTheDocument();
    });

    it('should render promotional text on right panel', () => {
      renderWithRouter();

      expect(screen.getByText('Build powerful databases with ease.')).toBeInTheDocument();
      expect(screen.getByText(/Create, manage, and collaborate on databases/)).toBeInTheDocument();
    });

    it('should render calendar view image', () => {
      renderWithRouter();

      const image = screen.getByAltText('Calendar View Preview');
      expect(image).toBeInTheDocument();
    });

    it('should redirect when already authenticated', async () => {
      mockIsAuthenticated.mockResolvedValue(true);

      renderWithRouter();

      await waitFor(() => {
        expect(mockToastInfo).toHaveBeenCalledWith('You are already signed in. Redirecting...');
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });
    });

    it('should suppress redirect toast during logout', async () => {
      mockIsAuthenticated.mockResolvedValue(true);
      sessionStorage.setItem('sb_logout_in_progress', '1');

      renderWithRouter();

      await waitFor(() => {
        expect(mockToastInfo).not.toHaveBeenCalledWith('You are already signed in. Redirecting...');
      });
      expect(mockNavigate).not.toHaveBeenCalled();

      sessionStorage.removeItem('sb_logout_in_progress');
    });

    it('should suppress cross-tab toast during logout', async () => {
      localStorage.setItem('sb_auth_lock', JSON.stringify({ user_id: 'user-1', tab_id: 'tab-1', ts: Date.now() }));
      sessionStorage.setItem('sb_logout_in_progress', '1');

      renderWithRouter();

      await waitFor(() => {
        expect(mockToastInfo).not.toHaveBeenCalledWith('You are already signed in in another tab.');
      });

      sessionStorage.removeItem('sb_logout_in_progress');
    });

    it('should show cross-tab session message when another tab is signed in', async () => {
      localStorage.setItem('sb_auth_lock', JSON.stringify({ user_id: 'user-1', tab_id: 'tab-1', ts: Date.now() }));

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(/another tab is already signed in/i)).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Password visibility toggle', () => {
    it('should toggle password visibility on button click', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      const toggleButton = screen.getByLabelText(/show password/i);

      expect(passwordInput.type).toBe('password');

      await user.click(toggleButton);
      expect(passwordInput.type).toBe('text');

      await user.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    });

    it('should toggle aria-label between show and hide', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const toggleButton = screen.getByLabelText(/show password/i);
      expect(toggleButton.getAttribute('aria-label')).toBe('Show password');

      await user.click(toggleButton);
      expect(toggleButton.getAttribute('aria-label')).toBe('Hide password');

      await user.click(toggleButton);
      expect(toggleButton.getAttribute('aria-label')).toBe('Show password');
    });

    it('should have button type attribute', () => {
      renderWithRouter();

      const toggleButton = screen.getByLabelText(/show password/i);
      expect(toggleButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Email validation', () => {
    it('should show error when email is empty on blur', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      await user.click(emailInput);
      await user.tab();

      expect(screen.getByText('Email field is required')).toBeInTheDocument();
    });

    it('should show error when email format is invalid', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('should clear error when valid email entered', async () => {
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');

      fireEvent.change(emailInput, { target: { value: 'invalid' } });
      fireEvent.blur(emailInput);

      expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();

      fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
      });
    });

    it('should clear error on input change', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      await user.type(emailInput, 'invalid');
      await user.tab();

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();

      await user.type(emailInput, 'a');

      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
    });

    it('should accept valid email formats', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      await user.type(emailInput, 'user@example.com');
      await user.tab();

      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
    }, 10000);

    it('should accept valid email with subdomain', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      await user.type(emailInput, 'test.user@example.co.uk');
      await user.tab();

      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
    }, 10000);

    it('should accept valid email with plus addressing', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      await user.type(emailInput, 'user+tag@example.com');
      await user.tab();

      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
    }, 10000);

    it('should reject invalid email when missing domain', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      await user.type(emailInput, 'user@');
      await user.tab();

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('should reject invalid email when missing local part', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      await user.type(emailInput, '@example.com');
      await user.tab();

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('should reject invalid email when no at sign', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      await user.type(emailInput, 'user');
      await user.tab();

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('should reject invalid email with space before at sign', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      await user.type(emailInput, 'user @example.com');
      await user.tab();

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('should handle email with leading/trailing spaces', async () => {
      const user = userEvent.setup();
      mockApiLogin.mockResolvedValue({
        data: {
          user: { id: '1', email: 'user@example.com', email_verified: true },
          token: { access_token: 'valid-token' },
        },
      });
      mockAuthLogin.mockResolvedValue(undefined);

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, '  user@example.com  ');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockApiLogin).toHaveBeenCalledWith({
          email: 'user@example.com',
          password: 'password123',
        });
      });
    });
  });

  describe('Password validation', () => {
    it('should show error when password is empty on blur', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Password');
      await user.click(passwordInput);
      await user.tab();

      expect(screen.getByText('Password field is required')).toBeInTheDocument();
    });

    it('should clear error when password entered', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Password');
      await user.click(passwordInput);
      await user.tab();

      expect(screen.getByText('Password field is required')).toBeInTheDocument();

      await user.type(passwordInput, 'password123');

      expect(screen.queryByText('Password field is required')).not.toBeInTheDocument();
    });

    it('should clear error on input change', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Password');
      await user.click(passwordInput);
      await user.tab();

      expect(screen.getByText('Password field is required')).toBeInTheDocument();

      await user.type(passwordInput, 'a');

      expect(screen.queryByText('Password field is required')).not.toBeInTheDocument();
    });

    it('should handle password with only spaces', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, '   ');
      await user.click(submitButton);

      expect(screen.getByText('Password field is required')).toBeInTheDocument();
      expect(mockApiLogin).not.toHaveBeenCalled();
    });
  });

  describe('Form submission - validation', () => {
    it('should prevent submit when email is empty', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(screen.getByText('Email field is required')).toBeInTheDocument();
      expect(mockApiLogin).not.toHaveBeenCalled();
    });

    it('should prevent submit when password is empty', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.click(submitButton);

      expect(screen.getByText('Password field is required')).toBeInTheDocument();
      expect(mockApiLogin).not.toHaveBeenCalled();
    });

    it('should prevent submit when email is invalid', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      expect(mockApiLogin).not.toHaveBeenCalled();
    });

    it('should prevent submit when both fields are empty', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      expect(screen.getByText('Email field is required')).toBeInTheDocument();
      expect(screen.getByText('Password field is required')).toBeInTheDocument();
      expect(mockApiLogin).not.toHaveBeenCalled();
    });
  });

  describe('Form submission - verified user success', () => {
    it('should call apiLogin with trimmed email and password', async () => {
      const user = userEvent.setup();
      mockApiLogin.mockResolvedValue({
        data: {
          user: { id: '1', email: 'user@example.com', email_verified: true },
          token: { access_token: 'valid-token' },
        },
      });
      mockAuthLogin.mockResolvedValue(undefined);

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, '  user@example.com  ');
      await user.type(passwordInput, '  password123  ');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockApiLogin).toHaveBeenCalledWith({
          email: 'user@example.com',
          password: 'password123',
        });
      });
    });

    it('should call auth.login with user info on success', async () => {
      const user = userEvent.setup();
      const userInfo = { id: '1', email: 'user@example.com', email_verified: true };
      mockApiLogin.mockResolvedValue({
        data: {
          user: userInfo,
          token: { access_token: 'valid-token' },
        },
      });
      mockAuthLogin.mockResolvedValue(undefined);

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAuthLogin).toHaveBeenCalledWith(userInfo);
      });
    });

    it('should navigate to /homepage on successful login', async () => {
      const user = userEvent.setup();
      mockApiLogin.mockResolvedValue({
        data: {
          user: { id: '1', email: 'user@example.com', email_verified: true },
          token: { access_token: 'valid-token' },
        },
      });
      mockAuthLogin.mockResolvedValue(undefined);

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });
    });

    it('should clear validation errors on successful login', async () => {
      const user = userEvent.setup();
      mockApiLogin.mockResolvedValue({
        data: {
          user: { id: '1', email: 'user@example.com', email_verified: true },
          token: { access_token: 'valid-token' },
        },
      });
      mockAuthLogin.mockResolvedValue(undefined);

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Email field is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form submission - unverified user OTP flow', () => {
    it('should send OTP when user is not verified', async () => {
      const user = userEvent.setup();
      mockApiLogin.mockResolvedValue({
        data: {
          user: { id: '1', email: 'user@example.com', email_verified: false },
          token: { access_token: 'otp-token' },
        },
      });
      mockResendOtp.mockResolvedValue({ success: true });

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockResendOtp).toHaveBeenCalledWith({ token: 'otp-token' });
      });
    });

    it('should show success toast when OTP is sent', async () => {
      const user = userEvent.setup();
      mockApiLogin.mockResolvedValue({
        data: {
          user: { id: '1', email: 'user@example.com', email_verified: false },
          token: { access_token: 'otp-token' },
        },
      });
      mockResendOtp.mockResolvedValue({ success: true });

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith(
          'OTP sent to your email. Please check your inbox.'
        );
      });
    });

    it('should not call auth.login for unverified users', async () => {
      const user = userEvent.setup();
      mockApiLogin.mockResolvedValue({
        data: {
          user: { id: '1', email: 'user@example.com', email_verified: false },
          token: { access_token: 'otp-token' },
        },
      });
      mockResendOtp.mockResolvedValue({ success: true });

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAuthLogin).not.toHaveBeenCalled();
      });
    });

    it('should not navigate for unverified users', async () => {
      const user = userEvent.setup();
      mockApiLogin.mockResolvedValue({
        data: {
          user: { id: '1', email: 'user@example.com', email_verified: false },
          token: { access_token: 'otp-token' },
        },
      });
      mockResendOtp.mockResolvedValue({ success: true });

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it('should handle token.access_token format', async () => {
      const user = userEvent.setup();
      mockApiLogin.mockResolvedValue({
        data: {
          user: { id: '1', email: 'user@example.com', email_verified: false },
          token: { access_token: 'structured-token' },
        },
      });
      mockResendOtp.mockResolvedValue({ success: true });

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockResendOtp).toHaveBeenCalledWith({ token: 'structured-token' });
      });
    });

    it('should handle plain token string format', async () => {
      const user = userEvent.setup();
      mockApiLogin.mockResolvedValue({
        data: {
          user: { id: '1', email: 'user@example.com', email_verified: false },
          token: 'plain-token-string',
        },
      });
      mockResendOtp.mockResolvedValue({ success: true });

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockResendOtp).toHaveBeenCalledWith({ token: 'plain-token-string' });
      });
    });

    it('should handle OTP send failure gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const user = userEvent.setup();
      mockApiLogin.mockResolvedValue({
        data: {
          user: { id: '1', email: 'user@example.com', email_verified: false },
          token: { access_token: 'otp-token' },
        },
      });
      mockResendOtp.mockRejectedValue(new Error('OTP send failed'));

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith(
          'OTP sent to your email. Please check your inbox.'
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Error handling', () => {
    it('should display API error message', async () => {
      const user = userEvent.setup();
      mockApiLogin.mockRejectedValue(new Error('Invalid credentials'));

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    it('should display default error when API error has no message', async () => {
      const user = userEvent.setup();
      mockApiLogin.mockRejectedValue(new Error());

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument();
      });
    });

    it('should display error when response is null', async () => {
      const user = userEvent.setup();
      mockApiLogin.mockResolvedValue(null);

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid login response')).toBeInTheDocument();
      });
    });

    it('should display error when response.data is missing', async () => {
      const user = userEvent.setup();
      mockApiLogin.mockResolvedValue({});

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid login response')).toBeInTheDocument();
      });
    });

    it('should display error when token is missing for verified user', async () => {
      const user = userEvent.setup();
      mockApiLogin.mockResolvedValue({
        data: {
          user: { id: '1', email: 'user@example.com', email_verified: true },
          token: null,
        },
      });

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('No authentication token received')).toBeInTheDocument();
      });
    });

    it('should display error when token is missing for unverified user', async () => {
      const user = userEvent.setup();
      mockApiLogin.mockResolvedValue({
        data: {
          user: { id: '1', email: 'user@example.com', email_verified: false },
          token: null,
        },
      });

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Token not found in login response')).toBeInTheDocument();
      });
    });

    it('should display auth.login error', async () => {
      const user = userEvent.setup();
      mockApiLogin.mockResolvedValue({
        data: {
          user: { id: '1', email: 'user@example.com', email_verified: true },
          token: { access_token: 'valid-token' },
        },
      });
      mockAuthLogin.mockRejectedValue(new Error('Auth context error'));

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Auth context error')).toBeInTheDocument();
      });
    });

    it('should clear error on email input change', async () => {
      const user = userEvent.setup();
      mockApiLogin.mockRejectedValue(new Error('Login failed'));

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument();
      });

      await user.type(emailInput, 'a');

      expect(screen.queryByText('Login failed')).not.toBeInTheDocument();
    });

    it('should clear error on password input change', async () => {
      const user = userEvent.setup();
      mockApiLogin.mockRejectedValue(new Error('Login failed'));

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument();
      });

      await user.type(passwordInput, 'a');

      expect(screen.queryByText('Login failed')).not.toBeInTheDocument();
    });

    it('should clear error when retrying after failure', async () => {
      const user = userEvent.setup();
      mockApiLogin
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce({
          data: {
            user: { id: '1', email: 'user@example.com', email_verified: true },
            token: { access_token: 'valid-token' },
          },
        });
      mockAuthLogin.mockResolvedValue(undefined);

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // First attempt - fails
      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First attempt failed')).toBeInTheDocument();
      });

      // Second attempt - succeeds
      await user.clear(passwordInput);
      await user.type(passwordInput, 'correctpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('First attempt failed')).not.toBeInTheDocument();
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });
    });
  });

  describe('Button state', () => {
    it('should disable button while sending OTP', async () => {
      const user = userEvent.setup();
      let resendOtpResolve: () => void;
      const resendOtpPromise = new Promise<void>((resolve) => {
        resendOtpResolve = resolve;
      });

      mockApiLogin.mockResolvedValue({
        data: {
          user: { id: '1', email: 'user@example.com', email_verified: false },
          token: { access_token: 'otp-token' },
        },
      });
      mockResendOtp.mockReturnValue(resendOtpPromise);

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      resendOtpResolve!();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should show "Sending OTP..." text while sending', async () => {
      const user = userEvent.setup();
      let resendOtpResolve: () => void;
      const resendOtpPromise = new Promise<void>((resolve) => {
        resendOtpResolve = resolve;
      });

      mockApiLogin.mockResolvedValue({
        data: {
          user: { id: '1', email: 'user@example.com', email_verified: false },
          token: { access_token: 'otp-token' },
        },
      });
      mockResendOtp.mockReturnValue(resendOtpPromise);

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/sending otp/i)).toBeInTheDocument();
      });

      resendOtpResolve!();

      await waitFor(() => {
        expect(screen.getByText(/sign in/i)).toBeInTheDocument();
      });
    });

    it('should show "Sign in" text after OTP sending completes', async () => {
      const user = userEvent.setup();
      mockApiLogin.mockResolvedValue({
        data: {
          user: { id: '1', email: 'user@example.com', email_verified: false },
          token: { access_token: 'otp-token' },
        },
      });
      mockResendOtp.mockResolvedValue({ success: true });

      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/sign in/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form state persistence', () => {
    it('should handle rapid input changes', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;

      await user.type(emailInput, 'a');
      expect(emailInput.value).toBe('a');

      await user.type(emailInput, 'b');
      expect(emailInput.value).toBe('ab');

      await user.type(emailInput, 'c');
      expect(emailInput.value).toBe('abc');
    });

    it('should maintain form state across multiple interactions', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');

      expect(emailInput.value).toBe('user@example.com');
      expect(passwordInput.value).toBe('password123');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for fields', () => {
      renderWithRouter();

      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Password')).toBeInTheDocument();
    });

    it('should mark required fields', () => {
      renderWithRouter();

      const requiredMarkers = screen.getAllByText('*');
      expect(requiredMarkers.length).toBeGreaterThanOrEqual(2);
    });

    it('should have aria-label on password toggle', () => {
      renderWithRouter();

      const toggleButton = screen.getByLabelText(/show password/i);
      expect(toggleButton).toHaveAttribute('aria-label');
    });

    it('should have proper submit button type', () => {
      renderWithRouter();

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });
});
