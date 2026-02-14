/**
 * LEARNING EXAMPLE: Testing validation functions
 * 
 * This file demonstrates how to test validation functions step by step.
 * Read the comments to understand what each test is doing!
 */

import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, validatePasswordStrength, validateRequired, validateLogin } from '../validation';

// ============================================================================
// EXAMPLE 1: Testing validateEmail (Simple function)
// ============================================================================
describe('validateEmail', () => {
  // Test 1: Happy Path - Valid email should return null (no error)
  it('should return null for valid email addresses', () => {
    // Arrange: Set up test data
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'user+tag@example.com',
      'user123@test-domain.com'
    ];

    // Act & Assert: Test each valid email
    validEmails.forEach(email => {
      const result = validateEmail(email);
      expect(result).toBeNull(); // null = no error = valid
    });
  });

  // Test 2: Empty Input - Should return error message
  it('should return error for empty string', () => {
    const result = validateEmail('');
    expect(result).toBe('This field is required');
  });

  // Test 3: Invalid Format - Should return error
  it('should return error for invalid email formats', () => {
    const invalidEmails = [
      'not-an-email',
      'missing@domain',
      '@missinglocal.com',
      'missing@.com',
      'spaces in@email.com'
    ];

    invalidEmails.forEach(email => {
      const result = validateEmail(email);
      expect(result).toBe('Please enter a valid email address');
    });
  });

  // Test 4: Edge Case - Whitespace should be trimmed
  it('should trim whitespace from email', () => {
    const result = validateEmail('  test@example.com  ');
    expect(result).toBeNull(); // Should work after trimming
  });

  // Test 5: Null/Undefined - Should handle gracefully
  it('should handle null and undefined', () => {
    expect(validateEmail(null as any)).toBe('This field is required');
    expect(validateEmail(undefined as any)).toBe('This field is required');
  });
});

// ============================================================================
// EXAMPLE 2: Testing validatePassword (Function with parameters)
// ============================================================================
describe('validatePassword', () => {
  // Test 1: Valid password
  it('should return null for valid password', () => {
    const result = validatePassword('password123', 8);
    expect(result).toBeNull();
  });

  // Test 2: Too short password
  it('should return error for password shorter than minimum', () => {
    const result = validatePassword('short', 8);
    expect(result).toBe('Password must be at least 8 characters long');
  });

  // Test 3: Empty password
  it('should return error for empty password', () => {
    const result = validatePassword('', 6);
    expect(result).toBe('This field is required');
  });

  // Test 4: Custom minimum length
  it('should respect custom minimum length', () => {
    expect(validatePassword('12345', 6)).toBe('Password must be at least 6 characters long');
    expect(validatePassword('123456', 6)).toBeNull();
  });
});

// ============================================================================
// EXAMPLE 3: Testing validatePasswordStrength (Complex function)
// ============================================================================
describe('validatePasswordStrength', () => {
  // Test 1: Perfect password (all 7 requirements met)
  it('should validate a strong password with all requirements', () => {
    const result = validatePasswordStrength(
      'MyStr0ng!Pass',
      'John',
      'Doe',
      'john@example.com'
    );

    // Check all requirements are met
    expect(result.isValid).toBe(true);
    expect(result.strength).toBe(7); // All 7 checks passed
    expect(result.hasLength).toBe(true); // >= 8 characters
    expect(result.hasUpper).toBe(true); // Has uppercase
    expect(result.hasLower).toBe(true); // Has lowercase
    expect(result.hasNumber).toBe(true); // Has number
    expect(result.hasSymbol).toBe(true); // Has symbol
    expect(result.containsNameAndEmail).toBe(true); // Doesn't contain name/email
    expect(result.containsCommon).toBe(true); // Doesn't contain common words
  });

  // Test 2: Weak password (missing multiple requirements)
  it('should detect weak password', () => {
    const result = validatePasswordStrength(
      'weak', // Too short, no uppercase, no number, no symbol
      '',
      '',
      ''
    );

    expect(result.isValid).toBe(false);
    expect(result.strength).toBeLessThan(7);
    expect(result.hasLength).toBe(false);
    expect(result.hasUpper).toBe(false);
    expect(result.hasNumber).toBe(false);
    expect(result.hasSymbol).toBe(false);
  });

  // Test 3: Password containing first name (should fail)
  it('should reject password containing first name', () => {
    const result = validatePasswordStrength(
      'John123!Pass', // Contains "John"
      'John',
      'Doe',
      'john@example.com'
    );

    expect(result.containsNameAndEmail).toBe(false);
    expect(result.isValid).toBe(false);
  });

  // Test 4: Password containing last name (should fail)
  it('should reject password containing last name', () => {
    const result = validatePasswordStrength(
      'Doe123!Pass', // Contains "Doe"
      'John',
      'Doe',
      'john@example.com'
    );

    expect(result.containsNameAndEmail).toBe(false);
  });

  // Test 5: Password containing email (should fail)
  it('should reject password containing email', () => {
    const result = validatePasswordStrength(
      'john@example.com123!', // Contains email
      'John',
      'Doe',
      'john@example.com'
    );

    expect(result.containsNameAndEmail).toBe(false);
  });

  // Test 6: Password with common words (should fail)
  it('should reject password with common words', () => {
    const commonWords = ['password', '123456', 'qwerty', 'admin'];
    
    commonWords.forEach(word => {
      const result = validatePasswordStrength(
        `${word}123!`, // Contains common word
        '',
        '',
        ''
      );

      expect(result.containsCommon).toBe(false);
    });
  });

  // Test 7: Password missing uppercase
  it('should detect missing uppercase letter', () => {
    const result = validatePasswordStrength(
      'lowercase123!', // No uppercase
      '',
      '',
      ''
    );

    expect(result.hasUpper).toBe(false);
    expect(result.strength).toBeLessThan(7);
  });

  // Test 8: Password missing lowercase
  it('should detect missing lowercase letter', () => {
    const result = validatePasswordStrength(
      'UPPERCASE123!', // No lowercase
      '',
      '',
      ''
    );

    expect(result.hasLower).toBe(false);
  });

  // Test 9: Password missing number
  it('should detect missing number', () => {
    const result = validatePasswordStrength(
      'NoNumber!', // No number
      '',
      '',
      ''
    );

    expect(result.hasNumber).toBe(false);
  });

  // Test 10: Password missing symbol
  it('should detect missing symbol', () => {
    const result = validatePasswordStrength(
      'NoSymbol123', // No symbol
      '',
      '',
      ''
    );

    expect(result.hasSymbol).toBe(false);
  });

  // Test 11: Edge case - empty name/email (should still work)
  it('should work when name and email are empty', () => {
    const result = validatePasswordStrength(
      'Str0ng!Pass',
      '',
      '',
      ''
    );

    // Should still validate (name/email check is automatically satisfied)
    expect(result.containsNameAndEmail).toBe(true);
    expect(result.isValid).toBe(true);
  });

  // Test 12: Returns detailed missing-requirements message
  it('should return missing requirements error message when basic checks fail', () => {
    const result = validatePasswordStrength(
      'short',
      '',
      '',
      ''
    );

    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('at least 8 characters');
    expect(result.errorMessage).toContain('an uppercase letter');
    expect(result.errorMessage).toContain('a number');
    expect(result.errorMessage).toContain('a symbol');
  });

  // Test 13: Returns name/email-specific error when structure is otherwise valid
  it('should return name/email specific error message', () => {
    const result = validatePasswordStrength(
      'John123!Ab',
      'John',
      '',
      'john@example.com'
    );

    expect(result.hasLength).toBe(true);
    expect(result.hasUpper).toBe(true);
    expect(result.hasLower).toBe(true);
    expect(result.hasNumber).toBe(true);
    expect(result.hasSymbol).toBe(true);
    expect(result.containsNameAndEmail).toBe(false);
    expect(result.errorMessage).toBe("Password must not contain your first name, last name, or email");
  });

  // Test 14: Returns common-word error when all other checks pass
  it('should return common-word specific error message', () => {
    const result = validatePasswordStrength(
      'Password1!',
      '',
      '',
      ''
    );

    expect(result.hasLength).toBe(true);
    expect(result.hasUpper).toBe(true);
    expect(result.hasLower).toBe(true);
    expect(result.hasNumber).toBe(true);
    expect(result.hasSymbol).toBe(true);
    expect(result.containsNameAndEmail).toBe(true);
    expect(result.containsCommon).toBe(false);
    expect(result.errorMessage).toContain("Password must not contain common words");
  });
});

describe('validateRequired', () => {
  it('returns required error for blank values', () => {
    expect(validateRequired('')).toBe('This field is required');
    expect(validateRequired('   ')).toBe('This field is required');
  });

  it('returns null for non-empty values', () => {
    expect(validateRequired('value')).toBeNull();
  });
});

describe('validateLogin', () => {
  it('returns both errors when email and password are invalid', () => {
    const errors = validateLogin({ email: '', password: '' });
    expect(errors).toEqual({
      email: 'This field is required',
      password: 'This field is required',
    });
  });

  it('returns only email error when password is valid', () => {
    const errors = validateLogin({ email: 'bad-email', password: 'Valid123!' });
    expect(errors.email).toBe('Please enter a valid email address');
    expect(errors.password).toBeUndefined();
  });

  it('returns empty errors object for valid login values', () => {
    const errors = validateLogin({ email: 'user@example.com', password: 'password123' });
    expect(errors).toEqual({});
  });
});

