---
description: Core development principles and best practices for secure, robust development.
category: core-principles
---

# Core Rules

<principles>

## Development Philosophy
- Code exists to serve human needs. Security is non-negotiable.
- Write clean, maintainable code over rushing implementations.
- Clear, accurate documentation prevents future confusion.
- Invalid states should halt immediately with descriptive error messages.
- Users know their tools. Provide guidance without being condescending.

</principles>

## Security Guidelines

<security_checklist>
Before any commit:
- No hardcoded secrets (API keys, passwords, tokens)
- All user inputs validated
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitized HTML)
- CSRF protection enabled
- Authentication/authorization verified
- Rate limiting on all endpoints
- Error messages don't leak sensitive data
</security_checklist>

### Key Patterns

| Concern | Bad | Good |
|---------|-----|------|
| Secrets | `const apiKey = "sk-proj-xxxxx"` | `const apiKey = process.env.OPENAI_API_KEY` |
| SQL | String concatenation | `db.query('SELECT * FROM users WHERE id = ?', [userId])` |
| XSS | Raw user input in HTML | Template engine auto-escaping `{{ userInput }}` |

## Code Quality Standards

| Principle | Requirement |
|-----------|-------------|
| Error Handling | Try/catch with meaningful messages |
| Type Safety | TypeScript strict mode, `noImplicitAny: true` |
| Documentation | JSDoc for all public APIs |
| Consistent Style | Use project linter/formatter |
| Clarity | Prefer descriptive names over brevity |
| Testing | Edge case coverage, 100% on critical paths |

## Development Workflow

<pre_commit>
1. Code compiles without errors
2. All tests pass
3. Security scan passes
4. Performance meets requirements
5. Documentation updated
6. No hardcoded secrets
</pre_commit>

## Git Standards

| Practice | When | Example |
|----------|------|---------|
| Atomic Commits | One logical change per commit | `feat: Add user authentication` |
| Feature Branches | Isolated work | `git checkout -b feature/auth` |
| Code Review | All changes before merge | Required for main branch |

## Performance Guidelines

- Avoid O(n^2) algorithms in hot paths, prefer O(n log n)
- Use appropriate data structures (maps, sets for lookups)
- Proper cleanup of resources, no circular references
- Connection pooling, query caching, batch operations for databases

## Incident Response

<steps>
1. STOP - Immediately halt deployment if critical issue found
2. ASSESS - Determine impact scope and affected users
3. FIX - Address root causes before continuing
4. COMMUNICATE - Clear communication about problems
5. DOCUMENT - Findings and prevention measures
</steps>
