# Testing Strategy - Unit Testing (80%+ Coverage Goal)

## 🎯 Current Status (Updated: January 2026)

### Test Statistics
- **Total Test Files:** 92 (49 `.test.ts` + 43 `.test.tsx`)
- **Total Tests:** ~750+ tests
- **Current Coverage:** ~35% (estimated, needs verification)
- **Target Coverage:** 80%+ (lines, functions, branches, statements)
- **Test Framework:** Vitest with v8 coverage provider
- **Coverage Thresholds:** 80% (configured in `vitest.config.ts`)

### ⚠️ Test Failures (Blocking Coverage)
- **useNavigation.test.ts:** 21 tests failing (routing refactoring)
- **useWorkspaceBusinessLogic.test.ts:** 61 tests failing (hook refactoring)
- **Total Failing:** ~82 tests need fixes

---

## ✅ Completed Test Coverage

### High Coverage Areas (80%+)
- **Utils:** 100% coverage
  - `dateUtils.ts`, `validation.ts`, `helpers.ts`, `nameValidation.ts`
  - `dateValidation.ts`, `sortUtils.ts`, `filterUtils.ts`
  - `fieldUtils.ts`, `fieldType.ts`, `dropdownHelpers.ts`
  - `standardFieldUtils.ts`, `pluginUtils.ts`, `configSync.ts`
  - `navigationPersistence.ts`, `navigationIndex.ts`, `navigationRedirect.ts`
  - `viewConfig.ts`, `viewType.ts`, `viewFieldConfigUtils.ts`
  - `tableDataAdapter.ts`, `dataTransform.ts`, `fieldUsageUtils.ts`
  - `viewDiagnostics.ts`, `initialValues.ts`, `componentOptions.ts`
  - `createMockSemver.ts`, `PluginConfigManager.ts`

- **Hooks - UI:** 90% coverage
  - `useClickOutside.ts`, `useSearch.ts`, `useSmartPopover.ts`
  - `useUniqueTwoDigit.tsx`, `useFrontendPagination.ts`

- **Service Layer:** Good coverage
  - `clientService.ts` - 155 tests ✅
  - `activityService.ts` - Tests exist ✅

### Medium Coverage Areas (50-80%)
- **API Hooks:** ~170 tests for `useApi.ts` ✅
  - Query hooks: useWorkspaces, useWorkspaceById, useWorkspaceBases, etc.
  - Mutation hooks: CRUD operations, member operations
  - **Missing:** `useBulkDeleteRecords` hook tests ❌

- **Access Control:** Tests exist
  - `useBaseAccess.ts` - Tests exist ✅
  - `useWorkspaceAccess.ts` - Tests exist ✅

- **Auth:** 57 tests for `AuthContext.tsx` ✅
- **Navigation Store:** Tests exist ✅

### Low Coverage Areas (<50%)
- **Components - Common:** ~20% coverage
  - Some tests: HeaderLogo, Toast, Skeleton, Breadcrumb, BaseMenu
  - **Missing:** Many common components need tests

- **Components - Modals:** Partial coverage
  - Tests exist for: CreateWorkspaceModal, CreateBaseModal, CreateTableModal, etc.
  - **Missing:** DeleteBaseModal, DeleteWorkspaceModal ❌

- **Pages:** Partial coverage
  - Tests exist for: LoginPage, HomePage, AdministratorPage, etc.
  - **Missing:** Some page components

- **Hooks - Navigation:** Tests exist but failing
  - `useNavigation.ts` - 21 tests failing ❌
  - `useNavigationActions.ts` - May need updates ❌
  - `useWorkspaceBusinessLogic.ts` - 61 tests failing ❌

---

## ❌ Missing Tests (Critical for 80% Coverage)

### New Components/Hooks (No Tests)
1. **AppInitializer.tsx** - Initialization orchestration component
2. **DeleteBaseModal.tsx** - Base deletion modal
3. **DeleteWorkspaceModal.tsx** - Workspace deletion modal
4. **useWorkspaceSelection.ts** - Workspace selection hook
5. **useBulkDeleteRecords** - Bulk row deletion hook
6. **NavigationResolver.tsx** - Route resolution component (may need updates)

### Components Needing More Coverage
- **Common Components:** Many field components, dropdowns, UI elements
- **Layout Components:** Sidebar, header components
- **Workspace Components:** Tabs, modals, tables
- **Plugin Components:** Grid, Kanban, Calendar, Gallery views (lower priority)

---

## 🚨 Immediate Action Items (Priority Order)

### Phase 1: Fix Failing Tests (URGENT - 2-3 days)
**Goal:** Get all existing tests passing before adding new coverage

1. **Fix useNavigation.test.ts (21 failures)**
   - Update route patterns from old format to new format
   - Old: `/base/:baseId`, `/table/:tableId/:viewId`
   - New: `/workspace/:workspaceId/base/:baseId/table/:tableId/:viewId`
   - Update URL parsing tests
   - Verify navigation state synchronization

2. **Fix useWorkspaceBusinessLogic.test.ts (61 failures)**
   - Update for refactored hook structure
   - Test new `useWorkspaceSelection` hook separately
   - Verify state management functions

3. **Verify Other Navigation Tests**
   - `useNavigationActions.test.ts` - Check for route format issues
   - `navigationStore.test.ts` - Verify path generation

**Estimated:** 2-3 days | **Impact:** Unblocks coverage measurement

---

### Phase 2: Add Missing Tests for New Components (3-4 days)
**Goal:** Cover all new components/hooks added during refactoring

1. **AppInitializer.tsx Tests**
   - Test initialization sequence
   - Test navigation state restoration priority
   - Test sessionStorage coordination
   - Test error handling

2. **DeleteBaseModal.tsx Tests**
   - Test modal rendering
   - Test validation (name confirmation)
   - Test delete action
   - Test error handling

3. **DeleteWorkspaceModal.tsx Tests**
   - Test modal rendering
   - Test validation (name confirmation)
   - Test delete action
   - Test navigation after deletion

4. **useWorkspaceSelection.ts Tests**
   - Test workspace selection logic
   - Test fallback to first workspace
   - Test invalid workspace handling
   - Test sessionStorage coordination

5. **useBulkDeleteRecords Tests**
   - Test bulk deletion mutation
   - Test query invalidation
   - Test error handling
   - Test success notifications

**Estimated:** 3-4 days | **Impact:** +5 components/hooks covered

---

### Phase 3: Increase Component Coverage (1-2 weeks)
**Goal:** Bring component coverage from ~20% to 60%+

**Priority Components:**
1. **Common Components** (High Priority)
   - Field components (Attachment, User, SingleSelect, MultiSelect, LinksField, URL, etc.)
   - Dropdown components (RoleDropdown, AdvancedDropdown)
   - Form components
   - UI components (Loader, ErrorBoundary, etc.)

2. **Layout Components** (Medium Priority)
   - Sidebar components
   - Header components
   - Navigation components

3. **Workspace Components** (Medium Priority)
   - Workspace tabs
   - Member management components
   - User management components

**Estimated:** 1-2 weeks | **Impact:** +40-50% component coverage

---

### Phase 4: Increase Hook Coverage (1 week)
**Goal:** Cover remaining hooks and edge cases

**Priority Hooks:**
1. **Navigation Hooks** (After fixes)
   - Complete coverage for useNavigation
   - Complete coverage for useNavigationActions
   - Test edge cases and error scenarios

2. **Data Hooks**
   - useNormalizedTableData - Verify coverage
   - useLookupSourceColumn - Add tests if missing
   - useWorkspaceData - Verify coverage

3. **UI Hooks**
   - Verify all UI hooks have good coverage

**Estimated:** 1 week | **Impact:** +10-15% hook coverage

---

### Phase 5: Store & Context Coverage (3-5 days)
**Goal:** Ensure stores and contexts are well-tested

1. **Stores**
   - `navigationStore.ts` - Verify coverage, add edge cases
   - `pluginStore.ts` - Add tests if missing

2. **Contexts**
   - `RouteContext.tsx` - Verify coverage
   - `AuthContext.tsx` - Already has 57 tests ✅
   - `PluginFrameworkContext.tsx` - Add tests if missing

**Estimated:** 3-5 days | **Impact:** +5-10% coverage

---

## 📊 Coverage Roadmap to 80%+

### Current State
- **Overall Coverage:** ~35%
- **Lines:** ~35%
- **Functions:** ~35%
- **Branches:** ~35%
- **Statements:** ~35%

### Target State (80%+)
- **Overall Coverage:** 80%+
- **Lines:** 80%+
- **Functions:** 80%+
- **Branches:** 80%+
- **Statements:** 80%+

### Progress Tracking

| Phase | Focus Area | Current | Target | Status |
|-------|-----------|---------|--------|--------|
| Phase 1 | Fix Failing Tests | 82 failures | 0 failures | 🔴 Not Started |
| Phase 2 | New Components | 0% | 80%+ | 🔴 Not Started |
| Phase 3 | Component Coverage | ~20% | 60%+ | 🔴 Not Started |
| Phase 4 | Hook Coverage | ~60% | 80%+ | 🟡 In Progress |
| Phase 5 | Store/Context | ~50% | 80%+ | 🟡 In Progress |
| **Overall** | **All Areas** | **~35%** | **80%+** | 🔴 **Not Started** |

---

## 🎯 Success Criteria

### Phase 1 Complete When:
- ✅ All 82 failing tests pass
- ✅ `npm test` runs with 0 failures
- ✅ Coverage can be accurately measured

### Phase 2 Complete When:
- ✅ All 5 new components/hooks have tests
- ✅ Each has 80%+ coverage
- ✅ All tests pass

### 80%+ Coverage Achieved When:
- ✅ Overall coverage ≥ 80%
- ✅ Lines coverage ≥ 80%
- ✅ Functions coverage ≥ 80%
- ✅ Branches coverage ≥ 80%
- ✅ Statements coverage ≥ 80%
- ✅ All tests pass
- ✅ CI pipeline enforces coverage thresholds

---

## 📝 Testing Best Practices

### Test Structure
- Use AAA pattern (Arrange-Act-Assert)
- Test happy paths, error cases, and edge cases
- Mock external dependencies (API calls, router, etc.)
- Use descriptive test names

### Coverage Goals
- **Critical Paths:** 90%+ coverage
- **Business Logic:** 80%+ coverage
- **UI Components:** 70%+ coverage (interactions, rendering)
- **Utilities:** 100% coverage (already achieved ✅)

### Exclusions (Not Counted in Coverage)
- Plugin components (Grid, Kanban, Calendar, Gallery views)
- SDK folder
- Test files themselves
- Config files
- Type definition files

---

## 🚀 Quick Start Guide

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Check Coverage
```bash
# Generate coverage report
npm run test:coverage

# View HTML report
# Open: coverage-vitest/index.html
```

### Fix Failing Tests
1. Run `npm test` to see failures
2. Focus on `useNavigation.test.ts` first (21 failures)
3. Update route patterns to new format
4. Verify navigation state management
5. Repeat for `useWorkspaceBusinessLogic.test.ts` (61 failures)

---

## 📈 Estimated Timeline

### To Fix Failing Tests: 2-3 days
### To Add New Component Tests: 3-4 days
### To Reach 80% Coverage: 3-4 weeks

**Total Estimated Time:** 4-5 weeks to reach 80%+ coverage

---

## 🎯 Focus: Unit Testing Only

**Note:** This strategy focuses exclusively on unit testing to achieve 80%+ code coverage. E2E testing is deferred and not part of this plan.

**Priority:** Fix failing tests → Add missing tests → Increase coverage → Maintain 80%+ threshold
