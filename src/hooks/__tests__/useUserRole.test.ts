import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUserRole } from '../useUserRole';
import { ROLES } from '../../types/roles';

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

    it('should return role from user_role when available', () => {
      sessionStorage.setItem('user_role', 'owner');
      const { result } = renderHook(() => useUserRole());
      expect(result.current.getRole()).toBe('owner');
    });
  });

  describe('hasRole', () => {
    it('should return false when role does not match', () => {
      sessionStorage.setItem('user_role', 'maintainer');
      const { result } = renderHook(() => useUserRole());
      expect(result.current.hasRole('owner')).toBe(false);
    });

    it('should return true when role matches', () => {
      sessionStorage.setItem('user_role', 'owner');
      const { result } = renderHook(() => useUserRole());
      expect(result.current.hasRole('owner')).toBe(true);
    });

    it('should return false when no role is stored', () => {
      const { result } = renderHook(() => useUserRole());
      expect(result.current.hasRole('owner')).toBe(false);
    });
  });

  describe('isOwner', () => {
    it('should return true when user has owner role', () => {
      sessionStorage.setItem('user_role', ROLES.Owner);
      const { result } = renderHook(() => useUserRole());
      expect(result.current.isOwner()).toBe(true);
    });

    it('should return false when user does not have owner role', () => {
      sessionStorage.setItem('user_role', ROLES.CoOwner);
      const { result } = renderHook(() => useUserRole());
      expect(result.current.isOwner()).toBe(false);
    });
  });

  describe('isCoOwner', () => {
    it('should return true when user has co-owner role', () => {
      sessionStorage.setItem('user_role', ROLES.CoOwner);
      const { result } = renderHook(() => useUserRole());
      expect(result.current.isCoOwner()).toBe(true);
    });

    it('should return false when user does not have co-owner role', () => {
      sessionStorage.setItem('user_role', ROLES.Owner);
      const { result } = renderHook(() => useUserRole());
      expect(result.current.isCoOwner()).toBe(false);
    });
  });

  describe('isMaintainer', () => {
    it('should return true when user has maintainer role', () => {
      sessionStorage.setItem('user_role', ROLES.WorkspaceMaintainer);
      const { result } = renderHook(() => useUserRole());
      expect(result.current.isMaintainer()).toBe(true);
    });

    it('should return false when user does not have maintainer role', () => {
      sessionStorage.setItem('user_role', ROLES.Owner);
      const { result } = renderHook(() => useUserRole());
      expect(result.current.isMaintainer()).toBe(false);
    });
  });

  describe('isBaseMember', () => {
    it('should return true when user has base member role', () => {
      sessionStorage.setItem('user_role', ROLES.BaseMember);
      const { result } = renderHook(() => useUserRole());
      expect(result.current.isBaseMember()).toBe(true);
    });

    it('should return false when user does not have base member role', () => {
      sessionStorage.setItem('user_role', ROLES.Owner);
      const { result } = renderHook(() => useUserRole());
      expect(result.current.isBaseMember()).toBe(false);
    });
  });

  describe('hasAdminRole', () => {
    it('should return true when user is owner', () => {
      sessionStorage.setItem('user_role', ROLES.Owner);
      const { result } = renderHook(() => useUserRole());
      expect(result.current.hasAdminRole()).toBe(true);
    });

    it('should return true when user is co-owner', () => {
      sessionStorage.setItem('user_role', ROLES.CoOwner);
      const { result } = renderHook(() => useUserRole());
      expect(result.current.hasAdminRole()).toBe(true);
    });

    it('should return false when user is maintainer', () => {
      sessionStorage.setItem('user_role', ROLES.WorkspaceMaintainer);
      const { result } = renderHook(() => useUserRole());
      expect(result.current.hasAdminRole()).toBe(false);
    });

    it('should return false when no role is stored', () => {
      const { result } = renderHook(() => useUserRole());
      expect(result.current.hasAdminRole()).toBe(false);
    });
  });

  describe('hasFullAccessRole', () => {
    it('should return true when user is owner', () => {
      sessionStorage.setItem('user_role', ROLES.Owner);
      const { result } = renderHook(() => useUserRole());
      expect(result.current.hasFullAccessRole()).toBe(true);
    });

    it('should return true when user is co-owner', () => {
      sessionStorage.setItem('user_role', ROLES.CoOwner);
      const { result } = renderHook(() => useUserRole());
      expect(result.current.hasFullAccessRole()).toBe(true);
    });

    it('should return true when user is maintainer', () => {
      sessionStorage.setItem('user_role', ROLES.WorkspaceMaintainer);
      const { result } = renderHook(() => useUserRole());
      expect(result.current.hasFullAccessRole()).toBe(true);
    });

    it('should return false when user is base member', () => {
      sessionStorage.setItem('user_role', ROLES.BaseMember);
      const { result } = renderHook(() => useUserRole());
      expect(result.current.hasFullAccessRole()).toBe(false);
    });
  });

  describe('isAdmin (backward compatibility)', () => {
    it('should return true when user is owner', () => {
      sessionStorage.setItem('user_role', ROLES.Owner);
      const { result } = renderHook(() => useUserRole());
      expect(result.current.isAdmin()).toBe(true);
    });

    it('should return true when user is co-owner', () => {
      sessionStorage.setItem('user_role', ROLES.CoOwner);
      const { result } = renderHook(() => useUserRole());
      expect(result.current.isAdmin()).toBe(true);
    });

    it('should return false when user does not have admin role', () => {
      sessionStorage.setItem('user_role', ROLES.WorkspaceMaintainer);
      const { result } = renderHook(() => useUserRole());
      expect(result.current.isAdmin()).toBe(false);
    });

    it('should return false when no role is stored', () => {
      const { result } = renderHook(() => useUserRole());
      expect(result.current.isAdmin()).toBe(false);
    });
  });
});
