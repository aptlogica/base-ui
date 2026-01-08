import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUserRole } from '../useUserRole';

describe('useUserRole', () => {
  let mockStorage: Map<string, string>;

  beforeEach(() => {
    mockStorage = new Map();
    
    // Replace sessionStorage completely
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: {
        getItem: (key: string) => mockStorage.get(key) || null,
        setItem: (key: string, value: string) => mockStorage.set(key, value),
        removeItem: (key: string) => mockStorage.delete(key),
        clear: () => mockStorage.clear(),
        get length() { return mockStorage.size; },
        key: (index: number) => Array.from(mockStorage.keys())[index] || null,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    mockStorage.clear();
  });

  describe('getRole', () => {
    it('should return null when no role is stored', () => {
      const { result } = renderHook(() => useUserRole());
      expect(result.current.getRole()).toBeNull();
    });

    it('should return role from sessionStorage', () => {
      sessionStorage.setItem('user_role', 'owner');
      const { result } = renderHook(() => useUserRole());
      expect(result.current.getRole()).toBe('owner');
    });
  });

  describe('hasRole', () => {
    it('should return false when role is not present', () => {
      sessionStorage.setItem('user_role', 'maintainer');
      const { result } = renderHook(() => useUserRole());
      expect(result.current.hasRole('owner')).toBe(false);
    });

    it('should return true when role is present', () => {
      sessionStorage.setItem('user_role', 'owner');
      const { result } = renderHook(() => useUserRole());
      expect(result.current.hasRole('owner')).toBe(true);
    });

    it('should return false when no roles are stored', () => {
      const { result } = renderHook(() => useUserRole());
      expect(result.current.hasRole('owner')).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true when user has Admin role', () => {
      sessionStorage.setItem('user_role', 'owner');
      const { result } = renderHook(() => useUserRole());
      expect(result.current.isAdmin()).toBe(true);
    });

    it('should return false when user does not have Admin role', () => {
      sessionStorage.setItem('user_roles', JSON.stringify(['User']));
      const { result } = renderHook(() => useUserRole());
      expect(result.current.isAdmin()).toBe(false);
    });

    it('should return false when no roles are stored', () => {
      const { result } = renderHook(() => useUserRole());
      expect(result.current.isAdmin()).toBe(false);
    });
  });
});
