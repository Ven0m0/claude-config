# Debugging Rules

## Debugging Workflow

### 1. Reproduce First

Before fixing:

```markdown
1. Understand the error message/behavior
2. Identify reproduction steps
3. Create minimal test case if possible
4. Verify you can consistently reproduce
```

### 2. Gather Context

```markdown
# Read relevant files
Read(error_file.py)

# Search for related code
Grep("function_name")
Grep("error_message")

# Check git history if relevant
git log -p --follow -- file.py
```

### 3. Form Hypothesis

```markdown
Based on error and code:
- What could cause this behavior?
- What changed recently? (git diff)
- What assumptions might be wrong?
```

### 4. Test Hypothesis

```markdown
# Add logging/debugging
Edit to add: console.log/print statements

# Run isolated test
python -c "from module import func; func()"

# Use debugger if needed
python -m pdb script.py
```

### 5. Fix and Verify

```markdown
1. Make minimal fix
2. Run original failing case
3. Run related tests
4. Remove debug code
5. Run full test suite
```

## Error Analysis

### Read Full Error

```markdown
# WRONG: React to first line
Error: Something failed

# CORRECT: Read complete stack trace
Error: Something failed
  at function1 (file.py:45)
  at function2 (file.py:23)
  Caused by: OriginalError
```

### Identify Root Cause

```markdown
# WRONG: Fix symptom
Add try/catch to suppress error

# CORRECT: Fix cause
Understand why error occurs and prevent it
```

### Check Common Causes

```markdown
- [ ] Null/undefined values
- [ ] Type mismatches
- [ ] Off-by-one errors
- [ ] Race conditions
- [ ] Missing imports
- [ ] Wrong file/module path
- [ ] Environment differences
- [ ] Cached state
```

## Debugging Tools

### Python

```python
# Quick debug
print(f"DEBUG: {variable=}")
import pdb; pdb.set_trace()

# Better debugging
import ipdb; ipdb.set_trace()
breakpoint()  # Python 3.7+
```

### JavaScript/TypeScript

```javascript
// Console debugging
console.log('DEBUG:', { variable });
console.trace('Call stack');

// Debugger
debugger;
```

### Shell

```bash
# Verbose mode
set -x  # Print commands
set -e  # Exit on error

# Debug output
echo "DEBUG: variable=$variable"
```

## Test-Driven Debugging

### Write Failing Test First

```python
def test_bug_reproduction():
    """Reproduce the reported bug."""
    result = buggy_function(input_that_fails)
    assert result == expected_output  # This will fail
```

### Fix Until Test Passes

```markdown
1. Run test (fails)
2. Make small change
3. Run test again
4. Repeat until passes
5. Add edge case tests
```

### Prevent Regression

```markdown
# Keep the test!
The reproduction test becomes regression prevention
```

## Using Subagents for Debugging

### Parallel Investigation

```markdown
Launch debugging agents:
1. Agent 1: Trace data flow through system
2. Agent 2: Check for similar issues in codebase
3. Agent 3: Review recent changes to affected files
```

### Focused Analysis

```markdown
Task("Analyze the auth flow and identify where 
     the session token becomes invalid",
     tools=["Read", "Grep"])
```

## Git Debugging

### Find When Bug Introduced

```bash
# Binary search through commits
git bisect start
git bisect bad HEAD
git bisect good v1.0.0
# Test each commit until found
```

### Review Recent Changes

```bash
git log --oneline -20 -- path/to/file
git diff HEAD~5 -- path/to/file
git blame file.py
```

### Compare Working Version

```bash
git diff working-branch..broken-branch -- file.py
git log working-branch..broken-branch
```

## Environment Issues

### Check Configuration

```bash
# Environment variables
env | grep RELEVANT

# Config files
cat .env
cat config.json
```

### Compare Environments

```markdown
Working environment:
- Node v18.0.0
- Package versions: X, Y, Z

Broken environment:
- Node v20.0.0  # Version difference!
- Package versions: X, Y', Z
```

### Isolate Environment

```bash
# Fresh environment
rm -rf node_modules && npm install
# or
uv venv && uv pip install -r requirements.txt
```

## Anti-Patterns

### Don't

```markdown
❌ Make multiple changes at once
❌ Skip reproduction step
❌ Fix symptoms without understanding cause
❌ Remove error handling to "fix" errors
❌ Add broad try/catch without specific handling
❌ Ignore test failures
```

### Do

```markdown
✅ One change at a time
✅ Verify reproduction before fixing
✅ Understand root cause
✅ Handle errors appropriately
✅ Keep tests passing
✅ Document non-obvious fixes
```

## Logging Best Practices

### Structured Logging

```python
import logging

logger = logging.getLogger(__name__)
logger.debug("Processing item", extra={"item_id": item.id, "status": item.status})
```

### Log Levels

```markdown
DEBUG: Detailed diagnostic info
INFO: Normal operation events
WARNING: Unexpected but handled situations
ERROR: Errors that prevent operation
CRITICAL: System-level failures
```

### Temporary Debug Logging

```python
# ALWAYS REMOVE BEFORE COMMIT
print(f"DEBUG: {value=}")  # Remove me!
```

## When to Ask for Help

```markdown
After:
1. Reading error messages carefully
2. Searching codebase for related code
3. Checking documentation
4. Trying 2-3 different approaches
5. Spending >30 minutes on same issue

Then: Describe what you've tried and what you've learned
```
