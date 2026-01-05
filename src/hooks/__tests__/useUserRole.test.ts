import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUserRole } from '../useUserRole';

describe('useUserRole', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('getRoles', () => {
    it('should return empty array when no roles are stored', () => {
      const { result } = renderHook(() => useUserRole());
      expect(result.current.getRoles()).toEqual([]);
    });

    it('should return roles from sessionStorage', () => {
      sessionStorage.setItem('user_roles', JSON.stringify(['Admin', 'User']));
      const { result } = renderHook(() => useUserRole());
      expect(result.current.getRoles()).toEqual(['Admin', 'User']);
    });
  });

  describe('hasRole', () => {
    it('should return false when role is not present', () => {
      sessionStorage.setItem('user_roles', JSON.stringify(['User']));
      const { result } = renderHook(() => useUserRole());
      expect(result.current.hasRole('Admin')).toBe(false);
    });

    it('should return true when role is present', () => {
      sessionStorage.setItem('user_roles', JSON.stringify(['Admin', 'User']));
      const { result } = renderHook(() => useUserRole());
      expect(result.current.hasRole('Admin')).toBe(true);
    });

    it('should return false when no roles are stored', () => {
      const { result } = renderHook(() => useUserRole());
      expect(result.current.hasRole('Admin')).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when any role matches', () => {
      sessionStorage.setItem('user_roles', JSON.stringify(['User', 'Editor']));
      const { result } = renderHook(() => useUserRole());
      expect(result.current.hasAnyRole(['Admin', 'Editor'])).toBe(true);
    });

    it('should return false when no roles match', () => {
      sessionStorage.setItem('user_roles', JSON.stringify(['User']));
      const { result } = renderHook(() => useUserRole());
      expect(result.current.hasAnyRole(['Admin', 'Editor'])).toBe(false);
    });

    it('should return false when no roles are stored', () => {
      const { result } = renderHook(() => useUserRole());
      expect(result.current.hasAnyRole(['Admin', 'Editor'])).toBe(false);
    });
  });

  describe('hasAllRoles', () => {
    it('should return true when all roles match', () => {
      sessionStorage.setItem('user_roles', JSON.stringify(['Admin', 'User', 'Editor']));
      const { result } = renderHook(() => useUserRole());
      expect(result.current.hasAllRoles(['Admin', 'User'])).toBe(true);
    });

    it('should return false when some roles are missing', () => {
      sessionStorage.setItem('user_roles', JSON.stringify(['User']));
      const { result } = renderHook(() => useUserRole());
      expect(result.current.hasAllRoles(['Admin', 'User'])).toBe(false);
    });

    it('should return false when no roles are stored', () => {
      const { result } = renderHook(() => useUserRole());
      expect(result.current.hasAllRoles(['Admin'])).toBe(false);
    });

    it('should return true for empty array', () => {
      const { result } = renderHook(() => useUserRole());
      expect(result.current.hasAllRoles([])).toBe(true);
    });
  });

  describe('isAdmin', () => {
    it('should return true when user has Admin role', () => {
      sessionStorage.setItem('user_roles', JSON.stringify(['Admin']));
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
