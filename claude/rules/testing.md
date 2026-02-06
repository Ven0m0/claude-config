## TDD (Test-Driven Development) - Mandatory Workflow

**Core Rule:** No production code without a failing test first. No exceptions.

### Minimum Test Coverage: 80%

Test Types (ALL required):

1. **Unit Tests** - Individual functions, utilities, components
2. **Integration Tests** - API endpoints, database operations
3. **E2E Tests** - Critical user flows (Playwright)

### The Red-Green-Refactor Cycle

#### 1. RED - Write Failing Test

Write one minimal test that describes the desired behavior.

- Tests one specific behavior
- Descriptive name: `test_<function>_<scenario>_<expected_result>`
- Uses real code (avoid mocks unless testing external dependencies)
- Focuses on behavior, not implementation details

#### 2. VERIFY RED - Confirm Test Fails

**MANDATORY - Never skip.** Execute the test and verify it fails because the feature doesn't exist (not syntax errors).

#### 3. GREEN - Write Minimal Code

Write the simplest code that makes the test pass. No extra features or improvements.

#### 4. VERIFY GREEN - Confirm Test Passes

**MANDATORY.** Execute test, verify new test passes and all existing tests still pass.

#### 5. REFACTOR - Improve Code Quality

Only after tests are green: remove duplication, improve names, extract helpers, simplify logic. Keep tests passing throughout.

### When TDD Applies

**Always use TDD for:** New functions/methods, API endpoints, business logic, bug fixes (reproduce bug with test first), behavior changes.

**TDD not required for:** Documentation-only changes, configuration updates, dependency version updates, formatting-only changes.

### Common Mistakes

- **Writing code before test:** Stop, delete the code, start with the test.
- **Test passes immediately:** You're testing existing behavior. Rewrite.
- **Skipping verification:** Always execute and show output.
- **Testing implementation not behavior:** Tests should survive refactoring.
- **Unnecessary mocks:** Only mock external dependencies.

### Verification Checklist

- [ ] Every new function/method has at least one test
- [ ] Watched each test fail before implementing
- [ ] Each test failed for expected reason
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass (executed and verified)
- [ ] Tests use real code (mocks only for external deps)

### Decision Tree

```
Need to add/change behavior?
--- YES -> Write failing test first
    --- Test fails correctly? -> Write minimal code
        --- Test passes? -> Refactor if needed -> Done
        --- Test fails? -> Fix code, re-run
    --- Test passes immediately? -> Rewrite test
--- NO (docs/config only) -> Skip TDD
```
