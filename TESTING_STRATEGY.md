# Unit Testing Strategy - 80%+ Coverage Plan

## Current Status (January 5, 2026)

### ✅ Completed Tests (487/490 passing)
- **Utils** (100% coverage):
  - `dateUtils.test.ts` - 45 tests ✓
  - `dateValidation.test.ts` - 24 tests ✓
  - `dropdownHelpers.test.ts` - 29 tests ✓
  - `filterUtils.test.ts` - 9 tests ✓
  - `helpers.test.ts` - 11 tests ✓
  - `nameValidation.test.ts` - 49 tests ✓
  - `sortUtils.test.ts` - 99 tests ✓
  - `standardFieldUtils.test.ts` - 40 tests ✓
  - `validation.test.ts` - 20 tests ✓

- **Hooks** (Mostly complete):
  - `useClickOutside.test.ts` - 7 tests ✓
  - `useClientHeaders.test.ts` - 7 tests ✓
  - `useClientInitialization.test.ts` - 8 tests ✓
  - `useFrontendPagination.test.ts` - 10 tests ✓
  - `useLinkedRecordsResolver.test.ts` - 14 tests ✓
  - `useLookupSourceColumn.test.tsx` - 10 tests ✓
  - `useNormalizedTableData.test.ts` - 32 tests ✓
  - `useSearch.test.ts` - 14 tests ✓
  - `useSmartPopover.test.ts` - 16 tests ✓
  - `useUniqueTwoDigit.test.tsx` - 7 tests ✓
  - `useWorkspaceAccess.test.ts` - 15 tests ✓
  - `useWorkspaceData.test.ts` - 16 tests ✓

### ⚠️ Needs Fixing (3 failures)
- **useUserRole.test.ts** - 3 failures
  - Issue: Test expects `user_role` to persist in sessionStorage but it's cleared between renders
  - Fix: Mock sessionStorage properly or use different test approach

---

## Missing Tests - Priority Order

### 🔴 HIGH PRIORITY (Core Business Logic)

#### 1. **useApi.ts** - NO TESTS YET
**Estimated tests needed: 50+**

Critical API hooks to test:
```typescript
// Query hooks
- useWorkspaces()
- useWorkspaceById(id)
- useWorkspaceBases(workspaceId)
- useWorkspaceMembers(workspaceId)
- useBaseTables(baseId)
- useBaseMembers(baseId)
- useTable(tableId)
- useTableViews(tableId)
- useViewById(viewId)
- useAllBases()
- useAllTables()
- useAllFields()
- useAllViews()

// Mutation hooks
- useCreateWorkspace()
- useUpdateWorkspace()
- useDeleteWorkspace()
- useCreateBase()
- useUpdateBase()
- useDeleteBase()
- useCreateTable()
- useUpdateTable()
- useDeleteTable()
- useCreateView()
- useUpdateView()
- useDeleteView()
- useCreateField()
- useUpdateField()
- useDeleteField()
- useAddRow()
- useBulkAddBaseMembers()
- useRemoveBaseAccessMember()
- useRemoveUserFromBase()
```

**Test Pattern:**
```typescript
describe('useWorkspaces', () => {
  it('should fetch workspaces successfully', async () => {
    const mockData = [{ id: 'ws-1', name: 'Workspace 1' }];
    mockGetWorkspaces.mockResolvedValue({ data: mockData });
    
    const { result } = renderHook(() => useWorkspaces(), {
      wrapper: createQueryWrapper()
    });
    
    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle errors', async () => {
    const error = new Error('Failed to fetch');
    mockGetWorkspaces.mockRejectedValue(error);
    
    const { result } = renderHook(() => useWorkspaces(), {
      wrapper: createQueryWrapper()
    });
    
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
```

#### 2. **useBaseAccess.ts** - NO TESTS YET
**Estimated tests needed: 25+**

Access control logic to test:
```typescript
- canCreateTable()
- canUpdateTable()
- canDeleteTable()
- canCreateView()
- canUpdateView()
- canDeleteView()
- canCreateField()
- canUpdateField()
- canDeleteField()
- canManageRecords()
- Base-level permission checks
- Role-based access scenarios
```

#### 3. **useNavigation.ts** - NO TESTS YET
**Estimated tests needed: 15+**

Navigation state management:
```typescript
- Navigation state updates
- Workspace selection
- Base selection
- Table selection
- View selection
- URL synchronization
```

#### 4. **useNavigationActions.ts** - NO TESTS YET
**Estimated tests needed: 20+**

Navigation actions:
```typescript
- navigateToWorkspace()
- navigateToBase()
- navigateToTable()
- navigateToView()
- Navigation history
- Breadcrumb updates
```

---

### 🟡 MEDIUM PRIORITY (Supporting Features)

#### 5. **useNavigateToBaseFirstView.ts** - NO TESTS YET
**Estimated tests needed: 8+**

Test scenarios:
- Navigates to first view when base is selected
- Handles empty views
- Handles navigation errors

---

### 🟢 LOW PRIORITY (Already Working/Simple)

#### 6. **Fix useUserRole.test.ts** - 3 FAILING TESTS
**Issue:** SessionStorage mocking

**Current failures:**
```typescript
// Test expects storage to persist but it's cleared
sessionStorage.setItem('user_role', 'owner');
const { result } = renderHook(() => useUserRole());
expect(result.current.getRole()).toBe('owner'); // FAILS - returns null
```

**Solution:** Create proper storage mock
```typescript
beforeEach(() => {
  const mockStorage = new Map();
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => 
    mockStorage.get(key) || null
  );
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
    mockStorage.set(key, value);
  });
  vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
    mockStorage.clear();
  });
});
```

---

## Testing Standards & Patterns

### Test File Structure
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 1. Mock external dependencies
vi.mock('../service/clientService');

// 2. Create test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('HookName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success scenarios', () => {
    it('should handle successful operation', async () => {
      // Test implementation
    });
  });

  describe('error scenarios', () => {
    it('should handle errors gracefully', async () => {
      // Test implementation
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined inputs', () => {
      // Test implementation
    });
  });
});
```

### Coverage Goals by Category

| Category | Target | Current | Gap |
|----------|--------|---------|-----|
| Utils | 95%+ | ~95% | ✅ Complete |
| Hooks - Data | 85%+ | ~60% | Missing useApi tests |
| Hooks - Access | 85%+ | ~75% | Missing useBaseAccess |
| Hooks - Navigation | 80%+ | ~30% | Missing nav tests |
| Hooks - UI | 85%+ | ~90% | ✅ Nearly complete |
| Components | 75%+ | ~0% | Not started |
| Services | 80%+ | ~0% | Not started |

---

## Implementation Plan

### Phase 1: Fix Existing (Week 1)
- [ ] Fix useUserRole.test.ts (3 failures)
- [ ] Verify all other tests pass
- [ ] Run coverage report

### Phase 2: Critical API Tests (Week 2-3)
- [ ] Create useApi.test.ts with 50+ tests
  - [ ] All query hooks (15 tests)
  - [ ] All mutation hooks (35 tests)
- [ ] Target: 85%+ coverage for useApi.ts

### Phase 3: Access Control (Week 4)
- [ ] Create useBaseAccess.test.ts (25 tests)
- [ ] Verify permission logic for all operations
- [ ] Target: 90%+ coverage for access hooks

### Phase 4: Navigation (Week 5)
- [ ] Create useNavigation.test.ts (15 tests)
- [ ] Create useNavigationActions.test.ts (20 tests)
- [ ] Create useNavigateToBaseFirstView.test.ts (8 tests)
- [ ] Target: 80%+ coverage for navigation

### Phase 5: Integration & Cleanup (Week 6)
- [ ] Run full coverage report
- [ ] Identify gaps
- [ ] Add missing edge case tests
- [ ] Target: 80%+ overall coverage

---

## Running Tests

### Run all tests:
```bash
npm test
```

### Run with coverage:
```bash
npm test -- --coverage
```

### Run specific test file:
```bash
npm test -- useApi.test.ts
```

### Watch mode:
```bash
npm test -- --watch
```

### Coverage report location:
```
coverage/
├── lcov-report/index.html  # View in browser
└── coverage-summary.json
```

---

## Key Metrics

**Total Lines to Test:** ~5,000
**Current Test Coverage:** ~60%
**Target Coverage:** 80%+
**Tests to Add:** ~200+
**Estimated Effort:** 6 weeks

**Priority:** 
1. useApi (most critical)
2. useBaseAccess (security critical)
3. useNavigation (core UX)
4. Components (user-facing)
5. Services (backend integration)
