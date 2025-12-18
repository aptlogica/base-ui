import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, Info } from "lucide-react";
import { resetPassword } from "../service/clientService";

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

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPasswordError(null);
    setConfirmPasswordError(null);

    if (!formData.password.trim()) {
      setPasswordError("This field is required");
      return;
    }

    if (!formData.confirmPassword.trim()) {
      setConfirmPasswordError("This field is required");
      return;
    }

    const passwordValidationError = validatePassword(formData.password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
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
    } catch (err: any) {
      setError(err?.message || "Failed to reset password");
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
            <label className="field-component-label">
              New Password
              <span className="field-component-required">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, password: e.target.value }));
                  if (passwordError) setPasswordError(null);
                  if (error) setError("");
                }}
                onBlur={() => {
                  if (!formData.password.trim()) setPasswordError("This field is required");
                  else {
                    const validationError = validatePassword(formData.password);
                    if (validationError) setPasswordError(validationError);
                    else setPasswordError(null);
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
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            {passwordError && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <Info className="w-4 h-4 text-red-400" />
              </div>
            )}
            {passwordError && <div className="mt-1.5 text-red-500 text-sm">{passwordError}</div>}
          </div>

          <div className="relative">
            <label className="field-component-label">
              Confirm New Password
              <span className="field-component-required">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, confirmPassword: e.target.value }));
                  if (confirmPasswordError) setConfirmPasswordError(null);
                  if (error) setError("");
                }}
                onBlur={() => {
                  if (!formData.confirmPassword.trim()) setConfirmPasswordError("This field is required");
                  else if (formData.confirmPassword !== formData.password) setConfirmPasswordError("Passwords do not match");
                  else setConfirmPasswordError(null);
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
            disabled={isLoading}
            className="w-full btn-primary py-2 px-4 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
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
