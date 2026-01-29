import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCurrentUser, getUserInitials, getUserDisplayName } from '../useCurrentUser';
import { useAuth } from '../AuthContext';

// Mock the AuthContext
vi.mock('../AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('useCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useCurrentUser hook', () => {
    it('should return the user object from AuthContext', () => {
      // Arrange
      const mockUser = {
        id: '123',
        email: 'john.doe@example.com',
        first_name: 'John',
        last_name: 'Doe',
      };
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
        saving: false,
        restoreCompleted: true,
        userRole: 'admin',
      });

      // Act
      const { result } = renderHook(() => useCurrentUser());

      // Assert
      expect(result.current).toEqual(mockUser);
    });

    it('should return null when no user is authenticated', () => {
      // Arrange
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
        saving: false,
        restoreCompleted: true,
        userRole: null,
      });

      // Act
      const { result } = renderHook(() => useCurrentUser());

      // Assert
      expect(result.current).toBeNull();
    });

    it('should return user with complete fields', () => {
      // Arrange
      const completeUser = {
        id: 'user-456',
        email: 'jane.smith@example.com',
        display_name: 'Jane Smith',
        first_name: 'Jane',
        last_name: 'Smith',
        avatar: 'https://example.com/avatar.jpg',
        is_active: true,
        is_verified: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-12-01T00:00:00Z',
        roles: ['admin', 'editor'],
      };
      vi.mocked(useAuth).mockReturnValue({
        user: completeUser,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
        saving: false,
        restoreCompleted: true,
        userRole: 'admin',
      });

      // Act
      const { result } = renderHook(() => useCurrentUser());

      // Assert
      expect(result.current).toEqual(completeUser);
      expect(result.current?.id).toBe('user-456');
      expect(result.current?.email).toBe('jane.smith@example.com');
      expect(result.current?.roles).toContain('admin');
    });

    it('should return user object with additional custom properties', () => {
      // Arrange
      const userWithCustomProps = {
        id: '789',
        email: 'custom@example.com',
        first_name: 'Custom',
        last_name: 'User',
        customField: 'customValue',
        anotherField: 123,
      };
      vi.mocked(useAuth).mockReturnValue({
        user: userWithCustomProps,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
        saving: false,
        restoreCompleted: true,
        userRole: null,
      });

      // Act
      const { result } = renderHook(() => useCurrentUser());

      // Assert
      expect(result.current?.customField).toBe('customValue');
      expect(result.current?.anotherField).toBe(123);
    });
  });

  describe('getUserInitials', () => {
    it('should return initials from first_name and last_name', () => {
      // Arrange
      const user = {
        first_name: 'John',
        last_name: 'Doe',
      };

      // Act
      const initials = getUserInitials(user);

      // Assert
      expect(initials).toBe('JD');
    });

    it('should return uppercase initials', () => {
      // Arrange
      const user = {
        first_name: 'alice',
        last_name: 'wonderland',
      };

      // Act
      const initials = getUserInitials(user);

      // Assert
      expect(initials).toBe('AW');
    });

    it('should return initials from display_name when first_name and last_name are absent', () => {
      // Arrange
      const user = {
        display_name: 'Jane Smith',
      };

      // Act
      const initials = getUserInitials(user);

      // Assert
      expect(initials).toBe('JS');
    });

    it('should extract initials from multi-word display_name', () => {
      // Arrange
      const user = {
        display_name: 'Mary Jane Watson',
      };

      // Act
      const initials = getUserInitials(user);

      // Assert
      expect(initials).toBe('MJ');
    });

    it('should return email initial when first_name, last_name, and display_name are absent', () => {
      // Arrange
      const user = {
        email: 'test.user@example.com',
      };

      // Act
      const initials = getUserInitials(user);

      // Assert
      expect(initials).toBe('T');
    });

    it('should return "U" when user object is null', () => {
      // Arrange
      const user = null;

      // Act
      const initials = getUserInitials(user);

      // Assert
      expect(initials).toBe('U');
    });

    it('should return "U" when user object is undefined', () => {
      // Arrange
      const user = undefined;

      // Act
      const initials = getUserInitials(user);

      // Assert
      expect(initials).toBe('U');
    });

    it('should return "U" when user has no identifiable fields', () => {
      // Arrange
      const user = {};

      // Act
      const initials = getUserInitials(user);

      // Assert
      expect(initials).toBe('U');
    });

    it('should ignore display_name if it equals "User"', () => {
      // Arrange
      const user = {
        display_name: 'User',
        email: 'fallback@example.com',
      };

      // Act
      const initials = getUserInitials(user);

      // Assert
      expect(initials).toBe('F');
    });

    it('should prefer first_name and last_name over display_name', () => {
      // Arrange
      const user = {
        first_name: 'John',
        last_name: 'Doe',
        display_name: 'Jane Smith',
      };

      // Act
      const initials = getUserInitials(user);

      // Assert
      expect(initials).toBe('JD');
    });

    it('should handle single character names', () => {
      // Arrange
      const user = {
        first_name: 'A',
        last_name: 'B',
      };

      // Act
      const initials = getUserInitials(user);

      // Assert
      expect(initials).toBe('AB');
    });

    it('should handle display_name with single space-separated words', () => {
      // Arrange
      const user = {
        display_name: 'X Y',
      };

      // Act
      const initials = getUserInitials(user);

      // Assert
      expect(initials).toBe('XY');
    });

    it('should limit initials to 2 characters maximum', () => {
      // Arrange
      const user = {
        display_name: 'John Peter Smith',
      };

      // Act
      const initials = getUserInitials(user);

      // Assert
      expect(initials.length).toBeLessThanOrEqual(2);
      expect(initials).toBe('JP');
    });

    it('should handle display_name with extra spaces', () => {
      // Arrange
      const user = {
        display_name: '  Jane   Smith  ',
      };

      // Act
      const initials = getUserInitials(user);

      // Assert
      expect(initials).toBe('JS');
    });
  });

  describe('getUserDisplayName', () => {
    it('should return full name from first_name and last_name', () => {
      // Arrange
      const user = {
        first_name: 'John',
        last_name: 'Doe',
      };

      // Act
      const displayName = getUserDisplayName(user);

      // Assert
      expect(displayName).toBe('John Doe');
    });

    it('should return display_name when first_name and last_name are absent', () => {
      // Arrange
      const user = {
        display_name: 'Jane Smith',
      };

      // Act
      const displayName = getUserDisplayName(user);

      // Assert
      expect(displayName).toBe('Jane Smith');
    });

    it('should return email when first_name, last_name, and valid display_name are absent', () => {
      // Arrange
      const user = {
        email: 'test.user@example.com',
      };

      // Act
      const displayName = getUserDisplayName(user);

      // Assert
      expect(displayName).toBe('test.user@example.com');
    });

    it('should return "User" when user object is null', () => {
      // Arrange
      const user = null;

      // Act
      const displayName = getUserDisplayName(user);

      // Assert
      expect(displayName).toBe('User');
    });

    it('should return "User" when user object is undefined', () => {
      // Arrange
      const user = undefined;

      // Act
      const displayName = getUserDisplayName(user);

      // Assert
      expect(displayName).toBe('User');
    });

    it('should return "User" when user has no identifiable fields', () => {
      // Arrange
      const user = {};

      // Act
      const displayName = getUserDisplayName(user);

      // Assert
      expect(displayName).toBe('User');
    });

    it('should ignore display_name if it equals "User"', () => {
      // Arrange
      const user = {
        display_name: 'User',
        email: 'fallback@example.com',
      };

      // Act
      const displayName = getUserDisplayName(user);

      // Assert
      expect(displayName).toBe('fallback@example.com');
    });

    it('should ignore email if it equals "user@example.com"', () => {
      // Arrange
      const user = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'user@example.com',
      };

      // Act
      const displayName = getUserDisplayName(user);

      // Assert
      expect(displayName).toBe('John Doe');
    });

    it('should fallback to "User" when email is "user@example.com" and no other fields present', () => {
      // Arrange
      const user = {
        email: 'user@example.com',
      };

      // Act
      const displayName = getUserDisplayName(user);

      // Assert
      expect(displayName).toBe('User');
    });

    it('should prefer first_name and last_name over display_name', () => {
      // Arrange
      const user = {
        first_name: 'John',
        last_name: 'Doe',
        display_name: 'Jane Smith',
        email: 'different@example.com',
      };

      // Act
      const displayName = getUserDisplayName(user);

      // Assert
      expect(displayName).toBe('John Doe');
    });

    it('should handle names with special characters', () => {
      // Arrange
      const user = {
        first_name: "O'Brien",
        last_name: 'García-López',
      };

      // Act
      const displayName = getUserDisplayName(user);

      // Assert
      expect(displayName).toBe("O'Brien García-López");
    });

    it('should handle single character names', () => {
      // Arrange
      const user = {
        first_name: 'A',
        last_name: 'B',
      };

      // Act
      const displayName = getUserDisplayName(user);

      // Assert
      expect(displayName).toBe('A B');
    });

    it('should preserve whitespace in display_name', () => {
      // Arrange
      const user = {
        display_name: 'Jane  Marie  Smith',
      };

      // Act
      const displayName = getUserDisplayName(user);

      // Assert
      expect(displayName).toBe('Jane  Marie  Smith');
    });

    it('should handle empty string first_name gracefully', () => {
      // Arrange
      const user = {
        first_name: '',
        last_name: 'Doe',
        display_name: 'Jane Smith',
      };

      // Act
      const displayName = getUserDisplayName(user);

      // Assert
      expect(displayName).toBe('Jane Smith');
    });

    it('should handle empty string display_name as falsy', () => {
      // Arrange
      const user = {
        display_name: '',
        email: 'test@example.com',
      };

      // Act
      const displayName = getUserDisplayName(user);

      // Assert
      expect(displayName).toBe('test@example.com');
    });

    it('should handle email with special domains', () => {
      // Arrange
      const user = {
        email: 'user+tag@subdomain.co.uk',
      };

      // Act
      const displayName = getUserDisplayName(user);

      // Assert
      expect(displayName).toBe('user+tag@subdomain.co.uk');
    });
  });

  describe('edge cases and integration scenarios', () => {
    it('should handle user with all properties defined', () => {
      // Arrange
      const completeUser = {
        id: '999',
        email: 'complete@example.com',
        display_name: 'Complete User',
        first_name: 'Complete',
        last_name: 'User',
        avatar: 'https://example.com/avatar.jpg',
        is_active: true,
        is_verified: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-12-01T00:00:00Z',
        roles: ['admin'],
      };

      // Act
      const initials = getUserInitials(completeUser);
      const displayName = getUserDisplayName(completeUser);

      // Assert
      expect(initials).toBe('CU');
      expect(displayName).toBe('Complete User');
    });

    it('should handle user with mixed empty and populated fields', () => {
      // Arrange
      const user = {
        first_name: '',
        last_name: 'Smith',
        display_name: 'Display Smith',
        email: 'test@example.com',
      };

      // Act
      const initials = getUserInitials(user);
      const displayName = getUserDisplayName(user);

      // Assert
      expect(initials).toBe('DS');
      expect(displayName).toBe('Display Smith');
    });

    it('should be consistent when processing the same user multiple times', () => {
      // Arrange
      const user = {
        first_name: 'Consistent',
        last_name: 'User',
        email: 'consistent@example.com',
      };

      // Act
      const initials1 = getUserInitials(user);
      const initials2 = getUserInitials(user);
      const displayName1 = getUserDisplayName(user);
      const displayName2 = getUserDisplayName(user);

      // Assert
      expect(initials1).toBe(initials2);
      expect(displayName1).toBe(displayName2);
    });

    it('should handle user object with numeric and boolean values', () => {
      // Arrange
      const user = {
        first_name: 'Test',
        last_name: 'User',
        some_count: 42,
        is_premium: true,
      };

      // Act
      const initials = getUserInitials(user);
      const displayName = getUserDisplayName(user);

      // Assert
      expect(initials).toBe('TU');
      expect(displayName).toBe('Test User');
    });

    it('should return consistent results for users with whitespace variations', () => {
      // Arrange
      const user1 = {
        first_name: 'John',
        last_name: 'Doe',
      };
      const user2 = {
        display_name: 'John Doe',
      };

      // Act
      const initials1 = getUserInitials(user1);
      const initials2 = getUserInitials(user2);

      // Assert
      expect(initials1).toBe(initials2);
      expect(initials1).toBe('JD');
    });
  });
});
