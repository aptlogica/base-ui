import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, CheckCircle, Info, HelpCircle } from "lucide-react";
import { resetPassword } from "../service/clientService";
import { validatePasswordStrength } from "../utils/validation";

const ResetPasswordPage: React.FC = () => {
  const { token: tokenParam } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const tokenFromQuery = searchParams.get('token');
  // Support both path parameter (:token) and query parameter (?token=...)
  const token = tokenParam || tokenFromQuery;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (e:React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setPasswordError(null);
    setConfirmPasswordError(null);

    const trimmedPassword = formData.password.trim();
    if (trimmedPassword.length === 0) {
      setPasswordError("This field is required");
      return;
    }

    const trimmedConfirmPassword = formData.confirmPassword.trim();
    if (trimmedConfirmPassword.length === 0) {
      setConfirmPasswordError("This field is required");
      return;
    }

    // Use validatePasswordStrength (no user data available for reset password)
    const passwordValidation = validatePasswordStrength(formData.password, '', '', '');
    if (passwordValidation.isValid === false) {
      setPasswordError(passwordValidation.errorMessage || "Password doesn't meet requirements");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({ 
        token: token, 
        new_password: formData.password 
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? String(err.message) 
        : 'Failed to reset password';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-lg border w-full bg-card rounded-2xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Password Reset Successful!</h1>
          <p className="text-gray-600 mb-6">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
          <Link 
            to="/login" 
            className="w-full btn-primary py-2 rounded-md transition inline-block text-center"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg border w-full bg-card rounded-2xl shadow-md p-8">
        <div className="mb-6">
          <Link 
            to="/login" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Your Password</h1>
          <p className="text-gray-600">
            Enter your new password below. Make sure it's secure and easy to remember.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label htmlFor="reset-password-new" className="field-component-label">
              New Password{' '}
              <span className="field-component-required">*</span>
            </label>
            <div className="relative">
              <input
                id="reset-password-new"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, password: e.target.value }));
                  if (passwordError) setPasswordError(null);
                  if (error) setError("");
                }}
                onBlur={() => {
                  const trimmedPassword = formData.password.trim();
                  if (trimmedPassword.length === 0) {
                    setPasswordError("This field is required");
                  } else {
                    const validation = validatePasswordStrength(formData.password, '', '', '');
                    if (validation.isValid === false) {
                      setPasswordError(validation.errorMessage || "Password doesn't meet requirements");
                    } else {
                      setPasswordError(null);
                    }
                  }
                }}
                placeholder="Enter your new password"
                className={`field-component field-component-border field-component-focus placeholder-[var(--color-text-placeholder)] ${passwordError ? "border-destructive bg-red-50" : ""} shadow-[var(--shadow-xs)]`}
                style={{ boxShadow: "var(--shadow-xs)" }}
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 flex items-center gap-2">
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(prev => !prev)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
                <div className="relative group">
                  <HelpCircle className={`w-4 h-4 ${passwordError ? "text-red-400" : "text-gray-400"} cursor-help`} />
                  <div className="invisible group-hover:visible group-focus-within:visible absolute left-0 mt-1 w-72 bg-card border rounded-xl shadow-lg p-4 text-sm z-50">
                    <h4 className="font-medium mb-2 text-primary">Password Requirements:</h4>
                    <ul className="space-y-1">
                      {(() => {
                        const validation = validatePasswordStrength(formData.password, '', '', '');
                        const hasPassword = formData.password && formData.password.trim().length > 0;
                        return (
                          <>
                            <li className={`flex items-center ${validation.hasLength ? 'text-green-600' : 'text-red-500'}`}>
                              • Minimum 8 characters
                            </li>
                            <li className={`flex items-center ${validation.hasUpper ? 'text-green-600' : 'text-red-500'}`}>
                              • At least one uppercase letter
                            </li>
                            <li className={`flex items-center ${validation.hasLower ? 'text-green-600' : 'text-red-500'}`}>
                              • At least one lowercase letter
                            </li>
                            <li className={`flex items-center ${validation.hasNumber ? 'text-green-600' : 'text-red-500'}`}>
                              • At least one number
                            </li>
                            <li className={`flex items-center ${validation.hasSymbol ? 'text-green-600' : 'text-red-500'}`}>
                              • At least one symbol
                            </li>
                            <li className={`flex items-center ${hasPassword && validation.containsNameAndEmail ? 'text-green-600' : 'text-red-500'}`}>
                              • Should not contain your name or email
                            </li>
                            <li className={`flex items-center ${hasPassword && validation.containsCommon ? 'text-green-600' : 'text-red-500'}`}>
                              • Password Should not contain common words
                            </li>
                          </>
                        );
                      })()}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            {formData.password && (() => {
              const validation = validatePasswordStrength(formData.password, '', '', '');
              return (
                <div className="mt-2 px-1.5 flex gap-1">
                  <div className={`h-0.5 flex-1 rounded transition-colors duration-200 ${validation.strength >= 1 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                  <div className={`h-0.5 flex-1 rounded transition-colors duration-200 ${validation.strength >= 3 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
                  <div className={`h-0.5 flex-1 rounded transition-colors duration-200 ${validation.strength >= 5 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
                  <div className={`h-0.5 flex-1 rounded transition-colors duration-200 ${validation.strength === 7 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                </div>
              );
            })()}
            {passwordError && <div className="mt-1.5 text-red-500 text-sm">{passwordError}</div>}
          </div>

          <div className="relative">
            <label htmlFor="reset-password-confirm" className="field-component-label">
              Confirm New Password{' '}
              <span className="field-component-required">*</span>
            </label>
            <div className="relative">
              <input
                id="reset-password-confirm"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, confirmPassword: e.target.value }));
                  if (confirmPasswordError) setConfirmPasswordError(null);
                  if (error) setError("");
                }}
                onBlur={() => {
                  const trimmedConfirm = formData.confirmPassword.trim();
                  if (trimmedConfirm.length === 0) {
                    setConfirmPasswordError("This field is required");
                  } else {
                    const passwordsMatch = formData.password === formData.confirmPassword;
                    if (passwordsMatch === false) {
                      setConfirmPasswordError("Passwords do not match");
                    } else {
                      setConfirmPasswordError(null);
                    }
                  }
                }}
                placeholder="Confirm your new password"
                className={`field-component field-component-border field-component-focus placeholder-[var(--color-text-placeholder)] ${confirmPasswordError ? "border-destructive bg-red-50" : ""} shadow-[var(--shadow-xs)]`}
                style={{ boxShadow: "var(--shadow-xs)" }}
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 flex items-center gap-2">
                <button
                  type="button"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            {confirmPasswordError && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <Info className="w-4 h-4 text-red-400" />
              </div>
            )}
            {confirmPasswordError && <div className="mt-1.5 text-red-500 text-sm">{confirmPasswordError}</div>}
          </div>

          {error && (
            <div className="text-destructive text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={(() => {
              const trimmedPassword = formData.password.trim();
              const trimmedConfirm = formData.confirmPassword.trim();
              const passwordValidation = validatePasswordStrength(formData.password, '', '', '');
              return isLoading ||
                trimmedPassword.length === 0 ||
                trimmedConfirm.length === 0 ||
                formData.password !== formData.confirmPassword ||
                passwordValidation.isValid === false ||
                passwordError !== null ||
                confirmPasswordError !== null;
            })()}
            className="w-full btn-primary py-2 px-4 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
