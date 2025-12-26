import { useRef, useState, useEffect } from "react";
import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyOtp, resendOtp } from "../service/clientService";
import { useAuth } from "../auth/AuthContext";
import { decodeJwt } from 'jose';

interface OtpValidationProps {
  length?: number;
  email?: string;
  // userId?: string;
}

const OtpValidation: React.FC<OtpValidationProps> = ({
  length = 4,
  email: emailProp,
  // userId: userIdProp
}) => {
  const [initOtp, setInitOtp] = useState<string[]>(Array(length).fill(""));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const navigate = useNavigate();
  const location = useLocation();
  const email = emailProp || location.state?.email;
  const token = location.state?.token; // Token from registration/login response
  const fromLogin = location.state?.fromLogin || false;
  const auth = useAuth();
  const login =
    auth && typeof auth.login === "function" ? auth.login : () => { };

  // Redirect to registration/login if required state is missing (only on mount, not on every state change)
  useEffect(() => {
    // Token is required for both registration and login flows
    if (!emailProp) {
      if (!location.state?.email && !email) {
        navigate(fromLogin ? '/login' : '/register', { replace: true });
        return;
      }
      // Token is required
      if (!location.state?.token && !token) {
        navigate(fromLogin ? '/login' : '/register', { replace: true });
        return;
      }
    }
  }, []); // Only run once on mount

  // Helper function to process OTP verification response and store token
  const processOtpVerificationResponse = async (data: any) => {
    if (data.data && data.data.token) {
      const token = data.data.token;
      const userInfo = data.data.user || {};

      // Process token similar to login service
      if (token.access_token) {
        try {
          // Decode tokens to get expiry times
          const accessDecoded = decodeJwt(token.access_token);
          const refreshDecoded = token.refresh_token ? decodeJwt(token.refresh_token) : null;

          // Store tokens securely using the same method as login
          const tokenData = {
            access_token: token.access_token,
            refresh_token: token.refresh_token || '',
            expires_at: accessDecoded?.exp as number,
            refresh_expires_at: refreshDecoded?.exp as number
          };

          const obfuscate = (data: string): string => {
            return btoa(data).split('').reverse().join('');
          };

          // Use the same storage keys as login
          sessionStorage.setItem('_st_', obfuscate(tokenData.access_token));
          if (tokenData.refresh_token) {
            sessionStorage.setItem('_rt_', obfuscate(tokenData.refresh_token));
          }
          if (tokenData.expires_at) {
            sessionStorage.setItem('_te_', tokenData.expires_at.toString()); // Use _te_ not _st_exp
          }
          if (tokenData.refresh_expires_at) {
            sessionStorage.setItem('_rte_', tokenData.refresh_expires_at.toString()); // Use _rte_ not _rt_exp
          }

          // Update client token and schema for API calls (must be done synchronously)
          const { updateClientToken, updateClientSchema } = await import('../service/clientService');
          updateClientToken(token.access_token);

          // Store only minimal user info in sessionStorage (for instant UI render)
          if (userInfo.id) {
            sessionStorage.setItem('user_id', userInfo.id);
            if (userInfo.email) {
              sessionStorage.setItem('user_email', userInfo.email);
            }
            if (userInfo.display_name) {
              sessionStorage.setItem('user_display_name', userInfo.display_name);
            }
            if (userInfo.avatar) {
              sessionStorage.setItem('user_avatar', userInfo.avatar);
            }
            if (userInfo.timezone) {
              sessionStorage.setItem('timezone', userInfo.timezone);
            }
            if (userInfo.country) {
              sessionStorage.setItem('country', userInfo.country);
            }
          }

          // Store role from decoded token (single string, not array)
          if (accessDecoded?.roles) {
            const role = typeof accessDecoded.roles === 'string' 
              ? accessDecoded.roles 
              : (Array.isArray(accessDecoded.roles) ? accessDecoded.roles[0] : null);
            
            if (role) {
              sessionStorage.setItem('user_role', role);
              // Also store full token data for reference
              sessionStorage.setItem('user_token_data', JSON.stringify({
                user_id: accessDecoded.user_id,
                email: accessDecoded.email,
                roles: role,
                email_verified: accessDecoded.email_verified,
              }));
            }
          }

          // Extract tenant_schema from decoded access token
          const schemaName = String(accessDecoded?.tenant_id ||
            accessDecoded?.tenant_schema ||
            accessDecoded?.schema ||
            accessDecoded?.schema_name ||
            accessDecoded?.tenantSchema ||
            '').trim();

          if (schemaName) {
            sessionStorage.setItem('tenant_schema', schemaName);
            // Keep in localStorage as fallback only
            localStorage.setItem('tenant_schema', schemaName);
            // Update client schema header for API calls
            updateClientSchema(schemaName);
          }

          return true;
        } catch (error) {
          return false;
        }
      }
    }
    return false;
  };

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, [length]);

  useEffect(() => {
    // Only auto-verify if all digits are filled and not already verifying
    if (initOtp.every((digit) => digit !== "") && !isVerifying) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initOtp]); // Only trigger when OTP changes, handleVerify is stable

  // Cooldown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    // Prevent changes during verification
    if (isVerifying) return;

    if (/^\d?$/.test(value)) {
      const updatedOtp = [...initOtp];
      updatedOtp[index] = value;
      setInitOtp(updatedOtp);

      if (value && index < length - 1) {
        inputsRef.current[index + 1]?.focus();
      }
    }
  };

  const handleResendOtp = async () => {
    if (isResending || resendCooldown > 0) return;

    setIsResending(true);
    setError(null);

    try {
      // Token is required for both registration and login flows
      if (!token) {
        setError("Missing required authentication information. Please try again.");
        setIsResending(false);
        return;
      }

      const params = { token };
      const response = await resendOtp(params);

      if (response.success) {
        setError(null);
        // Set cooldown for 60 seconds
        setResendCooldown(60);
        // Clear the OTP inputs
        setInitOtp(Array(length).fill(""));
        inputsRef.current[0]?.focus();
      } else {
        setError(response.message || "Failed to resend OTP. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async () => {
    // Prevent multiple verification attempts
    if (isVerifying) return;

    const otp = initOtp.join("");

    // Token is required for both registration and login flows
    if (!token) {
      setError("Missing required authentication information. Please try again.");
      return;
    }

    setIsVerifying(true);
    setError(null);
    try {
      const params = { token, otp };
      const data = await verifyOtp(params);
      if (data.data && data.data.token) {
        setError(null);

        // Process the verification response and store token properly
        const tokenStored = await processOtpVerificationResponse(data);

        if (tokenStored) {
          // Get user info from the verification response
          const userInfo = data.data.user || {};

          // Update AuthContext with user info
          await login(userInfo);

          // Navigate to homepage - NavigationResolver will resolve and navigate to saved view BEFORE homepage renders
          // If no saved view, NavigationResolver will auto-select first workspace/base/table/view
          navigate('/homepage', { replace: true });
        } else {
          setError("Failed to process authentication. Please try again.");
          setInitOtp(Array(length).fill(""));
          inputsRef.current[0]?.focus();
        }
      } else {
        setError(data.error || "OTP verification failed.");
        setInitOtp(Array(length).fill(""));
        inputsRef.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err.message || "OTP verification failed.");
      setInitOtp(Array(length).fill(""));
      inputsRef.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && initOtp[index] === "" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("Text").trim();
    const digits = pasteData.replace(/\D/g, "").slice(0, length).split("");

    if (digits.length > 0) {
      const newOtp = [...initOtp];
      for (let i = 0; i < digits.length; i++) {
        newOtp[i] = digits[i];
        if (inputsRef.current[i]) {
          inputsRef.current[i]!.value = digits[i];
        }
      }
      setInitOtp(newOtp);
      const nextIndex = digits.length < length ? digits.length : length - 1;
      inputsRef.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-card p-8 rounded-xl shadow-md w-full max-w-xl text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {fromLogin ? 'Email Verification Required' : 'OTP Verification'}
        </h2>
        <p className="text-gray-600 mb-2">
          {fromLogin
            ? 'Please verify your email address to complete the login process.'
            : `Enter the ${length}-digit verification code that was sent to your email.`
          }
        </p>
        {email && (
          <p className="text-sm text-gray-500 mb-6 font-medium">
            Code sent to: <span className="text-primary">{email}</span>
          </p>
        )}

        <div className="flex justify-center gap-3 mb-6">
          {initOtp.map((digit, index) => (
            <input
              key={index}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={index === 0 ? handlePaste : undefined}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              disabled={isVerifying}
              className={`w-12 h-12 border rounded-xl max-h text-center text-xl font-semibold text-[var(--color-text-primary)] bg-[--color-alpha-white] focus:border-[var(--color-bg-brand-primary)] transition-colors focus:outline-none ${isVerifying ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            />
          ))}
        </div>

        {/* Loading indicator during verification */}
        {isVerifying && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">Verifying code...</span>
          </div>
        )}

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Didn't receive code?{" "}
            <button
              onClick={handleResendOtp}
              disabled={isResending || resendCooldown > 0 || isVerifying}
              className={`${isResending || resendCooldown > 0 || isVerifying
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-[var(--color-text-primary-brand)] hover:underline'
                }`}
            >
              {isResending ? 'Sending...' :
                resendCooldown > 0 ? `Resend (${resendCooldown}s)` :
                  'Resend'
              }
            </button>
          </p>

          {fromLogin && (
            <p className="text-sm text-gray-600">
              Wrong email?{" "}
              <button
                onClick={() => navigate('/login')}
                className="text-[var(--color-text-primary-brand)] hover:underline"
              >
                Back to Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OtpValidation;
