import React, { useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from '../auth/AuthContext';
import { isAuthenticated, login as apiLogin, resendOtp } from '../service/clientService';
import { useToast } from "../components/common/Toast";

declare global {
  interface ImportMeta {
    env: Record<string, string | undefined>;
  }
}

interface FormData {
  email: string;
  password: string;
}

const LogIn: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({ email: "", password: "" });
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [hasOtherSession, setHasOtherSession] = useState(false);
  const hasRedirectedRef = useRef(false);
  const hasNotifiedOtherSessionRef = useRef(false);
  const toast = useToast();
  const navigate = useNavigate();
  const auth = useAuth();
  const login = typeof auth?.login === 'function' ? auth.login : () => { };

  useEffect(() => {
    let isActive = true;
    const envTtl = Number(import.meta.env.VITE_CROSS_TAB_TTL_MS);
    const CROSS_TAB_TTL_MS = Number.isFinite(envTtl) && envTtl > 0 ? envTtl : 15 * 60 * 1000;
    const shouldSuppressCrossTab = () => {
      try {
        return sessionStorage.getItem('sb_logout_in_progress') === '1';
      } catch {
        return false;
      }
    };
    const markOtherSession = () => {
      setHasOtherSession(true);
      if (!hasNotifiedOtherSessionRef.current) {
        hasNotifiedOtherSessionRef.current = true;
      }
    };
    const clearOtherSession = () => {
      setHasOtherSession(false);
      hasNotifiedOtherSessionRef.current = false;
    };
    const AUTH_LOCK_KEY = 'sb_auth_lock';
    const parseCrossTabPayload = (raw: string | null) => {
      if (!raw) return { valid: false, userId: '' };
      try {
        const parsed = JSON.parse(raw);
        const ts = Number(parsed?.ts);
        const userId = String(parsed?.user_id || '');
        if (!Number.isFinite(ts)) return { valid: false, userId: '' };
        const isFresh = Date.now() - ts <= CROSS_TAB_TTL_MS;
        return { valid: isFresh, userId };
      } catch {
        return { valid: false, userId: '' };
      }
    };
    const readCrossTabAuth = () => {
      try {
        const raw = localStorage.getItem(AUTH_LOCK_KEY);
        const { valid } = parseCrossTabPayload(raw);
        if (!valid && raw) {
          localStorage.removeItem(AUTH_LOCK_KEY);
        }
        return valid ? raw : null;
      } catch {
        return null;
      }
    };
    const checkExistingSession = async () => {
      try {
        if (shouldSuppressCrossTab()) {
          return;
        }
        const alreadyAuthed = await isAuthenticated();
        if (!isActive || hasRedirectedRef.current) return;
        if (alreadyAuthed) {
          hasRedirectedRef.current = true;
          toast.info('You are already signed in. Redirecting...');
          navigate('/', { replace: true });
          return;
        }

        const crossTabFlag = readCrossTabAuth();
        if (crossTabFlag) {
          markOtherSession();
        } else {
          clearOtherSession();
        }
      } catch (error) {
        console.warn('LoginPage auth check failed:', error);
      }
    };

    checkExistingSession();
    const onStorage = (e: StorageEvent) => {
      if (e.key === AUTH_LOCK_KEY) {
        if (shouldSuppressCrossTab()) return;
        if (e.newValue) {
          const { valid } = parseCrossTabPayload(e.newValue);
          if (valid) {
            markOtherSession();
            return;
          }
          try { localStorage.removeItem(AUTH_LOCK_KEY); } catch { }
        }
        if (!e.newValue) {
          clearOtherSession();
        }
      }
    };
    globalThis.addEventListener('storage', onStorage);
    return () => {
      isActive = false;
      globalThis.removeEventListener('storage', onStorage);
    };
  }, [navigate, toast]);

  const validateEmail = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    if (/\s/.test(trimmed)) return false;

    const atIndex = trimmed.indexOf('@');
    if (atIndex <= 0) return false;
    if (trimmed.lastIndexOf('@') !== atIndex) return false;

    const local = trimmed.slice(0, atIndex);
    const domain = trimmed.slice(atIndex + 1);
    if (!local || !domain) return false;

    const dotIndex = domain.lastIndexOf('.');
    if (dotIndex <= 0 || dotIndex === domain.length - 1) return false;

    return true;
  };

  const handleSubmit = async (e:React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setEmailError(null);
    setPasswordError(null);
    try { sessionStorage.removeItem('sb_tab_locked'); } catch { }
    const { email, password } = formData;

    // Basic validation - only check if fields are filled
    // Password format/strength validation is handled by server during authentication
    let hasErrors = false;
    if (!email.trim()) {
      setEmailError("Email field is required");
      hasErrors = true;
    } else if (!validateEmail(email.trim())) {
      setEmailError("Please enter a valid email address");
      hasErrors = true;
    }
    if (!password.trim()) {
      setPasswordError("Password field is required");
      hasErrors = true;
    }
    if (hasErrors) return;
    try {
      const params = { email: email.trim(), password: password.trim() };
      const data = await apiLogin(params);

      if (!data?.data) {
        throw new Error("Invalid login response");
      }
      const userInfo = data.data.user || {};
      const token = data.data.token;

      if (!userInfo.email_verified) {
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

        // OTP sent successfully - user should check their email
        toast.success('OTP sent to your email. Please check your inbox.');
        return;
      }

      if (!token) {
        throw new Error("No authentication token received");
      }

      await login(userInfo);

      // NavigationResolver will handle navigation to saved view or first workspace
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.message || "Login failed");
    }
  };


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 h-screen overflow-hidden">
      {/* Left Panel */}
      <div className="bg-card text-tertiary flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Logo and Brand Name */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 border rounded-xl shadow-xs">
              <img
                src="/assets/logo.svg"
                alt="Sereni Base Logo"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <span className="text-xl font-semibold text-gray-900">Sereni Base</span>
          </div>

          <h2 className="text-3xl font-bold text-foreground text-left">Welcome back</h2>
          <p className="text-base lg:text-lg text-white/90 leading-relaxed drop-shadow-md">Welcome back! Please enter your details.</p>
          {hasOtherSession && (
            <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
              Another tab is already signed in. Signing in here will sign out the other tab.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label htmlFor="email" className="field-component-label">
                Email<span className="field-component-required">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => {
                  setFormData(prev => ({ ...prev, email: e.target.value }));
                  if (emailError) setEmailError(null);
                  if (error) setError("");
                }}
                onBlur={() => {
                  if (formData.email.trim()) {
                    if (validateEmail(formData.email.trim())) {
                      setEmailError(null);
                    } else {
                      setEmailError("Please enter a valid email address");
                    }
                  } else {
                    setEmailError("Email field is required");
                  }
                }}
                placeholder="Email"
                className={`field-component field-component-border field-component-focus ${emailError ? "border-destructive bg-red-50" : ""}`}
                style={{ boxShadow: "var(--shadow-xs)" }}
              />
              {emailError && <div className="mt-1.5 text-red-500 text-sm">{emailError}</div>}
            </div>
            <div className="relative">
              <label htmlFor="password" className="field-component-label">
                Password<span className="field-component-required">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, password: e.target.value }));
                    if (passwordError) setPasswordError(null);
                    if (error) setError("");
                  }}
                  onBlur={() => {
                    if (formData.password.trim()) {
                      setPasswordError(null);
                    } else {
                      setPasswordError("Password field is required");
                    }
                  }}
                  placeholder="Password"
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
                      <Eye className="w-4 h-4 text-gray-500" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              {passwordError && <div className="mt-1.5 text-red-500 text-sm">{passwordError}</div>}
            </div>
            <div className="flex items-center justify-between text-sm">
              <Link to="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
            </div>
            <button
              type="submit"
              disabled={isSendingOtp}
              className="w-full btn-primary py-2 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
              {isSendingOtp ? 'Sending OTP...' : 'Sign in'}
            </button>
              {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          </form>
        </div>
      </div>


      {/* Right Panel */}
      <div className="hidden md:block relative overflow-hidden h-full bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/assets/login-bg.png)' }}>
        <div className="absolute inset-0 bg-black/5"></div>

        {/* Content Container - Text and Image */}
        <div className="relative z-10 flex flex-col h-full pt-12 md:pt-16 lg:pt-20 xl:pt-24 overflow-hidden">
          {/* Promotional Text - Top Left, Consistent Alignment */}
          <div className="pl-8 md:pl-12 lg:pl-16 xl:pl-20 pr-8 md:pr-12 lg:pr-16 mb-10 md:mb-14 lg:mb-16 xl:mb-20">
            <div className="space-y-4 text-left max-w-xl lg:max-w-2xl">
              <h1 className="text-3xl lg:text-4xl xl:text-4xl 2xl:text-6xl font-bold text-black leading-tight">Build powerful databases with ease.</h1>
              <p className="text-base lg:text-lg xl:text-xl text-black leading-relaxed">Create, manage, and collaborate on databases with our intuitive platform. Organize your data, build custom views, and scale your applications effortlessly.</p>
            </div>
          </div>

          {/* Calendar View Image - Below Text, Same Left Alignment, Extending Outside (Right Only) */}
          <div className="pl-8 md:pl-12 lg:pl-16 xl:pl-20 flex-1 min-h-0 overflow-hidden">
            <div className="bg-white rounded-tl-2xl shadow-2xl overflow-hidden w-[115%] lg:w-[120%] xl:w-[125%] 2xl:w-[130%] h-full">
              <img
                src="/assets/login-image.png"
                alt="Calendar View Preview"
                className="w-full h-full object-cover object-left-top"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogIn;
