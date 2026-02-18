---
description: Core development principles and best practices for secure, robust development.
category: core-principles
---

# Core Rules

Essential principles and guidelines for secure, robust development practices.

## Constitutional Principles

### Development First
Code exists to serve human needs. Security is non-negotiable.

### Quality Over Speed
Write clean, maintainable code over rushing implementations. Technical debt is inevitable without discipline.

### Documentation Saves Time
Clear, accurate documentation prevents future confusion and reduces support burden.

### Fail Fast, Fail Loud
Invalid states should halt immediately with descriptive error messages. Never continue with broken code.

### Assume Competence
Users know their tools. Provide guidance without being condescending. Make reasonable assumptions without stating uncertainty.

## Security Guidelines

### Mandatory Security Checks

Before ANY commit:
- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized HTML)
- [ ] CSRF protection enabled
- [ ] Authentication/authorization verified
- [ ] Rate limiting on all endpoints
- [ ] Error messages don't leak sensitive data

### Secret Management
```typescript
// NEVER: Hardcoded secrets
const apiKey = "sk-proj-xxxxx"
// ALWAYS: Environment variables
const apiKey = process.env.OPENAI_API_KEY
```

### Input Validation
```javascript
// SQL parameterized queries
const query = 'SELECT * FROM users WHERE id = ?'
const result = await db.query(query, [userId])
```

### XSS Prevention
```html
<!-- Always sanitize user input -->
<div>{{ userInput }}</div>
```

### Security Headers
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'none'"],
      styleSrc: ["'unsafe-inline'"]
    }
  }
}))
```

## Testing Requirements

- **100% test coverage** for critical paths
- **Security testing** for all endpoints
- **Performance testing** with load testing
- **Integration testing** between components
- **Error boundary testing** with invalid inputs

## Code Quality Standards

| Principle | Requirement | Example |
|-----------|-------------|---------|
| **Error Handling** | Try/catch patterns | `try { riskyOp() } catch (error) { handle(error) }` |
| **Type Safety** | TypeScript strict mode | `noImplicitAny: true` |
| **Documentation** | JSDoc for all public APIs | `/** @param {string} */` |
| **Consistent Style** | Use linter/formatter | `prettier --write` |
| **Clarity** | Prefer clarity over brevity | Use descriptive names |
| **Testing** | Edge case coverage | Test boundary conditions |

## Development Workflow

### Pre-Commit Checklist
- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Security scan passes
- [ ] Performance meets requirements
- [ ] Documentation updated
- [ ] Rate limiting enforced
- [ ] Error messages sanitized
- [ ] No hardcoded secrets

### Git Standards
| Practice | When to Use | Example |
|-----------|-------------|---------|
| **Atomic Commits** | One logical change per commit | `git add src/utils.js && git commit -m "Add utility function"` |
| **Clear Messages** | Descriptive commit messages | `feat: Add user authentication` |
| **Feature Branches** | Isolated work in branches | `git checkout -b feature/auth` |
| **Code Review** | All changes require review before merge | Required for main branch |

## Debugging Guidelines

### Systematic Approach
1. **Reproduce issues** - Minimal test case with specific inputs
2. **Isolate variables** - Test with only the variables needed
3. **Check logs** - Review error messages and stack traces
4. **Use debuggers** - Appropriate debugger for the language
5. **Document findings** - Record solutions for future reference

### Error Analysis Priority
| Priority | Time Range | Example |
|----------|------------|---------|
| **Critical** | <5 min | System-wide outage, data loss risk |
| **High** | <1 hour | Major feature outage, many users affected |
| **Medium** | <2 hours | Significant UX impact |
| **Low** | <1 day | Minor UX impact, next maintenance cycle |

## Performance Guidelines

- **Algorithm Complexity**: Avoid O(n²) algorithms in hot paths, prefer O(n log n)
- **Data Structures**: Use appropriate structures (maps, sets for lookups)
- **Memory Leaks**: Proper cleanup of resources, no circular references
- **Database Operations**: Use connection pooling, query caching, batch operations

## Incident Response

1. **STOP** - Immediately halt deployment if critical issue found
2. **ASSESS** - Determine impact scope and affected users
3. **Fix** - Address root causes before continuing
4. **Communicate** - Clear communication about security problems
5. **Document** - Document findings and prevention measures

### Code Review Checklist
- [ ] Security implications considered
- [ ] Performance impact assessed
- [ ] Documentation requirements met
- [ ] Tests passing
- [ ] Code quality improved

## Tools and Resources

### Security Tools
- OWASP ZAP for automated scanning
- Snyk for dependency vulnerability checking
- CodeQL for static analysis
- SonarQube for code quality metrics

### Testing Resources
- Security-focused test frameworks
- Performance testing tools
- Integration testing platforms

## Documentation Standards

- OpenAPI/Swagger with comprehensive examples
- JSDoc for all public APIs
- Markdown with clear examples and edge cases
