# Testing Setup

This project uses **Vitest** for unit testing with **React Testing Library** for component testing.

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI (visual interface)
npm run test:ui
```

## Test Structure

```
src/
  test/
    setup.ts              # Global test setup and mocks
    utils/
      testUtils.tsx       # Custom render utilities with providers
  utils/
    __tests__/
      helpers.test.ts     # Example test file
```

## Writing Tests

### Testing Utility Functions

```typescript
import { describe, it, expect } from 'vitest';
import { formatCompactNumber } from '../helpers';

describe('formatCompactNumber', () => {
  it('should format numbers correctly', () => {
    expect(formatCompactNumber(1000)).toBe('1K');
  });
});
```

### Testing React Components

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@utils/testUtils';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Path Aliases

You can use path aliases in your tests:

- `@/` → `src/`
- `@components/` → `src/components/`
- `@utils/` → `src/utils/`
- `@hooks/` → `src/hooks/`
- `@types/` → `src/types/`
- `@service/` → `src/service/`
- `@stores/` → `src/stores/`

## Coverage Goals

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

## Test Utilities

### `renderWithProviders`

Automatically wraps components with:
- `QueryClientProvider` (React Query)
- `BrowserRouter` (React Router)

```typescript
import { renderWithProviders } from '@utils/testUtils';

renderWithProviders(<MyComponent />);
```

## Mocking

Common mocks are set up in `src/test/setup.ts`:
- `window.matchMedia`
- `ResizeObserver`
- `IntersectionObserver`

## Best Practices

1. **Test user behavior, not implementation**
2. **Use `getByRole` and `getByLabelText` when possible**
3. **Keep tests simple and focused**
4. **Mock external dependencies**
5. **Test edge cases and error scenarios**

