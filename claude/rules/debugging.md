# Debugging Rules

## Debugging Workflow

<steps>

### 1. Reproduce First

Before fixing:
1. Understand the error message/behavior
2. Identify reproduction steps
3. Create minimal test case if possible
4. Verify you can consistently reproduce

### 2. Gather Context

```markdown
Read(error_file.py)          # Understand code
Grep("function_name")        # Find related code
Grep("error_message")        # Find error origins
git log -p --follow -- file  # Check history
```

### 3. Form Hypothesis

Based on error and code:
- What could cause this behavior?
- What changed recently? (git diff)
- What assumptions might be wrong?

### 4. Test Hypothesis

Add targeted logging or use a debugger. Run isolated test cases. Verify one hypothesis at a time.

### 5. Fix and Verify

1. Make minimal fix
2. Run original failing case
3. Run related tests
4. Remove debug code
5. Run full test suite

</steps>

## Error Analysis

<guidelines>

### Read Full Stack Traces

Look at the complete trace, not just the first line. The root cause is usually at the bottom of the stack.

### Fix Root Causes, Not Symptoms

Adding try/catch to suppress errors is wrong. Understand why the error occurs and prevent it.

### Common Causes Checklist

- Null/undefined values
- Type mismatches
- Off-by-one errors
- Race conditions
- Missing imports
- Wrong file/module path
- Environment differences
- Cached state

</guidelines>

## Debugging Tools

| Language | Quick Debug | Debugger |
|----------|------------|----------|
| Python | `print(f"DEBUG: {variable=}")` | `breakpoint()` (3.7+) |
| JavaScript | `console.log('DEBUG:', { variable })` | `debugger;` |
| Shell | `set -x` (print commands) | `set -e` (exit on error) |

## Test-Driven Debugging

<workflow>
1. Write a failing test that reproduces the bug
2. Make small changes until the test passes
3. Add edge case tests
4. Keep the reproduction test as regression prevention
</workflow>

## Git Debugging

```bash
# Binary search through commits
git bisect start
git bisect bad HEAD
git bisect good v1.0.0

# Review recent changes to a file
git log --oneline -20 -- path/to/file
git blame file.py
```

## Anti-Patterns

<avoid>
- Making multiple changes at once
- Skipping reproduction step
- Fixing symptoms without understanding cause
- Removing error handling to "fix" errors
- Adding broad try/catch without specific handling
- Ignoring test failures
</avoid>

<prefer>
- One change at a time
- Verify reproduction before fixing
- Understand root cause
- Handle errors appropriately
- Keep tests passing
- Document non-obvious fixes
</prefer>
