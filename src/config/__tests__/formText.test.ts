import { describe, it, expect } from 'vitest';
import formText from '../formText';

describe('formText', () => {
  it('should include expected login copy keys', () => {
    expect(formText.login.title).toBeTypeOf('string');
    expect(formText.login.description2).toBeTypeOf('string');
    expect(formText.login.subtitle).toBeTypeOf('string');
    expect(formText.login.github).toBeTypeOf('string');
    expect(formText.login.emailPlaceholder).toBeTypeOf('string');
    expect(formText.login.passwordPlaceholder).toBeTypeOf('string');
    expect(formText.login.signIn).toBeTypeOf('string');
  });

  it('should keep stable user-facing values for key strings', () => {
    expect(formText.login.title).toBe('Welcome back');
    expect(formText.login.github).toBe('Sign in with GitHub');
    expect(formText.login.signIn).toBe('Sign in');
  });
});
