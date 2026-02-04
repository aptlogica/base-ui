import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { forgotPassword } from "../service/clientService";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const validateEmail = (value: string) => {
    // Limit input length to prevent ReDoS attacks (RFC 5321: max 254 chars for email)
    if (value.length > 254 || value.length === 0) {
      return false;
    }
    
    // Split validation into simpler checks to avoid catastrophic backtracking
    // Check for exactly one @ symbol
    const atIndex = value.indexOf('@');
    if (atIndex === -1 || atIndex !== value.lastIndexOf('@')) {
      return false;
    }
    
    const localPart = value.substring(0, atIndex);
    const domain = value.substring(atIndex + 1);
    
    // Validate local part (before @): 1-64 characters, no spaces, no consecutive dots
    if (localPart.length === 0 || localPart.length > 64) {
      return false;
    }
    if (localPart.includes(' ') || localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
      return false;
    }
    
    // Validate domain (after @): must have valid structure
    if (domain.length === 0 || domain.length > 253) {
      return false;
    }
    
    // Check domain has at least one dot
    if (!domain.includes('.')) {
      return false;
    }
    
    // Split domain by dots and validate each part
    const domainParts = domain.split('.');
    if (domainParts.length < 2) {
      return false;
    }
    
    // Validate each domain part (no spaces, reasonable length)
    for (const part of domainParts) {
      if (part.length === 0 || part.length > 63) {
        return false;
      }
      if (/\s/.test(part)) {
        return false;
      }
    }
    
    // Check TLD (last part) has at least 2 characters
    const tld = domainParts.at(-1);
    if (tld?.length < 2) {
      return false;
    }
    
    // Simple check: domain should contain only valid characters (letters, numbers, dots, hyphens)
    // This avoids complex regex patterns that could cause backtracking
    const validDomainChars = /^[a-zA-Z0-9.-]+$/;
    if (!validDomainChars.test(domain)) {
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError(null);
    
    if (!email.trim()) {
      setEmailError("This field is required");
      return;
    }
    
    if (!validateEmail(email.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      await forgotPassword({ email: email.trim() });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-card border rounded-2xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h1>
          <p className="text-gray-600 mb-6">
            We've sent a password reset link to <strong>{email}</strong>. 
            Please check your email and click the link to reset your password.
          </p>
          <div className="space-y-4">
            <Link 
              to="/login" 
              className="w-full btn-primary py-2 rounded-md transition inline-block text-center"
            >
              Back to Login
            </Link>
            <button
              onClick={() => {
                setIsSuccess(false);
                setEmail("");
              }}
              className="w-full text-sm text-gray-600 hover:text-gray-800 transition"
            >
              Try a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-card border rounded-2xl shadow-md p-8">
        <div className="mb-6">
          <Link 
            to="/login"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
          <p className="text-gray-600">
            No worries! Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label htmlFor="forgot-password-email" className="field-component-label">
              Email Address <span className="field-component-required">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
                if (error) setError("");
              }}
              onBlur={() => {
                if (!email.trim()) setEmailError("This field is required");
                else if (validateEmail(email.trim())) {setEmailError(null);}
                else {setEmailError("Please enter a valid email address");}
              }}
              placeholder="Enter your email address"
              className={`field-component field-component-border field-component-focus placeholder-[var(--color-text-placeholder)] ${emailError ? "border-destructive bg-red-50" : ""} shadow-[var(--shadow-xs)]`}
              style={{ boxShadow: "var(--shadow-xs)" }}
            />
            {emailError && <div className="mt-1.5 text-red-500 text-sm">{emailError}</div>}
          </div>

          {error && (
            <div className="text-destructive text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-2 px-4 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
