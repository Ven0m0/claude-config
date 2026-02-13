---
description: Clean up code, artifacts, branches, context, and comments. Consolidates technical debt removal, branch management, context optimization, and comment cleanup.
category: utilities-maintenance
allowed-tools: Read, Edit, Bash(git *), Bash(rm *), Grep, Glob
---

# Clean Project

Comprehensive cleanup for code, artifacts, git workflow, context, and comments.

## Usage

`/clean [mode]` where mode is:
- `code` or no args: Clean technical debt
- `artifacts`: Clean development artifacts
- `branches`: Clean git branches
- `context`: Optimize memory bank and context
- `comments`: Remove redundant comments
- `all`: All of the above

## Code/Technical Debt Cleanup

### Identify Cleanup Targets

1. **TODO, FIXME, HACK, XXX comments**
2. **Commented-out code blocks** (older than 3 months)
3. **Unused imports/variables**
4. **Dead/unreachable code**
5. **Deprecated API usage**
6. **Debug statements** (console.log, print)

### Code Quality Improvements

1. **Fix linting errors and warnings**
2. **Apply consistent formatting**
3. **Standardize naming conventions**
4. **Modernize syntax** (let/const, arrow functions)
5. **Remove dead code**:
   - Commented-out code older than 3 months
   - Unused functions and methods
   - Unreferenced files
   - Obsolete configuration
   - Shipped feature flags

### Consolidate Duplication

1. **Extract common functionality** to utilities
2. **Merge similar functions**
3. **Unify error handling patterns**
4. **Remove duplicate imports**

### File Organization

1. **Remove empty files and directories**
2. **Organize imports** (grouped and sorted)
3. **Fix circular dependencies**

## Development Artifacts Cleanup

### Temporary Files
- `*.log`, `*.tmp`, `*~` files
- `.cache` directories (if safe)
- Debug/session files

### Build Artifacts
- `dist/`, `build/` (if rebuilding)
- `node_modules/.cache`
- Compiled output not in .gitignore

### Safety Checks
1. **Verify with `git status`** what's tracked vs untracked
2. **Check file age** - older files are safer to remove
3. **Confirm no active processes** using these files

### Protected Directories
`.claude`, `.git`, `node_modules`, `vendor`

## Git Branch Cleanup

### Local Cleanup
```bash
git fetch --prune
git branch --merged | grep -v "\*\|main\|master" | xargs -n 1 git branch -d
```

### Remote Cleanup
```bash
git branch -r --merged origin/main
# Confirm before deleting:
git push origin --delete <branch-name>
```

## Context Optimization

### Memory Bank Analysis

```bash
# Get comprehensive file size analysis
find . -name "CLAUDE-*.md" -exec wc -c {} \; | sort -nr
wc -c CLAUDE.md README.md
```

### Optimization Targets

#### High-Impact (prioritize first)
- Files >20KB that contain duplicate information
- Files explicitly marked as obsolete/removed
- Generated content that's no longer current
- Verbose documentation that could be streamlined

#### Medium-Impact
- Files 10-20KB with overlapping content
- Historic documentation for resolved issues
- Detailed implementation docs that could be consolidated

### Optimization Strategy

1. **Remove Obsolete Content**
   - Delete files marked as "REMOVED" or "DEPRECATED"
   - Remove generated reviews/reports that are outdated
   - Clean up empty or minimal temporary files
   - Update CLAUDE.md references to removed files

2. **Consolidate Overlapping Documentation**
   - Security: Combine security-fixes, security-optimization, security-hardening
   - Performance: Merge performance-optimization and test-suite documentation
   - Architecture: Consolidate detailed architecture descriptions
   - Testing: Combine multiple test documentation files

3. **Streamline CLAUDE.md**
   - Replace detailed descriptions with concise summaries
   - Remove redundant architecture explanations
   - Focus on essential guidance and references
   - Eliminate duplicate setup instructions

## Comment Cleanup

### Comments to Remove
- Simply restate what code does
- Add no value beyond code itself
- State obvious (like "constructor" above a constructor)
- Duplicate adjacent comments

### Comments to Preserve
- Explain WHY something is done
- Document complex business logic
- Contain TODOs, FIXMEs, or HACKs
- Warn about non-obvious behavior
- Provide important context

## Safety Measures

1. **Create git checkpoint** before cleanup
2. **Run tests** after each change type
3. **Keep refactoring commits** separate
4. **Document why code was removed**

## Output

- Summary by category
- Lines/files removed
- Risk assessment
- Follow-up tasks

## Mode Execution

### Code Mode (`clean code` or `clean`)
```bash
# Find and remove technical debt
ruff check --select F401,F841  # unused imports/vars
# Fix linting issues and apply formatting
ruff format .
# Remove dead code
find . -name "*.py" -exec grep -l "DEPRECATED\|OBSOLETE" {} \; | xargs rm
```

### Artifacts Mode (`clean artifacts`)
```bash
# Remove temporary and build artifacts
find . -name "*.log" -delete
find . -name "*.tmp" -delete
find . -name "*~" -delete
rm -rf dist/ build/ node_modules/.cache
```

### Branches Mode (`clean branches`)
```bash
# Clean merged branches
git fetch --prune
git branch --merged | grep -v "\*\|main\|master" | xargs -n 1 git branch -d
```

### Context Mode (`clean context`)
```bash
# Analyze and optimize context files
find . -name "CLAUDE-*.md" -exec wc -c {} \; | sort -nr
# Remove obsolete content
find . -name "CLAUDE-*.md" -exec grep -l "REMOVED\|DEPRECATED" {} \; | xargs rm
```

### Comments Mode (`clean comments`)
```bash
# Find files with obvious comments
grep -r "TODO\|FIXME\|HACK\|XXX" --include="*.py,*.js,*.ts" .
# Remove redundant comments while preserving value
```

### All Mode (`clean all`)
Executes all cleanup modes in sequence.