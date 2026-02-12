# Test Progress (Folder-by-folder)

This file tracks which test folders have been brought to a stable, passing state (or intentionally skipped) while we modernize tests to match current components.

## Completed

- ✅ Full suite — `npm run test -- run`
  - Result: `111 passed | 1 skipped` test files, `2778 passed | 59 skipped` tests
  - Last verified: 2026-02-02

- ✅ `src/pages/__tests__` — `npx vitest run src/pages/__tests__`
  - Result: `6 passed | 1 skipped` test files (`AdministratorPage.test.tsx` skipped)
  - Last verified: 2026-02-02

- ✅ `src/components/common/Fields/__tests__` — `npx vitest run src/components/common/Fields/__tests__ --reporter=dot`
  - Result: `22 passed` test files, `792 passed` tests
  - Last verified: 2026-02-02

- ✅ `src/components/common/__tests__` — `npx vitest run src/components/common/__tests__ --bail=1`
  - Result: `14 passed` test files, `175 passed | 1 skipped` tests
  - Last verified: 2026-02-02

- ✅ Additional folders covered by full-suite pass (see command above)
  - `src/auth/__tests__`
  - `src/components/__tests__`
  - `src/components/account/__tests__`
  - `src/components/common/dropdown/__tests__`
  - `src/components/modals/__tests__`
  - `src/contexts/__tests__`
  - `src/core/__tests__`
  - `src/hooks/__tests__`
  - `src/hooks/workspace/__tests__`
  - `src/service/__tests__`
  - `src/stores/__tests__`
  - `src/utils/__tests__`

## In Progress

- ⏳ Coverage improvements / missing unit tests (optional next)

## Notes / Conventions

- We update tests to match the current component behavior (no component changes to satisfy outdated tests).
- If a folder is intentionally skipped, we record the reason and the exact `vitest` command output summary.
