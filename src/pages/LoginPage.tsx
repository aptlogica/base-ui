import React, { useState } from "react";
import { Info, Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from '../auth/AuthContext';
import formText from '../config/formText';
import { login as apiLogin, resendOtp } from '../service/clientService';
import { useToast } from "../components/common/Toast";

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
  const toast = useToast();
  const navigate = useNavigate();
  const auth = useAuth();
  const login = typeof auth?.login === 'function' ? auth.login : () => { };

  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

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

        // OTP sent successfully - user should check their email
        toast.success('OTP sent to your email. Please check your inbox.');
        return;
      }

      if (!token) {
        throw new Error("No authentication token received");
      }

      await login(userInfo);

      // Navigate to homepage - NavigationResolver will resolve and navigate to saved view BEFORE homepage renders
      // If no saved view, NavigationResolver will auto-select first workspace/base/table/view
      navigate('/homepage', { replace: true });
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
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 border rounded-lg shadow-xs">
              <img 
                src="/assets/logo.svg" 
                alt="Sereni Base Logo" 
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <span className="text-xl font-semibold text-gray-900">Sereni Base</span>
          </div>
          
          <h2 className="text-3xl font-bold text-foreground text-left">Welcome back</h2>
          <p className="text-base lg:text-lg text-white/90 leading-relaxed drop-shadow-md">{formText.login.description2}</p>
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
              <h1 className="text-3xl lg:text-4xl xl:text-4xl 2xl:text-6xl font-bold text-black leading-tight">{formText.login.subtitle}</h1>
              <p className="text-base lg:text-lg xl:text-xl text-black leading-relaxed">{formText.login.description3}</p>
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
