---
description: Comprehensive error resolution and self-healing. Analyzes errors, suggests fixes with time estimates, and automatically recovers from common issues.
category: utilities-debugging
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Error Resolution & Self-Healing

Comprehensive error handling with analysis, fix suggestions, and automatic recovery capabilities.

## Usage

`/fix [mode] [issue]` where:
- mode: `error`, `todos`, `self-heal`
- issue: Specific error, file, or problem to address

## Error Analysis

### Identify Root Causes
1. **Error Information Collection**
   - Full error messages and stack traces
   - Environment details (OS, versions, dependencies)
   - Recent changes that might relate
   
2. **Pattern Recognition**
   - Match against common error database
   - Identify similar past issues
   - Recognize recurring patterns
   
3. **Impact Assessment**
   - Severity: Critical/High/Medium/Low
   - Scope: Local/Component/System
   - Urgency: Immediate/Soon/Later

### Time Estimates

| Icon | Time Range | Complexity | Examples |
|-------|------------|-----------|---------|
| 🚀 | <5 min | Simple typo, missing import | Fix syntax, add dependency |
| 🟡 | 5-30 min | Logic error, configuration | Debug state, check environment |
| 🧠 | 30min-2hr | Integration issue | API change, dependency conflict |
| 🔬 | 2hr+ | Architecture problem | Refactor component, database change |

## Fix Strategies

### Error Categories

| Category | Types | Resolution Approach |
|----------|-------|------------------|
| **Compilation** | Syntax, Type, Build | Fix syntax, add types, update deps |
| **Runtime** | Null refs, Undefined, Type errors | Add checks, handle edge cases |
| **Integration** | API mismatches, Version conflicts | Update interfaces, pin versions |
| **Environment** | Missing deps, Config issues | Install packages, set env vars |
| **Performance** | Slow operations, Memory leaks | Optimize algorithms, add caching |
| **Testing** | Test failures, Flaky tests | Fix tests, update fixtures |

## TODO Management

### Discovery Modes

```bash
# Find all TODOs
/fix find

# Categorize and prioritize
/fix todos --priority

# Generate resolution plan
/fix todos plan
```

### Resolution Workflow

1. **Categorize by Impact**
   - Critical: Security vulnerabilities, data corruption
   - High: Feature blockers, performance degradation
   - Medium: UX issues, minor bugs
   - Low: Nice-to-have, optimizations

2. **Implementation Order**
   - Fix critical issues immediately
   - Batch similar fixes together
   - Test fixes before moving to next issue

3. **Tracking**
   - Mark TODOs with status (open, in-progress, resolved)
   - Link related TODOs
   - Document resolution approach

## Self-Healing

### Automatic Recovery

```bash
# Detect and recover from common issues
/fix self-heal
```

### Healing Capabilities

| Issue Type | Auto-Recovery | Examples |
|------------|--------------|---------|
| Missing imports | Install packages | bun install, npm install |
| Syntax errors | Fix based on pattern | Fix brackets, quotes |
| Test failures | Re-run with clean state | git clean, npm test |
| Build failures | Clean and rebuild | rm -rf node_modules, npm ci |
| Env issues | Set environment variables | export NODE_ENV=prod |

### Recovery Process

1. **Issue Detection**
   - Monitor command outputs
   - Parse error patterns
   - Match against known solutions

2. **Solution Application**
   - Apply appropriate fix strategy
   - Verify resolution
   - Continue to next issue

## Mode Execution

### Error Mode (`/fix error [description]`)
```bash
# Analyze specific error
/fix error "Cannot read property 'x' of undefined"
# Provide fix suggestions
```

### TODOs Mode (`/fix todos`)
```bash
# Find and categorize TODOs
/fix find
# Generate resolution plan
/fix todos plan
```

### Self-Heal Mode (`/fix self-heal`)
```bash
# Automatic error recovery
/fix self-heal
# Detect and fix common issues
```

### Analysis Mode (`/fix analyze [pattern]`)
```bash
# Deep error pattern analysis
/fix analyze "memory leak"
# Search codebase for similar patterns
```

## Quality Assurance

### Verification Checklist

- [ ] Root cause identified correctly
- [ ] Fix doesn't introduce new issues
- [ ] Related tests pass
- [ ] Documentation updated if needed
- [ ] Performance not degraded

## Output

- Error analysis with root cause
- Fix recommendations with time estimates
- Implementation steps if requested
- Status tracking for ongoing issues
- Self-healing recovery report

## Prevention Strategies

1. **Code Review Patterns**
   - Static analysis for common issues
   - Security vulnerability scanning
   - Performance profiling

2. **Testing Strategies**
   - Error boundary testing
   - Integration test coverage
   - Chaos engineering for resilience

3. **Monitoring**
   - Error tracking and alerting
   - Performance metrics
   - Health checks

## Knowledge Base

Build error pattern database:
- Store successful resolutions
- Track recurring issues
- Maintain fix templates
- Learn from past resolutions