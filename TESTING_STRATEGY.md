# Testing Strategy - E2E + Unit Testing (80%+ Coverage Plan)

## Current Status (January 8, 2026)

### ✅ Unit Testing Progress: 774/774 passing (55 test files)
**Code Coverage Status:** ~35% overall (based on last coverage run)

#### Completed Unit Tests:
- **Utils:** 100% coverage (dateUtils, validation, helpers, etc.) ✅
- **Hooks - UI:** 90% coverage (useClickOutside, useSearch, etc.) ✅  
- **Components - Common:** 20% coverage (HeaderLogo, Toast, Skeleton, etc.) ✅
- **Contexts/Config:** Basic coverage (RouteContext, NavigationPlugin) ✅

#### Missing Unit Tests (Critical for 80% core coverage):
- **useApi.ts:** 0% coverage (50+ tests needed - queries/mutations) ❌
- **useBaseAccess.ts:** 0% coverage (25+ tests needed - permissions) ❌
- **useNavigation.ts:** 0% coverage (15+ tests needed - routing) ❌
- **Service layer:** 10% coverage (clientService, activityService) ❌

---

### ❌ E2E Testing Progress: 0% complete
**Status:** No Playwright setup, no E2E tests exist yet

---

## Testing Approach for 80%+ Coverage

### Two-Track Strategy

**Track 1: Unit Testing (Code Coverage)**
- **Goal:** 80%+ code coverage on core modules 
- **Scope:** hooks/utils/stores/contexts/service/pages/common components
- **Exclude:** plugins (Grid/Kanban/Gantt/etc), SDK folder
- **Timeline:** 2-3 weeks (150+ tests needed)
- **Current gap:** API hooks, access control, navigation, service layer

**Track 2: E2E Testing (Journey Coverage)**  
- **Goal:** Critical user workflows covered end-to-end
- **Scope:** Real browser testing of plugin views + auth + permissions
- **Framework:** Playwright (not yet installed)
- **Timeline:** 3-6 weeks (50-70 tests, depending on backend approach)

---

## JIRA EPICS & STORIES (Ready to Create)

### 🔥 UNIT TESTING EPICS (Priority: Complete first for 80% coverage)

#### **EPIC UT-1: API Data Layer Tests**
**Story Points:** 13 | **Duration:** 1.5-2 weeks | **Priority:** P0 (Critical)

**Stories:**
- **UT-1.1:** Setup React Query test wrapper & mocks (3 pts, 1 day)
  - Create QueryClient wrapper with retry disabled  
  - Mock clientService.ts with vi.mock
  - **DoD:** Test harness ready for hook testing

- **UT-1.2:** Query hooks tests (5 pts, 2-3 days)  
  - Test: useWorkspaces, useWorkspaceById, useWorkspaceBases, useWorkspaceMembers
  - Test: useBaseTables, useBaseMembers, useTable, useTableViews, useViewById
  - **DoD:** All query hooks have success/error/loading tests

- **UT-1.3:** Mutation hooks tests (5 pts, 2-3 days)
  - Test: CRUD operations (create/update/delete workspace/base/table/view/field)
  - Test: Member operations (add/remove members, bulk operations)
  - **DoD:** All mutations have success/error/optimistic update tests

#### **EPIC UT-2: Access Control & Permissions**  
**Story Points:** 8 | **Duration:** 1 week | **Priority:** P0 (Critical)

**Stories:**
- **UT-2.1:** Base access permission matrix (5 pts, 3 days)
  - Test useBaseAccess: canCreateTable, canUpdateTable, canDeleteTable
  - Test canCreateView, canUpdateView, canDeleteView, canCreateField, etc.
  - Test role scenarios: owner, maintainer, viewer, read-only
  - **DoD:** All permission methods tested with role combinations

- **UT-2.2:** Workspace access edge cases (3 pts, 2 days)  
  - Test useWorkspaceAccess inheritance and read-only flags
  - Test role transitions and permission changes
  - **DoD:** Edge cases covered, access logic validated

#### **EPIC UT-3: Navigation & Routing**
**Story Points:** 5 | **Duration:** 3-4 days | **Priority:** P1 (High)

**Stories:**
- **UT-3.1:** Navigation state management (3 pts, 2 days)
  - Test useNavigation: workspace/base/table/view selection 
  - Test URL synchronization and state updates
  - **DoD:** Navigation state changes work correctly

- **UT-3.2:** Route visibility & component rendering (2 pts, 1-2 days)
  - Test RouteContext component visibility logic
  - Test useNavigationActions: navigateToWorkspace, navigateToBase, etc.
  - **DoD:** Route-based rendering works as expected

---

### 🎭 E2E TESTING EPICS (After unit tests reach 80%)

#### **EPIC E2E-1: Foundation Setup**
**Story Points:** 8 | **Duration:** 2-3 days | **Priority:** P2 (Medium)

**Stories:**
- **E2E-1.1:** Install & configure Playwright (3 pts, 1 day)
  - Add @playwright/test package
  - Create playwright.config.ts (browser: chromium, webServer: npm run dev)
  - Add scripts: test:e2e, test:e2e:ui  
  - **DoD:** `npx playwright install && npx playwright test --dry-run` works

- **E2E-1.2:** Test fixtures & page objects (3 pts, 1 day)
  - Create tests/fixtures/auth.ts (login helpers)
  - Create tests/pages/ (HomePage, WorkspacePage, TablePage classes)  
  - **DoD:** Reusable test utilities exist and work locally

- **E2E-1.3:** CI integration (2 pts, 0.5-1 day)
  - Configure HTML report generation  
  - Add screenshot/video on failure
  - **DoD:** Tests run in CI, generate reports

#### **EPIC E2E-2: Authentication & Data Strategy** 
**Story Points:** 5 | **Duration:** 2-4 days | **Priority:** P2 (Medium)

**Stories:**
- **E2E-2.1:** Choose & implement data approach (3 pts, 1-2 days) 
  - **Decision needed:** Real backend with seeded data vs mocked API?
  - If real: document test tenant setup, data reset process
  - If mocked: implement Playwright route.intercept with JSON fixtures
  - **DoD:** Consistent test data approach documented & working

- **E2E-2.2:** Authentication flow (2 pts, 1-2 days)
  - Test login → OTP → homepage journey
  - Implement storageState.json for session reuse
  - **DoD:** Auth works, subsequent tests skip login

#### **EPIC E2E-3: Core User Journeys**
**Story Points:** 13 | **Duration:** 1.5-2 weeks | **Priority:** P2 (Medium)  

**Stories:**
- **E2E-3.1:** Workspace & Base Selection (2 pts, 1 day)
  - Navigate homepage → select workspace → select base → verify sidebar
  - **DoD:** Basic navigation flow works end-to-end

- **E2E-3.2:** Table CRUD Operations (5 pts, 2-3 days)
  - Create table → add record → edit cells → save → delete  
  - Test success notifications and error handling
  - **DoD:** Full table lifecycle works

- **E2E-3.3:** View Management (3 pts, 1-2 days) 
  - Switch between views → create new view → configure view
  - **DoD:** View operations work correctly

- **E2E-3.4:** Permission-based UI (3 pts, 1-2 days)
  - Test as owner/maintainer/viewer roles
  - Verify "Read only" labels, hidden buttons, restricted actions
  - **DoD:** UI correctly reflects user permissions

#### **EPIC E2E-4: Plugin Views Coverage**
**Story Points:** 21 | **Duration:** 2-3 weeks | **Priority:** P3 (Low)

**Stories:**  
- **E2E-4.1:** Grid View Operations (5 pts, 2-3 days)
  - Sort, filter, edit cells, column management
  - **DoD:** Grid functionality works without errors

- **E2E-4.2:** Kanban View Operations (5 pts, 2-3 days)  
  - Move cards between stacks, edit card details
  - **DoD:** Kanban drag-drop and editing works

- **E2E-4.3:** Gallery View (3 pts, 1-2 days)
  - Image loading, card details, navigation  
  - **DoD:** Gallery renders and responds correctly

- **E2E-4.4:** Calendar View (4 pts, 1-2 days)
  - Date navigation, event rendering, interactions
  - **DoD:** Calendar view functions properly  

- **E2E-4.5:** Gantt & Form Views (4 pts, 1-2 days)
  - Timeline rendering, form submission flows
  - **DoD:** Specialized views work as expected

---

## TIMELINE & EXECUTION PLAN

### 🎯 Recommended Approach: Unit First, E2E Second

**Phase 1: Complete Unit Testing (Weeks 1-3) - 80% Code Coverage**  
*Priority: P0 - Critical for code quality gate*

| Week | Epic | Stories | Outcome |
|------|------|---------|---------|
| Week 1 | UT-1: API Data Layer | 3 stories (13 pts) | useApi.ts fully tested |
| Week 2 | UT-2: Access Control | 2 stories (8 pts) | Permission logic validated |
| Week 3 | UT-3: Navigation | 2 stories (5 pts) | Routing & state management covered |

**Milestone 1:** 80%+ code coverage achieved on core modules

**Phase 2: E2E Foundation (Week 4) - Basic Setup**  
*Priority: P1 - Parallel to unit testing completion*

| Week | Epic | Stories | Outcome |
|------|------|---------|---------|
| Week 4 | E2E-1: Foundation | 3 stories (8 pts) | Playwright installed & configured |
| Week 4 | E2E-2: Data Strategy | 2 stories (5 pts) | Test data approach decided & implemented |

**Phase 3: E2E Core Journeys (Weeks 5-6) - Critical Flows**  
*Priority: P2 - Essential user workflows*

| Week | Epic | Stories | Outcome |  
|------|------|---------|---------|
| Week 5-6 | E2E-3: Core Journeys | 4 stories (13 pts) | Auth, CRUD, permissions tested |

**Phase 4: E2E Plugin Coverage (Weeks 7-9) - Optional/Future**  
*Priority: P3 - Can be moved to Q2 if timeline tight*

| Week | Epic | Stories | Outcome |
|------|------|---------|---------|
| Week 7-9 | E2E-4: Plugin Views | 5 stories (21 pts) | Grid, Kanban, Gallery, Calendar tested |

---

## 📊 SUCCESS METRICS & EXIT CRITERIA

### Unit Testing Success (Phase 1)
- ✅ Code coverage ≥ 80% on core modules (hooks/utils/stores/contexts/service)  
- ✅ All API hooks (queries + mutations) have tests
- ✅ All permission logic tested with role matrix
- ✅ Navigation state management validated
- ✅ Zero test failures in CI

### E2E Testing Success (Phases 2-3)  
- ✅ All critical user journeys work end-to-end
- ✅ Authentication flow tested & stable
- ✅ Permission-based UI validated (read-only, role restrictions)
- ✅ Table CRUD operations work in real browser
- ✅ Test data strategy is repeatable & documented

### Combined Success (80%+ Coverage Goal)
- ✅ Unit tests provide 80%+ code coverage on core logic
- ✅ E2E tests provide journey coverage on user-facing flows  
- ✅ CI pipeline enforces both test types
- ✅ Documentation exists for running/maintaining tests

---

## 🚨 IMMEDIATE NEXT STEPS (Copy to Jira)

### Sprint 1: Start Unit Testing (This Week)
1. **Create Epic:** UT-1: API Data Layer Tests
2. **Create Stories:** UT-1.1, UT-1.2, UT-1.3 (from above)
3. **Assign:** 1 developer, start with UT-1.1 (React Query wrapper)

### Sprint Planning Decision Needed:
**Question:** Do you want to complete 80% unit coverage BEFORE starting E2E, or work on both tracks in parallel?

**Option A (Recommended):** Unit first → faster to 80% coverage goal  
**Option B:** Parallel → longer timeline but E2E starts sooner

---

## 📋 COPY-PASTE JIRA TEMPLATES

### Epic Template:
```
Title: UT-1: API Data Layer Tests
Type: Epic  
Priority: P0 (Critical)
Story Points: 13
Sprint: [Current Sprint]

Description:
Add comprehensive unit tests for all useApi.ts hooks (queries & mutations) to achieve 80% code coverage on data layer. Critical for coverage gate.

Acceptance Criteria:
- All query hooks tested (success/error/loading states)  
- All mutation hooks tested (success/error/optimistic updates)
- React Query wrapper created for consistent testing
- Code coverage on useApi.ts ≥ 85%

Stories: UT-1.1, UT-1.2, UT-1.3
```

### Story Template:  
```
Title: UT-1.1: Setup React Query Test Wrapper & Mocks
Type: Story
Priority: P0 (Critical)  
Story Points: 3
Epic: UT-1: API Data Layer Tests

Description:
Create reusable test utilities for testing React Query hooks with consistent mocking.

Tasks:
- Create QueryClient wrapper with retry disabled
- Mock clientService.ts with vi.mock  
- Add helper functions for testing async hooks
- Document testing patterns for team

Acceptance Criteria:
- QueryClient wrapper exists in test utilities
- clientService mocked consistently across tests
- Example test passes using the wrapper
- Documentation updated with testing approach
```

**Your E2E testing progress: 0% complete. Unit testing: ~35% coverage. Clear path to 80%+ outlined above. Priority: Start with unit tests for fastest coverage wins.**
