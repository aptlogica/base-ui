export type LoginForm = {
  email: string;
  password: string;
};

export const validateEmail = (value: string): string | null => {
  if (!value?.trim()) return 'This field is required';
  const trimmed = value.trim();
  if (!trimmed) return 'This field is required';
  for (const element of trimmed) {
    if (
      element === ' ' ||
      element === '\n' ||
      element === '\r' ||
      element === '\t' ||
      element === '\f' ||
      element === '\v'
    ) {
      return 'Please enter a valid email address';
    }
  }

  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0) return 'Please enter a valid email address';
  if (trimmed.lastIndexOf('@') !== atIndex) return 'Please enter a valid email address';

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  if (!local || !domain) return 'Please enter a valid email address';

  const dotIndex = domain.lastIndexOf('.');
  if (dotIndex <= 0 || dotIndex === domain.length - 1) {
    return 'Please enter a valid email address';
  }

  return null;
};

export const validatePassword = (value: string, minLen = 6): string | null => {
  if (!value?.trim()) return 'This field is required';
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
  const normalizeLower = (value: string) => (value || '').trim().toLowerCase();
  const getNameEmailFlags = (lcPassword: string, lcFirstName: string, lcLastName: string, lcEmailValue: string) => {
    const emailLocalPart = lcEmailValue.split('@')[0] || '';
    const hasNonEmptyPassword = lcPassword.length > 0;
    const hasAnyIdentity = Boolean(lcFirstName || lcLastName || lcEmailValue);
    const containsFirstName = Boolean(lcFirstName && lcPassword.includes(lcFirstName));
    const containsLastName = Boolean(lcLastName && lcPassword.includes(lcLastName));
    const containsEmailLocalPart = Boolean(emailLocalPart && lcPassword.includes(emailLocalPart));
    const containsFullEmail = Boolean(lcEmailValue && lcPassword.includes(lcEmailValue));
    const containsNameOrEmail =
      containsFirstName || containsLastName || containsEmailLocalPart || containsFullEmail;

    return {
      hasNonEmptyPassword,
      hasAnyIdentity,
      containsNameOrEmail,
    };
  };
  const buildRequirementError = (requirements: {
    hasLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
  }) => {
    const missingRequirements: string[] = [];
    if (!requirements.hasLength) missingRequirements.push('at least 8 characters');
    if (!requirements.hasUpper) missingRequirements.push('an uppercase letter');
    if (!requirements.hasLower) missingRequirements.push('a lowercase letter');
    if (!requirements.hasNumber) missingRequirements.push('a number');
    if (!requirements.hasSymbol) missingRequirements.push('a symbol');
    if (!missingRequirements.length) return undefined;
    return `Password must include ${missingRequirements.join(', ')}`;
  };

  const pwd = (password || '').trim();
  const lcPwd = normalizeLower(password);
  const lcFirst = normalizeLower(firstName);
  const lcLast = normalizeLower(lastName);
  const lcEmail = normalizeLower(email);

  // Basic requirements
  const hasLength = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /\d/.test(pwd);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

  // Check if password contains name or email (should NOT contain these)
  const { hasNonEmptyPassword, hasAnyIdentity, containsNameOrEmail } = getNameEmailFlags(
    lcPwd,
    lcFirst,
    lcLast,
    lcEmail
  );
  // TRUE when requirement is satisfied (i.e., password does NOT contain name/email)
  // If no name/email provided, this requirement is automatically satisfied
  const containsNameAndEmail = !hasAnyIdentity || (hasNonEmptyPassword && !containsNameOrEmail);

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
  const containsCommon = hasNonEmptyPassword && !commonWords.some(w => lcPwd.includes(w));

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
  errorMessage = buildRequirementError({ hasLength, hasUpper, hasLower, hasNumber, hasSymbol });
  if (!errorMessage && !containsNameAndEmail) {
    errorMessage = 'Password must not contain your first name, last name, or email';
  }
  if (!errorMessage && !containsCommon) {
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
  if (!value?.trim()) return 'This field is required';
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

export default {
  validateEmail,
  validatePassword,
  validateRequired,
  validateLogin,
  validatePasswordStrength,
};
