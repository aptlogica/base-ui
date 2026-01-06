import { describe, it, expect, vi } from 'vitest';
import { replaceNavigate, pushNavigate } from '../navigationRedirect';

describe('navigationRedirect', () => {
  it('replaceNavigate should call navigate with replace:true', () => {
    const navigate = vi.fn();
    replaceNavigate(navigate as any, '/target');

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/target', { replace: true });
  });

  it('pushNavigate should call navigate without replace', () => {
    const navigate = vi.fn();
    pushNavigate(navigate as any, '/target');

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/target');
  });
});
