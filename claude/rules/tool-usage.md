# Tool Usage Rules

## Mandatory Tool Preferences

### File Operations

| Operation | Use | Avoid |
|-----------|-----|-------|
| Read file | `Read` | `cat`, `head`, `tail` |
| Search content | `Grep` | `grep`, shell pipes |
| Find files | `Glob` | `find` |
| Edit file | `Edit`, `MultiEdit` | `sed`, `awk`, heredocs |
| Create file | `Write` | `echo >`, `cat >` |

### Shell Commands

NEVER use shell commands for tasks with dedicated tools:

```bash
# WRONG
cat file.txt              # Use Read
grep "pattern" .          # Use Grep
find . -name "*.py"       # Use Glob
sed -i 's/old/new/' file  # Use Edit
```

```bash
# CORRECT - Shell for actual commands
git status
npm run build
uv pip install package
cargo build
```

## Read Before Edit (MANDATORY)

ALWAYS read a file before editing:

```markdown
1. Read(path)           # Understand current state
2. Plan changes         # Identify what to modify
3. Edit(path, old, new) # Make precise changes
```

**Never edit blindly based on assumptions.**

## Edit Precision Rules

### Include Enough Context

```python
# WRONG: Ambiguous match
old_string = "return result"

# CORRECT: Unique context
old_string = """def process_data(input):
    result = transform(input)
    return result"""
```

### Preserve Exact Formatting

```python
# Match EXACT whitespace (tabs vs spaces matter)
old_string = "    if condition:"  # 4 spaces
new_string = "    if new_condition:"
```

### Use MultiEdit for Multiple Changes

```python
# WRONG: Multiple Edit calls
Edit(path, old1, new1)
Edit(path, old2, new2)

# CORRECT: Single MultiEdit
MultiEdit(path, [
    {"old": old1, "new": new1},
    {"old": old2, "new": new2}
])
```

## Bash Command Rules

### Always Quote Paths

```bash
# WRONG
cd /path/with spaces/

# CORRECT
cd "/path/with spaces/"
```

### Avoid Long-Running Processes

```bash
# WRONG: Blocks forever
npm run dev
python -m http.server

# CORRECT: Use tmux for long processes
tmux new-session -d -s dev 'npm run dev'
```

### Check Before Destructive Operations

```bash
# WRONG: Immediate delete
rm -rf directory/

# CORRECT: Verify first
ls directory/  # Check contents
rm -rf directory/
```

## Parallel Tool Usage

### Independent Operations in Parallel

```markdown
# GOOD: Parallel reads
Read(file1.py)  |  Read(file2.py)  |  Read(file3.py)

# GOOD: Parallel searches
Grep("pattern1")  |  Grep("pattern2")

# BAD: Sequential when parallel possible
Read(file1.py)
Read(file2.py)
Read(file3.py)
```

### Sequential When Dependencies Exist

```markdown
# CORRECT: Sequential for dependencies
1. Read(file.py)         # Need content first
2. Edit(file.py, old, new)  # Then edit
3. Bash(python -m py_compile file.py)  # Then verify
```

## Subagent (Task) Usage

### When to Use Subagents

- Independent research tasks
- Code analysis that reads many files
- Keeping main context clean
- Parallel work streams

### Subagent Best Practices

```markdown
# GOOD: Scoped task
Task("Analyze auth module for security issues", tools=["Read", "Grep"])

# BAD: Vague task
Task("Look around the codebase")
```

## Tool Output Handling

### Process Results Before Continuing

```markdown
1. Execute tool
2. Read and understand output
3. Handle errors if present
4. Proceed based on results
```

### Don't Ignore Errors

```bash
# Check exit codes
npm run build
# If fails: Analyze error, fix issue, retry
```

## Verification Requirements

After code changes:

1. **Lint check**: `ruff check` / `biome lint`
2. **Type check**: `tsc` / `pyright`
3. **Test run**: `npm test` / `pytest`

Never skip verification for "small" changes.
