# Unit Testing Learning Roadmap

## 🎯 Your Learning Path

Follow this roadmap step by step. Don't rush - understand each concept before moving to the next!

---

## Week 1: Foundations (Days 1-3)

### Day 1: Understanding the Basics

**Goal:** Understand what testing is and why we do it

1. **Read:** `src/test/LEARNING_GUIDE.md` - Sections 1-3
   - What is Unit Testing?
   - Why Test?
   - Basic Concepts

2. **Practice:** Look at `src/utils/__tests__/helpers.test.ts`
   - Read each test
   - Understand what it's testing
   - Run it: `npm test helpers.test.ts`

3. **Try:** Write one test yourself
   - Open `src/utils/helpers.ts`
   - Pick a simple function (like `convertDateFormat`)
   - Write 3 tests: valid input, invalid input, edge case

### Day 2: Testing Simple Functions

**Goal:** Master testing pure functions

1. **Read:** `src/test/EXAMPLES.md` - Example 1 (validateEmail)
2. **Study:** `src/utils/__tests__/validation.test.ts` - validateEmail tests
3. **Practice:** Write tests for `validatePassword` function
   - Copy the structure from `validateEmail` tests
   - Test: valid password, too short, empty, custom length

### Day 3: Testing Complex Functions

**Goal:** Test functions with multiple conditions

1. **Read:** `src/test/EXAMPLES.md` - Example 2 (validatePasswordStrength)
2. **Study:** `src/utils/__tests__/validation.test.ts` - validatePasswordStrength tests
3. **Practice:** Add 2 more test cases for `validatePasswordStrength`
   - Test a password missing only uppercase
   - Test a password with exactly 7 characters

---

## Week 2: Arrays & Collections (Days 4-6)

### Day 4: Testing Array Functions

**Goal:** Test functions that work with arrays

1. **Read:** `src/test/EXAMPLES.md` - Example 3 (parseMultiSelectValue)
2. **Study:** `src/utils/__tests__/filterUtils.test.ts`
3. **Practice:** Write tests for a function that processes arrays
   - Look at `src/utils/sortUtils.ts`
   - Write tests for `filterValidSorts` function

### Day 5: Testing Edge Cases

**Goal:** Learn to think about edge cases

1. **Practice:** Add edge case tests to existing test files
   - Empty arrays
   - Null/undefined values
   - Very large arrays
   - Mixed types

### Day 6: Review & Practice

**Goal:** Solidify Week 1 & 2 concepts

1. **Review:** All tests in `src/utils/__tests__/`
2. **Practice:** Write tests for `src/utils/dateUtils.ts`
   - Start with simple functions
   - Test date formatting
   - Test edge cases (invalid dates, timezones)

---

## Week 3: Advanced Concepts (Days 7-10)

### Day 7: Testing Functions with Side Effects

**Goal:** Learn mocking and timers

1. **Read:** `src/test/EXAMPLES.md` - Example 4 (debounce)
2. **Study:** How `vi.fn()` and `vi.useFakeTimers()` work
3. **Practice:** Write tests for `debounce` function
   - Test delay
   - Test cancellation
   - Use fake timers

### Day 8: Testing React Hooks

**Goal:** Test custom hooks

1. **Read:** `src/test/EXAMPLES.md` - Example 5 (useFrontendPagination)
2. **Practice:** Write tests for `src/hooks/useFrontendPagination.ts`
   - Test initial state
   - Test loadNextPage
   - Test hasMore detection

### Day 9: Testing React Components (Part 1)

**Goal:** Test simple components

1. **Read:** `src/test/EXAMPLES.md` - Example 6 (Loader)
2. **Practice:** Write tests for `src/components/ui/Loader.tsx`
   - Test rendering
   - Test size prop
   - Test accessibility

### Day 10: Testing React Components (Part 2)

**Goal:** Test components with interactions

1. **Practice:** Write tests for a button component
   - Test click handler
   - Test disabled state
   - Test different props

---

## Week 4: Real-World Practice (Days 11-14)

### Day 11-12: Test Your Utility Functions

**Goal:** Write tests for all utility functions

**Priority Order:**
1. ✅ `helpers.ts` - Already done!
2. ✅ `validation.ts` - Already done!
3. ✅ `filterUtils.ts` - Already done!
4. ⏳ `dateUtils.ts` - You do this!
5. ⏳ `sortUtils.ts` - You do this!
6. ⏳ `fieldUtils.ts` - You do this!

**How:**
- Pick one function
- Write 5-10 tests covering:
  - Happy path
  - Edge cases
  - Error cases
  - Different input types

### Day 13-14: Test Your Hooks

**Goal:** Write tests for custom hooks

**Priority Order:**
1. ⏳ `useFrontendPagination.ts` - Start here (we have examples)
2. ⏳ `useDebounce.ts` - Similar to debounce function
3. ⏳ `useClickOutside.ts` - Test DOM interactions
4. ⏳ `useSmartPopover.ts` - Test positioning logic

---

## Learning Tips

### ✅ DO:

1. **Start Simple**
   - Begin with pure functions (easiest)
   - Move to hooks (medium)
   - Finally components (hardest)

2. **Read Before Writing**
   - Understand the code first
   - Then write tests
   - Don't test code you don't understand

3. **Test Behavior, Not Implementation**
   - Test what the function DOES
   - Not HOW it does it

4. **Write Descriptive Test Names**
   ```typescript
   // Good
   it('should return null for valid email')
   
   // Bad
   it('test1')
   ```

5. **One Concept at a Time**
   - Master simple tests first
   - Then learn mocking
   - Then learn component testing

### ❌ DON'T:

1. **Don't Skip the Basics**
   - Master simple tests before moving on
   - Each concept builds on the previous

2. **Don't Test Everything at Once**
   - Focus on one function/component
   - Complete it before moving on

3. **Don't Copy Without Understanding**
   - Read the test
   - Understand what it does
   - Then write your own

4. **Don't Give Up**
   - Testing is a skill (like coding)
   - It takes practice
   - Start simple, build up

---

## Practice Exercises (By Difficulty)

### 🟢 Beginner (Do These First!)

1. Write tests for `formatCompactNumber` (already done - study it!)
2. Write tests for `validateEmail` (already done - study it!)
3. Write tests for `convertDateFormat` in `helpers.ts`
4. Write tests for `validatePassword` in `validation.ts`

### 🟡 Intermediate

1. Write tests for `parseMultiSelectValue` (already done - study it!)
2. Write tests for `validatePasswordStrength` (already done - study it!)
3. Write tests for `debounce` function
4. Write tests for `useFrontendPagination` hook

### 🔴 Advanced

1. Write tests for React components
2. Write tests for hooks with API calls
3. Write tests for complex state management
4. Write integration tests

---

## Resources Created for You

1. **`src/test/LEARNING_GUIDE.md`** - Theory and concepts
2. **`src/test/EXAMPLES.md`** - Step-by-step examples
3. **`src/test/README.md`** - Quick reference
4. **`src/utils/__tests__/`** - Real working examples

---

## Your First Test (Right Now!)

Let's write your very first test together:

1. **Pick a simple function:** `validateEmail` (we have examples)
2. **Read the function:** Understand what it does
3. **Look at the test:** `src/utils/__tests__/validation.test.ts`
4. **Run it:** `npm test validation.test.ts`
5. **Modify it:** Change one test and see what happens
6. **Write your own:** Add one new test case

---

## Progress Tracker

Mark your progress as you complete each step:

- [ ] Day 1: Read learning guide, understand basics
- [ ] Day 2: Write tests for simple functions
- [ ] Day 3: Write tests for complex functions
- [ ] Day 4: Write tests for array functions
- [ ] Day 5: Practice edge cases
- [ ] Day 6: Review and practice
- [ ] Day 7: Learn mocking and timers
- [ ] Day 8: Test React hooks
- [ ] Day 9: Test simple components
- [ ] Day 10: Test interactive components
- [ ] Day 11-12: Test all utility functions
- [ ] Day 13-14: Test all hooks

---

## Questions to Ask Yourself

After writing each test, ask:

1. ✅ Does this test what the function is supposed to do?
2. ✅ Did I test the happy path?
3. ✅ Did I test edge cases?
4. ✅ Did I test error cases?
5. ✅ Will this test catch bugs?
6. ✅ Is the test name clear?
7. ✅ Can someone else understand this test?

---

## Next Steps

1. **Start with Day 1** - Read the learning guide
2. **Run the existing tests** - See how they work
3. **Write one test yourself** - Start simple!
4. **Ask questions** - If something doesn't make sense
5. **Practice daily** - Even 30 minutes helps

Remember: **Testing is a skill you learn by doing!** 🚀

