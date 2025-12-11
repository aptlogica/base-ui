import React, { useState, useEffect, useCallback } from "react";
import { Info, Eye, EyeOff } from "lucide-react";
import { validateLogin } from "../utils/validation";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from '../auth/AuthContext';
import formText from '../config/formText';
import { login as apiLogin, resendOtp, loginByIdentityProvider } from '../service/clientService';
import { processOAuthResponse, clearOAuthSession } from '../utils/oauthUtils';

interface FormData {
  email: string;
  password: string;
}

const LogIn: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<{ google: boolean; github: boolean }>({ google: false, github: false });
  const navigate = useNavigate();
  const auth = useAuth();
  const login = typeof auth?.login === 'function' ? auth.login : () => { };

  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  // Process OAuth data from popup using shared utility
  const processOAuthData = useCallback(async (data: { token: any; user: any; tenant: any }) => {
    try {
      const { userWithTenant } = await processOAuthResponse(data);

      // Update auth context
      await login(userWithTenant);

      // Small delay for state propagation
      await new Promise(resolve => setTimeout(resolve, 50));

      // Clear OAuth sessionStorage
      clearOAuthSession();

      // Navigate to workspace
      navigate('/workspace', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Failed to complete OAuth login');
      throw err;
    }
  }, [login, navigate]);

  // Listen for messages from OAuth popup
  useEffect(() => {
    const messageListener = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'OAUTH_SUCCESS') {
        setIsOAuthLoading({ google: false, github: false });
        processOAuthData(event.data.data).catch((err: any) => {
          setError(err?.message || 'Failed to complete OAuth login');
        });
      } else if (event.data.type === 'OAUTH_ERROR') {
        setIsOAuthLoading({ google: false, github: false });
        setError(event.data.error || 'OAuth authentication failed');
      }
    };

    window.addEventListener('message', messageListener);
    
    return () => {
      window.removeEventListener('message', messageListener);
    };
  }, [processOAuthData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError(null);
    setPasswordError(null);
    const { email, password } = formData;

    // Basic validation - only check if fields are filled
    // Password format/strength validation is handled by server during authentication
    let hasErrors = false;
    if (!email.trim()) {
      setEmailError("This field is required");
      hasErrors = true;
    } else if (!validateEmail(email.trim())) {
      setEmailError("Please enter a valid email address");
      hasErrors = true;
    }
    if (!password.trim()) {
      setPasswordError("This field is required");
      hasErrors = true;
    }
    if (hasErrors) return;
    try {
      const params = { email: email.trim(), password: password.trim() };
      const data = await apiLogin(params);

      if (!data || !data.data) {
        throw new Error("Invalid login response");
      }
      const userInfo = data.data.user || {};
      const token = data.data.token;

      if (!userInfo.email_verified) {
        // For unverified users, we need a token to verify OTP
        // The login response should include a token that can be used for OTP verification
        const verificationToken = token?.access_token || token;
        
        if (!verificationToken) {
          throw new Error("Token not found in login response");
        }

        try {
          setIsSendingOtp(true);
          await resendOtp({ token: verificationToken });
        } catch (otpError) {
          console.error("Failed to send OTP:", otpError);
        } finally {
          setIsSendingOtp(false);
        }

        navigate('/registervalidation', {
          state: {
            email: userInfo.email,
            token: verificationToken,
            fromLogin: true
          }
        });
        return;
      }

      if (!token) {
        throw new Error("No authentication token received");
      }

      await login(userInfo);

      // Navigate to workspace - NavigationResolver will resolve and navigate to saved view BEFORE workspace renders
      // If no saved view, NavigationResolver will auto-select first workspace/base/table/view
      navigate('/workspace', { replace: true });
    } catch (err: any) {
      setError(err?.message || "Login failed");
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      setIsOAuthLoading(prev => ({ ...prev, [provider]: true }));
      setError('');

      await loginByIdentityProvider(provider);

      // Note: With popup mode, the promise resolves when popup closes
      // The actual login processing happens via postMessage listener above
    } catch (err: any) {
      const errorMessage = err?.message || `${provider === 'google' ? 'Google' : 'GitHub'} login failed. Please try again.`;

      if (err?.message?.includes('Popup blocked')) {
        setError('Popup blocked. Please allow popups for this site to sign in.');
      } else {
        setError(errorMessage);
      }

      setIsOAuthLoading(prev => ({ ...prev, [provider]: false }));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      {/* Left Panel */}
      <div className="bg-blue-600 text-white flex items-center justify-center p-8 md:p-16">
        <div className="max-w-md space-y-6">
          <h1 className="text-4xl lg:text-5xl font-bold">{formText.login.subtitle}</h1>
          <p className="text-base lg:text-lg text-blue-100">{formText.login.description}</p>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              <img className="w-10 h-10 rounded-full border-2 border-white" src="https://randomuser.me/api/portraits/men/1.jpg" alt="User 1" />
              <img className="w-10 h-10 rounded-full border-2 border-white" src="https://randomuser.me/api/portraits/women/2.jpg" alt="User 2" />
              <img className="w-10 h-10 rounded-full border-2 border-white" src="https://randomuser.me/api/portraits/men/3.jpg" alt="User 3" />
            </div>
            <span className="text-white text-sm">Trusted by <strong>10,000+</strong> developers worldwide</span>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="bg-card text-tertiary flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-md space-y-6">
          <h2 className="text-3xl font-bold text-foreground text-left">Welcome back</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => handleOAuthLogin('google')}
              disabled={isOAuthLoading.google || isOAuthLoading.github}
              className="w-1/2 flex items-center justify-center border rounded-lg text-[var(--color-text-primary)] py-2 transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="-3 0 262 262" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" fill="#000000"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"></path><path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"></path><path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"></path><path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335"></path></g></svg>
              {isOAuthLoading.google ? 'Connecting...' : formText.login.google}
            </button>
            <button
              onClick={() => handleOAuthLogin('github')}
              disabled={isOAuthLoading.google || isOAuthLoading.github}
              className="w-1/2 flex items-center justify-center border rounded-lg text-[var(--color-text-primary)] py-2 transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill="#161514" fillRule="evenodd" d="M8 1C4.133 1 1 4.13 1 7.993c0 3.09 2.006 5.71 4.787 6.635.35.064.478-.152.478-.337 0-.166-.006-.606-.01-1.19-1.947.423-2.357-.937-2.357-.937-.319-.808-.778-1.023-.778-1.023-.635-.434.048-.425.048-.425.703.05 1.073.72 1.073.72.624 1.07 1.638.76 2.037.582.063-.452.244-.76.444-.935-1.554-.176-3.188-.776-3.188-3.456 0-.763.273-1.388.72-1.876-.072-.177-.312-.888.07-1.85 0 0 .586-.189 1.924.716A6.711 6.711 0 018 4.381c.595.003 1.194.08 1.753.236 1.336-.905 1.923-.717 1.923-.717.382.963.142 1.674.07 1.85.448.49.72 1.114.72 1.877 0 2.686-1.638 3.278-3.197 3.45.251.216.475.643.475 1.296 0 .934-.009 1.688-.009 1.918 0 .187.127.404.482.336A6.996 6.996 0 0015 7.993 6.997 6.997 0 008 1z" clipRule="evenodd"></path></g></svg>
              {isOAuthLoading.github ? 'Connecting...' : formText.login.github}
            </button>
          </div>
          <div className="flex items-center space-x-2 text-muted-foreground">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm">{formText.login.or}</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label className="field-component-label">Email
                <span className="field-component-required">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => { setFormData(prev => ({ ...prev, email: e.target.value })); if (emailError) setEmailError(null); if (error) setError(""); }}
                onBlur={() => {
                  if (!formData.email.trim()) setEmailError("This field is required");
                  else if (!validateEmail(formData.email.trim())) setEmailError("Please enter a valid email address");
                  else setEmailError(null);
                }}
                placeholder={formText.login.emailPlaceholder}
                className={`field-component field-component-border field-component-focus ${emailError ? "border-destructive bg-red-50" : ""}`}
                style={{ boxShadow: "var(--shadow-xs)" }}
              />
              {emailError && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <Info className="w-4 h-4 text-red-400" />
                </div>
              )}
              {emailError && <div className="mt-1.5 text-red-500 text-sm">{emailError}</div>}
            </div>
            <div className="relative">
              <label className="field-component-label">Password
                <span className="field-component-required">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={e => { setFormData(prev => ({ ...prev, password: e.target.value })); if (passwordError) setPasswordError(null); if (error) setError(""); }}
                  onBlur={() => {
                    if (!formData.password.trim()) {
                      setPasswordError("This field is required");
                    } else {
                      setPasswordError(null);
                    }
                  }}
                  placeholder={formText.login.passwordPlaceholder}
                  className={`field-component field-component-border field-component-focus ${passwordError ? "border-destructive bg-red-50" : ""}`}
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
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              {passwordError && <div className="mt-1.5 text-red-500 text-sm">{passwordError}</div>}
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="checkbox-primary-brand"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-primary hover:underline">{formText.login.forgotPassword}</Link>
            </div>
            {error && <div className="text-destructive text-sm text-center">{error}</div>}
            <button
              type="submit"
              disabled={isSendingOtp}
              className="w-full btn-primary py-2 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingOtp ? 'Sending OTP...' : formText.login.signIn}
            </button>
          </form>
          <div className="text-sm text-center text-[var(--color-text-primary-brand)]">
            {formText.login.signupPrompt}{' '}
            <Link to="/register" className="text-primary-brand hover:underline">{formText.login.signupLink}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogIn;
