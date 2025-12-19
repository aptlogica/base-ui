# Testing Examples - Learning by Doing

This file contains progressive examples using YOUR actual codebase. Start with Example 1 and work your way up!

---

## Example 1: Testing a Simple Pure Function (Easiest!)

**File:** `src/utils/validation.ts`  
**Function:** `validateEmail`

### The Code:
```typescript
export const validateEmail = (value: string): string | null => {
  if (!value || !value.trim()) return 'This field is required';
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  return ok ? null : 'Please enter a valid email address';
};
```

### The Test:
```typescript
import { describe, it, expect } from 'vitest';
import { validateEmail } from '../validation';

describe('validateEmail', () => {
  // Test 1: Happy path - valid email
  it('should return null for valid email', () => {
    const result = validateEmail('test@example.com');
    expect(result).toBeNull(); // null means "no error"
  });

  // Test 2: Empty input
  it('should return error for empty string', () => {
    const result = validateEmail('');
    expect(result).toBe('This field is required');
  });

  // Test 3: Invalid email format
  it('should return error for invalid email', () => {
    const result = validateEmail('not-an-email');
    expect(result).toBe('Please enter a valid email address');
  });

  // Test 4: Edge case - whitespace
  it('should trim whitespace', () => {
    const result = validateEmail('  test@example.com  ');
    expect(result).toBeNull(); // Should work after trimming
  });

  // Test 5: Multiple valid formats
  it('should accept various valid email formats', () => {
    expect(validateEmail('user@domain.com')).toBeNull();
    expect(validateEmail('user.name@domain.co.uk')).toBeNull();
    expect(validateEmail('user+tag@example.com')).toBeNull();
  });
});
```

**Key Learning Points:**
- ✅ Test the happy path (normal case)
- ✅ Test edge cases (empty, whitespace)
- ✅ Test invalid inputs
- ✅ Test multiple valid formats

---

## Example 2: Testing a Function with Multiple Conditions

**File:** `src/utils/validation.ts`  
**Function:** `validatePasswordStrength`

This function is more complex - it checks 7 different things!

### The Code:
```typescript
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
  // ... more properties
}
```

### The Test:
```typescript
import { describe, it, expect } from 'vitest';
import { validatePasswordStrength } from '../validation';

describe('validatePasswordStrength', () => {
  // Test 1: Perfect password (all 7 requirements met)
  it('should validate a strong password', () => {
    const result = validatePasswordStrength(
      'MyStr0ng!Pass',
      'John',
      'Doe',
      'john@example.com'
    );
    
    expect(result.isValid).toBe(true);
    expect(result.strength).toBe(7); // All 7 checks passed
    expect(result.hasLength).toBe(true);
    expect(result.hasUpper).toBe(true);
    expect(result.hasLower).toBe(true);
    expect(result.hasNumber).toBe(true);
    expect(result.hasSymbol).toBe(true);
  });

  // Test 2: Weak password (missing requirements)
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
  });

  // Test 3: Password containing name (should fail)
  it('should reject password containing first name', () => {
    const result = validatePasswordStrength(
      'John123!Pass', // Contains "John"
      'John',
      'Doe',
      'john@example.com'
    );
    
    expect(result.containsNameAndEmail).toBe(false);
  });

  // Test 4: Password with common words (should fail)
  it('should reject password with common words', () => {
    const result = validatePasswordStrength(
      'password123!', // Contains "password"
      '',
      '',
      ''
    );
    
    expect(result.containsCommon).toBe(false);
  });
});
```

**Key Learning Points:**
- ✅ Test complex functions by checking each property
- ✅ Test both valid and invalid cases
- ✅ Test edge cases (empty names, common words)

---

## Example 3: Testing Array/Collection Functions

**File:** `src/utils/filterUtils.ts`  
**Function:** `parseMultiSelectValue`

### The Code:
```typescript
export const parseMultiSelectValue = (val: any): string[] => {
  if (Array.isArray(val)) {
    return val.map((item: any) => {
      if (item && typeof item === 'object' && 'option' in item) {
        return String(item.option);
      }
      return String(item);
    });
  }
  // ... more logic
};
```

### The Test:
```typescript
import { describe, it, expect } from 'vitest';
import { parseMultiSelectValue } from '../filterUtils';

describe('parseMultiSelectValue', () => {
  // Test 1: Already an array of strings
  it('should return array of strings as-is', () => {
    const result = parseMultiSelectValue(['apple', 'banana', 'cherry']);
    expect(result).toEqual(['apple', 'banana', 'cherry']);
  });

  // Test 2: Array of objects with 'option' property
  it('should extract option from objects', () => {
    const result = parseMultiSelectValue([
      { option: 'red' },
      { option: 'blue' },
      { option: 'green' }
    ]);
    expect(result).toEqual(['red', 'blue', 'green']);
  });

  // Test 3: Mixed array
  it('should handle mixed array', () => {
    const result = parseMultiSelectValue([
      'apple',
      { option: 'banana' },
      123 // number
    ]);
    expect(result).toEqual(['apple', 'banana', '123']);
  });

  // Test 4: JSON string input
  it('should parse JSON string', () => {
    const result = parseMultiSelectValue('["red", "blue"]');
    expect(result).toEqual(['red', 'blue']);
  });

  // Test 5: Empty input
  it('should handle empty input', () => {
    expect(parseMultiSelectValue([])).toEqual([]);
    expect(parseMultiSelectValue('')).toEqual([]);
  });
});
```

**Key Learning Points:**
- ✅ Test different input types (array, string, object)
- ✅ Test edge cases (empty, mixed types)
- ✅ Use `toEqual` for arrays/objects (not `toBe`)

---

## Example 4: Testing Functions with Side Effects (Mocking)

**File:** `src/utils/helpers.ts`  
**Function:** `debounce`

This function uses `setTimeout` - a side effect!

### The Code:
```typescript
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
```

### The Test:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '../helpers';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers(); // Mock timers
  });

  afterEach(() => {
    vi.useRealTimers(); // Restore real timers
  });

  it('should delay function execution', () => {
    const mockFn = vi.fn(); // Create a mock function
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled(); // Not called yet

    vi.advanceTimersByTime(100); // Fast-forward time
    expect(mockFn).toHaveBeenCalledTimes(1); // Now called
  });

  it('should cancel previous calls', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn(); // Call 1
    debouncedFn(); // Call 2 (should cancel call 1)
    debouncedFn(); // Call 3 (should cancel call 2)

    vi.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1); // Only last call executed
  });
});
```

**Key Learning Points:**
- ✅ Use `vi.fn()` to create mock functions
- ✅ Use `vi.useFakeTimers()` to control time
- ✅ Use `vi.advanceTimersByTime()` to fast-forward
- ✅ Always restore timers in `afterEach`

---

## Example 5: Testing React Hooks

**File:** `src/hooks/useFrontendPagination.ts`

### The Code:
```typescript
export function useFrontendPagination<T>({
  data,
  pageSize = 30,
  initialPage = 1,
}: UseFrontendPaginationOptions<T>): UseFrontendPaginationReturn<T> {
  // ... implementation
}
```

### The Test:
```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFrontendPagination } from '../useFrontendPagination';

describe('useFrontendPagination', () => {
  const testData = Array.from({ length: 100 }, (_, i) => i + 1); // [1, 2, 3, ..., 100]

  it('should paginate data correctly', () => {
    const { result } = renderHook(() =>
      useFrontendPagination({ data: testData, pageSize: 30 })
    );

    // Initially should show first 30 items
    expect(result.current.allLoadedData).toHaveLength(30);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.totalItems).toBe(100);
  });

  it('should load more pages', () => {
    const { result } = renderHook(() =>
      useFrontendPagination({ data: testData, pageSize: 30 })
    );

    // Load next page
    act(() => {
      result.current.loadNextPage();
    });

    // Should now have 60 items
    expect(result.current.allLoadedData).toHaveLength(60);
    expect(result.current.hasMore).toBe(true);
  });

  it('should detect when all pages are loaded', () => {
    const { result } = renderHook(() =>
      useFrontendPagination({ data: testData, pageSize: 30 })
    );

    // Load all pages
    act(() => {
      result.current.loadNextPage(); // Page 2
      result.current.loadNextPage(); // Page 3
      result.current.loadNextPage(); // Page 4
    });

    expect(result.current.allLoadedData).toHaveLength(100);
    expect(result.current.hasMore).toBe(false);
  });
});
```

**Key Learning Points:**
- ✅ Use `renderHook` to test hooks
- ✅ Use `act()` when triggering state changes
- ✅ Test initial state, state changes, and final state

---

## Example 6: Testing React Components (Advanced)

**File:** `src/components/ui/Loader.tsx`

### The Test:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@test/utils/testUtils';
import Loader from '../Loader';

describe('Loader', () => {
  it('should render loading spinner', () => {
    render(<Loader />);
    
    // Check if spinner element exists
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toBeInTheDocument();
  });

  it('should accept size prop', () => {
    const { container } = render(<Loader size={10} />);
    const spinner = container.querySelector('.spinner');
    expect(spinner).toHaveStyle({ width: '10px', height: '10px' });
  });
});
```

**Key Learning Points:**
- ✅ Use `render` from test utils (includes providers)
- ✅ Use `screen` queries to find elements
- ✅ Test props and their effects
- ✅ Use `getByRole` when possible (most accessible)

---

## Practice Exercises

Try writing tests for these functions yourself:

1. **Easy:** `src/utils/helpers.ts` → `convertDateFormat`
2. **Medium:** `src/utils/validation.ts` → `validatePassword`
3. **Hard:** `src/hooks/useFrontendPagination.ts` → Full hook test

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Testing Implementation Details
```typescript
// BAD: Testing internal variable
expect(component.state.count).toBe(5);

// GOOD: Testing what user sees
expect(screen.getByText('5')).toBeInTheDocument();
```

### ❌ Mistake 2: Not Testing Edge Cases
```typescript
// BAD: Only testing happy path
it('should work', () => {
  expect(formatNumber(100)).toBe('100');
});

// GOOD: Testing multiple scenarios
it('should format numbers', () => {
  expect(formatNumber(100)).toBe('100');
  expect(formatNumber(0)).toBe('0');
  expect(formatNumber(-5)).toBe('-5');
  expect(formatNumber(1000)).toBe('1K');
});
```

### ❌ Mistake 3: Tests That Always Pass
```typescript
// BAD: This always passes!
it('should work', () => {
  expect(true).toBe(true);
});

// GOOD: Actually tests something
it('should format 1000 as 1K', () => {
  expect(formatCompactNumber(1000)).toBe('1K');
});
```

---

## Next Steps

1. ✅ Read this guide
2. ✅ Look at `src/utils/__tests__/helpers.test.ts` (real example)
3. ✅ Try writing a test for `validateEmail` yourself
4. ✅ Run `npm test` to see your tests pass
5. ✅ Gradually add more tests as you learn

Happy Testing! 🎉

