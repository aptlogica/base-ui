# Testing Strategy - E2E + Unit Testing (80%+ Coverage Plan)

## Current Status (January 7, 2026)

### ✅ Completed Tests (774/774 passing, 55 test files)

#### Unit Tests - Utils (100% coverage):
  - `dateUtils.test.ts` - 45 tests ✓
  - `dateValidation.test.ts` - 24 tests ✓
  - `dropdownHelpers.test.ts` - 29 tests ✓
  - `filterUtils.test.ts` - 9 tests ✓
  - `helpers.test.ts` - 11 tests ✓
  - `nameValidation.test.ts` - 49 tests ✓
  - `sortUtils.test.ts` - 99 tests ✓
  - `standardFieldUtils.test.ts` - 40 tests ✓
  - `validation.test.ts` - 20 tests ✓

#### Unit Tests - Hooks (Mostly complete):
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

#### Unit Tests - Components (Recently added):
- `AnnouncementBar.test.tsx` - 3 tests ✓
- `HeaderLogo.test.tsx` - 3 tests ✓
- `SkeletonComponents.test.tsx` - 4 tests ✓
- `AdministratorSettingsButton.test.tsx` - 6 tests ✓
- `ErrorBoundary.test.tsx` - 4 tests ✓
- `Tabs.test.tsx` - 3 tests ✓
- `JIRA Roadmap: Unit Testing + E2E

### EPIC: Unit Testing (Core Modules) - Continue/Complete

**Current state:** 774 tests passing. Next: fill gaps in useApi, useBaseAccess, useNavigation.

#### PRIORITY 1: useApi.ts - 50+ tests (1–2 weeks)
- `HeaderWorkspaceDropdown.test.tsx` - 5 tests ✓

#### Unit Tests - Other:
- RouteContext tests - 5 tests ✓
- NavigationPlugin tests - 5 tests ✓
- Config/context tests - 4 tests ✓

---

## Overview: Two-Track Testing Strategy

### Scope Definition
**In scope (80% coverage target):**
- `src/hooks/` (data, access, navigation, UI utilities)
- `src/utils/` (helpers, validation, data transforms, etc.)
- `src/stores/` (Zustand state management)
- `src/contexts/` (React contexts)
- `src/service/` (API client service)
- `src/components/common/` (reusable header/UI components)
- `src/pages/` (page-level components)

**Out of scope (excluded from coverage):**
- `src/plugins/` (view plugins: Grid, Kanban, Gantt, Gallery, Calendar, Form – tested via E2E)
- `sdk/` (external SDK package, out of tree)
- `src/test/` (test utilities)
- `dist/`, `node_modules/`, test files (`*.test.ts`, `*.spec.ts`)

**Result:** Realistic 80% coverage on core app logic; plugins exercised via E2E journeys.

---

### Track 1: Unit Testing (Fast feedback loop, deterministic)
- Focus: utilities, hooks, state management, permission logic, isolated components (excluding plugins)
- Framework: Vitest + React Testing Library
- Coverage threshold: 80% on core modules (hooks/utils/stores/contexts/service/pages/common components)
- Execution time: ~10–15 seconds
- Estimated effort to reach 80%: **2–3 weeks** (continue on API hooks + access control)

### Track 2: E2E Testing (Real browser, real app behavior)
- Focus: user journeys, integration across features, plugin views, auth flows
- Framework: Playwright
- Coverage metric: Journey coverage (major workflows executed end-to-end)
- Execution time: ~5–10 minutes (depending on test count)
- Estimated effort: **3–6 weeks** (depending on backend setup + plugin complexity)

**Combined goal:** 80%+ code coverage (unit) + critical journey coverage (E2E) by end of Q1 2026.

---

**Story breakdown:**
- **B1: Query wrapper + test harness** (0.5–1 day): QueryClient setup, retry logic disabled, deterministic mocking
- **B2: Workspace queries** (1–2 days): useWorkspaces, useWorkspaceById, useWorkspaceMembers, etc.
- **B3: Base/Table/View queries** (1–2 days): useBaseTables, useTable, useTableViews, useViewById, etc.
- **B4: Mutation batch #1 – CRUD** (2–3 days): create/update/delete workspace/base/table/view/field
- **B5: Mutation batch #2 – Members/Rows** (1–2 days): member add/remove, bulk ops, row mutations

**Hooks to cover:**
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
---

#### PRIORITY 2: useBaseAccess.ts + useWorkspaceAccess.ts - 15+ tests (3–5 days)
**Goal:** Exhaustive permission matrix for all operations (create/edit/delete table/view/field/record).

**Hooks to cover:**
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
```

---

## E2E Testing Roadmap (Playwright)

### EPIC E2E-1: E2E Foundation (Playwright + CI-ready)
**Duration: 1–2 weeks**
- **E2E-1.1: Install & configure Playwright** (1 day)
  - Add playwright package, configure browser target (chromium)
  - Create playwright.config.ts with webServer (dev/preview)
  - Add baseURL, timeout, screenshot/video on failure
  - **DoD:** `npx playwright install && npx playwright codegen` works
  
- **E2E-1.2: Test fixtures & helpers** (1 day)
  - Create `tests/fixtures/auth.ts` (login helper, storageState)
  - Create `tests/fixtures/data.ts` (factory functions for test data)
  - Create `tests/pages/` (page objects for major UI sections)
  - **DoD:** Reusable fixtures tested locally
  
- **E2E-1.3: CI integration & reporting** (0.5 day)
  - Add `test:e2e` and `test:e2e:ui` scripts to package.json
  - Configure HTML report output + artifact upload (if using GitHub Actions)
  - **DoD:** E2E tests run in CI and generate readable reports

---

### EPIC E2E-2: Test Environment & Data Strategy
**Duration: 2–5 weeks** (depends on backend readiness)
- **E2E-2.1: Choose data strategy** (decide with team)
  - **Option A (Real backend):** Setup seeded workspace/base/tables/users that never change
  - **Option B (Mocked API):** Playwright route interception with JSON fixtures
  - **Decision:** Recommend Option A if backend team can provide stable test tenant; Option B if API is volatile
  - **DoD:** Data source documented, test data reproducible

- **E2E-2.2: Implement chosen strategy** (1–3 days)
  - If Option A: Document how to reset test data; create seed script if needed
  - If Option B: Build fixtures for all major API endpoints; mock in beforeEach()
  - **DoD:** Tests pass consistently when run multiple times

---

### EPIC E2E-3: Authentication Flow
**Duration: 1–3 weeks**
- **E2E-3.1: Login/OTP journey** (1–2 days)
  - Test email login → OTP entry → token storage → navigation to homepage
  - Use real auth if possible, or stub with direct token injection
  - **DoD:** Login test passes, subsequent tests preserve auth state
  
- **E2E-3.2: Session persistence** (0.5–1 day)
  - Save authenticated session state (storageState.json) for reuse across tests
  - Unit Test File Structure (Vitest)
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

### E2E Test File Structure (P (Unit Testing)

| Category | Target | Current | Gap | Timeline |
|----------|--------|---------|-----|----------|
| Utils | 95%+ | ✅ ~95% | Complete | Done |
| Hooks - UI | 85%+ | ✅ ~90% | Complete | Done |
| Hooks - Data (useApi) | 85%+ | ~0% | 50+ tests | 1–2 wks |
| Hooks - Access | 85%+ | ~40% | 15+ tests | 0.5–1 wk |
| Hooks - Navigation | 80%+ | ~20% | 15+ tests | 0.5–1 wk |
| Components - Common | 75%+ | ~20% | ~20 tests | 1 wk |
| Services | 80%+ | ~10% | 30+ tests | 1–2 wks |
| **Overall Core Modules** | **80%+** | **~35%** | **150+ tests** | **2–3 weeks** |

### E2E Journey Coverage Goals

| Journey | Stories | Est. Tests | Timeline |
|---------|---------|-----------|----------|
| Foundation (Playwright setup) | 3 | - | 1–2 days |
| Data strategy | 2 | - | 2–5 days |
| Auth + Session | 3 | (Combined Unit + E2E)

### Phase 1: Unit Testing (Weeks 1–3)
Complete the highest-ROI hooks to reach 80% on core modules.
- **Week 1:** useApi.ts (50+ tests, queries + mutations)
- **Week 2:** useBaseAccess + useWorkspaceAccess (15+ tests, permission matrix)
- **Week 3:** useNavigation + useNavigationActions (15+ tests, state/routing)

**Parallel:** Start E2E foundation (playwright install, fixtures, page objects) **→ 1 day effort**.

### Phase 2: E2E Testing (Weeks 4–6)
Build core journeys + plugin coverage; aim for "every major UI path executed at least once".
- **Week 4:** Data strategy + auth flow + core journeys (workspace/base selection, table CRUD)
- **Week 5:** Plugin views (Grid, Kanban, Gallery, Gantt)
- **Week 6:** Permissions testing + stabilization

**Parallel:** Instrument build for code coverage (optional, if E2E coverage required) **→ 1 day effort**.

### Phase 3: Validation (Week 7)
- Run full unit + E2E suite
- Verify 80%+ code coverage (unit) + journey coverage (E2E)
- Fix flakes, stabilize CI
- Document test data setup + how to run locally/CI
### EPIC E2E-6: Permissions & Read-only (Critical for UX)
**Duration: 1–2 weeks**
**Goal:** Verify permission-based UI (buttons/modals hidden, "Read only" labels, etc).

- **E2E-6.1: Viewer role journey** (0.5 day)
  - Log in as viewer → verify "Read only" tag → verify no edit/delete buttons → navigation works
  - **DoD:** UI correctly restricted for viewer

- **E2E-6.2: Maintainer role journey** (0.5 day)
  - Log in as maintainer → create table, edit record → verify admin buttons hidden
  - **DoD:** Maintainer has correct privileges
Unit Tests (Vitest)

```bash
# Run all unit tests
npm test

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test -- useApi.test.ts

# Watch mode (rebuild on file change)
npm test -- --watch

# UI mode (interactive test viewer)
npm test:ui
```

**Coverage reports:**
```
coverage-vitest/
├── lcov-report/index.html  # View in browser
├── coverage-final.json
└── coverage-summary.json
```

---

### E2E Tests (Playwright)

```bash
# Install browser binaries (first time)
npx playwright install
Summary: Effort & Timeline

### Unit Testing (Core Modules)
- **Current:** 774 tests, ~35% code coverage on scoped modules
- **Target:** 80%+ on hooks/utils/stores/contexts/service
- **Work:** ~150 new tests (API hooks, access control, navigation)
- **Timeline:** 2–3 weeks
- **Team:** 1 engineer

### E2E Testing
- **Current:** 0 tests
- **Target:** 50–70 tests covering all major journeys + plugins
- **Work:** Playwright setup + 7 epics (auth, core journeys, plugin coverage, permissions)
- **Timeline:** 3–6 weeks (depends on backend data stability)
- **Team:** 1–2 engineers (if plugins complex)

### Combined Goal
- **80%+ code coverage** via unit tests on core modules
- **Critical journey coverage** via E2E tests (every major workflow executed)
- **Total effort:** 5–9 weeks for 1 engineer (or 3–6 weeks if 2 engineers in parallel)
- **Target completion:** End of Q1 2026

---

## Jira Epics Template (Ready to Create)

### Unit Testing Epics
1. **UNIT-API: useApi.ts Tests** (50 tests, 1–2 weeks)
2. **UNIT-ACCESS: Access Control Tests** (15 tests, 0.5–1 week)
3. **UNIT-NAV: Navigation Tests** (15 tests, 0.5–1 week)

### E2E Testing Epics
1. **E2E-FOUND: Playwright Foundation** (1–2 days)
2. **E2E-DATA: Test Environment & Data** (2–5 days)
3. **E2E-AUTH: Authentication Flow** (1–3 days)
4. **E2E-CORE: Core User Journeys** (1–2 weeks)
5. **E2E-PLUGINS: Plugin/View Coverage** (2–4 weeks)
6. **E2E-PERMS: Permissions & Read-only** (1–2 weeks)
7. **E2E-COVERAGE: Code Coverage Instrumentation** (2–4 days, optional)

---

## Decision Points (For Planning)

**Before starting E2E, align on:**
1. **Backend for testing:** Real test tenant or mocked API?
2. **Code coverage requirement:** Must E2E tests contribute to the 80% code coverage gate?
3. **Browser support:** Chromium only, or also Firefox/Safari?
4. **CI integration:** GitHub Actions / other?

**Answers will adjust timelines (±1 week depending on setup complexity).**
npx playwright show-report
```

**Setup for local development:**
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run E2E tests
npm run test:e2eI** (0.5 day)
  - Add coverage threshold check in GitHub Actions
  - Fail if overall coverage drops below target
  - **DoD:** CI enforces 80%+ coverage from combined unit + E2E testsi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => 
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
