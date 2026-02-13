---
description: Core development principles and best practices for secure, robust development including constitutional principles, security best practices, verification protocols, debugging approaches, tool usage, workflow management, coding standards, and authoring patterns.
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
      scriptSrc: ["none'"],
      styleSrc: ["unsafe-inline'"]
    }
  }
})
```

## Testing Requirements

- **100% test coverage** for critical paths
- **Security testing** for all endpoints
- **Performance testing** with load testing
- **Integration testing** between components
- **Error boundary testing** with invalid inputs

### Code Quality Standards

| Principle | Requirement | Example |
|-----------|-------------|
| **Error Handling** | Try/catch patterns | `try { riskyOp() } catch (error) { handle(error) { handle(error) }` |
| **Type Safety** | TypeScript strict mode | `noImplicitAny: true` |
| **Documentation** | JSDoc for all public APIs | `/** @param {string} */` |
| **Consistent Style** | Use linter/formatter | `prettier --write` |
| **Consistent** | Prefer clarity over brevity

## Development Workflow

### Pre-Commit Checklist

- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Security scan passes
- [ ] Documentation updated
- [ ] Performance meets requirements

### Git Standards

| Practice | When to Use | Example |
|-----------|-------------|---------|
| **Atomic Commits** | One logical change per commit | `git add src/utils.js && git commit -m "Add utility function"` |
| **Clear Messages** | Descriptive commit messages | `feat: Add user authentication` |
| **Feature Branches** | Isolated work in branches | `git checkout -b feature/auth` |
| **Code Review** | All changes require security review before merge |

## Debugging Guidelines

### Systematic Approach
1. **Reproduce issues** - Minimal test case with specific inputs
2. **Isolate variables** - Test with only the variables needed for the test
3. **Check logs** - Review error messages and stack traces
4. **Use debuggers** - Appropriate debugger for the language

### Error Analysis

| Priority Matrix
| Priority | Icon | Time Range | Complexity | Example |
|-----------|-------------|---------|
| | **Critical** | 🚀 Emergency | System-wide outage, data loss risk | <5 min | Start within 15 min |
| | **High** | 🟠 Early Response | Wide | < 1 hour | System-wide impact | <30 min | Start within 1 hour |
| | **Medium** | 🟡 Planned Response | Wide | <2 hours | Major feature outage | Many users affected |
| | **Low** | 🟢 Monitor | Medium | <1 day | Minor UX impact | <30 min | Next maintenance cycle |

## Code Examples

### Error Types by Priority

| Type | Icon | Time Range | Common Causes | Solutions |
|-----------|-------------|---------|
| Syntax Error | 🚨 | <5 min | Missing semicolon | Fix syntax immediately |
| Logic Error | 🟠 | <10 min | Type mismatch | Check imports and types |
| Import Error | 🟡 | <10 min | Module not found | `npm install <module>` | Install missing dependency |
| Reference Error | 🟡 | Wrong file/module path | `import './utils/helper'` | Fix import path or use relative imports |
| Type Error | 🟢 | <10 min | Invalid type assignment | Fix with explicit typing |

## Performance Guidelines

| Algorithm Complexity
- **O(n²) vs O(n log n)**: Avoid quadratic algorithms in hot paths
- Use appropriate data structures (maps, sets for lookups)
- **Memory Leaks**: Proper cleanup of resources, no circular references
- **Database Operations**: Use connection pooling, query caching, batch operations

### Testing Standards

- **100% Test Coverage** for critical paths
- **Security Testing** for all endpoints
- **Performance Testing** with load testing
- **Integration Testing** between components
- **Error Boundary Testing** with invalid inputs

## Code Quality Standards

| Principle | Requirement | Example |
|-----------|-------------|---------|
| **Type Safety** | TypeScript strict mode | `noImplicitAny: true` |
| **Documentation** | JSDoc for all public APIs | `/** @param {string} */` |
| **Consistent Style** | Use linter/formatter | `prettier --write` |
| **Consistent** | Prefer clarity over brevity |
| **Testing** | Comprehensive edge case coverage for security-critical paths |

### Development Workflow

### Pre-Commit Checklist
- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Security scan passes
- [ ] Performance meets requirements
- [ ] Documentation updated
- [ ] Rate limiting enforced
- [ ] Error messages sanitized
- [ ] No hardcoded secrets

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
- [ ] Performance optimized

## Debugging Guidelines

### Systematic Approach
1. Reproduce issues consistently
2. Isolate variables and changes
3. Check logs and traces
4. Use debuggers effectively
5. Document findings and solutions

### Learning Organization

### Post-Development
- Share security lessons with team
- Update coding standards based on findings

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

### API Documentation Format
- OpenAPI/Swagger with comprehensive examples
- JSDoc for all public APIs
- Markdown with clear examples and edge cases

## Development Standards

- ### Core Principles
- Security is everyone's responsibility.*