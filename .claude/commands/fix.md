---
description: Comprehensive error resolution and self-healing. Analyzes errors, suggests fixes, and automatically recovers from common issues.
category: utilities-debugging
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

<task>
Resolve errors, manage TODOs, and automatically recover from common issues.
</task>

<instructions>

## Usage

`/fix [mode] [issue]` where:
- mode: `error`, `todos`, `self-heal`
- issue: specific error, file, or problem to address

## Error Analysis

<steps>
1. Collect full error messages, stack traces, environment details, recent changes
2. Match against common error patterns and identify similar past issues
3. Assess severity (critical/high/medium/low), scope (local/component/system), urgency
4. Determine root cause and propose fix
</steps>

### Error Categories

| Category | Types | Resolution |
|----------|-------|------------|
| Compilation | Syntax, Type, Build | Fix syntax, add types, update deps |
| Runtime | Null refs, Undefined | Add checks, handle edge cases |
| Integration | API mismatches, Version conflicts | Update interfaces, pin versions |
| Environment | Missing deps, Config issues | Install packages, set env vars |
| Performance | Slow operations, Memory leaks | Optimize algorithms, add caching |
| Testing | Test failures, Flaky tests | Fix tests, update fixtures |

## TODO Management

```bash
/fix find              # Find all TODOs
/fix todos --priority  # Categorize and prioritize
/fix todos plan        # Generate resolution plan
```

Prioritize by impact: critical (security, data corruption) > high (feature blockers) > medium (UX issues) > low (nice-to-have)

## Self-Healing

| Issue | Auto-Recovery |
|-------|--------------|
| Missing imports | Install packages |
| Syntax errors | Fix based on pattern |
| Test failures | Re-run with clean state |
| Build failures | Clean and rebuild |
| Env issues | Set environment variables |

## Verification

<checklist>
- Root cause identified correctly
- Fix does not introduce new issues
- Related tests pass
- Documentation updated if needed
- Performance not degraded
</checklist>

</instructions>

<output_format>
- Error analysis with root cause
- Fix recommendations
- Implementation steps if requested
- Status tracking for ongoing issues
</output_format>
