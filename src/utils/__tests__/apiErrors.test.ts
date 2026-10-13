import { describe, it, expect } from 'vitest';
import { apiErrorMessage } from '../apiErrors';

describe('apiErrorMessage', () => {
  it('shows the exact message of backend errors', () => {
    const err = Object.assign(new Error('Code can\'t be empty: it is part of the primary key.'), { code: 'PKY_1007' });
    expect(apiErrorMessage(err, 'Failed')).toBe("Code can't be empty: it is part of the primary key.");
  });

  it('falls back for other failures', () => {
    expect(apiErrorMessage(new Error('Network Error'), 'Failed')).toBe('Failed');
    expect(apiErrorMessage(Object.assign(new Error(''), { code: 'PKY_1008' }), 'Failed')).toBe('Failed');
    expect(apiErrorMessage(undefined, 'Failed')).toBe('Failed');
    expect(apiErrorMessage('boom', 'Failed')).toBe('Failed');
  });
});
