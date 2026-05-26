// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
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

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
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
    <div
      className="grid grid-cols-1 md:grid-cols-2 h-[100dvh] min-h-[100dvh] overflow-hidden bg-white bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/assets/login-bg.svg)' }}
    >
      {/* Left Panel */}
      <div className="text-gray-100 flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Logo and Brand Name */}
          <div className="flex h-16 w-fit -ml-3 mb-8 items-center justify-center">
            <img
              src="/assets/login-logo.png"
              alt="Sereni Base Logo"
              className="w-full h-full scale-150 object-contain object-left"
            />
            <span className="font-semibold text-2xl leading-none text-[var(--color-text-gray)]">Sereni<br />base</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-100 text-left">Welcome back</h2>
          <p className="text-base lg:text-lg text-gray-200 leading-relaxed drop-shadow-md">Welcome back! Please enter your details.</p>
          {hasOtherSession && (
            <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
              Another tab is already signed in. Signing in here will sign out the other tab.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label htmlFor="email" className="field-component-label !text-gray-200">
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
                className={`w-full text-xs px-3 h-11 flex items-center rounded-lg text-black placeholder:text-[var(--color-text-placeholder)] border border-gray-700 outline-none cursor-pointer transition-all duration-200 focus:border focus:border-[--color-brand-600]
                  ${emailError ? "border-destructive bg-red-50" : ""}`}
                style={{ boxShadow: "var(--shadow-xs)" }}
              />
              {emailError && <div className="mt-1.5 text-red-500 text-sm">{emailError}</div>}
            </div>
            <div className="relative">
              <label htmlFor="password" className="field-component-label !text-gray-200">
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
                  className={`w-full text-xs px-3 h-11 flex items-center rounded-lg text-black placeholder:text-[var(--color-text-placeholder)] border border-gray-700 outline-none cursor-pointer transition-all duration-200 focus:border focus:border-[--color-brand-600]
                    ${passwordError ? "border-destructive bg-red-50" : ""}`}
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
              <Link to="/forgot-password" className="text-gray-400 hover:underline">Forgot password?</Link>
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
      <div className="hidden md:block relative h-full">
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* Grid table (back) */}
          <img
            src="/assets/grid-table.webp"
            alt="Grid table preview"
            className="absolute md:right-[2%] md:top-[16%] md:h-[30%] xl:right-[2%] xl:top-[7%] xl:h-[45%] w-auto max-w-none object-contain"
            draggable={false}
          />

          {/* GET request (middle) */}
          <img
            src="/assets/get-request.webp"
            alt="GET request preview"
            className="absolute md:right-[40%] md:top-[34%] md:h-[27%] xl:right-[40%] xl:top-[34%] xl:h-[45%] w-auto max-w-none object-contain"
            draggable={false}
          />

          {/* Methods (front) */}
          <img
            src="/assets/methods.webp"
            alt="API methods preview"
            className="absolute md:right-[-5%] md:bottom-[23%] md:h-[30%] xl:right-[-4%] xl:bottom-[6%] xl:h-[42%] w-auto max-w-none object-contain"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
};

export default LogIn;
