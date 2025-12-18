export type LoginForm = {
  email: string;
  password: string;
};

export type RegistrationForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export const validateEmail = (value: string): string | null => {
  if (!value || !value.trim()) return 'This field is required';
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  return ok ? null : 'Please enter a valid email address';
};

export const validatePassword = (value: string, minLen = 6): string | null => {
  if (!value || !value.trim()) return 'This field is required';
  if (value.trim().length < minLen) return `Password must be at least ${minLen} characters long`;
  return null;
};

/**
 * Validates password strength and returns detailed validation results
 * Used for both UI feedback and form submission validation
 */
export const validatePasswordStrength = (
  password: string,
  firstName: string,
  lastName: string,
  email: string
): {
  isValid: boolean;
  strength: number; // 0-7
  hasLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  containsNameAndEmail: boolean; // true when password does NOT contain name/email
  containsCommon: boolean; // true when password does NOT contain common words
  errorMessage?: string;
} => {
  const pwd = (password || '').trim();
  const lcPwd = pwd.toLowerCase();
  const lcFirst = (firstName || '').trim().toLowerCase();
  const lcLast = (lastName || '').trim().toLowerCase();
  const lcEmail = (email || '').trim().toLowerCase();
  const emailLocal = lcEmail.split('@')[0] || '';

  // Basic requirements
  const hasLength = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

  // Check if password contains name or email (should NOT contain these)
  const hasNonEmpty = lcPwd.length > 0;
  const containsFirst = !!(lcFirst && lcFirst.length > 0 && lcPwd.includes(lcFirst));
  const containsLast = !!(lcLast && lcLast.length > 0 && lcPwd.includes(lcLast));
  const containsEmailLocal = !!(emailLocal && emailLocal.length > 0 && lcPwd.includes(emailLocal));
  const containsEmail = !!(lcEmail && lcEmail.length > 0 && lcPwd.includes(lcEmail));
  const anyNameOrEmailProvided = Boolean(lcFirst || lcLast || lcEmail);
  // TRUE when requirement is satisfied (i.e., password does NOT contain name/email)
  // If no name/email provided, this requirement is automatically satisfied
  const containsNameAndEmail = !anyNameOrEmailProvided || (hasNonEmpty && !(containsFirst || containsLast || containsEmailLocal || containsEmail));

  // Common words to avoid
  const commonWords = [
    'password',
    '1234',
    '12345',
    '123456',
    '12345678',
    'qwerty',
    'letmein',
    'admin',
    'welcome',
    'abc123',
    'iloveyou',
    '1111',
    '0000',
    'passw0rd',
    'football',
    'demo',
    'test',
    'asdfghjkl'
  ];
  // TRUE when requirement is satisfied (i.e., password does NOT contain common words)
  const containsCommon = hasNonEmpty && !commonWords.some(w => lcPwd.includes(w));

  // Calculate strength (0-7)
  const strength = [
    hasLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSymbol,
    containsNameAndEmail,
    containsCommon
  ].filter(Boolean).length;

  // Generate error message if invalid
  let errorMessage: string | undefined;
  if (!hasLength || !hasUpper || !hasLower || !hasNumber || !hasSymbol) {
    const missingRequirements: string[] = [];
    if (!hasLength) missingRequirements.push('at least 8 characters');
    if (!hasUpper) missingRequirements.push('an uppercase letter');
    if (!hasLower) missingRequirements.push('a lowercase letter');
    if (!hasNumber) missingRequirements.push('a number');
    if (!hasSymbol) missingRequirements.push('a symbol');
    
    errorMessage = `Password must include ${missingRequirements.join(', ')}`;
  } else if (!containsNameAndEmail) {
    errorMessage = "Password must not contain your first name, last name, or email";
  } else if (!containsCommon) {
    errorMessage = "Password must not contain common words like 'password', '1234', or 'qwerty'";
  }

  return {
    isValid: strength === 7,
    strength,
    hasLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSymbol,
    containsNameAndEmail,
    containsCommon,
    errorMessage
  };
};

export const validateRequired = (value: string): string | null => {
  if (!value || !value.trim()) return 'This field is required';
  return null;
};

export const validateLogin = (form: LoginForm) => {
  const errors: { email?: string; password?: string } = {};
  const emailErr = validateEmail(form.email);
  if (emailErr) errors.email = emailErr;
  const pwErr = validatePassword(form.password);
  if (pwErr) errors.password = pwErr;
  return errors;
};

export const validateRegistration = (form: RegistrationForm) => {
  const errors: { [k: string]: string } = {};
  
  // Validate required fields
  const fnErr = validateRequired(form.firstName);
  if (fnErr) errors.firstName = fnErr;
  
  const lnErr = validateRequired(form.lastName);
  if (lnErr) errors.lastName = lnErr;
  
  const emailErr = validateEmail(form.email);
  if (emailErr) errors.email = emailErr;

  // Validate password using the same logic as UI feedback
  if (!form.password || !form.password.trim()) {
    errors.password = 'This field is required';
  } else {
    const passwordValidation = validatePasswordStrength(
      form.password,
      form.firstName,
      form.lastName,
      form.email
    );
    
    if (!passwordValidation.isValid && passwordValidation.errorMessage) {
      errors.password = passwordValidation.errorMessage;
    }
  }

  // Validate confirm password
  if (!form.confirmPassword || !form.confirmPassword.trim()) {
    errors.confirmPassword = 'This field is required';
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  return errors;
};

export default {
  validateEmail,
  validatePassword,
  validateRequired,
  validateLogin,
  validateRegistration,
  validatePasswordStrength,
};
