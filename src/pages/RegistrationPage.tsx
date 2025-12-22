import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Info, Eye, EyeOff, HelpCircle } from "lucide-react";
import { validateRegistration, validatePasswordStrength } from "../utils/validation";
import formText from '../config/formText';
import { register as apiRegister, loginByIdentityProvider } from '../service/clientService';
import { RegisterParams } from '../types/interfaces/auth';
import TermsAndConditionsModal from '../components/modals/TermsAndConditionsModal';
import PrivacyPolicyModal from '../components/modals/PrivacyPolicyModal';
import { useAuth } from '../auth/AuthContext';
import { processOAuthResponse, clearOAuthSession } from '../utils/oauthUtils';
import { DateField } from '../components/common/Fields/DateField';
import { DateTime } from '../components/common/Fields/DateTime';
import { timeZoneOptions } from '../types/constants';
import { AdvancedDropdown } from '../components/common/dropdown/AdvancedDropdown';
import { validateDOB, getYesterdayISO, convertDateToFormat } from '../utils/dateValidation';

// Password validation now comes from validation.ts - no duplicate logic needed

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
  dob: string;
  callDateTime: string;
}

const RegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    dob: "",
    callDateTime: "",
  });

  const [errors, setErrors] = useState<string>("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [dobError, setDobError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [privacyAccepted, setPrivacyAccepted] = useState<boolean>(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [newLetterAccepted, setNewLetterAccepted] = useState<boolean>(false);
  const [newLetterError, setNewLetterError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<{ google: boolean; github: boolean }>({ google: false, github: false });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const navigate = useNavigate();
  const auth = useAuth();
  const login = typeof auth?.login === 'function' ? auth.login : () => { };

  // Auto-detect country from browser timezone
  useEffect(() => {
    // Only auto-detect if country is not already set
    setFormData(prev => {
      if (prev.country) {
        return prev; // Country already set, don't change
      }
      
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        // Find country from timeZoneOptions that matches this timezone
        const match = timeZoneOptions.find(opt => opt.label === timezone);
        if (match?.country) {
          return { ...prev, country: match.country };
        }
      } catch (error) {
        // Silently fail if timezone detection fails
        console.debug('Could not detect country from timezone:', error);
      }
      
      return prev; // No change if detection failed or no match found
    });
  }, []); // Run once on mount

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

      // Navigate to homepage
      navigate('/homepage', { replace: true });
    } catch (err: any) {
      setErrors(err?.message || 'Failed to complete OAuth registration');
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
          setErrors(err?.message || 'Failed to complete OAuth registration');
        });
      } else if (event.data.type === 'OAUTH_ERROR') {
        setIsOAuthLoading({ google: false, github: false });
        setErrors(event.data.error || 'OAuth authentication failed');
      }
    };

    window.addEventListener('message', messageListener);
    
    return () => {
      window.removeEventListener('message', messageListener);
    };
  }, [processOAuthData]);

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      setIsOAuthLoading(prev => ({ ...prev, [provider]: true }));
      setErrors('');

      await loginByIdentityProvider(provider);

      // Note: With popup mode, the promise resolves when popup closes
      // The actual registration processing happens via postMessage listener above
    } catch (err: any) {
      const errorMessage = err?.message || `${provider === 'google' ? 'Google' : 'GitHub'} registration failed. Please try again.`;

      // Provide helpful message if popup was blocked
      if (err?.message?.includes('Popup blocked')) {
        setErrors('Popup blocked. Please allow popups for this site to sign in.');
      } else {
        setErrors(errorMessage);
      }

      setIsOAuthLoading(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { firstName, lastName, email, password, confirmPassword } = formData;

    // reset inline errors and server errors
    setErrors("");
    setEmailError(null);
    setFirstNameError(null);
    setLastNameError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);

    const validationErrors = validateRegistration({ firstName, lastName, email, password, confirmPassword });
    if (Object.keys(validationErrors).length > 0) {
      // apply per-field errors
      if (validationErrors.firstName) setFirstNameError(validationErrors.firstName);
      if (validationErrors.lastName) setLastNameError(validationErrors.lastName);
      if (validationErrors.email) setEmailError(validationErrors.email);
      if (validationErrors.password) setPasswordError(validationErrors.password);
      if (validationErrors.confirmPassword) setConfirmPasswordError(validationErrors.confirmPassword);
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      setTermsError('You must accept the Terms of Use and Privacy Policy to continue');
      return;
    }

    // if (!newLetterAccepted) {
    //   setNewLetterError('You must accept the newsletter subscription to continue');
    //   return;
    // }

    // Also include timezone short code (e.g., IST, EST) based on selected country
    const timeZoneShort: string | undefined = formData.country
      ? timeZoneOptions.find(t => t.country === formData.country)?.value
      : undefined;

    const params: RegisterParams = {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      country: formData.country || undefined,
      dob: formData.dob || undefined,
      timezone: timeZoneShort,
    };

    setIsLoading(true);
    try {
      const response = await apiRegister(params);

      // Check response structure - SDK might wrap the response
      // API returns: { success: true, data: { token: "..." } }
      // SDK might return: { data: { success: true, data: { token: "..." } } } or just { data: { token: "..." } }
      const responseData = response?.data || response;
      const token = responseData?.token || responseData?.data?.token || response?.token;

      if (!token) {
        setErrors('Registration successful but token not received. Please try again.');
        setIsLoading(false);
        return;
      }

      // Navigate to OTP validation page
      navigate('/registervalidation', { state: { email, token } });
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrors(err?.response?.data?.error || err?.message || 'Registration failed.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left Section - Form */}
      <div className="bg-card flex items-center justify-center px-6 py-6">
        <div className="w-full max-w-md space-y-6">
          <h2 className="text-3xl font-bold text-foreground text-left">{formText.register.title}</h2>

          {/* Social Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={() => handleOAuthLogin('google')}
              disabled={isOAuthLoading.google || isOAuthLoading.github}
              className="w-1/2 flex items-center justify-center border rounded-xl text-[var(--color-text-primary)] py-2 transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="-3 0 262 262" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" fill="#000000"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"></path><path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"></path><path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"></path><path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335"></path></g></svg>
              {isOAuthLoading.google ? 'Connecting...' : formText.register.google}
            </button>
            <button
              onClick={() => handleOAuthLogin('github')}
              disabled={isOAuthLoading.google || isOAuthLoading.github}
              className="w-1/2 flex items-center justify-center border rounded-xl text-[var(--color-text-primary)] py-2 transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill="#161514" fillRule="evenodd" d="M8 1C4.133 1 1 4.13 1 7.993c0 3.09 2.006 5.71 4.787 6.635.35.064.478-.152.478-.337 0-.166-.006-.606-.01-1.19-1.947.423-2.357-.937-2.357-.937-.319-.808-.778-1.023-.778-1.023-.635-.434.048-.425.048-.425.703.05 1.073.72 1.073.72.624 1.07 1.638.76 2.037.582.063-.452.244-.76.444-.935-1.554-.176-3.188-.776-3.188-3.456 0-.763.273-1.388.72-1.876-.072-.177-.312-.888.07-1.85 0 0 .586-.189 1.924.716A6.711 6.711 0 018 4.381c.595.003 1.194.08 1.753.236 1.336-.905 1.923-.717 1.923-.717.382.963.142 1.674.07 1.85.448.49.72 1.114.72 1.877 0 2.686-1.638 3.278-3.197 3.45.251.216.475.643.475 1.296 0 .934-.009 1.688-.009 1.918 0 .187.127.404.482.336A6.996 6.996 0 0015 7.993 6.997 6.997 0 008 1z" clipRule="evenodd"></path></g></svg>
              {isOAuthLoading.github ? 'Connecting...' : formText.register.github}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <div className="w-1/2 relative">
                <label className="field-component-label">First Name
                  <span className="field-component-required">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={e => { setFormData(prev => ({ ...prev, firstName: e.target.value })); if (firstNameError) setFirstNameError(null); if (errors) setErrors(""); }}
                  onBlur={() => { if (!formData.firstName.trim()) setFirstNameError("This field is required"); else setFirstNameError(null); }}
                  placeholder={formText.register.firstNamePlaceholder}
                  className={`field-component field-component-border field-component-focus placeholder-[var(--color-text-placeholder)] ${firstNameError ? "border-destructive bg-red-50" : ""} shadow-[var(--shadow-md)]`}
                  style={{ boxShadow: "var(--shadow-xs)" }}
                />
                {firstNameError && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Info className="w-4 h-4 text-red-400" />
                  </div>
                )}
                {firstNameError && <div className="mt-1.5 text-red-500 text-sm">{firstNameError}</div>}
              </div>
              <div className="w-1/2 relative">
                <label className="field-component-label">Last Name
                  <span className="field-component-required">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={e => { setFormData(prev => ({ ...prev, lastName: e.target.value })); if (lastNameError) setLastNameError(null); if (errors) setErrors(""); }}
                  onBlur={() => { if (!formData.lastName.trim()) setLastNameError("This field is required"); else setLastNameError(null); }}
                  placeholder={formText.register.lastNamePlaceholder}
                  className={`field-component field-component-border field-component-focus placeholder-[var(--color-text-placeholder)] ${lastNameError ? "border-destructive bg-red-50" : ""} shadow-[var(--shadow-xs)]`}
                  style={{ boxShadow: "var(--shadow-xs)" }}
                />
                {lastNameError && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Info className="w-4 h-4 text-red-400" />
                  </div>
                )}
                {lastNameError && <div className="mt-1.5 text-red-500 text-sm">{lastNameError}</div>}
              </div>
            </div>

            {/* Country and DOB Row */}
            <div className="flex gap-2">
              <div className="w-1/2 relative">
                <label className="field-component-label">Country
                  <span className="field-component-required">*</span>
                </label>
                <AdvancedDropdown
                  options={Array.from(new Set(timeZoneOptions.map(t => t.country)))
                    .sort((a, b) => a.localeCompare(b))
                    .map((country) => ({ label: country, value: country }))}
                  value={formData.country}
                  onChange={(val) => {
                    setFormData(prev => ({ ...prev, country: (val as string) || '' }));
                    if (errors) setErrors("");
                  }}
                  placeholder="Select Country"
                  searchable
                  // clearable
                  className=""
                />
              </div>
              <div className="w-1/2 relative">
                <label className="field-component-label">Date of Birth</label>
                <DateField
                  value={formData.dob}
                  onChange={(val) => { 
                    setFormData(prev => ({ ...prev, dob: val })); 
                    if (dobError) setDobError(null);
                    if (errors) setErrors(""); 
                  }}
                  format="DD-MM-YYYY"
                  isBorder
                  max={convertDateToFormat(getYesterdayISO(), 'DD-MM-YYYY')}
                  config={{ 
                    max: convertDateToFormat(getYesterdayISO(), 'DD-MM-YYYY'),
                    hideTodayButton: true
                  }}
                />
                {dobError && <div className="mt-1.5 text-red-500 text-sm">{dobError}</div>}
              </div>
            </div>
            {/* Preferred Call Date & Time */}
            {/* <div className="relative">
              <label className="field-component-label"> Time Zone</label>
              <DateTime
                value={formData.callDateTime}
                onChange={(val) => { setFormData(prev => ({ ...prev, callDateTime: val })); if (errors) setErrors(""); }}
                isBorder
                config={{
                  dateFormat: 'DD-MM-YYYY',
                  timeFormat: 'HH:mm',
                  hourFormat: '24',
                  displayTimeZone: true,
                }}
              />
            </div> */}
            <div className="relative">
              <label className="field-component-label">Email
                <span className="field-component-required">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => { setFormData(prev => ({ ...prev, email: e.target.value })); if (emailError) setEmailError(null); if (errors) setErrors(""); }}
                onBlur={() => { if (!formData.email.trim()) setEmailError("This field is required"); else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) setEmailError("Please enter a valid email address"); else setEmailError(null); }}
                placeholder={formText.register.emailPlaceholder}
                className={`field-component field-component-border field-component-focus placeholder-[var(--color-text-placeholder)] ${emailError ? "border-destructive bg-red-50" : ""} shadow-[var(--shadow-xs)]`}
                style={{ boxShadow: "var(--shadow-xs)" }}
              />
              {emailError && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
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
                  onChange={e => {
                    const newPassword = e.target.value;
                    setFormData(prev => ({ ...prev, password: newPassword }));
                    // Clear error on change, validation will happen on blur or submit
                    if (passwordError) setPasswordError(null);
                    if (errors) setErrors("");
                  }}
                  onBlur={() => {
                    if (!formData.password.trim()) {
                      setPasswordError("This field is required");
                    } else {
                      const validation = validatePasswordStrength(formData.password, formData.firstName, formData.lastName, formData.email);
                      if (!validation.isValid) {
                        setPasswordError(validation.errorMessage || "Password doesn't meet requirements");
                      } else {
                        setPasswordError(null);
                      }
                    }
                  }}
                  placeholder={formText.register.passwordPlaceholder}
                  className={`field-component field-component-border field-component-focus placeholder-[var(--color-text-placeholder)] ${passwordError ? "border-destructive bg-red-50" : ""} shadow-[var(--shadow-xs)]`}
                  style={{ boxShadow: "var(--shadow-xs)" }}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-50 flex items-center gap-2">
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
                  <div className="relative group">
                    <HelpCircle className={`w-4 h-4 ${passwordError ? "text-red-400" : "text-gray-400"} cursor-help`} />
                    <div className="invisible group-hover:visible group-focus-within:visible absolute left-0 mt-1 w-72 bg-card border rounded-xl shadow-lg p-4 text-sm z-50">
                      <h4 className="font-medium mb-2 text-primary">Password Requirements:</h4>
                      <ul className="space-y-1">
                        {(() => {
                          const validation = validatePasswordStrength(formData.password, formData.firstName, formData.lastName, formData.email);
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
                const validation = validatePasswordStrength(formData.password, formData.firstName, formData.lastName, formData.email);
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
              <label className="field-component-label">Confirm Password
                <span className="field-component-required">*</span>
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={e => { setFormData(prev => ({ ...prev, confirmPassword: e.target.value })); if (confirmPasswordError) setConfirmPasswordError(null); if (errors) setErrors(""); }}
                onBlur={() => { if (!formData.confirmPassword.trim()) setConfirmPasswordError("This field is required"); else if (formData.confirmPassword !== formData.password) setConfirmPasswordError("Passwords do not match"); else setConfirmPasswordError(null); }}
                placeholder={formText.register.confirmPasswordPlaceholder}
                className={`field-component field-component-border field-component-focus placeholder-[var(--color-text-placeholder)] ${confirmPasswordError ? "border-destructive bg-red-50" : ""} shadow-[var(--shadow-xs)]`}
                style={{ boxShadow: "var(--shadow-xs)" }}
              />
              {confirmPasswordError && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Info className="w-4 h-4 text-red-400" />
                </div>
              )}
              {confirmPasswordError && <div className="mt-1.5 text-red-500 text-sm">{confirmPasswordError}</div>}
            </div>


            <div className="space-y-2 text-sm text-muted-foreground">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 checkbox-primary-brand"
                  style={{ padding: "6px" }}
                  checked={termsAccepted}
                  onChange={e => {
                    setTermsAccepted(e.target.checked);
                    if (termsError) setTermsError(null);
                    if (errors) setErrors("");
                  }}
                />
                <div className="flex gap-2">
                  <span>I agree to the</span>
                  <button
                    type="button"
                    className="text-primary-brand bg-none border-none outline-none hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowTermsModal(true);
                    }}
                  >
                    {formText.register.terms}
                  </button>
                </div>
              </label>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 checkbox-primary-brand"
                  style={{ padding: "6px" }}
                  checked={privacyAccepted}
                  onChange={e => {
                    setPrivacyAccepted(e.target.checked);
                    if (termsError) setTermsError(null);
                    if (errors) setErrors("");
                  }}
                />
                <div className="flex gap-2">
                  <span>I agree to the</span>
                  <button
                    type="button"
                    className="text-primary-brand bg-none border-none outline-none hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPrivacyModal(true);
                    }}
                  >
                    {formText.register.privacy}
                  </button>
                </div>
              </label>
            </div>
            {termsError && <div className="text-destructive text-sm">{termsError}</div>}

            {/* <div className="space-y-2 text-sm text-muted-foreground">
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 checkbox-primary-brand" style={{padding:"6px"}} checked={newLetterAccepted} onChange={e => { setNewLetterAccepted(e.target.checked); if (newLetterError) setNewLetterError(null); if (errors) setErrors(""); }} />
                <span>{formText.register.newLetter}</span>
              </label>
            </div>

            {newLetterError && <div className="text-destructive text-sm">{newLetterError}</div>}
            {errors && <div className="text-destructive text-sm">{errors}</div>} */}

            <button
              type="submit"
              className={`w-full ${!termsAccepted ||
                !privacyAccepted ||
                !!firstNameError ||
                !!lastNameError ||
                !!emailError ||
                !!passwordError ||
                !!confirmPasswordError ||
                !!dobError ||
                !formData.country.trim() ||
                !formData.firstName.trim() ||
                !formData.lastName.trim() ||
                !formData.email.trim() ||
                !formData.password.trim() ||
                !formData.confirmPassword.trim() ||
                isLoading
                ? 'btn-disabled'
                : 'btn-primary'
                } py-2 px-4 rounded-xl font-medium transition flex items-center justify-center gap-2`}
              disabled={
                !termsAccepted ||
                !privacyAccepted ||
                !!firstNameError ||
                !!lastNameError ||
                !!emailError ||
                !!passwordError ||
                !!confirmPasswordError ||
                !!dobError ||
                !formData.country.trim() ||
                !formData.firstName.trim() ||
                !formData.lastName.trim() ||
                !formData.email.trim() ||
                !formData.password.trim() ||
                !formData.confirmPassword.trim() ||
                isLoading
              }
            >
              {isLoading && (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading ? 'Creating...' : formText.register.createAccount}
            </button>
            {errors && <div className="text-destructive text-sm">{errors}</div>}
          </form>

          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary-brand hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="bg-blue-600 text-primary-foreground flex flex-col justify-center px-8 py-16">
        <div className="max-w-md mx-auto space-y-4">
          <h1 className="text-4xl lg:text-5xl font-bold text-white">
            Transform your data into powerful applications.
          </h1>
          <p className="text-base lg:text-lg text-blue-100">
            Join thousands of developers who are building faster, more efficient
            applications with our database platform. Start creating today.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((id) => (
                <img
                  key={id}
                  className="w-10 h-10 rounded-full border-2 border-white"
                  src={`https://randomuser.me/api/portraits/${id === 2 ? "women" : "men"
                    }/${id}.jpg`}
                  alt=""
                />
              ))}
            </div>
            <span className="text-white text-sm">Trusted by <strong>10,000+</strong> developers worldwide</span>
          </div>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => setTermsAccepted(true)}
      />

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onAccept={() => setPrivacyAccepted(true)}
      />
    </div>
  );
};

export default RegistrationForm;
