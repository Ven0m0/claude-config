# Testing Requirements

## Minimum Test Coverage: 80%

Test Types (ALL required):

1. **Unit Tests** - Individual functions, utilities, components
1. **Integration Tests** - API endpoints, database operations
1. **E2E Tests** - Critical user flows (Playwright)

## Test-Driven Development

MANDATORY workflow:

1. Write test first (RED)
1. Run test - it should FAIL
1. Write minimal implementation (GREEN)
1. Run test - it should PASS
1. Refactor (IMPROVE)
1. Verify coverage (80%+)

## Troubleshooting Test Failures

1. Use **tdd-guide** agent
1. Check test isolation
1. Verify mocks are correct
1. Fix implementation, not tests (unless tests are wrong)

## Agent Support

- **tdd-guide** - Use PROACTIVELY for new features, enforces write-tests-first
- **e2e-runner** - Playwright E2E testing specialist
