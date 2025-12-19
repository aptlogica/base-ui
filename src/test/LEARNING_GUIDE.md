# Unit Testing Learning Guide

## What is Unit Testing?

**Unit testing** means testing individual pieces of code (functions, components, hooks) in isolation to make sure they work correctly.

Think of it like testing each ingredient before cooking a meal - you want to know each ingredient is good before mixing them together.

## Why Test?

1. **Catch bugs early** - Find problems before users do
2. **Confidence to refactor** - Change code knowing tests will catch breaks
3. **Documentation** - Tests show how code should be used
4. **Prevent regressions** - Ensure fixes don't break again

## Basic Concepts

### 1. Test Structure

Every test has 3 parts (AAA Pattern):

```typescript
describe('functionName', () => {
  it('should do something specific', () => {
    // Arrange: Set up test data
    const input = 1000;
    
    // Act: Call the function
    const result = formatCompactNumber(input);
    
    // Assert: Check the result
    expect(result).toBe('1K');
  });
});
```

**Arrange** = Prepare your test data  
**Act** = Run the code you're testing  
**Assert** = Check if it worked correctly

### 2. Test Functions

- `describe()` - Groups related tests together
- `it()` or `test()` - Individual test case
- `expect()` - Makes assertions (checks if something is true)

### 3. Common Assertions

```typescript
expect(value).toBe(5);              // Exact equality (===)
expect(value).toEqual({a: 1});      // Deep equality for objects
expect(value).toBeTruthy();         // Is truthy (not false, null, undefined, 0, "")
expect(value).toBeFalsy();          // Is falsy
expect(value).toBeDefined();        // Is not undefined
expect(value).toBeNull();           // Is null
expect(value).toContain('text');    // Array/string contains
expect(value).toHaveLength(3);      // Array/string length
expect(value).toThrow();            // Function throws error
```

## Testing Different Types of Code

### Testing Pure Functions (Easiest!)

**Pure functions** = Same input always gives same output, no side effects

Example from your code:

```typescript
// This is a pure function - easy to test!
export function formatCompactNumber(num: number): string {
  if (num < 1000) return num.toString();
  // ... rest of logic
}
```

**Why it's easy:**
- No dependencies
- No side effects
- Predictable output

### Testing Functions with Side Effects

**Side effects** = Functions that change things outside themselves (API calls, DOM updates, etc.)

Example:
```typescript
// This has side effects - needs mocking
async function saveUser(user) {
  await api.post('/users', user);  // API call = side effect
  console.log('Saved!');           // Console = side effect
}
```

**How to test:**
- Mock the API call
- Mock console.log
- Test the behavior, not the implementation

### Testing React Components

Components are harder because they:
- Render UI
- Handle user interactions
- Manage state
- Make API calls

**Example:**
```typescript
// Simple component
function Button({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>;
}

// Test
it('should call onClick when clicked', () => {
  const handleClick = vi.fn(); // Mock function
  render(<Button onClick={handleClick}>Click me</Button>);
  
  fireEvent.click(screen.getByText('Click me'));
  
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

## Testing Patterns

### 1. Testing Happy Path (Normal Case)

Test what should happen when everything works:

```typescript
it('should format 1000 as 1K', () => {
  expect(formatCompactNumber(1000)).toBe('1K');
});
```

### 2. Testing Edge Cases

Test boundaries and unusual inputs:

```typescript
it('should handle zero', () => {
  expect(formatCompactNumber(0)).toBe('0');
});

it('should handle very large numbers', () => {
  expect(formatCompactNumber(1000000000)).toBe('1B');
});
```

### 3. Testing Error Cases

Test what happens when things go wrong:

```typescript
it('should handle invalid input', () => {
  expect(() => formatCompactNumber(null)).toThrow();
});
```

### 4. Testing Multiple Scenarios

Test different inputs:

```typescript
it('should format various numbers correctly', () => {
  expect(formatCompactNumber(100)).toBe('100');
  expect(formatCompactNumber(1000)).toBe('1K');
  expect(formatCompactNumber(1500)).toBe('1.5K');
  expect(formatCompactNumber(1000000)).toBe('1M');
});
```

## Common Testing Challenges

### Challenge 1: Testing Async Code

**Problem:** Functions that return Promises

```typescript
// Function
async function fetchUser(id) {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// Test
it('should fetch user data', async () => {
  // Mock fetch
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ id: 1, name: 'John' })
  });
  
  const user = await fetchUser(1);
  
  expect(user).toEqual({ id: 1, name: 'John' });
});
```

### Challenge 2: Testing Functions with Dependencies

**Problem:** Function uses other functions/modules

**Solution:** Mock the dependencies

```typescript
// Original function
import { api } from './api';

function saveData(data) {
  return api.post('/data', data);
}

// Test with mock
import { vi } from 'vitest';
import { api } from './api';

vi.mock('./api'); // Mock the entire module

it('should save data', async () => {
  api.post.mockResolvedValue({ success: true });
  
  await saveData({ name: 'Test' });
  
  expect(api.post).toHaveBeenCalledWith('/data', { name: 'Test' });
});
```

### Challenge 3: Testing React Hooks

**Problem:** Hooks can't be called outside components

**Solution:** Use `renderHook` from React Testing Library

```typescript
import { renderHook } from '@testing-library/react';
import { useFrontendPagination } from '../useFrontendPagination';

it('should paginate data', () => {
  const { result } = renderHook(() => 
    useFrontendPagination({ data: [1, 2, 3, 4, 5], pageSize: 2 })
  );
  
  expect(result.current.paginatedData).toHaveLength(2);
  expect(result.current.hasMore).toBe(true);
});
```

## Test Organization

### File Structure

```
src/
  utils/
    helpers.ts              # Your code
    __tests__/
      helpers.test.ts       # Tests for helpers.ts
  components/
    Button.tsx              # Your component
    __tests__/
      Button.test.tsx       # Tests for Button.tsx
```

### Naming Convention

- Test files: `*.test.ts` or `*.spec.ts`
- Keep tests close to code: `__tests__/` folder next to source

## Writing Good Tests

### ✅ DO:

1. **Test behavior, not implementation**
   ```typescript
   // Good: Tests what user sees
   expect(screen.getByText('Hello')).toBeInTheDocument();
   
   // Bad: Tests internal details
   expect(component.state.count).toBe(1);
   ```

2. **One assertion per test (when possible)**
   ```typescript
   // Good: Clear what's being tested
   it('should format 1000 as 1K', () => {
     expect(formatCompactNumber(1000)).toBe('1K');
   });
   ```

3. **Use descriptive test names**
   ```typescript
   // Good
   it('should return empty string when input is null')
   
   // Bad
   it('test1')
   ```

4. **Test edge cases**
   - Empty inputs
   - Null/undefined
   - Boundary values (0, -1, max)
   - Invalid inputs

### ❌ DON'T:

1. **Don't test implementation details**
   ```typescript
   // Bad: Testing internal variable
   expect(component.internalCounter).toBe(5);
   ```

2. **Don't test third-party libraries**
   ```typescript
   // Bad: Testing React itself
   expect(React.useState).toHaveBeenCalled();
   ```

3. **Don't write tests that always pass**
   ```typescript
   // Bad: This always passes
   it('should work', () => {
     expect(true).toBe(true);
   });
   ```

## Real Examples from Your Codebase

Let's look at actual examples from your project...

